"use client"

import { useEffect, useState } from "react"
import { getKleioMode, KLEIO_MODE_CHANGE_EVENT, setKleioMode, type KleioMode } from "@/lib/kleio-mode"

export function useKleioMode() {
  const [resolvedMode, setResolvedMode] = useState<KleioMode | null>(null)

  useEffect(() => {
    const syncMode = () => setResolvedMode(getKleioMode())
    syncMode()
    window.addEventListener(KLEIO_MODE_CHANGE_EVENT, syncMode)
    window.addEventListener("storage", syncMode)
    return () => {
      window.removeEventListener(KLEIO_MODE_CHANGE_EVENT, syncMode)
      window.removeEventListener("storage", syncMode)
    }
  }, [])

  function updateMode(nextMode: KleioMode) {
    setKleioMode(nextMode)
    setResolvedMode(nextMode)
  }

  return {
    mode: resolvedMode ?? "live",
    isResolved: resolvedMode !== null,
    isDemo: resolvedMode === "demo",
    isPreview: resolvedMode === "preview",
    isLive: resolvedMode === "live",
    setMode: updateMode,
  }
}
