import "jsr:@supabase/functions-js/edge-runtime.d.ts"

type JsonObject = Record<string, unknown>

type InteractionResult = {
  response: Response
  payload: JsonObject
  text: string
  usage: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number }
}

function object(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function text(value: unknown, max = 2_000_000) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max) : ""
}

function modelFromUrl(value: string) {
  const match = value.match(/\/models\/([^/:]+):generateContent(?:\?|$)/)
  return match?.[1] ? decodeURIComponent(match[1]) : ""
}

function providerText(payload: JsonObject) {
  const direct = text(payload.output_text)
  if (direct) return direct
  const steps = Array.isArray(payload.steps) ? payload.steps.filter(object) : []
  const fromSteps = steps
    .filter((step) => step.type === "model_output")
    .flatMap((step) => Array.isArray(step.content) ? step.content.filter(object) : [])
    .filter((part) => part.type === "text")
    .map((part) => text(part.text))
    .filter(Boolean)
    .join("")
  if (fromSteps) return fromSteps
  const outputs = Array.isArray(payload.output) ? payload.output.filter(object) : []
  return outputs
    .flatMap((output) => Array.isArray(output.content) ? output.content.filter(object) : [])
    .filter((part) => part.type === "text" || part.type === "output_text")
    .map((part) => text(part.text))
    .filter(Boolean)
    .join("")
}

function usage(payload: JsonObject) {
  const value = object(payload.usage) ? payload.usage : {}
  const input = Number(value.input_tokens ?? value.inputTokenCount ?? value.prompt_token_count ?? 0)
  const output = Number(value.output_tokens ?? value.outputTokenCount ?? value.candidates_token_count ?? 0)
  const total = Number(value.total_tokens ?? value.totalTokenCount ?? value.total_token_count ?? 0)
  return {
    promptTokenCount: Number.isFinite(input) ? input : 0,
    candidatesTokenCount: Number.isFinite(output) ? output : 0,
    totalTokenCount: Number.isFinite(total) && total > 0 ? total : Math.max(0, input + output),
  }
}

function combinedUsage(...results: InteractionResult[]) {
  return results.reduce((sum, result) => ({
    promptTokenCount: sum.promptTokenCount + result.usage.promptTokenCount,
    candidatesTokenCount: sum.candidatesTokenCount + result.usage.candidatesTokenCount,
    totalTokenCount: sum.totalTokenCount + result.usage.totalTokenCount,
  }), { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 })
}

function requestParts(body: JsonObject) {
  const documents: JsonObject[] = []
  const prompts: string[] = []
  const system = object(body.systemInstruction) ? body.systemInstruction : {}
  const systemParts = Array.isArray(system.parts) ? system.parts.filter(object) : []
  const systemText = systemParts.map((part) => text(part.text, 120_000)).filter(Boolean).join("\n")
  if (systemText) prompts.push(systemText)
  const contents = Array.isArray(body.contents) ? body.contents.filter(object) : []
  for (const content of contents) {
    const parts = Array.isArray(content.parts) ? content.parts.filter(object) : []
    for (const part of parts) {
      if (object(part.inlineData)) {
        const data = text(part.inlineData.data, 30_000_000)
        const mimeType = text(part.inlineData.mimeType, 100)
        if (data && mimeType) documents.push({ type: "document", data, mime_type: mimeType })
      }
      const prompt = text(part.text)
      if (prompt) prompts.push(prompt)
    }
  }
  return { documents, prompt: prompts.join("\n\n") }
}

function isKleioDocumentRequest(body: JsonObject) {
  const parts = requestParts(body)
  return parts.documents.some((item) => item.mime_type === "application/pdf")
    && (parts.prompt.includes("Analyze this private artist PDF for KLEIO")
      || parts.prompt.includes("multimodal document-understanding engine for KLEIO"))
}

const strings = { type: "array", items: { type: "string" } }
const integers = { type: "array", items: { type: "integer" } }

