import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistMessagesPageView } from "@/components/kleio/artist-workspace/artist-messages-page-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveArtistMessages } from "@/components/kleio/live-artist-workspace"

export const metadata: Metadata = {
  title: "KLEIO — Messages",
  description: "Keep applicant communication, missing-material requests, and collaborator notes in context.",
}

export default function Page() {
  return (
    <ArtistShell>
      <LiveModeView live={<LiveArtistMessages />} preview={<ArtistMessagesPageView />} />
    </ArtistShell>
  )
}
