"use client"

import { useEffect, useState } from "react"
import { getKleioMode, KLEIO_MODE_CHANGE_EVENT, setKleioMode, type KleioMode } from "@/lib/kleio-mode"

export function useKleioMode() {
  const [mode, setModeState] = useState<KleioMode>("live")

  useEffect(() => {
    const syncMode = () => setModeState(getKleioMode())
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
    setModeState(nextMode)
  }

  return { mode, isDemo: mode === "demo", isPreview: mode === "preview", isLive: mode === "live", setMode: updateMode }
}
