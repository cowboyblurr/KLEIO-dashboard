import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistOverviewRedirect } from "@/components/kleio/artist-overview-redirect"

export const metadata: Metadata = {
  title: "KLEIO — Artist Matches coming soon",
  description: "Artist Matches is not yet an active artist workspace feature.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ArtistOverviewRedirect message="Artist Matches is coming soon. Returning to your workspace…" />
    </ArtistShell>
  )
}
