"use client"

import { ArtistProfileContextBar } from "@/components/kleio/artist-profile-context-bar"
import { LiveArtistProfilePreview } from "@/components/kleio/live-artist-profile-preview"
import { ArtistPublicProfile } from "@/components/kleio/profile/artist-public-profile"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"
import { getArtistProfileByUsername } from "@/lib/kleio-profile-data"

export function ArtistProfilePageView() {
  const { isLive } = useKleioMode()

  if (isLive) return <LiveArtistProfilePreview />

  const profile = getArtistProfileByUsername("amina-el-badri")

  if (!profile) {
    return (
      <main className="grid h-full place-items-center bg-white px-6 text-sm text-muted-foreground">
        Demo artist profile not found.
      </main>
    )
  }

  return (
    <main className="h-full overflow-y-auto bg-white px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1200px] space-y-5">
        <ArtistProfileContextBar active="profile" showKleioAssistStatus />
        <div className="rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] px-4 py-3 text-sm leading-relaxed text-[#625C70]">
          <strong className="text-[#292631]">Guided-demo profile.</strong> This presentation uses clearly labeled synthetic artist data. It is separate from connected artist accounts and does not represent a real public user.
        </div>
        <ArtistPublicProfile profile={profile} />
      </div>
    </main>
  )
}
