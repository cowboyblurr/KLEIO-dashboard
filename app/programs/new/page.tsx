import type { Metadata } from "next"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ConnectedOpenCallPageView } from "@/components/kleio/connected-open-call-page-view"

export const metadata: Metadata = {
  title: "KLEIO — Create Open Call",
  description: "Create and publish a KLEIO open call with connected application and review records.",
}

export default function Page() {
  return (
    <DashboardShell>
      <ConnectedOpenCallPageView />
    </DashboardShell>
  )
}
