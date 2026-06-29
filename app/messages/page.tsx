import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { MessagesView } from "@/components/kleio/messages-view"

export default function Page() {
  return (
    <DashboardShell>
      <MessagesView />
    </DashboardShell>
  )
}
