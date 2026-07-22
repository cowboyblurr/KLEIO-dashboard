import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistProfilePageView } from "@/components/kleio/artist-profile-page-view"

export const metadata: Metadata = {
  title: "KLEIO — Artist Profile Preview",
  description: "Preview the artist-facing presentation generated from the signed-in artist's saved Creative Passport and portfolio.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ArtistProfilePageView />
    </ArtistShell>
  )
}
