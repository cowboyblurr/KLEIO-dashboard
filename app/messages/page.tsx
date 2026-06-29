import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { PlaceholderPage } from "@/components/kleio/placeholder-page"

export default function Page() {
  return (
    <DashboardShell>
      <PlaceholderPage
        title="Messages"
        description="Communicate with applicants and reviewers in threaded conversations tied directly to each submission."
      />
    </DashboardShell>
  )
}
