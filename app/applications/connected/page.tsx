import type { Metadata } from "next"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ConnectedInstitutionApplicationsView } from "@/components/kleio/connected-institution-applications-view"

export const metadata: Metadata = {
  title: "KLEIO — Connected Applicants",
  description: "Review applicants, update statuses, and message artists through connected KLEIO records.",
}

export default function Page() {
  return (
    <DashboardShell>
      <ConnectedInstitutionApplicationsView />
    </DashboardShell>
  )
}
