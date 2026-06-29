import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { PlaceholderPage } from "@/components/kleio/placeholder-page"

export default function Page() {
  return (
    <DashboardShell>
      <PlaceholderPage
        title="Committee"
        description="Coordinate panel voting, capture deliberation notes, and track consensus through final decisions."
      />
    </DashboardShell>
  )
}
