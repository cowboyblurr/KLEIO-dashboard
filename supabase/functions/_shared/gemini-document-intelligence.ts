import "jsr:@supabase/functions-js/edge-runtime.d.ts"

export const GEMINI_PROVIDER = "gemini"
export const DOCUMENT_PROMPT_VERSION = "kleio_gemini_document_v2"
export const DOCUMENT_SCHEMA_VERSION = "document_analysis_v2"
export const DRAFT_PROMPT_VERSION = "kleio_gemini_drafting_v2"
export const DEFAULT_DOCUMENT_MODEL = "gemini-3.6-flash"
export const DEFAULT_DOCUMENT_PRO_MODEL = "gemini-2.5-pro"
export const DEFAULT_DRAFT_MODEL = "gemini-3.6-flash"

export type JsonObject = Record<string, unknown>
export type DocumentQuality = "complete_review_ready" | "substantial_review_ready" | "limited_analysis" | "classification_required" | "visual_reading_limited" | "provider_unavailable" | "failed"
export type EvidenceMode = "native_text" | "visual_transcription" | "table_interpretation" | "image_caption_relationship" | "artist_authored_narrative"

export type GeminiDocumentClaim = {
  claim_type: string
  target_field: string
  target_section: string
  display_value: string
  normalized_pairs: Array<{ key: string; value: string }>
  page_number: number | null
  page_range: number[]
  evidence_excerpt: string
  evidence_mode: EvidenceMode
  confidence: number
  information_layer: "factual" | "artist_authored" | "interpretive" | "unknown"
  sensitivity: "standard" | "sensitive" | "highly_sensitive"
  requires_artist_review: boolean
  incomplete: boolean
  uncertainty_note: string
  source_section: string
}

export type GeminiDocumentAnalysis = {
  document_assessment: {
    document_type: string
    secondary_types: string[]
    languages: string[]
    total_pages: number
    pages_analyzed: number[]
    unreadable_pages: number[]
    text_quality: "native_text" | "partial_text" | "scanned" | "mixed" | "unknown"
    layout_complexity: "simple" | "moderate" | "complex"
    column_structure: "single" | "multi" | "mixed" | "unknown"
    contains_tables: boolean
    contains_artwork_images: boolean
    contains_scanned_pages: boolean
    analysis_limitations: string[]
  }
  sections: Array<{ section_type: string; source_heading: string; start_page: number; end_page: number; confidence: number }>
  claims: GeminiDocumentClaim[]
  unresolved_content: Array<{ page_number: number; issue: string; possible_meanings: string[]; recommended_artist_action: string }>
  analysis_summary: { what_was_found: string[]; what_was_not_found: string[]; what_needs_review: string[]; coverage_level: string; coverage_explanation: string }
}

export type ProviderResult<T> = {
  output: T
  model: string
  provider: "gemini"
  requestId: string
  latencyMs: number
  usage: { input_tokens: number; output_tokens: number; total_tokens: number }
}

type RunGeminiInput = {
  apiKey: string
  model: string
  systemInstruction: string
  prompt: string
  responseSchema: JsonObject
  pdfBytes?: Uint8Array
  timeoutMs?: number
  maxOutputTokens?: number
}

function object(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function cleanText(value: unknown, max = 20_000) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : ""
}

export function safeModel(value: unknown, fallback: string) {
  const model = cleanText(value, 100)
  return /^[a-z0-9][a-z0-9._-]{2,99}$/i.test(model) ? model : fallback
}

export async function sha256(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

function base64(bytes: Uint8Array) {
  const chunk = 0x8000
  let binary = ""
  for (let index = 0; index < bytes.length; index += chunk) binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunk, bytes.length)))
  return btoa(binary)
}

function supportedJsonSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(supportedJsonSchema)
  if (!object(value)) return value
  const supported = new Set(["$id", "$defs", "$ref", "$anchor", "type", "format", "title", "description", "enum", "items", "prefixItems", "minItems", "maxItems", "minimum", "maximum", "anyOf", "oneOf", "properties", "additionalProperties", "required", "propertyOrdering"])
  const next: JsonObject = {}
  for (const [key, item] of Object.entries(value)) if (supported.has(key)) next[key] = supportedJsonSchema(item)
  return next
}

