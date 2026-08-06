import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistApplicationsPageView } from "@/components/kleio/artist-workspace/artist-applications-page-view"
import { FocusedArtistApplications } from "@/components/kleio/focused-artist-applications"
import { LiveModeView } from "@/components/kleio/live-mode-view"

export const metadata: Metadata = {
  title: "KLEIO — Applications",
  description: "Track drafts, submitted applications, missing materials, and deadlines.",
}

export default function Page() {
  return (
    <ArtistShell>
      <LiveModeView live={<FocusedArtistApplications />} preview={<ArtistApplicationsPageView />} />
    </ArtistShell>
  )
}
