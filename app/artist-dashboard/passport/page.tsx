import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistPassportPageView } from "@/components/kleio/artist-workspace/artist-passport-page-view"
import { ArtistProfileContextBar } from "@/components/kleio/artist-profile-context-bar"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { CreativePassportMediaPanel } from "@/components/kleio/creative-passport-media-panel"
import { CreativePassportWorkspace } from "@/components/kleio/creative-passport-workspace"

export const metadata: Metadata = {
  title: "KLEIO — Creative Passport",
  description: "Build a reusable Creative Passport with field-level document suggestions, direct editing, and artist approval.",
}

export default function Page() {
  return (
    <ArtistShell>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="shrink-0 px-4 pt-3 sm:px-6">
          <ArtistProfileContextBar active="passport" showKleioAssistStatus />
        </div>
        <div className="shrink-0 px-4 pt-2 sm:px-6">
          <LiveModeView live={<CreativePassportMediaPanel />} preview={null} />
        </div>
        <div className="min-h-0 flex-1 pt-2">
          <LiveModeView live={<CreativePassportWorkspace />} preview={<ArtistPassportPageView />} />
        </div>
      </div>
    </ArtistShell>
  )
}
