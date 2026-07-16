import type { Metadata } from "next"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ConnectedInstitutionCallsView } from "@/components/kleio/connected-institution-calls-view"

export const metadata: Metadata = {
  title: "KLEIO — Connected Open Calls",
  description: "Create, publish, and review open calls linked to connected KLEIO records.",
}

export default function Page() {
  return (
    <DashboardShell>
      <ConnectedInstitutionCallsView />
    </DashboardShell>
  )
}
