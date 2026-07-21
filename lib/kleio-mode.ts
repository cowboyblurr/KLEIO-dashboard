export type KleioMode = "demo" | "preview" | "live"

const MODE_STORAGE_KEY = "kleio-mode"
export const KLEIO_MODE_CHANGE_EVENT = "kleio-mode-change"

function isBrowser() {
  return typeof window !== "undefined"
}

export function getKleioMode(): KleioMode {
  if (!isBrowser()) return "live"
  const stored = window.localStorage.getItem(MODE_STORAGE_KEY)
  if (stored === "demo" || stored === "preview") return stored
  return "live"
}

export function setKleioMode(mode: KleioMode): void {
  if (!isBrowser()) return
  window.localStorage.setItem(MODE_STORAGE_KEY, mode)
  window.dispatchEvent(new Event(KLEIO_MODE_CHANGE_EVENT))
}

export function clearKleioMode(): void {
  if (!isBrowser()) return
  window.localStorage.removeItem(MODE_STORAGE_KEY)
  window.dispatchEvent(new Event(KLEIO_MODE_CHANGE_EVENT))
}

export function isDemoMode() {
  return getKleioMode() === "demo"
}

export function isPreviewMode() {
  return getKleioMode() === "preview"
}

export function isLiveMode() {
  return getKleioMode() === "live"
}
