import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistOpportunitiesPageView } from "@/components/kleio/artist-workspace/artist-opportunities-page-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveGlobalArtistOpportunitiesWithImages } from "@/components/kleio/live-global-artist-opportunities-with-images"

export const metadata: Metadata = {
  title: "KLEIO — Opportunities",
  description: "Discover sourced artist opportunities with authentic provider images or clearly labeled KLEIO category covers.",
}

export default function Page() {
  return (
    <ArtistShell>
      <LiveModeView live={<LiveGlobalArtistOpportunitiesWithImages />} preview={<ArtistOpportunitiesPageView />} />
    </ArtistShell>
  )
}
