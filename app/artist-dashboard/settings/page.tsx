import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistSettingsPageView } from "@/components/kleio/artist-workspace/artist-settings-page-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { ProfileMediaQuickImport } from "@/components/kleio/profile-media-quick-import"
import { LiveArtistDiscoverySettings } from "@/components/kleio/live-artist-discovery-settings"

export const metadata: Metadata = {
  title: "KLEIO — Artist Settings",
  description: "Manage reusable artist media, profile presentation, and artist-controlled discovery settings.",
}

function LiveSettings() {
  return (
    <main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[980px] space-y-5">
        <WorkspacePageHeader eyebrow="Artist workspace" title="Settings" description="Manage your reusable profile image and decide whether authenticated institutions may discover an artist-approved presentation." />
        <ProfileMediaQuickImport />
        <LiveArtistDiscoverySettings />
      </div>
    </main>
  )
}

export default function Page() {
  return (
    <ArtistShell>
      <LiveModeView live={<LiveSettings />} preview={<ArtistSettingsPageView />} />
    </ArtistShell>
  )
}
