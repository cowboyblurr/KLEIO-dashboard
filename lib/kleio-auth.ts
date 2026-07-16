import {
  clearDemoSession,
  getDemoSession,
  setDemoSession,
  validateDemoCredentials,
  type KleioDemoSession,
} from "@/lib/kleio-demo-auth"
import {
  getSupabaseConfig,
  getValidSupabaseSession,
  signInWithSupabase,
  signOutSupabase,
  signUpWithSupabase,
  supabaseRest,
  type KleioPlatformRole,
} from "@/lib/kleio-supabase"

export type KleioAuthResult = {
  session: KleioDemoSession | null
  source: "supabase" | "preview"
  needsEmailConfirmation?: boolean
}

type ProfileRow = {
  id: string
  role: KleioPlatformRole
  display_name: string | null
  email: string | null
  onboarding_completed: boolean | null
}

function profileResource(userId: string) {
  return `profiles?select=id,role,display_name,email,onboarding_completed&id=eq.${encodeURIComponent(userId)}&limit=1`
}

async function loadProfile(userId: string) {
  const rows = await supabaseRest<ProfileRow[]>(profileResource(userId), { method: "GET" })
  return rows[0] ?? null
}

function toKleioSession(input: {
  id: string
  role: KleioPlatformRole
  name: string
  email: string
}): KleioDemoSession {
  return {
    isAuthenticated: true,
    role: input.role,
    name: input.name,
    email: input.email,
    createdAt: new Date().toISOString(),
    source: "supabase",
    userId: input.id,
  }
}

export async function resolveKleioSession(): Promise<KleioDemoSession | null> {
  const config = getSupabaseConfig()
  if (!config.configured) return getDemoSession()

  const authSession = await getValidSupabaseSession()
  if (!authSession) {
    const localSession = getDemoSession()
    if (localSession?.source === "supabase") clearDemoSession()
    return localSession?.source === "preview" ? localSession : null
  }

  const profile = await loadProfile(authSession.user.id)
  const metadata = authSession.user.user_metadata ?? {}
  const role = profile?.role ?? metadata.role
  if (role !== "artist" && role !== "institution" && role !== "collaborator") {
    await signOutSupabase()
    clearDemoSession()
    throw new Error("This account does not have a valid KLEIO role.")
  }

  const session = toKleioSession({
    id: authSession.user.id,
    role,
    name: profile?.display_name ?? String(metadata.display_name ?? authSession.user.email ?? "KLEIO user"),
    email: profile?.email ?? authSession.user.email ?? "",
  })
  setDemoSession(session)
  return session
}

export async function signInKleio(email: string, password: string): Promise<KleioAuthResult> {
  const config = getSupabaseConfig()

  if (!config.configured) {
    const previewSession = validateDemoCredentials(email, password)
    if (!previewSession) throw new Error("Those preview credentials did not match.")
    const session = { ...previewSession, source: "preview" as const }
    setDemoSession(session)
    return { session, source: "preview" }
  }

  const authSession = await signInWithSupabase(email, password)
  const profile = await loadProfile(authSession.user.id)
  const metadata = authSession.user.user_metadata ?? {}
  const role = profile?.role ?? metadata.role

  if (role !== "artist" && role !== "institution" && role !== "collaborator") {
    await signOutSupabase()
    throw new Error("Your KLEIO account is missing a valid role. Complete account setup in Supabase before continuing.")
  }

  const session = toKleioSession({
    id: authSession.user.id,
    role,
    name: profile?.display_name ?? String(metadata.display_name ?? authSession.user.email ?? "KLEIO user"),
    email: profile?.email ?? authSession.user.email ?? email,
  })
  setDemoSession(session)
  return { session, source: "supabase" }
}

export async function signUpKleio(input: {
  email: string
  password: string
  role: Exclude<KleioPlatformRole, "collaborator">
  displayName: string
}): Promise<KleioAuthResult> {
  const config = getSupabaseConfig()

  if (!config.configured) {
    const session: KleioDemoSession = {
      isAuthenticated: true,
      role: input.role,
      name: input.displayName.trim(),
      email: input.email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
      source: "preview",
      userId: `preview-${input.role}-${Date.now()}`,
    }
    setDemoSession(session)
    return { session, source: "preview" }
  }

  const result = await signUpWithSupabase(input)
  if (!result.user) throw new Error("Supabase did not create an account.")

  if (!result.session) {
    return {
      session: null,
      source: "supabase",
      needsEmailConfirmation: result.needsEmailConfirmation,
    }
  }

  const session = toKleioSession({
    id: result.user.id,
    role: input.role,
    name: input.displayName.trim(),
    email: input.email.trim().toLowerCase(),
  })
  setDemoSession(session)
  return { session, source: "supabase" }
}

export async function signOutKleio() {
  const session = getDemoSession()
  if (session?.source === "supabase") await signOutSupabase()
  clearDemoSession()
}

export function getKleioAuthMode() {
  return getSupabaseConfig().configured ? "supabase" as const : "preview" as const
}
