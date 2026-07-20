import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { MessagesView } from "@/components/kleio/messages-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveInstitutionMessages } from "@/components/kleio/live-institution-workspace"

export default function Page() {
  return (
    <DashboardShell>
      <LiveModeView live={<LiveInstitutionMessages />} preview={<MessagesView />} />
    </DashboardShell>
  )
}
