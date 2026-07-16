import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ConnectedArtistOverview } from "@/components/kleio/connected-artist-overview"

export const metadata: Metadata = {
  title: "KLEIO — Connected Artist Workspace",
  description: "A role-scoped artist workspace connected to the authenticated KLEIO account.",
}

export default function Page() {
  return <ArtistShell><ConnectedArtistOverview /></ArtistShell>
}
