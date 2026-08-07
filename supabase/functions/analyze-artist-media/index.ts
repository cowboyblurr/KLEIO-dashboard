import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.110.5"

const PROVIDER = "gemini"
const DEFAULT_MODEL = "gemini-2.5-flash"
const PROMPT_VERSION = "kleio_media_intelligence_v1"
const SCHEMA_VERSION = "media_intelligence_v1"
const MAX_SOURCE_BYTES = 50 * 1024 * 1024
const INLINE_LIMIT_BYTES = 8 * 1024 * 1024
const DAILY_MEDIA_LIMIT = 20
const ALLOWED_ORIGINS = [
  /^https:\/\/([a-z0-9-]+\.)?kleioarthouse\.com$/i,
  /^https:\/\/cowboyblurr\.github\.io$/i,
  /^http:\/\/localhost(?::\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/i,
]

const ANALYZABLE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-ms-wmv",
  "video/x-ms-asf",
  "application/vnd.ms-asf",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
])

type JsonObject = Record<string, unknown>
type AdminClient = ReturnType<typeof createClient>
type MediaKind = "image" | "video" | "audio"
type SourceRow = {
  id: string
  artist_user_id: string
  storage_path: string
  mime_type: string
  byte_size: number | null
  checksum: string
  label: string
  original_filename: string | null
  media_kind: string | null
  source_metadata: JsonObject | null
  review_summary: JsonObject | null
  deleted_at: string | null
}

type MediaAnalysis = {
  summary: string
  suggested_title: string
  suggested_description: string
  mediums_materials: string[]
  disciplines: string[]
  themes_concepts: string[]
  formal_qualities: string[]
  technical_observations: string[]
  presentation_notes: string[]
  accessibility_description: string
  application_keywords: string[]
  factual_observations: string[]
  interpretive_observations: string[]
  uncertainties: string[]
  limitations: string[]
  confidence: number
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

function object(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function cleanText(value: unknown, max = 8_000) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
    : ""
}

function cleanArray(value: unknown, maxItems = 24, maxLength = 500) {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const entry of value) {
    const cleaned = cleanText(entry, maxLength)
    const key = cleaned.toLowerCase()
    if (!cleaned || seen.has(key)) continue
    seen.add(key)
    result.push(cleaned)
    if (result.length >= maxItems) break
  }
  return result
}

function safeModel(value: unknown) {
  const model = cleanText(value, 100)
  return /^[a-z0-9][a-z0-9._-]{2,99}$/i.test(model) ? model : DEFAULT_MODEL
}

function mediaKind(source: SourceRow): MediaKind | null {
  if (source.media_kind === "image" || source.mime_type.startsWith("image/")) return "image"
  if (source.media_kind === "video" || source.mime_type.startsWith("video/") || source.mime_type === "application/vnd.ms-asf") return "video"
  if (source.media_kind === "audio" || source.mime_type.startsWith("audio/")) return "audio"
  return null
}

function base64(bytes: Uint8Array) {
  const chunk = 0x8000
  let binary = ""
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunk, bytes.length)))
  }
  return btoa(binary)
}

function schema(): JsonObject {
  const stringArray = { type: "array", items: { type: "string" } }
  return {
    type: "object",
    required: [
      "summary",
      "suggested_title",
      "suggested_description",
      "mediums_materials",
      "disciplines",
      "themes_concepts",
      "formal_qualities",
      "technical_observations",
      "presentation_notes",
      "accessibility_description",
      "application_keywords",
      "factual_observations",
      "interpretive_observations",
      "uncertainties",
      "limitations",
      "confidence",
    ],
    properties: {
      summary: { type: "string" },
      suggested_title: { type: "string" },
      suggested_description: { type: "string" },
      mediums_materials: stringArray,
      disciplines: stringArray,
      themes_concepts: stringArray,
      formal_qualities: stringArray,
      technical_observations: stringArray,
      presentation_notes: stringArray,
      accessibility_description: { type: "string" },
      application_keywords: stringArray,
      factual_observations: stringArray,
      interpretive_observations: stringArray,
      uncertainties: stringArray,
      limitations: stringArray,
      confidence: { type: "number" },
    },
  }
}

