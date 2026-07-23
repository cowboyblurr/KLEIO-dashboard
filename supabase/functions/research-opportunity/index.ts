import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.110.5"

type Json = Record<string, unknown>
type SourceStatus = "fetched" | "blocked" | "unavailable" | "unsupported" | "error"
type Confidence = "verified" | "corroborated" | "likely" | "unresolved"
type SourceResult = {
  url: string
  role: string
  title: string
  authority: "official" | "other"
  status: SourceStatus
  contentType: string
  httpStatus: number | null
  sourceDate: string | null
  notes: string
  text: string
  links: string[]
}
type Finding = {
  finding_type: "requirement" | "eligibility" | "deadline" | "fee" | "submission_method" | "contact" | "unresolved"
  normalized_key: string
  label: string
  original_text: string
  normalized_value: Json
  confidence_status: Confidence
  confidence_score: number | null
  source_url: string
  source_title: string
  official_source: boolean
  accepted: boolean
}

const URL = Deno.env.get("SUPABASE_URL") ?? ""
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const USER_AGENT = "KLEIO-OpportunityResearch/1.0 (+public-source verification)"
const MAX_SOURCES = 6
const MAX_BYTES = 1_500_000
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
}

const STEPS = [
  ["review_listing", "Reviewing the opportunity listing."],
  ["official_application", "Opening the official application page."],
  ["eligibility", "Verifying eligibility details."],
  ["materials", "Checking submission requirements."],
  ["deadline_fee_submission", "Confirming deadline, fees, and submission method."],
  ["passport_match", "Matching requirements with your Creative Passport."],
  ["package_ready", "Building your review-ready application package."],
] as const

const REQUIREMENTS = [
  { key: "biography", label: "Artist biography", category: "written_material", passport: "bio", input: "text", terms: ["biography", "artist bio", "biografía", "semblanza"] },
  { key: "artist_statement", label: "Artist statement", category: "written_material", passport: "artist_statement", input: "text", terms: ["artist statement", "statement of practice", "declaración de artista", "memoria artística"] },
  { key: "cv", label: "Curriculum vitae or résumé", category: "supporting_document", passport: "cv", input: "file", terms: ["curriculum vitae", "résumé", "resume", "hoja de vida", " cv "] },
  { key: "portfolio", label: "Portfolio or work samples", category: "portfolio", passport: "portfolio", input: "file_collection", terms: ["portfolio", "work samples", "artwork images", "muestras de trabajo", "portafolio", "dossier artístico"] },
  { key: "project_proposal", label: "Project proposal", category: "written_material", passport: "", input: "text", terms: ["project proposal", "proposal narrative", "descripción del proyecto", "propuesta de proyecto", "memoria del proyecto"] },
  { key: "cover_letter", label: "Cover letter or letter of intent", category: "written_material", passport: "", input: "text", terms: ["cover letter", "letter of intent", "carta de intención", "carta de motivación"] },
  { key: "budget", label: "Project budget", category: "financial", passport: "", input: "structured", terms: ["project budget", "detailed budget", "presupuesto del proyecto", "desglose presupuestario"] },
  { key: "timeline", label: "Project timeline", category: "planning", passport: "", input: "structured", terms: ["project timeline", "work plan", "calendar of activities", "cronograma", "calendario de actividades"] },
  { key: "references", label: "Professional references", category: "reference", passport: "", input: "structured", terms: ["professional references", "referees", "referencias profesionales"] },
  { key: "recommendation_letters", label: "Recommendation letters", category: "reference", passport: "", input: "file", terms: ["recommendation letter", "letter of recommendation", "carta de recomendación"] },
  { key: "application_questions", label: "Application questions", category: "application_question", passport: "", input: "text", terms: ["application questions", "questions below", "preguntas de la solicitud", "cuestionario"] },
  { key: "accessibility", label: "Accessibility information", category: "accessibility", passport: "", input: "text", terms: ["accessibility needs", "access requirements", "necesidades de accesibilidad"] },
  { key: "proof_of_residency", label: "Proof of residency", category: "eligibility_document", passport: "", input: "file", terms: ["proof of residency", "proof of residence", "comprobante de domicilio", "acreditación de residencia"] },
  { key: "proof_of_identity", label: "Proof of identity", category: "eligibility_document", passport: "", input: "file", terms: ["proof of identity", "government-issued id", "identificación oficial", "documento de identidad"] },
  { key: "declaration", label: "Declaration or certification", category: "declaration", passport: "", input: "confirmation", terms: ["certify that", "declaration", "signature required", "declaro que", "declaración responsable"] },
] as const

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  })
}

