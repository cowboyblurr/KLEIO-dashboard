import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import { loadArtistPassport, saveArtistPassport, type ArtistPassportRecord, type PortfolioWorkRecord } from "@/lib/kleio-live-data"
import type { ArtistMediaLibraryItem } from "@/lib/kleio-universal-media"

export type SourceClassification =
  | "artwork_image"
  | "artwork_detail_image"
  | "artist_cv"
  | "artist_biography"
  | "artist_statement"
  | "project_proposal"
  | "project_budget"
  | "work_sample_list"
  | "proof_of_residency"
  | "identification_document"
  | "reference_letter"
  | "press_publication"
  | "exhibition_documentation"
  | "award_grant_documentation"
  | "application_requirement_file"
  | "unknown_document"
  | "other_artist_material"
  | "needs_artist_classification"

export type ExtractionStatus =
  | "pending"
  | "queued"
  | "processing"
  | "completed"
  | "partial"
  | "partially_extracted"
  | "source_unavailable"
  | "failed"
  | "review_ready"
  | "ready_for_review"
  | "approved"
  | "artist_review_completed"
  | "needs_artist_classification"

export type ClaimStatus =
  | "proposed"
  | "approved"
  | "edited_approved"
  | "rejected"
  | "deferred"
  | "conflicting"
  | "needs_clarification"
  | "source_unavailable"
  | "extraction_failed"
  | "merged"
  | "superseded"
  | "outdated"

export type RequirementAssessmentStatus =
  | "satisfied"
  | "likely_satisfied"
  | "needs_artist_review"
  | "partially_satisfied"
  | "missing"
  | "conflict_detected"
  | "requirement_changed"
  | "cannot_determine"

export type PassportSourceSummary = {
  id: string
  label: string
  original_filename: string | null
  storage_path: string
  mime_type: string
  byte_size: number | null
  checksum: string
  classification: SourceClassification
  classification_confidence: number | null
  classification_reason: string
  extraction_status: ExtractionStatus
  extraction_method: string
  extraction_version: string
  sensitivity: "standard" | "sensitive" | "highly_sensitive"
  privacy_level: "private" | "application_only" | "restricted"
  document_version: number
  is_current_version: boolean
  review_summary: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type PassportClaim = {
  id: string
  source_id: string
  extraction_job_id: string | null
  target_field: string
  claim_type: string
  target_section: string
  proposed_value: string
  normalized_value: Record<string, unknown>
  evidence_excerpt: string
  page_number: number | null
  evidence_location: Record<string, unknown>
  extraction_method: string
  confidence: number | null
  status: ClaimStatus
  sensitivity: "standard" | "sensitive" | "highly_sensitive"
  relationship_status: "new" | "duplicate" | "conflict" | "superseded" | "unresolved"
  existing_record_id: string | null
  artist_edited_value: string
  decision_reason: string
  decided_at: string | null
  created_at: string
  source: PassportSourceSummary | null
  existing_record: {
    id: string
    record_type: string
    display_value: string
    normalized_value: Record<string, unknown>
    provenance_status: string
    status: string
  } | null
}

export type PassportReviewGroup = {
  source: PassportSourceSummary
  claims: PassportClaim[]
  pendingCount: number
  conflictCount: number
  duplicateCount: number
}

export type RequirementRecord = {
  id: string
  opportunity_id: string
  material_key: string
  label: string
  description: string
  required: boolean
  category: string
  input_type: string
  passport_field: string
  minimum_word_count: number | null
  maximum_word_count: number | null
  minimum_item_count: number | null
  maximum_item_count: number | null
  accepted_file_types: string[]
  maximum_file_size_bytes: number | null
  maximum_total_size_bytes: number | null
  filename_pattern: string
  requires_artist_confirmation: boolean
  human_verification_required: boolean
  verification_status: string
  last_verified_at: string | null
  updated_at: string
  constraints: Record<string, unknown>
}

export type RequirementAttachment = {
  id: string
  opportunity_id: string
  requirement_id: string
  application_id: string | null
  package_id: string | null
  source_id: string
  source_version_id: string | null
  validation_status: RequirementAssessmentStatus | "invalid"
  validation_results: ValidationCheck[]
  included_in_package: boolean
  artist_confirmed_at: string | null
  created_at: string
  updated_at: string
  source: PassportSourceSummary | null
}

export type ValidationCheck = {
  rule: string
  passed: boolean | null
  required: boolean
  expected?: unknown
  actual?: unknown
  explanation: string
}

export const SOURCE_CLASSIFICATION_OPTIONS: Array<{ value: SourceClassification; label: string; sensitive?: boolean }> = [
  { value: "artist_cv", label: "Artist CV" },
  { value: "artist_biography", label: "Artist biography" },
  { value: "artist_statement", label: "Artist statement" },
  { value: "project_proposal", label: "Project proposal" },
  { value: "project_budget", label: "Project budget" },
  { value: "work_sample_list", label: "Work sample list" },
  { value: "proof_of_residency", label: "Proof of residency", sensitive: true },
  { value: "identification_document", label: "Identification document", sensitive: true },
  { value: "reference_letter", label: "Reference letter", sensitive: true },
  { value: "press_publication", label: "Press or publication" },
  { value: "exhibition_documentation", label: "Exhibition documentation" },
  { value: "award_grant_documentation", label: "Award or grant documentation" },
  { value: "application_requirement_file", label: "Application requirement file" },
  { value: "other_artist_material", label: "Other artist material" },
  { value: "needs_artist_classification", label: "Not sure yet" },
]

const pendingStatuses: ClaimStatus[] = ["proposed", "needs_clarification", "conflicting", "deferred"]
const simpleProfileFields = new Set([
  "professional_name",
  "location",
  "bio",
  "artist_statement",
  "practice_description",
  "website_url",
  "disciplines",
  "mediums",
  "languages",
  "education",
  "exhibition_history",
  "awards",
])

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : []
}

