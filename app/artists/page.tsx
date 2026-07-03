import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ArtistsDirectory } from "@/components/kleio/artists-directory"

export default function Page() {
  return (
    <DashboardShell>
      <ArtistsDirectory />
    </DashboardShell>
  )
}
