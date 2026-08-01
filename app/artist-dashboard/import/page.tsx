import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistImportStudioPage } from "@/components/kleio/artist-import-studio-page"

export const metadata: Metadata = {
  title: "KLEIO — Import Studio",
  description: "Privately import artwork files, review prepared records, and approve works for the Creative Passport.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ArtistImportStudioPage />
    </ArtistShell>
  )
}
