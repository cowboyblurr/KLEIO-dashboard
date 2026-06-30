import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ReviewQueuePageView } from "@/components/kleio/review-queue-page"

export default function Page() {
  return (
    <DashboardShell>
      <ReviewQueuePageView />
    </DashboardShell>
  )
}
