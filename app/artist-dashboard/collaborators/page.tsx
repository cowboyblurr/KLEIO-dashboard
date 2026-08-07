import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistOverviewRedirect } from "@/components/kleio/artist-overview-redirect"

export const metadata: Metadata = {
  title: "KLEIO — Artist Workspace",
  description: "Return to your KLEIO artist workspace.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ArtistOverviewRedirect message="Returning to your workspace…" />
    </ArtistShell>
  )
}
