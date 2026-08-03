import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"
import {
  productEventDefinition,
  type KleioProductEventName,
} from "@/lib/kleio-product-event-dictionary"

export type { KleioProductEventName } from "@/lib/kleio-product-event-dictionary"

export type KleioReleaseChannel =
  | "founding_artist_beta"
  | "guided_demo"
  | "synthetic_preview"

export type KleioViewport = "mobile" | "tablet" | "desktop" | "unknown"

type AnalyticsInput = {
  surface: string
  opportunityId?: string | null
  workflowId?: string | null
  deduplicationKey?: string | null
  metadata?: Record<string, unknown>
}

type CompanionEvent = {
  eventName: KleioProductEventName
  input: AnalyticsInput
}

const SESSION_KEY = "kleio:analytics:anonymous-session:v2"
const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1_000
const SAFE_DIMENSION = /^[a-z0-9][a-z0-9_:-]{0,79}$/
const SAFE_METADATA_KEYS = new Set([
  "action",
  "capability",
  "completion_state",
  "count",
  "duplicate_count",
  "edited",
  "error_code",
  "failed_count",
  "filter_count",
  "intent_source",
  "item_count",
  "mode",
  "outcome",
  "provider",
  "reason",
  "reduced_motion",
  "relationship",
  "result_count",
  "retryable",
  "role",
  "section",
  "source",
  "status",
  "step",
  "success_count",
  "viewport",
])
const FORBIDDEN_METADATA_KEYS = /(?:name|email|phone|address|title|caption|bio|statement|cv|content|text|body|query|filename|file_name|url|token|secret|response|stack|document|transcript)/i

type StoredSession = {
  id: string
  createdAt: string
  lastSeenAt: string
}

function isUuid(value: unknown): value is string {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function anonymousSessionId() {
  if (typeof window === "undefined") return null
  const now = new Date()
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null") as Partial<StoredSession> | null
    const createdAt = parsed?.createdAt ? new Date(parsed.createdAt).getTime() : Number.NaN
    if (isUuid(parsed?.id) && Number.isFinite(createdAt) && now.getTime() - createdAt <= SESSION_MAX_AGE_MS) {
      const next: StoredSession = { id: parsed.id, createdAt: parsed.createdAt!, lastSeenAt: now.toISOString() }
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(next))
      return next.id
    }
    const next: StoredSession = { id: crypto.randomUUID(), createdAt: now.toISOString(), lastSeenAt: now.toISOString() }
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(next))
    return next.id
  } catch {
    try {
      const stored = window.sessionStorage.getItem(SESSION_KEY)
      if (isUuid(stored)) return stored
      const next = crypto.randomUUID()
      window.sessionStorage.setItem(SESSION_KEY, next)
      return next
    } catch {
      return null
    }
  }
}

export function createKleioAnalyticsWorkflowId() {
  return typeof crypto !== "undefined" ? crypto.randomUUID() : null
}

function safeDimension(value: unknown, fallback = "unknown") {
  if (typeof value !== "string") return fallback
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_:-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80)
  return SAFE_DIMENSION.test(normalized) ? normalized : fallback
}

function sanitizedMetadata(input: Record<string, unknown> | undefined) {
  const output: Record<string, string | number | boolean | null> = {}
  if (!input) return output
  for (const [key, value] of Object.entries(input)) {
    if (!SAFE_METADATA_KEYS.has(key) || FORBIDDEN_METADATA_KEYS.test(key)) continue
    if (typeof value === "string") {
      const normalized = safeDimension(value, "")
      if (normalized) output[key] = normalized
    } else if (typeof value === "number" && Number.isFinite(value)) {
      output[key] = Math.max(-1_000_000, Math.min(1_000_000, value))
    } else if (typeof value === "boolean" || value === null) {
      output[key] = value
    }
  }
  return output
}

function viewport(): KleioViewport {
  if (typeof window === "undefined") return "unknown"
  if (window.innerWidth < 640) return "mobile"
  if (window.innerWidth < 1024) return "tablet"
  return "desktop"
}

function releaseChannel(): KleioReleaseChannel {
  if (typeof window === "undefined") return "founding_artist_beta"
  const path = window.location.pathname.toLowerCase()
  if (path.includes("guided-demo") || path.includes("guided_tour")) return "guided_demo"
  if (path.includes("preview") || document.documentElement.dataset.kleioSynthetic === "true") return "synthetic_preview"
  return "founding_artist_beta"
}