function parseProviderText(payload: JsonObject) {
  const candidates = Array.isArray(payload.candidates) ? payload.candidates.filter(object) : []
  const first = candidates[0] ?? {}
  const content = object(first.content) ? first.content : {}
  const parts = Array.isArray(content.parts) ? content.parts.filter(object) : []
  return parts.map((part) => cleanText(part.text, 2_000_000)).filter(Boolean).join("")
}

function providerError(status: number, payload: JsonObject) {
  const error = object(payload.error) ? payload.error : {}
  const message = cleanText(error.message, 500).toLowerCase()
  if (status === 401 || status === 403) return "gemini_authentication_failed"
  if (status === 429) return "gemini_rate_limited"
  if (status >= 500) return "gemini_provider_unavailable"
  if (message.includes("schema")) return "gemini_schema_rejected"
  if (message.includes("model")) return "gemini_model_unavailable"
  return "gemini_request_failed"
}

export async function runGeminiStructured<T>(input: RunGeminiInput): Promise<ProviderResult<T>> {
  if (!input.apiKey) throw new Error("gemini_not_configured")
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? 88_000)
  const started = Date.now()
  try {
    const parts: JsonObject[] = []
    if (input.pdfBytes) parts.push({ inlineData: { mimeType: "application/pdf", data: base64(input.pdfBytes) } })
    parts.push({ text: input.prompt })
    const schema = supportedJsonSchema(input.responseSchema)
    const generationConfig = input.model.startsWith("gemini-3")
      ? { responseFormat: { text: { mimeType: "application/json", schema } }, maxOutputTokens: input.maxOutputTokens ?? 32_768 }
      : { responseMimeType: "application/json", responseJsonSchema: schema, maxOutputTokens: input.maxOutputTokens ?? 32_768 }
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.model)}:generateContent`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": input.apiKey },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: input.systemInstruction }] }, contents: [{ role: "user", parts }], generationConfig }),
    })
    const payload = await response.json().catch(() => ({})) as JsonObject
    if (!response.ok) throw new Error(providerError(response.status, payload))
    const text = parseProviderText(payload)
    if (!text) throw new Error("gemini_returned_no_output")
    let output: T
    try { output = JSON.parse(text) as T } catch { throw new Error("gemini_invalid_structured_output") }
    const usage = object(payload.usageMetadata) ? payload.usageMetadata : {}
    return {
      output,
      provider: GEMINI_PROVIDER,
      model: input.model,
      requestId: response.headers.get("x-request-id") || response.headers.get("x-goog-request-id") || "",
      latencyMs: Date.now() - started,
      usage: { input_tokens: Number(usage.promptTokenCount || 0), output_tokens: Number(usage.candidatesTokenCount || 0), total_tokens: Number(usage.totalTokenCount || 0) },
    }
  } catch (reason) {
    if (reason instanceof DOMException && reason.name === "AbortError") throw new Error("gemini_timeout")
    throw reason
  } finally { clearTimeout(timer) }
}

const stringArray = { type: "array", items: { type: "string" }, maxItems: 100 }
const pageArray = { type: "array", items: { type: "integer", minimum: 1 }, maxItems: 100 }

export function documentAnalysisSchema(): JsonObject {
  const pair = { type: "object", additionalProperties: false, required: ["key", "value"], properties: { key: { type: "string" }, value: { type: "string" } } }
  const claim = {
    type: "object", additionalProperties: false,
    required: ["claim_type", "target_field", "target_section", "display_value", "normalized_pairs", "page_number", "page_range", "evidence_excerpt", "evidence_mode", "confidence", "information_layer", "sensitivity", "requires_artist_review", "incomplete", "uncertainty_note", "source_section"],
    properties: {
      claim_type: { type: "string" }, target_field: { type: "string" }, target_section: { type: "string" }, display_value: { type: "string" },
      normalized_pairs: { type: "array", items: pair, maxItems: 30 }, page_number: { type: ["integer", "null"], minimum: 1 }, page_range: pageArray,
      evidence_excerpt: { type: "string" }, evidence_mode: { type: "string", enum: ["native_text", "visual_transcription", "table_interpretation", "image_caption_relationship", "artist_authored_narrative"] },
      confidence: { type: "number", minimum: 0, maximum: 1 }, information_layer: { type: "string", enum: ["factual", "artist_authored", "interpretive", "unknown"] },
      sensitivity: { type: "string", enum: ["standard", "sensitive", "highly_sensitive"] }, requires_artist_review: { type: "boolean" }, incomplete: { type: "boolean" }, uncertainty_note: { type: "string" }, source_section: { type: "string" },
    },
  }
  return {
    type: "object", additionalProperties: false,
    required: ["document_assessment", "sections", "claims", "unresolved_content", "analysis_summary"],
    properties: {
      document_assessment: {
        type: "object", additionalProperties: false,
        required: ["document_type", "secondary_types", "languages", "total_pages", "pages_analyzed", "unreadable_pages", "text_quality", "layout_complexity", "column_structure", "contains_tables", "contains_artwork_images", "contains_scanned_pages", "analysis_limitations"],
        properties: {
          document_type: { type: "string" }, secondary_types: stringArray, languages: stringArray, total_pages: { type: "integer", minimum: 1, maximum: 100 }, pages_analyzed: pageArray, unreadable_pages: pageArray,
          text_quality: { type: "string", enum: ["native_text", "partial_text", "scanned", "mixed", "unknown"] }, layout_complexity: { type: "string", enum: ["simple", "moderate", "complex"] },
          column_structure: { type: "string", enum: ["single", "multi", "mixed", "unknown"] }, contains_tables: { type: "boolean" }, contains_artwork_images: { type: "boolean" }, contains_scanned_pages: { type: "boolean" }, analysis_limitations: stringArray,
        },
      },
      sections: { type: "array", maxItems: 80, items: { type: "object", additionalProperties: false, required: ["section_type", "source_heading", "start_page", "end_page", "confidence"], properties: { section_type: { type: "string" }, source_heading: { type: "string" }, start_page: { type: "integer", minimum: 1 }, end_page: { type: "integer", minimum: 1 }, confidence: { type: "number", minimum: 0, maximum: 1 } } } },
      claims: { type: "array", maxItems: 160, items: claim },
      unresolved_content: { type: "array", maxItems: 80, items: { type: "object", additionalProperties: false, required: ["page_number", "issue", "possible_meanings", "recommended_artist_action"], properties: { page_number: { type: "integer", minimum: 1 }, issue: { type: "string" }, possible_meanings: stringArray, recommended_artist_action: { type: "string" } } } },
      analysis_summary: { type: "object", additionalProperties: false, required: ["what_was_found", "what_was_not_found", "what_needs_review", "coverage_level", "coverage_explanation"], properties: { what_was_found: stringArray, what_was_not_found: stringArray, what_needs_review: stringArray, coverage_level: { type: "string" }, coverage_explanation: { type: "string" } } },
    },
  }
}

function normalized(value: string) { return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() }
function significantTokens(value: string) { return normalized(value).split(" ").filter((token) => token.length > 2).slice(0, 40) }
function nativeEvidenceSupported(excerpt: string, pageText: string) {
  const tokens = significantTokens(excerpt)
  if (tokens.length < 3) return false
  const haystack = normalized(pageText)
  const present = tokens.filter((token) => haystack.includes(token)).length
  return present >= Math.min(tokens.length, Math.max(3, Math.ceil(tokens.length * 0.7)))
}
function pairsToObject(pairs: Array<{ key: string; value: string }>) {
  const result: JsonObject = {}
  for (const pair of pairs) {
    const key = cleanText(pair.key, 80).toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "")
    if (key) result[key] = cleanText(pair.value, 2_000)
  }
  return result
}

const safeTarget = /^[a-z][a-z0-9_]{1,79}$/
const allowedEvidenceModes = new Set<EvidenceMode>(["native_text", "visual_transcription", "table_interpretation", "image_caption_relationship", "artist_authored_narrative"])

export function validateDocumentAnalysis(raw: GeminiDocumentAnalysis, input: { totalPages: number; nativePages: string[]; requestedClassification: string }) {
  if (!object(raw) || !object(raw.document_assessment) || !Array.isArray(raw.claims)) throw new Error("gemini_invalid_document_schema")
  const totalPages = Math.max(1, Math.min(100, input.totalPages))
  const assessment = raw.document_assessment
  const validPages = (values: unknown) => Array.from(new Set((Array.isArray(values) ? values : []).map(Number).filter((value) => Number.isInteger(value) && value >= 1 && value <= totalPages))).sort((a, b) => a - b)
  const pagesAnalyzed = validPages(assessment.pages_analyzed)
  const unreadablePages = validPages(assessment.unreadable_pages)
  const limitations = (Array.isArray(assessment.analysis_limitations) ? assessment.analysis_limitations : []).map((value) => cleanText(value, 500)).filter(Boolean).slice(0, 30)
  if (Number(assessment.total_pages) !== totalPages) limitations.push(`KLEIO verified ${totalPages} pages; the model reported ${Number(assessment.total_pages) || 0}.`)
  const claims: Array<GeminiDocumentClaim & { normalized_value: JsonObject }> = []
  for (const candidate of raw.claims.slice(0, 160)) {
    if (!object(candidate)) continue
    const targetField = cleanText(candidate.target_field, 80).toLowerCase().replace(/[^a-z0-9_]+/g, "_")
    const targetSection = cleanText(candidate.target_section, 80).toLowerCase().replace(/[^a-z0-9_]+/g, "_")
    const claimType = cleanText(candidate.claim_type, 80).toLowerCase().replace(/[^a-z0-9_]+/g, "_")
    const displayValue = cleanText(candidate.display_value, 20_000)
    const evidenceExcerpt = cleanText(candidate.evidence_excerpt, 1_200)
    const pageNumber = candidate.page_number === null ? null : Number(candidate.page_number)
    const pageRange = validPages(candidate.page_range)
    const evidenceMode = allowedEvidenceModes.has(candidate.evidence_mode) ? candidate.evidence_mode : "visual_transcription"
    if (!safeTarget.test(targetField) || !safeTarget.test(targetSection) || !safeTarget.test(claimType) || !displayValue || !evidenceExcerpt) continue
    if ((pageNumber === null || pageNumber < 1 || pageNumber > totalPages) && !pageRange.length) continue
    const evidencePage = pageNumber ?? pageRange[0] ?? 1
    if (evidenceMode === "native_text" && input.nativePages[evidencePage - 1]?.trim() && !nativeEvidenceSupported(evidenceExcerpt, input.nativePages[evidencePage - 1])) continue
    let confidence = Number(candidate.confidence)
    if (!Number.isFinite(confidence)) confidence = 0.4
    confidence = Math.max(0, Math.min(1, confidence))
    if (evidenceMode === "visual_transcription") confidence = Math.min(confidence, 0.82)
    if (candidate.information_layer === "interpretive") confidence = Math.min(confidence, 0.65)
    const pairs = Array.isArray(candidate.normalized_pairs) ? candidate.normalized_pairs.filter(object).map((pair) => ({ key: cleanText(pair.key, 80), value: cleanText(pair.value, 2_000) })).filter((pair) => pair.key && pair.value).slice(0, 30) : []
    claims.push({ claim_type: claimType, target_field: targetField, target_section: targetSection, display_value: displayValue, normalized_pairs: pairs, normalized_value: pairsToObject(pairs), page_number: pageNumber && pageNumber >= 1 && pageNumber <= totalPages ? pageNumber : null, page_range: pageRange, evidence_excerpt: evidenceExcerpt, evidence_mode: evidenceMode, confidence, information_layer: ["factual", "artist_authored", "interpretive", "unknown"].includes(candidate.information_layer) ? candidate.information_layer : "unknown", sensitivity: ["standard", "sensitive", "highly_sensitive"].includes(candidate.sensitivity) ? candidate.sensitivity : "standard", requires_artist_review: true, incomplete: candidate.incomplete === true, uncertainty_note: cleanText(candidate.uncertainty_note, 1_000), source_section: cleanText(candidate.source_section, 200) })
  }
  const sections = (Array.isArray(raw.sections) ? raw.sections : []).filter(object).flatMap((section) => {
    const start = Number(section.start_page), end = Number(section.end_page)
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > totalPages) return []
    const item = { section_type: cleanText(section.section_type, 80).toLowerCase().replace(/[^a-z0-9_]+/g, "_"), source_heading: cleanText(section.source_heading, 300), start_page: start, end_page: end, confidence: Math.max(0, Math.min(1, Number(section.confidence) || 0)) }
    return safeTarget.test(item.section_type) ? [item] : []
  }).slice(0, 80)
  const unresolved = (Array.isArray(raw.unresolved_content) ? raw.unresolved_content : []).filter(object).flatMap((item) => {
    const page = Number(item.page_number)
    if (!Number.isInteger(page) || page < 1 || page > totalPages) return []
    const issue = cleanText(item.issue, 1_000)
    return issue ? [{ page_number: page, issue, possible_meanings: (Array.isArray(item.possible_meanings) ? item.possible_meanings : []).map((value) => cleanText(value, 500)).filter(Boolean).slice(0, 10), recommended_artist_action: cleanText(item.recommended_artist_action, 1_000) }] : []
  }).slice(0, 80)
  return {
    document_assessment: { document_type: cleanText(assessment.document_type, 80) || input.requestedClassification, secondary_types: (Array.isArray(assessment.secondary_types) ? assessment.secondary_types : []).map((value) => cleanText(value, 80)).filter(Boolean).slice(0, 10), languages: (Array.isArray(assessment.languages) ? assessment.languages : []).map((value) => cleanText(value, 80)).filter(Boolean).slice(0, 10), total_pages: totalPages, pages_analyzed: pagesAnalyzed, unreadable_pages: unreadablePages, text_quality: ["native_text", "partial_text", "scanned", "mixed", "unknown"].includes(assessment.text_quality) ? assessment.text_quality : "unknown", layout_complexity: ["simple", "moderate", "complex"].includes(assessment.layout_complexity) ? assessment.layout_complexity : "moderate", column_structure: ["single", "multi", "mixed", "unknown"].includes(assessment.column_structure) ? assessment.column_structure : "unknown", contains_tables: assessment.contains_tables === true, contains_artwork_images: assessment.contains_artwork_images === true, contains_scanned_pages: assessment.contains_scanned_pages === true, analysis_limitations: limitations },
    sections, claims, unresolved_content: unresolved,
    analysis_summary: { what_was_found: (Array.isArray(raw.analysis_summary?.what_was_found) ? raw.analysis_summary.what_was_found : []).map((value) => cleanText(value, 500)).filter(Boolean).slice(0, 30), what_was_not_found: (Array.isArray(raw.analysis_summary?.what_was_not_found) ? raw.analysis_summary.what_was_not_found : []).map((value) => cleanText(value, 500)).filter(Boolean).slice(0, 30), what_needs_review: (Array.isArray(raw.analysis_summary?.what_needs_review) ? raw.analysis_summary.what_needs_review : []).map((value) => cleanText(value, 500)).filter(Boolean).slice(0, 30), coverage_level: cleanText(raw.analysis_summary?.coverage_level, 80), coverage_explanation: cleanText(raw.analysis_summary?.coverage_explanation, 2_000) },
  }
}

export function assessDocumentCoverage(input: { classification: string; totalPages: number; pagesAnalyzed: number[]; unreadablePages: number[]; claims: Array<{ claim_type: string; confidence: number; information_layer: string }>; sections: Array<{ section_type: string }>; providerAvailable: boolean; textQuality: string }): { quality: DocumentQuality; explanation: string; score: number } {
  if (!input.providerAvailable) return { quality: "provider_unavailable", explanation: "Gemini document understanding was unavailable. KLEIO preserved the source without claiming a complete analysis.", score: 0 }
  if (["needs_artist_classification", "unknown_document"].includes(input.classification)) return { quality: "classification_required", explanation: "KLEIO needs the artist to confirm the document type before applying document-specific interpretation.", score: 0.25 }
  const pageCoverage = Math.min(1, input.pagesAnalyzed.length / Math.max(1, input.totalPages))
  const unreadableRatio = input.unreadablePages.length / Math.max(1, input.totalPages)
  const factualClaims = input.claims.filter((claim) => claim.information_layer === "factual" || claim.information_layer === "artist_authored")
  const highConfidence = factualClaims.filter((claim) => claim.confidence >= 0.75).length
  const claimTypes = new Set(factualClaims.map((claim) => claim.claim_type)).size
  const sections = new Set(input.sections.map((section) => section.section_type)).size
  const cvLike = input.classification === "artist_cv", complexMinimum = cvLike ? 4 : 2
  const score = Math.max(0, Math.min(1, pageCoverage * 0.32 + Math.min(1, highConfidence / (cvLike ? 10 : 5)) * 0.33 + Math.min(1, claimTypes / (cvLike ? 5 : 3)) * 0.2 + Math.min(1, sections / (cvLike ? 4 : 2)) * 0.15 - unreadableRatio * 0.4))
  if (unreadableRatio > 0.25 || (["scanned", "mixed"].includes(input.textQuality) && factualClaims.length < 2)) return { quality: "visual_reading_limited", explanation: "Gemini could perceive only part of the document reliably. KLEIO is showing the supported findings and the pages that need manual review.", score }
  if ((input.totalPages >= 3 && factualClaims.length < complexMinimum) || pageCoverage < 0.6 || claimTypes < 2) return { quality: "limited_analysis", explanation: "The document produced too little supported information for its length or complexity. KLEIO will not present this as a complete analysis.", score }
  if (score >= 0.84 && unreadableRatio === 0 && pageCoverage >= 0.95) return { quality: "complete_review_ready", explanation: "Gemini perceived the complete document and KLEIO validated a broad set of page-supported proposals.", score }
  return { quality: "substantial_review_ready", explanation: "Gemini perceived most of the document and KLEIO validated substantial page-supported information, with remaining items clearly identified for review.", score }
}

export function documentSystemInstruction() {
  return `You are the multimodal document-understanding engine for KLEIO, an artist-controlled Creative Passport and application platform. Inspect the original PDF visually and semantically. Understand layout, columns, headings, tables, images, captions, chronology, and relationships across pages. Extract only information supported by the PDF. Never invent dates, exhibitions, institutions, awards, grants, education, identities, materials, intent, collaborators, recognition, impact, or prestige. Distinguish factual records, artist-authored narrative, cautious interpretation, and uncertainty. Every claim must include a valid page reference and a concise supporting excerpt. Use visual_transcription when information is visually readable but not available in an embedded text layer. Use artist_authored_narrative for the artist's own descriptive language. Interpretive themes must never be presented as artist-stated intent. Return only JSON matching the provided schema.`
}

