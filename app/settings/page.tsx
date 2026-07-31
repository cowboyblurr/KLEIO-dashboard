import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { InstitutionSettingsPageView } from "@/components/kleio/institution-workspace/institution-settings-page-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveInstitutionSettingsBeta } from "@/components/kleio/live-institution-settings-beta"

export default function Page() {
  return (
    <DashboardShell>
      <LiveModeView live={<LiveInstitutionSettingsBeta />} preview={<InstitutionSettingsPageView />} />
    </DashboardShell>
  )
}
