import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistApplicationsPageView } from "@/components/kleio/artist-workspace/artist-applications-page-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveArtistApplications } from "@/components/kleio/live-artist-workspace"

export const metadata: Metadata = {
  title: "KLEIO — Applications",
  description: "Track drafts, submitted applications, missing materials, and deadlines.",
}

export default function Page() {
  return (
    <ArtistShell>
      <LiveModeView live={<LiveArtistApplications />} preview={<ArtistApplicationsPageView />} />
    </ArtistShell>
  )
}
