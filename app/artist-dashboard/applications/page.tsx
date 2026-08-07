import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { UnifiedArtistApplications } from "@/components/kleio/unified-artist-applications"

export const metadata: Metadata = {
  title: "KLEIO — Applications",
  description: "Track KLEIO-hosted and external applications, preserved versions, next actions, and outcomes in one place.",
}

export default function Page() {
  return (
    <ArtistShell>
      <UnifiedArtistApplications />
    </ArtistShell>
  )
}