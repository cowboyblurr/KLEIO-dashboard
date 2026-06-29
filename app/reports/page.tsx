import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { PlaceholderPage } from "@/components/kleio/placeholder-page"

export default function Page() {
  return (
    <DashboardShell>
      <PlaceholderPage
        title="Reports"
        description="Generate funder-ready analytics on applicant demographics, review throughput, and program outcomes."
      />
    </DashboardShell>
  )
}
