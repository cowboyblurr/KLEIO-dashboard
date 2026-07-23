import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistPassportPageView } from "@/components/kleio/artist-workspace/artist-passport-page-view"
import { ArtistProfileContextBar } from "@/components/kleio/artist-profile-context-bar"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveCreativePassport } from "@/components/kleio/live-creative-passport"

export const metadata: Metadata = {
  title: "KLEIO — Creative Passport",
  description: "Manage the reusable source record for your artist profile, portfolio, and application materials.",
}

export default function Page() {
  return (
    <ArtistShell>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="shrink-0 px-4 pt-4 sm:px-6">
          <ArtistProfileContextBar active="passport" showKleioAssistStatus />
        </div>
        <div className="min-h-0 flex-1">
          <LiveModeView live={<LiveCreativePassport />} preview={<ArtistPassportPageView />} />
        </div>
      </div>
    </ArtistShell>
  )
}
