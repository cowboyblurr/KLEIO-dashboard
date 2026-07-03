import type { Metadata } from "next"
import { CollaboratorShell } from "@/components/kleio/collaborator-shell"
import { CollaboratorSubmittedPageView } from "@/components/kleio/collaborator-submitted-page-view"

export const metadata: Metadata = {
  title: "KLEIO — Submitted Reviews",
  description: "Completed collaborator reviews and recommendations.",
}

export default function Page() {
  return (
    <CollaboratorShell>
      <CollaboratorSubmittedPageView />
    </CollaboratorShell>
  )
}