function splitTerms(value: string) {
  return Array.from(new Set(value.split(/[,;\n]/).map((entry) => entry.trim()).filter(Boolean)))
}

function normalizeKey(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/\b(19|20)\d{2}\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim().slice(0, 240)
}

function classificationForContext(item: ArtistMediaLibraryItem, preferred?: SourceClassification): SourceClassification {
  if (preferred) return preferred
  if (item.mediaKind === "image") return "artwork_image"
  return "needs_artist_classification"
}

function errorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback
  const message = error.message.replaceAll("_", " ")
  if (/ocr required/i.test(message)) return "This PDF does not contain an accessible text layer. Your original file is safe, but OCR or manual review is required."
  if (/password protected/i.test(message)) return "This PDF appears to be password protected. Your original file is safe; upload an unlocked copy to extract information."
  if (/source unavailable/i.test(message)) return "The original file could not be opened. Check that it still exists in your private KLEIO Library."
  return message || fallback
}

async function requireArtist() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  if (account.profile.role !== "artist") throw new Error("This action is available only in an artist workspace.")
  return account
}

export async function requestSourceExtraction(sourceId: string, classification?: SourceClassification) {
  if (!sourceId) throw new Error("A private source is required before analysis can begin.")
  await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("extract-artist-materials", {
    body: { sourceId, classification },
  })
  if (error) throw new Error(errorMessage(error, "KLEIO could not analyze this source."))
  if (data?.error) throw new Error(errorMessage(new Error(String(data.error)), "KLEIO could not analyze this source."))
  return data as {
    sourceId: string
    jobId: string
    proposalCount: number
    extractionStatus: ExtractionStatus
    classification: SourceClassification
    classificationConfidence: number
    documentVersion: number
    warnings: string[]
  }
}

