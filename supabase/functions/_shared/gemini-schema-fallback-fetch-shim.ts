import "jsr:@supabase/functions-js/edge-runtime.d.ts"

type JsonObject = Record<string, unknown>

type InteractionCall = {
  response: Response
  payload: JsonObject
  text: string
  usage: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number }
}

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

function combineUsage(...values: InteractionCall[]) {
  return values.reduce((total, value) => ({
    promptTokenCount: total.promptTokenCount + value.usage.promptTokenCount,
    candidatesTokenCount: total.candidatesTokenCount + value.usage.candidatesTokenCount,
    totalTokenCount: total.totalTokenCount + value.usage.totalTokenCount,
  }), { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 })
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

function requestedSchema(requestBody: JsonObject) {
  const generationConfig = isObject(requestBody.generationConfig) ? requestBody.generationConfig : {}
  const responseFormat = isObject(generationConfig.responseFormat) ? generationConfig.responseFormat : {}
  const text = isObject(responseFormat.text) ? responseFormat.text : {}
  if (isObject(text.schema)) return text.schema
  return isObject(generationConfig.responseJsonSchema) ? generationConfig.responseJsonSchema : {}
}

function isDocumentAnalysisRequest(requestBody: JsonObject) {
  const schema = requestedSchema(requestBody)
  const properties = isObject(schema.properties) ? schema.properties : {}
  return ["document_assessment", "sections", "claims", "unresolved_content", "analysis_summary"]
    .every((key) => key in properties)
}

function inputParts(requestBody: JsonObject) {
  const documents: JsonObject[] = []
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
        if (data && mimeType) documents.push({ type: "document", data, mime_type: mimeType })
      }
      const text = cleanText(part.text, 2_000_000)
      if (text) textParts.push(text)
    }
  }
  return { documents, basePrompt: textParts.filter(Boolean).join("\n\n") }
}

const stringArray = { type: "array", items: { type: "string" } }
const integerArray = { type: "array", items: { type: "integer" } }

function assessmentSchema(): JsonObject {
  return {
    type: "object",
    properties: {
      document_assessment: {
        type: "object",
        properties: {
          document_type: { type: "string" },
          secondary_types: stringArray,
          languages: stringArray,
          total_pages: { type: "integer" },
          pages_analyzed: integerArray,
          unreadable_pages: integerArray,
          text_quality: { type: "string", enum: ["native_text", "partial_text", "scanned", "mixed", "unknown"] },
          layout_complexity: { type: "string", enum: ["simple", "moderate", "complex"] },
          column_structure: { type: "string", enum: ["single", "multi", "mixed", "unknown"] },
          contains_tables: { type: "boolean" },
          contains_artwork_images: { type: "boolean" },
          contains_scanned_pages: { type: "boolean" },
          analysis_limitations: stringArray,
        },
        required: ["document_type", "secondary_types", "languages", "total_pages", "pages_analyzed", "unreadable_pages", "text_quality", "layout_complexity", "column_structure", "contains_tables", "contains_artwork_images", "contains_scanned_pages", "analysis_limitations"],
      },
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            section_type: { type: "string" },
            source_heading: { type: "string" },
            start_page: { type: "integer" },
            end_page: { type: "integer" },
            confidence: { type: "number" },
          },
          required: ["section_type", "source_heading", "start_page", "end_page", "confidence"],
        },
      },
      analysis_summary: {
        type: "object",
        properties: {
          document_synopsis: { type: "string" },
          relevance: { type: "string", enum: ["highly_relevant", "partially_relevant", "not_relevant", "requires_artist_review"] },
          relevance_explanation: { type: "string" },
          extractable_categories: stringArray,
          recommended_use: stringArray,
          what_was_found: stringArray,
          what_was_not_found: stringArray,
          what_needs_review: stringArray,
          coverage_level: { type: "string" },
          coverage_explanation: { type: "string" },
        },
        required: ["document_synopsis", "relevance", "relevance_explanation", "extractable_categories", "recommended_use", "what_was_found", "what_was_not_found", "what_needs_review", "coverage_level", "coverage_explanation"],
      },
    },
    required: ["document_assessment", "sections", "analysis_summary"],
  }
}

