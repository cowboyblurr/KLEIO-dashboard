import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistDashboardView } from "@/components/kleio/artist-dashboard-view"

export default function Page() {
  return (
    <ArtistShell>
      <ArtistDashboardView />
    </ArtistShell>
  )
}
