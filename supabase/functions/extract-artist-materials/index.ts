import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.110.5"
import { extractText, getDocumentProxy } from "npm:unpdf@1.6.2"
import {
  DEFAULT_DOCUMENT_MODEL,
  DEFAULT_DOCUMENT_PRO_MODEL,
  DOCUMENT_PROMPT_VERSION,
  DOCUMENT_SCHEMA_VERSION,
  GEMINI_PROVIDER,
  assessDocumentCoverage,
  cleanText,
  documentAnalysisSchema,
  documentPrompt,
  documentSystemInstruction,
  runGeminiStructured,
  safeModel,
  sha256,
  validateDocumentAnalysis,
  type DocumentQuality,
  type GeminiDocumentAnalysis,
  type JsonObject,
  type ProviderResult,
} from "../_shared/gemini-document-intelligence.ts"

const MAX_FILE_BYTES = 15 * 1024 * 1024
const MAX_TEXT_CHARS = 120_000
const DAILY_DOCUMENT_LIMIT = 12
const ALLOWED_ORIGINS = [/^https:\/\/([a-z0-9-]+\.)?kleioarthouse\.com$/i, /^https:\/\/cowboyblurr\.github\.io$/i, /^http:\/\/localhost(?::\d+)?$/i, /^http:\/\/127\.0\.0\.1(?::\d+)?$/i]
const CLASSIFICATIONS = ["artwork_image", "artwork_detail_image", "artist_cv", "artist_biography", "artist_statement", "project_proposal", "project_budget", "work_sample_list", "proof_of_residency", "identification_document", "reference_letter", "press_publication", "exhibition_documentation", "award_grant_documentation", "application_requirement_file", "unknown_document", "other_artist_material", "needs_artist_classification"] as const

