import {
  clearDemoSession,
  clearPreviewAccountData,
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

function assertSupportedRole(role: KleioPlatformRole): asserts role is "artist" | "institution" | "collaborator" {
  if (role !== "artist" && role !== "institution" && role !== "collaborator") throw new Error("This account does not have a supported KLEIO role.")
}

function toKleioSession(input: { id: string; role: KleioPlatformRole; name: string; email: string; onboardingCompleted: boolean }): KleioDemoSession {
  assertSupportedRole(input.role)
  return {
    isAuthenticated: true,
    role: input.role,
    name: input.name,
    email: input.email,
    createdAt: new Date().toISOString(),
    source: "supabase",
    userId: input.id,
    profileExists: true,
    onboardingCompleted: input.onboardingCompleted,
  }
}

export async function resolveKleioSession(): Promise<KleioDemoSession | null> {
  if (!getSupabaseConfig().configured) return getDemoSession()
  const authSession = await getValidSupabaseSession()
  if (!authSession) { clearDemoSession(); return null }

  const profile = await loadProfile(authSession.user.id)
  if (!profile) {
    clearDemoSession()
    throw new Error("Your authenticated account is missing its KLEIO profile record. Return to signup or contact support.")
  }

  const session = toKleioSession({
    id: authSession.user.id,
    role: profile.role,
    name: profile.display_name?.trim() || authSession.user.email || "KLEIO user",
    email: profile.email ?? authSession.user.email ?? "",
    onboardingCompleted: Boolean(profile.onboarding_completed),
  })
  setDemoSession(session)
  return session
}

export async function signInKleio(email: string, password: string): Promise<KleioAuthResult> {
  if (!getSupabaseConfig().configured) {
    const previewSession = validateDemoCredentials(email, password)
    if (!previewSession) throw new Error("Those preview credentials did not match.")
    return { session: previewSession, source: "preview" }
  }

  clearDemoSession()
  clearPreviewAccountData()
  const authSession = await signInWithSupabase(email, password)
  const profile = await loadProfile(authSession.user.id)
  if (!profile) {
    await signOutSupabase()
    throw new Error("This account was authenticated, but its KLEIO profile record is missing.")
  }

  const session = toKleioSession({
    id: authSession.user.id,
    role: profile.role,
    name: profile.display_name?.trim() || authSession.user.email || "KLEIO user",
    email: profile.email ?? authSession.user.email ?? email,
    onboardingCompleted: Boolean(profile.onboarding_completed),
  })
  setDemoSession(session)
  return { session, source: "supabase" }
}

export async function signUpKleio(input: { email: string; password: string; role: Exclude<KleioPlatformRole, "collaborator">; displayName: string }): Promise<KleioAuthResult> {
  if (!getSupabaseConfig().configured) {
    clearPreviewAccountData()
    const session: KleioDemoSession = {
      isAuthenticated: true,
      role: input.role,
      name: input.displayName.trim(),
      email: input.email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
      source: "preview",
      userId: `preview-${input.role}-${Date.now()}`,
      profileExists: true,
      onboardingCompleted: false,
    }
    setDemoSession(session)
    return { session, source: "preview" }
  }

  clearDemoSession()
  clearPreviewAccountData()
  const result = await signUpWithSupabase(input)
  if (!result.user) throw new Error("Supabase did not create an account.")
  if (!result.session) return { session: null, source: "supabase", needsEmailConfirmation: result.needsEmailConfirmation }

  const profile = await loadProfile(result.user.id)
  if (!profile) {
    await signOutSupabase()
    throw new Error("The account was created, but KLEIO could not create its profile record.")
  }
  if (profile.role !== input.role) {
    await signOutSupabase()
    throw new Error("The created account role does not match the selected signup flow.")
  }

  const session = toKleioSession({
    id: result.user.id,
    role: profile.role,
    name: profile.display_name?.trim() || input.displayName.trim(),
    email: profile.email ?? input.email.trim().toLowerCase(),
    onboardingCompleted: Boolean(profile.onboarding_completed),
  })
  setDemoSession(session)
  return { session, source: "supabase" }
}

export async function completeKleioOnboarding() {
  const session = await resolveKleioSession()
  if (!session?.userId || session.source !== "supabase") {
    if (session) setDemoSession({ ...session, onboardingCompleted: true })
    return
  }
  await supabaseRest(`profiles?id=eq.${encodeURIComponent(session.userId)}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: JSON.stringify({ onboarding_completed: true }),
  })
  setDemoSession({ ...session, onboardingCompleted: true })
}

export async function signOutKleio() {
  if (getSupabaseConfig().configured) await signOutSupabase()
  clearDemoSession()
  clearPreviewAccountData()
}

export function getKleioAuthMode() { return getSupabaseConfig().configured ? "supabase" as const : "preview" as const }
