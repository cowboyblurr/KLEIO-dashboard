import { getKleioAuthCallbackUrl } from "@/lib/kleio-url"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

const PENDING_KEY = "kleio:artist:lightweight-signup:v1"
const IMPORT_WELCOME_KEY = "kleio:artist:open-import-after-auth:v1"
const OAUTH_CONSENT_KEY = "kleio:artist:oauth-consent:v1"
const RECOVERY_KEY = "kleio_artist_account_recovery"
export const KLEIO_POLICY_VERSION = "2026-07-30"

type PendingArtistAccount = {
  email: string
  displayName: string
  acceptedAt: string
  policyVersion: string
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function normalizePending(value: unknown): PendingArtistAccount | null {
  if (!value || typeof value !== "object") return null
  const record = value as Record<string, unknown>
  if (typeof record.email !== "string" || !record.email.includes("@")) return null
  if (typeof record.displayName !== "string" || !record.displayName.trim()) return null
  if (typeof record.acceptedAt !== "string" || Number.isNaN(new Date(record.acceptedAt).getTime())) return null
  if (record.policyVersion !== KLEIO_POLICY_VERSION) return null
  return {
    email: normalizeEmail(record.email),
    displayName: record.displayName.trim().slice(0, 160),
    acceptedAt: new Date(record.acceptedAt).toISOString(),
    policyVersion: KLEIO_POLICY_VERSION,
  }
}

function googleDisplayName(metadata: Record<string, unknown> | undefined, email: string | undefined) {
  const candidates = [metadata?.display_name, metadata?.full_name, metadata?.name, metadata?.given_name]
  const first = candidates.find((value) => typeof value === "string" && value.trim())
  if (typeof first === "string") return first.trim().slice(0, 160)
  const emailPrefix = email?.split("@")[0]?.trim()
  return emailPrefix ? emailPrefix.slice(0, 160) : "Artist"
}

export function markPendingArtistImportWelcome() {
  if (typeof window !== "undefined") window.localStorage.setItem(IMPORT_WELCOME_KEY, "1")
}

export function consumePendingArtistImportWelcome() {
  if (typeof window === "undefined") return false
  const pending = window.localStorage.getItem(IMPORT_WELCOME_KEY) === "1"
  if (pending) window.localStorage.removeItem(IMPORT_WELCOME_KEY)
  return pending
}

export function savePendingLightweightArtistAccount(input: PendingArtistAccount) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(normalizePending(input)))
}

export function readPendingLightweightArtistAccount() {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(PENDING_KEY)
  if (!raw) return null
  try {
    const value = normalizePending(JSON.parse(raw))
    if (value) return value
  } catch {
    // Invalid browser data is removed below.
  }
  window.localStorage.removeItem(PENDING_KEY)
  return null
}

export function clearPendingLightweightArtistAccount() {
  if (typeof window !== "undefined") window.localStorage.removeItem(PENDING_KEY)
}

export async function signInWithGoogleArtistAccount(input: { acceptedAt: string }) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(OAUTH_CONSENT_KEY, JSON.stringify({
      acceptedAt: new Date(input.acceptedAt).toISOString(),
      policyVersion: KLEIO_POLICY_VERSION,
    }))
  }
  markPendingArtistImportWelcome()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getKleioAuthCallbackUrl("artist"),
      queryParams: { prompt: "select_account" },
    },
  })
  if (error) throw error
  return data
}

export async function signUpLightweightArtistAccount(input: {
  email: string
  password: string
  displayName: string
  acceptedAt: string
}) {
  const pending = normalizePending({
    email: input.email,
    displayName: input.displayName,
    acceptedAt: input.acceptedAt,
    policyVersion: KLEIO_POLICY_VERSION,
  })
  if (!pending) throw new Error("The artist account details are incomplete.")

  savePendingLightweightArtistAccount(pending)
  markPendingArtistImportWelcome()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.signUp({
    email: pending.email,
    password: input.password,
    options: {
      data: {
        role: "artist",
        display_name: pending.displayName,
        [RECOVERY_KEY]: pending,
      },
      emailRedirectTo: getKleioAuthCallbackUrl("artist"),
    },
  })
  if (error) throw error
  if (!data.user) throw new Error("KLEIO could not create the artist account.")
  if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error("A user has already been registered with this email.")
  }
  return { confirmationRequired: !data.session }
}

export async function ensureLightweightArtistWorkspace() {
  const supabase = getSupabaseBrowserClient()
  const { data: userResponse, error: userError } = await supabase.auth.getUser()
  if (userError || !userResponse.user) return null
  const user = userResponse.user
  if (!user.email_confirmed_at) return null

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, display_name, onboarding_completed")
    .eq("id", user.id)
    .single()
  if (profileError) throw profileError
  if (profile.role !== "artist") throw new Error("This account belongs to a different KLEIO workspace type.")

  const metadataPending = normalizePending(user.user_metadata?.[RECOVERY_KEY])
  const localPending = readPendingLightweightArtistAccount()
  const pending = localPending && normalizeEmail(user.email ?? "") === localPending.email ? localPending : metadataPending
  const displayName = pending?.displayName || profile.display_name || googleDisplayName(user.user_metadata, user.email) || "Artist"

  const { error: artistError } = await supabase.from("artist_profiles").upsert(
    {
      user_id: user.id,
      professional_name: displayName,
      profile_completion: displayName === "Artist" ? 0 : 8,
    },
    { onConflict: "user_id", ignoreDuplicates: false },
  )
  if (artistError) throw artistError

  if (!profile.onboarding_completed || profile.display_name !== displayName) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ display_name: displayName, onboarding_completed: true })
      .eq("id", user.id)
    if (updateError) throw updateError
  }

  let consent = pending ? { acceptedAt: pending.acceptedAt, policyVersion: pending.policyVersion } : null
  if (!consent && typeof window !== "undefined") {
    const raw = window.localStorage.getItem(OAUTH_CONSENT_KEY)
    try {
      const parsed = raw ? JSON.parse(raw) as Record<string, unknown> : null
      if (parsed?.policyVersion === KLEIO_POLICY_VERSION && typeof parsed.acceptedAt === "string" && !Number.isNaN(new Date(parsed.acceptedAt).getTime())) {
        consent = { acceptedAt: new Date(parsed.acceptedAt).toISOString(), policyVersion: KLEIO_POLICY_VERSION }
      }
    } catch {
      // Invalid browser consent data is ignored and cleared below.
    }
  }
  if (consent) {
    const { error: consentError } = await supabase.from("user_consents").upsert(
      {
        user_id: user.id,
        consent_type: "terms_and_privacy",
        policy_version: consent.policyVersion,
        accepted_at: consent.acceptedAt,
      },
      { onConflict: "user_id,consent_type,policy_version", ignoreDuplicates: true },
    )
    if (consentError) throw consentError
  }

  if (typeof window !== "undefined") window.localStorage.removeItem(OAUTH_CONSENT_KEY)
  clearPendingLightweightArtistAccount()
  await supabase.auth.updateUser({ data: { [RECOVERY_KEY]: null } }).catch(() => undefined)
  return { userId: user.id, displayName }
}
