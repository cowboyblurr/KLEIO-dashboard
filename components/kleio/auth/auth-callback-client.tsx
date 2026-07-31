"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { EmailOtpType } from "@supabase/supabase-js"
import { Loader2, MailCheck, TriangleAlert } from "lucide-react"
import { clearDemoSession, getDashboardForRole } from "@/lib/kleio-demo-auth"
import { getKleioAuthErrorMessage } from "@/lib/kleio-auth"
import { resumePendingKleioOnboarding } from "@/lib/kleio-live-onboarding"
import { finalizePendingArtistProfileImage } from "@/lib/kleio-pending-profile-image"
import { setKleioMode } from "@/lib/kleio-mode"
import {
  getSupabaseBrowserClient,
  isKleioEmailConfirmed,
  loadKleioAccount,
  type KleioAccountRole,
} from "@/lib/kleio-supabase"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"

const SIGNUP_ROLES = new Set<KleioAccountRole>(["artist", "institution"])

function readAuthError() {
  const query = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  return query.get("error_description") ?? hash.get("error_description") ?? query.get("error") ?? hash.get("error")
}

export function AuthCallbackClient() {
  const router = useRouter()
  const [status, setStatus] = useState<"working" | "error">("working")
  const [message, setMessage] = useState("Confirming your email and preparing your KLEIO workspace…")

  useEffect(() => {
    let active = true

    async function finishAuthentication() {
      try {
        const callbackError = readAuthError()
        if (callbackError) throw new Error(callbackError)

        const supabase = getSupabaseBrowserClient()
        const params = new URLSearchParams(window.location.search)
        const tokenHash = params.get("token_hash")
        const otpType = params.get("type") as EmailOtpType | null

        if (tokenHash && otpType) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType })
          if (error) throw error
        } else {
          const { error } = await supabase.auth.getSession()
          if (error) throw error
        }

        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!userData.user) throw new Error("The confirmation link did not create a valid session.")
        if (!isKleioEmailConfirmed(userData.user)) throw new Error("Email not confirmed.")

        const requestedRole = params.get("role")
        const expectedRole = requestedRole === "artist" || requestedRole === "institution" ? requestedRole : undefined
        await resumePendingKleioOnboarding(expectedRole)

        const account = await loadKleioAccount()
        if (!account) throw new Error("KLEIO could not load the profile connected to this account.")
        if (expectedRole && account.profile.role !== expectedRole) {
          throw new Error(`This confirmation link is for a ${expectedRole} account, but the active KLEIO account is ${account.profile.role}. Sign out before opening a confirmation link for another account type.`)
        }

        let profilePhotoNeedsAttention = false
        if (expectedRole === "artist") {
          try {
            const photoResult = await finalizePendingArtistProfileImage({ retries: 6, delayMs: 500 })
            profilePhotoNeedsAttention = photoResult.status === "email_mismatch" || photoResult.status === "not_ready"
          } catch {
            profilePhotoNeedsAttention = true
          }
        }

        clearDemoSession()
        setKleioMode("live")

        const role = account.profile.role
        const destination =
          profilePhotoNeedsAttention && role === "artist" && account.profile.onboarding_completed
            ? "/artist-dashboard/settings/"
            : !account.profile.onboarding_completed && SIGNUP_ROLES.has(role)
              ? `/signup/${role}/`
              : getDashboardForRole(role)

        if (!active) return
        setMessage(
          profilePhotoNeedsAttention
            ? "Email confirmed. Your workspace is ready, but the selected profile photo needs to be added again in Settings."
            : "Email confirmed. Opening your workspace…",
        )
        window.setTimeout(() => router.replace(destination), profilePhotoNeedsAttention ? 1400 : 250)
      } catch (error) {
        if (!active) return
        setStatus("error")
        setMessage(getKleioAuthErrorMessage(error))
      }
    }

    void finishAuthentication()
    return () => {
      active = false
    }
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_287)] px-5 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-border bg-white p-8 text-center shadow-sm">
        <div className="mb-7 flex justify-center">
          <KleioWordmarkLink href="/" imageClassName="h-7 w-auto" priority />
        </div>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          {status === "working" ? <Loader2 className="size-5 animate-spin" /> : <TriangleAlert className="size-5" />}
        </span>
        <h1 className="mt-5 font-serif text-2xl font-semibold text-foreground">
          {status === "working" ? "Confirming your account" : "We could not finish confirmation"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
        {status === "error" && (
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Link href="/" className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
              Return to KLEIO
            </Link>
            <Link href="/signup/" className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-foreground">
              <MailCheck className="mr-2 size-4" />
              Account options
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
