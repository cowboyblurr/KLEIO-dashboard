import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.110.5"
import { extractText, getDocumentProxy } from "npm:unpdf@1.6.2"

const MAX_FILE_BYTES = 20 * 1024 * 1024
const MAX_TEXT_CHARS = 120_000
const EXTRACTOR_VERSION = "upload_to_passport_v1"
const ALLOWED_ORIGINS = [
  /^https:\/\/([a-z0-9-]+\.)?kleioarthouse\.com$/i,
  /^https:\/\/cowboyblurr\.github\.io$/i,
  /^http:\/\/localhost(?::\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/i,
]

const CLASSIFICATIONS = [
  "artwork_image",
  "artwork_detail_image",
  "artist_cv",
  "artist_biography",
  "artist_statement",
  "project_proposal",
  "project_budget",
  "work_sample_list",
  "proof_of_residency",
  "identification_document",
  "reference_letter",
  "press_publication",
  "exhibition_documentation",
  "award_grant_documentation",
  "application_requirement_file",
  "unknown_document",
  "other_artist_material",
  "needs_artist_classification",
] as const

type SourceClassification = (typeof CLASSIFICATIONS)[number]
type ClaimStatus = "proposed" | "needs_clarification" | "conflicting"
type RelationshipStatus = "new" | "duplicate" | "conflict" | "unresolved"
type Sensitivity = "standard" | "sensitive" | "highly_sensitive"
type JsonObject = Record<string, unknown>

type SourceRow = {
  id: string
  artist_user_id: string
  source_type: string
  label: string
  storage_path: string
  mime_type: string
  byte_size: number | null
  checksum: string
  original_filename: string | null
  source_metadata: JsonObject | null
  media_kind: string
  width: number | null
  height: number | null
  classification: SourceClassification
  classification_confidence: number | null
  extraction_status: string
  sensitivity: Sensitivity
  document_version: number
}

type PassportRecordRow = {
  id: string
  record_type: string
  display_value: string
  normalized_value: JsonObject
  normalized_key: string
}

type ProfileRow = {
  professional_name: string
  location: string
  bio: string
  artist_statement: string
  practice_description: string
  website_url: string
  disciplines: string[]
  mediums: string[]
  languages: string[]
  education: string
  exhibition_history: string
  awards: string
}

type Claim = {
  target_field: string
  claim_type: string
  target_section: string
  proposed_value: string
  normalized_value: JsonObject
  evidence_excerpt: string
  page_number: number | null
  evidence_location: JsonObject
  extraction_method: string
  confidence: number
  status: ClaimStatus
  sensitivity: Sensitivity
  fingerprint: string
  normalized_key: string
  relationship_status: RelationshipStatus
  existing_record_id?: string | null
}

type PageLine = {
  page: number
  text: string
}

const CV_HEADINGS: Array<[string, RegExp]> = [
  ["education_record", /^(education|training|qualifications|academic background)$/i],
  ["solo_exhibition_record", /^(selected\s+)?solo exhibitions?$/i],
  ["group_exhibition_record", /^(selected\s+)?group exhibitions?$/i],
  ["exhibition_record", /^(selected\s+)?(exhibitions?|shows?)$/i],
  ["residency_record", /^(artist\s+)?residencies?$/i],
  ["award_record", /^(awards?|honou?rs?)$/i],
  ["grant_record", /^(grants?|funding)$/i],
  ["fellowship_record", /^fellowships?$/i],
  ["publication_record", /^(selected\s+)?publications?$/i],
  ["press_record", /^(press|media|reviews?)$/i],
  ["collection_record", /^(public|private|selected)?\s*collections?$/i],
  ["commission_record", /^(selected\s+)?commissions?$/i],
  ["professional_experience_record", /^(professional\s+)?experience$/i],
  ["teaching_record", /^(teaching|academic appointments?)$/i],
  ["talk_record", /^(talks?|lectures?|presentations?)$/i],
  ["panel_record", /^(panels?|conferences?)$/i],
  ["bibliography_record", /^(bibliography|catalogues?)$/i],
  ["membership_record", /^(memberships?|affiliations?)$/i],
]

const NARRATIVE_HEADINGS: Array<[string, RegExp]> = [
  ["bio", /^(short\s+)?bio(graphy)?$/i],
  ["artist_statement", /^artist('?s)?\s+statement$/i],
  ["practice_description", /^(artistic\s+)?practice(\s+description)?$/i],
  ["project_summary", /^(project\s+)?summary|overview$/i],
  ["project_description", /^(project\s+)?description$/i],
  ["project_objectives", /^(objectives?|goals?)$/i],
  ["project_timeline", /^(timeline|schedule)$/i],
  ["project_collaborators", /^(collaborators?|partners?|team)$/i],
  ["project_materials", /^(materials?|technical requirements?)$/i],
  ["project_accessibility", /^(accessibility|access considerations?)$/i],
  ["project_audience", /^(audience|community|participants?)$/i],
]

const DISCIPLINE_TERMS = [
  "painting", "drawing", "sculpture", "photography", "film", "video", "ceramics", "printmaking",
  "installation", "performance", "sound art", "textile", "fashion", "design", "illustration", "digital media",
  "new media", "mixed media", "music", "dance", "theatre", "architecture", "writing", "curating",
]

const MEDIUM_TERMS = [
  "oil", "acrylic", "watercolor", "watercolour", "ink", "charcoal", "clay", "porcelain", "stoneware",
  "wood", "metal", "bronze", "glass", "textile", "fabric", "video", "film", "photography", "sound",
  "paper", "found objects", "digital", "3d", "collage", "print", "screenprint", "lithography",
]

const US_STATE_NAMES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida",
  "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
  "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska",
  "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas",
  "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "District of Columbia",
]

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

function cleanLabel(value: unknown) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, 180)
    : ""
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

function normalizedLine(value: string) {
  return value.replace(/^\s*[•●▪◦*-]\s*/, "").replace(/\s+/g, " ").trim()
}

function normalizedKey(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/\b(19|20)\d{2}\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 240)
}

