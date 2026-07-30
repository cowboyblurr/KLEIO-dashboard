const ACTIVE_USER_SCOPE_KEY = "kleio:auth:active-user:v1"
const PRESERVED_LOCAL_KEYS = new Set(["kleio-locale"])
const LEGACY_SENSITIVE_KEYS = new Set([
  "kleio-demo-session",
  "kleio-mode",
  "kleio-pending-live-onboarding",
])
const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isBrowser() {
  return typeof window !== "undefined"
}

function clearStorage(storage: Storage, preserve: Set<string> = new Set()) {
  const keys: string[] = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (!key || preserve.has(key)) continue
    if (key.startsWith("kleio:") || LEGACY_SENSITIVE_KEYS.has(key)) keys.push(key)
  }
  for (const key of keys) storage.removeItem(key)
}

/**
 * Removes browser state that may contain account, role, onboarding, draft,
 * return-intent, or demo information. Language preference is intentionally kept.
 */
export function clearKleioSensitiveBrowserState() {
  if (!isBrowser()) return
  clearStorage(window.localStorage, PRESERVED_LOCAL_KEYS)
  clearStorage(window.sessionStorage)
  window.localStorage.removeItem("kleio-demo-session")
  window.localStorage.removeItem("kleio-mode")
  window.localStorage.removeItem("kleio-pending-live-onboarding")
}

export function getKleioActiveUserScope() {
  if (!isBrowser()) return null
  const value = window.sessionStorage.getItem(ACTIVE_USER_SCOPE_KEY)
  return value && USER_ID_PATTERN.test(value) ? value : null
}

/**
 * Establishes the authenticated browser scope. A different user in the same
 * browser causes all prior KLEIO account state to be cleared before continuing.
 */
export function setKleioActiveUserScope(userId: string) {
  if (!isBrowser() || !USER_ID_PATTERN.test(userId)) return false
  const existing = getKleioActiveUserScope()
  if (existing && existing !== userId) clearKleioSensitiveBrowserState()
  window.sessionStorage.setItem(ACTIVE_USER_SCOPE_KEY, userId)
  return true
}

export function clearKleioActiveUserScope() {
  if (!isBrowser()) return
  window.sessionStorage.removeItem(ACTIVE_USER_SCOPE_KEY)
}
