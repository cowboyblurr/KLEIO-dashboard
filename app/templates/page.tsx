import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { PlaceholderPage } from "@/components/kleio/placeholder-page"

export default function Page() {
  return (
    <DashboardShell>
      <PlaceholderPage
        title="Templates"
        description="Design reusable application forms, scoring rubrics, and email templates for consistent program operations."
      />
    </DashboardShell>
  )
}