function claimsSchema(): JsonObject {
  const claim = {
    type: "object",
    properties: {
      claim_type: { type: "string" },
      target_field: { type: "string" },
      target_section: { type: "string" },
      display_value: { type: "string" },
      page_number: { type: "integer" },
      page_range: integerArray,
      evidence_excerpt: { type: "string" },
      evidence_mode: { type: "string", enum: ["native_text", "visual_transcription", "table_interpretation", "image_caption_relationship", "artist_authored_narrative"] },
      confidence: { type: "number" },
      information_layer: { type: "string", enum: ["factual", "artist_authored", "interpretive", "unknown"] },
      sensitivity: { type: "string", enum: ["standard", "sensitive", "highly_sensitive"] },
      incomplete: { type: "boolean" },
      uncertainty_note: { type: "string" },
      source_section: { type: "string" },
    },
    required: ["claim_type", "target_field", "target_section", "display_value", "page_number", "page_range", "evidence_excerpt", "evidence_mode", "confidence", "information_layer", "sensitivity", "incomplete", "uncertainty_note", "source_section"],
  }
  return {
    type: "object",
    properties: {
      claims: { type: "array", items: claim },
      unresolved_content: {
        type: "array",
        items: {
          type: "object",
          properties: {
            page_number: { type: "integer" },
            issue: { type: "string" },
            possible_meanings: stringArray,
            recommended_artist_action: { type: "string" },
          },
          required: ["page_number", "issue", "possible_meanings", "recommended_artist_action"],
        },
      },
    },
    required: ["claims", "unresolved_content"],
  }
}

async function callInteraction(
  delegatedFetch: typeof fetch,
  input: { apiKey: string; model: string; parts: JsonObject[]; schema?: JsonObject; signal?: AbortSignal },
): Promise<InteractionCall> {
  const responseFormat: JsonObject = { type: "text", mime_type: "application/json" }
  if (input.schema) responseFormat.schema = input.schema
  const response = await delegatedFetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    signal: input.signal,
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": input.apiKey,
      "Api-Revision": "2026-05-20",
    },
    body: JSON.stringify({ model: input.model, input: input.parts, response_format: responseFormat, store: false }),
  })
  const payload = await response.json().catch(() => ({})) as JsonObject
  return { response, payload, text: extractInteractionText(payload), usage: usageMetadata(payload) }
}

function providerResponse(call: InteractionCall) {
  return new Response(JSON.stringify(call.payload), {
    status: call.response.status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  })
}

function legacyResponse(text: string, usage: ReturnType<typeof usageMetadata>, requestId = "") {
  return new Response(JSON.stringify({
    candidates: [{ content: { role: "model", parts: [{ text }] }, finishReason: "STOP" }],
    usageMetadata: usage,
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "x-goog-request-id": requestId,
      "x-kleio-gemini-schema-fallback": "1",
    },
  })
}

function parseJson(text: string) {
  try {
    const value = JSON.parse(text)
    return isObject(value) ? value : null
  } catch {
    return null
  }
}

function genericJsonPrompt(requestBody: JsonObject) {
  const { documents, basePrompt } = inputParts(requestBody)
  return [...documents, {
    type: "text",
    text: `${basePrompt}\n\nReturn exactly one syntactically valid JSON object matching the requested contract. Do not add markdown, commentary, or unsupported facts.`,
  }]
}

