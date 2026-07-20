import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistPortfolioPageView } from "@/components/kleio/artist-workspace/artist-portfolio-page-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveArtistPortfolio } from "@/components/kleio/live-artist-workspace"

export const metadata: Metadata = {
  title: "KLEIO — Portfolio",
  description: "Organize selected works, media, and portfolio materials for future applications.",
}

export default function Page() {
  return (
    <ArtistShell>
      <LiveModeView live={<LiveArtistPortfolio />} preview={<ArtistPortfolioPageView />} />
    </ArtistShell>
  )
}