export function documentPrompt(input: { requestedClassification: string; filename: string; verifiedPages: number; nativeTextQuality: string; nativeTextCharacterCount: number }) {
  return `Analyze this private artist PDF for KLEIO.\n\nARTIST-SELECTED DOCUMENT TYPE: ${input.requestedClassification}\nPRIVATE SOURCE LABEL: ${input.filename}\nSERVER-VERIFIED PAGE COUNT: ${input.verifiedPages}\nEMBEDDED TEXT QUALITY: ${input.nativeTextQuality}\nEMBEDDED TEXT CHARACTER COUNT: ${input.nativeTextCharacterCount}\n\nProtocol:\n1. Perceive every page, including scanned and visually structured content.\n2. Map sections and reading order.\n3. Extract source-supported Creative Passport proposals.\n4. Recognize professional history even with unconventional headings.\n5. Connect portfolio images to captions and metadata.\n6. Preserve artist-authored language without turning interpretation into fact.\n7. Identify unreadable, ambiguous, contradictory, or incomplete content.\n8. Do not infer protected characteristics, identity, relationships, motives, or achievements.\n9. Do not return a claim without page evidence.\n10. Explain coverage honestly; a multi-page document with a few weak findings is limited, not complete.`
}

export function draftSchema(): JsonObject {
  const option = { type: "object", additionalProperties: false, required: ["label", "text", "evidence_refs", "correlation_refs", "factual_claims", "word_count"], properties: { label: { type: "string" }, text: { type: "string" }, evidence_refs: { type: "array", items: { type: "string" }, maxItems: 120 }, correlation_refs: { type: "array", items: { type: "string" }, maxItems: 40 }, factual_claims: { type: "array", maxItems: 80, items: { type: "object", additionalProperties: false, required: ["claim", "evidence_refs"], properties: { claim: { type: "string" }, evidence_refs: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 20 } } } }, word_count: { type: "integer", minimum: 1 } } }
  return { type: "object", additionalProperties: false, required: ["options", "missing_context", "excluded_information", "warnings"], properties: { options: { type: "array", minItems: 2, maxItems: 2, items: option }, missing_context: { type: "array", items: { type: "string" }, maxItems: 20 }, excluded_information: { type: "array", items: { type: "string" }, maxItems: 20 }, warnings: { type: "array", items: { type: "string" }, maxItems: 20 } } }
}

