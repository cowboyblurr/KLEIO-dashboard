import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { PlaceholderPage } from "@/components/kleio/placeholder-page"

export default function Page() {
  return (
    <DashboardShell>
      <PlaceholderPage
        title="Workspace Settings"
        description="Manage workspace details, demo preferences, team roles, and review defaults."
      />
    </DashboardShell>
  )
}
