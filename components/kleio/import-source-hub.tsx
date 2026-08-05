"use client"

import { useEffect, useState } from "react"
import { Cloud, FileText, Images, Library, ShieldCheck } from "lucide-react"
import { loadBetaImportAvailability, type KleioBetaImportAvailability } from "@/lib/kleio-import-source-availability"

const card = "flex min-h-48 flex-col rounded-[24px] border bg-white p-5 text-left shadow-[0_18px_48px_rgba(82,64,130,0.05)]"

export function ImportSourceHub() {
  const [availability, setAvailability] = useState<KleioBetaImportAvailability | null>(null)
  useEffect(() => { void loadBetaImportAvailability().then(setAvailability).catch(() => setAvailability(null)) }, [])

  const directAvailable = availability?.device_document === true && availability?.pdf === true
  const libraryAvailable = availability?.existing_kleio_media === true

  return (
    <section className="rounded-[28px] border border-[#E2DCF1] bg-[linear-gradient(145deg,#F8F5FF,#FFFFFF)] p-5 shadow-[0_22px_70px_rgba(82,64,130,0.07)] sm:p-7" aria-labelledby="import-source-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Artist document beta</p>
          <h2 id="import-source-title" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#292631]">Direct PDF upload is the active import method</h2>
          <p className="mt-3 text-sm leading-7 text-[#746E80]">Upload an existing CV or artist document from your device. KLEIO stores the source privately, checks the PDF on the server, prepares evidence-backed Passport suggestions, and waits for your review.</p>
        </div>
        <div className="grid gap-2 text-xs font-semibold text-[#625C70]">
          <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-[#6A5896]" />Nothing publishes automatically</span>
          <span className="inline-flex items-center gap-2"><FileText className="size-4 text-[#6A5896]" />PDF only during the initial beta</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className={`${card} ${directAvailable ? "border-[#D8D0F2]" : "border-amber-200"}`} aria-label="Direct PDF upload availability">
          <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><FileText className="size-5" /></span><span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${directAvailable ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{directAvailable ? "Active for beta" : "Unavailable"}</span></div>
          <h3 className="mt-5 font-serif text-xl font-semibold">Upload CV or artist document</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-[#746E80]">Drag and drop or choose a PDF from this device. Maximum 15 MB and 100 pages. Native text is analyzed; scanned files are honestly marked OCR required.</p>
          <p className="mt-4 text-xs font-semibold text-[#5B4B8A]">Use the private upload workspace below.</p>
        </div>

        <div className={`${card} ${libraryAvailable ? "border-[#D8D0F2]" : "border-amber-200"}`} aria-label="KLEIO Media Library reanalysis availability">
          <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><Library className="size-5" /></span><span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${libraryAvailable ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{libraryAvailable ? "Available" : "Unavailable"}</span></div>
          <h3 className="mt-5 font-serif text-xl font-semibold">Reuse a private KLEIO document</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-[#746E80]">Existing owner-scoped document sources can be previewed, reclassified, analyzed again, or kept without analysis. KLEIO does not create a duplicate file.</p>
          <p className="mt-4 text-xs font-semibold text-[#5B4B8A]">Manage stored documents in the workspace below.</p>
        </div>
      </div>

      <section className="mt-6 rounded-[22px] border border-[#E7E1F7] bg-white/70 p-4 sm:p-5" aria-labelledby="deferred-import-sources">
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-[#81788E]">Deferred connected sources</p>
        <h3 id="deferred-import-sources" className="mt-1 font-serif text-xl font-semibold text-[#625C70]">Preserved for a later release decision</h3>
        <p className="mt-2 text-sm leading-6 text-[#81788E]">These foundations remain in the codebase but are disabled in both the interface and database beta gate. They will not compete with direct PDF upload until demand, reliability, review completion, and operational readiness support activation.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Deferred import sources">
          <div className="rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] px-4 py-3 text-sm text-[#746E80]"><Cloud className="mb-2 size-4" /><strong className="text-[#625C70]">Google Drive</strong><span className="block text-xs font-semibold uppercase tracking-wide">Deferred</span></div>
          <div className="rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] px-4 py-3 text-sm text-[#746E80]"><Images className="mb-2 size-4" /><strong className="text-[#625C70]">Instagram</strong><span className="block text-xs font-semibold uppercase tracking-wide">Deferred</span></div>
          <div className="rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] px-4 py-3 text-sm text-[#746E80]"><Cloud className="mb-2 size-4" /><strong className="text-[#625C70]">Website Import</strong><span className="block text-xs font-semibold uppercase tracking-wide">Deferred</span></div>
          <div className="rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] px-4 py-3 text-sm text-[#746E80]"><Images className="mb-2 size-4" /><strong className="text-[#625C70]">Pinterest</strong><span className="block text-xs font-semibold uppercase tracking-wide">Deferred</span></div>
        </div>
      </section>
    </section>
  )
}
