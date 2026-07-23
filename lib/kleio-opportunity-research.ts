import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"

export type OpportunityResearchStatus = "queued" | "running" | "succeeded" | "partial" | "failed" | "cancelled"
export type OpportunityResearchStepStatus = "queued" | "running" | "completed" | "skipped" | "blocked" | "failed"
export type OpportunityResearchConfidence = "verified" | "corroborated" | "likely" | "unresolved" | "outdated"

export type OpportunityResearchStep = {
  id: string
  session_id: string
  step_key: string
  label: string
  status: OpportunityResearchStepStatus
  user_message: string
  sort_order: number
  started_at: string | null
  completed_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type OpportunityResearchSource = {
  id: string
  session_id: string
  opportunity_id: string
  url: string
  title: string
  source_role: string
  authority_status: "official" | "organization" | "verified_profile" | "trusted_directory" | "other"
  access_status: "pending" | "fetched" | "blocked" | "unavailable" | "unsupported" | "error"
  content_type: string
  http_status: number | null
  source_date: string | null
  checked_at: string
  notes: string
  metadata: Record<string, unknown>
  created_at: string
}

export type OpportunityResearchFinding = {
  id: string
  session_id: string
  opportunity_id: string
  finding_type: "requirement" | "eligibility" | "deadline" | "fee" | "submission_method" | "contact" | "unresolved"
  normalized_key: string
  label: string
  original_text: string
  normalized_value: Record<string, unknown>
  confidence_status: OpportunityResearchConfidence
  confidence_score: number | null
  source_url: string
  source_title: string
  official_source: boolean
  accepted: boolean
  created_at: string
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
  metadata: Record<string, unknown>
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  steps: OpportunityResearchStep[]
  sources: OpportunityResearchSource[]
  findings: OpportunityResearchFinding[]
}

const ACTIVE_SESSION_MAX_AGE_MS = 30 * 60 * 1000
const COMPLETED_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000

function normalizeSession(value: unknown): OpportunityResearchSession {
  const session = value as OpportunityResearchSession
  return {
    ...session,
    steps: [...(session.steps ?? [])].sort((left, right) => left.sort_order - right.sort_order),
    sources: [...(session.sources ?? [])].sort((left, right) => Date.parse(right.checked_at) - Date.parse(left.checked_at)),
    findings: [...(session.findings ?? [])].sort((left, right) => Date.parse(left.created_at) - Date.parse(right.created_at)),
  }
}

export async function loadOpportunityResearchSession(sessionId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("opportunity_research_sessions")
    .select(`
      *,
      steps:opportunity_research_steps(*),
      sources:opportunity_research_sources(*),
      findings:opportunity_research_findings(*)
    `)
    .eq("id", sessionId)
    .single()

  if (error) throw error
  return normalizeSession(data)
}

export async function findRecentOpportunityResearch(opportunityId: string) {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to research an opportunity.")

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("opportunity_research_sessions")
    .select("id, status, created_at")
    .eq("artist_user_id", account.user.id)
    .eq("opportunity_id", opportunityId)
    .in("status", ["queued", "running", "succeeded", "partial"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const age = Date.now() - Date.parse(String(data.created_at))
  const status = String(data.status) as OpportunityResearchStatus
  const maxAge = status === "queued" || status === "running" ? ACTIVE_SESSION_MAX_AGE_MS : COMPLETED_SESSION_MAX_AGE_MS
  if (!Number.isFinite(age) || age > maxAge) return null
  return loadOpportunityResearchSession(String(data.id))
}

export async function createOpportunityResearchSession(opportunityId: string) {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to research an opportunity.")

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("opportunity_research_sessions")
    .insert({
      artist_user_id: account.user.id,
      opportunity_id: opportunityId,
      status: "queued",
      current_stage: "queued",
      progress_percent: 0,
      metadata: { initiated_from: "application_preparation" },
    })
    .select("id")
    .single()

  if (error) throw error
  return loadOpportunityResearchSession(String(data.id))
}

export async function startOpportunityResearch(sessionId: string, opportunityId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("research-opportunity", {
    body: { session_id: sessionId, opportunity_id: opportunityId },
  })
  if (error) throw error
  if (data?.error) throw new Error(String(data.error))
  return data as {
    session_id: string
    status: OpportunityResearchStatus
    source_count?: number
    requirement_count?: number
    unresolved_count?: number
  }
}
