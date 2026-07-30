const RETURN_INTENT_KEY = "kleio:artist:return-intent:v1"

function isBrowser() {
  return typeof window !== "undefined"
}

export function normalizeKleioReturnIntent(value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) return null

  try {
    const parsed = new URL(trimmed, "https://kleio.local")
    const allowed = parsed.pathname === "/opportunities/"
      || parsed.pathname.startsWith("/artist-dashboard/")

    if (!allowed) return null
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}

export function storeKleioReturnIntent(value: string | null | undefined) {
  if (!isBrowser()) return null
  const normalized = normalizeKleioReturnIntent(value)
  if (!normalized) return null
  window.localStorage.setItem(RETURN_INTENT_KEY, normalized)
  return normalized
}

export function readKleioReturnIntent() {
  if (!isBrowser()) return null
  return normalizeKleioReturnIntent(window.localStorage.getItem(RETURN_INTENT_KEY))
}

export function consumeKleioReturnIntent() {
  if (!isBrowser()) return null
  const value = readKleioReturnIntent()
  window.localStorage.removeItem(RETURN_INTENT_KEY)
  return value
}
