import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { Overview } from "@/components/kleio/overview"

export default function Page() {
  return (
    <DashboardShell>
      <Overview />
    </DashboardShell>
  )
}
