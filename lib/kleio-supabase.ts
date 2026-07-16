export type KleioPlatformRole = "artist" | "institution" | "collaborator"

export type KleioSupabaseUser = {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}

export type KleioSupabaseSession = {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in?: number
  expires_at: number
  user: KleioSupabaseUser
}

export type SupabaseConfigState = {
  configured: boolean
  url: string
  anonKey: string
  reason?: string
}

const SESSION_STORAGE_KEY = "kleio-supabase-session-v1"

function isBrowser() {
  return typeof window !== "undefined"
}

function cleanBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "")
}

export function getSupabaseConfig(): SupabaseConfigState {
  const url = cleanBaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim()

  if (!url || !anonKey) {
    return {
      configured: false,
      url,
      anonKey,
      reason: "Supabase environment variables are not available in this build.",
    }
  }

  return { configured: true, url, anonKey }
}

function normalizeSession(payload: Record<string, unknown>): KleioSupabaseSession | null {
  const nested = payload.session && typeof payload.session === "object"
    ? payload.session as Record<string, unknown>
    : payload
  const user = (nested.user ?? payload.user) as KleioSupabaseUser | undefined
  const accessToken = nested.access_token
  const refreshToken = nested.refresh_token
  const tokenType = nested.token_type
  const expiresAt = nested.expires_at
  const expiresIn = nested.expires_in

  if (
    typeof accessToken !== "string" ||
    typeof refreshToken !== "string" ||
    typeof tokenType !== "string" ||
    !user?.id
  ) {
    return null
  }

  const normalizedExpiresAt = typeof expiresAt === "number"
    ? expiresAt
    : Math.floor(Date.now() / 1000) + (typeof expiresIn === "number" ? expiresIn : 3600)

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: tokenType,
    expires_in: typeof expiresIn === "number" ? expiresIn : undefined,
    expires_at: normalizedExpiresAt,
    user,
  }
}

export function getStoredSupabaseSession(): KleioSupabaseSession | null {
  if (!isBrowser()) return null

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as KleioSupabaseSession
    if (!parsed?.access_token || !parsed?.refresh_token || !parsed?.user?.id) return null
    return parsed
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

export function storeSupabaseSession(session: KleioSupabaseSession | null) {
  if (!isBrowser()) return
  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    return
  }
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

async function parseResponse(response: Response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function errorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>
    const candidate = record.msg ?? record.message ?? record.error_description ?? record.error
    if (typeof candidate === "string" && candidate.trim()) return candidate
  }
  if (typeof payload === "string" && payload.trim()) return payload
  return fallback
}

async function authRequest(path: string, init: RequestInit) {
  const config = getSupabaseConfig()
  if (!config.configured) throw new Error(config.reason)

  const response = await fetch(`${config.url}/auth/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.anonKey,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  })
  const payload = await parseResponse(response)
  if (!response.ok) throw new Error(errorMessage(payload, `Authentication request failed (${response.status}).`))
  return payload
}

export async function signUpWithSupabase(input: {
  email: string
  password: string
  role: KleioPlatformRole
  displayName: string
}) {
  const payload = await authRequest("signup", {
    method: "POST",
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      data: {
        role: input.role,
        display_name: input.displayName.trim(),
      },
    }),
  })

  const record = (payload ?? {}) as Record<string, unknown>
  const session = normalizeSession(record)
  if (session) storeSupabaseSession(session)

  const user = (record.user ?? (record.session as Record<string, unknown> | undefined)?.user) as KleioSupabaseUser | undefined
  return {
    user: user ?? session?.user ?? null,
    session,
    needsEmailConfirmation: Boolean(user && !session),
  }
}

export async function signInWithSupabase(email: string, password: string) {
  const payload = await authRequest("token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  })
  const session = normalizeSession((payload ?? {}) as Record<string, unknown>)
  if (!session) throw new Error("Supabase did not return a usable session.")
  storeSupabaseSession(session)
  return session
}

export async function refreshSupabaseSession(session = getStoredSupabaseSession()) {
  if (!session) return null
  const payload = await authRequest("token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  })
  const refreshed = normalizeSession((payload ?? {}) as Record<string, unknown>)
  if (!refreshed) throw new Error("Supabase could not refresh the current session.")
  storeSupabaseSession(refreshed)
  return refreshed
}

export async function getValidSupabaseSession() {
  const session = getStoredSupabaseSession()
  if (!session) return null

  const now = Math.floor(Date.now() / 1000)
  if (session.expires_at - now > 60) return session

  try {
    return await refreshSupabaseSession(session)
  } catch {
    storeSupabaseSession(null)
    return null
  }
}

export async function signOutSupabase() {
  const config = getSupabaseConfig()
  const session = getStoredSupabaseSession()

  try {
    if (config.configured && session) {
      await fetch(`${config.url}/auth/v1/logout`, {
        method: "POST",
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
      })
    }
  } finally {
    storeSupabaseSession(null)
  }
}

export async function supabaseRest<T>(
  resource: string,
  init: RequestInit & { prefer?: string; publicRead?: boolean } = {},
): Promise<T> {
  const config = getSupabaseConfig()
  if (!config.configured) throw new Error(config.reason)

  const session = init.publicRead ? null : await getValidSupabaseSession()
  if (!init.publicRead && !session) throw new Error("A valid Supabase session is required.")

  const { prefer, publicRead: _publicRead, ...requestInit } = init
  const response = await fetch(`${config.url}/rest/v1/${resource}`, {
    ...requestInit,
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${session?.access_token ?? config.anonKey}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
      ...(requestInit.headers ?? {}),
    },
  })

  const payload = await parseResponse(response)
  if (!response.ok) throw new Error(errorMessage(payload, `Supabase data request failed (${response.status}).`))
  return payload as T
}

export async function uploadSupabaseFile(input: {
  bucket: string
  path: string
  file: File
  upsert?: boolean
}) {
  const config = getSupabaseConfig()
  if (!config.configured) throw new Error(config.reason)
  const session = await getValidSupabaseSession()
  if (!session) throw new Error("A valid Supabase session is required for uploads.")

  const response = await fetch(
    `${config.url}/storage/v1/object/${encodeURIComponent(input.bucket)}/${input.path.split("/").map(encodeURIComponent).join("/")}`,
    {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": input.file.type || "application/octet-stream",
        "x-upsert": input.upsert ? "true" : "false",
      },
      body: input.file,
    },
  )

  const payload = await parseResponse(response)
  if (!response.ok) throw new Error(errorMessage(payload, `File upload failed (${response.status}).`))
  return payload
}
