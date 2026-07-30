"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { LiveSignup } from "@/components/kleio/signup/live-signup"
import { storeKleioReturnIntent } from "@/lib/kleio-return-intent"

export function IntentAwareLiveSignup({ role }: { role: "artist" | "institution" }) {
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo")

  useEffect(() => {
    if (role === "artist") storeKleioReturnIntent(returnTo)
  }, [returnTo, role])

  return <LiveSignup role={role} />
}
