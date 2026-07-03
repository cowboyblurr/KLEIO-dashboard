import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistPortfolioPageView } from "@/components/kleio/artist-workspace/artist-portfolio-page-view"

export const metadata: Metadata = {
  title: "KLEIO — Portfolio",
  description: "Organize selected works, media, and portfolio materials for future applications.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ArtistPortfolioPageView />
    </ArtistShell>
  )
}
