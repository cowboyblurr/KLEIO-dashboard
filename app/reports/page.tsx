import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ReportsPageView } from "@/components/kleio/reports-page-view"

export default function Page() {
  return (
    <DashboardShell>
      <ReportsPageView />
    </DashboardShell>
  )
}
