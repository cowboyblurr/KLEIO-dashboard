import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistOpportunitiesPageView } from "@/components/kleio/artist-workspace/artist-opportunities-page-view"

export const metadata: Metadata = {
  title: "KLEIO — Opportunities",
  description: "Discover grants, residencies, exhibitions, and open calls aligned with your Creative Passport.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ArtistOpportunitiesPageView />
    </ArtistShell>
  )
}
