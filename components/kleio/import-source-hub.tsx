"use client"

import { useEffect, useState } from "react"
import { Cloud, FileText, Images, Library, ShieldCheck } from "lucide-react"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { loadBetaImportAvailability, type KleioBetaImportAvailability } from "@/lib/kleio-import-source-availability"

const card = "flex min-h-48 flex-col rounded-[24px] border bg-white p-5 text-left shadow-[0_18px_48px_rgba(82,64,130,0.05)]"

const COPY = {
  en: {
    eyebrow: "Private material import",
    title: "Bring your files into KLEIO from one place",
    intro: "Upload images, video, audio, and common supporting documents from your device. KLEIO stores each source privately and waits for your approval before anything is reused. PDF documents can additionally enter Gemini document analysis when you choose that workflow.",
    private: "Nothing publishes automatically",
    limits: "Media + supporting documents",
    active: "Active for beta",
    available: "Available",
    unavailable: "Unavailable",
    uploadTitle: "Upload media or supporting files",
    uploadBody: "Choose the files that belong to your practice or application. Common image, video, audio, PDF, Office, text, spreadsheet, presentation, ZIP, and caption formats are supported within KLEIO's file-size limits.",
    uploadFoot: "Use the private Upload media control above.",
    reuseTitle: "Reuse private KLEIO media",
    reuseBody: "Existing owner-scoped images, video, audio, and documents can be selected again without creating duplicate files. PDFs that need document intelligence can still be previewed, classified, or analyzed separately.",
    reuseFoot: "Manage everything together in your Media Library.",
    deferredEyebrow: "Deferred connected sources",
    deferredTitle: "Preserved for a later release decision",
    deferredBody: "Connected providers remain preserved but disabled until their reliability and permission flows are ready. Direct device upload and your private KLEIO Library remain the dependable beta paths for all supported media and documents.",
    deferred: "Deferred",
    deferredAria: "Deferred import sources",
    websiteImport: "Website Import",
  },
  es: {
    eyebrow: "Importación privada de materiales",
    title: "Lleva tus archivos a KLEIO desde un solo lugar",
    intro: "Sube imágenes, video, audio y documentos de apoyo comunes desde tu dispositivo. KLEIO guarda cada fuente de forma privada y espera tu aprobación antes de reutilizarla. Los documentos PDF también pueden entrar al análisis documental de Gemini cuando elijas ese flujo.",
    private: "Nada se publica automáticamente",
    limits: "Medios + documentos de apoyo",
    active: "Activo en la beta",
    available: "Disponible",
    unavailable: "No disponible",
    uploadTitle: "Subir medios o archivos de apoyo",
    uploadBody: "Elige los archivos que pertenecen a tu práctica o solicitud. KLEIO admite formatos comunes de imagen, video, audio, PDF, Office, texto, hojas de cálculo, presentaciones, ZIP y subtítulos dentro de los límites de tamaño.",
    uploadFoot: "Usa el control privado Subir medios que aparece arriba.",
    reuseTitle: "Reutilizar medios privados de KLEIO",
    reuseBody: "Puedes volver a elegir imágenes, video, audio y documentos privados sin crear copias duplicadas. Los PDF que necesiten inteligencia documental se pueden previsualizar, clasificar o analizar por separado.",
    reuseFoot: "Gestiona todo junto en tu Biblioteca de medios.",
    deferredEyebrow: "Fuentes conectadas pospuestas",
    deferredTitle: "Conservadas para una fase posterior",
    deferredBody: "Los proveedores conectados permanecen conservados pero desactivados hasta que sus flujos de permisos y fiabilidad estén listos. La carga directa desde el dispositivo y la Biblioteca privada de KLEIO son las rutas estables de la beta para todos los medios y documentos compatibles.",
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

  const directAvailable = availability?.device_document === true
    && availability?.device_image === true
    && availability?.device_video === true
    && availability?.device_audio === true
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
          <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><Images className="size-5" /></span><span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${directAvailable ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{directAvailable ? copy.active : copy.unavailable}</span></div>
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
