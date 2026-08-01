import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistOverviewRedirect } from "@/components/kleio/artist-overview-redirect"

export const metadata: Metadata = {
  title: "KLEIO — Readiness & Next Steps",
  description: "Readiness guidance now lives directly on the artist Overview.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ArtistOverviewRedirect message="Readiness & Next Steps now lives on your Overview. Returning to your workspace…" />
    </ArtistShell>
  )
}
