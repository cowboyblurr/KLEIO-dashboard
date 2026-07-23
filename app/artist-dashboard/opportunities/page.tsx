import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistOpportunitiesPageView } from "@/components/kleio/artist-workspace/artist-opportunities-page-view"
import { AuthorizedArtistOpportunityDirectory } from "@/components/kleio/authorized-artist-opportunity-directory"
import { LiveModeView } from "@/components/kleio/live-mode-view"

export const metadata: Metadata = {
  title: "KLEIO — Opportunities",
  description: "Discover sourced artist opportunities with authentic provider images or clearly labeled KLEIO category covers.",
}

export default function Page() {
  return (
    <ArtistShell>
      <LiveModeView live={<AuthorizedArtistOpportunityDirectory />} preview={<ArtistOpportunitiesPageView />} />
    </ArtistShell>
  )
}
