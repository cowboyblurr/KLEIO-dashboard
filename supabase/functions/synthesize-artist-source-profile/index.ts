import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.110.5"
import {
  DEFAULT_DRAFT_MODEL,
  GEMINI_PROVIDER,
  cleanText,
  runGeminiStructured,
  safeModel,
  type JsonObject,
} from "../_shared/gemini-document-intelligence.ts"

const MAX_FILE_BYTES = 15 * 1024 * 1024
const PROFILE_SYNTHESIS_VERSION = "kleio_pdf_passport_synthesis_v1"
const ALLOWED_ORIGINS = [
  /^https:\/\/([a-z0-9-]+\.)?kleioarthouse\.com$/i,
  /^https:\/\/cowboyblurr\.github\.io$/i,
  /^http:\/\/localhost(?::\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/i,
]

type AdminClient = ReturnType<typeof createClient>
type SourceRow = {
  id: string
  artist_user_id: string
  label: string
  original_filename: string | null
  source_type: string
  storage_path: string
  mime_type: string
  byte_size: number | null
  sensitivity: "standard" | "sensitive" | "highly_sensitive"
  analysis_consent_at: string | null
  keep_without_analysis: boolean
  extraction_status: string
  page_count: number | null
  source_metadata: JsonObject | null
  review_summary: JsonObject | null
}

type EvidenceItem = {
  ref: string
  page_number: number
  evidence_excerpt: string
  information_layer: "factual" | "artist_authored" | "interpretive"
}

type DraftItem = { text: string; evidence_refs: string[] }
type Suggestion = { value: string; evidence_refs: string[]; confidence: number }

type ProfileSynthesis = {
  professional_name: Suggestion | null
  bio: DraftItem
  artist_statement: DraftItem
  practice_description: DraftItem
  disciplines: Suggestion[]
  mediums: Suggestion[]
  themes: Suggestion[]
  skills: Suggestion[]
  career_highlights: Suggestion[]
  education: Suggestion[]
  exhibitions: Suggestion[]
  awards: Suggestion[]
  residencies: Suggestion[]
  representation: Suggestion[]
  portfolio_projects: Suggestion[]
  artworks: Suggestion[]
  portfolio_links: Suggestion[]
  missing_context: string[]
  evidence: EvidenceItem[]
}

function object(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? ""
  const allowed = ALLOWED_ORIGINS.some((pattern) => pattern.test(origin)) ? origin : "https://www.kleioarthouse.com"
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  }
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json", "Cache-Control": "no-store" },
  })
}

function stringArray() {
  return { type: "array", items: { type: "string" } }
}

function synthesisSchema(): JsonObject {
  const refs = stringArray()
  const suggestion = {
    type: "object",
    required: ["value", "evidence_refs", "confidence"],
    properties: {
      value: { type: "string" },
      evidence_refs: refs,
      confidence: { type: "number" },
    },
  }
  const draft = {
    type: "object",
    required: ["text", "evidence_refs"],
    properties: { text: { type: "string" }, evidence_refs: refs },
  }
  const evidence = {
    type: "object",
    required: ["ref", "page_number", "evidence_excerpt", "information_layer"],
    properties: {
      ref: { type: "string" },
      page_number: { type: "integer" },
      evidence_excerpt: { type: "string" },
      information_layer: { type: "string", enum: ["factual", "artist_authored", "interpretive"] },
    },
  }
  return {
    type: "object",
    required: [
      "professional_name", "bio", "artist_statement", "practice_description", "disciplines", "mediums", "themes", "skills",
      "career_highlights", "education", "exhibitions", "awards", "residencies", "representation", "portfolio_projects", "artworks",
      "portfolio_links", "missing_context", "evidence",
    ],
    properties: {
      professional_name: suggestion,
      bio: draft,
      artist_statement: draft,
      practice_description: draft,
      disciplines: { type: "array", items: suggestion },
      mediums: { type: "array", items: suggestion },
      themes: { type: "array", items: suggestion },
      skills: { type: "array", items: suggestion },
      career_highlights: { type: "array", items: suggestion },
      education: { type: "array", items: suggestion },
      exhibitions: { type: "array", items: suggestion },
      awards: { type: "array", items: suggestion },
      residencies: { type: "array", items: suggestion },
      representation: { type: "array", items: suggestion },
      portfolio_projects: { type: "array", items: suggestion },
      artworks: { type: "array", items: suggestion },
      portfolio_links: { type: "array", items: suggestion },
      missing_context: stringArray(),
      evidence: { type: "array", items: evidence },
    },
  }
}

