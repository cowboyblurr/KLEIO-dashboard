"use client"

import { useSearchParams } from "next/navigation"
import { FilePlus2, ImagePlus, ShieldCheck } from "lucide-react"
import { ArtistImportStudio } from "@/components/kleio/artist-import-studio"
import { QuickMediaImport } from "@/components/kleio/media-import/quick-media-import"
import { recordMediaUsage } from "@/lib/kleio-universal-media"

export function ApplicationMediaImportBar() {
  const searchParams = useSearchParams()
  const opportunityId = searchParams.get("opportunity") || "application-draft"

  return (
    <section className="shrink-0 border-b border-[#E7E1F7] bg-[#FCFBFE] px-4 py-3 sm:px-6" aria-label="Application media actions">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3">
        <div className="min-w-0"><p className="text-xs font-semibold text-[#5B4B8A]">Missing something?</p><p className="mt-0.5 text-xs leading-5 text-[#746E80]">Add artwork or a requirement file without leaving this application. Existing portfolio works remain the first choice.</p></div>
        <div className="flex flex-wrap gap-2">
          <ArtistImportStudio compact onPortfolioChanged={() => window.location.reload()} />
          <QuickMediaImport
            context="application_material"
            label="Add requirement file"
            onConfirm={async ({ items }) => {
              await Promise.all(items.map((item) => recordMediaUsage({
                item,
                context: "application_material",
                destinationId: opportunityId,
                role: "application_attachment",
              })))
              window.dispatchEvent(new CustomEvent("kleio:application-media-changed", { detail: { opportunityId } }))
            }}
          />
        </div>
        <p className="basis-full text-[0.68rem] leading-5 text-[#8A8296]"><ShieldCheck className="mr-1.5 inline size-3.5" />Adding a file keeps it in the private application workspace. It is not submitted until the final artist review.</p>
      </div>
    </section>
  )
}
