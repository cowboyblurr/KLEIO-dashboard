import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistMediaLibrary } from "@/components/kleio/artist-media-library"

export const metadata: Metadata = {
  title: "KLEIO — Media Library",
  description: "Privately reuse artist media across the Creative Passport, portfolio, profile, and applications.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ArtistMediaLibrary />
    </ArtistShell>
  )
}
