"use client"

import Link from "next/link"
import { FileCheck2, Images, ShieldCheck, Sparkles } from "lucide-react"
import { ArtistImportStudio } from "@/components/kleio/artist-import-studio"
import { QuickMediaImport } from "@/components/kleio/media-import/quick-media-import"
import { attachMediaToCreativePassportCv } from "@/lib/kleio-universal-media"
import { requestMediaExtraction } from "@/lib/kleio-upload-to-passport"

export function CreativePassportMediaPanel() {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-[#E2DCF1] bg-[linear-gradient(135deg,#F8F5FF,#FFFFFF)] p-5 shadow-[0_18px_52px_rgba(82,64,130,0.06)]" aria-labelledby="passport-media-title">
      <div aria-hidden="true" className="absolute -right-20 -top-24 size-60 rounded-full bg-[#E9E1FA]/70 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Reusable media intelligence</p>
          <h2 id="passport-media-title" className="mt-2 font-serif text-2xl font-semibold tracking-[-0.03em]">Bring in what you already have</h2>
          <p className="mt-2 text-sm leading-6 text-[#746E80]">Import artwork visually or choose a CV already on your device, Drive, or private KLEIO Library. KLEIO preserves the original, extracts possible Passport updates, and waits for your approval.</p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-[#6A5896]"><span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5" />Private until you approve</span><span className="inline-flex items-center gap-1.5"><Sparkles className="size-3.5" />Suggestions keep their evidence</span></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ArtistImportStudio compact />
          <QuickMediaImport
            context="creative_passport"
            label="Choose CV"
            config={{
              title: "Choose a CV",
              description: "Upload a PDF or reuse one from your private KLEIO Library. KLEIO will attach the selected version and prepare extracted updates for your review.",
              completionAction: "Attach and analyze CV",
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
              await requestMediaExtraction(item, "artist_cv")
              window.dispatchEvent(new CustomEvent("kleio:passport-media-changed"))
            }}
          />
          <Link href="/artist-dashboard/passport/review/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"><FileCheck2 className="size-4" />Review Passport updates</Link>
        </div>
      </div>
      <div className="relative mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#E7E1F7] bg-white/80 p-4"><Images className="size-4 text-[#5B4B8A]" /><p className="mt-2 text-sm font-semibold">Artwork records</p><p className="mt-1 text-xs leading-5 text-[#746E80]">See images first, correct prepared details, then approve works for reuse and future matching.</p></div>
        <div className="rounded-2xl border border-[#E7E1F7] bg-white/80 p-4"><FileCheck2 className="size-4 text-[#5B4B8A]" /><p className="mt-2 text-sm font-semibold">Document intelligence</p><p className="mt-1 text-xs leading-5 text-[#746E80]">A CV becomes a private, versioned source with reviewable exhibitions, education, awards, and other grounded records.</p></div>
      </div>
    </section>
  )
}
