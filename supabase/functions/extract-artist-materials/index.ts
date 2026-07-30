import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.110.5"
// pdf-parse is used only inside this authenticated server boundary.
// @ts-ignore The package is CommonJS and does not publish Deno types.
import pdfParse from "npm:pdf-parse@1.1.1"

const MAX_PDF_BYTES = 15 * 1024 * 1024
const MAX_TEXT_CHARS = 120_000
const ALLOWED_ORIGINS = [
  /^https:\/\/([a-z0-9-]+\.)?kleioarthouse\.com$/i,
  /^https:\/\/cowboyblurr\.github\.io$/i,
  /^http:\/\/localhost(?::\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/i,
]

const FIELD_HEADINGS: Array<[string, RegExp]> = [
  ["bio", /^(short\s+)?bio(graphy)?$/i],
  ["artist_statement", /^artist('?s)?\s+statement$/i],
  ["practice_description", /^(artistic\s+)?practice(\s+description)?$/i],
  ["education", /^(education|training|qualifications)$/i],
  ["exhibition_history", /^(selected\s+)?(exhibitions?|shows?)$/i],
  ["awards", /^(awards?|grants?|honou?rs?|fellowships?)$/i],
]

const DISCIPLINE_TERMS = [
  "painting", "drawing", "sculpture", "photography", "film", "video", "ceramics", "printmaking",
  "installation", "performance", "sound art", "textile", "fashion", "design", "illustration", "digital media",
  "new media", "mixed media", "music", "dance", "theatre", "architecture", "writing", "curating",
]

const MEDIUM_TERMS = [
  "oil", "acrylic", "watercolor", "ink", "charcoal", "clay", "porcelain", "stoneware", "wood", "metal",
  "bronze", "glass", "textile", "fabric", "video", "film", "photography", "sound", "paper", "found objects",
  "digital", "3d", "collage", "print", "screenprint", "lithography",
]

type Proposal = {
  target_field: string
  proposed_value: string
  evidence_excerpt: string
  extraction_method: string
  confidence: number
  status: "proposed" | "needs_clarification"
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

function normalizedText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, MAX_TEXT_CHARS)
}

async function sha256(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

function headingField(line: string) {
  const cleaned = line.trim().replace(/[:—–-]+$/, "").trim()
  for (const [field, pattern] of FIELD_HEADINGS) if (pattern.test(cleaned)) return field
  return null
}

function extractSections(text: string) {
  const lines = text.split("\n")
  const sections = new Map<string, string[]>()
  let activeField: string | null = null
  for (const rawLine of lines) {
    const field = headingField(rawLine)
    if (field) {
      activeField = field
      if (!sections.has(field)) sections.set(field, [])
      continue
    }
    if (activeField) sections.get(activeField)?.push(rawLine)
  }
  return sections
}

function findTerms(text: string, terms: string[]) {
  const lower = text.toLowerCase()
  return terms.filter((term) => new RegExp(`(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i").test(lower))
}

function proposal(field: string, value: string, confidence: number, status: Proposal["status"] = "proposed"): Proposal | null {
  const cleaned = normalizedText(value)
  if (!cleaned) return null
  return {
    target_field: field,
    proposed_value: cleaned.slice(0, 20_000),
    evidence_excerpt: cleaned.slice(0, 900),
    extraction_method: "deterministic_headings_v1",
    confidence,
    status,
  }
}

function classify(text: string): Proposal[] {
  const proposals: Proposal[] = []
  const sections = extractSections(text)
  for (const [field, lines] of sections) {
    const next = proposal(field, lines.join("\n").trim(), 0.94)
    if (next) proposals.push(next)
  }

  const disciplines = findTerms(text, DISCIPLINE_TERMS)
  if (disciplines.length) {
    const next = proposal("disciplines", disciplines.map((term) => term.replace(/\b\w/g, (letter) => letter.toUpperCase())).join(", "), 0.78)
    if (next) proposals.push(next)
  }

  const mediums = findTerms(text, MEDIUM_TERMS)
  if (mediums.length) {
    const next = proposal("mediums", mediums.map((term) => term.replace(/\b\w/g, (letter) => letter.toUpperCase())).join(", "), 0.72)
    if (next) proposals.push(next)
  }

  const website = text.match(/https:\/\/[^\s<>()]+/i)?.[0]?.replace(/[.,;:)]+$/, "")
  if (website) {
    const next = proposal("website_url", website, 0.98)
    if (next) proposals.push(next)
  }

  if (!proposals.some((item) => ["bio", "artist_statement", "practice_description"].includes(item.target_field))) {
    const firstNarrative = text.split(/\n\s*\n/).map((part) => part.trim()).find((part) => part.length >= 180 && part.length <= 5000)
    if (firstNarrative) {
      const next = proposal("practice_description", firstNarrative, 0.45, "needs_clarification")
      if (next) proposals.push(next)
    }
  }

  const seen = new Set<string>()
  return proposals.filter((item) => {
    const key = `${item.target_field}:${item.proposed_value.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 24)
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

  const token = authorization.slice("Bearer ".length)
  const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } })
  const { data: userData, error: userError } = await authClient.auth.getUser(token)
  if (userError || !userData.user) return json(request, { error: "authentication_required" }, 401)
  const user = userData.user

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: roleRow } = await admin.from("profiles").select("role").eq("id", user.id).single()
  if (roleRow?.role !== "artist") return json(request, { error: "artist_account_required" }, 403)

  let input: Record<string, unknown>
  try {
    input = await request.json()
  } catch {
    return json(request, { error: "invalid_json" }, 400)
  }

  const sourceType = input.sourceType
  const label = typeof input.label === "string" ? input.label.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 180) : ""
  let text = ""
  let checksumInput: Uint8Array | string = ""
  let storagePath = ""
  let mimeType = ""
  let byteSize: number | null = null

  if (sourceType === "pasted_text") {
    if (typeof input.text !== "string" || !input.text.trim()) return json(request, { error: "text_required" }, 400)
    text = normalizedText(input.text)
    if (text.length > MAX_TEXT_CHARS) return json(request, { error: "text_too_large" }, 413)
    checksumInput = text
    mimeType = "text/plain"
    byteSize = new TextEncoder().encode(text).byteLength
  } else if (sourceType === "pdf") {
    storagePath = typeof input.storagePath === "string" ? input.storagePath : ""
    if (!storagePath.startsWith(`${user.id}/`) || storagePath.includes("..")) return json(request, { error: "invalid_storage_path" }, 400)
    const { data: pdfObject, error: downloadError } = await admin.storage.from("artist-documents").download(storagePath)
    if (downloadError || !pdfObject) return json(request, { error: "source_unavailable" }, 404)
    if (pdfObject.type !== "application/pdf") return json(request, { error: "unsupported_mime_type" }, 415)
    const bytes = new Uint8Array(await pdfObject.arrayBuffer())
    if (bytes.byteLength > MAX_PDF_BYTES) return json(request, { error: "file_too_large" }, 413)
    if (bytes.length < 5 || new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") return json(request, { error: "invalid_pdf_signature" }, 415)
    checksumInput = bytes
    mimeType = "application/pdf"
    byteSize = bytes.byteLength
    try {
      const parsed = await pdfParse(bytes)
      text = normalizedText(parsed?.text ?? "")
    } catch {
      text = ""
    }
  } else {
    return json(request, { error: "unsupported_source_type" }, 400)
  }

  const checksum = await sha256(checksumInput)
  const proposals = text ? classify(text) : []
  const extractionStatus = text ? (proposals.length ? "completed" : "partial") : "failed"

  const { data: existing } = await admin
    .from("artist_import_sources")
    .select("id,extraction_status")
    .eq("artist_user_id", user.id)
    .eq("checksum", checksum)
    .maybeSingle()

  let sourceId = existing?.id as string | undefined
  if (!sourceId) {
    const { data: inserted, error: sourceError } = await admin.from("artist_import_sources").insert({
      artist_user_id: user.id,
      source_type: sourceType,
      label: label || (sourceType === "pdf" ? "Imported PDF" : "Pasted artist material"),
      storage_path: storagePath,
      mime_type: mimeType,
      byte_size: byteSize,
      checksum,
      extraction_status: extractionStatus,
      extraction_method: "deterministic_headings_v1",
      extracted_at: new Date().toISOString(),
    }).select("id").single()
    if (sourceError || !inserted) return json(request, { error: "source_record_failed" }, 500)
    sourceId = inserted.id
  } else {
    await admin.from("artist_import_sources").update({ extraction_status: extractionStatus, extracted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", sourceId).eq("artist_user_id", user.id)
    await admin.from("artist_import_proposals").delete().eq("source_id", sourceId).eq("artist_user_id", user.id).in("status", ["proposed", "needs_clarification", "extraction_failed", "source_unavailable"])
  }

  if (proposals.length) {
    const { error: proposalError } = await admin.from("artist_import_proposals").insert(proposals.map((item) => ({ ...item, source_id: sourceId, artist_user_id: user.id })))
    if (proposalError) return json(request, { error: "proposal_record_failed" }, 500)
  } else {
    const status = text ? "needs_clarification" : "extraction_failed"
    await admin.from("artist_import_proposals").insert({
      source_id: sourceId,
      artist_user_id: user.id,
      target_field: "practice_description",
      proposed_value: text.slice(0, 20_000) || "No extractable text was found in this source.",
      evidence_excerpt: text.slice(0, 900),
      extraction_method: "deterministic_headings_v1",
      confidence: text ? 0.2 : 0,
      status,
    })
  }

  return json(request, { sourceId, proposalCount: proposals.length, extractionStatus })
})
