import type { Metadata } from "next"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ReviewRoomPageView } from "@/components/kleio/review-room-page-view"

export const metadata: Metadata = {
  title: "KLEIO — Review Room",
  description:
    "An editorial review room for open calls, applicants, reviewers, incomplete materials, shortlist decisions, and reports.",
}

export default function Page() {
  return (
    <DashboardShell>
      <ReviewRoomPageView />
    </DashboardShell>
  )
}
