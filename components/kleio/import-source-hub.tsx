"use client"

import { useEffect, useState } from "react"
import { Cloud, FileText, Images, Library, ShieldCheck } from "lucide-react"
import { SupportingTaskDisclosure } from "@/components/kleio/supporting-task-disclosure"
import { loadBetaImportAvailability, type KleioBetaImportAvailability } from "@/lib/kleio-import-source-availability"

function availabilityLabel(available: boolean) {
  return available ? "Available" : "Unavailable"
}

function availabilityTone(available: boolean) {
  return available
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-amber-200 bg-amber-50 text-amber-800"
}

export function ImportSourceHub() {
  const [availability, setAvailability] = useState<KleioBetaImportAvailability | null>(null)
  useEffect(() => { void loadBetaImportAvailability().then(setAvailability).catch(() => setAvailability(null)) }, [])

  const directAvailable = availability?.device_document === true && availability?.pdf === true
  const libraryAvailable = availability?.existing_kleio_media === true

  return (
    <section className="rounded-[24px] border border-[#E2DCF1] bg-white p-5 shadow-[0_18px_52px_rgba(82,64,130,0.05)] sm:p-6" aria-labelledby="import-source-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Artist document beta</p>
          <h1 id="import-source-title" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#292631]">Upload a CV or artist document</h1>
          <p className="mt-2 text-sm leading-6 text-[#746E80]">Direct PDF upload is the active import method for this beta. The private upload and review workspace begins immediately below.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#625C70]">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F7F4FF] px-3 py-1.5"><ShieldCheck className="size-3.5 text-[#6A5896]" />Nothing publishes automatically</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F7F4FF] px-3 py-1.5"><FileText className="size-3.5 text-[#6A5896]" />PDF · 15 MB · 100 pages</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl border border-[#E7E1F7] bg-[#FCFBFE] p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F0EAFB] text-[#5B4B8A]"><FileText className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold text-[#292631]">Upload from this device</h2><span className={`rounded-full border px-2.5 py-1 text-[0.64rem] font-semibold ${availabilityTone(directAvailable)}`}>{availabilityLabel(directAvailable)}</span></div>
            <p className="mt-1 text-xs leading-5 text-[#746E80]">Native text is analyzed. Scanned files are labeled as requiring OCR or manual review.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-[#E7E1F7] bg-[#FCFBFE] p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F0EAFB] text-[#5B4B8A]"><Library className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold text-[#292631]">Reuse a stored document</h2><span className={`rounded-full border px-2.5 py-1 text-[0.64rem] font-semibold ${availabilityTone(libraryAvailable)}`}>{availabilityLabel(libraryAvailable)}</span></div>
            <p className="mt-1 text-xs leading-5 text-[#746E80]">Preview, reanalyze, or keep an owner-scoped source without creating a duplicate file.</p>
          </div>
        </div>
      </div>

      <SupportingTaskDisclosure
        icon={Cloud}
        label="Later release"
        title="Deferred connected sources"
        description="These foundations are preserved but disabled so they do not compete with the active PDF workflow."
        className="mt-4 shadow-none"
      >
        <p className="text-sm leading-6 text-[#746E80]">Google Drive, Instagram, Website Import, and Pinterest remain disabled in the interface and database beta gate until reliability, demand, and operational readiness support activation.</p>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Deferred import sources">
          {[{ label: "Google Drive", icon: Cloud }, { label: "Instagram", icon: Images }, { label: "Website Import", icon: Cloud }, { label: "Pinterest", icon: Images }].map((item) => {
            const Icon = item.icon
            return <span key={item.label} className="inline-flex items-center gap-2 rounded-full border border-[#E7E1F7] bg-[#FAF9FD] px-3 py-1.5 text-xs text-[#746E80]"><Icon className="size-3.5" /><strong className="text-[#625C70]">{item.label}</strong><span>· Deferred</span></span>
          })}
        </div>
      </SupportingTaskDisclosure>
    </section>
  )
}
