import type { Metadata } from "next"
import { CollaboratorShell } from "@/components/kleio/collaborator-shell"
import { CollaboratorReviewQueuePageView } from "@/components/kleio/collaborator-review-queue-page-view"

export const metadata: Metadata = {
  title: "KLEIO — Review Queue",
  description: "Focused review queue for assigned collaborator submissions.",
}

export default function Page() {
  return (
    <CollaboratorShell>
      <CollaboratorReviewQueuePageView />
    </CollaboratorShell>
  )
}
