import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistMessagesPageView } from "@/components/kleio/artist-workspace/artist-messages-page-view"

export const metadata: Metadata = {
  title: "KLEIO — Messages",
  description: "Keep applicant communication, missing-material requests, and collaborator notes in context.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ArtistMessagesPageView />
    </ArtistShell>
  )
}
