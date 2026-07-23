import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistSettingsPageView } from "@/components/kleio/artist-workspace/artist-settings-page-view"
import { LiveArtistIdentitySettings } from "@/components/kleio/live-artist-identity-settings"
import { LiveModeView } from "@/components/kleio/live-mode-view"

export const metadata: Metadata = {
  title: "KLEIO — Artist Settings",
  description: "Manage artist workspace preferences, profile visibility, and the profile photo reused across KLEIO.",
}

export default function Page() {
  return (
    <ArtistShell>
      <LiveModeView live={<LiveArtistIdentitySettings />} preview={<ArtistSettingsPageView />} />
    </ArtistShell>
  )
}
