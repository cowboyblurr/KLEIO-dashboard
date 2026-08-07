"use client"

import { ShieldCheck } from "lucide-react"
import { ArtistImportStudio } from "@/components/kleio/artist-import-studio"

export function ApplicationMediaImportBar() {
  return (
    <section className="rounded-2xl border border-[#E7E1F7] bg-white px-4 py-3 sm:px-5" aria-label="Application artwork actions">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#292631]">Need another artwork for this application?</p>
          <p className="mt-1 text-xs leading-5 text-[#746E80]">Add it here without leaving the application. Requirement files are attached directly to their named requirement below so KLEIO never makes you upload the same file twice.</p>
        </div>
        <div className="shrink-0">
          <ArtistImportStudio compact onPortfolioChanged={() => window.location.reload()} />
        </div>
        <p className="basis-full text-[0.68rem] leading-5 text-[#8A8296] sm:hidden"><ShieldCheck className="mr-1.5 inline size-3.5" />New artwork stays private until you include it in the application.</p>
      </div>
    </section>
  )
}
