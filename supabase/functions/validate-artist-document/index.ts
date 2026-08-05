import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.110.5"
import { extractText, getDocumentProxy } from "npm:unpdf@1.6.2"

const MAX_FILE_BYTES = 15 * 1024 * 1024
const MAX_PAGES = 100
const ALLOWED_ORIGINS = [
  /^https:\/\/([a-z0-9-]+\.)?kleioarthouse\.com$/i,
  /^https:\/\/cowboyblurr\.github\.io$/i,
  /^http:\/\/localhost(?::\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/i,
]

type JsonObject = Record<string, unknown>

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

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

async function sha256(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("")
}

function pdfRiskFlags(bytes: Uint8Array) {
  const sample = new TextDecoder("latin1").decode(bytes)
  const flags: string[] = []
  if (/\/JavaScript\b|\/JS\b/.test(sample)) flags.push("embedded_javascript")
  if (/\/Launch\b/.test(sample)) flags.push("launch_action")
  if (/\/EmbeddedFile\b/.test(sample)) flags.push("embedded_file")
  if (/\/OpenAction\b/.test(sample)) flags.push("open_action")
  return flags
}

function pdfErrorCode(reason: unknown) {
  const message = reason instanceof Error ? reason.message.toLowerCase() : ""
  if (message.includes("password")) return "password_protected_pdf"
  if (message.includes("invalid") || message.includes("format") || message.includes("pdf")) return "corrupt_or_unsupported_pdf"
  return "corrupt_or_unsupported_pdf"
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

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const token = authorization.slice("Bearer ".length)
  const { data: userData, error: userError } = await authClient.auth.getUser(token)
  if (userError || !userData.user) return json(request, { error: "authentication_required" }, 401)

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: roleRow } = await admin.from("profiles").select("role").eq("id", userData.user.id).single()
  if (roleRow?.role !== "artist") return json(request, { error: "artist_account_required" }, 403)

  let body: JsonObject
  try {
    const parsed = await request.json()
    if (!isObject(parsed)) return json(request, { error: "invalid_json" }, 400)
    body = parsed
  } catch {
    return json(request, { error: "invalid_json" }, 400)
  }

  const sourceId = typeof body.sourceId === "string" ? body.sourceId : ""
  if (!sourceId) return json(request, { error: "source_id_required" }, 400)

  const { data: source, error: sourceError } = await admin
    .from("artist_import_sources")
    .select("id,artist_user_id,source_type,storage_path,mime_type,byte_size,checksum,source_metadata,review_summary,deleted_at")
    .eq("id", sourceId)
    .eq("artist_user_id", userData.user.id)
    .is("deleted_at", null)
    .single()
  if (sourceError || !source) return json(request, { error: "source_unavailable" }, 404)
  if (source.mime_type !== "application/pdf") return json(request, { error: "unsupported_file" }, 415)
  if (!source.storage_path || !source.storage_path.startsWith(`${userData.user.id}/`) || source.storage_path.includes("..")) {
    return json(request, { error: "source_unavailable" }, 404)
  }

  const metadata = isObject(source.source_metadata) ? source.source_metadata : {}
  const bucket = metadata.storage_bucket === "artist-documents" || source.source_type === "device_document"
    ? "artist-documents"
    : "artist-assets"
  const { data: object, error: downloadError } = await admin.storage.from(bucket).download(source.storage_path)
  if (downloadError || !object) return json(request, { error: "source_unavailable" }, 404)
  if (object.size <= 0) return json(request, { error: "empty_document" }, 422)
  if (object.size > MAX_FILE_BYTES) return json(request, { error: "file_too_large" }, 413)

  const bytes = new Uint8Array(await object.arrayBuffer())
  if (bytes.length < 5 || new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
    return json(request, { error: "invalid_pdf_signature" }, 422)
  }

  const calculatedChecksum = await sha256(bytes)
  if (source.checksum && source.checksum !== calculatedChecksum) {
    return json(request, { error: "checksum_mismatch" }, 409)
  }

  const riskFlags = pdfRiskFlags(bytes)
  if (riskFlags.some((flag) => ["embedded_javascript", "launch_action", "embedded_file"].includes(flag))) {
    await admin.from("artist_import_sources").update({
      analysis_stage: "failed",
      last_error_category: "unsafe_pdf_active_content",
      review_summary: {
        ...(isObject(source.review_summary) ? source.review_summary : {}),
        validation_completed: false,
        risk_flags: riskFlags,
        malware_scanner_configured: false,
        original_source_preserved: true,
      },
      updated_at: new Date().toISOString(),
    }).eq("id", source.id).eq("artist_user_id", userData.user.id)
    return json(request, { error: "unsafe_pdf_active_content" }, 422)
  }

  try {
    const pdf = await getDocumentProxy(bytes)
    const pageCount = Number(pdf.numPages || 0)
    if (!pageCount) return json(request, { error: "empty_document" }, 422)
    if (pageCount > MAX_PAGES) return json(request, { error: "too_many_pages", pageCount, maxPages: MAX_PAGES }, 422)

    const extracted = await extractText(pdf, { mergePages: false })
    const pages = Array.isArray(extracted.text) ? extracted.text : [extracted.text]
    const pageCharacters = pages.map((page) => String(page || "").replace(/\s+/g, " ").trim().length)
    const readablePages = pageCharacters.filter((count) => count >= 20).length
    const totalCharacters = pageCharacters.reduce((sum, count) => sum + count, 0)
    const textLayerStatus = totalCharacters === 0
      ? "unavailable"
      : readablePages < pageCount
        ? "partial"
        : "available"
    const ocrRequired = textLayerStatus === "unavailable"

    await admin.from("artist_import_sources").update({
      checksum: calculatedChecksum,
      byte_size: object.size,
      page_count: pageCount,
      text_layer_status: textLayerStatus,
      ocr_status: ocrRequired ? "not_configured" : "not_required",
      analysis_stage: "identifying_information",
      last_error_category: ocrRequired ? "ocr_required" : "",
      review_summary: {
        ...(isObject(source.review_summary) ? source.review_summary : {}),
        validation_completed: true,
        server_signature_validated: true,
        server_checksum_validated: true,
        page_count_limit_validated: true,
        total_pages: pageCount,
        readable_pages: readablePages,
        text_layer_available: textLayerStatus !== "unavailable",
        text_layer_status: textLayerStatus,
        ocr_required: ocrRequired,
        risk_flags: riskFlags,
        malware_scanner_configured: false,
        active_content_screened: true,
        original_source_preserved: true,
      },
      updated_at: new Date().toISOString(),
    }).eq("id", source.id).eq("artist_user_id", userData.user.id)

    return json(request, {
      sourceId: source.id,
      pageCount,
      checksum: calculatedChecksum,
      textLayerStatus,
      ocrRequired,
      malwareScannerConfigured: false,
      activeContentScreened: true,
    })
  } catch (reason) {
    const error = pdfErrorCode(reason)
    await admin.from("artist_import_sources").update({
      analysis_stage: "failed",
      last_error_category: error,
      review_summary: {
        ...(isObject(source.review_summary) ? source.review_summary : {}),
        validation_completed: false,
        error_category: error,
        original_source_preserved: true,
      },
      updated_at: new Date().toISOString(),
    }).eq("id", source.id).eq("artist_user_id", userData.user.id)
    return json(request, { error }, 422)
  }
})