export async function requestMediaExtraction(item: ArtistMediaLibraryItem, classification?: SourceClassification) {
  if (!item.sourceId) throw new Error("This legacy media item needs to be imported into the private KLEIO Library before analysis.")
  return requestSourceExtraction(item.sourceId, classificationForContext(item, classification))
}

export async function updateSourceClassification(sourceId: string, classification: SourceClassification) {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const sensitive = classification === "identification_document" ? "highly_sensitive" : ["proof_of_residency", "reference_letter"].includes(classification) ? "sensitive" : "standard"
  const { error } = await supabase.from("artist_import_sources").update({
    classification,
    classification_confidence: 1,
    classification_reason: "Artist selected this document category.",
    sensitivity: sensitive,
    privacy_level: sensitive === "standard" ? "private" : "restricted",
    extraction_status: "queued",
    updated_at: new Date().toISOString(),
  }).eq("id", sourceId).eq("artist_user_id", account.user.id)
  if (error) throw error
  return requestSourceExtraction(sourceId, classification)
}

export async function loadPassportReviewInbox(): Promise<PassportReviewGroup[]> {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("artist_import_proposals")
    .select(`
      id,source_id,extraction_job_id,target_field,claim_type,target_section,proposed_value,normalized_value,
      evidence_excerpt,page_number,evidence_location,extraction_method,confidence,status,sensitivity,
      relationship_status,existing_record_id,artist_edited_value,decision_reason,decided_at,created_at,
      source:artist_import_sources!artist_import_proposals_source_id_fkey(
        id,label,original_filename,storage_path,mime_type,byte_size,checksum,classification,classification_confidence,
        classification_reason,extraction_status,extraction_method,extraction_version,sensitivity,privacy_level,
        document_version,is_current_version,review_summary,created_at,updated_at
      ),
      existing_record:artist_passport_records!artist_import_proposals_existing_record_id_fkey(
        id,record_type,display_value,normalized_value,provenance_status,status
      )
    `)
    .eq("artist_user_id", account.user.id)
    .order("created_at", { ascending: false })
  if (error) throw error

  const claims = (data ?? []).map((row) => {
    const source = Array.isArray(row.source) ? row.source[0] : row.source
    const existingRecord = Array.isArray(row.existing_record) ? row.existing_record[0] : row.existing_record
    return {
      ...row,
      normalized_value: asObject(row.normalized_value),
      evidence_location: asObject(row.evidence_location),
      source: source ? { ...source, review_summary: asObject(source.review_summary) } : null,
      existing_record: existingRecord ? { ...existingRecord, normalized_value: asObject(existingRecord.normalized_value) } : null,
    } as unknown as PassportClaim
  })

  const bySource = new Map<string, PassportReviewGroup>()
  for (const claim of claims) {
    if (!claim.source) continue
    const existing = bySource.get(claim.source_id) ?? {
      source: claim.source,
      claims: [],
      pendingCount: 0,
      conflictCount: 0,
      duplicateCount: 0,
    }
    existing.claims.push(claim)
    if (pendingStatuses.includes(claim.status)) existing.pendingCount += 1
    if (claim.relationship_status === "conflict") existing.conflictCount += 1
    if (claim.relationship_status === "duplicate") existing.duplicateCount += 1
    bySource.set(claim.source_id, existing)
  }
  return Array.from(bySource.values()).sort((left, right) => Date.parse(right.source.updated_at) - Date.parse(left.source.updated_at))
}

export async function loadPassportReviewCount() {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { count, error } = await supabase
    .from("artist_import_proposals")
    .select("id", { count: "exact", head: true })
    .eq("artist_user_id", account.user.id)
    .in("status", pendingStatuses)
  if (error) throw error
  return count ?? 0
}

function legacyFieldForClaim(claimType: string) {
  if (claimType === "education_record") return "education"
  if (["solo_exhibition_record", "group_exhibition_record", "exhibition_record"].includes(claimType)) return "exhibition_history"
  if (["award_record", "grant_record", "fellowship_record"].includes(claimType)) return "awards"
  return null
}

