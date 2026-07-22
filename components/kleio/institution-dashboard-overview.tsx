"use client"

import { Overview } from "@/components/kleio/overview"
import { LiveInstitutionOverview } from "@/components/kleio/live-institution-overview"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"

export function InstitutionDashboardOverview() {
  const { isLive } = useKleioMode()
  return isLive ? <LiveInstitutionOverview /> : <Overview />
}
