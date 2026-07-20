import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ShortlistPageView } from "@/components/kleio/shortlist-page-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveInstitutionSubmissions } from "@/components/kleio/live-institution-workspace"

export default function Page() {
  return (
    <DashboardShell>
      <LiveModeView live={<LiveInstitutionSubmissions mode="shortlist" />} preview={<ShortlistPageView />} />
    </DashboardShell>
  )
}
