"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Images, ShieldCheck } from "lucide-react"
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
          <p className="text-sm font-semibold text-[#292631]">{hasPortfolio ? `${portfolioCount} portfolio work${portfolioCount === 1 ? "" : "s"} ready to choose from` : "Add your first artwork before choosing application works"}</p>
          <p className="mt-1 text-xs leading-5 text-[#746E80]">{hasPortfolio ? "Reuse approved Portfolio works here. Only add something new when this opportunity genuinely needs it." : "Your application is saved while you add a work to Portfolio. Return here afterward and choose the exact work for this opportunity."}</p>
        </div>
        {!hasPortfolio && <Link href="/artist-dashboard/portfolio/" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3 py-2 text-xs font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"><Images className="size-4" />Add artwork in Portfolio</Link>}
        {!hasPortfolio && <p className="basis-full text-[0.68rem] leading-5 text-[#8A8296] sm:hidden"><ShieldCheck className="mr-1.5 inline size-3.5" />New artwork stays private until you explicitly include it in an application.</p>}
      </div>
    </section>
  )
}
