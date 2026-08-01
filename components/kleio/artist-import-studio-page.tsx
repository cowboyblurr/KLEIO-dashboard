"use client"

import Link from "next/link"
import { ArrowRight, Images, ShieldCheck } from "lucide-react"
import { ArtistImportStudio } from "@/components/kleio/artist-import-studio"
import { WebsiteImportAssist } from "@/components/kleio/website-import-assist"

export function ArtistImportStudioPage() {
  return (
    <main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <header className="rounded-[28px] border border-[#E2DCF1] bg-white p-6 shadow-[0_22px_70px_rgba(82,64,130,0.07)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Creative Passport setup</p>
              <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#292631] sm:text-4xl">Bring your existing work into KLEIO</h1>
              <p className="mt-3 text-sm leading-7 text-[#746E80]">Start from your public artist website, device, or Google Drive. KLEIO separates exact source evidence, visual interpretations, and writing suggestions, then waits for your review before adding anything to the private Creative Passport.</p>
            </div>
            <div className="grid gap-2 text-xs font-semibold text-[#625C70]">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-[#6A5896]" />Nothing publishes automatically</span>
              <span className="inline-flex items-center gap-2"><Images className="size-4 text-[#6A5896]" />Every field and artwork stays editable</span>
            </div>
          </div>
        </header>

        <WebsiteImportAssist />
        <ArtistImportStudio />

        <section className="rounded-2xl border border-[#E7E1F7] bg-white p-5 text-sm leading-6 text-[#746E80]">
          <p><strong className="text-[#292631]">Prefer to continue manually?</strong> You can build your Creative Passport field by field or add works directly from the Portfolio page.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/artist-dashboard/passport/" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A]">Creative Passport <ArrowRight className="size-4" /></Link>
            <Link href="/artist-dashboard/portfolio/" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A]">Portfolio <ArrowRight className="size-4" /></Link>
            <Link href="/artist-dashboard/" className="inline-flex min-h-10 items-center px-3 text-sm font-semibold text-[#746E80]">Skip for now</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
