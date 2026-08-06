import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistPortfolioPageView } from "@/components/kleio/artist-workspace/artist-portfolio-page-view"
import { FocusedVisualArtistPortfolioStudio } from "@/components/kleio/focused-visual-artist-portfolio-studio"
import { LiveModeView } from "@/components/kleio/live-mode-view"

export const metadata: Metadata = {
  title: "KLEIO — Portfolio",
  description: "Build a visual, reusable artist portfolio from private media without beginning with a long form.",
}

export default function Page() {
  return (
    <ArtistShell>
      <LiveModeView live={<FocusedVisualArtistPortfolioStudio />} preview={<ArtistPortfolioPageView />} />
    </ArtistShell>
  )
}
