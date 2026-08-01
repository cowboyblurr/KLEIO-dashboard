import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistPortfolioPageView } from "@/components/kleio/artist-workspace/artist-portfolio-page-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { VisualArtistPortfolioStudio } from "@/components/kleio/visual-artist-portfolio-studio"

export const metadata: Metadata = {
  title: "KLEIO — Portfolio",
  description: "Build a visual, reusable artist portfolio from private media without beginning with a long form.",
}

export default function Page() {
  return (
    <ArtistShell>
      <LiveModeView live={<VisualArtistPortfolioStudio />} preview={<ArtistPortfolioPageView />} />
    </ArtistShell>
  )
}