function systemInstruction() {
  return `You are KLEIO Media Intelligence, a private artist-side analysis assistant. Analyze only the supplied artist-owned media. Separate direct observation from interpretation. Never invent provenance, dates, dimensions, materials, titles, artist identity, biography, intent, exhibition history, or institutional validation. Do not identify people shown or heard. Suggested Passport language must remain clearly suggestive and artist-editable. If a medium, material, technique, theme, or title cannot be supported by the media itself, leave it out or place the uncertainty in uncertainties. Favor concise, useful language an artist could review for a Creative Passport or application.`
}

function prompt(kind: MediaKind, filename: string) {
  const kindGuidance = kind === "image"
    ? "Inspect composition, visible materials or processes when supportable, formal qualities, presentation, and accessibility description."
    : kind === "video"
      ? "Inspect visible motion, duration-dependent presentation, sound only when perceptible in the supplied file, editing or camera qualities when supportable, and accessibility description."
      : "Inspect sonic character, voice or non-voice qualities without identifying speakers, structure, texture, production qualities when supportable, and an accessibility-oriented description."
  return `Review this private ${kind} source named ${filename}. ${kindGuidance}\n\nReturn a careful analysis for the artist. factual_observations must contain only directly supportable observations. interpretive_observations may describe plausible readings but must not be presented as facts. suggested_title should be blank unless a neutral working title would genuinely help. suggested_description should be polished but conservative. application_keywords should be useful discovery/application terms, not unsupported claims. confidence must be a number from 0 to 1.`
}

function normalizeAnalysis(raw: unknown): MediaAnalysis {
  if (!object(raw)) throw new Error("invalid_media_analysis")
  const confidenceRaw = Number(raw.confidence)
  const confidence = Number.isFinite(confidenceRaw) ? Math.max(0, Math.min(1, confidenceRaw)) : 0.5
  return {
    summary: cleanText(raw.summary, 2_000),
    suggested_title: cleanText(raw.suggested_title, 180),
    suggested_description: cleanText(raw.suggested_description, 4_000),
    mediums_materials: cleanArray(raw.mediums_materials, 20, 160),
    disciplines: cleanArray(raw.disciplines, 16, 160),
    themes_concepts: cleanArray(raw.themes_concepts, 24, 220),
    formal_qualities: cleanArray(raw.formal_qualities, 24, 220),
    technical_observations: cleanArray(raw.technical_observations, 24, 260),
    presentation_notes: cleanArray(raw.presentation_notes, 20, 260),
    accessibility_description: cleanText(raw.accessibility_description, 2_000),
    application_keywords: cleanArray(raw.application_keywords, 30, 120),
    factual_observations: cleanArray(raw.factual_observations, 30, 360),
    interpretive_observations: cleanArray(raw.interpretive_observations, 24, 360),
    uncertainties: cleanArray(raw.uncertainties, 20, 360),
    limitations: cleanArray(raw.limitations, 20, 360),
    confidence,
  }
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
  if (message.includes("mime") || message.includes("format") || message.includes("unsupported")) return "unsupported_media_format"
  if (message.includes("model")) return "gemini_model_unavailable"
  return "gemini_request_failed"
}

