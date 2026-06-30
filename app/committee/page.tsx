import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { CommitteePageView } from "@/components/kleio/committee-page-view"

export default function Page() {
  return (
    <DashboardShell>
      <CommitteePageView />
    </DashboardShell>
  )
}
