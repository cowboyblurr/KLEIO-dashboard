"use client"

import type { FormEvent } from "react"
import { useRouter } from "next/navigation"
import { LiveSignup } from "@/components/kleio/signup/live-signup"
import { getDashboardForRole, loginDemoUser } from "@/lib/kleio-demo-auth"
import { setKleioMode } from "@/lib/kleio-mode"

/**
 * Guided signup shares the production form layout but never runs production
 * authentication, account recovery, onboarding writes, or Supabase redirects.
 */
export function GuidedSignup({ role }: { role: "artist" | "institution" }) {
  const router = useRouter()

  function enterGuidedWorkspace(event: FormEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    loginDemoUser(role)
    setKleioMode("demo")
    router.replace(getDashboardForRole(role))
  }

  return (
    <div onSubmitCapture={enterGuidedWorkspace}>
      <LiveSignup role={role} experience="guided" />
    </div>
  )
}
