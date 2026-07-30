const RETURN_INTENT_KEY = "kleio:artist:return-intent:v2"
const LEGACY_RETURN_INTENT_KEY = "kleio:artist:return-intent:v1"
const MAX_INTENT_AGE_MS = 72 * 60 * 60 * 1000
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type KleioOpportunityIntentAction =
  | "view_details"
  | "check_fit"
  | "save"
  | "prepare"
  | "complete_passport"

export type KleioOpportunityIntentSource =
  | "landing_carousel"
  | "public_directory"
  | "public_detail"
  | "shared_link"

export type KleioReturnIntent = {
  id: string
  version: 2
  opportunityId: string
  publicRoute: "/opportunities/"
  action: KleioOpportunityIntentAction
  source: KleioOpportunityIntentSource
  searchContext: string
  createdAt: string
  expiresAt: string
}

export type KleioReturnIntentInput = {
  opportunityId: string
  action: KleioOpportunityIntentAction
  source: KleioOpportunityIntentSource
  searchContext?: string
}

function isBrowser() {
  return typeof window !== "undefined"
}

function createIntentId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeSearchContext(value: unknown) {
  if (typeof value !== "string") return ""
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 400)
}

function isAction(value: unknown): value is KleioOpportunityIntentAction {
  return value === "view_details"
    || value === "check_fit"
    || value === "save"
    || value === "prepare"
    || value === "complete_passport"
}

function isSource(value: unknown): value is KleioOpportunityIntentSource {
  return value === "landing_carousel"
    || value === "public_directory"
    || value === "public_detail"
    || value === "shared_link"
}

function normalizeRecord(value: unknown): KleioReturnIntent | null {
  if (!value || typeof value !== "object") return null
  const record = value as Record<string, unknown>
  if (record.version !== 2) return null
  if (typeof record.id !== "string" || !record.id.trim()) return null
  if (typeof record.opportunityId !== "string" || !UUID_PATTERN.test(record.opportunityId)) return null
  if (record.publicRoute !== "/opportunities/") return null
  if (!isAction(record.action) || !isSource(record.source)) return null
  if (typeof record.createdAt !== "string" || typeof record.expiresAt !== "string") return null

  const createdAt = new Date(record.createdAt)
  const expiresAt = new Date(record.expiresAt)
  if (Number.isNaN(createdAt.getTime()) || Number.isNaN(expiresAt.getTime())) return null
  if (expiresAt.getTime() <= Date.now()) return null
  if (expiresAt.getTime() - createdAt.getTime() > MAX_INTENT_AGE_MS + 60_000) return null

  return {
    id: record.id,
    version: 2,
    opportunityId: record.opportunityId,
    publicRoute: "/opportunities/",
    action: record.action,
    source: record.source,
    searchContext: normalizeSearchContext(record.searchContext),
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }
}

function intentFromLegacyRoute(value: string | null | undefined): KleioReturnIntent | null {
  const trimmed = value?.trim()
  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) return null

  try {
    const parsed = new URL(trimmed, "https://kleio.local")
    if (parsed.origin !== "https://kleio.local") return null
    if (parsed.pathname !== "/opportunities/") return null
    const opportunityId = parsed.searchParams.get("opportunity")
    if (!opportunityId || !UUID_PATTERN.test(opportunityId)) return null
    const action = parsed.searchParams.get("resume")
    const source = parsed.searchParams.get("source")
    return createKleioReturnIntent({
      opportunityId,
      action: isAction(action) ? action : "view_details",
      source: isSource(source) ? source : "shared_link",
      searchContext: parsed.searchParams.get("context") ?? "",
    })
  } catch {
    return null
  }
}

export function createKleioReturnIntent(input: KleioReturnIntentInput): KleioReturnIntent | null {
  if (!UUID_PATTERN.test(input.opportunityId)) return null
  if (!isAction(input.action) || !isSource(input.source)) return null
  const createdAt = new Date()
  const expiresAt = new Date(createdAt.getTime() + MAX_INTENT_AGE_MS)
  return {
    id: createIntentId(),
    version: 2,
    opportunityId: input.opportunityId,
    publicRoute: "/opportunities/",
    action: input.action,
    source: input.source,
    searchContext: normalizeSearchContext(input.searchContext),
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }
}

export function normalizeKleioReturnIntent(value: string | null | undefined) {
  return intentFromLegacyRoute(value) ? value?.trim() ?? null : null
}

export function storeKleioReturnIntent(value: KleioReturnIntentInput | string | null | undefined) {
  if (!isBrowser()) return null
  const intent = typeof value === "string" ? intentFromLegacyRoute(value) : value ? createKleioReturnIntent(value) : null
  if (!intent) return null
  window.localStorage.setItem(RETURN_INTENT_KEY, JSON.stringify(intent))
  window.localStorage.removeItem(LEGACY_RETURN_INTENT_KEY)
  return intent
}

export function readKleioReturnIntent(): KleioReturnIntent | null {
  if (!isBrowser()) return null
  const raw = window.localStorage.getItem(RETURN_INTENT_KEY)
  if (raw) {
    try {
      const intent = normalizeRecord(JSON.parse(raw))
      if (intent) return intent
    } catch {
      // Invalid or tampered values are removed below.
    }
    window.localStorage.removeItem(RETURN_INTENT_KEY)
  }

  const legacy = window.localStorage.getItem(LEGACY_RETURN_INTENT_KEY)
  const migrated = intentFromLegacyRoute(legacy)
  window.localStorage.removeItem(LEGACY_RETURN_INTENT_KEY)
  if (migrated) window.localStorage.setItem(RETURN_INTENT_KEY, JSON.stringify(migrated))
  return migrated
}

export function getKleioReturnRoute(intent: KleioReturnIntent) {
  const params = new URLSearchParams({
    opportunity: intent.opportunityId,
    resume: intent.action,
    source: intent.source,
    intent: intent.id,
  })
  return `/opportunities/?${params.toString()}`
}

export function markKleioReturnIntentConsumed(intentId: string) {
  if (!isBrowser()) return false
  const current = readKleioReturnIntent()
  if (!current || current.id !== intentId) return false
  window.localStorage.removeItem(RETURN_INTENT_KEY)
  return true
}

export function clearKleioReturnIntent() {
  if (!isBrowser()) return
  window.localStorage.removeItem(RETURN_INTENT_KEY)
  window.localStorage.removeItem(LEGACY_RETURN_INTENT_KEY)
}

export function consumeKleioReturnIntent() {
  const intent = readKleioReturnIntent()
  if (!intent) return null
  markKleioReturnIntentConsumed(intent.id)
  return getKleioReturnRoute(intent)
}
