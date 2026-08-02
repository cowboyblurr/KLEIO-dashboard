"use client"

import { ArrowDown, Cloud, Globe2, Images, ShieldCheck, Upload } from "lucide-react"

const sourceCard = "group flex min-h-52 flex-col rounded-[22px] border border-[#E2DCF1] bg-white p-5 text-left shadow-[0_14px_38px_rgba(82,64,130,0.05)] transition hover:-translate-y-0.5 hover:border-[#B9A9DE] hover:shadow-[0_20px_48px_rgba(82,64,130,0.09)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"
const ready = "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-semibold text-emerald-800"
const gated = "rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[0.65rem] font-semibold text-amber-800"

export function ImportSourceHub() {
  const driveConfigured = Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID
    && process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY,
  )

  return (
    <section className="rounded-[28px] border border-[#E2DCF1] bg-[linear-gradient(145deg,#F8F5FF,#FFFFFF)] p-5 shadow-[0_22px_70px_rgba(82,64,130,0.07)] sm:p-7" aria-labelledby="import-source-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Choose an import source</p>
          <h2 id="import-source-title" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#292631]">Start with the source that already holds your work</h2>
          <p className="mt-3 text-sm leading-7 text-[#746E80]">Each path prepares private, editable material for review. Saving an import draft is not approval, and nothing is published automatically.</p>
        </div>
        <div className="grid gap-2 text-xs font-semibold text-[#625C70]">
          <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-[#6A5896]" />Artist review remains required</span>
          <span className="inline-flex items-center gap-2"><Images className="size-4 text-[#6A5896]" />Original files stay distinct from previews</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <a className={sourceCard} href="#device-drive-import" aria-label="Go to device artwork upload">
          <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><Upload className="size-5" /></span><span className={ready}>Ready now</span></div>
          <h3 className="mt-5 font-serif text-xl font-semibold">Upload from device</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-[#746E80]">Choose original artwork from a computer, phone, tablet, iCloud Drive, or a compatible Android file provider.</p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#5B4B8A]">Open file import <ArrowDown className="size-4 transition group-hover:translate-y-0.5" /></span>
        </a>

        <a className={sourceCard} href="#device-drive-import" aria-label="Go to Google Drive artwork selection">
          <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><Cloud className="size-5" /></span><span className={driveConfigured ? ready : gated}>{driveConfigured ? "Ready now" : "Configuration required"}</span></div>
          <h3 className="mt-5 font-serif text-xl font-semibold">Choose from Google Drive</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-[#746E80]">Use Google Picker to select specific files. Drive permission remains separate from Google sign-in and does not expose the rest of the account.</p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#5B4B8A]">Open Drive import <ArrowDown className="size-4 transition group-hover:translate-y-0.5" /></span>
        </a>

        <a className={sourceCard} href="#website-import" aria-label="Go to personal portfolio website analysis">
          <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><Globe2 className="size-5" /></span><span className={ready}>Ready now</span></div>
          <h3 className="mt-5 font-serif text-xl font-semibold">Import from website</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-[#746E80]">Review public pages from an artist-owned portfolio site, select likely works, and correct every field before anything is saved.</p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#5B4B8A]">Analyze a website <ArrowDown className="size-4 transition group-hover:translate-y-0.5" /></span>
        </a>

        <a className={sourceCard} href="#pinterest-import" aria-label="Review Pinterest connection requirements">
          <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><Images className="size-5" /></span><span className={gated}>App approval required</span></div>
          <h3 className="mt-5 font-serif text-xl font-semibold">Connect Pinterest</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-[#746E80]">Pinterest will use official read-only OAuth so artists can choose specific boards and Pins. KLEIO will not scrape Pinterest pages.</p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#5B4B8A]">Review setup status <ArrowDown className="size-4 transition group-hover:translate-y-0.5" /></span>
        </a>
      </div>

      <p className="mt-5 rounded-xl border border-[#E7E1F7] bg-white/80 px-4 py-3 text-xs leading-5 text-[#746E80]">Instagram remains available below as an additional read-only connected source. Behance and ArtStation remain external portfolio links only and are not analyzed, copied, synchronized, embedded, or used for AI analysis.</p>
    </section>
  )
}