type SourceClassification = (typeof CLASSIFICATIONS)[number]
type AdminClient = ReturnType<typeof createClient>
type SourceRow = {
  id: string; artist_user_id: string; source_type: string; label: string; storage_path: string; mime_type: string; byte_size: number | null; checksum: string;
  original_filename: string | null; source_metadata: JsonObject | null; classification: SourceClassification; classification_confidence: number | null;
  sensitivity: "standard" | "sensitive" | "highly_sensitive"; document_version: number; artist_selected_document_type: string; analysis_consent_at: string | null;
  keep_without_analysis: boolean; extraction_status: string; analysis_stage: string; review_summary: JsonObject | null; parent_source_id?: string | null;
}
type ProfileRow = { professional_name: string; location: string; bio: string; artist_statement: string; practice_description: string; website_url: string; disciplines: string[]; mediums: string[]; languages: string[]; education: string; exhibition_history: string; awards: string }
type PassportRecordRow = { id: string; record_type: string; display_value: string; normalized_key: string }
type ValidClaim = ReturnType<typeof validateDocumentAnalysis>["claims"][number] & { relationship_status?: "new" | "duplicate" | "conflict" | "unresolved"; existing_record_id?: string | null; status?: "proposed" | "needs_clarification" | "conflicting" }

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? ""
  const allowed = ALLOWED_ORIGINS.some((pattern) => pattern.test(origin)) ? origin : "https://www.kleioarthouse.com"
  return { "Access-Control-Allow-Origin": allowed, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" }
}
function json(request: Request, body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(request), "Content-Type": "application/json", "Cache-Control": "no-store" } }) }
function object(value: unknown): value is JsonObject { return Boolean(value) && typeof value === "object" && !Array.isArray(value) }
function validClassification(value: unknown): value is SourceClassification { return typeof value === "string" && (CLASSIFICATIONS as readonly string[]).includes(value) }
function normalizedKey(value: string) { return value.normalize("NFKD").toLowerCase().replace(/\b(19|20)\d{2}\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim().slice(0, 240) }
function normalizedComparable(value: string) { return value.normalize("NFKD").toLowerCase().replace(/\s+/g, " ").trim() }
function sensitivityFor(classification: SourceClassification) { return classification === "identification_document" ? "highly_sensitive" : ["proof_of_residency", "reference_letter"].includes(classification) ? "sensitive" : "standard" }
function databaseStatus(quality: DocumentQuality) { return quality === "complete_review_ready" || quality === "substantial_review_ready" ? "ready_for_review" : quality === "classification_required" ? "needs_artist_classification" : quality === "failed" ? "failed" : "partially_extracted" }
function textLayerStatus(pages: string[]) {
  const lengths = pages.map((page) => page.trim().length), readable = lengths.filter((length) => length >= 60).length
  if (!lengths.some((length) => length)) return "unavailable" as const
  return readable >= Math.max(1, Math.ceil(lengths.length * 0.8)) ? "available" as const : "partial" as const
}
function stableError(reason: unknown) {
  const message = reason instanceof Error ? reason.message : ""
  const stable = message.split(":")[0]
  return ["source_unavailable", "analysis_consent_required", "unsupported_document_type", "too_many_pages", "file_too_large", "analysis_in_progress", "gemini_not_configured", "gemini_timeout", "gemini_rate_limited", "gemini_provider_unavailable", "gemini_authentication_failed", "gemini_model_unavailable", "gemini_schema_rejected", "gemini_invalid_structured_output", "gemini_invalid_document_schema", "document_ai_daily_limit_reached"].includes(stable) ? stable : "document_analysis_failed"
}

async function sourceFile(admin: AdminClient, source: SourceRow) {
  const metadata = object(source.source_metadata) ? source.source_metadata : {}
  const bucket = metadata.storage_bucket === "artist-documents" || source.source_type === "device_document" || source.source_type === "pdf" ? "artist-documents" : "artist-assets"
  if (!source.storage_path || !source.storage_path.startsWith(`${source.artist_user_id}/`) || source.storage_path.includes("..")) throw new Error("source_unavailable")
  const { data, error } = await admin.storage.from(bucket).download(source.storage_path)
  if (error || !data) throw new Error("source_unavailable")
  if (data.size > MAX_FILE_BYTES) throw new Error("file_too_large")
  const bytes = new Uint8Array(await data.arrayBuffer())
  if (bytes.length < 5 || new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("source_unavailable")
  const pdf = await getDocumentProxy(bytes)
  const result = await extractText(pdf, { mergePages: false })
  const clean = (value: string) => value.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim().slice(0, MAX_TEXT_CHARS)
  const pages = Array.isArray(result.text) ? result.text.map((page) => clean(page)) : [clean(result.text)]
  return { bytes, pages, totalPages: result.totalPages }
}

function requestedClassification(value: unknown, source: SourceRow): SourceClassification {
  if (validClassification(value)) return value
  if (validClassification(source.classification)) return source.classification
  return "needs_artist_classification"
}

async function enforceDailyLimit(admin: AdminClient, userId: string) {
  const start = new Date(); start.setUTCHours(0, 0, 0, 0)
  const { count } = await admin.from("artist_ai_usage_events").select("id", { count: "exact", head: true }).eq("artist_user_id", userId).eq("action", "analyze_document").gte("created_at", start.toISOString()).in("status", ["succeeded", "failed"])
  if ((count ?? 0) >= DAILY_DOCUMENT_LIMIT) throw new Error("document_ai_daily_limit_reached")
}

async function recordUsage(admin: AdminClient, userId: string, status: "succeeded" | "failed" | "cached", input: { model: string; requestId?: string; latencyMs?: number; usage?: { input_tokens: number; output_tokens: number; total_tokens: number }; errorCode?: string; metadata: JsonObject }) {
  await admin.from("artist_ai_usage_events").insert({ artist_user_id: userId, action: "analyze_document", provider: GEMINI_PROVIDER, model: input.model, status, input_units: input.usage?.input_tokens ?? 0, output_units: input.usage?.output_tokens ?? 0, total_units: input.usage?.total_tokens ?? 0, latency_ms: input.latencyMs ?? null, provider_request_id: input.requestId || "", error_code: input.errorCode || "", metadata: input.metadata })
}

async function fingerprint(type: string, value: string) { return sha256(`${type}\n${normalizedKey(value)}\n${value.trim().toLowerCase()}`) }

function profileValue(profile: ProfileRow | null, target: string) {
  if (!profile || !(target in profile)) return ""
  const value = profile[target as keyof ProfileRow]
  return Array.isArray(value) ? value.join(", ") : value
}

function relateClaims(claims: ValidClaim[], records: PassportRecordRow[], profile: ProfileRow | null) {
  const recordsByType = new Map<string, PassportRecordRow[]>()
  for (const record of records) recordsByType.set(record.record_type, [...(recordsByType.get(record.record_type) ?? []), record])
  const listFields = new Set(["disciplines", "mediums", "languages", "education", "exhibition_history", "awards"])
  return claims.map((claim) => {
    const current = profileValue(profile, claim.target_field)
    if (current) {
      const same = normalizedComparable(current) === normalizedComparable(claim.display_value)
      if (same) return { ...claim, relationship_status: "duplicate" as const, status: "needs_clarification" as const }
      if (listFields.has(claim.target_field)) {
        const currentParts = current.split(/[,;\n]/).map(normalizedComparable).filter(Boolean)
        const newParts = claim.display_value.split(/[,;\n]/).map(normalizedComparable).filter(Boolean)
        if (newParts.every((part) => currentParts.includes(part))) return { ...claim, relationship_status: "duplicate" as const, status: "needs_clarification" as const }
      } else if (["professional_name", "location", "bio", "artist_statement", "practice_description", "website_url"].includes(claim.target_field)) {
        return { ...claim, relationship_status: "conflict" as const, status: "conflicting" as const }
      }
    }
    const matches = recordsByType.get(claim.claim_type) ?? []
    const exact = matches.find((record) => normalizedComparable(record.display_value) === normalizedComparable(claim.display_value))
    if (exact) return { ...claim, relationship_status: "duplicate" as const, existing_record_id: exact.id, status: "needs_clarification" as const }
    return { ...claim, relationship_status: "new" as const, status: claim.incomplete || claim.information_layer === "unknown" ? "needs_clarification" as const : "proposed" as const }
  })
}

function deterministicFallback(pages: string[], classification: SourceClassification): GeminiDocumentAnalysis {
  const lines = pages.flatMap((text, page) => text.split("\n").map((line) => ({ page: page + 1, text: line.replace(/^\s*[•●▪◦*-]\s*/, "").replace(/\s+/g, " ").trim() })).filter((item) => item.text))
  const headings = /^(education|training|solo exhibitions?|group exhibitions?|exhibitions?|residencies?|awards?|grants?|fellowships?|publications?|press|collections?|commissions?|teaching|talks?|panels?|professional experience)$/i
  let section = "", headingPage = 1
  const sections: GeminiDocumentAnalysis["sections"] = [], claims: GeminiDocumentAnalysis["claims"] = []
  for (const item of lines) {
    if (headings.test(item.text.replace(/[:—–-]+$/, ""))) { section = item.text.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); headingPage = item.page; sections.push({ section_type: section, source_heading: item.text, start_page: item.page, end_page: item.page, confidence: 0.9 }); continue }
    if (classification === "artist_cv" && section && /\b(?:19|20)\d{2}\b/.test(item.text)) claims.push({ claim_type: `${section.replace(/s$/, "")}_record`, target_field: `${section.replace(/s$/, "")}_record`, target_section: section, display_value: item.text, normalized_pairs: [{ key: "original_text", value: item.text }], page_number: item.page, page_range: [item.page], evidence_excerpt: item.text, evidence_mode: "native_text", confidence: 0.82, information_layer: "factual", sensitivity: "standard", requires_artist_review: true, incomplete: false, uncertainty_note: "", source_section: section })
    if (sections.length && sections.at(-1)?.end_page === headingPage && item.page > headingPage) sections[sections.length - 1].end_page = item.page
  }
  const readable = pages.map((text, index) => text.trim() ? index + 1 : 0).filter(Boolean)
  return { document_assessment: { document_type: classification, secondary_types: [], languages: [], total_pages: pages.length, pages_analyzed: readable, unreadable_pages: pages.map((text, index) => text.trim() ? 0 : index + 1).filter(Boolean), text_quality: textLayerStatus(pages) === "available" ? "native_text" : textLayerStatus(pages) === "partial" ? "partial_text" : "scanned", layout_complexity: "moderate", column_structure: "unknown", contains_tables: false, contains_artwork_images: false, contains_scanned_pages: textLayerStatus(pages) === "unavailable", analysis_limitations: ["Gemini was unavailable. These deterministic findings are limited to clearly structured embedded text."] }, sections, claims, unresolved_content: [{ page_number: 1, issue: "Semantic and visual document understanding was unavailable.", possible_meanings: [], recommended_artist_action: "Review these limited findings or retry Gemini analysis." }], analysis_summary: { what_was_found: claims.length ? [`${claims.length} clearly structured native-text entries`] : [], what_was_not_found: ["No Gemini visual or semantic interpretation was completed."], what_needs_review: ["All pages and visually structured content"], coverage_level: "provider_unavailable", coverage_explanation: "KLEIO preserved deterministic findings without presenting them as complete document understanding." } }
}

function minimumSensitive(source: SourceRow, classification: SourceClassification, pages: number): GeminiDocumentAnalysis {
  const label = source.original_filename || source.label || "Restricted artist document"
  return { document_assessment: { document_type: classification, secondary_types: [], languages: [], total_pages: pages, pages_analyzed: [], unreadable_pages: [], text_quality: "unknown", layout_complexity: "simple", column_structure: "unknown", contains_tables: false, contains_artwork_images: false, contains_scanned_pages: false, analysis_limitations: ["This restricted document received minimum metadata processing and was excluded from general Gemini drafting."] }, sections: [], claims: [{ claim_type: "eligibility_document", target_field: "eligibility_document", target_section: "eligibility", display_value: label, normalized_pairs: [{ key: "classification", value: classification }], page_number: 1, page_range: [1], evidence_excerpt: label, evidence_mode: "native_text", confidence: 0.3, information_layer: "unknown", sensitivity: sensitivityFor(classification), requires_artist_review: true, incomplete: true, uncertainty_note: "Restricted minimum processing", source_section: "document_metadata" }], unresolved_content: [], analysis_summary: { what_was_found: ["A restricted eligibility source is available privately."], what_was_not_found: ["No general semantic or promotional analysis was performed."], what_needs_review: ["Artist confirmation is required for any eligibility use."], coverage_level: "limited_analysis", coverage_explanation: "KLEIO intentionally minimized processing of a sensitive source." } }
}

async function createJob(admin: AdminClient, source: SourceRow, userId: string, classification: SourceClassification, model: string, inputHash: string, force: boolean) {
  const base = `${DOCUMENT_PROMPT_VERSION}:${DOCUMENT_SCHEMA_VERSION}:${model}`
  let version = base
  if (force) {
    const { count } = await admin.from("artist_extraction_jobs").select("id", { count: "exact", head: true }).eq("artist_user_id", userId).eq("source_id", source.id).like("extractor_version", `${base}%`)
    version = `${base}:r${(count ?? 0) + 1}`
  }
  const { data: existing } = await admin.from("artist_extraction_jobs").select("*").eq("artist_user_id", userId).eq("source_id", source.id).eq("extractor_version", version).maybeSingle()
  if (existing?.status === "processing") throw new Error("analysis_in_progress")
  if (existing) {
    const { data, error } = await admin.from("artist_extraction_jobs").update({ classification, status: "processing", attempt: Number(existing.attempt || 1) + 1, input_hash: inputHash, provider: GEMINI_PROVIDER, model, prompt_version: DOCUMENT_PROMPT_VERSION, schema_version: DOCUMENT_SCHEMA_VERSION, summary: {}, started_at: new Date().toISOString(), completed_at: null, error_category: "", updated_at: new Date().toISOString() }).eq("id", existing.id).eq("artist_user_id", userId).select("*").single()
    if (error || !data) throw error || new Error("analysis_job_failed")
    return data
  }
  const { data, error } = await admin.from("artist_extraction_jobs").insert({ artist_user_id: userId, source_id: source.id, classification, status: "processing", extractor_version: version, attempt: 1, summary: {}, action: "extract_material", provider: GEMINI_PROVIDER, model, prompt_version: DOCUMENT_PROMPT_VERSION, schema_version: DOCUMENT_SCHEMA_VERSION, input_hash: inputHash, started_at: new Date().toISOString() }).select("*").single()
  if (error || !data) throw error || new Error("analysis_job_failed")
  return data
}

async function saveAnalysis(input: { admin: AdminClient; source: SourceRow; userId: string; classification: SourceClassification; jobId: string; result: ProviderResult<GeminiDocumentAnalysis> | null; model: string; analysis: ReturnType<typeof validateDocumentAnalysis>; quality: { quality: DocumentQuality; explanation: string; score: number }; nativePages: string[]; totalPages: number; providerAvailable: boolean }) {
  const [{ data: records }, { data: profile }] = await Promise.all([
    input.admin.from("artist_passport_records").select("id,record_type,display_value,normalized_key").eq("artist_user_id", input.userId).eq("status", "active"),
    input.admin.from("artist_profiles").select("professional_name,location,bio,artist_statement,practice_description,website_url,disciplines,mediums,languages,education,exhibition_history,awards").eq("user_id", input.userId).maybeSingle(),
  ])
  const related = relateClaims(input.analysis.claims as ValidClaim[], (records ?? []) as PassportRecordRow[], (profile ?? null) as ProfileRow | null)
  await input.admin.from("artist_import_proposals").delete().eq("source_id", input.source.id).eq("artist_user_id", input.userId).in("status", ["proposed", "needs_clarification", "conflicting", "deferred", "source_unavailable", "extraction_failed"])
  if (related.length) {
    const rows = await Promise.all(related.map(async (claim) => ({ source_id: input.source.id, artist_user_id: input.userId, extraction_job_id: input.jobId, target_field: claim.target_field, claim_type: claim.claim_type, target_section: claim.target_section, proposed_value: claim.display_value, normalized_value: claim.normalized_value, evidence_excerpt: claim.evidence_excerpt, page_number: claim.page_number ?? claim.page_range[0] ?? null, evidence_location: { page_range: claim.page_range, evidence_mode: claim.evidence_mode, source_section: claim.source_section, uncertainty_note: claim.uncertainty_note, model: input.result?.model || "deterministic", prompt_version: DOCUMENT_PROMPT_VERSION, schema_version: DOCUMENT_SCHEMA_VERSION }, extraction_method: input.providerAvailable ? `gemini_${claim.evidence_mode}_v2` : "deterministic_native_text_fallback_v2", confidence: claim.confidence, status: claim.status, sensitivity: claim.sensitivity, fingerprint: await fingerprint(claim.claim_type, claim.display_value), relationship_status: claim.relationship_status, existing_record_id: claim.existing_record_id ?? null, analysis_layer: claim.information_layer === "factual" ? 1 : claim.information_layer === "artist_authored" ? 2 : claim.information_layer === "interpretive" ? 4 : 5, confidence_state: claim.relationship_status === "conflict" ? "conflicting_evidence" : claim.confidence >= 0.85 ? "high" : claim.confidence >= 0.65 ? "moderate" : "low", supporting_evidence: [{ source_id: input.source.id, page: claim.page_number ?? claim.page_range[0] ?? null, excerpt: claim.evidence_excerpt, mode: claim.evidence_mode }], bulk_confirm_eligible: claim.information_layer === "factual" && claim.confidence >= 0.85 && claim.relationship_status === "new" && claim.sensitivity === "standard" })))
    const { error } = await input.admin.from("artist_import_proposals").insert(rows)
    if (error) throw error
  }
  const grouped: Record<string, number> = {}
  for (const claim of related) grouped[claim.target_section] = (grouped[claim.target_section] ?? 0) + 1
  const summary: JsonObject = { provider: input.providerAvailable ? GEMINI_PROVIDER : "deterministic_fallback", model: input.providerAvailable ? input.result?.model || input.model : "", prompt_version: DOCUMENT_PROMPT_VERSION, schema_version: DOCUMENT_SCHEMA_VERSION, analysis_quality: input.quality.quality, analysis_score: input.quality.score, coverage_explanation: input.quality.explanation, document_assessment: input.analysis.document_assessment, sections: input.analysis.sections, analysis_summary: input.analysis.analysis_summary, unresolved_content: input.analysis.unresolved_content, claim_count: related.length, section_count: input.analysis.sections.length, conflict_count: related.filter((claim) => claim.relationship_status === "conflict").length, duplicate_count: related.filter((claim) => claim.relationship_status === "duplicate").length, unresolved_count: input.analysis.unresolved_content.length, grouped_counts: grouped, representative_claims: related.slice(0, 8).map((claim) => ({ claim_type: claim.claim_type, target_section: claim.target_section, display_value: claim.display_value.slice(0, 500), page_number: claim.page_number ?? claim.page_range[0] ?? null, evidence_excerpt: claim.evidence_excerpt.slice(0, 500), evidence_mode: claim.evidence_mode, confidence: claim.confidence, relationship_status: claim.relationship_status, status: claim.status })), original_source_preserved: true, artist_confirmation_required: true, gemini_visual_document_understanding: input.providerAvailable }
  const now = new Date().toISOString(), status = databaseStatus(input.quality.quality), merged = input.nativePages.join("\n\n").slice(0, MAX_TEXT_CHARS), checksum = merged ? await sha256(merged) : ""
  const { error: jobError } = await input.admin.from("artist_extraction_jobs").update({ classification: input.classification, status, extracted_text: input.source.sensitivity === "standard" ? merged : "", extracted_text_checksum: checksum, total_pages: input.totalPages, summary, page_text: input.source.sensitivity === "standard" ? input.nativePages.map((text, index) => ({ page: index + 1, character_count: text.length })) : [], document_structure: { assessment: input.analysis.document_assessment, sections: input.analysis.sections }, analysis_layers: { factual: related.filter((claim) => claim.information_layer === "factual").length, artist_authored: related.filter((claim) => claim.information_layer === "artist_authored").length, interpretive: related.filter((claim) => claim.information_layer === "interpretive").length, unknown: related.filter((claim) => claim.information_layer === "unknown").length }, warnings: input.analysis.document_assessment.analysis_limitations, analysis_version: DOCUMENT_PROMPT_VERSION, native_text_status: textLayerStatus(input.nativePages), ocr_status: "not_required", completed_at: now, provider: input.providerAvailable ? GEMINI_PROVIDER : "deterministic_fallback", model: input.providerAvailable ? input.result?.model || input.model : "", prompt_version: DOCUMENT_PROMPT_VERSION, schema_version: DOCUMENT_SCHEMA_VERSION, provider_request_id: input.result?.requestId || "", usage: input.result?.usage || {}, latency_ms: input.result?.latencyMs ?? null, error_category: input.quality.quality === "provider_unavailable" ? "gemini_provider_unavailable" : "", updated_at: now }).eq("id", input.jobId).eq("artist_user_id", input.userId)
  if (jobError) throw jobError
  const { error: sourceError } = await input.admin.from("artist_import_sources").update({ classification: input.classification, classification_confidence: 1, classification_reason: "Artist-selected type combined with Gemini visual document assessment.", extraction_status: status, extraction_method: input.providerAvailable ? "gemini_native_pdf_v2" : "deterministic_fallback_v2", extraction_version: `${DOCUMENT_PROMPT_VERSION}:${DOCUMENT_SCHEMA_VERSION}:${input.result?.model || input.model}`, extracted_at: now, analysis_stage: input.quality.quality, text_layer_status: textLayerStatus(input.nativePages), ocr_status: "not_required", page_count: input.totalPages, last_error_category: input.quality.quality === "provider_unavailable" ? "gemini_provider_unavailable" : "", review_summary: summary, updated_at: now }).eq("id", input.source.id).eq("artist_user_id", input.userId)
  if (sourceError) throw sourceError
  return { summary, related, status }
}

async function analyze(admin: AdminClient, userId: string, body: JsonObject) {
  const sourceId = cleanText(body.sourceId, 100)
  if (!sourceId) throw new Error("source_unavailable")
  const { data, error } = await admin.from("artist_import_sources").select("*").eq("id", sourceId).eq("artist_user_id", userId).is("deleted_at", null).single()
  if (error || !data) throw new Error("source_unavailable")
  const source = data as SourceRow
  if (source.keep_without_analysis || !source.analysis_consent_at) throw new Error("analysis_consent_required")
  if (source.mime_type !== "application/pdf") throw new Error("unsupported_document_type")
  const classification = requestedClassification(body.classification, source)
  const { bytes, pages, totalPages } = await sourceFile(admin, source)
  if (totalPages > 100) throw new Error("too_many_pages")
  const nativeQuality = textLayerStatus(pages), nativeChars = pages.reduce((sum, page) => sum + page.length, 0)
  const model = safeModel(Deno.env.get("GEMINI_DOCUMENT_MODEL"), DEFAULT_DOCUMENT_MODEL), proModel = safeModel(Deno.env.get("GEMINI_DOCUMENT_PRO_MODEL"), DEFAULT_DOCUMENT_PRO_MODEL), apiKey = cleanText(Deno.env.get("GEMINI_API_KEY"), 4_000)
  const inputHash = await sha256(JSON.stringify({ checksum: source.checksum, documentVersion: source.document_version, prompt: DOCUMENT_PROMPT_VERSION, schema: DOCUMENT_SCHEMA_VERSION, model, classification }))
  const force = body.force_reanalysis === true || (source.extraction_status === "queued" && Boolean(object(source.review_summary) && source.review_summary?.analysis_quality))
  if (!force) {
    const { data: cached } = await admin.from("artist_extraction_jobs").select("*").eq("artist_user_id", userId).eq("source_id", source.id).eq("input_hash", inputHash).in("status", ["ready_for_review", "partially_extracted", "needs_artist_classification"]).order("completed_at", { ascending: false }).limit(1).maybeSingle()
    if (cached) { await recordUsage(admin, userId, "cached", { model: cached.model || model, metadata: { source_id: source.id, document_version: source.document_version } }); const summary = object(cached.summary) ? cached.summary : {}; return { sourceId: source.id, jobId: cached.id, proposalCount: Number(summary.claim_count || 0), extractionStatus: cached.status, classification, classificationConfidence: source.classification_confidence ?? 1, documentVersion: source.document_version, warnings: [], analysisSummary: summary, representativeClaims: summary.representative_claims ?? [], cached: true } }
  }
  await enforceDailyLimit(admin, userId)
  const job = await createJob(admin, source, userId, classification, model, inputHash, force), jobId = String(job.id)
  if (sensitivityFor(classification) !== "standard") {
    const raw = minimumSensitive(source, classification, totalPages), analysis = validateDocumentAnalysis(raw, { totalPages, nativePages: pages, requestedClassification: classification }), quality = { quality: "limited_analysis" as const, explanation: raw.analysis_summary.coverage_explanation, score: 0.2 }
    const saved = await saveAnalysis({ admin, source, userId, classification, jobId, result: null, model, analysis, quality, nativePages: pages, totalPages, providerAvailable: false })
    return { sourceId: source.id, jobId, proposalCount: saved.related.length, extractionStatus: saved.status, classification, classificationConfidence: 1, documentVersion: source.document_version, warnings: ["restricted_document_minimum_processing"], analysisSummary: saved.summary, representativeClaims: saved.summary.representative_claims, cached: false }
  }
  let providerResult: ProviderResult<GeminiDocumentAnalysis> | null = null
  try {
    if (!apiKey) throw new Error("gemini_not_configured")
    providerResult = await runGeminiStructured<GeminiDocumentAnalysis>({ apiKey, model, systemInstruction: documentSystemInstruction(), prompt: documentPrompt({ requestedClassification: classification, filename: source.original_filename || source.label, verifiedPages: totalPages, nativeTextQuality: nativeQuality, nativeTextCharacterCount: nativeChars }), responseSchema: documentAnalysisSchema(), pdfBytes: bytes, timeoutMs: 92_000, maxOutputTokens: 48_000 })
    let analysis = validateDocumentAnalysis(providerResult.output, { totalPages, nativePages: pages, requestedClassification: classification })
    let quality = assessDocumentCoverage({ classification, totalPages, pagesAnalyzed: analysis.document_assessment.pages_analyzed, unreadablePages: analysis.document_assessment.unreadable_pages, claims: analysis.claims, sections: analysis.sections, providerAvailable: true, relevance: analysis.analysis_summary.relevance, textQuality: analysis.document_assessment.text_quality })
    const escalate = Deno.env.get("KLEIO_GEMINI_PRO_ESCALATION") !== "false" && proModel !== model && ["limited_analysis", "visual_reading_limited"].includes(quality.quality) && (analysis.document_assessment.layout_complexity === "complex" || totalPages >= 3)
    if (escalate) try {
      const pro = await runGeminiStructured<GeminiDocumentAnalysis>({ apiKey, model: proModel, systemInstruction: documentSystemInstruction(), prompt: `${documentPrompt({ requestedClassification: classification, filename: source.original_filename || source.label, verifiedPages: totalPages, nativeTextQuality: nativeQuality, nativeTextCharacterCount: nativeChars })}\n\nA prior Flash analysis had limited coverage. Inspect the original PDF independently and recover only additional page-supported structure and claims.`, responseSchema: documentAnalysisSchema(), pdfBytes: bytes, timeoutMs: 105_000, maxOutputTokens: 48_000 })
      const next = validateDocumentAnalysis(pro.output, { totalPages, nativePages: pages, requestedClassification: classification }), nextQuality = assessDocumentCoverage({ classification, totalPages, pagesAnalyzed: next.document_assessment.pages_analyzed, unreadablePages: next.document_assessment.unreadable_pages, claims: next.claims, sections: next.sections, providerAvailable: true, relevance: next.analysis_summary.relevance, textQuality: next.document_assessment.text_quality })
      if (nextQuality.score > quality.score + 0.08 && next.claims.length >= analysis.claims.length) { providerResult = pro; analysis = next; quality = nextQuality }
    } catch { /* validated Flash result remains authoritative */ }
    const saved = await saveAnalysis({ admin, source, userId, classification, jobId, result: providerResult, model: providerResult.model, analysis, quality, nativePages: pages, totalPages, providerAvailable: true })
    await recordUsage(admin, userId, "succeeded", { model: providerResult.model, requestId: providerResult.requestId, latencyMs: providerResult.latencyMs, usage: providerResult.usage, metadata: { source_id: source.id, document_version: source.document_version, page_count: totalPages, analysis_quality: quality.quality, claim_count: saved.related.length, section_count: analysis.sections.length } })
    return { sourceId: source.id, jobId, proposalCount: saved.related.length, extractionStatus: saved.status, classification, classificationConfidence: 1, documentVersion: source.document_version, warnings: ["limited_analysis", "visual_reading_limited"].includes(quality.quality) ? [quality.quality] : [], analysisSummary: saved.summary, representativeClaims: saved.summary.representative_claims, cached: false }
  } catch (reason) {
    const code = stableError(reason), raw = deterministicFallback(pages, classification), fallback = validateDocumentAnalysis(raw, { totalPages, nativePages: pages, requestedClassification: classification }), quality = assessDocumentCoverage({ classification, totalPages, pagesAnalyzed: fallback.document_assessment.pages_analyzed, unreadablePages: fallback.document_assessment.unreadable_pages, claims: fallback.claims, sections: fallback.sections, providerAvailable: false, textQuality: fallback.document_assessment.text_quality })
    const saved = await saveAnalysis({ admin, source, userId, classification, jobId, result: null, model, analysis: fallback, quality, nativePages: pages, totalPages, providerAvailable: false })
    await recordUsage(admin, userId, "failed", { model: providerResult?.model || model, requestId: providerResult?.requestId, latencyMs: providerResult?.latencyMs, usage: providerResult?.usage, errorCode: code, metadata: { source_id: source.id, document_version: source.document_version, page_count: totalPages, fallback_claim_count: saved.related.length } })
    return { sourceId: source.id, jobId, proposalCount: saved.related.length, extractionStatus: saved.status, classification, classificationConfidence: 1, documentVersion: source.document_version, warnings: [code, "provider_unavailable"], analysisSummary: saved.summary, representativeClaims: saved.summary.representative_claims, cached: false }
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) })
  if (request.method !== "POST") return json(request, { error: "method_not_allowed" }, 405)
  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return json(request, { error: "authentication_required" }, 401)
  const supabaseUrl = Deno.env.get("SUPABASE_URL"), anonKey = Deno.env.get("SUPABASE_ANON_KEY"), serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json(request, { error: "service_configuration_unavailable" }, 503)
  const auth = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } })
  const { data: userData } = await auth.auth.getUser(authorization.slice("Bearer ".length))
  if (!userData.user) return json(request, { error: "authentication_required" }, 401)
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: role } = await admin.from("profiles").select("role").eq("id", userData.user.id).single()
  if (role?.role !== "artist") return json(request, { error: "artist_account_required" }, 403)
  let body: JsonObject
  try { const parsed = await request.json(); if (!object(parsed)) return json(request, { error: "invalid_json" }, 400); body = parsed } catch { return json(request, { error: "invalid_json" }, 400) }
  const action = cleanText(body.action, 80)
  if (action === "capabilities") return json(request, { configured: Boolean(cleanText(Deno.env.get("GEMINI_API_KEY"), 4_000)), provider: GEMINI_PROVIDER, documentModel: safeModel(Deno.env.get("GEMINI_DOCUMENT_MODEL"), DEFAULT_DOCUMENT_MODEL), proModel: safeModel(Deno.env.get("GEMINI_DOCUMENT_PRO_MODEL"), DEFAULT_DOCUMENT_PRO_MODEL), promptVersion: DOCUMENT_PROMPT_VERSION, schemaVersion: DOCUMENT_SCHEMA_VERSION, originalPdfVision: true, structuredOutput: true, artistConfirmationRequired: true, maximumBytes: MAX_FILE_BYTES, maximumPages: 100 })
  if (action && action !== "extract_material") return json(request, { error: "unsupported_action" }, 400)
  try { return json(request, await analyze(admin, userData.user.id, body)) }
  catch (reason) { const code = stableError(reason); return json(request, { error: code, message: code === "document_ai_daily_limit_reached" ? "Your daily document-analysis limit has been reached. Your private sources remain available." : "KLEIO could not complete this document analysis. The original private PDF remains available." }, code === "document_ai_daily_limit_reached" || code === "gemini_rate_limited" ? 429 : code === "analysis_in_progress" ? 409 : code === "source_unavailable" ? 404 : 422) }
})
