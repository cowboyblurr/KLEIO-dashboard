import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { PlaceholderPage } from "@/components/kleio/placeholder-page"

export default function Page() {
  return (
    <DashboardShell>
      <PlaceholderPage
        title="Artists"
        description="A unified directory of applicants and alumni, with portfolios, history, and submission records across every cycle."
      />
    </DashboardShell>
  )
}
