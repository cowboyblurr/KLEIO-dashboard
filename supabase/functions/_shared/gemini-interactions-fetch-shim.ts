import "jsr:@supabase/functions-js/edge-runtime.d.ts"

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function cleanText(value: unknown, max = 2_000_000) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max) : ""
}

function structuredSchema(generationConfig: JsonObject) {
  const responseFormat = isObject(generationConfig.responseFormat) ? generationConfig.responseFormat : {}
  const text = isObject(responseFormat.text) ? responseFormat.text : {}
  if (isObject(text.schema)) return text.schema
  return isObject(generationConfig.responseJsonSchema) ? generationConfig.responseJsonSchema : {}
}

function extractInteractionText(payload: JsonObject) {
  const steps = Array.isArray(payload.steps) ? payload.steps.filter(isObject) : []
  const parts = steps
    .filter((step) => step.type === "model_output")
    .flatMap((step) => Array.isArray(step.content) ? step.content.filter(isObject) : [])
  return parts
    .filter((part) => part.type === "text")
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

function modelFromUrl(value: string) {
  const match = value.match(/\/models\/([^/:]+):generateContent(?:\?|$)/)
  return match?.[1] ? decodeURIComponent(match[1]) : ""
}

export function installGeminiInteractionsFetchShim() {
  const nativeFetch = globalThis.fetch.bind(globalThis)
  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
    const model = modelFromUrl(url)
    if (!model || !url.startsWith("https://generativelanguage.googleapis.com/")) return nativeFetch(input, init)

    let requestBody: JsonObject = {}
    try { requestBody = JSON.parse(String(init?.body ?? "{}")) as JsonObject } catch { return nativeFetch(input, init) }
    const generationConfig = isObject(requestBody.generationConfig) ? requestBody.generationConfig : {}
    const schema = structuredSchema(generationConfig)
    const interactionInput: JsonObject[] = []

    const systemInstruction = isObject(requestBody.systemInstruction) ? requestBody.systemInstruction : {}
    const systemParts = Array.isArray(systemInstruction.parts) ? systemInstruction.parts.filter(isObject) : []
    const systemText = systemParts.map((part) => cleanText(part.text, 100_000)).filter(Boolean).join("\n")

    const contents = Array.isArray(requestBody.contents) ? requestBody.contents.filter(isObject) : []
    const textParts: string[] = []
    for (const content of contents) {
      const parts = Array.isArray(content.parts) ? content.parts.filter(isObject) : []
      for (const part of parts) {
        if (isObject(part.inlineData)) {
          const data = cleanText(part.inlineData.data, 30_000_000)
          const mimeType = cleanText(part.inlineData.mimeType, 100)
          if (data && mimeType) interactionInput.push({ type: "document", data, mime_type: mimeType })
        }
        const text = cleanText(part.text, 2_000_000)
        if (text) textParts.push(text)
      }
    }
    const combinedText = [systemText, ...textParts].filter(Boolean).join("\n\n")
    if (combinedText) interactionInput.push({ type: "text", text: combinedText })

    const apiKey = new Headers(init?.headers).get("x-goog-api-key") || ""
    const response = await nativeFetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      signal: init?.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model,
        input: interactionInput,
        response_format: { type: "text", mime_type: "application/json", schema },
        store: false,
      }),
    })
    const payload = await response.json().catch(() => ({})) as JsonObject
    if (!response.ok) {
      return new Response(JSON.stringify(payload), {
        status: response.status,
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
      },
    })
  }
}
