"use client"

import { useKleioMode } from "@/components/kleio/use-kleio-mode"

export function LiveModeView({ live, preview }: { live: React.ReactNode; preview: React.ReactNode }) {
  const { isLive, isResolved } = useKleioMode()

  if (!isResolved) return null
  return isLive ? <>{live}</> : <>{preview}</>
}
