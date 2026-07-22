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

export function getKleioSiteUrl() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (configuredSiteUrl?.trim()) return normalizeSiteUrl(configuredSiteUrl)

  const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? "")
  if (typeof window !== "undefined") return `${window.location.origin}${basePath}`

  return `http://localhost:3000${basePath}`
}

export function getKleioAbsoluteUrl(path = "/") {
  return `${getKleioSiteUrl()}${ensurePath(path)}`
}

export function getKleioAuthCallbackUrl(role?: "artist" | "institution") {
  const callback = new URL(getKleioAbsoluteUrl("/auth/callback/"))
  if (role) callback.searchParams.set("role", role)
  return callback.toString()
}
