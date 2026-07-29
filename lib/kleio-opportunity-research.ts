import { loadArtistPassport, loadPortfolioWorks, type ArtistPassportRecord, type PortfolioWorkRecord } from "@/lib/kleio-live-data"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

export type OpportunityResearchStatus =
  | "queued"
  | "acquiring_source"
  | "parsing_source"
  | "ocr_pending"
  | "extracting_requirements"
  | "resolving_conflicts"
  | "matching_passport"
  | "building_package"
  | "artist_review_required"
  | "complete"
  | "succeeded"
  | "partial"
  | "retry_scheduled"
  | "blocked"
  | "failed"
  | "cancelled"
  | "stale"
  | "running"

export type OpportunityResearchStep = {
  id: string
  session_id: string
  step_key: string
  label: string
  status: "queued" | "running" | "completed" | "skipped" | "blocked" | "failed" | "retry_scheduled" | "cancelled"
  user_message: string
  sort_order: number
  started_at: string | null
  completed_at: string | null
  metadata: Record<string, unknown>
}

export type OpportunityResearchJob = {
  id: string
  session_id: string
  status: string
  current_stage: string
  attempt_count: number
  max_attempts: number
  scheduled_at: string
  started_at: string | null
  completed_at: string | null
  failure_category: string
  error_message: string
  worker_version: string
  extraction_version: string
}

export type OpportunityResearchSource = {
  id: string
  session_id: string
  url: string
  final_url: string
  title: string
  source_role: string
  authority_status: string
  access_status: string
  content_type: string
  checked_at: string
  checksum: string
  etag: string
  last_modified: string
  robots_status: string
  notes: string
  source_version_id: string | null
}

export type OpportunityResearchDocument = {
  id: string
  session_id: string
  source_url: string
  document_kind: string
  content_type: string
  byte_size: number | null
  page_count: number | null
  extraction_status: string
  parser_version: string
  metadata: Record<string, unknown>
  pages?: OpportunityResearchDocumentPage[]
}

export type OpportunityResearchDocumentPage = {
  id: string
  document_id: string
  page_number: number
  printed_page_label: string
  extraction_method: string
  ocr_confidence: number | null
  requires_review: boolean
}

export type OpportunityCandidateRequirement = {
  id: string
  session_id: string
  normalized_key: string
  label: string
  required: boolean
  category: string
  description: string
  passport_field: string
  input_type: string
  source_text: string
  source_url: string
  source_title: string
  evidence_location: string
  normalized_interpretation: string
  minimum_word_count: number | null
  maximum_word_count: number | null
  minimum_item_count: number | null
  maximum_item_count: number | null
  accepted_file_types: string[]
  maximum_file_size_bytes: number | null
  maximum_total_size_bytes: number | null
  filename_pattern: string
  requires_artist_confirmation: boolean
  legal_declaration: boolean
  payment_required: boolean
  human_verification_required: boolean
  confidence_status: string
  confidence_score: number | null
  confidence_reason: string
  conflict_status: string
  extraction_method: string
  parser_version: string
  artist_review_status: string
  document_id: string | null
  page_id: string | null
}

export type OpportunityResearchConflict = {
  id: string
  normalized_key: string
  conflict_type: string
  severity: string
  values: Array<Record<string, unknown>>
  status: string
  resolution: string
}

export type OpportunityResearchFinding = {
  id: string
  finding_type: string
  normalized_key: string
  label: string
  original_text: string
  normalized_value: Record<string, unknown>
  confidence_status: string
  source_url: string
  source_title: string
  official_source: boolean
  evidence_location: string
  extraction_method: string
  conflict_status: string
}

export type OpportunityResearchSession = {
  id: string
  artist_user_id: string
  opportunity_id: string
  status: OpportunityResearchStatus
  current_stage: string
  progress_percent: number
  source_count: number
  verified_requirement_count: number
  unresolved_count: number
  error_message: string
  stale_reason: string
  metadata: Record<string, unknown>
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  jobs: OpportunityResearchJob[]
  steps: OpportunityResearchStep[]
  sources: OpportunityResearchSource[]
  findings: OpportunityResearchFinding[]
  candidate_requirements: OpportunityCandidateRequirement[]
  conflicts: OpportunityResearchConflict[]
  documents: OpportunityResearchDocument[]
}

