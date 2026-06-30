import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { Overview } from "@/components/kleio/overview"

/** Institution workspace overview — private, not the public homepage. */
export default function Page() {
  return (
    <DashboardShell>
      <Overview />
    </DashboardShell>
  )
}
