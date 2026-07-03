import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistFundingPageView } from "@/components/kleio/artist-workspace/artist-funding-page-view"

export const metadata: Metadata = {
  title: "KLEIO — Funding",
  description: "Understand potential funding, application readiness, and opportunity fit.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ArtistFundingPageView />
    </ArtistShell>
  )
}
