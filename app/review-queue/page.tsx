import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { PlaceholderPage } from "@/components/kleio/placeholder-page"

export default function Page() {
  return (
    <DashboardShell>
      <PlaceholderPage
        title="Review Queue"
        description="Your prioritized evaluation workspace — assign reviewers, score submissions, and keep every decision moving forward."
      />
    </DashboardShell>
  )
}
