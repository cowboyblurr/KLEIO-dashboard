import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ConnectedPortfolioManagerView } from "@/components/kleio/connected-portfolio-manager-view"

export const metadata: Metadata = {
  title: "KLEIO — Connected Portfolio",
  description: "Add, edit, and remove portfolio works used in connected KLEIO applications.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ConnectedPortfolioManagerView />
    </ArtistShell>
  )
}
