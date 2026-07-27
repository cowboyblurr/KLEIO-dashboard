import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistPassportPageView } from "@/components/kleio/artist-workspace/artist-passport-page-view"
import { ArtistProfileContextBar } from "@/components/kleio/artist-profile-context-bar"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveArtistPassportBeta } from "@/components/kleio/live-artist-passport-beta"

export const metadata: Metadata = {
  title: "KLEIO — Creative Passport",
  description: "Manage an autosaved, reusable artist source record with structured disciplines, mediums, documents, and profile presentation.",
}

export default function Page() {
  return (
    <ArtistShell>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="shrink-0 px-4 pt-4 sm:px-6">
          <ArtistProfileContextBar active="passport" showKleioAssistStatus />
        </div>
        <div className="min-h-0 flex-1">
          <LiveModeView live={<LiveArtistPassportBeta />} preview={<ArtistPassportPageView />} />
        </div>
      </div>
    </ArtistShell>
  )
}
