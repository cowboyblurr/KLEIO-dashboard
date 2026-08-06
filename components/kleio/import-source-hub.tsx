"use client"

import { useEffect, useState } from "react"
import { Cloud, FileText, Images, Library, ShieldCheck } from "lucide-react"
import { SupportingTaskDisclosure } from "@/components/kleio/supporting-task-disclosure"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { loadBetaImportAvailability, type KleioBetaImportAvailability } from "@/lib/kleio-import-source-availability"

const COPY = {
  en: {
    available: "Available",
    unavailable: "Unavailable",
    eyebrow: "Artist document beta",
    title: "Upload a CV or artist document",
    intro: "Direct PDF upload is the active import method for this beta. The private upload and review workspace begins immediately below.",
    private: "Nothing publishes automatically",
    limits: "PDF · 15 MB · 100 pages",
    deviceTitle: "Upload from this device",
    deviceBody: "Native text is analyzed. Scanned files are labeled as requiring OCR or manual review.",
    reuseTitle: "Reuse a stored document",
    reuseBody: "Preview, reanalyze, or keep an owner-scoped source without creating a duplicate file.",
    later: "Later release",
    deferredTitle: "Deferred connected sources",
    deferredBody: "These foundations are preserved but disabled so they do not compete with the active PDF workflow.",
    deferredDetail: "Google Drive, Instagram, Website Import, and Pinterest remain disabled in the interface and database beta gate until reliability, demand, and operational readiness support activation.",
    deferred: "Deferred",
    deferredAria: "Deferred import sources",
  },
  es: {
    available: "Disponible",
    unavailable: "No disponible",
    eyebrow: "Beta de documentos para artistas",
    title: "Sube un CV o documento artístico",
    intro: "La carga directa de PDF es el método activo durante esta beta. El archivo permanece privado y podrás revisar cada sugerencia antes de aprobarla.",
    private: "Nada se publica automáticamente",
    limits: "PDF · 15 MB · 100 páginas",
    deviceTitle: "Subir desde este dispositivo",
    deviceBody: "KLEIO analiza el texto disponible. Los documentos escaneados se identifican como archivos que requieren OCR o revisión manual.",
    reuseTitle: "Reutilizar un documento guardado",
    reuseBody: "Puedes previsualizar, volver a analizar o conservar una fuente privada sin crear una copia duplicada.",
    later: "Versión posterior",
    deferredTitle: "Fuentes conectadas pospuestas",
    deferredBody: "Estas conexiones se conservan para una fase posterior y no compiten con el flujo activo de PDF.",
    deferredDetail: "Google Drive, Instagram, Importación de sitios web y Pinterest siguen desactivados hasta que su fiabilidad y preparación operativa permitan activarlos.",
    deferred: "Pospuesto",
    deferredAria: "Fuentes de importación pospuestas",
  },
} as const

function availabilityTone(available: boolean) {
  return available
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-amber-200 bg-amber-50 text-amber-800"
}

const deferredSourceClass = "inline-flex items-center gap-2 rounded-full border border-[#E7E1F7] bg-[#FAF9FD] px-3 py-1.5 text-xs text-[#746E80]"

export function ImportSourceHub() {
  const { locale } = useKleioLocale()
  const copy = COPY[locale]
  const [availability, setAvailability] = useState<KleioBetaImportAvailability | null>(null)
  useEffect(() => { void loadBetaImportAvailability().then(setAvailability).catch(() => setAvailability(null)) }, [])

  const directAvailable = availability?.device_document === true && availability?.pdf === true
  const libraryAvailable = availability?.existing_kleio_media === true
  const availabilityLabel = (available: boolean) => available ? copy.available : copy.unavailable

  return (
    <section className="rounded-[24px] border border-[#E2DCF1] bg-white p-5 shadow-[0_18px_52px_rgba(82,64,130,0.05)] sm:p-6" aria-labelledby="import-source-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">{copy.eyebrow}</p>
          <h1 id="import-source-title" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#292631]">{copy.title}</h1>
          <p className="mt-2 text-sm leading-6 text-[#746E80]">{copy.intro}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#625C70]">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F7F4FF] px-3 py-1.5"><ShieldCheck className="size-3.5 text-[#6A5896]" />{copy.private}</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F7F4FF] px-3 py-1.5"><FileText className="size-3.5 text-[#6A5896]" />{copy.limits}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl border border-[#E7E1F7] bg-[#FCFBFE] p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F0EAFB] text-[#5B4B8A]"><FileText className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold text-[#292631]">{copy.deviceTitle}</h2><span className={`rounded-full border px-2.5 py-1 text-[0.64rem] font-semibold ${availabilityTone(directAvailable)}`}>{availabilityLabel(directAvailable)}</span></div>
            <p className="mt-1 text-xs leading-5 text-[#746E80]">{copy.deviceBody}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-[#E7E1F7] bg-[#FCFBFE] p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F0EAFB] text-[#5B4B8A]"><Library className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold text-[#292631]">{copy.reuseTitle}</h2><span className={`rounded-full border px-2.5 py-1 text-[0.64rem] font-semibold ${availabilityTone(libraryAvailable)}`}>{availabilityLabel(libraryAvailable)}</span></div>
            <p className="mt-1 text-xs leading-5 text-[#746E80]">{copy.reuseBody}</p>
          </div>
        </div>
      </div>

      <SupportingTaskDisclosure
        icon={Cloud}
        label={copy.later}
        title={copy.deferredTitle}
        description={copy.deferredBody}
        className="mt-4 shadow-none"
      >
        <p className="text-sm leading-6 text-[#746E80]">{copy.deferredDetail}</p>
        <div className="mt-4 flex flex-wrap gap-2" aria-label={copy.deferredAria}>
          <span className={deferredSourceClass}><Cloud className="size-3.5" /><strong className="text-[#625C70]">Google Drive</strong><span>· {copy.deferred}</span></span>
          <span className={deferredSourceClass}><Images className="size-3.5" /><strong className="text-[#625C70]">Instagram</strong><span>· {copy.deferred}</span></span>
          <span className={deferredSourceClass}><Cloud className="size-3.5" /><strong className="text-[#625C70]">Website Import</strong><span>· {copy.deferred}</span></span>
          <span className={deferredSourceClass}><Images className="size-3.5" /><strong className="text-[#625C70]">Pinterest</strong><span>· {copy.deferred}</span></span>
        </div>
      </SupportingTaskDisclosure>
    </section>
  )
}
