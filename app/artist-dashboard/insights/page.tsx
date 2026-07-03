import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistInsightsPageView } from "@/components/kleio/artist-workspace/artist-insights-page-view"

export const metadata: Metadata = {
  title: "KLEIO — Quiet Insights",
  description: "Review practical signals about materials, opportunities, deadlines, and application readiness.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ArtistInsightsPageView />
    </ArtistShell>
  )
}
