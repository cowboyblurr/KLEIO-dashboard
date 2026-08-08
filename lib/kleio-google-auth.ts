import type { User } from "@supabase/supabase-js"
import { getKleioAuthCallbackUrl } from "@/lib/kleio-url"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

export type KleioGoogleRole = "artist" | "institution"

export type GoogleRoleBootstrapResult = {
  resolved_role: KleioGoogleRole
  role_changed: boolean
  existing_account: boolean
}

export function hasGoogleIdentity(user: User) {
  const provider = user.app_metadata?.provider
  const providers = Array.isArray(user.app_metadata?.providers) ? user.app_metadata.providers : []
  return provider === "google" || providers.includes("google") || user.identities?.some((identity) => identity.provider === "google") === true
}

/**
 * Starts KLEIO identity authentication only.
 *
 * This deliberately requests no Gmail/Drive scopes. Gmail sending and Drive
 * file selection have their own explicit authorization boundaries.
 */
export async function startKleioGoogleAuthentication(role: KleioGoogleRole) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getKleioAuthCallbackUrl(role),
      queryParams: { prompt: "select_account" },
    },
  })
  if (error) throw error
  return data
}

/**
 * Resolves the role selected before Google OAuth against authoritative KLEIO
 * database state. Existing account roles are immutable here. The server RPC
 * only permits the fresh OAuth default artist -> institution bootstrap.
 */
export async function claimFreshGoogleSignupRole(role: KleioGoogleRole) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("claim_fresh_google_signup_role", {
    requested_role: role,
  })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error("KLEIO could not resolve the Google account workspace type.")
  return row as GoogleRoleBootstrapResult
}
