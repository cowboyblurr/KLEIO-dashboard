import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistImportStudioPage } from "@/components/kleio/artist-import-studio-page"

export const metadata: Metadata = {
  title: "KLEIO — Import work",
  description: "Import artist work into the private Media Library, review prepared records, and approve material for the Creative Passport.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ArtistImportStudioPage />
    </ArtistShell>
  )
}
