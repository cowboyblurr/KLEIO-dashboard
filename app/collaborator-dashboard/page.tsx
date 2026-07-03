import type { Metadata } from "next"
import { CollaboratorShell } from "@/components/kleio/collaborator-shell"
import { CollaboratorDashboardView } from "@/components/kleio/collaborator-dashboard-view"

export const metadata: Metadata = {
  title: "KLEIO — Collaborator Review Seat",
  description:
    "A focused workspace for invited reviewers, jurors, and committee members to complete assigned reviews.",
}

export default function Page() {
  return (
    <CollaboratorShell>
      <CollaboratorDashboardView />
    </CollaboratorShell>
  )
}
