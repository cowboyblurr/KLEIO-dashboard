import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { EditorialArtistProfileTest } from "@/components/kleio/profile/editorial-artist-profile-test"
import { getArtistProfileByUsername } from "@/lib/kleio-profile-data"

export const metadata: Metadata = {
  title: "KLEIO — Editorial Artist Profile Test",
  description: "An isolated editorial profile prototype using KLEIO synthetic artist data.",
}

export default function Page() {
  const profile = getArtistProfileByUsername("amina-el-badri")

  return (
    <ArtistShell>
      {profile ? (
        <EditorialArtistProfileTest profile={profile} />
      ) : (
        <main className="grid h-full place-items-center bg-white px-6 text-sm text-muted-foreground">
          Synthetic artist profile not found.
        </main>
      )}
    </ArtistShell>
  )
}
