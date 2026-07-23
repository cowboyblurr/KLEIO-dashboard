import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistMessagesPageView } from "@/components/kleio/artist-workspace/artist-messages-page-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveArtistMessageCenter } from "@/components/kleio/live-artist-message-center"

export const metadata: Metadata = {
  title: "KLEIO — Messages",
  description: "Reply to institution invitations and continue authorized opportunity or application conversations.",
}

export default function Page() {
  return (
    <ArtistShell>
      <LiveModeView live={<LiveArtistMessageCenter />} preview={<ArtistMessagesPageView />} />
    </ArtistShell>
  )
}
