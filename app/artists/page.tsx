import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ArtistsDirectory } from "@/components/kleio/artists-directory"
import { LiveArtistDiscovery } from "@/components/kleio/live-artist-discovery"
import { LiveModeView } from "@/components/kleio/live-mode-view"

export default function Page() {
  return (
    <DashboardShell>
      <LiveModeView live={<LiveArtistDiscovery />} preview={<ArtistsDirectory />} />
    </DashboardShell>
  )
}
