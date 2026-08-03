"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { LiveSignup } from "@/components/kleio/signup/live-signup"
import { LightweightArtistSignup } from "@/components/kleio/signup/lightweight-artist-signup"
import { storeKleioReturnIntent } from "@/lib/kleio-return-intent"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"

export function IntentAwareLiveSignup({ role }: { role: "artist" | "institution" }) {
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo")

  useEffect(() => {
    if (role !== "artist") return
    if (returnTo) storeKleioReturnIntent(returnTo)
    void trackKleioProductEvent("artist_signup_selected", {
      surface: "artist_signup_route",
      deduplicationKey: "artist_signup_selected:route",
      metadata: { source: returnTo ? "opportunity_entry" : "direct" },
    })
    void trackKleioProductEvent("creative_passport_selected", {
      surface: "artist_signup_route",
      deduplicationKey: "creative_passport_selected:route",
      metadata: { mode: "account_setup" },
    })
  }, [returnTo, role])

  return role === "artist" ? <LightweightArtistSignup /> : <LiveSignup role="institution" />
}
