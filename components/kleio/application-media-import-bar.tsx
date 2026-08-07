"use client"

import { useEffect, useState } from "react"
import { ShieldCheck } from "lucide-react"
import { ArtistImportStudio } from "@/components/kleio/artist-import-studio"
import { loadPortfolioWorks } from "@/lib/kleio-live-data"

export function ApplicationMediaImportBar() {
  const [portfolioCount, setPortfolioCount] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    void loadPortfolioWorks()
      .then((works) => { if (active) setPortfolioCount(works.length) })
      .catch(() => { if (active) setPortfolioCount(null) })
    return () => { active = false }
  }, [])

  const hasPortfolio = Boolean(portfolioCount && portfolioCount > 0)

  return (
    <section className="rounded-2xl border border-[#E7E1F7] bg-white px-4 py-3 sm:px-5" aria-label="Application artwork actions">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#292631]">{hasPortfolio ? `${portfolioCount} portfolio work${portfolioCount === 1 ? "" : "s"} ready to choose from` : "Add your first artwork without leaving this application"}</p>
          <p className="mt-1 text-xs leading-5 text-[#746E80]">{hasPortfolio ? "Only add another work if this opportunity needs something that is not already in your portfolio." : "KLEIO will return you to this application after the artwork is added. Requirement files are handled separately by their exact requirement."}</p>
        </div>
        <div className="shrink-0">
          <ArtistImportStudio compact onPortfolioChanged={() => window.location.reload()} />
        </div>
        {!hasPortfolio && <p className="basis-full text-[0.68rem] leading-5 text-[#8A8296] sm:hidden"><ShieldCheck className="mr-1.5 inline size-3.5" />New artwork stays private until you include it in the application.</p>}
      </div>
    </section>
  )
}
