import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { MessagesView } from "@/components/kleio/messages-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveInstitutionCrossRoleMessages } from "@/components/kleio/live-opportunity-workspace"

export default function Page() {
  return (
    <DashboardShell>
      <LiveModeView live={<LiveInstitutionCrossRoleMessages />} preview={<MessagesView />} />
    </DashboardShell>
  )
}
