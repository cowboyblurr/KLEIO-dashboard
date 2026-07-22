import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistOpportunitiesPageView } from "@/components/kleio/artist-workspace/artist-opportunities-page-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveGlobalArtistOpportunities } from "@/components/kleio/live-opportunity-workspace"

export const metadata: Metadata = {
  title: "KLEIO — Opportunities",
  description: "Discover grants, residencies, exhibitions, and open calls aligned with your Creative Passport.",
}

export default function Page() {
  return (
    <ArtistShell>
      <LiveModeView live={<LiveGlobalArtistOpportunities />} preview={<ArtistOpportunitiesPageView />} />
    </ArtistShell>
  )
}
