import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"

export type OpportunityReviewFilter =
  | "needs_attention"
  | "reports"
  | "verification"
  | "financial"
  | "rights"
  | "translation"
  | "reverify"
  | "duplicates"
  | "rejected"
  | "all"

export type OpportunityReviewAction =
  | "verify"
  | "publish"
  | "keep_review"
  | "reject"
  | "archive"
  | "reverify"
  | "merge_duplicate"
  | "restore"
  | "resolve_reports"

export type OpportunityReviewItem = {
  id: string
  title: string
  original_title: string | null
  provider_name: string
  source_name: string
  source_active: boolean
  canonical_url: string
  application_url: string
  guidelines_url: string
  status: string
  verification_status: string
  lifecycle_status: string
  deadline_at: string | null
  funding_display_text: string
  funding_amount_type: string
  application_fee: number | null
  financial_terms_verified: boolean
  rights_terms_verified: boolean
  translation_status: string
  human_translation_review_required: boolean
  last_verified_at: string | null
  reverify_at: string | null
  duplicate_of: string | null
  open_reports: number
  review_flags: string[]
  summary: string
  logistics_notes: string
  funding_source_note: string
}

export type OpportunityReviewQueue = {
  filter: OpportunityReviewFilter
  total: number
  items: OpportunityReviewItem[]
}

function isQueue(value: unknown): value is OpportunityReviewQueue {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const candidate = value as Partial<OpportunityReviewQueue>
  return typeof candidate.total === "number" && Array.isArray(candidate.items)
}

export async function loadOpportunityReviewQueue(
  filter: OpportunityReviewFilter,
  limit = 50,
  offset = 0,
) {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Sign in with an authorized KLEIO administrator account.")
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("get_kleio_opportunity_review_queue", {
    queue_filter: filter,
    limit_count: limit,
    offset_count: offset,
  })
  if (error) {
    if (error.code === "42501" || error.message.includes("kleio_admin_required")) {
      throw new Error("KLEIO administrator access is required.")
    }
    throw new Error("The opportunity review queue could not be loaded.")
  }
  if (!isQueue(data)) throw new Error("The opportunity review response was incomplete.")
  return data
}

export async function reviewOpportunity(input: {
  opportunityId: string
  action: OpportunityReviewAction
  reason: string
  duplicateTargetId?: string | null
  sourceUrl?: string | null
}) {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Sign in with an authorized KLEIO administrator account.")
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("admin_review_opportunity", {
    target_opportunity_id: input.opportunityId,
    review_action: input.action,
    review_reason: input.reason.trim(),
    duplicate_target_id: input.duplicateTargetId?.trim() || null,
    review_source_url: input.sourceUrl?.trim() || null,
  })
  if (error) {
    if (error.code === "42501" || error.message.includes("kleio_admin_required")) throw new Error("KLEIO administrator access is required.")
    if (error.message.includes("opportunity_not_ready_to_publish")) throw new Error("This record does not yet meet KLEIO’s publication standard.")
    if (error.message.includes("review_reason_required")) throw new Error("Add a specific review reason before applying this action.")
    if (error.message.includes("valid_duplicate_target_required")) throw new Error("Enter a valid canonical opportunity ID before merging a duplicate.")
    throw new Error("KLEIO could not apply this review action.")
  }
  return data
}
