import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { TemplatesPageView } from "@/components/kleio/institution-workspace/templates-page-view"

export default function Page() {
  return (
    <DashboardShell>
      <TemplatesPageView />
    </DashboardShell>
  )
}
