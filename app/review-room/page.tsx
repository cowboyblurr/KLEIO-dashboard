import type { Metadata } from "next"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ReviewRoomPageView } from "@/components/kleio/review-room-page-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveInstitutionSubmissions } from "@/components/kleio/live-institution-workspace"

export const metadata: Metadata = {
  title: "KLEIO — Review Room",
  description:
    "A focused committee workspace for discussing applicants with enough context to move from review into shortlist, decision history, and reporting.",
}

export default function Page() {
  return (
    <DashboardShell>
      <LiveModeView live={<LiveInstitutionSubmissions mode="room" />} preview={<ReviewRoomPageView />} />
    </DashboardShell>
  )
}
