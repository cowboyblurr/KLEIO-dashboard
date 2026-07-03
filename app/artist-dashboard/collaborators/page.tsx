import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistCollaboratorsPageView } from "@/components/kleio/artist-workspace/artist-collaborators-page-view"

export const metadata: Metadata = {
  title: "KLEIO — Collaborators",
  description: "Discover artists and collaborators with related practices, themes, and opportunity interests.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ArtistCollaboratorsPageView />
    </ArtistShell>
  )
}
