export type KleioDemoSession = {
  isAuthenticated: true
  role: "artist" | "institution"
  name: string
  email: string
  createdAt: string
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
 * Private workspaces (client-side demo auth):
 *   `/dashboard/` — institution overview
 *   `/artist-dashboard/` — artist overview
 *   `/programs/`, `/review-queue/`, etc. — institution workspace pages
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
}

function isBrowser() {
  return typeof window !== "undefined"
}

function parseSession(raw: string | null): KleioDemoSession | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as KleioDemoSession
    if (parsed?.isAuthenticated && (parsed.role === "artist" || parsed.role === "institution")) {
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

export function loginDemoUser(role: "artist" | "institution"): KleioDemoSession {
  const creds = DEMO_CREDENTIALS[role]
  const session: KleioDemoSession = {
    isAuthenticated: true,
    role: creds.role,
    name: creds.name,
    email: creds.email,
    createdAt: new Date().toISOString(),
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

  return null
}

export function getDashboardForRole(role: "artist" | "institution"): string {
  return role === "artist" ? "/artist-dashboard/" : "/dashboard/"
}

/** Public marketing homepage — not a workspace route. */
export function getPublicHomeHref(): string {
  return "/"
}

/** Wordmark and “Return to KLEIO” always go to the public homepage. */
export function getHomeHrefForSession(): string {
  return getPublicHomeHref()
}

/**
 * “Explore Arthouse” — workspace for signed-in users only.
 * Anonymous visitors stay on the public homepage.
 */
export function getExploreArthouseHref(): string {
  const session = getDemoSession()
  if (!session) return getPublicHomeHref()
  return getDashboardForRole(session.role)
}

export function artistProfileHref(artistId: string): string {
  return `/artists/${artistId}/`
}

export const DEMO_LOGIN_HINT =
  "Demo access: institution@kleio.demo or artist@kleio.demo · password kleio2026"
