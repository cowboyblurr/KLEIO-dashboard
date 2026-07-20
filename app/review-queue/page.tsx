import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ReviewQueuePageView } from "@/components/kleio/review-queue-page"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveInstitutionSubmissions } from "@/components/kleio/live-institution-workspace"

export default function Page() {
  return (
    <DashboardShell>
      <LiveModeView live={<LiveInstitutionSubmissions mode="queue" />} preview={<ReviewQueuePageView />} />
    </DashboardShell>
  )
}
