import { getKleioAuthCallbackUrl } from "@/lib/kleio-url"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

const PENDING_KEY = "kleio:artist:lightweight-signup:v1"
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
  const displayName = pending?.displayName || profile.display_name || "Artist"

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

  if (pending) {
    const { error: consentError } = await supabase.from("user_consents").upsert(
      {
        user_id: user.id,
        consent_type: "terms_and_privacy",
        policy_version: pending.policyVersion,
        accepted_at: pending.acceptedAt,
      },
      { onConflict: "user_id,consent_type,policy_version", ignoreDuplicates: true },
    )
    if (consentError) throw consentError
  }

  clearPendingLightweightArtistAccount()
  await supabase.auth.updateUser({ data: { [RECOVERY_KEY]: null } }).catch(() => undefined)
  return { userId: user.id, displayName }
}