export type CandidateMatchStatus =
  | "ready"
  | "ready_requires_selection"
  | "partially_ready"
  | "missing"
  | "exceeds_limit"
  | "below_minimum"
  | "source_unresolved"
  | "artist_confirmation_required"
  | "external_action_required"
  | "blocked"

export type CandidateMatch = {
  status: CandidateMatchStatus
  explanation: string
  currentCount?: number
  minimumCount?: number | null
  maximumCount?: number | null
}

const ACTIVE = new Set<OpportunityResearchStatus>([
  "queued",
  "acquiring_source",
  "parsing_source",
  "ocr_pending",
  "extracting_requirements",
  "resolving_conflicts",
  "matching_passport",
  "building_package",
  "running",
  "retry_scheduled",
])

function normalizeSession(value: unknown): OpportunityResearchSession {
  const session = value as OpportunityResearchSession
  return {
    ...session,
    jobs: [...(session.jobs ?? [])].sort((left, right) => Date.parse(right.scheduled_at) - Date.parse(left.scheduled_at)),
    steps: [...(session.steps ?? [])].sort((left, right) => left.sort_order - right.sort_order),
    sources: [...(session.sources ?? [])].sort((left, right) => Date.parse(right.checked_at) - Date.parse(left.checked_at)),
    findings: session.findings ?? [],
    candidate_requirements: [...(session.candidate_requirements ?? [])].sort((left, right) => left.label.localeCompare(right.label)),
    conflicts: session.conflicts ?? [],
    documents: (session.documents ?? []).map((document) => ({
      ...document,
      pages: [...(document.pages ?? [])].sort((left, right) => left.page_number - right.page_number),
    })),
  }
}

export function isOpportunityResearchActive(status: OpportunityResearchStatus) {
  return ACTIVE.has(status)
}

export async function loadOpportunityResearchSession(sessionId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("opportunity_research_sessions")
    .select(`
      *,
      jobs:opportunity_research_jobs(*),
      steps:opportunity_research_steps(*),
      sources:opportunity_research_sources(*),
      findings:opportunity_research_findings(*),
      candidate_requirements:opportunity_candidate_requirements(*),
      conflicts:opportunity_research_conflicts(*),
      documents:opportunity_research_documents(*, pages:opportunity_research_document_pages(*))
    `)
    .eq("id", sessionId)
    .single()

  if (error) throw error
  return normalizeSession(data)
}

export async function findRecentOpportunityResearch(opportunityId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("opportunity_research_sessions")
    .select("id, status, created_at")
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const age = Date.now() - Date.parse(String(data.created_at))
  const status = String(data.status) as OpportunityResearchStatus
  const maximumAge = isOpportunityResearchActive(status) ? 30 * 60 * 1_000 : 24 * 60 * 60 * 1_000
  if (!Number.isFinite(age) || age > maximumAge) return null
  return loadOpportunityResearchSession(String(data.id))
}

export async function startOpportunityResearch(opportunityId: string, forceNew = false) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("research-opportunity", {
    body: { opportunity_id: opportunityId, force_new: forceNew },
  })

  if (error) throw error
  if (data?.error) throw new Error(String(data.error))
  if (!data?.session_id) throw new Error("KLEIO did not receive a research session from the server.")
  return loadOpportunityResearchSession(String(data.session_id))
}

export async function cancelOpportunityResearch(sessionId: string) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.rpc("cancel_opportunity_research", { target_session_id: sessionId })
  if (error) throw error
  return loadOpportunityResearchSession(sessionId)
}

