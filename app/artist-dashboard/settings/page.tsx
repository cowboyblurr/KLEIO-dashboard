import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistSettingsPageView } from "@/components/kleio/artist-workspace/artist-settings-page-view"
import { LiveArtistSettings } from "@/components/kleio/live-artist-settings"
import { LiveModeView } from "@/components/kleio/live-mode-view"

export const metadata: Metadata = {
  title: "KLEIO — Artist Settings",
  description: "Manage artist workspace preferences, profile visibility, and Creative Passport defaults.",
}

export default function Page() {
  return (
    <ArtistShell>
      <LiveModeView live={<LiveArtistSettings />} preview={<ArtistSettingsPageView />} />
    </ArtistShell>
  )
}
