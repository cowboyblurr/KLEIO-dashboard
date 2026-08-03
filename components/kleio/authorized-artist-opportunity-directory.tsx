"use client"

import { useEffect } from "react"
import { OpportunityFilterVisibilityGuard } from "@/components/kleio/opportunity-filter-visibility-guard"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"

export function AuthorizedArtistOpportunityDirectory() {
  useEffect(() => {
    void trackKleioProductEvent("opportunity_directory_viewed", {
      surface: "artist_opportunity_directory",
      deduplicationKey: "opportunity_directory_viewed:session",
    })
  }, [])

  return <OpportunityFilterVisibilityGuard />
}
