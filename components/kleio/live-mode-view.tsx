"use client"

import { useKleioMode } from "@/components/kleio/use-kleio-mode"

export function LiveModeView({ live, preview }: { live: React.ReactNode; preview: React.ReactNode }) {
  const { isLive } = useKleioMode()
  return isLive ? <>{live}</> : <>{preview}</>
}
