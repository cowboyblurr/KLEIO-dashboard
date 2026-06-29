import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { PlaceholderPage } from "@/components/kleio/placeholder-page"

export default function Page() {
  return (
    <DashboardShell>
      <PlaceholderPage
        title="Shortlist"
        description="Curate finalists, compare them side by side, and prepare clean recommendations for committee review."
      />
    </DashboardShell>
  )
}
