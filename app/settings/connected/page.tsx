import type { Metadata } from "next"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ConnectedInstitutionProfileView } from "@/components/kleio/connected-institution-profile-view"

export const metadata: Metadata = {
  title: "KLEIO — Connected Institution Profile",
  description: "Edit the institution information shown on connected open calls and applications.",
}

export default function Page() {
  return (
    <DashboardShell>
      <ConnectedInstitutionProfileView />
    </DashboardShell>
  )
}