function appendLegacyLine(current: string, value: string) {
  const lines = current.split("\n").map((line) => line.trim()).filter(Boolean)
  if (!lines.some((line) => normalizeKey(line) === normalizeKey(value))) lines.push(value)
  return lines.join("\n")
}

async function applyClaimToLegacyPassport(claim: PassportClaim, value: string) {
  const passport = await loadArtistPassport()
  if (!passport) throw new Error("Open your Creative Passport once before confirming imported information.")
  const next: ArtistPassportRecord = { ...passport }
  const target = simpleProfileFields.has(claim.target_field) ? claim.target_field : legacyFieldForClaim(claim.claim_type)
  if (!target) return

  if (target === "disciplines" || target === "mediums" || target === "languages") {
    const existing = next[target] as string[]
    next[target] = Array.from(new Set([...existing, ...splitTerms(value)])) as never
  } else if (target === "education" || target === "exhibition_history" || target === "awards") {
    next[target] = appendLegacyLine(String(next[target] ?? ""), value) as never
  } else if (target in next) {
    next[target as keyof ArtistPassportRecord] = value as never
  }

  await saveArtistPassport({
    ...next,
    disciplines_text: next.disciplines.join(", "),
    mediums_text: next.mediums.join(", "),
    languages_text: next.languages.join(", "),
  })
}

export async function confirmPassportClaim(
  claim: PassportClaim,
  options: { value?: string; visibility?: "private" | "application_only" | "public"; replaceExisting?: boolean } = {},
) {
  const account = await requireArtist()
  const value = (options.value ?? claim.artist_edited_value ?? claim.proposed_value).trim()
  if (!value) throw new Error("Confirmed information cannot be empty.")
  const supabase = getSupabaseBrowserClient()
  const normalized = Object.keys(claim.normalized_value).length ? claim.normalized_value : { text: value }
  const normalizedKey = normalizeKey(String(normalized.title ?? normalized.institution ?? normalized.text ?? value))
  const now = new Date().toISOString()

  let supersedesRecordId: string | null = null
  let version = 1
  if (options.replaceExisting && claim.existing_record_id) {
    const { data: existing, error: existingError } = await supabase
      .from("artist_passport_records")
      .select("id,version")
      .eq("id", claim.existing_record_id)
      .eq("artist_user_id", account.user.id)
      .single()
    if (existingError) throw existingError
    supersedesRecordId = existing.id
    version = Number(existing.version ?? 0) + 1
    const { error: supersedeError } = await supabase.from("artist_passport_records").update({
      status: "superseded",
      updated_at: now,
    }).eq("id", existing.id).eq("artist_user_id", account.user.id)
    if (supersedeError) throw supersedeError
  }

  const edited = value !== claim.proposed_value.trim()
  const { data: record, error: recordError } = await supabase.from("artist_passport_records").insert({
    artist_user_id: account.user.id,
    record_type: claim.claim_type,
    section: claim.target_section,
    display_value: value,
    normalized_value: normalized,
    normalized_key: normalizedKey,
    source_claim_id: claim.id,
    source_id: claim.source_id,
    source_page: claim.page_number,
    evidence_excerpt: claim.evidence_excerpt,
    provenance_status: edited ? "edited" : "confirmed",
    visibility: options.visibility ?? "private",
    status: "active",
    version,
    supersedes_record_id: supersedesRecordId,
    is_sensitive: claim.sensitivity !== "standard",
    confirmed_at: now,
    last_reviewed_at: now,
  }).select("id").single()
  if (recordError) throw recordError

  await applyClaimToLegacyPassport(claim, value)
  const { error: claimError } = await supabase.from("artist_import_proposals").update({
    status: edited ? "edited_approved" : "approved",
    artist_edited_value: edited ? value : "",
    decided_at: now,
    decision_reason: options.replaceExisting ? "Artist confirmed this value as a replacement." : "Artist confirmed this Passport record.",
    updated_at: now,
  }).eq("id", claim.id).eq("artist_user_id", account.user.id)
  if (claimError) throw claimError

  const { count } = await supabase
    .from("artist_import_proposals")
    .select("id", { count: "exact", head: true })
    .eq("source_id", claim.source_id)
    .eq("artist_user_id", account.user.id)
    .in("status", pendingStatuses)
  if ((count ?? 0) === 0) {
    await supabase.from("artist_import_sources").update({
      extraction_status: "artist_review_completed",
      updated_at: now,
    }).eq("id", claim.source_id).eq("artist_user_id", account.user.id)
  }
  return String(record.id)
}

