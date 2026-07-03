import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { PlaceholderPage } from "@/components/kleio/placeholder-page"

export default function Page() {
  return (
    <DashboardShell>
      <PlaceholderPage
        title="Artists"
        description="View artist profiles, submitted materials, review status, and program history in one place."
      />
    </DashboardShell>
  )
}
