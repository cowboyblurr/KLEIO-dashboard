"use client"

import { useEffect, useState } from "react"
import { Cloud, Images, ShieldCheck } from "lucide-react"
import { loadBetaImportAvailability, type KleioBetaImportAvailability } from "@/lib/kleio-import-source-availability"

const primaryCard = "flex min-h-52 flex-col rounded-[24px] border border-[#D8D0F2] bg-white p-5 text-left shadow-[0_18px_48px_rgba(82,64,130,0.07)]"

export function ImportSourceHub() {
  const [availability, setAvailability] = useState<KleioBetaImportAvailability | null>(null)
  useEffect(() => { void loadBetaImportAvailability().then(setAvailability).catch(() => setAvailability(null)) }, [])

  const driveConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID && process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY)
  const driveAvailable = availability?.google_drive_image === true && driveConfigured

  return (
    <section className="rounded-[28px] border border-[#E2DCF1] bg-[linear-gradient(145deg,#F8F5FF,#FFFFFF)] p-5 shadow-[0_22px_70px_rgba(82,64,130,0.07)] sm:p-7" aria-labelledby="import-source-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Artist beta import</p>
          <h2 id="import-source-title" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#292631]">Google Drive is the active import source</h2>
          <p className="mt-3 text-sm leading-7 text-[#746E80]">Choose only the files you want KLEIO to copy into your private Media Library. Nothing becomes public or enters a Portfolio, Creative Passport, profile, or application automatically.</p>
        </div>
        <div className="grid gap-2 text-xs font-semibold text-[#625C70]">
          <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-[#6A5896]" />Authenticated artist ownership required</span>
          <span className="inline-flex items-center gap-2"><Images className="size-4 text-[#6A5896]" />Private Media Library first</span>
        </div>
      </div>

      <div className="mt-6 max-w-xl">
        <div className={primaryCard} aria-label="Google Drive import availability">
          <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><Cloud className="size-5" /></span><span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${driveAvailable ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{driveAvailable ? "Active for beta" : "Configuration required"}</span></div>
          <h3 className="mt-5 font-serif text-xl font-semibold">Choose from Google Drive</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-[#746E80]">The Google Picker exposes only files the artist deliberately selects. KLEIO accepts validated JPEG, PNG, and WebP artwork files in the current beta flow.</p>
          <p className="mt-4 text-xs font-semibold text-[#5B4B8A]">Open the Google Drive Import Studio below.</p>
        </div>
      </div>

      <section className="mt-6 rounded-[22px] border border-[#E7E1F7] bg-white/70 p-4 sm:p-5" aria-labelledby="coming-soon-sources">
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-[#81788E]">Future connected sources</p>
        <h3 id="coming-soon-sources" className="mt-1 font-serif text-xl font-semibold text-[#625C70]">More connected sources are coming</h3>
        <p className="mt-2 text-sm leading-6 text-[#81788E]">Soon, artists will be able to review selected work from additional connected platforms before bringing it into KLEIO.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-label="Coming soon sources">
          <div className="rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] px-4 py-3 text-sm text-[#746E80]"><strong className="text-[#625C70]">Instagram</strong><span className="ml-2 text-xs font-semibold uppercase tracking-wide">Coming soon</span></div>
          <div className="rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] px-4 py-3 text-sm text-[#746E80]"><strong className="text-[#625C70]">Pinterest</strong><span className="ml-2 text-xs font-semibold uppercase tracking-wide">Coming soon</span></div>
        </div>
      </section>
    </section>
  )
}