function assessmentSchema(): JsonObject {
  return {
    type: "object",
    properties: {
      document_assessment: {
        type: "object",
        properties: {
          document_type: { type: "string" }, secondary_types: strings, languages: strings,
          total_pages: { type: "integer" }, pages_analyzed: integers, unreadable_pages: integers,
          text_quality: { type: "string", enum: ["native_text", "partial_text", "scanned", "mixed", "unknown"] },
          layout_complexity: { type: "string", enum: ["simple", "moderate", "complex"] },
          column_structure: { type: "string", enum: ["single", "multi", "mixed", "unknown"] },
          contains_tables: { type: "boolean" }, contains_artwork_images: { type: "boolean" }, contains_scanned_pages: { type: "boolean" },
          analysis_limitations: strings,
        },
        required: ["document_type", "secondary_types", "languages", "total_pages", "pages_analyzed", "unreadable_pages", "text_quality", "layout_complexity", "column_structure", "contains_tables", "contains_artwork_images", "contains_scanned_pages", "analysis_limitations"],
      },
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: { section_type: { type: "string" }, source_heading: { type: "string" }, start_page: { type: "integer" }, end_page: { type: "integer" }, confidence: { type: "number" } },
          required: ["section_type", "source_heading", "start_page", "end_page", "confidence"],
        },
      },
      analysis_summary: {
        type: "object",
        properties: {
          document_synopsis: { type: "string" },
          relevance: { type: "string", enum: ["highly_relevant", "partially_relevant", "not_relevant", "requires_artist_review"] },
          relevance_explanation: { type: "string" }, extractable_categories: strings, recommended_use: strings,
          what_was_found: strings, what_was_not_found: strings, what_needs_review: strings,
          coverage_level: { type: "string" }, coverage_explanation: { type: "string" },
        },
        required: ["document_synopsis", "relevance", "relevance_explanation", "extractable_categories", "recommended_use", "what_was_found", "what_was_not_found", "what_needs_review", "coverage_level", "coverage_explanation"],
      },
    },
    required: ["document_assessment", "sections", "analysis_summary"],
  }
}

function claimsSchema(): JsonObject {
  return {
    type: "object",
    properties: {
      claims: {
        type: "array",
        items: {
          type: "object",
          properties: {
            claim_type: { type: "string" }, target_field: { type: "string" }, target_section: { type: "string" }, display_value: { type: "string" },
            page_number: { type: "integer" }, page_range: integers, evidence_excerpt: { type: "string" },
            evidence_mode: { type: "string", enum: ["native_text", "visual_transcription", "table_interpretation", "image_caption_relationship", "artist_authored_narrative"] },
            confidence: { type: "number" }, information_layer: { type: "string", enum: ["factual", "artist_authored", "interpretive", "unknown"] },
            sensitivity: { type: "string", enum: ["standard", "sensitive", "highly_sensitive"] }, incomplete: { type: "boolean" }, uncertainty_note: { type: "string" }, source_section: { type: "string" },
          },
          required: ["claim_type", "target_field", "target_section", "display_value", "page_number", "page_range", "evidence_excerpt", "evidence_mode", "confidence", "information_layer", "sensitivity", "incomplete", "uncertainty_note", "source_section"],
        },
      },
      unresolved_content: {
        type: "array",
        items: {
          type: "object",
          properties: { page_number: { type: "integer" }, issue: { type: "string" }, possible_meanings: strings, recommended_artist_action: { type: "string" } },
          required: ["page_number", "issue", "possible_meanings", "recommended_artist_action"],
        },
      },
    },
    required: ["claims", "unresolved_content"],
  }
}

function schemaExample(schema: unknown, depth = 0): unknown {
  if (!object(schema) || depth > 7) return ""
  const declared = Array.isArray(schema.type) ? schema.type.find((item) => item !== "null") : schema.type
  const kind = text(declared, 30)
  if (kind === "object" || object(schema.properties)) {
    const output: JsonObject = {}
    const properties = object(schema.properties) ? schema.properties : {}
    for (const [key, value] of Object.entries(properties)) output[key] = schemaExample(value, depth + 1)
    return output
  }
  if (kind === "array") return [schemaExample(schema.items, depth + 1)]
  if (kind === "boolean") return false
  if (kind === "integer" || kind === "number") return 0
  return Array.isArray(schema.enum) && schema.enum.length ? schema.enum[0] : ""
}

async function call(
  delegatedFetch: typeof fetch,
  input: { apiKey: string; model: string; parts: JsonObject[]; schema: JsonObject; signal?: AbortSignal },
): Promise<InteractionResult> {
  const perform = async (schema: JsonObject | null, parts: JsonObject[]) => {
    const format: JsonObject = { type: "text", mime_type: "application/json" }
    if (schema) format.schema = schema
    const response = await delegatedFetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST", signal: input.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": input.apiKey, "Api-Revision": "2026-05-20" },
      body: JSON.stringify({ model: input.model, input: parts, response_format: format, store: false }),
    })
    const payload = await response.json().catch(() => ({})) as JsonObject
    return { response, payload, text: providerText(payload), usage: usage(payload) }
  }

  const strict = await perform(input.schema, input.parts)
  if (strict.response.ok) return strict
  const error = object(strict.payload.error) ? strict.payload.error : {}
  const message = text(error.message, 2_000).toLowerCase()
  if (strict.response.status !== 400 || (!message.includes("schema") && !message.includes("invalid argument"))) return strict

  const contract = JSON.stringify(schemaExample(input.schema)).slice(0, 40_000)
  return perform(null, [...input.parts, { type: "text", text: `The provider could not accept the response schema. Return one JSON object using this exact shape and every shown key. Use empty arrays or strings rather than renaming or omitting keys:\n${contract}` }])
}