async function runDocumentTwoPass(
  delegatedFetch: typeof fetch,
  requestBody: JsonObject,
  input: { apiKey: string; model: string; signal?: AbortSignal },
) {
  const { documents, basePrompt } = inputParts(requestBody)
  const stageOne = await callInteraction(delegatedFetch, {
    ...input,
    schema: assessmentSchema(),
    parts: [...documents, {
      type: "text",
      text: `${basePrompt}\n\nSTAGE 1 — DOCUMENT UNDERSTANDING ONLY. Identify the actual document, summarize it, assess KLEIO relevance, map its sections and report coverage. Do not extract individual Passport claims in this stage. Return only the requested JSON.`,
    }],
  })
  if (!stageOne.response.ok) return providerResponse(stageOne)
  const assessment = parseJson(stageOne.text)
  if (!assessment || !isObject(assessment.document_assessment) || !Array.isArray(assessment.sections) || !isObject(assessment.analysis_summary)) {
    return legacyResponse(stageOne.text, stageOne.usage, cleanText(stageOne.payload.id, 200))
  }

  const stageContext = JSON.stringify({
    document_assessment: assessment.document_assessment,
    sections: assessment.sections,
    relevance: (assessment.analysis_summary as JsonObject).relevance,
  }).slice(0, 30_000)
  const stageTwo = await callInteraction(delegatedFetch, {
    ...input,
    schema: claimsSchema(),
    parts: [...documents, {
      type: "text",
      text: `${basePrompt}\n\nSTAGE 2 — PAGE-SUPPORTED INFORMATION ONLY. Use this validated document map as context:\n${stageContext}\n\nExtract individual Creative Passport or application-support claims only when the PDF directly supports them. Every claim requires a valid page number and concise evidence excerpt. Use page_number 1 only when page attribution is genuinely page 1; never use it as a placeholder. Return empty claims when the document is not relevant. Return only the requested JSON.`,
    }],
  })
  if (!stageTwo.response.ok) return providerResponse(stageTwo)
  const extracted = parseJson(stageTwo.text)
  if (!extracted || !Array.isArray(extracted.claims) || !Array.isArray(extracted.unresolved_content)) {
    return legacyResponse(stageTwo.text, combineUsage(stageOne, stageTwo), cleanText(stageTwo.payload.id, 200))
  }

  const categories = Array.isArray((assessment.analysis_summary as JsonObject).extractable_categories)
    ? ((assessment.analysis_summary as JsonObject).extractable_categories as unknown[])
        .map((value) => cleanText(value, 200))
        .filter(Boolean)
    : []
  const claims = extracted.claims.filter(isObject).map((claim) => ({
    ...claim,
    normalized_pairs: [],
    requires_artist_review: true,
  }))
  const analysisSummary = assessment.analysis_summary as JsonObject
  const combined = {
    document_assessment: assessment.document_assessment,
    sections: assessment.sections,
    claims,
    unresolved_content: extracted.unresolved_content,
    analysis_summary: {
      document_synopsis: cleanText(analysisSummary.document_synopsis, 2_000),
      relevance: cleanText(analysisSummary.relevance, 100) || "requires_artist_review",
      relevance_explanation: cleanText(analysisSummary.relevance_explanation, 2_000),
      extractable_information: categories.map((category) => ({
        category,
        approximate_items: claims.filter((claim) => cleanText(claim.target_section, 200).includes(category.toLowerCase().replace(/[^a-z0-9]+/g, "_"))).length,
        confidence: 0.7,
        passport_or_application_use: "Review the page-supported proposals in this category before adding them to KLEIO.",
      })),
      recommended_use: Array.isArray(analysisSummary.recommended_use) ? analysisSummary.recommended_use : [],
      what_was_found: Array.isArray(analysisSummary.what_was_found) ? analysisSummary.what_was_found : [],
      what_was_not_found: Array.isArray(analysisSummary.what_was_not_found) ? analysisSummary.what_was_not_found : [],
      what_needs_review: Array.isArray(analysisSummary.what_needs_review) ? analysisSummary.what_needs_review : [],
      coverage_level: cleanText(analysisSummary.coverage_level, 100),
      coverage_explanation: cleanText(analysisSummary.coverage_explanation, 2_000),
    },
  }
  return legacyResponse(JSON.stringify(combined), combineUsage(stageOne, stageTwo), cleanText(stageTwo.payload.id, 200))
}

/**
 * Gemini can reject very large or deeply nested response schemas even when they
 * use supported JSON Schema keywords. KLEIO first attempts the strict schema.
 * When Google explicitly rejects the full document schema, KLEIO performs two
 * smaller schema-constrained passes and then runs the existing semantic validator
 * over their combined result. Other JSON workflows receive a JSON-only retry.
 */
export function installGeminiSchemaFallbackFetchShim() {
  const delegatedFetch = globalThis.fetch.bind(globalThis)

  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
    const model = modelFromUrl(url)
    if (!model || !url.startsWith("https://generativelanguage.googleapis.com/")) return delegatedFetch(input, init)

    const first = await delegatedFetch(input, init)
    if (first.ok) return first
    const firstPayload = await first.clone().json().catch(() => ({})) as JsonObject
    if (!isSchemaRejection(first, firstPayload)) return first

    let requestBody: JsonObject = {}
    try { requestBody = JSON.parse(String(init?.body ?? "{}")) as JsonObject } catch { return first }
    const apiKey = new Headers(init?.headers).get("x-goog-api-key") || ""

    if (isDocumentAnalysisRequest(requestBody)) {
      return runDocumentTwoPass(delegatedFetch, requestBody, { apiKey, model, signal: init?.signal })
    }

    const retry = await callInteraction(delegatedFetch, {
      apiKey,
      model,
      signal: init?.signal,
      parts: genericJsonPrompt(requestBody),
    })
    if (!retry.response.ok) return providerResponse(retry)
    return legacyResponse(retry.text, retry.usage, cleanText(retry.payload.id, 200))
  }
}
