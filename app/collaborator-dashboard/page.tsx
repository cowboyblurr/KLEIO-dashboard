import type { Metadata } from "next"
import { CollaboratorShell } from "@/components/kleio/collaborator-shell"
import { CollaboratorDashboardView } from "@/components/kleio/collaborator-dashboard-view"
import { LiveReviewerWorkspace } from "@/components/kleio/live-reviewer-workspace"
import { LiveModeView } from "@/components/kleio/live-mode-view"

export const metadata: Metadata = {
  title: "KLEIO — Collaborator Review Seat",
  description:
    "A focused workspace for invited reviewers, jurors, and committee members to complete assigned reviews.",
}

export default function Page() {
  return (
    <CollaboratorShell>
      <LiveModeView live={<LiveReviewerWorkspace mode="overview" />} preview={<CollaboratorDashboardView />} />
    </CollaboratorShell>
  )
}
