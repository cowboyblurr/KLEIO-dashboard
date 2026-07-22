import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { CommitteePageView } from "@/components/kleio/committee-page-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveInstitutionInvitations } from "@/components/kleio/live-institution-workspace"

export default function Page() {
  return (
    <DashboardShell>
      <LiveModeView live={<LiveInstitutionInvitations />} preview={<CommitteePageView />} />
    </DashboardShell>
  )
}
