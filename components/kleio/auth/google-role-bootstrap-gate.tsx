"use client"

import Link from "next/link"
import { useEffect, useState, type ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { claimFreshGoogleSignupRole, hasGoogleIdentity } from "@/lib/kleio-google-auth"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

/**
 * Resolves a role-specific Google OAuth signup before the normal KLEIO callback
 * performs onboarding/routing. Email confirmation links bypass this gate.
 */
export function GoogleRoleBootstrapGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    async function resolveRole() {
      const params = new URLSearchParams(window.location.search)
      const requestedRole = params.get("role")
      const tokenHash = params.get("token_hash")

      if (tokenHash || (requestedRole !== "artist" && requestedRole !== "institution")) {
        if (active) setReady(true)
        return
      }

      try {
        const supabase = getSupabaseBrowserClient()
        const { error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        const { data, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError

        if (data.user && hasGoogleIdentity(data.user)) {
          await claimFreshGoogleSignupRole(requestedRole)
        }
        if (active) setReady(true)
      } catch (reason) {
        if (!active) return
        const message = reason instanceof Error ? reason.message : "google_role_bootstrap_failed"
        if (message.includes("account_role_mismatch") || message.includes("account_role_already_in_use")) {
          setError("This Google account already belongs to another KLEIO workspace type. Return to KLEIO, sign out, and choose the account path connected to this profile.")
        } else {
          setError("KLEIO could not safely confirm the workspace type for this Google account. Your existing KLEIO data was not changed.")
        }
      }
    }

    void resolveRole()
    return () => { active = false }
  }, [])

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_287)] px-5 py-12">
        <section className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="font-serif text-2xl font-semibold text-foreground">Google account needs a different KLEIO path</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{error}</p>
          <Link href="/" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Return to KLEIO</Link>
        </section>
      </main>
    )
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_287)] px-5 py-12">
        <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Confirming your Google account…</div>
      </main>
    )
  }

  return <>{children}</>
}