function acquisitionSource() {
  if (typeof window === "undefined") return "unknown"
  const querySource = safeDimension(new URLSearchParams(window.location.search).get("utm_source"), "")
  if (querySource) {
    if (querySource.includes("linkedin")) return "linkedin"
    if (querySource.includes("instagram")) return "instagram"
    if (querySource.includes("artist") && querySource.includes("referr")) return "artist_referral"
    if (querySource.includes("institution") && querySource.includes("referr")) return "institution_referral"
    if (querySource.includes("outreach")) return "direct_outreach"
    if (querySource.includes("opportunity")) return "opportunity_entry"
    if (querySource.includes("google") || querySource.includes("bing") || querySource.includes("search")) return "organic_search"
  }
  try {
    const hostname = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ""
    if (!hostname) return "direct"
    if (hostname.includes("linkedin")) return "linkedin"
    if (hostname.includes("instagram")) return "instagram"
    if (hostname.includes("google") || hostname.includes("bing") || hostname.includes("duckduckgo")) return "organic_search"
    if (hostname === window.location.hostname) return "direct"
    return "unknown"
  } catch {
    return "unknown"
  }
}

function reducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function companionEvents(eventName: KleioProductEventName, input: AnalyticsInput): CompanionEvent[] {
  const metadata = input.metadata || {}
  const companions: CompanionEvent[] = []

  if (eventName === "search_performed" && metadata.result_count === 0) {
    companions.push({
      eventName: "search_no_results",
      input: {
        ...input,
        deduplicationKey: input.deduplicationKey ? `${input.deduplicationKey}:no_results` : null,
        metadata: {
          mode: metadata.mode || "public_directory",
          filter_count: metadata.filter_count || 0,
        },
      },
    })
  }
  if (eventName === "passport_mode_selected") {
    companions.push({
      eventName: "passport_started",
      input: {
        ...input,
        deduplicationKey: "passport_started:workspace",
        metadata: { mode: metadata.mode || "unspecified" },
      },
    })
  }
  if (eventName === "guided_step_completed") {
    companions.push({
      eventName: "passport_section_completed",
      input: {
        ...input,
        deduplicationKey: input.deduplicationKey || null,
        metadata: {
          mode: "guided",
          section: typeof metadata.step === "number" ? `guided_step_${metadata.step}` : metadata.step || "guided_step",
        },
      },
    })
  }
  if (eventName === "review_opened") {
    companions.push({ eventName: "proposal_review_opened", input })
  }
  if (eventName === "claim_confirmed") {
    companions.push({ eventName: "proposal_approved", input: { ...input, metadata: { ...metadata, edited: false } } })
  }
  if (eventName === "claim_rejected") {
    companions.push({ eventName: "proposal_rejected", input })
  }
  if (eventName === "autosave_failed" && safeDimension(input.surface, "") === "creative_passport") {
    companions.push({
      eventName: "passport_save_failed",
      input: {
        ...input,
        metadata: {
          mode: metadata.mode || "unspecified",
          reason: metadata.reason || "autosave_failed",
          error_code: metadata.error_code || "passport_save_failed",
        },
      },
    })
  }
  return companions
}

async function recordProductEvent(eventName: KleioProductEventName, input: AnalyticsInput) {
  const definition = productEventDefinition(eventName)
  const client = getSupabaseBrowserClient()
  const eventViewport = viewport()
  const metadata = sanitizedMetadata({
    ...input.metadata,
    viewport: eventViewport,
    reduced_motion: reducedMotion(),
  })
  return client.rpc("record_product_event", {
    requested_event_name: eventName,
    requested_event_version: definition.version,
    requested_surface: safeDimension(input.surface, "unknown_surface"),
    requested_release_channel: releaseChannel(),
    requested_anonymous_session_id: anonymousSessionId(),
    requested_workflow_id: isUuid(input.workflowId) ? input.workflowId : null,
    requested_opportunity_id: isUuid(input.opportunityId) ? input.opportunityId : null,
    requested_app_version: safeDimension(process.env.NEXT_PUBLIC_KLEIO_APP_VERSION || "web_beta", "web_beta"),
    requested_locale: safeDimension(typeof navigator === "undefined" ? "unknown" : navigator.language, "unknown"),
    requested_viewport: eventViewport,
    requested_acquisition_source: acquisitionSource(),
    requested_metadata: metadata,
    requested_deduplication_key: input.deduplicationKey ? safeDimension(input.deduplicationKey, "") || null : null,
    requested_occurred_at: new Date().toISOString(),
  })
}

export async function trackKleioProductEvent(eventName: KleioProductEventName, input: AnalyticsInput) {
  try {
    const events: CompanionEvent[] = [{ eventName, input }, ...companionEvents(eventName, input)]
    const results = await Promise.all(events.map((event) => recordProductEvent(event.eventName, event.input)))
    if (process.env.NODE_ENV !== "production") {
      for (const result of results) {
        if (result.error) console.warn("KLEIO analytics event was not recorded", result.error.message)
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("KLEIO analytics is unavailable", error)
  }
}
