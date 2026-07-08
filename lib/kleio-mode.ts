export type KleioMode = "demo" | "preview"

const MODE_STORAGE_KEY = "kleio-mode"

function isBrowser() {
  return typeof window !== "undefined"
}

export function getKleioMode(): KleioMode {
  if (!isBrowser()) return "demo"
  const stored = window.localStorage.getItem(MODE_STORAGE_KEY)
  return stored === "preview" ? "preview" : "demo"
}

export function setKleioMode(mode: KleioMode): void {
  if (!isBrowser()) return
  window.localStorage.setItem(MODE_STORAGE_KEY, mode)
}

export function clearKleioMode(): void {
  if (!isBrowser()) return
  window.localStorage.removeItem(MODE_STORAGE_KEY)
}

export function isDemoMode() {
  return getKleioMode() === "demo"
}

export function isPreviewMode() {
  return getKleioMode() === "preview"
}