function systemInstruction() {
  return `You are KLEIO's private Creative Passport synthesis engine. Read the entire original artist PDF visually and semantically, not just its summary. Your task is to transform source-supported material into a useful, reviewable artist-profile proposal without inventing facts.

Rules:
- Produce a comprehensive Passport synthesis when the source supports it; do not stop at a generic document description.
- Separate direct factual evidence, artist-authored language, and cautious interpretation.
- Every non-empty draft and every suggestion must cite evidence refs that you create in the evidence array.
- Evidence refs must point to a real PDF page and include a short supporting excerpt.
- Bio: third-person, factual and professional. Do not turn interpretation into biography facts.
- Artist statement: preserve the artist's own language, concepts, concerns, methods, and stated intent. If the PDF does not contain enough artist-authored material, return an empty statement and explain the gap in missing_context. Never invent an artist's intent.
- Practice description: describe what the artist makes and how they work from supported material; it may combine factual and artist-authored evidence.
- Disciplines, mediums, themes, skills, exhibitions, education, awards, residencies, representation, projects, artworks and public portfolio links should be extracted comprehensively when supported.
- Themes may include cautious interpretive suggestions only when grounded in the work and clearly supported by interpretive evidence. Do not present them as the artist's stated intent unless the source says so.
- Do not infer protected characteristics, identity, relationships, prestige, impact, motives, community ties, or achievements not present in the PDF.
- Do not include private phone numbers or email addresses in the Passport synthesis. Public artist/portfolio/website links are allowed when clearly presented as public-facing links in the source.
- When a source explicitly says a list is selected or partial, do not imply it is complete.
- Prefer substance over generic arts language. Avoid empty phrases such as 'explores the intersection of' unless the source itself supports that framing.
- Nothing here is automatically approved or published. The artist must review it.
Return only JSON matching the provided schema.`
}

function safeRef(value: unknown) {
  return cleanText(value, 100).toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "")
}

function validateSynthesis(raw: JsonObject, pageCount: number): ProfileSynthesis {
  const rawEvidence = Array.isArray(raw.evidence) ? raw.evidence.filter(object) : []
  const evidence: EvidenceItem[] = []
  const seen = new Set<string>()
  for (const item of rawEvidence.slice(0, 180)) {
    const ref = safeRef(item.ref)
    const page = Number(item.page_number)
    const excerpt = cleanText(item.evidence_excerpt, 900)
    const layer = ["factual", "artist_authored", "interpretive"].includes(String(item.information_layer))
      ? String(item.information_layer) as EvidenceItem["information_layer"]
      : "factual"
    if (!ref || seen.has(ref) || !Number.isInteger(page) || page < 1 || page > pageCount || !excerpt) continue
    seen.add(ref)
    evidence.push({ ref, page_number: page, evidence_excerpt: excerpt, information_layer: layer })
  }
  const evidenceMap = new Map(evidence.map((item) => [item.ref, item]))
  const refs = (value: unknown) => Array.from(new Set((Array.isArray(value) ? value : []).map(safeRef).filter((ref) => evidenceMap.has(ref))))

  const draft = (value: unknown, requireArtistAuthored = false): DraftItem => {
    if (!object(value)) return { text: "", evidence_refs: [] }
    const text = cleanText(value.text, 8_000)
    const evidenceRefs = refs(value.evidence_refs)
    if (!text || !evidenceRefs.length) return { text: "", evidence_refs: [] }
    if (requireArtistAuthored && !evidenceRefs.some((ref) => evidenceMap.get(ref)?.information_layer === "artist_authored")) return { text: "", evidence_refs: [] }
    return { text, evidence_refs: evidenceRefs }
  }

  const suggestion = (value: unknown): Suggestion | null => {
    if (!object(value)) return null
    const text = cleanText(value.value, 2_000)
    const evidenceRefs = refs(value.evidence_refs)
    let confidence = Number(value.confidence)
    if (!Number.isFinite(confidence)) confidence = 0.5
    confidence = Math.max(0, Math.min(1, confidence))
    if (!text || !evidenceRefs.length) return null
    return { value: text, evidence_refs: evidenceRefs, confidence }
  }

  const suggestions = (value: unknown, limit = 80) => {
    const items = Array.isArray(value) ? value : []
    const result: Suggestion[] = []
    const values = new Set<string>()
    for (const item of items.slice(0, limit)) {
      const next = suggestion(item)
      if (!next) continue
      const key = next.value.toLowerCase().replace(/\s+/g, " ").trim()
      if (!key || values.has(key)) continue
      values.add(key)
      result.push(next)
    }
    return result
  }

  return {
    professional_name: suggestion(raw.professional_name),
    bio: draft(raw.bio),
    artist_statement: draft(raw.artist_statement, true),
    practice_description: draft(raw.practice_description),
    disciplines: suggestions(raw.disciplines, 30),
    mediums: suggestions(raw.mediums, 40),
    themes: suggestions(raw.themes, 40),
    skills: suggestions(raw.skills, 50),
    career_highlights: suggestions(raw.career_highlights, 80),
    education: suggestions(raw.education, 50),
    exhibitions: suggestions(raw.exhibitions, 100),
    awards: suggestions(raw.awards, 60),
    residencies: suggestions(raw.residencies, 60),
    representation: suggestions(raw.representation, 30),
    portfolio_projects: suggestions(raw.portfolio_projects, 80),
    artworks: suggestions(raw.artworks, 100),
    portfolio_links: suggestions(raw.portfolio_links, 30),
    missing_context: Array.from(new Set((Array.isArray(raw.missing_context) ? raw.missing_context : []).map((item) => cleanText(item, 500)).filter(Boolean))).slice(0, 30),
    evidence,
  }
}