function parse(value: string) {
  try {
    const result = JSON.parse(value)
    return object(result) ? result : null
  } catch {
    return null
  }
}

function legacy(textValue: string, usageValue: ReturnType<typeof usage>, requestId = "") {
  return new Response(JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text: textValue }] }, finishReason: "STOP" }], usageMetadata: usageValue }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "x-goog-request-id": requestId, "x-kleio-gemini-document-two-pass": "1" },
  })
}

function providerFailure(result: InteractionResult) {
  return new Response(JSON.stringify(result.payload), { status: result.response.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } })
}

export function installGeminiDocumentTwoPassFetchShim() {
  const delegatedFetch = globalThis.fetch.bind(globalThis)

  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
    const model = modelFromUrl(url)
    if (!model || !url.startsWith("https://generativelanguage.googleapis.com/")) return delegatedFetch(input, init)

    let body: JsonObject = {}
    try { body = JSON.parse(String(init?.body ?? "{}")) as JsonObject } catch { return delegatedFetch(input, init) }
    if (!isKleioDocumentRequest(body)) return delegatedFetch(input, init)

    const apiKey = new Headers(init?.headers).get("x-goog-api-key") || ""
    const source = requestParts(body)
    const stageOne = await call(delegatedFetch, {
      apiKey, model, signal: init?.signal, schema: assessmentSchema(),
      parts: [...source.documents, { type: "text", text: `${source.prompt}\n\nSTAGE 1 — DOCUMENT IDENTITY, SYNOPSIS, RELEVANCE AND STRUCTURE ONLY. Perceive every PDF page. Do not extract individual Passport claims yet. Return only the requested JSON.` }],
    })
    if (!stageOne.response.ok) return providerFailure(stageOne)
    const assessment = parse(stageOne.text)
    if (!assessment || !object(assessment.document_assessment) || !Array.isArray(assessment.sections) || !object(assessment.analysis_summary)) return legacy(stageOne.text, stageOne.usage, text(stageOne.payload.id, 200))

    const stageMap = JSON.stringify({ document_assessment: assessment.document_assessment, sections: assessment.sections, relevance: (assessment.analysis_summary as JsonObject).relevance }).slice(0, 30_000)
    const stageTwo = await call(delegatedFetch, {
      apiKey, model, signal: init?.signal, schema: claimsSchema(),
      parts: [...source.documents, { type: "text", text: `${source.prompt}\n\nSTAGE 2 — PAGE-SUPPORTED INFORMATION ONLY. Use this document map:\n${stageMap}\n\nExtract individual Creative Passport or application-support claims only when the PDF directly supports them. Every claim needs a truthful page number and concise evidence excerpt. Return empty claims when the document is not relevant. Return only the requested JSON.` }],
    })
    if (!stageTwo.response.ok) return providerFailure(stageTwo)
    const extracted = parse(stageTwo.text)
    if (!extracted || !Array.isArray(extracted.claims) || !Array.isArray(extracted.unresolved_content)) return legacy(stageTwo.text, combinedUsage(stageOne, stageTwo), text(stageTwo.payload.id, 200))

    const summary = assessment.analysis_summary as JsonObject
    const claims = extracted.claims.filter(object).map((claim) => ({ ...claim, normalized_pairs: [], requires_artist_review: true }))
    const categories = Array.isArray(summary.extractable_categories) ? summary.extractable_categories.map((item) => text(item, 200)).filter(Boolean) : []
    const combined = {
      document_assessment: assessment.document_assessment,
      sections: assessment.sections,
      claims,
      unresolved_content: extracted.unresolved_content,
      analysis_summary: {
        document_synopsis: text(summary.document_synopsis, 2_000), relevance: text(summary.relevance, 100) || "requires_artist_review",
        relevance_explanation: text(summary.relevance_explanation, 2_000),
        extractable_information: categories.map((category) => ({ category, approximate_items: 0, confidence: 0.7, passport_or_application_use: "Review page-supported proposals before adding them to KLEIO." })),
        recommended_use: Array.isArray(summary.recommended_use) ? summary.recommended_use : [],
        what_was_found: Array.isArray(summary.what_was_found) ? summary.what_was_found : [],
        what_was_not_found: Array.isArray(summary.what_was_not_found) ? summary.what_was_not_found : [],
        what_needs_review: Array.isArray(summary.what_needs_review) ? summary.what_needs_review : [],
        coverage_level: text(summary.coverage_level, 100), coverage_explanation: text(summary.coverage_explanation, 2_000),
      },
    }
    return legacy(JSON.stringify(combined), combinedUsage(stageOne, stageTwo), text(stageTwo.payload.id, 200))
  }
}