async function startGeminiFileUpload(input: { apiKey: string; bytes: Uint8Array; mimeType: string; displayName: string }) {
  const start = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(input.apiKey)}`, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(input.bytes.byteLength),
      "X-Goog-Upload-Header-Content-Type": input.mimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: input.displayName } }),
  })
  if (!start.ok) throw new Error(providerError(start.status, await start.json().catch(() => ({})) as JsonObject))
  const uploadUrl = start.headers.get("x-goog-upload-url")
  if (!uploadUrl) throw new Error("gemini_upload_failed")

  const upload = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(input.bytes.byteLength),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
      "Content-Type": input.mimeType,
    },
    body: input.bytes,
  })
  const payload = await upload.json().catch(() => ({})) as JsonObject
  if (!upload.ok) throw new Error(providerError(upload.status, payload))
  const file = object(payload.file) ? payload.file : payload
  const name = cleanText(file.name, 300)
  const uri = cleanText(file.uri, 1_000)
  const state = cleanText(file.state, 80)
  if (!name || !uri) throw new Error("gemini_upload_failed")
  return { name, uri, state }
}

async function waitForGeminiFile(apiKey: string, file: { name: string; uri: string; state: string }) {
  if (!file.state || file.state === "ACTIVE") return file
  const started = Date.now()
  let current = file
  while (Date.now() - started < 50_000) {
    if (current.state === "ACTIVE") return current
    if (current.state === "FAILED") throw new Error("gemini_media_processing_failed")
    await new Promise((resolve) => setTimeout(resolve, 2_000))
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${current.name}?key=${encodeURIComponent(apiKey)}`)
    const payload = await response.json().catch(() => ({})) as JsonObject
    if (!response.ok) throw new Error(providerError(response.status, payload))
    current = {
      name: cleanText(payload.name, 300) || current.name,
      uri: cleanText(payload.uri, 1_000) || current.uri,
      state: cleanText(payload.state, 80),
    }
  }
  throw new Error("gemini_media_processing_timeout")
}

async function deleteGeminiFile(apiKey: string, name: string) {
  if (!name) return
  await fetch(`https://generativelanguage.googleapis.com/v1beta/${name}?key=${encodeURIComponent(apiKey)}`, { method: "DELETE" }).catch(() => undefined)
}

async function runGemini(input: { apiKey: string; model: string; kind: MediaKind; filename: string; mimeType: string; bytes: Uint8Array }) {
  const started = Date.now()
  let remoteFileName = ""
  try {
    const parts: JsonObject[] = []
    if (input.kind === "image" && input.bytes.byteLength <= INLINE_LIMIT_BYTES) {
      parts.push({ inlineData: { mimeType: input.mimeType, data: base64(input.bytes) } })
    } else {
      const uploaded = await startGeminiFileUpload({ apiKey: input.apiKey, bytes: input.bytes, mimeType: input.mimeType, displayName: input.filename })
      remoteFileName = uploaded.name
      const ready = await waitForGeminiFile(input.apiKey, uploaded)
      parts.push({ fileData: { mimeType: input.mimeType, fileUri: ready.uri } })
    }
    parts.push({ text: prompt(input.kind, input.filename) })

    const responseSchema = schema()
    const generationConfig = input.model.startsWith("gemini-3")
      ? { responseFormat: { text: { mimeType: "application/json", schema: responseSchema } }, maxOutputTokens: 12_000 }
      : { responseMimeType: "application/json", responseJsonSchema: responseSchema, maxOutputTokens: 12_000 }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": input.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction() }] },
        contents: [{ role: "user", parts }],
        generationConfig,
      }),
    })
    const payload = await response.json().catch(() => ({})) as JsonObject
    if (!response.ok) throw new Error(providerError(response.status, payload))
    const text = parseProviderText(payload)
    if (!text) throw new Error("gemini_returned_no_output")
    let parsed: unknown
    try { parsed = JSON.parse(text) } catch { throw new Error("gemini_invalid_structured_output") }
    const usage = object(payload.usageMetadata) ? payload.usageMetadata : {}
    return {
      analysis: normalizeAnalysis(parsed),
      requestId: response.headers.get("x-request-id") || response.headers.get("x-goog-request-id") || "",
      latencyMs: Date.now() - started,
      usage: {
        input_tokens: Number(usage.promptTokenCount || 0),
        output_tokens: Number(usage.candidatesTokenCount || 0),
        total_tokens: Number(usage.totalTokenCount || 0),
      },
    }
  } finally {
    if (remoteFileName) void deleteGeminiFile(input.apiKey, remoteFileName)
  }
}

