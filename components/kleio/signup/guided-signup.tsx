"use client"

import type { FormEvent } from "react"
import { useRouter } from "next/navigation"
import { GuidedSignupForm } from "@/components/kleio/signup/guided-signup-form"
import { getDashboardForRole, loginDemoUser } from "@/lib/kleio-demo-auth"
import { setKleioMode } from "@/lib/kleio-mode"

/**
 * Guided signup is visually aligned with onboarding but contains no production
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
      <GuidedSignupForm role={role} />
    </div>
  )
}
