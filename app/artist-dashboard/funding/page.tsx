import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { FundingOpportunityRedirect } from "@/components/kleio/funding-opportunity-redirect"

export const metadata: Metadata = {
  title: "KLEIO — Funding opportunities",
  description: "Open the Opportunities directory with funding-focused discovery applied.",
}

export default function Page() {
  return (
    <ArtistShell>
      <FundingOpportunityRedirect />
    </ArtistShell>
  )
}
