const DEFAULT_PRODUCTION_SITE_URL = "https://www.kleioarthouse.com"

function normalizeBasePath(value: string) {
  const trimmed = value.trim()
  if (!trimmed || trimmed === "/") return ""
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`
}

function normalizeSiteUrl(value: string) {
  return value.trim().replace(/\/+$/, "")
}

function ensurePath(value: string) {
  if (!value || value === "/") return "/"
  return `/${value.replace(/^\/+/, "")}`
}

function isLocalUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "::1"
  } catch {
    return false
  }
}

export function getKleioSiteUrl() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (configuredSiteUrl?.trim()) return normalizeSiteUrl(configuredSiteUrl)

  const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? "")
  if (typeof window !== "undefined") return `${window.location.origin}${basePath}`

  if (process.env.NODE_ENV === "production") return DEFAULT_PRODUCTION_SITE_URL
  return `http://localhost:3000${basePath}`
}

export function getKleioAbsoluteUrl(path = "/") {
  const absoluteUrl = `${getKleioSiteUrl()}${ensurePath(path)}`
  if (process.env.NODE_ENV === "production" && isLocalUrl(absoluteUrl)) {
    throw new Error("KLEIO refused to create a localhost URL in production.")
  }
  return absoluteUrl
}

export function getKleioAuthCallbackUrl(role?: "artist" | "institution") {
  const callback = new URL(getKleioAbsoluteUrl("/auth/callback/"))
  if (role) callback.searchParams.set("role", role)
  return callback.toString()
}
