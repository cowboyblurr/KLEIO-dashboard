import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ConnectedArtistCallsView } from "@/components/kleio/connected-artist-calls-view"

export const metadata: Metadata = {
  title: "KLEIO — Open Calls",
  description: "Discover published calls and prepare connected KLEIO applications.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ConnectedArtistCallsView />
    </ArtistShell>
  )
}
