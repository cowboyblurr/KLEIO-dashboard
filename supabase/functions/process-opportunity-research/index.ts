import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.110.5"

type Job = {
  message_id: number
  job_id: string
  session_id: string
  opportunity_id: string
  artist_user_id: string
  attempt_count: number
}

type SourceCandidate = {
  url: string
  role: string
  authority: "official" | "organization"
}

type SourceResult = SourceCandidate & {
  final_url: string
  status: "fetched" | "blocked" | "unavailable" | "unsupported" | "error"
  title: string
  content_type: string
  checksum: string
  etag: string
  last_modified: string
  redirect_chain: string[]
  robots_status: string
  text: string
  bytes: Uint8Array
  note: string
}

type Finding = Record<string, unknown>

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const USER_AGENT = "KLEIO-OpportunityResearch/2.0 (+public-source verification)"
const PARSER_VERSION = "kleio-core-parser-v2"
const MAX_SOURCE_BYTES = 1_500_000
const MAX_PDF_BYTES = 10_485_760
const MAX_SOURCES = 8
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type,x-kleio-sync-token",
  "access-control-allow-methods": "POST,OPTIONS",
}

const MATERIALS = [
  ["biography", "Artist biography", "written_material", "bio", "text", ["biography", "artist bio", "biografía", "semblanza"]],
  ["artist_statement", "Artist statement", "written_material", "artist_statement", "text", ["artist statement", "statement of practice", "declaración de artista"]],
  ["cv", "Curriculum vitae or résumé", "supporting_document", "cv", "file", ["curriculum vitae", "résumé", "resume", "hoja de vida"]],
  ["portfolio", "Portfolio or work samples", "portfolio", "portfolio", "file_collection", ["portfolio", "work samples", "artwork images", "portafolio"]],
  ["project_proposal", "Project proposal", "written_material", "", "text", ["project proposal", "proposal narrative", "propuesta de proyecto"]],
  ["budget", "Project budget", "financial", "", "structured", ["project budget", "detailed budget", "presupuesto del proyecto"]],
  ["timeline", "Project timeline or work plan", "planning", "", "structured", ["project timeline", "work plan", "cronograma"]],
  ["declaration", "Declaration or certification", "declaration", "", "confirmation", ["certify that", "declaration", "signature required", "declaración responsable"]],
] as const

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  })
}

function clean(value: string, maximum = 2_000) {
  return value.replace(/\s+/g, " ").trim().slice(0, maximum)
}

async function sha256(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

function privateAddress(value: string) {
  const ipv4 = value.split(".").map(Number)
  if (ipv4.length === 4) {
    return ipv4[0] === 10 || ipv4[0] === 127 || ipv4[0] === 0 ||
      (ipv4[0] === 169 && ipv4[1] === 254) ||
      (ipv4[0] === 172 && ipv4[1] >= 16 && ipv4[1] <= 31) ||
      (ipv4[0] === 192 && ipv4[1] === 168) || ipv4[0] >= 224
  }
  const ipv6 = value.toLowerCase()
  return ipv6 === "::1" || ipv6 === "::" || ipv6.startsWith("fc") || ipv6.startsWith("fd") || /^fe[89ab]/.test(ipv6)
}

function publicUrl(value: unknown) {
  try {
    const url = new URL(typeof value === "string" ? value : "")
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null
    if (url.port && !["80", "443"].includes(url.port)) return null
    const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase()
    if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".localhost")) return null
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) && privateAddress(host)) return null
    if (host.includes(":") && privateAddress(host)) return null
    url.hash = ""
    return url
  } catch {
    return null
  }
}

async function verifyDns(url: URL) {
  const host = url.hostname.replace(/^\[|\]$/g, "")
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.includes(":")) {
    if (privateAddress(host)) throw new Error("private_network_target")
    return
  }

  const addresses: string[] = []
  for (const type of ["A", "AAAA"] as const) {
    try { addresses.push(...await Deno.resolveDns(host, type)) } catch { /* one family may be absent */ }
  }
  if (!addresses.length) throw new Error("dns_resolution_failed")
  if (addresses.some(privateAddress)) throw new Error("private_network_target")
}

