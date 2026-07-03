"use client"

import { artistDashboardProfile, DEMO_ARTIST_ID, getArtistById } from "@/lib/kleio-data"
import { getArtistProfileByUsername } from "@/lib/kleio-profile-data"
import { ArtistDashboardOverview } from "@/components/kleio/artist-dashboard/artist-dashboard-overview"

export function ArtistDashboardView() {
  const artist = getArtistById(DEMO_ARTIST_ID)
  const assetProfile = getArtistProfileByUsername("amina-el-badri")

  if (!artist) {
    return (
      <main className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Demo artist profile not found.</p>
      </main>
    )
  }

  return (
    <main className="h-full overflow-y-auto bg-white text-[#292631]">
      <ArtistDashboardOverview artist={artist} profile={artistDashboardProfile} assetProfile={assetProfile} />
    </main>
  )
}
