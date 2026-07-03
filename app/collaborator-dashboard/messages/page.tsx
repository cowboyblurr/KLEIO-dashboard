import type { Metadata } from "next"
import { CollaboratorShell } from "@/components/kleio/collaborator-shell"
import { CollaboratorMessagesPageView } from "@/components/kleio/collaborator-messages-page-view"

export const metadata: Metadata = {
  title: "KLEIO — Collaborator Messages",
  description: "Assignment-related messages for collaborator reviewers.",
}

export default function Page() {
  return (
    <CollaboratorShell>
      <CollaboratorMessagesPageView />
    </CollaboratorShell>
  )
}
