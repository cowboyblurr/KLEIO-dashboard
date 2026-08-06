"use client"

import { useSearchParams } from "next/navigation"
import { Paperclip, ShieldCheck } from "lucide-react"
import { ArtistImportStudio } from "@/components/kleio/artist-import-studio"
import { QuickMediaImport } from "@/components/kleio/media-import/quick-media-import"
import { SupportingTaskDisclosure } from "@/components/kleio/supporting-task-disclosure"
import { recordMediaUsage } from "@/lib/kleio-universal-media"

export function ApplicationMediaImportBar() {
  const searchParams = useSearchParams()
  const opportunityId = searchParams.get("opportunity") || "application-draft"

  return (
    <SupportingTaskDisclosure
      icon={Paperclip}
      label="Supporting action"
      title="Add a missing artwork or requirement file"
      description="Use this only when the current application is missing material; existing Portfolio works remain the first choice."
      className="shadow-none"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-[#746E80]">Add artwork or a private requirement file without leaving the application workspace.</p>
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
      </div>
      <p className="mt-3 text-[0.68rem] leading-5 text-[#8A8296]"><ShieldCheck className="mr-1.5 inline size-3.5" />Added files remain private until the final artist review and explicit submission action.</p>
    </SupportingTaskDisclosure>
  )
}