function string(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function unique<T>(values: T[]) {
  return [...new Set(values)]
}

function safeUrl(value: unknown): URL | null {
  try {
    const parsed = new URL(string(value))
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) return null
    const host = parsed.hostname.toLowerCase()
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host === "0.0.0.0" || host === "::1") return null
    if (/^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return null
    parsed.hash = ""
    return parsed
  } catch {
    return null
  }
}

function sameHost(left: URL, right: URL) {
  const a = left.hostname.toLowerCase().replace(/^www\./, "")
  const b = right.hostname.toLowerCase().replace(/^www\./, "")
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`)
}

function decode(value: string) {
  const named: Record<string, string> = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"', ndash: "–", mdash: "—", hellip: "…" }
  return value
    .replace(/&#(x?[0-9a-f]+);/gi, (_, code: string) => {
      const radix = code.toLowerCase().startsWith("x") ? 16 : 10
      const number = Number.parseInt(code.replace(/^x/i, ""), radix)
      return Number.isFinite(number) ? String.fromCodePoint(number) : ""
    })
    .replace(/&([a-z]+);/gi, (match, name: string) => named[name.toLowerCase()] ?? match)
}

function plain(html: string) {
  return decode(html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/(?:p|div|li|h[1-6]|section|article|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " "))
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function pageTitle(html: string) {
  return plain(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").slice(0, 240)
}

function relatedLinks(html: string, base: URL) {
  const found: string[] = []
  const keyword = /(apply|application|guideline|eligib|requirement|faq|submission|convocatoria|requisito|solicitud|bases)/i
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const link = new URL(match[1], base)
      if (!safeUrl(link.toString()) || !sameHost(base, link) || !keyword.test(`${plain(match[2])} ${link.pathname}`)) continue
      link.hash = ""
      found.push(link.toString())
    } catch {
      // Invalid links are ignored.
    }
  }
  return unique(found).slice(0, 4)
}

function robotsBlocks(content: string, path: string) {
  let applies = false
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim()
    if (!line) continue
    const [field, ...parts] = line.split(":")
    const value = parts.join(":").trim()
    if (field.toLowerCase() === "user-agent") applies = value === "*" || value.toLowerCase().includes("kleio")
    if (applies && field.toLowerCase() === "disallow" && value && path.startsWith(value)) return true
  }
  return false
}

async function allowedByRobots(url: URL) {
  try {
    const response = await fetch(new URL("/robots.txt", url.origin), {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(5_000),
    })
    if (!response.ok) return true
    return !robotsBlocks((await response.text()).slice(0, 200_000), `${url.pathname}${url.search}`)
  } catch {
    return true
  }
}

async function fetchSource(url: URL, role: string, officialRoot: URL | null): Promise<SourceResult> {
  const authority = officialRoot && sameHost(url, officialRoot) ? "official" : "other"
  if (!(await allowedByRobots(url))) return { url: url.toString(), role, title: "", authority, status: "blocked", contentType: "", httpStatus: null, sourceDate: null, notes: "The source disallows automated access. KLEIO did not bypass the restriction.", text: "", links: [] }
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml,application/json,text/plain,application/pdf;q=0.8,*/*;q=0.2" },
      signal: AbortSignal.timeout(12_000),
    })
    const finalUrl = safeUrl(response.url) ?? url
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? ""
    const sourceDate = response.headers.get("last-modified")
    if (!response.ok) return { url: finalUrl.toString(), role, title: "", authority, status: response.status === 401 || response.status === 403 ? "blocked" : "unavailable", contentType, httpStatus: response.status, sourceDate, notes: `The source returned HTTP ${response.status}.`, text: "", links: [] }
    if (contentType.includes("application/pdf") || finalUrl.pathname.toLowerCase().endsWith(".pdf")) return { url: finalUrl.toString(), role, title: finalUrl.pathname.split("/").pop() ?? "PDF guidelines", authority, status: "unsupported", contentType: contentType || "application/pdf", httpStatus: response.status, sourceDate, notes: "A public PDF was found. It is preserved for manual review; KLEIO does not claim it was parsed.", text: "", links: [] }
    if (!/(text\/html|application\/xhtml\+xml|application\/json|text\/plain)/i.test(contentType)) return { url: finalUrl.toString(), role, title: "", authority, status: "unsupported", contentType, httpStatus: response.status, sourceDate, notes: "The source uses an unsupported content type.", text: "", links: [] }

    const raw = (await response.text()).slice(0, MAX_BYTES)
    if (/(captcha|verify you are human|sign in to continue|log in to continue|access denied|subscription required|enable javascript to continue)/i.test(raw.slice(0, 120_000))) return { url: finalUrl.toString(), role, title: pageTitle(raw), authority, status: "blocked", contentType, httpStatus: response.status, sourceDate, notes: "The page appears to require login, human verification, or another restricted interaction. KLEIO stopped.", text: "", links: [] }
    return { url: finalUrl.toString(), role, title: contentType.includes("html") ? pageTitle(raw) : "Public source", authority, status: "fetched", contentType, httpStatus: response.status, sourceDate, notes: "", text: contentType.includes("html") ? plain(raw).slice(0, 750_000) : raw.trim().slice(0, 750_000), links: contentType.includes("html") ? relatedLinks(raw, finalUrl) : [] }
  } catch (error) {
    return { url: url.toString(), role, title: "", authority, status: "error", contentType: "", httpStatus: null, sourceDate: null, notes: error instanceof Error ? error.message.slice(0, 500) : "The public source could not be read.", text: "", links: [] }
  }
}

function sentences(value: string) {
  return value.replace(/\n+/g, " ").match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)?.map((item) => item.trim()).filter((item) => item.length >= 20) ?? []
}

function requiredLanguage(value: string) {
  return /(must|required|submit|provide|include|upload|attach|application asks|deber[áa]|obligatori|requisito|presentar|adjuntar|incluir|cargar|entregar|solicitud exige)/i.test(value)
}

function limits(value: string) {
  const words = [...value.matchAll(/(?:maximum|max(?:imum)? of|up to|no more than|l[ií]mite(?: de)?|m[aá]ximo(?: de)?)?\s*(\d{1,5})\s*(?:words?|palabras)/gi)]
  const characters = [...value.matchAll(/(?:maximum|max(?:imum)? of|up to|no more than|l[ií]mite(?: de)?|m[aá]ximo(?: de)?)?\s*(\d{2,6})\s*(?:characters?|caracteres)/gi)]
  const items = value.match(/(?:(\d+)\s*(?:to|a|[-–])\s*)?(\d+)\s*(?:images?|work samples?|artworks?|obras?|im[aá]genes?|muestras?)/i)
  const size = value.match(/(\d+(?:\.\d+)?)\s*(KB|MB|GB)\b/i)
  const fileTypes = unique([...value.matchAll(/\b(pdf|docx?|jpe?g|png|tiff?|gif|mp4|mov|avi|mp3|wav|zip)\b/gi)].map((match) => match[1].toLowerCase()))
  let maximumFileSizeBytes: number | null = null
  if (size) {
    const amount = Number(size[1])
    maximumFileSizeBytes = Math.round(amount * (size[2].toUpperCase() === "GB" ? 1024 ** 3 : size[2].toUpperCase() === "MB" ? 1024 ** 2 : 1024))
  }
  return {
    maximumWordCount: words.length ? Number(words.at(-1)?.[1]) : null,
    maximumCharacterCount: characters.length ? Number(characters.at(-1)?.[1]) : null,
    minimumItemCount: items ? Number(items[1] || items[2]) : null,
    maximumItemCount: items ? Number(items[2]) : null,
    maximumFileSizeBytes,
    fileTypes,
  }
}

function findingsFor(source: SourceResult): Finding[] {
  if (source.status !== "fetched") return []
  const confidence: Confidence = source.authority === "official" ? "verified" : "likely"
  const score = source.authority === "official" ? 0.92 : 0.55
  const result: Finding[] = []
  const rows = sentences(source.text)

  for (const definition of REQUIREMENTS) {
    const matches = rows.filter((row) => requiredLanguage(row) && definition.terms.some((term) => row.toLowerCase().includes(term.trim().toLowerCase()))).slice(0, 2)
    for (const original of matches) result.push({ finding_type: "requirement", normalized_key: definition.key, label: definition.label, original_text: original.slice(0, 2_000), normalized_value: { category: definition.category, passport_field: definition.passport, input_type: definition.input, ...limits(original) }, confidence_status: confidence, confidence_score: score, source_url: source.url, source_title: source.title, official_source: source.authority === "official", accepted: source.authority === "official" })
  }

  for (const row of rows) {
    if (result.length >= 60) break
    if (/(eligible|eligibility|applicants must|open to|ineligible|elegible|requisitos de participaci[oó]n|podr[aá]n participar)/i.test(row)) result.push({ finding_type: "eligibility", normalized_key: "eligibility", label: "Eligibility information", original_text: row.slice(0, 2_000), normalized_value: {}, confidence_status: confidence, confidence_score: score, source_url: source.url, source_title: source.title, official_source: source.authority === "official", accepted: false })
    if (/(deadline|due by|applications close|fecha l[ií]mite|cierre de la convocatoria)/i.test(row) && /\d/.test(row)) result.push({ finding_type: "deadline", normalized_key: "deadline", label: "Deadline information", original_text: row.slice(0, 2_000), normalized_value: {}, confidence_status: confidence, confidence_score: score, source_url: source.url, source_title: source.title, official_source: source.authority === "official", accepted: false })
    if (/(application fee|entry fee|submission fee|cuota de inscripci[oó]n|tasa de solicitud|sin costo)/i.test(row)) result.push({ finding_type: "fee", normalized_key: "application_fee", label: "Application fee information", original_text: row.slice(0, 2_000), normalized_value: {}, confidence_status: confidence, confidence_score: score, source_url: source.url, source_title: source.title, official_source: source.authority === "official", accepted: false })
    if (/(submit via|apply through|applications? (?:must|should) be (?:sent|submitted)|send applications? to|presentar (?:la )?solicitud|enviar (?:la )?solicitud)/i.test(row)) result.push({ finding_type: "submission_method", normalized_key: "submission_method", label: "Submission method", original_text: row.slice(0, 2_000), normalized_value: {}, confidence_status: confidence, confidence_score: score, source_url: source.url, source_title: source.title, official_source: source.authority === "official", accepted: false })
    const email = row.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]
    if (email && /(contact|questions|information|consulta|informaci[oó]n)/i.test(row)) result.push({ finding_type: "contact", normalized_key: "contact", label: "Official contact", original_text: row.slice(0, 2_000), normalized_value: { email }, confidence_status: confidence, confidence_score: score, source_url: source.url, source_title: source.title, official_source: source.authority === "official", accepted: false })
  }
  return result
}

function mergedRequirements(findings: Finding[], sessionId: string, opportunityId: string) {
  const grouped = new Map<string, Finding[]>()
  for (const finding of findings.filter((item) => item.finding_type === "requirement")) grouped.set(finding.normalized_key, [...(grouped.get(finding.normalized_key) ?? []), finding])
  return [...grouped.entries()].map(([key, rows], index) => {
    const selected = rows.find((row) => row.official_source) ?? rows[0]
    const sourceCount = new Set(rows.map((row) => row.source_url)).size
    const corroborated = sourceCount >= 2
    const definition = REQUIREMENTS.find((item) => item.key === key)!
    const normalized = selected.normalized_value
    return {
      opportunity_id: opportunityId,
      research_session_id: sessionId,
      material_key: key,
      label: definition.label,
      required: true,
      source_text: selected.original_text,
      source_url: selected.source_url,
      source_title: selected.source_title,
      extraction_method: "public_source_research",
      verification_status: selected.official_source || corroborated ? "confirmed" : "ambiguous",
      last_verified_at: new Date().toISOString(),
      category: definition.category,
      description: selected.original_text,
      source_location: "Public opportunity source",
      passport_field: definition.passport,
      input_type: definition.input,
      minimum_word_count: null,
      maximum_word_count: typeof normalized.maximumWordCount === "number" ? normalized.maximumWordCount : null,
      minimum_item_count: typeof normalized.minimumItemCount === "number" ? normalized.minimumItemCount : null,
      maximum_item_count: typeof normalized.maximumItemCount === "number" ? normalized.maximumItemCount : null,
      accepted_file_types: Array.isArray(normalized.fileTypes) ? normalized.fileTypes : [],
      maximum_file_size_bytes: typeof normalized.maximumFileSizeBytes === "number" ? normalized.maximumFileSizeBytes : null,
      requires_artist_confirmation: ["declaration", "references", "recommendation_letters", "proof_of_residency", "proof_of_identity"].includes(key),
      legal_declaration: key === "declaration",
      human_verification_required: key === "declaration",
      confidence_score: corroborated ? 0.96 : selected.confidence_score,
      confidence_status: corroborated ? "corroborated" : selected.confidence_status,
      confidence_reason: corroborated ? `The requirement appears on ${sourceCount} public sources.` : selected.official_source ? "Explicit wording found on an official public source." : "Relevant wording found on a public supporting source; artist verification is still required.",
      normalized_interpretation: definition.label,
      retrieved_at: new Date().toISOString(),
      constraints: typeof normalized.maximumCharacterCount === "number" ? { maximum_character_count: normalized.maximumCharacterCount } : {},
      sort_order: index,
    }
  })
}

async function setSession(client: SupabaseClient, sessionId: string, values: Json) {
  const { error } = await client.from("opportunity_research_sessions").update(values).eq("id", sessionId)
  if (error) throw error
}

async function setStep(client: SupabaseClient, sessionId: string, key: string, status: string, message: string, progress: number, metadata: Json = {}) {
  const now = new Date().toISOString()
  const values: Json = { status, user_message: message, metadata }
  if (status === "running") values.started_at = now
  if (["completed", "skipped", "blocked", "failed"].includes(status)) values.completed_at = now
  const { error } = await client.from("opportunity_research_steps").update(values).eq("session_id", sessionId).eq("step_key", key)
  if (error) throw error
  await setSession(client, sessionId, { status: "running", current_stage: key, progress_percent: progress, started_at: now })
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405)
  if (!URL || !SERVICE_KEY) return reply({ error: "KLEIO research configuration is incomplete." }, 500)

  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "")
  if (!token) return reply({ error: "Authentication is required." }, 401)
  const client = createClient(URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: auth, error: authError } = await client.auth.getUser(token)
  if (authError || !auth.user) return reply({ error: "The current session could not be verified." }, 401)

  let body: Json
  try { body = await request.json() } catch { return reply({ error: "A JSON request body is required." }, 400) }
  const sessionId = string(body.session_id)
  const opportunityId = string(body.opportunity_id)
  if (!sessionId || !opportunityId) return reply({ error: "session_id and opportunity_id are required." }, 400)

  const { data: session } = await client.from("opportunity_research_sessions").select("id,artist_user_id,opportunity_id,status").eq("id", sessionId).maybeSingle()
  if (!session || session.artist_user_id !== auth.user.id || session.opportunity_id !== opportunityId) return reply({ error: "This research session is unavailable." }, 403)
  if (["running", "succeeded", "partial"].includes(session.status)) return reply({ session_id: sessionId, status: session.status, message: "This research session has already started." })

  const { data: opportunity } = await client.from("opportunities").select("id,source_id,title,provider_name,canonical_url,application_url,guidelines_url,deadline_at,deadline_timezone,application_fee,submission_method,submission_email").eq("id", opportunityId).maybeSingle()
  if (!opportunity) return reply({ error: "The opportunity is unavailable." }, 404)

  try {
    const { error: stepError } = await client.from("opportunity_research_steps").upsert(STEPS.map(([step_key, label], sort_order) => ({ session_id: sessionId, step_key, label, status: "queued", user_message: label, sort_order })), { onConflict: "session_id,step_key" })
    if (stepError) throw stepError
    await setSession(client, sessionId, { status: "running", current_stage: "review_listing", progress_percent: 2, started_at: new Date().toISOString(), error_message: "" })
    await setStep(client, sessionId, "review_listing", "running", "Reviewing the opportunity listing.", 5)

    const canonical = safeUrl(opportunity.canonical_url)
    const queued = unique([
      opportunity.application_url ? JSON.stringify({ url: opportunity.application_url, role: "application_portal" }) : "",
      opportunity.canonical_url ? JSON.stringify({ url: opportunity.canonical_url, role: "official_listing" }) : "",
      opportunity.guidelines_url ? JSON.stringify({ url: opportunity.guidelines_url, role: "guidelines" }) : "",
    ].filter(Boolean)).map((value) => JSON.parse(value) as { url: string; role: string })
    const sources: SourceResult[] = []

    for (let index = 0; index < queued.length && sources.length < MAX_SOURCES; index++) {
      const candidate = queued[index]
      const sourceUrl = safeUrl(candidate.url)
      if (!sourceUrl || sources.some((source) => source.url === sourceUrl.toString())) continue
      if (index === 0) await setStep(client, sessionId, "official_application", "running", "Opening the official application page.", 20)
      const source = await fetchSource(sourceUrl, candidate.role, canonical)
      sources.push(source)
      if (source.status === "fetched") for (const link of source.links) if (queued.length < MAX_SOURCES && !queued.some((entry) => entry.url === link)) queued.push({ url: link, role: /faq/i.test(link) ? "faq" : /guideline|bases|requirement/i.test(link) ? "guidelines" : "supporting" })
    }

    if (sources.length) {
      const { error } = await client.from("opportunity_research_sources").upsert(sources.map((source) => ({ session_id: sessionId, opportunity_id: opportunityId, url: source.url, title: source.title, source_role: source.role, authority_status: source.authority, access_status: source.status, content_type: source.contentType, http_status: source.httpStatus, source_date: source.sourceDate && Number.isFinite(Date.parse(source.sourceDate)) ? new Date(source.sourceDate).toISOString() : null, checked_at: new Date().toISOString(), notes: source.notes, metadata: { discovered_links: source.links.length } })), { onConflict: "session_id,url" })
      if (error) throw error
    }
    const fetched = sources.filter((source) => source.status === "fetched")
    await setStep(client, sessionId, "review_listing", "completed", `${sources.length} public source${sources.length === 1 ? "" : "s"} identified.`, 25, { source_count: sources.length })
    await setStep(client, sessionId, "official_application", fetched.length ? "completed" : "blocked", fetched.length ? "Official public sources were reviewed." : "The official sources could not be read automatically. KLEIO did not bypass access controls.", 35)

    await setStep(client, sessionId, "eligibility", "running", "Verifying eligibility details.", 42)
    let findings = sources.flatMap(findingsFor)
    const groups = new Map<string, Finding[]>()
    for (const finding of findings.filter((item) => item.finding_type === "requirement")) groups.set(finding.normalized_key, [...(groups.get(finding.normalized_key) ?? []), finding])
    findings = findings.map((finding) => finding.finding_type === "requirement" && new Set((groups.get(finding.normalized_key) ?? []).map((item) => item.source_url)).size >= 2 ? { ...finding, confidence_status: "corroborated" as const, confidence_score: 0.96, accepted: true } : finding)
    for (const source of sources.filter((item) => item.status === "unsupported")) findings.push({ finding_type: "unresolved", normalized_key: "unsupported_source", label: "Source requires manual review", original_text: source.notes, normalized_value: { content_type: source.contentType }, confidence_status: "unresolved", confidence_score: null, source_url: source.url, source_title: source.title, official_source: source.authority === "official", accepted: false })

    await client.from("opportunity_research_findings").delete().eq("session_id", sessionId)
    if (findings.length) {
      const { error } = await client.from("opportunity_research_findings").insert(findings.map((finding) => ({ ...finding, session_id: sessionId, opportunity_id: opportunityId })))
      if (error) throw error
    }
    const eligibilityCount = findings.filter((item) => item.finding_type === "eligibility").length
    await setStep(client, sessionId, "eligibility", "completed", eligibilityCount ? `${eligibilityCount} eligibility statement${eligibilityCount === 1 ? "" : "s"} found for review.` : "No new structured eligibility statement was found; existing verified rules remain in place.", 55, { finding_count: eligibilityCount })

    await setStep(client, sessionId, "materials", "running", "Checking submission requirements.", 60)
    const requirements = mergedRequirements(findings, sessionId, opportunityId)
    if (requirements.length) {
      const { error: deleteError } = await client.from("opportunity_requirements").delete().eq("opportunity_id", opportunityId).eq("extraction_method", "public_source_research")
      if (deleteError) throw deleteError
      const { error: insertError } = await client.from("opportunity_requirements").insert(requirements)
      if (insertError) throw insertError
    }
    await setStep(client, sessionId, "materials", requirements.length ? "completed" : "skipped", requirements.length ? `${requirements.length} source-backed application requirement${requirements.length === 1 ? "" : "s"} prepared for comparison.` : "No explicit material requirements could be extracted safely. Review the source links before applying.", 72, { requirement_count: requirements.length })

    await setStep(client, sessionId, "deadline_fee_submission", "running", "Confirming deadline, fees, and submission method.", 76)
    const factCount = findings.filter((item) => ["deadline", "fee", "submission_method", "contact"].includes(item.finding_type)).length
    await setStep(client, sessionId, "deadline_fee_submission", "completed", factCount ? `${factCount} submission fact${factCount === 1 ? "" : "s"} found for source review.` : "KLEIO retained the existing source facts and marked unstated details as unresolved.", 84, { finding_count: factCount })
    await setStep(client, sessionId, "passport_match", "running", "Matching requirements with your Creative Passport.", 90)
    await setStep(client, sessionId, "passport_match", "completed", "The application workspace is refreshing its requirement-by-requirement Creative Passport comparison.", 95)
    await setStep(client, sessionId, "package_ready", "running", "Building your review-ready application package.", 98)

    const unresolved = findings.filter((item) => item.confidence_status === "unresolved").length + sources.filter((source) => ["blocked", "unavailable", "unsupported", "error"].includes(source.status)).length
    const verified = requirements.filter((item) => ["verified", "corroborated"].includes(String(item.confidence_status))).length
    const status = fetched.length === 0 ? "failed" : unresolved > 0 || requirements.length === 0 ? "partial" : "succeeded"
    await setStep(client, sessionId, "package_ready", status === "failed" ? "failed" : "completed", status === "succeeded" ? "Research complete. Review the prepared application package before continuing." : status === "partial" ? "Research complete with items that still require artist review." : "KLEIO could not read an official public source. Use the source links to continue manually.", 100)
    await setSession(client, sessionId, { status, current_stage: "package_ready", progress_percent: 100, source_count: sources.length, verified_requirement_count: verified, unresolved_count: unresolved, completed_at: new Date().toISOString(), error_message: status === "failed" ? "No official public source could be read automatically." : "", metadata: { fetched_source_count: fetched.length, extracted_requirement_count: requirements.length, finding_count: findings.length } })
    if (fetched.length) await client.from("opportunities").update({ last_verified_at: new Date().toISOString() }).eq("id", opportunityId)
    return reply({ session_id: sessionId, status, source_count: sources.length, requirement_count: requirements.length, unresolved_count: unresolved })
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1_000) : "Opportunity research failed."
    await setSession(client, sessionId, { status: "failed", completed_at: new Date().toISOString(), error_message: message }).catch(() => undefined)
    return reply({ session_id: sessionId, status: "failed", error: message }, 500)
  }
})
