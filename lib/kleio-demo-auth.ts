export type KleioDemoSession = {
  isAuthenticated: true
  role: "artist" | "institution" | "collaborator"
  name: string
  email: string
  createdAt: string
  collaboratorId?: string
  source?: "preview" | "supabase"
  userId?: string
  profileExists?: boolean
  onboardingCompleted?: boolean
}

const STORAGE_KEY = "kleio-demo-session"
const PREVIEW_DATA_KEY = "kleio-connected-preview-v1"

const DEMO_CREDENTIALS = {
  institution: { email: "institution@kleio.demo", password: "kleio2026", role: "institution" as const, name: "KLEIO Arthouse" },
  artist: { email: "artist@kleio.demo", password: "kleio2026", role: "artist" as const, name: "Amina El Badri" },
  collaborator: { email: "reviewer@kleio.demo", password: "kleio2026", role: "collaborator" as const, name: "Celeste Rowan", collaboratorId: "celeste-rowan" },
}

function isBrowser() { return typeof window !== "undefined" }

function parseSession(raw: string | null): KleioDemoSession | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as KleioDemoSession
    return parsed?.isAuthenticated && (parsed.role === "artist" || parsed.role === "institution" || parsed.role === "collaborator") ? parsed : null
  } catch { return null }
}

export function getDemoSession(): KleioDemoSession | null {
  if (!isBrowser()) return null
  return parseSession(window.localStorage.getItem(STORAGE_KEY))
}

export function setDemoSession(session: KleioDemoSession): void {
  if (isBrowser()) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearDemoSession(): void {
  if (isBrowser()) window.localStorage.removeItem(STORAGE_KEY)
}

export function clearPreviewAccountData(): void {
  if (isBrowser()) window.localStorage.removeItem(PREVIEW_DATA_KEY)
}

export function loginDemoUser(role: "artist" | "institution" | "collaborator"): KleioDemoSession {
  const creds = DEMO_CREDENTIALS[role]
  clearDemoSession()
  clearPreviewAccountData()
  const session: KleioDemoSession = {
    isAuthenticated: true,
    role: creds.role,
    name: creds.name,
    email: creds.email,
    createdAt: new Date().toISOString(),
    source: "preview",
    userId: `preview-${role}`,
    profileExists: true,
    onboardingCompleted: true,
    ...(role === "collaborator" && "collaboratorId" in creds ? { collaboratorId: creds.collaboratorId } : {}),
  }
  setDemoSession(session)
  return session
}

export function validateDemoCredentials(email: string, password: string): KleioDemoSession | null {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPassword = password.trim()
  if (normalizedEmail === DEMO_CREDENTIALS.institution.email && normalizedPassword === DEMO_CREDENTIALS.institution.password) return loginDemoUser("institution")
  if (normalizedEmail === DEMO_CREDENTIALS.artist.email && normalizedPassword === DEMO_CREDENTIALS.artist.password) return loginDemoUser("artist")
  if (normalizedEmail === DEMO_CREDENTIALS.collaborator.email && normalizedPassword === DEMO_CREDENTIALS.collaborator.password) return loginDemoUser("collaborator")
  return null
}

export function getDashboardForRole(role: "artist" | "institution" | "collaborator"): string {
  if (role === "artist") return "/artist-dashboard/connected/"
  if (role === "collaborator") return "/collaborator-dashboard/"
  return "/dashboard/connected/"
}

export function getPublicHomeHref(): string { return "/" }
export function getHomeHrefForSession(): string { const session = getDemoSession(); return session ? getDashboardForRole(session.role) : "/" }
export function getExploreArthouseHref(): string { const session = getDemoSession(); return session ? getDashboardForRole(session.role) : "/dashboard/connected/" }
export function artistProfileHref(artistId: string): string { return `/artists/${artistId}/` }
export const DEMO_LOGIN_HINT = "Preview access: institution@kleio.demo, artist@kleio.demo, or reviewer@kleio.demo · password kleio2026"
