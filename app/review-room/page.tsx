import type { Metadata } from "next"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ReviewRoomPageView } from "@/components/kleio/review-room-page-view"

export const metadata: Metadata = {
  title: "KLEIO — Review Room",
  description:
    "A focused committee workspace for discussing applicants with enough context to move from review into shortlist, decision history, and reporting.",
}

export default function Page() {
  return (
    <DashboardShell>
      <ReviewRoomPageView />
    </DashboardShell>
  )
}
