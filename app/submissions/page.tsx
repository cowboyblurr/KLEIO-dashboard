import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { PlaceholderPage } from "@/components/kleio/placeholder-page"

export default function Page() {
  return (
    <DashboardShell>
      <PlaceholderPage
        title="Submissions"
        description="Browse every application across your programs with rich filtering, completeness tracking, and bulk actions."
      />
    </DashboardShell>
  )
}
