import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { InstitutionSettingsPageView } from "@/components/kleio/institution-workspace/institution-settings-page-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveInstitutionInvitations } from "@/components/kleio/live-institution-workspace"

export default function Page() {
  return (
    <DashboardShell>
      <LiveModeView live={<LiveInstitutionInvitations />} preview={<InstitutionSettingsPageView />} />
    </DashboardShell>
  )
}
