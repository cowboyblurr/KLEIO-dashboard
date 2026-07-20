import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ReportsPageView } from "@/components/kleio/reports-page-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveInstitutionReports } from "@/components/kleio/live-institution-workspace"

export default function Page() {
  return (
    <DashboardShell>
      <LiveModeView live={<LiveInstitutionReports />} preview={<ReportsPageView />} />
    </DashboardShell>
  )
}
