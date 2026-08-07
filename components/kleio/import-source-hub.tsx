"use client"

import { useEffect, useState } from "react"
import { FileText, Images, Library, ShieldCheck } from "lucide-react"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { loadBetaImportAvailability, type KleioBetaImportAvailability } from "@/lib/kleio-import-source-availability"

const card = "flex min-h-48 flex-col rounded-[24px] border bg-white p-5 text-left shadow-[0_18px_48px_rgba(82,64,130,0.05)]"

const COPY = {
  en: {
    eyebrow: "Private material import",
    title: "Bring your files into KLEIO from one place",
    intro: "Upload images, video, audio, and common supporting documents from your device. KLEIO stores each source privately and waits for your approval before anything is reused. Supported artwork media and PDFs can also be analyzed when you choose to use KLEIO Assist.",
    private: "Nothing publishes automatically",
    limits: "Media + supporting documents",
    available: "Available", unavailable: "Unavailable",
    uploadTitle: "Upload media or supporting files",
    uploadBody: "Choose files that belong to your practice or application. Common image, video, audio, PDF, Office, text, spreadsheet, presentation, ZIP, and caption formats are supported within KLEIO's file-size limits.",
    uploadFoot: "Use the private Upload media control above.",
    reuseTitle: "Reuse private KLEIO media",
    reuseBody: "Existing owner-scoped images, video, audio, and documents can be selected again without creating duplicate files. Supported sources can be analyzed privately and reopened from Creative Passport or Media Library.",
    reuseFoot: "Manage everything together in your Media Library.",
  },
  es: {
    eyebrow: "Importación privada de materiales",
    title: "Lleva tus archivos a KLEIO desde un solo lugar",
    intro: "Sube imágenes, video, audio y documentos de apoyo comunes desde tu dispositivo. KLEIO guarda cada fuente de forma privada y espera tu aprobación antes de reutilizarla. Los medios artísticos compatibles y los PDF también pueden analizarse cuando elijas usar KLEIO Assist.",
    private: "Nada se publica automáticamente",
    limits: "Medios + documentos de apoyo",
    available: "Disponible", unavailable: "No disponible",
    uploadTitle: "Subir medios o archivos de apoyo",
    uploadBody: "Elige archivos de tu práctica o solicitud. KLEIO admite formatos comunes de imagen, video, audio, PDF, Office, texto, hojas de cálculo, presentaciones, ZIP y subtítulos dentro de sus límites de tamaño.",
    uploadFoot: "Usa el control privado Subir medios que aparece arriba.",
    reuseTitle: "Reutilizar medios privados de KLEIO",
    reuseBody: "Puedes volver a elegir imágenes, video, audio y documentos privados sin crear copias duplicadas. Las fuentes compatibles pueden analizarse de forma privada y volver a abrirse desde el Pasaporte Creativo o la Biblioteca de medios.",
    reuseFoot: "Gestiona todo junto en tu Biblioteca de medios.",
  },
} as const

export function ImportSourceHub() {
  const { locale } = useKleioLocale()
  const copy = COPY[locale]
  const [availability, setAvailability] = useState<KleioBetaImportAvailability | null>(null)
  useEffect(() => { void loadBetaImportAvailability().then(setAvailability).catch(() => setAvailability(null)) }, [])
  const directAvailable = availability?.device_document === true && availability?.device_image === true && availability?.device_video === true && availability?.device_audio === true
  const libraryAvailable = availability?.existing_kleio_media === true

  return <section className="rounded-[28px] border border-[#E2DCF1] bg-[linear-gradient(145deg,#F8F5FF,#FFFFFF)] p-5 shadow-[0_22px_70px_rgba(82,64,130,0.07)] sm:p-7" aria-labelledby="import-source-title">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">{copy.eyebrow}</p><h2 id="import-source-title" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#292631]">{copy.title}</h2><p className="mt-3 text-sm leading-7 text-[#746E80]">{copy.intro}</p></div><div className="grid gap-2 text-xs font-semibold text-[#625C70]"><span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-[#6A5896]" />{copy.private}</span><span className="inline-flex items-center gap-2"><FileText className="size-4 text-[#6A5896]" />{copy.limits}</span></div></div>
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div className={`${card} ${directAvailable ? "border-[#D8D0F2]" : "border-amber-200"}`}><div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><Images className="size-5" /></span><span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${directAvailable ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{directAvailable ? copy.available : copy.unavailable}</span></div><h3 className="mt-5 font-serif text-xl font-semibold">{copy.uploadTitle}</h3><p className="mt-2 flex-1 text-sm leading-6 text-[#746E80]">{copy.uploadBody}</p><p className="mt-4 text-xs font-semibold text-[#5B4B8A]">{copy.uploadFoot}</p></div>
      <div className={`${card} ${libraryAvailable ? "border-[#D8D0F2]" : "border-amber-200"}`}><div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><Library className="size-5" /></span><span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${libraryAvailable ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{libraryAvailable ? copy.available : copy.unavailable}</span></div><h3 className="mt-5 font-serif text-xl font-semibold">{copy.reuseTitle}</h3><p className="mt-2 flex-1 text-sm leading-6 text-[#746E80]">{copy.reuseBody}</p><p className="mt-4 text-xs font-semibold text-[#5B4B8A]">{copy.reuseFoot}</p></div>
    </div>
  </section>
}
