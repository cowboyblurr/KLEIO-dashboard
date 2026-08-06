import "jsr:@supabase/functions-js/edge-runtime.d.ts"

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function cleanText(value: unknown, max = 2_000_000) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max)
    : ""
}

function modelFromUrl(value: string) {
  const match = value.match(/\/models\/([^/:]+):generateContent(?:\?|$)/)
  return match?.[1] ? decodeURIComponent(match[1]) : ""
}

function extractInteractionText(payload: JsonObject) {
  const direct = cleanText(payload.output_text)
  if (direct) return direct

  const steps = Array.isArray(payload.steps) ? payload.steps.filter(isObject) : []
  const stepText = steps
    .filter((step) => step.type === "model_output")
    .flatMap((step) => Array.isArray(step.content) ? step.content.filter(isObject) : [])
    .filter((part) => part.type === "text")
    .map((part) => cleanText(part.text))
    .filter(Boolean)
    .join("")
  if (stepText) return stepText

  const outputs = Array.isArray(payload.output) ? payload.output.filter(isObject) : []
  return outputs
    .flatMap((output) => Array.isArray(output.content) ? output.content.filter(isObject) : [])
    .filter((part) => part.type === "text" || part.type === "output_text")
    .map((part) => cleanText(part.text))
    .filter(Boolean)
    .join("")
}

function usageMetadata(payload: JsonObject) {
  const usage = isObject(payload.usage) ? payload.usage : {}
  const input = Number(usage.input_tokens ?? usage.inputTokenCount ?? usage.prompt_token_count ?? 0)
  const output = Number(usage.output_tokens ?? usage.outputTokenCount ?? usage.candidates_token_count ?? 0)
  const total = Number(usage.total_tokens ?? usage.totalTokenCount ?? usage.total_token_count ?? 0)
  return {
    promptTokenCount: Number.isFinite(input) ? input : 0,
    candidatesTokenCount: Number.isFinite(output) ? output : 0,
    totalTokenCount: Number.isFinite(total) && total > 0 ? total : Math.max(0, input + output),
  }
}

function isSchemaRejection(response: Response, payload: JsonObject) {
  if (response.status !== 400 && response.status !== 422) return false
  const error = isObject(payload.error) ? payload.error : {}
  const message = cleanText(error.message, 2_000).toLowerCase()
  const status = cleanText(error.status, 200).toLowerCase()
  return message.includes("schema")
    || message.includes("response_format")
    || message.includes("response format")
    || message.includes("too complex")
    || (status.includes("invalid_argument") && message.includes("argument"))
}

function interactionInput(requestBody: JsonObject) {
  const result: JsonObject[] = []
  const textParts: string[] = []

  const systemInstruction = isObject(requestBody.systemInstruction) ? requestBody.systemInstruction : {}
  const systemParts = Array.isArray(systemInstruction.parts) ? systemInstruction.parts.filter(isObject) : []
  const systemText = systemParts.map((part) => cleanText(part.text, 120_000)).filter(Boolean).join("\n")
  if (systemText) textParts.push(systemText)

  const contents = Array.isArray(requestBody.contents) ? requestBody.contents.filter(isObject) : []
  for (const content of contents) {
    const parts = Array.isArray(content.parts) ? content.parts.filter(isObject) : []
    for (const part of parts) {
      if (isObject(part.inlineData)) {
        const data = cleanText(part.inlineData.data, 30_000_000)
        const mimeType = cleanText(part.inlineData.mimeType, 100)
        if (data && mimeType) result.push({ type: "document", data, mime_type: mimeType })
      }
      const text = cleanText(part.text, 2_000_000)
      if (text) textParts.push(text)
    }
  }

  const combined = textParts.filter(Boolean).join("\n\n")
  if (combined) {
    result.push({
      type: "text",
      text: `${combined}\n\nReturn exactly one syntactically valid JSON object matching the requested KLEIO contract. Do not add markdown, commentary, or unsupported fields.`,
    })
  }
  return result
}

/**
 * Gemini can reject very large or deeply nested response schemas even when they
 * use supported JSON Schema keywords. KLEIO first attempts the strict schema
 * through the normal Interactions shim. Only when Google explicitly rejects the
 * schema, this adapter retries the same private request as JSON-only output and
 * leaves KLEIO's existing semantic validator as the final authority.
 */
export function installGeminiSchemaFallbackFetchShim() {
  const delegatedFetch = globalThis.fetch.bind(globalThis)

  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
    const model = modelFromUrl(url)
    if (!model || !url.startsWith("https://generativelanguage.googleapis.com/")) {
      return delegatedFetch(input, init)
    }

    const first = await delegatedFetch(input, init)
    if (first.ok) return first

    const firstPayload = await first.clone().json().catch(() => ({})) as JsonObject
    if (!isSchemaRejection(first, firstPayload)) return first

    let requestBody: JsonObject = {}
    try {
      requestBody = JSON.parse(String(init?.body ?? "{}")) as JsonObject
    } catch {
      return first
    }

    const apiKey = new Headers(init?.headers).get("x-goog-api-key") || ""
    const retry = await delegatedFetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      signal: init?.signal,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
        "Api-Revision": "2026-05-20",
      },
      body: JSON.stringify({
        model,
        input: interactionInput(requestBody),
        response_format: { type: "text", mime_type: "application/json" },
        store: false,
      }),
    })

    const payload = await retry.json().catch(() => ({})) as JsonObject
    if (!retry.ok) {
      return new Response(JSON.stringify(payload), {
        status: retry.status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      })
    }

    const text = extractInteractionText(payload)
    return new Response(JSON.stringify({
      candidates: [{ content: { role: "model", parts: [{ text }] }, finishReason: "STOP" }],
      usageMetadata: usageMetadata(payload),
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "x-goog-request-id": cleanText(payload.id, 200),
        "x-kleio-gemini-schema-fallback": "1",
      },
    })
  }
}
