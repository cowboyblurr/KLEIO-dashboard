"use client"

import { FileCheck2, Images, ShieldCheck, Sparkles } from "lucide-react"
import { ArtistImportStudio } from "@/components/kleio/artist-import-studio"
import { QuickMediaImport } from "@/components/kleio/media-import/quick-media-import"
import { attachMediaToCreativePassportCv } from "@/lib/kleio-universal-media"

export function CreativePassportMediaPanel() {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-[#E2DCF1] bg-[linear-gradient(135deg,#F8F5FF,#FFFFFF)] p-5 shadow-[0_18px_52px_rgba(82,64,130,0.06)]" aria-labelledby="passport-media-title">
      <div aria-hidden="true" className="absolute -right-20 -top-24 size-60 rounded-full bg-[#E9E1FA]/70 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Reusable media</p>
          <h2 id="passport-media-title" className="mt-2 font-serif text-2xl font-semibold tracking-[-0.03em]">Bring in what you already have</h2>
          <p className="mt-2 text-sm leading-6 text-[#746E80]">Import artwork visually, reuse private KLEIO media, or attach a CV without downloading and uploading the same file again.</p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-[#6A5896]"><span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5" />Private until you approve</span><span className="inline-flex items-center gap-1.5"><Sparkles className="size-3.5" />Suggestions remain editable</span></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ArtistImportStudio compact />
          <QuickMediaImport
            context="creative_passport"
            label="Choose CV"
            config={{
              title: "Choose a CV",
              description: "Upload a PDF or reuse one from your private KLEIO Library. The Passport changes only after confirmation.",
              completionAction: "Attach CV to Passport",
              allowedMimeTypes: ["application/pdf"],
              maxFileSizeBytes: 20 * 1024 * 1024,
              maxSelectionCount: 1,
              allowMultiple: false,
              usageRole: "cv",
            }}
            onConfirm={async ({ items }) => {
              const item = items[0]
              if (!item) return
              await attachMediaToCreativePassportCv(item)
              window.dispatchEvent(new CustomEvent("kleio:passport-media-changed"))
            }}
          />
        </div>
      </div>
      <div className="relative mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#E7E1F7] bg-white/80 p-4"><Images className="size-4 text-[#5B4B8A]" /><p className="mt-2 text-sm font-semibold">Artwork records</p><p className="mt-1 text-xs leading-5 text-[#746E80]">See images first, correct prepared details, then approve works for reuse.</p></div>
        <div className="rounded-2xl border border-[#E7E1F7] bg-white/80 p-4"><FileCheck2 className="size-4 text-[#5B4B8A]" /><p className="mt-2 text-sm font-semibold">Documents</p><p className="mt-1 text-xs leading-5 text-[#746E80]">Reuse one private PDF across the Passport and future application checks.</p></div>
      </div>
    </section>
  )
}