async function sha256(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

async function claimFingerprint(type: string, key: string, value: string) {
  return sha256(`${type}\n${key}\n${value.trim().toLowerCase()}`)
}

function sourceSensitivity(classification: SourceClassification): Sensitivity {
  if (classification === "identification_document") return "highly_sensitive"
  if (classification === "proof_of_residency" || classification === "reference_letter") return "sensitive"
  return "standard"
}

function validClassification(value: unknown): value is SourceClassification {
  return typeof value === "string" && (CLASSIFICATIONS as readonly string[]).includes(value)
}

function headingMatch(line: string, definitions: Array<[string, RegExp]>) {
  const cleaned = line.trim().replace(/[:—–-]+$/, "").trim()
  for (const [field, pattern] of definitions) if (pattern.test(cleaned)) return field
  return null
}

function findTerms(text: string, terms: string[]) {
  const lower = text.toLowerCase()
  return terms.filter((term) => new RegExp(`(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i").test(lower))
}

function inferClassification(input: {
  requested: unknown
  source: SourceRow | null
  text: string
  label: string
}): { classification: SourceClassification; confidence: number; reason: string } {
  if (validClassification(input.requested)) {
    return { classification: input.requested, confidence: 1, reason: "Artist or destination supplied the document category." }
  }
  if (input.source && input.source.classification !== "needs_artist_classification") {
    return {
      classification: input.source.classification,
      confidence: input.source.classification_confidence ?? 0.9,
      reason: "The canonical source already had a reviewed classification.",
    }
  }

  const metadata = isObject(input.source?.source_metadata) ? input.source?.source_metadata ?? {} : {}
  const context = typeof metadata.import_context === "string" ? metadata.import_context : ""
  const usageRole = typeof metadata.usage_role === "string" ? metadata.usage_role : ""
  const filename = `${input.label} ${input.source?.original_filename ?? ""}`.toLowerCase()
  const headingText = input.text.slice(0, 20_000).toLowerCase()
  const image = input.source?.mime_type.startsWith("image/")

  if (image && ["portfolio", "artist_onboarding"].includes(context)) {
    return { classification: "artwork_image", confidence: 0.98, reason: "The image was added through an artwork-specific destination." }
  }
  if (image) return { classification: "artwork_image", confidence: 0.72, reason: "The source is an artist-owned image." }
  if (usageRole === "cv" || /\b(cv|curriculum vitae|resume|résumé)\b/.test(filename) || /\b(education|exhibitions|residencies|awards)\b/.test(headingText)) {
    return { classification: "artist_cv", confidence: usageRole === "cv" ? 0.99 : 0.9, reason: "The destination, filename, or section headings indicate a CV." }
  }
  if (/\b(artist statement|statement of practice)\b/.test(`${filename} ${headingText}`)) {
    return { classification: "artist_statement", confidence: 0.93, reason: "The filename or document heading identifies an artist statement." }
  }
  if (/\b(bio|biography)\b/.test(filename)) {
    return { classification: "artist_biography", confidence: 0.92, reason: "The filename identifies a biography." }
  }
  if (/\b(budget|expenses|income|artist fee)\b/.test(`${filename} ${headingText}`)) {
    return { classification: "project_budget", confidence: 0.88, reason: "Budget language appears in the filename or document text." }
  }
  if (/\b(project proposal|proposal|project description)\b/.test(`${filename} ${headingText}`)) {
    return { classification: "project_proposal", confidence: 0.86, reason: "Proposal language appears in the filename or document text." }
  }
  if (/\b(work samples?|image list|work list)\b/.test(filename)) {
    return { classification: "work_sample_list", confidence: 0.9, reason: "The filename identifies a work-sample list." }
  }
  if (/\b(proof of residency|residency proof|utility bill|lease)\b/.test(filename)) {
    return { classification: "proof_of_residency", confidence: 0.88, reason: "The filename identifies residency evidence." }
  }
  if (/\b(passport|driver'?s license|identity|identification|government id)\b/.test(filename)) {
    return { classification: "identification_document", confidence: 0.88, reason: "The filename identifies an identity document." }
  }
  if (/\b(reference|recommendation)\b/.test(filename)) {
    return { classification: "reference_letter", confidence: 0.86, reason: "The filename identifies a reference letter." }
  }
  if (/\b(press|article|review|publication)\b/.test(filename)) {
    return { classification: "press_publication", confidence: 0.82, reason: "The filename identifies press or publication material." }
  }
  if (/\b(exhibition|show documentation)\b/.test(filename)) {
    return { classification: "exhibition_documentation", confidence: 0.8, reason: "The filename identifies exhibition documentation." }
  }
  if (/\b(award|grant|fellowship)\b/.test(filename)) {
    return { classification: "award_grant_documentation", confidence: 0.8, reason: "The filename identifies award or grant documentation." }
  }
  if (["application_material", "opportunity_requirement"].includes(context)) {
    return { classification: "application_requirement_file", confidence: 0.8, reason: "The file was added for an application requirement." }
  }
  return { classification: "needs_artist_classification", confidence: 0.2, reason: "KLEIO could not determine the document category safely." }
}

function pageLines(pages: string[]) {
  const lines: PageLine[] = []
  pages.forEach((pageText, pageIndex) => {
    normalizedText(pageText).split("\n").forEach((line) => {
      const text = normalizedLine(line)
      if (text) lines.push({ page: pageIndex + 1, text })
    })
  })
  return lines
}

function extractSections(lines: PageLine[], definitions: Array<[string, RegExp]>) {
  const sections = new Map<string, PageLine[]>()
  let active: string | null = null
  for (const line of lines) {
    const matched = headingMatch(line.text, definitions)
    if (matched) {
      active = matched
      if (!sections.has(active)) sections.set(active, [])
      continue
    }
    if (active) sections.get(active)?.push(line)
  }
  return sections
}

function parseYears(value: string) {
  return Array.from(new Set(value.match(/\b(?:19|20)\d{2}\b/g) ?? [])).map(Number)
}

function parseCvEntry(value: string) {
  const years = parseYears(value)
  const withoutLeadingYear = value.replace(/^\s*(?:19|20)\d{2}(?:\s*[-–—]\s*(?:19|20)?\d{2})?\s*[,.:;–—-]?\s*/, "")
  const parts = withoutLeadingYear.split(/\s*[|;]\s*|\s+[-–—]\s+|\s*,\s*/).map((part) => part.trim()).filter(Boolean)
  return {
    title: parts[0] ?? withoutLeadingYear,
    institution: parts.length > 1 ? parts[1] : "",
    location: parts.length > 2 ? parts.at(-1) ?? "" : "",
    start_year: years[0] ?? null,
    end_year: years.length > 1 ? years.at(-1) ?? null : years[0] ?? null,
    original_text: value,
  }
}

async function createClaim(input: Omit<Claim, "fingerprint" | "normalized_key" | "relationship_status"> & { keySource?: string }): Promise<Claim | null> {
  const proposedValue = normalizedText(input.proposed_value).slice(0, 20_000)
  if (!proposedValue) return null
  const key = normalizedKey(input.keySource || proposedValue)
  return {
    ...input,
    proposed_value: proposedValue,
    evidence_excerpt: normalizedText(input.evidence_excerpt || proposedValue).slice(0, 1200),
    normalized_key: key,
    fingerprint: await claimFingerprint(input.claim_type, key, proposedValue),
    relationship_status: "new",
  }
}

async function extractCvClaims(lines: PageLine[]) {
  const claims: Claim[] = []
  const sections = extractSections(lines, CV_HEADINGS)
  for (const [recordType, entries] of sections) {
    for (const entry of entries) {
      if (entry.text.length < 4 || headingMatch(entry.text, [...CV_HEADINGS, ...NARRATIVE_HEADINGS])) continue
      const parsed = parseCvEntry(entry.text)
      const next = await createClaim({
        target_field: recordType,
        claim_type: recordType,
        target_section: recordType.replace(/_record$/, ""),
        proposed_value: entry.text,
        normalized_value: parsed,
        evidence_excerpt: entry.text,
        page_number: entry.page,
        evidence_location: { page: entry.page, section: recordType.replace(/_record$/, "") },
        extraction_method: "direct_pdf_text_structure_v1",
        confidence: parseYears(entry.text).length ? 0.88 : 0.72,
        status: parseYears(entry.text).length ? "proposed" : "needs_clarification",
        sensitivity: "standard",
        keySource: `${recordType}:${entry.text}`,
      })
      if (next) claims.push(next)
    }
  }
  return claims
}

async function extractNarrativeClaims(lines: PageLine[], classification: SourceClassification) {
  const claims: Claim[] = []
  const sections = extractSections(lines, NARRATIVE_HEADINGS)
  const fullText = lines.map((line) => line.text).join("\n")
  const classificationTarget: Partial<Record<SourceClassification, string>> = {
    artist_biography: "bio",
    artist_statement: "artist_statement",
    project_proposal: "project_description",
  }

  for (const [field, sectionLines] of sections) {
    const value = sectionLines.map((line) => line.text).join("\n").trim()
    const firstPage = sectionLines[0]?.page ?? 1
    const next = await createClaim({
      target_field: field,
      claim_type: field,
      target_section: ["bio", "artist_statement", "practice_description"].includes(field) ? "profile" : "project_materials",
      proposed_value: value,
      normalized_value: { text: value },
      evidence_excerpt: value,
      page_number: firstPage,
      evidence_location: { page: firstPage, section: field },
      extraction_method: "direct_pdf_text_structure_v1",
      confidence: 0.94,
      status: "proposed",
      sensitivity: "standard",
    })
    if (next) claims.push(next)
  }

  const preferredTarget = classificationTarget[classification]
  if (preferredTarget && !claims.some((claim) => claim.target_field === preferredTarget) && fullText.length >= 80) {
    const next = await createClaim({
      target_field: preferredTarget,
      claim_type: preferredTarget,
      target_section: preferredTarget === "project_description" ? "project_materials" : "profile",
      proposed_value: fullText,
      normalized_value: { text: fullText },
      evidence_excerpt: fullText,
      page_number: lines[0]?.page ?? 1,
      evidence_location: { page: lines[0]?.page ?? 1, section: "document_body" },
      extraction_method: "direct_pdf_text_v1",
      confidence: 0.78,
      status: "needs_clarification",
      sensitivity: "standard",
    })
    if (next) claims.push(next)
  }

  if (["artist_statement", "artist_biography", "artist_cv"].includes(classification)) {
    const disciplines = findTerms(fullText, DISCIPLINE_TERMS)
    if (disciplines.length) {
      const value = disciplines.map((term) => term.replace(/\b\w/g, (letter) => letter.toUpperCase())).join(", ")
      const next = await createClaim({
        target_field: "disciplines",
        claim_type: "disciplines",
        target_section: "practice",
        proposed_value: value,
        normalized_value: { values: disciplines },
        evidence_excerpt: value,
        page_number: null,
        evidence_location: { method: "term_occurrence" },
        extraction_method: "grounded_term_match_v1",
        confidence: 0.78,
        status: "proposed",
        sensitivity: "standard",
      })
      if (next) claims.push(next)
    }
    const mediums = findTerms(fullText, MEDIUM_TERMS)
    if (mediums.length) {
      const value = mediums.map((term) => term.replace(/\b\w/g, (letter) => letter.toUpperCase())).join(", ")
      const next = await createClaim({
        target_field: "mediums",
        claim_type: "mediums",
        target_section: "practice",
        proposed_value: value,
        normalized_value: { values: mediums },
        evidence_excerpt: value,
        page_number: null,
        evidence_location: { method: "term_occurrence" },
        extraction_method: "grounded_term_match_v1",
        confidence: 0.72,
        status: "proposed",
        sensitivity: "standard",
      })
      if (next) claims.push(next)
    }
  }
  return claims
}

function currencyFrom(value: string) {
  if (/€|\bEUR\b/i.test(value)) return "EUR"
  if (/£|\bGBP\b/i.test(value)) return "GBP"
  if (/\bCAD\b/i.test(value)) return "CAD"
  if (/\bAUD\b/i.test(value)) return "AUD"
  if (/\bMXN\b/i.test(value)) return "MXN"
  if (/\$|\bUSD\b/i.test(value)) return "USD"
  return ""
}

function numericAmount(value: string) {
  const matches = Array.from(value.matchAll(/(?:[$€£]\s*)?(-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})|-?\d+(?:\.\d{1,2})?)/g))
  if (!matches.length) return null
  const raw = matches.at(-1)?.[1]?.replaceAll(",", "") ?? ""
  const amount = Number(raw)
  return Number.isFinite(amount) ? amount : null
}

async function extractBudgetClaims(lines: PageLine[]) {
  const lineItems = lines.flatMap((line) => {
    const amount = numericAmount(line.text)
    if (amount === null) return []
    return [{ label: line.text.replace(/(?:[$€£]\s*)?-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\s*$/, "").trim() || "Budget item", amount, page: line.page }]
  })
  const nonTotalItems = lineItems.filter((item) => !/\b(total|subtotal|requested amount|grand total)\b/i.test(item.label))
  const statedTotal = lineItems.findLast((item) => /\b(grand total|total|requested amount)\b/i.test(item.label))?.amount ?? null
  const calculatedTotal = nonTotalItems.reduce((sum, item) => sum + item.amount, 0)
  const consistent = statedTotal === null || Math.abs(statedTotal - calculatedTotal) < 0.01
  const documentText = lines.map((line) => line.text).join("\n")
  const next = await createClaim({
    target_field: "budget_record",
    claim_type: "budget_record",
    target_section: "project_materials",
    proposed_value: documentText,
    normalized_value: {
      currency: currencyFrom(documentText),
      line_items: lineItems,
      calculated_total: calculatedTotal,
      stated_total: statedTotal,
      arithmetic_consistent: consistent,
    },
    evidence_excerpt: documentText,
    page_number: lines[0]?.page ?? 1,
    evidence_location: { pages: Array.from(new Set(lines.map((line) => line.page))) },
    extraction_method: "deterministic_budget_v1",
    confidence: lineItems.length ? 0.86 : 0.35,
    status: lineItems.length && consistent ? "proposed" : "needs_clarification",
    sensitivity: "standard",
    keySource: `budget:${documentText}`,
  })
  return next ? [next] : []
}

function firstDate(value: string, labels: RegExp) {
  const line = value.split("\n").find((candidate) => labels.test(candidate))
  return line?.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+(?:19|20)\d{2}\b|\b(?:19|20)\d{2}[-/]\d{1,2}[-/]\d{1,2}\b/i)?.[0] ?? ""
}

async function extractSensitiveEligibilityClaim(lines: PageLine[], classification: SourceClassification) {
  const text = lines.map((line) => line.text).join("\n")
  const state = US_STATE_NAMES.find((name) => new RegExp(`\\b${name.replace(/ /g, "\\s+")}\\b`, "i").test(text)) ?? ""
  const issueDate = firstDate(text, /issue|issued|effective/i)
  const expirationDate = firstDate(text, /expir|valid until/i)
  const displayParts = [classification === "proof_of_residency" ? "Residency evidence" : "Identification document"]
  if (state) displayParts.push(state)
  if (expirationDate) displayParts.push(`valid through ${expirationDate}`)
  const next = await createClaim({
    target_field: "eligibility_document",
    claim_type: "eligibility_document",
    target_section: "eligibility",
    proposed_value: displayParts.join(" · "),
    normalized_value: {
      document_category: classification,
      state_or_region: state,
      issue_date: issueDate,
      expiration_date: expirationDate,
      validity_status: expirationDate ? "artist_review_required" : "unknown",
    },
    evidence_excerpt: displayParts.join(" · "),
    page_number: lines[0]?.page ?? 1,
    evidence_location: { minimal_extraction: true },
    extraction_method: "minimal_sensitive_document_v1",
    confidence: state ? 0.72 : 0.4,
    status: "needs_clarification",
    sensitivity: classification === "identification_document" ? "highly_sensitive" : "sensitive",
    keySource: `${classification}:${state}`,
  })
  return next ? [next] : []
}

async function extractReferenceClaim(lines: PageLine[]) {
  const visibleLines = lines.map((line) => line.text).filter(Boolean)
  const date = visibleLines.map((line) => firstDate(line, /./)).find(Boolean) ?? ""
  const organization = visibleLines.find((line) => /university|museum|gallery|foundation|residency|institute|center|centre|organization/i.test(line)) ?? ""
  const referee = visibleLines.find((line) => /^(from|signed|sincerely|regards|professor|director|curator)/i.test(line)) ?? ""
  const next = await createClaim({
    target_field: "reference_record",
    claim_type: "reference_record",
    target_section: "references",
    proposed_value: [referee, organization, date].filter(Boolean).join(" · ") || "Reference letter available",
    normalized_value: { referee, organization, date, purpose: "reference_letter" },
    evidence_excerpt: [referee, organization, date].filter(Boolean).join(" · "),
    page_number: lines[0]?.page ?? 1,
    evidence_location: { minimal_extraction: true },
    extraction_method: "minimal_reference_metadata_v1",
    confidence: organization || referee ? 0.6 : 0.3,
    status: "needs_clarification",
    sensitivity: "sensitive",
  })
  return next ? [next] : []
}

async function extractGenericDocumentClaim(source: SourceRow, classification: SourceClassification) {
  const label = source.original_filename || source.label || "Private artist document"
  const next = await createClaim({
    target_field: "supporting_document",
    claim_type: "supporting_document",
    target_section: "supporting_documents",
    proposed_value: label,
    normalized_value: {
      classification,
      mime_type: source.mime_type,
      byte_size: source.byte_size,
      source_id: source.id,
    },
    evidence_excerpt: label,
    page_number: null,
    evidence_location: { source_metadata_only: true },
    extraction_method: "source_metadata_v1",
    confidence: classification === "needs_artist_classification" ? 0.2 : 0.8,
    status: "needs_clarification",
    sensitivity: sourceSensitivity(classification),
  })
  return next ? [next] : []
}

async function buildClaims(source: SourceRow, classification: SourceClassification, pages: string[]) {
  if (source.mime_type.startsWith("image/")) return []
  const lines = pageLines(pages)
  const claims: Claim[] = []
  if (classification === "artist_cv") claims.push(...await extractCvClaims(lines))
  if (["artist_cv", "artist_biography", "artist_statement", "project_proposal"].includes(classification)) {
    claims.push(...await extractNarrativeClaims(lines, classification))
  }
  if (classification === "project_budget") claims.push(...await extractBudgetClaims(lines))
  if (["proof_of_residency", "identification_document"].includes(classification)) {
    claims.push(...await extractSensitiveEligibilityClaim(lines, classification))
  }
  if (classification === "reference_letter") claims.push(...await extractReferenceClaim(lines))
  if (!claims.length) claims.push(...await extractGenericDocumentClaim(source, classification))

  const byFingerprint = new Map<string, Claim>()
  for (const claim of claims) if (!byFingerprint.has(claim.fingerprint)) byFingerprint.set(claim.fingerprint, claim)
  return Array.from(byFingerprint.values()).slice(0, 120)
}

function profileValue(profile: ProfileRow | null, target: string) {
  if (!profile || !(target in profile)) return ""
  const value = profile[target as keyof ProfileRow]
  return Array.isArray(value) ? value.join(", ") : value
}

function normalizedComparable(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/\s+/g, " ").trim()
}

function relateClaims(claims: Claim[], records: PassportRecordRow[], profile: ProfileRow | null) {
  const recordMap = new Map<string, PassportRecordRow[]>()
  for (const record of records) {
    const key = `${record.record_type}:${record.normalized_key}`
    const collection = recordMap.get(key) ?? []
    collection.push(record)
    recordMap.set(key, collection)
  }

  return claims.map((claim) => {
    const profileCurrent = profileValue(profile, claim.target_field)
    if (profileCurrent) {
      if (normalizedComparable(profileCurrent) === normalizedComparable(claim.proposed_value)) {
        return { ...claim, relationship_status: "duplicate" as const, status: "needs_clarification" as const }
      }
      if (["professional_name", "location", "bio", "artist_statement", "practice_description", "website_url", "disciplines", "mediums", "languages", "education", "exhibition_history", "awards"].includes(claim.target_field)) {
        return { ...claim, relationship_status: "conflict" as const, status: "conflicting" as const }
      }
    }

    const matches = recordMap.get(`${claim.claim_type}:${claim.normalized_key}`) ?? []
    const exact = matches.find((record) => normalizedComparable(record.display_value) === normalizedComparable(claim.proposed_value))
    if (exact) return { ...claim, relationship_status: "duplicate" as const, existing_record_id: exact.id, status: "needs_clarification" as const }
    if (matches.length) return { ...claim, relationship_status: "conflict" as const, existing_record_id: matches[0].id, status: "conflicting" as const }
    return claim
  })
}

function documentFamily(classification: SourceClassification) {
  return [
    "artist_cv", "artist_biography", "artist_statement", "project_proposal", "project_budget", "work_sample_list",
    "proof_of_residency", "identification_document", "reference_letter", "application_requirement_file", "other_artist_material",
  ].includes(classification) ? classification : null
}

async function upsertDocumentVersion(admin: ReturnType<typeof createClient>, source: SourceRow, classification: SourceClassification, claimCount: number) {
  const family = documentFamily(classification)
  if (!family) return null
  const { data: existingVersion } = await admin
    .from("artist_document_versions")
    .select("id,version_number,is_current")
    .eq("source_id", source.id)
    .maybeSingle()
  if (existingVersion) return existingVersion

  const { data: current } = await admin
    .from("artist_document_versions")
    .select("id,source_id,version_number")
    .eq("artist_user_id", source.artist_user_id)
    .eq("document_family", family)
    .eq("is_current", true)
    .maybeSingle()
  const nextVersion = Number(current?.version_number ?? 0) + 1
  if (current?.id) {
    await admin.from("artist_document_versions").update({
      is_current: false,
      status: "superseded",
      updated_at: new Date().toISOString(),
    }).eq("id", current.id).eq("artist_user_id", source.artist_user_id)
    await admin.from("artist_import_sources").update({
      is_current_version: false,
      updated_at: new Date().toISOString(),
    }).eq("id", current.source_id).eq("artist_user_id", source.artist_user_id)
  }

  const { data: inserted, error } = await admin.from("artist_document_versions").insert({
    artist_user_id: source.artist_user_id,
    source_id: source.id,
    document_family: family,
    version_number: nextVersion,
    previous_source_id: current?.source_id ?? null,
    is_current: true,
    status: "current",
    comparison_summary: {
      previous_source_id: current?.source_id ?? null,
      extracted_claim_count: claimCount,
      historical_records_are_not_removed: true,
    },
  }).select("id,version_number,is_current").single()
  if (error) throw error

  await admin.from("artist_import_sources").update({
    document_version: nextVersion,
    is_current_version: true,
    parent_source_id: current?.source_id ?? source.parent_source_id ?? null,
    updated_at: new Date().toISOString(),
  }).eq("id", source.id).eq("artist_user_id", source.artist_user_id)
  return inserted
}

function extractionErrorCategory(reason: unknown) {
  const message = reason instanceof Error ? reason.message.toLowerCase() : ""
  if (message.includes("password")) return "password_protected_pdf"
  if (message.includes("invalid pdf") || message.includes("format")) return "corrupt_or_unsupported_pdf"
  if (message.includes("size")) return "file_too_large"
  return "extraction_service_error"
}

async function sourceFilePages(admin: ReturnType<typeof createClient>, source: SourceRow) {
  if (source.mime_type.startsWith("image/")) return { pages: [] as string[], method: "technical_image_metadata" }
  const metadata = isObject(source.source_metadata) ? source.source_metadata : {}
  const bucket = metadata.storage_bucket === "artist-documents" || source.source_type === "pdf" ? "artist-documents" : "artist-assets"
  if (!source.storage_path || !source.storage_path.startsWith(`${source.artist_user_id}/`) || source.storage_path.includes("..")) {
    throw new Error("source unavailable")
  }
  const { data: object, error } = await admin.storage.from(bucket).download(source.storage_path)
  if (error || !object) throw new Error("source unavailable")
  if (object.size > MAX_FILE_BYTES) throw new Error("file size exceeds limit")
  const bytes = new Uint8Array(await object.arrayBuffer())

  if (source.mime_type === "application/pdf") {
    if (bytes.length < 5 || new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("invalid PDF signature")
    const pdf = await getDocumentProxy(bytes)
    const result = await extractText(pdf, { mergePages: false })
    const pages = Array.isArray(result.text) ? result.text.map((page) => normalizedText(page)) : [normalizedText(result.text)]
    return { pages, method: "embedded_pdf_text", totalPages: result.totalPages }
  }
  if (["text/plain", "text/markdown", "application/json"].includes(source.mime_type)) {
    return { pages: [normalizedText(new TextDecoder().decode(bytes))], method: "direct_text", totalPages: 1 }
  }
  return { pages: [] as string[], method: "unsupported_text_extraction", totalPages: null }
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
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })
  const { data: userData, error: userError } = await authClient.auth.getUser(token)
  if (userError || !userData.user) return json(request, { error: "authentication_required" }, 401)
  const user = userData.user

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: roleRow } = await admin.from("profiles").select("role").eq("id", user.id).single()
  if (roleRow?.role !== "artist") return json(request, { error: "artist_account_required" }, 403)

  let input: JsonObject
  try {
    const parsed = await request.json()
    if (!isObject(parsed)) return json(request, { error: "invalid_json" }, 400)
    input = parsed
  } catch {
    return json(request, { error: "invalid_json" }, 400)
  }

  let source: SourceRow | null = null
  let sourceId = typeof input.sourceId === "string" ? input.sourceId : ""
  let pastedPages: string[] | null = null

  if (sourceId) {
    const { data, error } = await admin
      .from("artist_import_sources")
      .select("*")
      .eq("id", sourceId)
      .eq("artist_user_id", user.id)
      .is("deleted_at", null)
      .single()
    if (error || !data) return json(request, { error: "source_unavailable" }, 404)
    source = data as SourceRow
  } else if (input.sourceType === "pasted_text") {
    const text = typeof input.text === "string" ? normalizedText(input.text) : ""
    if (!text) return json(request, { error: "text_required" }, 400)
    const checksum = await sha256(text)
    const { data: existing } = await admin
      .from("artist_import_sources")
      .select("*")
      .eq("artist_user_id", user.id)
      .eq("checksum", checksum)
      .is("deleted_at", null)
      .maybeSingle()
    if (existing) {
      source = existing as SourceRow
      sourceId = source.id
    } else {
      const label = cleanLabel(input.label) || "Pasted artist material"
      const { data: inserted, error } = await admin.from("artist_import_sources").insert({
        artist_user_id: user.id,
        source_type: "pasted_text",
        label,
        mime_type: "text/plain",
        byte_size: new TextEncoder().encode(text).byteLength,
        checksum,
        extraction_status: "queued",
        extraction_method: EXTRACTOR_VERSION,
        extraction_version: EXTRACTOR_VERSION,
        original_filename: label,
        source_metadata: { import_context: "creative_passport", storage_bucket: null },
        media_kind: "document",
        library_status: "available",
      }).select("*").single()
      if (error || !inserted) return json(request, { error: "source_record_failed" }, 500)
      source = inserted as SourceRow
      sourceId = source.id
    }
    pastedPages = [text]
  } else {
    return json(request, { error: "source_id_required" }, 400)
  }

  const label = cleanLabel(input.label) || source.original_filename || source.label || "Artist material"
  let pages = pastedPages ?? []
  let extractionMethod = pastedPages ? "direct_text" : "technical_metadata"
  let totalPages: number | null = pastedPages ? 1 : null
  let classificationResult = inferClassification({ requested: input.classification, source, text: pages.join("\n"), label })
  let sensitivity = sourceSensitivity(classificationResult.classification)
  let jobId = ""

  try {
    const { data: job, error: jobError } = await admin.from("artist_extraction_jobs").upsert({
      artist_user_id: user.id,
      source_id: source.id,
      classification: classificationResult.classification,
      status: "processing",
      extractor_version: EXTRACTOR_VERSION,
      started_at: new Date().toISOString(),
      completed_at: null,
      error_category: "",
      updated_at: new Date().toISOString(),
    }, { onConflict: "source_id,extractor_version" }).select("id").single()
    if (jobError || !job) return json(request, { error: "extraction_job_failed" }, 500)
    jobId = String(job.id)

    await admin.from("artist_import_sources").update({
      extraction_status: "processing",
      extraction_method: EXTRACTOR_VERSION,
      extraction_version: EXTRACTOR_VERSION,
      classification: classificationResult.classification,
      classification_confidence: classificationResult.confidence,
      classification_reason: classificationResult.reason,
      sensitivity,
      privacy_level: sensitivity === "standard" ? "private" : "restricted",
      last_error_category: "",
      updated_at: new Date().toISOString(),
    }).eq("id", source.id).eq("artist_user_id", user.id)

    if (!pastedPages) {
      const extracted = await sourceFilePages(admin, source)
      pages = extracted.pages
      extractionMethod = extracted.method
      totalPages = extracted.totalPages ?? null
      classificationResult = inferClassification({ requested: input.classification, source, text: pages.join("\n"), label })
      sensitivity = sourceSensitivity(classificationResult.classification)
    }

    const mergedText = normalizedText(pages.join("\n\n"))
    const imageOnlyPdf = source.mime_type === "application/pdf" && !mergedText
    const claims = relateClaims(
      await buildClaims(source, classificationResult.classification, pages),
      ((await admin.from("artist_passport_records").select("id,record_type,display_value,normalized_value,normalized_key").eq("artist_user_id", user.id).eq("status", "active")).data ?? []) as PassportRecordRow[],
      ((await admin.from("artist_profiles").select("professional_name,location,bio,artist_statement,practice_description,website_url,disciplines,mediums,languages,education,exhibition_history,awards").eq("user_id", user.id).maybeSingle()).data ?? null) as ProfileRow | null,
    )

    await admin.from("artist_import_proposals").delete()
      .eq("source_id", source.id)
      .eq("artist_user_id", user.id)
      .in("status", ["proposed", "needs_clarification", "conflicting", "source_unavailable", "extraction_failed"])

    if (claims.length) {
      const { error: claimError } = await admin.from("artist_import_proposals").insert(claims.map((claim) => ({
        source_id: source.id,
        artist_user_id: user.id,
        extraction_job_id: jobId,
        target_field: claim.target_field,
        claim_type: claim.claim_type,
        target_section: claim.target_section,
        proposed_value: claim.proposed_value,
        normalized_value: claim.normalized_value,
        evidence_excerpt: claim.evidence_excerpt,
        page_number: claim.page_number,
        evidence_location: claim.evidence_location,
        extraction_method: claim.extraction_method,
        confidence: claim.confidence,
        status: claim.status,
        sensitivity: claim.sensitivity,
        fingerprint: claim.fingerprint,
        relationship_status: claim.relationship_status,
        existing_record_id: claim.existing_record_id ?? null,
      })))
      if (claimError) throw claimError
    } else if (!source.mime_type.startsWith("image/")) {
      await admin.from("artist_import_proposals").insert({
        source_id: source.id,
        artist_user_id: user.id,
        extraction_job_id: jobId,
        target_field: "supporting_document",
        claim_type: "supporting_document",
        target_section: "supporting_documents",
        proposed_value: imageOnlyPdf ? "This PDF has no accessible text layer. OCR or artist classification is required." : label,
        normalized_value: { classification: classificationResult.classification, source_id: source.id },
        evidence_excerpt: imageOnlyPdf ? "No accessible PDF text was found." : label,
        evidence_location: { source_metadata_only: true },
        extraction_method: imageOnlyPdf ? "ocr_required" : extractionMethod,
        confidence: imageOnlyPdf ? 0 : 0.2,
        status: "needs_clarification",
        sensitivity,
        fingerprint: await claimFingerprint("supporting_document", source.id, label),
        relationship_status: "unresolved",
      })
    }

    const version = await upsertDocumentVersion(admin, source, classificationResult.classification, claims.length)
    const status = classificationResult.classification === "needs_artist_classification"
      ? "needs_artist_classification"
      : imageOnlyPdf
        ? "partially_extracted"
        : "ready_for_review"
    const summary = {
      classification: classificationResult.classification,
      classification_confidence: classificationResult.confidence,
      classification_reason: classificationResult.reason,
      claim_count: claims.length,
      conflict_count: claims.filter((claim) => claim.relationship_status === "conflict").length,
      duplicate_count: claims.filter((claim) => claim.relationship_status === "duplicate").length,
      extraction_method: extractionMethod,
      total_pages: totalPages,
      text_layer_available: Boolean(mergedText),
      ocr_required: imageOnlyPdf,
      document_version: version?.version_number ?? source.document_version,
      original_source_preserved: true,
      artist_confirmation_required: true,
    }
    const textChecksum = mergedText ? await sha256(mergedText) : ""

    await admin.from("artist_extraction_jobs").update({
      classification: classificationResult.classification,
      status,
      extracted_text: sensitivity === "standard" ? mergedText : "",
      extracted_text_checksum: textChecksum,
      total_pages: totalPages,
      summary,
      completed_at: new Date().toISOString(),
      error_category: imageOnlyPdf ? "ocr_required" : "",
      updated_at: new Date().toISOString(),
    }).eq("id", jobId).eq("artist_user_id", user.id)

    await admin.from("artist_import_sources").update({
      classification: classificationResult.classification,
      classification_confidence: classificationResult.confidence,
      classification_reason: classificationResult.reason,
      extraction_status: status,
      extraction_method: extractionMethod,
      extraction_version: EXTRACTOR_VERSION,
      extracted_at: new Date().toISOString(),
      sensitivity,
      privacy_level: sensitivity === "standard" ? "private" : "restricted",
      content_language: "",
      last_error_category: imageOnlyPdf ? "ocr_required" : "",
      review_summary: summary,
      updated_at: new Date().toISOString(),
    }).eq("id", source.id).eq("artist_user_id", user.id)

    return json(request, {
      sourceId: source.id,
      jobId,
      proposalCount: claims.length,
      extractionStatus: status,
      classification: classificationResult.classification,
      classificationConfidence: classificationResult.confidence,
      documentVersion: version?.version_number ?? source.document_version,
      warnings: imageOnlyPdf ? ["ocr_required"] : [],
    })
  } catch (reason) {
    const errorCategory = extractionErrorCategory(reason)
    if (jobId) {
      await admin.from("artist_extraction_jobs").update({
        status: "failed",
        error_category: errorCategory,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", jobId).eq("artist_user_id", user.id)
    }
    await admin.from("artist_import_sources").update({
      extraction_status: "failed",
      last_error_category: errorCategory,
      review_summary: {
        error_category: errorCategory,
        original_source_preserved: true,
        artist_action: errorCategory === "password_protected_pdf"
          ? "Upload an unlocked copy."
          : "Review the source or try extraction again.",
      },
      updated_at: new Date().toISOString(),
    }).eq("id", source.id).eq("artist_user_id", user.id)
    return json(request, { error: errorCategory, sourceId: source.id }, errorCategory === "file_too_large" ? 413 : 422)
  }
})
