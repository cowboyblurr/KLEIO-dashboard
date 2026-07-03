import type { Metadata } from "next"
import { CollaboratorShell } from "@/components/kleio/collaborator-shell"
import { CollaboratorAssignmentsPageView } from "@/components/kleio/collaborator-assignments-page-view"

export const metadata: Metadata = {
  title: "KLEIO — My Assignments",
  description: "Assigned submissions for collaborator review.",
}

export default function Page() {
  return (
    <CollaboratorShell>
      <CollaboratorAssignmentsPageView />
    </CollaboratorShell>
  )
}
