import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { PlaceholderPage } from "@/components/kleio/placeholder-page"

export default function Page() {
  return (
    <DashboardShell>
      <PlaceholderPage
        title="Templates"
        description="Save reusable language, criteria, messages, and review structures for future programs."
      />
    </DashboardShell>
  )
}
