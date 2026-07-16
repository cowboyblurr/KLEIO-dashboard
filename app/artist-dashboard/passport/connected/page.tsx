import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ConnectedArtistPassportView } from "@/components/kleio/connected-artist-passport-view"

export const metadata: Metadata = {
  title: "KLEIO — Connected Creative Passport",
  description: "Edit the reusable artist profile used across connected KLEIO applications.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ConnectedArtistPassportView />
    </ArtistShell>
  )
}
