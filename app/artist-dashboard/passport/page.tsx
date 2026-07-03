import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistPassportPageView } from "@/components/kleio/artist-workspace/artist-passport-page-view"

export const metadata: Metadata = {
  title: "KLEIO — Creative Passport",
  description: "Manage your reusable artist profile for grants, residencies, exhibitions, and open calls.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ArtistPassportPageView />
    </ArtistShell>
  )
}
