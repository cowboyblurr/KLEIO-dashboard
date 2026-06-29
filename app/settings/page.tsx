import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { PlaceholderPage } from "@/components/kleio/placeholder-page"

export default function Page() {
  return (
    <DashboardShell>
      <PlaceholderPage
        title="Settings"
        description="Manage your institution profile, team roles, permissions, and integration preferences."
      />
    </DashboardShell>
  )
}
