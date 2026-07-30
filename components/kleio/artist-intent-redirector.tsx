"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getKleioReturnRoute, readKleioReturnIntent } from "@/lib/kleio-return-intent"

export function ArtistIntentRedirector() {
  const router = useRouter()

  useEffect(() => {
    const intent = readKleioReturnIntent()
    if (intent) router.replace(getKleioReturnRoute(intent))
  }, [router])

  return null
}
