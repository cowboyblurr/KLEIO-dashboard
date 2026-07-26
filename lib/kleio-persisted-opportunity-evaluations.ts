import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

export type PersistedEligibilityStatus =
  | "eligible"
  | "likely_eligible"
  | "eligibility_unclear"
  | "missing_information"
  | "not_eligible"

export type PersistedRelevanceStatus =
  | "strong_relevance"
  | "moderate_relevance"
  | "limited_relevance"
  | "insufficient_information"

export type PersistedRuleResult = {
  rule_id?: string
  rule_type?: string
  operator?: string
  status: "passed" | "failed" | "unknown" | "not_applicable"
  reason?: string
  source_text?: string
  source_url?: string
  verification_status?: string
}

export type PersistedReadinessItem = {
  requirement_id?: string
  material_key: string
  label: string
  required: boolean
  status: "ready" | "missing" | "artist_confirmation_required" | "human_verification_required"
  source_url?: string
  accepted_file_types?: string[]
  maximum_item_count?: number | null
  maximum_file_size_bytes?: number | null
  policy?: string
  explanation?: string
}

export type PersistedOpportunityEvaluation = {
  id: string
  artist_user_id: string
  opportunity_id: string
  eligibility_status: PersistedEligibilityStatus
  relevance_status: PersistedRelevanceStatus
  rule_results: PersistedRuleResult[]
  readiness: {
    ready_count?: number
    missing_required_count?: number
    portfolio_work_count?: number
    policy_compatible_work_count?: number
    work_provenance_confirmation_required?: boolean
    items?: PersistedReadinessItem[]
  }
  creative_fit: {
    status?: PersistedRelevanceStatus
    matched_terms?: string[]
    explanation?: string
  }
  effort: {
    level?: "low" | "moderate" | "significant"
    missing_required_count?: number
    days_remaining?: number | null
    explanation?: string
  }
  strategic_value: {
    funding_display?: string
    career_relevance?: string
    reusable_asset_value?: string
    winning_probability?: null
  }
  explanation: {
    eligibility?: {
      status?: PersistedEligibilityStatus
      failed_rule_count?: number
      unknown_rule_count?: number
      reasons?: PersistedRuleResult[]
    }
    creative_fit?: {
      status?: PersistedRelevanceStatus
      matched_terms?: string[]
    }
    readiness?: {
      ready_count?: number
      missing_required_count?: number
    }
    deadline?: {
      status?: "open" | "closing_soon" | "expired" | "rolling" | "unknown"
      official_timezone?: string
      days_remaining?: number | null
    }
    source?: {
      official_url?: string
      last_verified_at?: string | null
      verification_status?: string
      verification_confidence?: number | null
      reverify_at?: string | null
    }
    artwork_policy?: {
      artwork_ai_policy?: string
      application_assistance_policy?: string
      status?: string
      reason?: string
      source_url?: string
    }
  }
  deadline_status: "open" | "closing_soon" | "expired" | "rolling" | "unknown"
  source_version_id: string | null
  passport_updated_at: string | null
  evaluated_at: string
  updated_at: string
}

export async function evaluateMyOpportunities(opportunityIds: string[]) {
  const uniqueIds = [...new Set(opportunityIds.filter(Boolean))].slice(0, 50)
  if (!uniqueIds.length) return {} as Record<string, PersistedOpportunityEvaluation>

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("evaluate_my_opportunities", {
    target_opportunity_ids: uniqueIds,
  })
  if (error) throw error

  return Object.fromEntries(
    ((data ?? []) as PersistedOpportunityEvaluation[]).map((evaluation) => [evaluation.opportunity_id, evaluation]),
  )
}

export function readableEvaluationRule(result: PersistedRuleResult) {
  const label = result.source_text?.trim() || result.reason?.trim() || result.rule_type?.replaceAll("_", " ") || "Eligibility requirement"
  const explanation = result.reason?.trim()
    || (result.status === "passed"
      ? "Confirmed by the current Creative Passport and the verified rule."
      : result.status === "failed"
        ? "The current Creative Passport does not meet this mandatory verified rule."
        : "KLEIO needs artist-provided information or human confirmation before deciding eligibility.")

  return {
    rule_id: result.rule_id || `${result.rule_type || "rule"}-${label}`,
    label,
    status: result.status,
    explanation,
    sourceUrl: result.source_url || "",
  }
}
