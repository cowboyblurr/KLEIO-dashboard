import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistCalendarPageView } from "@/components/kleio/artist-workspace/artist-calendar-page-view"

export const metadata: Metadata = {
  title: "KLEIO — Calendar",
  description: "View upcoming deadlines, application milestones, and decision windows.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ArtistCalendarPageView />
    </ArtistShell>
  )
}
