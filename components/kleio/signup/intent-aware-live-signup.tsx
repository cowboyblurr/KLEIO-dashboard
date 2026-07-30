"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { LiveSignup } from "@/components/kleio/signup/live-signup"
import { LightweightArtistSignup } from "@/components/kleio/signup/lightweight-artist-signup"
import { storeKleioReturnIntent } from "@/lib/kleio-return-intent"

export function IntentAwareLiveSignup({ role }: { role: "artist" | "institution" }) {
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo")

  useEffect(() => {
    if (role === "artist" && returnTo) storeKleioReturnIntent(returnTo)
  }, [returnTo, role])

  return role === "artist" ? <LightweightArtistSignup /> : <LiveSignup role="institution" />
}
