import type { Metadata } from "next"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { InstitutionDashboardOverview } from "@/components/kleio/institution-dashboard-overview"

/** Institution dashboard overview — private workspace, not the public homepage. */
export const metadata: Metadata = {
  title: "KLEIO — Institution Workspace",
  description:
    "Manage submissions, reviewer progress, missing materials, shortlists, and reports from one organized workspace.",
}

export default function Page() {
  return (
    <DashboardShell>
      <InstitutionDashboardOverview />
    </DashboardShell>
  )
}
