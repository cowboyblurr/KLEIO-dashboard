import type { Metadata } from "next"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ConnectedInstitutionOverview } from "@/components/kleio/connected-institution-overview"

export const metadata: Metadata = {
  title: "KLEIO — Connected Institution Workspace",
  description: "A membership-scoped institution workspace connected to the authenticated KLEIO account.",
}

export default function Page() {
  return <DashboardShell><ConnectedInstitutionOverview /></DashboardShell>
}
