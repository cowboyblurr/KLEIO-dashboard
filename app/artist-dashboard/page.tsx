import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistDashboardView } from "@/components/kleio/artist-dashboard-view"

/** Artist dashboard overview — private workspace, not the public homepage. */
export const metadata: Metadata = {
  title: "KLEIO — Artist Workspace",
  description:
    "Manage your Creative Passport, application materials, opportunities, and submission progress from one place.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ArtistDashboardView />
    </ArtistShell>
  )
}
