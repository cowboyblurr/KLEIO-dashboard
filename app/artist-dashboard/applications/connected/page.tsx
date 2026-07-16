import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ConnectedArtistApplicationsView } from "@/components/kleio/connected-artist-applications-view"

export const metadata: Metadata = {
  title: "KLEIO — Connected Applications",
  description: "Track application status and institution messages linked to each open call.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ConnectedArtistApplicationsView />
    </ArtistShell>
  )
}
