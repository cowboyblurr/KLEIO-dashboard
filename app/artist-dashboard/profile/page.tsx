import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { LiveArtistProfilePreview } from "@/components/kleio/live-artist-profile-preview"

export const metadata: Metadata = {
  title: "KLEIO — Artist Profile Preview",
  description: "Preview the artist-facing presentation generated from the authenticated artist's saved Creative Passport and portfolio.",
}

export default function Page() {
  return (
    <ArtistShell>
      <LiveArtistProfilePreview />
    </ArtistShell>
  )
}
