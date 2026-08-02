"use client"

import Link from "next/link"
import { ArrowLeft, Images, ShieldCheck } from "lucide-react"
import { ArtistImportStudio } from "@/components/kleio/artist-import-studio"
import { ImportSourceHub } from "@/components/kleio/import-source-hub"
import { InstagramImportAssist } from "@/components/kleio/instagram-import-assist"
import { PinterestImportAssist } from "@/components/kleio/pinterest-import-assist"
import { WebsiteImportAssist } from "@/components/kleio/website-import-assist"
import { WebsiteOrganizationAssist } from "@/components/kleio/website-organization-assist"

export function ArtistImportStudioPage() {
  return (
    <main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <Link href="/artist-dashboard/media/" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[#5B4B8A] transition hover:bg-[#F3EFFB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20">
          <ArrowLeft className="size-4" />Media Library
        </Link>

        <header className="rounded-[28px] border border-[#E2DCF1] bg-white p-6 shadow-[0_22px_70px_rgba(82,64,130,0.07)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Media Library · Import work</p>
              <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#292631] sm:text-4xl">Bring your existing work into KLEIO</h1>
              <p className="mt-3 text-sm leading-7 text-[#746E80]">Choose a source once. KLEIO creates private Media Library records, helps organize the available details, and lets you decide which works appear in your Portfolio or contribute confirmed information to your Creative Passport.</p>
            </div>
            <div className="grid gap-2 text-xs font-semibold text-[#625C70]">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-[#6A5896]" />Nothing publishes automatically</span>
              <span className="inline-flex items-center gap-2"><Images className="size-4 text-[#6A5896]" />Import once and reuse the same records</span>
            </div>
          </div>
        </header>

        <ImportSourceHub />

        <section id="device-drive-import" className="scroll-mt-6" aria-label="Device and Google Drive import">
          <ArtistImportStudio />
        </section>

        <section id="website-import" className="scroll-mt-6 space-y-5" aria-label="Personal portfolio website import">
          <WebsiteImportAssist />
          <WebsiteOrganizationAssist />
        </section>

        <PinterestImportAssist />

        <section id="instagram-import" className="scroll-mt-6" aria-label="Instagram import">
          <InstagramImportAssist />
        </section>
      </div>
    </main>
  )
}
