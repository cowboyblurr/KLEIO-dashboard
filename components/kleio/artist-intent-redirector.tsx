"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { consumeKleioReturnIntent } from "@/lib/kleio-return-intent"

export function ArtistIntentRedirector() {
  const router = useRouter()

  useEffect(() => {
    const returnTo = consumeKleioReturnIntent()
    if (returnTo) router.replace(returnTo)
  }, [router])

  return null
}
