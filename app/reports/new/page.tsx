import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ReportsNewPageView } from "@/components/kleio/institution-workspace/reports-new-page-view"

export default function Page() {
  return (
    <DashboardShell>
      <ReportsNewPageView />
    </DashboardShell>
  )
}
