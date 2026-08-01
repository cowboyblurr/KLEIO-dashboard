import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

export type KleioProductEventName =
  | "landing_viewed"
  | "carousel_viewed"
  | "carousel_manual_advanced"
  | "carousel_card_selected"
  | "explore_opportunities_selected"
  | "creative_passport_selected"
  | "institution_section_viewed"
  | "institution_signup_selected"
  | "login_selected"
  | "public_directory_viewed"
  | "search_performed"
  | "filter_applied"
  | "opportunity_opened"
  | "official_source_opened"
  | "check_fit_selected"
  | "save_selected"
  | "prepare_selected"
  | "signup_prompted"
  | "signup_started"
  | "signup_submitted"
  | "signup_validation_failed"
  | "account_created"
  | "confirmation_required"
  | "confirmation_completed"
  | "opportunity_restoration_completed"
  | "opportunity_restoration_failed"
  | "passport_mode_selected"
  | "guided_step_completed"
  | "guided_step_skipped"
  | "import_started"
  | "import_completed"
  | "proposal_approved"
  | "proposal_rejected"
  | "review_opened"
  | "claim_confirmed"
  | "claim_rejected"
  | "claim_deferred"
  | "duplicate_merged"
  | "claims_bulk_confirmed"
  | "voice_capability_detected"
  | "voice_started"
  | "voice_completed"
  | "autosave_succeeded"
  | "autosave_failed"
  | "draft_restored"
  | "conflict_detected"

const SESSION_KEY = "kleio:analytics:anonymous-session:v1"
const SAFE_METADATA_KEYS = new Set([
  "action",
  "capability",
  "count",
  "edited",
  "filter_count",
  "intent_source",
  "mode",
  "reason",
  "reduced_motion",
  "relationship",
  "result_count",
  "role",
  "source",
  "status",
  "step",
  "viewport",
])

function sessionId() {
  if (typeof window === "undefined") return null
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY)
    if (stored) return stored
    const next = crypto.randomUUID()
    window.sessionStorage.setItem(SESSION_KEY, next)
    return next
  } catch {
    return null
  }
}

function sanitizedMetadata(input: Record<string, unknown> | undefined) {
  const output: Record<string, string | number | boolean | null> = {}
  if (!input) return output
  for (const [key, value] of Object.entries(input)) {
    if (!SAFE_METADATA_KEYS.has(key)) continue
    if (typeof value === "string") output[key] = value.slice(0, 100)
    else if (typeof value === "number" && Number.isFinite(value)) output[key] = value
    else if (typeof value === "boolean" || value === null) output[key] = value
  }
  return output
}

export async function trackKleioProductEvent(
  eventName: KleioProductEventName,
  input: {
    surface: string
    opportunityId?: string | null
    metadata?: Record<string, unknown>
  },
) {
  try {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.from("product_events").insert({
      event_name: eventName,
      surface: input.surface.slice(0, 80),
      opportunity_id: input.opportunityId ?? null,
      anonymous_session_id: sessionId(),
      metadata: sanitizedMetadata(input.metadata),
    })
    if (error && process.env.NODE_ENV !== "production") console.warn("KLEIO analytics event was not recorded", error.message)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("KLEIO analytics is unavailable", error)
  }
}
