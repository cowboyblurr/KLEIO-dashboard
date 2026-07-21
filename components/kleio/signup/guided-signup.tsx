"use client"

import type { FormEvent } from "react"
import { useRouter } from "next/navigation"
import { LiveSignup } from "@/components/kleio/signup/live-signup"
import { getDashboardForRole, loginDemoUser } from "@/lib/kleio-demo-auth"
import { setKleioMode } from "@/lib/kleio-mode"

/**
 * Guided signup intentionally renders the live signup component so the demo
 * cannot drift from the real artist and institution registration experience.
 * The wrapper only intercepts submission to enter the synthetic demo workspace
 * instead of creating a live account.
 */
export function GuidedSignup({ role }: { role: "artist" | "institution" }) {
  const router = useRouter()

  function enterGuidedWorkspace(event: FormEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    loginDemoUser(role)
    setKleioMode("demo")
    router.push(getDashboardForRole(role))
  }

  return (
    <div onSubmitCapture={enterGuidedWorkspace}>
      <LiveSignup role={role} />
    </div>
  )
}