function wordCount(value: string) { return value.trim() ? value.trim().split(/\s+/).length : 0 }
function unsupportedTokens(text: string, evidenceCorpus: string) {
  const unsupported: string[] = [], corpus = evidenceCorpus.toLowerCase()
  for (const pattern of [/\b(?:19|20)\d{2}\b/g, /[$€£]\s?\d[\d,.]*/g, /\bhttps?:\/\/[^\s)]+/gi, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi]) {
    for (const match of text.matchAll(pattern)) if (!corpus.includes(match[0].toLowerCase())) unsupported.push(match[0])
  }
  return Array.from(new Set(unsupported))
}

export function validateDraftOutput(raw: JsonObject, input: { evidenceRefs: Set<string>; correlationRefs: Set<string>; evidenceCorpus: string; minWords: number; maxWords: number }) {
  const options = Array.isArray(raw.options) ? raw.options.filter(object) : []
  if (options.length !== 2) throw new Error("gemini_invalid_draft_schema")
  const normalizedOptions = options.map((option, index) => {
    const text = cleanText(option.text, 20_000), count = wordCount(text)
    if (!text || count < Math.max(20, input.minWords - 15) || count > input.maxWords + 20) throw new Error("draft_length_out_of_bounds")
    const evidenceRefs = (Array.isArray(option.evidence_refs) ? option.evidence_refs : []).map((value) => cleanText(value, 100)).filter((value) => input.evidenceRefs.has(value))
    if (!evidenceRefs.length) throw new Error("draft_missing_evidence")
    const correlationRefs = (Array.isArray(option.correlation_refs) ? option.correlation_refs : []).map((value) => cleanText(value, 100)).filter((value) => input.correlationRefs.has(value))
    const factualClaims = (Array.isArray(option.factual_claims) ? option.factual_claims : []).filter(object).map((item) => {
      const refs = (Array.isArray(item.evidence_refs) ? item.evidence_refs : []).map((value) => cleanText(value, 100)).filter((value) => input.evidenceRefs.has(value))
      if (!refs.length) throw new Error("draft_claim_missing_evidence")
      return { claim: cleanText(item.claim, 1_000), evidence_refs: refs }
    }).filter((item) => item.claim)
    const unsupported = unsupportedTokens(text, input.evidenceCorpus)
    if (unsupported.length) throw new Error(`draft_contains_unsupported_tokens:${unsupported.slice(0, 6).join(",")}`)
    return { label: cleanText(option.label, 120) || (index === 0 ? "Clear and professional" : "More expressive"), text, evidence_refs: Array.from(new Set(evidenceRefs)), correlation_refs: Array.from(new Set(correlationRefs)), factual_claims: factualClaims, word_count: count }
  })
  return { options: normalizedOptions, missing_context: (Array.isArray(raw.missing_context) ? raw.missing_context : []).map((value) => cleanText(value, 500)).filter(Boolean).slice(0, 20), excluded_information: (Array.isArray(raw.excluded_information) ? raw.excluded_information : []).map((value) => cleanText(value, 500)).filter(Boolean).slice(0, 20), warnings: (Array.isArray(raw.warnings) ? raw.warnings : []).map((value) => cleanText(value, 500)).filter(Boolean).slice(0, 20) }
}
