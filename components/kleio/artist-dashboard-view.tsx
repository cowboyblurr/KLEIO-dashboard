"use client"

import { DEMO_ARTIST_ID, getArtistById } from "@/lib/kleio-data"
import { ArtistPassportHero, ArtistPassportSections } from "@/components/kleio/artist-passport-body"
import { ArtistInsightsPanel } from "@/components/kleio/artist-insights-panel"
import { useDemoSignOut } from "@/components/kleio/auth-gate"
import { LogOut } from "lucide-react"

export function ArtistDashboardView() {
  const signOut = useDemoSignOut()
  const artist = getArtistById(DEMO_ARTIST_ID)

  if (!artist) {
    return (
      <main className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Demo artist profile not found.</p>
      </main>
    )
  }

  return (
    <main className="h-full overflow-y-auto bg-background">
      <div className="border-b border-border bg-card/80 px-5 py-4 xl:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-xl font-semibold text-foreground">Creative Passport</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your reusable artist profile for applications, portfolios, and opportunities.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
              Demo environment · Synthetic data
            </span>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-5 py-6 xl:px-8 xl:py-7">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
          <div className="min-w-0 space-y-6">
            <ArtistPassportHero artist={artist} mode="artist" />
            <ArtistPassportSections artist={artist} mode="artist" />
          </div>
          <div className="lg:sticky lg:top-6">
            <ArtistInsightsPanel artist={artist} />
          </div>
        </div>
      </div>
    </main>
  )
}
