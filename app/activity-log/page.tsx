import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { PlaceholderPage } from "@/components/kleio/placeholder-page"

export default function Page() {
  return (
    <DashboardShell>
      <PlaceholderPage
        title="Activity Log"
        description="A complete audit trail of every review, note, and status change across your institution's programs."
      />
    </DashboardShell>
  )
}
