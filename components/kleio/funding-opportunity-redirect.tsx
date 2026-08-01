"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

const STORAGE_KEY = "kleio_opportunity_filters_v1"

const fundingFilters = {
  query: "funding",
  type: "all",
  source: "all",
  format: "all",
  discipline: "all",
  geography: "",
  deadlineWindow: "all",
  noFeeOnly: false,
  requirementsOnly: false,
}

export function FundingOpportunityRedirect() {
  const router = useRouter()

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fundingFilters))
    } catch {
      // The Opportunities page still opens when browser storage is unavailable.
    }
    router.replace("/artist-dashboard/opportunities/?view=funding")
  }, [router])

  return (
    <main className="grid h-full place-items-center bg-[#FCFBFE] px-6">
      <p className="flex items-center gap-2 text-sm font-medium text-[#625C70]" role="status" aria-live="polite">
        <Loader2 className="size-4 animate-spin text-[#5B4B8A]" />
        Opening funding opportunities…
      </p>
    </main>
  )
}