export async function setPassportClaimDecision(
  claimId: string,
  status: Extract<ClaimStatus, "rejected" | "deferred" | "outdated">,
  reason = "",
) {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("artist_import_proposals").update({
    status,
    decision_reason: reason.trim(),
    decided_at: status === "deferred" ? null : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", claimId).eq("artist_user_id", account.user.id)
  if (error) throw error
}

export async function mergeDuplicateClaim(claim: PassportClaim) {
  if (!claim.existing_record_id) throw new Error("KLEIO could not find the existing Passport record for this duplicate.")
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("artist_import_proposals").update({
    status: "merged",
    relationship_status: "duplicate",
    decision_reason: "Artist kept the existing Passport record and linked this source as supporting evidence.",
    decided_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", claim.id).eq("artist_user_id", account.user.id)
  if (error) throw error
}

export async function bulkConfirmSafeClaims(claims: PassportClaim[]) {
  const safe = claims.filter((claim) =>
    ["proposed"].includes(claim.status)
    && claim.relationship_status === "new"
    && claim.sensitivity === "standard"
    && (claim.confidence ?? 0) >= 0.8,
  )
  const results: string[] = []
  for (const claim of safe) results.push(await confirmPassportClaim(claim))
  return results
}

export function validateSourceAgainstRequirement(source: PassportSourceSummary, requirement: RequirementRecord): ValidationCheck[] {
  const checks: ValidationCheck[] = []
  const accepted = requirement.accepted_file_types ?? []
  checks.push({
    rule: "file_type",
    passed: accepted.length ? accepted.includes(source.mime_type) : null,
    required: accepted.length > 0,
    expected: accepted,
    actual: source.mime_type,
    explanation: accepted.length
      ? accepted.includes(source.mime_type) ? "The selected file type is accepted." : "The selected file type does not match the published requirement."
      : "The source does not state an accepted file type; artist review is required.",
  })
  checks.push({
    rule: "maximum_file_size",
    passed: requirement.maximum_file_size_bytes && source.byte_size !== null
      ? source.byte_size <= requirement.maximum_file_size_bytes
      : null,
    required: Boolean(requirement.maximum_file_size_bytes),
    expected: requirement.maximum_file_size_bytes,
    actual: source.byte_size,
    explanation: requirement.maximum_file_size_bytes
      ? source.byte_size === null
        ? "KLEIO could not verify the file size."
        : source.byte_size <= requirement.maximum_file_size_bytes
          ? "The file is under the published size limit."
          : "The file is larger than the published size limit."
      : "No file-size limit is stated in the current requirement record.",
  })
  if (requirement.filename_pattern) {
    let passed: boolean | null = null
    try {
      passed = new RegExp(requirement.filename_pattern).test(source.original_filename || source.label)
    } catch {
      passed = null
    }
    checks.push({
      rule: "filename_pattern",
      passed,
      required: true,
      expected: requirement.filename_pattern,
      actual: source.original_filename || source.label,
      explanation: passed === true
        ? "The filename matches the published pattern."
        : passed === false
          ? "The filename does not match the published pattern."
          : "The published filename rule could not be evaluated safely.",
    })
  }
  checks.push({
    rule: "artist_confirmation",
    passed: null,
    required: true,
    explanation: "KLEIO never includes a private source in an application package without artist confirmation.",
  })
  if (requirement.human_verification_required || requirement.verification_status !== "verified") {
    checks.push({
      rule: "requirement_source_verification",
      passed: null,
      required: true,
      actual: requirement.verification_status,
      explanation: "The published requirement still needs human or external-portal confirmation.",
    })
  }
  return checks
}

function assessmentStatusForChecks(checks: ValidationCheck[], confirmed: boolean): RequirementAssessmentStatus | "invalid" {
  if (checks.some((check) => check.required && check.passed === false)) return "invalid"
  if (!confirmed) return "needs_artist_review"
  if (checks.some((check) => check.required && check.passed === null)) return "likely_satisfied"
  return "satisfied"
}

export async function loadOpportunityRequirements(opportunityId: string): Promise<RequirementRecord[]> {
  await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("opportunity_requirements")
    .select("id,opportunity_id,material_key,label,description,required,category,input_type,passport_field,minimum_word_count,maximum_word_count,minimum_item_count,maximum_item_count,accepted_file_types,maximum_file_size_bytes,maximum_total_size_bytes,filename_pattern,requires_artist_confirmation,human_verification_required,verification_status,last_verified_at,updated_at,constraints")
    .eq("opportunity_id", opportunityId)
    .order("sort_order")
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    accepted_file_types: asStringArray(row.accepted_file_types),
    constraints: asObject(row.constraints),
  })) as RequirementRecord[]
}

export async function loadRequirementAttachments(opportunityId: string): Promise<RequirementAttachment[]> {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("application_requirement_attachments")
    .select(`
      id,opportunity_id,requirement_id,application_id,package_id,source_id,source_version_id,validation_status,
      validation_results,included_in_package,artist_confirmed_at,created_at,updated_at,
      source:artist_import_sources!application_requirement_attachments_source_id_fkey(
        id,label,original_filename,storage_path,mime_type,byte_size,checksum,classification,classification_confidence,
        classification_reason,extraction_status,extraction_method,extraction_version,sensitivity,privacy_level,
        document_version,is_current_version,review_summary,created_at,updated_at
      )
    `)
    .eq("artist_user_id", account.user.id)
    .eq("opportunity_id", opportunityId)
    .order("created_at")
  if (error) throw error
  return (data ?? []).map((row) => {
    const source = Array.isArray(row.source) ? row.source[0] : row.source
    return {
      ...row,
      validation_results: Array.isArray(row.validation_results) ? row.validation_results : [],
      source: source ? { ...source, review_summary: asObject(source.review_summary) } : null,
    } as unknown as RequirementAttachment
  })
}

export async function attachMediaToRequirement(input: {
  item: ArtistMediaLibraryItem
  requirement: RequirementRecord
  applicationId?: string | null
  packageId?: string | null
  artistConfirmed?: boolean
}) {
  if (!input.item.sourceId) throw new Error("This file must be stored in the private KLEIO Library before it can satisfy a requirement.")
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data: source, error: sourceError } = await supabase
    .from("artist_import_sources")
    .select("id,label,original_filename,storage_path,mime_type,byte_size,checksum,classification,classification_confidence,classification_reason,extraction_status,extraction_method,extraction_version,sensitivity,privacy_level,document_version,is_current_version,review_summary,created_at,updated_at")
    .eq("id", input.item.sourceId)
    .eq("artist_user_id", account.user.id)
    .single()
  if (sourceError) throw sourceError
  const sourceSummary = { ...source, review_summary: asObject(source.review_summary) } as PassportSourceSummary
  const checks = validateSourceAgainstRequirement(sourceSummary, input.requirement)
  const confirmed = Boolean(input.artistConfirmed)
  const status = assessmentStatusForChecks(checks, confirmed)
  const now = new Date().toISOString()
  const { data: version } = await supabase
    .from("artist_document_versions")
    .select("id")
    .eq("source_id", input.item.sourceId)
    .maybeSingle()

  const { data: attachment, error } = await supabase.from("application_requirement_attachments").upsert({
    artist_user_id: account.user.id,
    opportunity_id: input.requirement.opportunity_id,
    requirement_id: input.requirement.id,
    application_id: input.applicationId || null,
    package_id: input.packageId || null,
    source_id: input.item.sourceId,
    source_version_id: version?.id ?? null,
    validation_status: status,
    validation_results: checks,
    included_in_package: confirmed && status !== "invalid",
    artist_confirmed_at: confirmed ? now : null,
    updated_at: now,
  }, { onConflict: "artist_user_id,opportunity_id,requirement_id,source_id" }).select("id").single()
  if (error) throw error

  await supabase.from("artist_requirement_assessments").upsert({
    artist_user_id: account.user.id,
    opportunity_id: input.requirement.opportunity_id,
    requirement_id: input.requirement.id,
    status: status === "invalid" ? "missing" : status,
    explanation: status === "satisfied"
      ? "The selected source passes the published deterministic checks and the artist confirmed it for this requirement."
      : status === "likely_satisfied"
        ? "The selected source passes available checks, but the external or incomplete requirement still needs confirmation."
        : status === "needs_artist_review"
          ? "The selected source is private and has not yet been approved for this requirement."
          : "The selected source does not pass the current published checks.",
    evidence: [{ source_id: input.item.sourceId, attachment_id: attachment.id, classification: sourceSummary.classification }],
    validation_results: checks,
    assessor_version: "passport_rules_v1",
    requirement_updated_at: input.requirement.updated_at,
    passport_updated_at: now,
    assessed_at: now,
    artist_confirmed_at: confirmed ? now : null,
    updated_at: now,
  }, { onConflict: "artist_user_id,requirement_id" })

  await supabase.from("artist_media_usages").upsert({
    artist_user_id: account.user.id,
    source_id: input.item.sourceId,
    usage_context: "opportunity_requirement",
    destination_id: input.requirement.id,
    usage_role: "application_attachment",
    updated_at: now,
  }, { onConflict: "artist_user_id,source_id,usage_context,destination_id,usage_role" })

  return { attachmentId: String(attachment.id), status, checks }
}

