"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, TriangleAlert } from "lucide-react"
import { artistDashboardProfile, DEMO_ARTIST_ID, getArtistById } from "@/lib/kleio-data"
import { getArtistAnalytics } from "@/lib/kleio-artist-analytics"
import { loadLiveArtistWorkspace, type LiveArtistWorkspace } from "@/lib/kleio-live-artist"
import { getArtistProfileByUsername } from "@/lib/kleio-profile-data"
import { ArtistDashboardOverview } from "@/components/kleio/artist-dashboard/artist-dashboard-overview"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"

function LiveArtistDashboard() {
  const [workspace, setWorkspace] = useState<LiveArtistWorkspace | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    loadLiveArtistWorkspace()
      .then((result) => {
        if (active) setWorkspace(result)
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "KLEIO could not load your artist workspace.")
      })
    return () => {
      active = false
    }
  }, [])

  if (error) {
    return (
      <main className="flex h-full items-center justify-center bg-white px-6">
        <section className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <TriangleAlert className="mx-auto size-6 text-primary" />
          <h1 className="mt-4 font-serif text-xl font-semibold">Your artist profile needs attention</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{error}</p>
          <Link href="/signup/artist/" className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Complete Creative Passport
          </Link>
        </section>
      </main>
    )
  }

  if (!workspace) {
    return (
      <main className="flex h-full items-center justify-center bg-white">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading your Creative Passport…
        </div>
      </main>
    )
  }

  return (
    <main className="kleio-artist-dashboard-main h-full overflow-y-auto bg-white text-[#292631]">
      <ArtistDashboardOverview artist={workspace.artist} profile={workspace.profile} analytics={workspace.analytics} />
    </main>
  )
}

export function ArtistDashboardView() {
  const { isLive } = useKleioMode()

  if (isLive) return <LiveArtistDashboard />

  const artist = getArtistById(DEMO_ARTIST_ID)
  const assetProfile = getArtistProfileByUsername("amina-el-badri")
  const analytics = getArtistAnalytics({
    artistId: DEMO_ARTIST_ID,
    username: "amina-el-badri",
  })

  if (!artist) {
    return (
      <main className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Demo artist profile not found.</p>
      </main>
    )
  }

  return (
    <main className="kleio-artist-dashboard-main h-full overflow-y-auto bg-white text-[#292631]">
      <ArtistDashboardOverview
        artist={artist}
        profile={artistDashboardProfile}
        assetProfile={assetProfile}
        analytics={analytics}
      />
    </main>
  )
}
