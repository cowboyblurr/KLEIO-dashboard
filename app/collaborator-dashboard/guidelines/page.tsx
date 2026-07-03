import type { Metadata } from "next"
import { CollaboratorShell } from "@/components/kleio/collaborator-shell"
import { CollaboratorGuidelinesPageView } from "@/components/kleio/collaborator-guidelines-page-view"

export const metadata: Metadata = {
  title: "KLEIO — Review Guidelines",
  description: "Program rubrics and required materials for collaborator review assignments.",
}

export default function Page() {
  return (
    <CollaboratorShell>
      <CollaboratorGuidelinesPageView />
    </CollaboratorShell>
  )
}