function words(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

function textForPassportField(passport: ArtistPassportRecord | null, field: string) {
  if (!passport) return ""
  switch (field) {
    case "bio": return passport.bio
    case "artist_statement": return passport.artist_statement
    case "practice_description": return passport.practice_description
    case "education": return passport.education
    case "exhibition_history": return passport.exhibition_history
    case "awards": return passport.awards
    default: return ""
  }
}

export function assessCandidateRequirement(
  requirement: OpportunityCandidateRequirement,
  passport: ArtistPassportRecord | null,
  portfolioWorks: PortfolioWorkRecord[],
): CandidateMatch {
  if (["unresolved", "outdated", "superseded"].includes(requirement.confidence_status)) {
    return { status: "source_unresolved", explanation: "The source evidence is not settled enough to treat this as a confirmed application requirement." }
  }
  if (requirement.conflict_status === "confirmed" || requirement.conflict_status === "possible") {
    return { status: "blocked", explanation: "Conflicting source information must be resolved before KLEIO can rely on this requirement." }
  }
  if (requirement.legal_declaration || requirement.payment_required || requirement.human_verification_required) {
    return { status: "external_action_required", explanation: "This step requires the artist to complete a legal, payment, signature, or human-verification action directly." }
  }
  if (requirement.requires_artist_confirmation) {
    return { status: "artist_confirmation_required", explanation: "KLEIO can prepare supporting information, but the artist must confirm this requirement personally." }
  }
  if (requirement.normalized_key === "cv" || requirement.passport_field === "cv") {
    return passport?.cv_file_path
      ? { status: "ready", explanation: "A CV file is stored in the Creative Passport. File integrity and provider limits still require final validation." }
      : { status: "missing", explanation: "No CV file is stored in the Creative Passport." }
  }
  if (["portfolio", "work_samples", "artwork_images"].includes(requirement.normalized_key) || requirement.passport_field === "portfolio") {
    const available = portfolioWorks.filter((work) => Boolean(work.image_path)).length
    const minimum = requirement.minimum_item_count
    const maximum = requirement.maximum_item_count
    if (!available) return { status: "missing", explanation: "No portfolio asset is currently available for selection.", currentCount: 0, minimumCount: minimum, maximumCount: maximum }
    if (minimum !== null && available < minimum) return { status: "below_minimum", explanation: `Only ${available} work${available === 1 ? " is" : "s are"} available; the source appears to require at least ${minimum}.`, currentCount: available, minimumCount: minimum, maximumCount: maximum }
    return { status: "ready_requires_selection", explanation: maximum ? `${available} works are available. Select no more than ${maximum} for this application.` : `${available} works are available for artist selection.`, currentCount: available, minimumCount: minimum, maximumCount: maximum }
  }

  const content = textForPassportField(passport, requirement.passport_field)
  if (!content) return { status: "missing", explanation: requirement.passport_field ? `The Creative Passport field “${requirement.passport_field.replaceAll("_", " ")}” is empty.` : "This is application-specific information and is not available in the Creative Passport." }

  const count = words(content)
  if (requirement.minimum_word_count !== null && count < requirement.minimum_word_count) {
    return { status: "below_minimum", explanation: `${count} words are available; the source appears to require at least ${requirement.minimum_word_count}.`, currentCount: count, minimumCount: requirement.minimum_word_count, maximumCount: requirement.maximum_word_count }
  }
  if (requirement.maximum_word_count !== null && count > requirement.maximum_word_count) {
    return { status: "exceeds_limit", explanation: `${count} words exceed the stated maximum of ${requirement.maximum_word_count}.`, currentCount: count, minimumCount: requirement.minimum_word_count, maximumCount: requirement.maximum_word_count }
  }
  return { status: "ready", explanation: `${count} words are available from the Creative Passport for artist review.`, currentCount: count, minimumCount: requirement.minimum_word_count, maximumCount: requirement.maximum_word_count }
}

export async function loadOpportunityResearchMaterials() {
  const [passport, portfolioWorks] = await Promise.all([loadArtistPassport(), loadPortfolioWorks()])
  return { passport, portfolioWorks }
}
