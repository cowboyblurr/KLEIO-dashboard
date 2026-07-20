"use client"

import { useEffect, useState } from "react"
import { getKleioMode, setKleioMode, type KleioMode } from "@/lib/kleio-mode"

export function useKleioMode() {
  const [mode, setModeState] = useState<KleioMode>("live")

  useEffect(() => {
    setModeState(getKleioMode())
  }, [])

  function updateMode(nextMode: KleioMode) {
    setKleioMode(nextMode)
    setModeState(nextMode)
  }

  return { mode, isDemo: mode === "demo", isPreview: mode === "preview", isLive: mode === "live", setMode: updateMode }
}