async function readBody(responseValue: Response, maximum: number) {
  const reader = responseValue.body?.getReader()
  if (!reader) return new Uint8Array()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const current = await reader.read()
    if (current.done) break
    total += current.value.byteLength
    if (total > maximum) {
      await reader.cancel()
      throw new Error("response_too_large")
    }
    chunks.push(current.value)
  }
  const result = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

async function fetchPublic(initial: URL, maximum: number) {
  let current = initial
  const redirects: string[] = []
  for (let redirectCount = 0; redirectCount <= 5; redirectCount++) {
    await verifyDns(current)
    const fetched = await fetch(current, {
      redirect: "manual",
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/json,application/xml,text/plain,application/pdf;q=0.9,*/*;q=0.1",
      },
      signal: AbortSignal.timeout(18_000),
    })
    if ([301, 302, 303, 307, 308].includes(fetched.status)) {
      const next = publicUrl(new URL(fetched.headers.get("location") ?? "", current).toString())
      if (!next) throw new Error("unsafe_redirect")
      redirects.push(next.toString())
      current = next
      continue
    }
    return { response: fetched, bytes: await readBody(fetched, maximum), finalUrl: current, redirects }
  }
  throw new Error("redirect_limit_exceeded")
}

function robotsDisallows(content: string, path: string) {
  let active = false
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim()
    const separator = line.indexOf(":")
    if (separator < 0) continue
    const field = line.slice(0, separator).toLowerCase()
    const value = line.slice(separator + 1).trim()
    if (field === "user-agent") active = value === "*" || value.toLowerCase().includes("kleio")
    if (active && field === "disallow" && value && path.startsWith(value)) return true
  }
  return false
}

async function inspectRobots(url: URL) {
  try {
    const fetched = await fetchPublic(new URL("/robots.txt", url.origin), 250_000)
    if (!fetched.response.ok) return "not_available"
    return robotsDisallows(new TextDecoder().decode(fetched.bytes), `${url.pathname}${url.search}`) ? "disallowed" : "allowed"
  } catch {
    return "unavailable"
  }
}

function stripMarkup(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/(?:p|div|li|h[1-6]|section|article|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
}

function sameOrganization(left: URL, right: URL) {
  const first = left.hostname.toLowerCase().replace(/^www\./, "")
  const second = right.hostname.toLowerCase().replace(/^www\./, "")
  return first === second || first.endsWith(`.${second}`) || second.endsWith(`.${first}`)
}

async function acquire(candidate: SourceCandidate, officialRoot: URL | null): Promise<SourceResult> {
  const url = publicUrl(candidate.url)
  if (!url) return { ...candidate, final_url: candidate.url, status: "blocked", title: "", content_type: "", checksum: "", etag: "", last_modified: "", redirect_chain: [], robots_status: "invalid", text: "", bytes: new Uint8Array(), note: "Unsafe URL." }
  const robots = await inspectRobots(url)
  const authority = officialRoot && sameOrganization(url, officialRoot) ? "official" : "organization"
  if (robots === "disallowed") return { ...candidate, authority, final_url: url.toString(), status: "blocked", title: "", content_type: "", checksum: "", etag: "", last_modified: "", redirect_chain: [], robots_status: robots, text: "", bytes: new Uint8Array(), note: "Automated access is disallowed." }

  try {
    const fetched = await fetchPublic(url, url.pathname.toLowerCase().endsWith(".pdf") ? MAX_PDF_BYTES : MAX_SOURCE_BYTES)
    const contentType = (fetched.response.headers.get("content-type") ?? "").toLowerCase()
    const sum = await sha256(fetched.bytes)
    const base = { ...candidate, authority, final_url: fetched.finalUrl.toString(), content_type: contentType, checksum: sum, etag: fetched.response.headers.get("etag") ?? "", last_modified: fetched.response.headers.get("last-modified") ?? "", redirect_chain: fetched.redirects, robots_status: robots }
    if (!fetched.response.ok) return { ...base, status: [401, 403].includes(fetched.response.status) ? "blocked" : "unavailable", title: "", text: "", bytes: new Uint8Array(), note: `HTTP ${fetched.response.status}` }

    const isPdf = fetched.bytes.length >= 5 && new TextDecoder().decode(fetched.bytes.slice(0, 5)) === "%PDF-"
    if (contentType.includes("pdf") || isPdf) {
      return { ...base, status: isPdf ? "fetched" : "unsupported", title: fetched.finalUrl.pathname.split("/").pop() ?? "PDF", text: "", bytes: isPdf ? fetched.bytes : new Uint8Array(), note: isPdf ? "" : "PDF signature mismatch." }
    }

    const raw = new TextDecoder().decode(fetched.bytes)
    if (/(captcha|verify you are human|sign in to continue|access denied|enable javascript)/i.test(raw.slice(0, 120_000))) {
      return { ...base, status: "blocked", title: "", text: "", bytes: new Uint8Array(), note: "Login or human verification is required." }
    }
    if (!(contentType.includes("html") || contentType.includes("json") || contentType.includes("xml") || contentType.startsWith("text/") || !contentType)) {
      return { ...base, status: "unsupported", title: "", text: "", bytes: new Uint8Array(), note: "Unsupported content type." }
    }
    return {
      ...base,
      status: "fetched",
      title: clean(stripMarkup(raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""), 240),
      text: (contentType.includes("html") ? stripMarkup(raw) : raw).slice(0, 750_000),
      bytes: fetched.bytes,
      note: "",
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "source_fetch_failed"
    return { ...candidate, authority, final_url: url.toString(), status: ["private_network_target", "unsafe_redirect"].includes(message) ? "blocked" : message === "response_too_large" ? "unsupported" : "error", title: "", content_type: "", checksum: "", etag: "", last_modified: "", redirect_chain: [], robots_status: robots, text: "", bytes: new Uint8Array(), note: clean(message, 500) }
  }
}

function sentences(value: string) {
  return value.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)?.map((sentence) => sentence.trim()).filter((sentence) => sentence.length >= 20) ?? []
}

function extract(sourceText: string, source: { versionId: string; url: string; title: string; authority: string }) {
  const findings: Finding[] = []
  const official = source.authority === "official"
  for (const definition of MATERIALS) {
    const [key, label, category, passportField, inputType, terms] = definition
    for (const sentence of sentences(sourceText).filter((row) => /(must|required|submit|provide|include|upload|attach|deber[áa]|obligatori|requisito|presentar|adjuntar|incluir)/i.test(row) && terms.some((term) => row.toLowerCase().includes(term))).slice(0, 2)) {
      findings.push({ finding_type: "requirement", normalized_key: key, label, original_text: clean(sentence), normalized_value: { category, passport_field: passportField, input_type: inputType }, confidence_status: official ? "verified" : "likely", confidence_score: official ? 0.92 : 0.58, source_url: source.url, source_title: source.title, official_source: official, accepted: official, source_version_id: source.versionId, document_id: null, page_id: null, evidence_location: "Public source section", extraction_method: "deterministic", parser_version: PARSER_VERSION, conflict_status: "none", finding_scope: "canonical_candidate", human_approved: false })
    }
  }
  for (const sentence of sentences(sourceText)) {
    const evidence = { original_text: clean(sentence), normalized_value: {}, confidence_status: official ? "verified" : "likely", confidence_score: official ? 0.92 : 0.58, source_url: source.url, source_title: source.title, official_source: official, accepted: false, source_version_id: source.versionId, document_id: null, page_id: null, evidence_location: "Public source section", extraction_method: "deterministic", parser_version: PARSER_VERSION, conflict_status: "none", finding_scope: "session", human_approved: false }
    if (/(eligible|eligibility|applicants must|open to|ineligible|elegible)/i.test(sentence)) findings.push({ finding_type: "eligibility", normalized_key: "eligibility", label: "Eligibility information", ...evidence })
    if (/(deadline|due by|applications close|fecha l[ií]mite)/i.test(sentence) && /\d/.test(sentence)) findings.push({ finding_type: "deadline", normalized_key: "deadline", label: "Deadline information", ...evidence })
  }
  return findings
}

async function updateStage(client: SupabaseClient, job: Job, stage: string, progress: number, message: string, complete = false) {
  const now = new Date().toISOString()
  await client.from("opportunity_research_steps").update({ status: "completed", completed_at: now }).eq("session_id", job.session_id).eq("status", "running").neq("step_key", stage)
  await client.from("opportunity_research_jobs").update({ current_stage: stage }).eq("id", job.job_id)
  await client.from("opportunity_research_sessions").update({ status: stage, current_stage: stage, progress_percent: progress }).eq("id", job.session_id)
  await client.from("opportunity_research_steps").update(complete ? { status: "completed", user_message: message, completed_at: now } : { status: "running", user_message: message, started_at: now }).eq("session_id", job.session_id).eq("step_key", stage)
}

async function versionSource(client: SupabaseClient, job: Job, source: SourceResult) {
  const { data: researchSource, error } = await client.from("opportunity_research_sources").upsert({ session_id: job.session_id, opportunity_id: job.opportunity_id, url: source.url, title: source.title, source_role: source.role, authority_status: source.authority, access_status: source.status, content_type: source.content_type, checked_at: new Date().toISOString(), notes: source.note, etag: source.etag, last_modified: source.last_modified, checksum: source.checksum, final_url: source.final_url, redirect_chain: source.redirect_chain, robots_status: source.robots_status, fetch_method: "direct" }, { onConflict: "session_id,url" }).select("id").single()
  if (error) throw error
  if (source.status !== "fetched" || !source.checksum) return ""

  const { data: current } = await client.from("opportunity_source_versions").select("id,checksum").eq("opportunity_id", job.opportunity_id).eq("source_url", source.url).eq("is_current", true).limit(1).maybeSingle()
  if (current?.checksum === source.checksum) return String(current.id)
  if (current?.id) await client.from("opportunity_source_versions").update({ is_current: false }).eq("id", current.id)
  const { data: version, error: versionError } = await client.from("opportunity_source_versions").insert({ opportunity_id: job.opportunity_id, session_id: job.session_id, research_source_id: researchSource.id, source_url: source.url, final_url: source.final_url, source_role: source.role, authority_status: source.authority, content_type: source.content_type, checksum: source.checksum, etag: source.etag, last_modified: source.last_modified, redirect_chain: source.redirect_chain, robots_status: source.robots_status, fetch_status: "fetched", parser_version: PARSER_VERSION, is_current: true, supersedes_id: current?.id ?? null }).select("id").single()
  if (versionError) throw versionError
  await client.from("opportunity_research_sources").update({ source_version_id: version.id }).eq("id", researchSource.id)
  return String(version.id)
}

async function preservePdf(client: SupabaseClient, job: Job, source: SourceResult, sourceVersionId: string) {
  const storagePath = `${job.opportunity_id}/${job.session_id}/${source.checksum}.pdf`
  const upload = await client.storage.from("opportunity-source-documents").upload(storagePath, source.bytes, { contentType: "application/pdf", upsert: false })
  if (upload.error && !/already exists/i.test(upload.error.message)) throw upload.error
  const { data, error } = await client.from("opportunity_research_documents").upsert({ opportunity_id: job.opportunity_id, session_id: job.session_id, source_version_id: sourceVersionId, document_kind: "pdf", source_url: source.final_url, checksum: source.checksum, content_type: "application/pdf", byte_size: source.bytes.length, storage_path: storagePath, extraction_status: "ocr_required", parser_version: "pdf-runtime-pending", retention_until: new Date(Date.now() + 30 * 86_400_000).toISOString(), metadata: { reason: "Dedicated PDF extraction remains feature-gated until runtime validation passes." } }, { onConflict: "session_id,source_version_id,checksum" }).select("id").single()
  if (error) throw error
  return { finding_type: "unresolved", normalized_key: "pdf_extraction_pending", label: "PDF requires document review", original_text: "KLEIO preserved the public PDF privately, but page-level extraction is not enabled for this document yet.", normalized_value: { document_id: data.id }, confidence_status: "unresolved", confidence_score: null, source_url: source.final_url, source_title: source.title, official_source: source.authority === "official", accepted: false, source_version_id: sourceVersionId, document_id: data.id, page_id: null, evidence_location: "PDF document", extraction_method: "manual_review", parser_version: "pdf-runtime-pending", conflict_status: "none", finding_scope: "session", human_approved: false }
}

async function processJob(client: SupabaseClient, job: Job) {
  const { data: opportunity, error } = await client.from("opportunities").select("canonical_url,application_url,guidelines_url").eq("id", job.opportunity_id).single()
  if (error || !opportunity) throw new Error("opportunity_unavailable")
  const officialRoot = publicUrl(opportunity.canonical_url || opportunity.application_url || opportunity.guidelines_url)
  await updateStage(client, job, "acquiring_source", 10, "Locating and acquiring official public sources.")

  const candidates: SourceCandidate[] = []
  for (const [value, role] of [[opportunity.application_url, "application_portal"], [opportunity.canonical_url, "official_listing"], [opportunity.guidelines_url, "guidelines"]] as Array<[string, string]>) {
    const url = publicUrl(value)
    if (url && !candidates.some((candidate) => candidate.url === url.toString())) candidates.push({ url: url.toString(), role, authority: officialRoot && sameOrganization(url, officialRoot) ? "official" : "organization" })
  }

  const sources: SourceResult[] = []
  const findings: Finding[] = []
  let documentCount = 0
  for (const candidate of candidates.slice(0, MAX_SOURCES)) {
    const source = await acquire(candidate, officialRoot)
    sources.push(source)
    const sourceVersionId = await versionSource(client, job, source)
    if (source.status !== "fetched" || !sourceVersionId) continue
    if (source.content_type.includes("pdf")) {
      findings.push(await preservePdf(client, job, source, sourceVersionId))
      documentCount++
    } else {
      findings.push(...extract(source.text, { versionId: sourceVersionId, url: source.final_url, title: source.title, authority: source.authority }))
    }
  }

  await updateStage(client, job, "extracting_requirements", 60, "Extracting source-backed candidate requirements.")
  await client.from("opportunity_research_findings").delete().eq("session_id", job.session_id)
  await client.from("opportunity_candidate_requirements").delete().eq("session_id", job.session_id)
  for (const source of sources.filter((source) => source.status !== "fetched")) findings.push({ finding_type: "unresolved", normalized_key: `source_${source.status}`, label: "Source requires manual review", original_text: source.note, normalized_value: { access_status: source.status }, confidence_status: "unresolved", confidence_score: null, source_url: source.final_url, source_title: source.title, official_source: source.authority === "official", accepted: false, source_version_id: null, document_id: null, page_id: null, evidence_location: "Source access", extraction_method: "access_control", parser_version: PARSER_VERSION, conflict_status: "none", finding_scope: "session", human_approved: false })

  if (findings.length) {
    const inserted = await client.from("opportunity_research_findings").insert(findings.map((finding) => ({ ...finding, session_id: job.session_id, opportunity_id: job.opportunity_id })))
    if (inserted.error) throw inserted.error
  }

  const candidatesToStore = findings.filter((finding) => finding.finding_type === "requirement").map((finding) => {
    const normalized = finding.normalized_value as Record<string, unknown>
    return { opportunity_id: job.opportunity_id, session_id: job.session_id, source_version_id: finding.source_version_id, normalized_key: finding.normalized_key, label: finding.label, required: true, category: normalized.category, description: finding.original_text, passport_field: normalized.passport_field, input_type: normalized.input_type, source_text: finding.original_text, source_url: finding.source_url, source_title: finding.source_title, evidence_location: finding.evidence_location, normalized_interpretation: finding.label, confidence_status: finding.confidence_status, confidence_score: finding.confidence_score, confidence_reason: finding.official_source ? "Explicit wording found on an official source." : "Supporting source requires review.", conflict_status: "none", extraction_method: finding.extraction_method, parser_version: finding.parser_version }
  })
  if (candidatesToStore.length) {
    const inserted = await client.from("opportunity_candidate_requirements").insert(candidatesToStore)
    if (inserted.error) throw inserted.error
  }

  await updateStage(client, job, "resolving_conflicts", 78, "Preserving source differences for review.")
  await updateStage(client, job, "matching_passport", 90, "Comparing candidate requirements with the Creative Passport.")
  const fetchedCount = sources.filter((source) => source.status === "fetched").length
  const unresolvedCount = sources.length - fetchedCount + findings.filter((finding) => finding.confidence_status === "unresolved").length
  await client.from("opportunity_research_sessions").update({ source_count: sources.length, verified_requirement_count: candidatesToStore.filter((candidate) => candidate.confidence_status === "verified").length, unresolved_count: unresolvedCount, source_version_id: findings.find((finding) => finding.source_version_id)?.source_version_id ?? null, metadata: { fetched_source_count: fetchedCount, candidate_requirement_count: candidatesToStore.length, document_count: documentCount, pdf_extraction_enabled: false } }).eq("id", job.session_id)
  await updateStage(client, job, "building_package", 100, "Evidence and candidate requirements are ready for artist review.", true)

  return {
    finalStatus: fetchedCount ? "artist_review_required" : "blocked",
    summary: { source_count: sources.length, fetched_source_count: fetchedCount, candidate_requirement_count: candidatesToStore.length, document_count: documentCount, unresolved_count: unresolvedCount, pdf_extraction_enabled: false },
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405)
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return response({ error: "Worker configuration is incomplete." }, 500)

  const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  const expectedToken = await client.rpc("get_opportunity_sync_token")
  if (!expectedToken.data || request.headers.get("x-kleio-sync-token") !== expectedToken.data) return response({ error: "Unauthorized" }, 401)

  const claimed = await client.rpc("claim_opportunity_research_jobs", { batch_size: 1, visibility_timeout_seconds: 240 })
  if (claimed.error) return response({ error: claimed.error.message }, 500)
  const job = (claimed.data?.[0] ?? null) as Job | null
  if (!job) return response({ status: "idle" })

  try {
    const result = await processJob(client, job)
    const completed = await client.rpc("complete_opportunity_research_job", { target_job_id: job.job_id, target_message_id: job.message_id, final_status: result.finalStatus, summary: result.summary })
    if (completed.error) throw completed.error
    return response({ status: result.finalStatus, job_id: job.job_id, session_id: job.session_id, ...result.summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : "research_failed"
    const retryable = !/(private_network_target|unsafe_redirect|opportunity_unavailable)/i.test(message)
    const failed = await client.rpc("fail_opportunity_research_job", { target_job_id: job.job_id, target_message_id: job.message_id, failure_category: retryable ? "transient_worker_error" : "permanent_worker_error", redacted_error_message: clean(message, 1_000), retryable, retry_delay_seconds: 60 })
    return response({ status: failed.data ?? "failed", error: clean(message, 500) }, retryable ? 503 : 422)
  }
})
