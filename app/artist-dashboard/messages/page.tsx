import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistMessagesPageView } from "@/components/kleio/artist-workspace/artist-messages-page-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveArtistCrossRoleMessages } from "@/components/kleio/live-opportunity-workspace"

export const metadata: Metadata = {
  title: "KLEIO — Messages",
  description: "Keep opportunity inquiries, applicant communication, and missing-material requests in context.",
}

export default function Page() {
  return (
    <ArtistShell>
      <LiveModeView live={<LiveArtistCrossRoleMessages />} preview={<ArtistMessagesPageView />} />
    </ArtistShell>
  )
}
