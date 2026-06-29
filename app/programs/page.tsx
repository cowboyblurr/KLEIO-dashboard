import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { PlaceholderPage } from "@/components/kleio/placeholder-page"

export default function Page() {
  return (
    <DashboardShell>
      <PlaceholderPage
        title="Programs"
        description="Create and manage open calls, residencies, and grant cycles — with deadlines, eligibility, and review workflows in one place."
      />
    </DashboardShell>
  )
}
