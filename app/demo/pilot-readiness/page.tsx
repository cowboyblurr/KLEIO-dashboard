import type { Metadata } from "next"
import { PilotReadinessPage } from "@/components/kleio/pilot-readiness-page"

export const metadata: Metadata = {
  title: "KLEIO — Pilot Readiness",
  description: "Preview the controlled implementation path from KLEIO demo to institutional pilot.",
}

export default function Page() {
  return <PilotReadinessPage />
}