export function assessPortfolioRequirement(requirement: RequirementRecord, works: PortfolioWorkRecord[]) {
  const eligible = works.filter((work) => Boolean(work.image_path))
  const checks: ValidationCheck[] = []
  if (requirement.minimum_item_count !== null) {
    checks.push({
      rule: "minimum_item_count",
      passed: eligible.length >= requirement.minimum_item_count,
      required: true,
      expected: requirement.minimum_item_count,
      actual: eligible.length,
      explanation: eligible.length >= requirement.minimum_item_count
        ? "The approved Portfolio contains enough image-backed works."
        : `The requirement needs at least ${requirement.minimum_item_count} works.`,
    })
  }
  if (requirement.maximum_item_count !== null) {
    checks.push({
      rule: "maximum_item_count",
      passed: eligible.length <= requirement.maximum_item_count,
      required: true,
      expected: requirement.maximum_item_count,
      actual: eligible.length,
      explanation: eligible.length <= requirement.maximum_item_count
        ? "The current selection is within the published maximum."
        : `Choose no more than ${requirement.maximum_item_count} works.`,
    })
  }
  const incomplete = eligible.filter((work) => !work.title || !work.year || !work.medium || !work.dimensions)
  checks.push({
    rule: "required_artwork_fields",
    passed: incomplete.length === 0,
    required: true,
    expected: ["title", "year", "medium", "dimensions", "image"],
    actual: { selected: eligible.length, incomplete: incomplete.length },
    explanation: incomplete.length ? `${incomplete.length} selected work${incomplete.length === 1 ? " is" : "s are"} missing reusable artwork details.` : "The selected works contain the core reusable artwork details.",
  })
  return checks
}
