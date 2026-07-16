export type KleioDemoSession = {
  isAuthenticated: true
  role: "artist" | "institution" | "collaborator"
  name: string
  email: string
  createdAt: string
  collaboratorId?: string
  source?: "preview" | "supabase"
  userId?: string
}

const STORAGE_KEY = "kleio-demo-session"

/**
 * KLEIO route architecture (demo):
 *
 * Public:
 *   `/` — marketing homepage / landing page
 *   `/landing/` — legacy duplicate of `/` for old links
 *   `/signup/*` — signup flows
 *
 * Private workspaces:
 *   `/dashboard/` — institution overview
 *   `/artist-dashboard/` — artist overview
 *   `/collaborator-dashboard/` — collaborator review seat
 *   `/programs/`, `/review-queue/`, etc. — institution workspace pages
 *
 * Supabase-backed sessions are mirrored into this lightweight browser session so
 * the existing static-export workspace can keep its role-aware navigation.
 */

const DEMO_CREDENTIALS = {
  institution: {
    email: "institution@kleio.demo",
    password: "kleio2026",
    role: "institution" as const,
    name: "KLEIO Arthouse",
  },
  artist: {
    email: "artist@kleio.demo",
    password: "kleio2026",
    role: "artist" as const,
    name: "Amina El Badri",
  },
  collaborator: {
    email: "reviewer@kleio.demo",
    password: "kleio2026",
    role: "collaborator" as const,
    name: "Celeste Rowan",
    collaboratorId: "celeste-rowan",
  },
}

function isBrowser() {
  return typeof window !== "undefined"
}

function parseSession(raw: string | null): KleioDemoSession | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as KleioDemoSession
    if (
      parsed?.isAuthenticated &&
      (parsed.role === "artist" || parsed.role === "institution" || parsed.role === "collaborator")
    ) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function getDemoSession(): KleioDemoSession | null {
  if (!isBrowser()) return null
  return parseSession(window.localStorage.getItem(STORAGE_KEY))
}

export function setDemoSession(session: KleioDemoSession): void {
  if (!isBrowser()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearDemoSession(): void {
  if (!isBrowser()) return
  window.localStorage.removeItem(STORAGE_KEY)
}

export function loginDemoUser(role: "artist" | "institution" | "collaborator"): KleioDemoSession {
  const creds = DEMO_CREDENTIALS[role]
  const session: KleioDemoSession = {
    isAuthenticated: true,
    role: creds.role,
    name: creds.name,
    email: creds.email,
    createdAt: new Date().toISOString(),
    source: "preview",
    ...(role === "collaborator" && "collaboratorId" in creds
      ? { collaboratorId: creds.collaboratorId }
      : {}),
  }
  setDemoSession(session)
  return session
}

export function validateDemoCredentials(email: string, password: string): KleioDemoSession | null {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPassword = password.trim()

  if (
    normalizedEmail === DEMO_CREDENTIALS.institution.email &&
    normalizedPassword === DEMO_CREDENTIALS.institution.password
  ) {
    return loginDemoUser("institution")
  }

  if (
    normalizedEmail === DEMO_CREDENTIALS.artist.email &&
    normalizedPassword === DEMO_CREDENTIALS.artist.password
  ) {
    return loginDemoUser("artist")
  }

  if (
    normalizedEmail === DEMO_CREDENTIALS.collaborator.email &&
    normalizedPassword === DEMO_CREDENTIALS.collaborator.password
  ) {
    return loginDemoUser("collaborator")
  }

  return null
}

export function getDashboardForRole(role: "artist" | "institution" | "collaborator"): string {
  if (role === "artist") return "/artist-dashboard/"
  if (role === "collaborator") return "/collaborator-dashboard/"
  return "/dashboard/"
}

/** Public marketing homepage (`/`) — not a workspace route. */
export function getPublicHomeHref(): string {
  return "/"
}

/** KLEIO wordmark: public homepage when logged out, workspace overview when signed in. */
export function getHomeHrefForSession(): string {
  const session = getDemoSession()

  if (!session) return "/"
  if (session.role === "institution") return "/dashboard/"
  if (session.role === "artist") return "/artist-dashboard/"
  if (session.role === "collaborator") return "/collaborator-dashboard/"

  return "/"
}

/** Explore Arthouse: institution workspace entry (AuthGate when logged out). */
export function getExploreArthouseHref(): string {
  const session = getDemoSession()

  if (!session) return "/dashboard/"
  if (session.role === "institution") return "/dashboard/"
  if (session.role === "artist") return "/artist-dashboard/"
  if (session.role === "collaborator") return "/collaborator-dashboard/"

  return "/dashboard/"
}

export function artistProfileHref(artistId: string): string {
  return `/artists/${artistId}/`
}

export const DEMO_LOGIN_HINT =
  "Preview access: institution@kleio.demo, artist@kleio.demo, or reviewer@kleio.demo · password kleio2026"