async function enforceDailyLimit(admin: AdminClient, userId: string) {
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  const { count } = await admin
    .from("artist_ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("artist_user_id", userId)
    .eq("action", "analyze_media")
    .gte("created_at", start.toISOString())
    .in("status", ["succeeded", "failed"])
  if ((count ?? 0) >= DAILY_MEDIA_LIMIT) throw new Error("media_ai_daily_limit_reached")
}

async function recordUsage(admin: AdminClient, userId: string, status: "succeeded" | "failed" | "cached", input: { model: string; requestId?: string; latencyMs?: number; usage?: { input_tokens: number; output_tokens: number; total_tokens: number }; errorCode?: string; metadata: JsonObject }) {
  await admin.from("artist_ai_usage_events").insert({
    artist_user_id: userId,
    action: "analyze_media",
    provider: PROVIDER,
    model: input.model,
    status,
    input_units: input.usage?.input_tokens ?? 0,
    output_units: input.usage?.output_tokens ?? 0,
    total_units: input.usage?.total_tokens ?? 0,
    latency_ms: input.latencyMs ?? null,
    provider_request_id: input.requestId || "",
    error_code: input.errorCode || "",
    metadata: input.metadata,
  })
}

async function analyze(admin: AdminClient, userId: string, body: JsonObject) {
  const sourceId = cleanText(body.sourceId, 100)
  if (!sourceId) throw new Error("source_unavailable")
  const { data, error } = await admin
    .from("artist_import_sources")
    .select("id,artist_user_id,storage_path,mime_type,byte_size,checksum,label,original_filename,media_kind,source_metadata,review_summary,deleted_at")
    .eq("id", sourceId)
    .eq("artist_user_id", userId)
    .is("deleted_at", null)
    .single()
  if (error || !data) throw new Error("source_unavailable")
  const source = data as SourceRow
  const kind = mediaKind(source)
  if (!kind || !ANALYZABLE_MIME_TYPES.has(source.mime_type)) throw new Error("unsupported_media_format")
  if (!source.storage_path || !source.storage_path.startsWith(`${userId}/`) || source.storage_path.includes("..")) throw new Error("source_unavailable")
  if (source.byte_size && source.byte_size > MAX_SOURCE_BYTES) throw new Error("media_file_too_large")

  const model = safeModel(Deno.env.get("GEMINI_MEDIA_MODEL"))
  const apiKey = cleanText(Deno.env.get("GEMINI_API_KEY"), 4_000)
  if (!apiKey) throw new Error("gemini_not_configured")
  const existingSummary = object(source.review_summary) ? source.review_summary : {}
  const existingAnalysis = object(existingSummary.media_analysis) ? existingSummary.media_analysis : null
  const force = body.force === true
  if (!force && existingAnalysis && cleanText(existingAnalysis.source_checksum, 200) === source.checksum && cleanText(existingAnalysis.prompt_version, 100) === PROMPT_VERSION && cleanText(existingAnalysis.model, 120) === model) {
    await recordUsage(admin, userId, "cached", { model, metadata: { source_id: source.id, media_kind: kind } })
    return { sourceId: source.id, analysis: existingAnalysis, cached: true }
  }

  await enforceDailyLimit(admin, userId)
  const bucket = object(source.source_metadata) && source.source_metadata.storage_bucket === "artist-assets" ? "artist-assets" : "artist-assets"
  const { data: file, error: downloadError } = await admin.storage.from(bucket).download(source.storage_path)
  if (downloadError || !file) throw new Error("source_unavailable")
  if (file.size > MAX_SOURCE_BYTES) throw new Error("media_file_too_large")
  const bytes = new Uint8Array(await file.arrayBuffer())
  const now = new Date().toISOString()

  try {
    const provider = await runGemini({
      apiKey,
      model,
      kind,
      filename: source.original_filename || source.label || `Private ${kind}`,
      mimeType: source.mime_type,
      bytes,
    })
    const analysis = {
      ...provider.analysis,
      provider: PROVIDER,
      model,
      media_kind: kind,
      mime_type: source.mime_type,
      source_checksum: source.checksum,
      prompt_version: PROMPT_VERSION,
      schema_version: SCHEMA_VERSION,
      analyzed_at: now,
      artist_confirmation_required: true,
      private_analysis: true,
    }
    const reviewSummary = { ...existingSummary, media_analysis: analysis }
    const { error: updateError } = await admin.from("artist_import_sources").update({
      analysis_consent_at: now,
      keep_without_analysis: false,
      extraction_status: "review_ready",
      extraction_method: "gemini_media_v1",
      extraction_version: `${PROMPT_VERSION}:${SCHEMA_VERSION}:${model}`,
      extracted_at: now,
      analysis_stage: "review_ready",
      last_error_category: "",
      review_summary: reviewSummary,
      updated_at: now,
    }).eq("id", source.id).eq("artist_user_id", userId)
    if (updateError) throw updateError
    await recordUsage(admin, userId, "succeeded", {
      model,
      requestId: provider.requestId,
      latencyMs: provider.latencyMs,
      usage: provider.usage,
      metadata: { source_id: source.id, media_kind: kind, mime_type: source.mime_type, byte_size: bytes.byteLength, prompt_version: PROMPT_VERSION },
    })
    return { sourceId: source.id, analysis, cached: false }
  } catch (reason) {
    const code = reason instanceof Error ? cleanText(reason.message, 120) || "media_analysis_failed" : "media_analysis_failed"
    await admin.from("artist_import_sources").update({ analysis_consent_at: now, last_error_category: code, updated_at: now }).eq("id", source.id).eq("artist_user_id", userId)
    await recordUsage(admin, userId, "failed", { model, errorCode: code, metadata: { source_id: source.id, media_kind: kind, mime_type: source.mime_type, byte_size: bytes.byteLength } })
    throw new Error(code)
  }
}

function stableError(reason: unknown) {
  const code = reason instanceof Error ? cleanText(reason.message, 160).split(":")[0] : "media_analysis_failed"
  const allowed = new Set([
    "source_unavailable",
    "unsupported_media_format",
    "media_file_too_large",
    "media_ai_daily_limit_reached",
    "gemini_not_configured",
    "gemini_authentication_failed",
    "gemini_rate_limited",
    "gemini_provider_unavailable",
    "gemini_model_unavailable",
    "gemini_upload_failed",
    "gemini_media_processing_failed",
    "gemini_media_processing_timeout",
    "gemini_returned_no_output",
    "gemini_invalid_structured_output",
    "gemini_request_failed",
    "invalid_media_analysis",
  ])
  return allowed.has(code) ? code : "media_analysis_failed"
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
  if (!userData.user) return json(request, { error: "authentication_required" }, 401)

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: role } = await admin.from("profiles").select("role").eq("id", userData.user.id).single()
  if (role?.role !== "artist") return json(request, { error: "artist_account_required" }, 403)

  let body: JsonObject
  try {
    const parsed = await request.json()
    if (!object(parsed)) return json(request, { error: "invalid_json" }, 400)
    body = parsed
  } catch {
    return json(request, { error: "invalid_json" }, 400)
  }

  try {
    return json(request, await analyze(admin, userData.user.id, body))
  } catch (reason) {
    const code = stableError(reason)
    const message = code === "media_ai_daily_limit_reached"
      ? "Your daily media-analysis limit has been reached. Your private media remains available."
      : code === "media_file_too_large"
        ? "This source can stay in your Media Library, but it is larger than the current 50 MB analysis limit."
        : code === "unsupported_media_format"
          ? "This media format can be stored in KLEIO but is not yet supported by Media Intelligence."
          : "KLEIO could not complete this media analysis. The original private source remains available."
    const status = code === "media_ai_daily_limit_reached" || code === "gemini_rate_limited" ? 429 : code === "source_unavailable" ? 404 : 422
    return json(request, { error: code, message }, status)
  }
})
