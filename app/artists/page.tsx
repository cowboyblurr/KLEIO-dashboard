import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ArtistsDirectory } from "@/components/kleio/artists-directory"
import { LiveInstitutionArtists } from "@/components/kleio/live-institution-artists"
import { LiveModeView } from "@/components/kleio/live-mode-view"

export default function Page() {
  return (
    <DashboardShell>
      <LiveModeView live={<LiveInstitutionArtists />} preview={<ArtistsDirectory />} />
    </DashboardShell>
  )
}
