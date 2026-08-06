"use client"

import { useEffect, useState } from "react"
import { Cloud, FileText, Images, Library, ShieldCheck } from "lucide-react"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { loadBetaImportAvailability, type KleioBetaImportAvailability } from "@/lib/kleio-import-source-availability"

const card = "flex min-h-48 flex-col rounded-[24px] border bg-white p-5 text-left shadow-[0_18px_48px_rgba(82,64,130,0.05)]"

const COPY = {
  en: {
    eyebrow: "Artist document beta",
    title: "Direct PDF upload is the active import method",
    intro: "Upload an existing CV or artist document from your device. KLEIO stores the source privately, checks the PDF on the server, prepares evidence-backed Passport suggestions, and waits for your review.",
    private: "Nothing publishes automatically",
    limits: "PDF only during the initial beta",
    active: "Active for beta",
    available: "Available",
    unavailable: "Unavailable",
    uploadTitle: "Upload CV or artist document",
    uploadBody: "Drag and drop or choose a PDF from this device. Maximum 15 MB and 100 pages. Native text is analyzed; scanned files are honestly marked OCR required.",
    uploadFoot: "Use the private upload workspace below.",
    reuseTitle: "Reuse a private KLEIO document",
    reuseBody: "Existing owner-scoped document sources can be previewed, reclassified, analyzed again, or kept without analysis. KLEIO does not create a duplicate file.",
    reuseFoot: "Manage stored documents in the workspace below.",
    deferredEyebrow: "Deferred connected sources",
    deferredTitle: "Preserved for a later release decision",
    deferredBody: "These foundations remain in the codebase but are disabled in both the interface and database beta gate. They will not compete with direct PDF upload until demand, reliability, review completion, and operational readiness support activation.",
    deferred: "Deferred",
    deferredAria: "Deferred import sources",
    websiteImport: "Website Import",
  },
  es: {
    eyebrow: "Beta de documentos para artistas",
    title: "La carga directa de PDF es el método activo",
    intro: "Sube un CV o documento artístico desde tu dispositivo. KLEIO guarda la fuente de forma privada, comprueba el PDF, prepara sugerencias respaldadas por evidencia y espera tu revisión.",
    private: "Nada se publica automáticamente",
    limits: "Solo PDF durante la beta inicial",
    active: "Activo en la beta",
    available: "Disponible",
    unavailable: "No disponible",
    uploadTitle: "Subir CV o documento artístico",
    uploadBody: "Arrastra o selecciona un PDF desde este dispositivo. Máximo 15 MB y 100 páginas. KLEIO analiza el texto disponible e identifica los documentos escaneados que requieren OCR.",
    uploadFoot: "Utiliza el espacio privado de carga que aparece abajo.",
    reuseTitle: "Reutilizar un documento privado de KLEIO",
    reuseBody: "Puedes previsualizar, volver a clasificar o analizar una fuente privada sin crear otra copia del archivo.",
    reuseFoot: "Gestiona tus documentos guardados en el espacio que aparece abajo.",
    deferredEyebrow: "Fuentes conectadas pospuestas",
    deferredTitle: "Conservadas para una fase posterior",
    deferredBody: "Estas conexiones permanecen desactivadas para que no compitan con el flujo activo de PDF hasta que su fiabilidad y preparación operativa permitan activarlas.",
    deferred: "Pospuesto",
    deferredAria: "Fuentes de importación pospuestas",
    websiteImport: "Importación web",
  },
} as const

export function ImportSourceHub() {
  const { locale } = useKleioLocale()
  const copy = COPY[locale]
  const [availability, setAvailability] = useState<KleioBetaImportAvailability | null>(null)
  useEffect(() => { void loadBetaImportAvailability().then(setAvailability).catch(() => setAvailability(null)) }, [])

  const directAvailable = availability?.device_document === true && availability?.pdf === true
  const libraryAvailable = availability?.existing_kleio_media === true

  return (
    <section className="rounded-[28px] border border-[#E2DCF1] bg-[linear-gradient(145deg,#F8F5FF,#FFFFFF)] p-5 shadow-[0_22px_70px_rgba(82,64,130,0.07)] sm:p-7" aria-labelledby="import-source-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">{copy.eyebrow}</p>
          <h2 id="import-source-title" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#292631]">{copy.title}</h2>
          <p className="mt-3 text-sm leading-7 text-[#746E80]">{copy.intro}</p>
        </div>
        <div className="grid gap-2 text-xs font-semibold text-[#625C70]">
          <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-[#6A5896]" />{copy.private}</span>
          <span className="inline-flex items-center gap-2"><FileText className="size-4 text-[#6A5896]" />{copy.limits}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className={`${card} ${directAvailable ? "border-[#D8D0F2]" : "border-amber-200"}`} aria-label={copy.uploadTitle}>
          <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><FileText className="size-5" /></span><span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${directAvailable ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{directAvailable ? copy.active : copy.unavailable}</span></div>
          <h3 className="mt-5 font-serif text-xl font-semibold">{copy.uploadTitle}</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-[#746E80]">{copy.uploadBody}</p>
          <p className="mt-4 text-xs font-semibold text-[#5B4B8A]">{copy.uploadFoot}</p>
        </div>

        <div className={`${card} ${libraryAvailable ? "border-[#D8D0F2]" : "border-amber-200"}`} aria-label={copy.reuseTitle}>
          <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><Library className="size-5" /></span><span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${libraryAvailable ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{libraryAvailable ? copy.available : copy.unavailable}</span></div>
          <h3 className="mt-5 font-serif text-xl font-semibold">{copy.reuseTitle}</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-[#746E80]">{copy.reuseBody}</p>
          <p className="mt-4 text-xs font-semibold text-[#5B4B8A]">{copy.reuseFoot}</p>
        </div>
      </div>

      <section className="mt-6 rounded-[22px] border border-[#E7E1F7] bg-white/70 p-4 sm:p-5" aria-labelledby="deferred-import-sources">
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-[#81788E]">{copy.deferredEyebrow}</p>
        <h3 id="deferred-import-sources" className="mt-1 font-serif text-xl font-semibold text-[#625C70]">{copy.deferredTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-[#81788E]">{copy.deferredBody}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={copy.deferredAria}>
          <div className="rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] px-4 py-3 text-sm text-[#746E80]"><Cloud className="mb-2 size-4" /><strong className="text-[#625C70]">Google Drive</strong><span className="block text-xs font-semibold uppercase tracking-wide">{copy.deferred}</span></div>
          <div className="rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] px-4 py-3 text-sm text-[#746E80]"><Images className="mb-2 size-4" /><strong className="text-[#625C70]">Instagram</strong><span className="block text-xs font-semibold uppercase tracking-wide">{copy.deferred}</span></div>
          <div className="rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] px-4 py-3 text-sm text-[#746E80]"><Cloud className="mb-2 size-4" /><strong className="text-[#625C70]">{copy.websiteImport}</strong><span className="block text-xs font-semibold uppercase tracking-wide">{copy.deferred}</span></div>
          <div className="rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] px-4 py-3 text-sm text-[#746E80]"><Images className="mb-2 size-4" /><strong className="text-[#625C70]">Pinterest</strong><span className="block text-xs font-semibold uppercase tracking-wide">{copy.deferred}</span></div>
        </div>
      </section>
    </section>
  )
}