async function loadPdf(admin: AdminClient, source: SourceRow) {
  const metadata = object(source.source_metadata) ? source.source_metadata : {}
  const bucket = metadata.storage_bucket === "artist-documents" || source.source_type === "device_document" || source.source_type === "pdf"
    ? "artist-documents"
    : "artist-assets"
  if (!source.storage_path || !source.storage_path.startsWith(`${source.artist_user_id}/`) || source.storage_path.includes("..")) throw new Error("source_unavailable")
  const { data, error } = await admin.storage.from(bucket).download(source.storage_path)
  if (error || !data) throw new Error("source_unavailable")
  if (data.size > MAX_FILE_BYTES) throw new Error("file_too_large")
  const bytes = new Uint8Array(await data.arrayBuffer())
  if (bytes.length < 5 || new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("source_unavailable")
  return bytes
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) })
  if (request.method !== "POST") return json(request, { error: "method_not_allowed" }, 405)

  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return json(request, { error: "authentication_required" }, 401)
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json(request, { error: "service_configuration_unavailable" }, 503)

  const auth = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: userData } = await auth.auth.getUser(authorization.slice("Bearer ".length))
  const user = userData.user
  if (!user) return json(request, { error: "authentication_required" }, 401)

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: role } = await admin.from("profiles").select("role").eq("id", user.id).single()
  if (role?.role !== "artist") return json(request, { error: "artist_account_required" }, 403)

  let body: JsonObject
  try {
    const parsed = await request.json()
    if (!object(parsed)) return json(request, { error: "invalid_json" }, 400)
    body = parsed
  } catch {
    return json(request, { error: "invalid_json" }, 400)
  }

  const sourceId = cleanText(body.sourceId, 100)
  const force = body.force === true
  if (!sourceId) return json(request, { error: "source_unavailable" }, 400)

  const { data: sourceData, error: sourceError } = await admin
    .from("artist_import_sources")
    .select("id,artist_user_id,label,original_filename,source_type,storage_path,mime_type,byte_size,sensitivity,analysis_consent_at,keep_without_analysis,extraction_status,page_count,source_metadata,review_summary")
    .eq("id", sourceId)
    .eq("artist_user_id", user.id)
    .is("deleted_at", null)
    .single()
  if (sourceError || !sourceData) return json(request, { error: "source_unavailable" }, 404)

  const source = sourceData as SourceRow
  if (source.mime_type !== "application/pdf") return json(request, { error: "unsupported_document_type" }, 422)
  if (source.sensitivity !== "standard") return json(request, { error: "restricted_document_not_eligible_for_profile_synthesis" }, 422)
  if (!source.analysis_consent_at || source.keep_without_analysis) return json(request, { error: "analysis_consent_required" }, 422)
  if (!["ready_for_review", "partially_extracted"].includes(source.extraction_status)) return json(request, { error: "document_analysis_required" }, 409)

  const existingSummary = object(source.review_summary) ? source.review_summary : {}
  const existing = object(existingSummary.profile_synthesis) ? existingSummary.profile_synthesis : null
  if (existing && !force && cleanText(existing.version, 100) === PROFILE_SYNTHESIS_VERSION) {
    return json(request, { synthesis: existing, cached: true, artistConfirmationRequired: true })
  }

  const apiKey = cleanText(Deno.env.get("GEMINI_API_KEY"), 4_000)
  const model = safeModel(Deno.env.get("GEMINI_DRAFT_MODEL"), DEFAULT_DRAFT_MODEL)
  if (!apiKey) return json(request, { error: "gemini_not_configured" }, 503)

  let bytes: Uint8Array
  try {
    bytes = await loadPdf(admin, source)
  } catch (reason) {
    return json(request, { error: reason instanceof Error ? reason.message : "source_unavailable" }, 422)
  }

  const pageCount = Math.max(1, Math.min(100, Number(source.page_count || object(existingSummary.document_assessment).total_pages || 1)))
  const sourceLabel = source.original_filename || source.label || "Private artist PDF"

  try {
    const provider = await runGeminiStructured<JsonObject>({
      apiKey,
      model,
      systemInstruction: systemInstruction(),
      prompt: `Build a review-ready Creative Passport synthesis from this private artist PDF.\n\nSOURCE: ${sourceLabel}\nSERVER-RECORDED PAGE COUNT: ${pageCount}\nEXISTING DOCUMENT ASSESSMENT (context only; verify against the PDF): ${JSON.stringify(existingSummary.analysis_summary || {})}\n\nRead every page. Extract enough substance that an artist can meaningfully review a proposed profile, not merely a generic summary. For career lists, include each clearly supported item up to the schema limits. If the source contains artist-authored statement language, use it as the primary basis for the artist-statement draft. Keep all outputs private and reviewable.`,
      responseSchema: synthesisSchema(),
      pdfBytes: bytes,
      timeoutMs: 88_000,
      maxOutputTokens: 30_000,
    })
    const validated = validateSynthesis(provider.output, pageCount)
    const generatedAt = new Date().toISOString()
    const synthesis = {
      ...validated,
      version: PROFILE_SYNTHESIS_VERSION,
      source_id: source.id,
      generated_at: generatedAt,
      provider: GEMINI_PROVIDER,
      model: provider.model,
      provider_request_id: provider.requestId,
      usage: provider.usage,
      artist_confirmation_required: true,
      private_until_approved: true,
      source_grounded: true,
    }
    const nextSummary = { ...existingSummary, profile_synthesis: synthesis }
    const { error: updateError } = await admin.from("artist_import_sources").update({ review_summary: nextSummary, updated_at: generatedAt }).eq("id", source.id).eq("artist_user_id", user.id)
    if (updateError) throw updateError

    await admin.from("artist_ai_usage_events").insert({
      artist_user_id: user.id,
      action: "synthesize_document_profile",
      provider: GEMINI_PROVIDER,
      model: provider.model,
      status: "succeeded",
      input_units: provider.usage.input_tokens,
      output_units: provider.usage.output_tokens,
      total_units: provider.usage.total_tokens,
      latency_ms: provider.latencyMs,
      provider_request_id: provider.requestId,
      error_code: "",
      metadata: { source_id: source.id, version: PROFILE_SYNTHESIS_VERSION, evidence_count: validated.evidence.length },
    })

    return json(request, { synthesis, cached: false, artistConfirmationRequired: true })
  } catch (reason) {
    const code = reason instanceof Error ? reason.message.split(":")[0] : "profile_synthesis_failed"
    await admin.from("artist_ai_usage_events").insert({
      artist_user_id: user.id,
      action: "synthesize_document_profile",
      provider: GEMINI_PROVIDER,
      model,
      status: "failed",
      input_units: 0,
      output_units: 0,
      total_units: 0,
      latency_ms: null,
      provider_request_id: "",
      error_code: code,
      metadata: { source_id: source.id, version: PROFILE_SYNTHESIS_VERSION },
    })
    return json(request, { error: code, message: "KLEIO could not build the Passport synthesis from this PDF." }, code === "gemini_rate_limited" ? 429 : 422)
  }
})
