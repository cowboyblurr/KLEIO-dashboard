"use client"

import Link from "next/link"
import { ArrowLeft, BrainCircuit, Images, LayoutDashboard, Library, ShieldCheck } from "lucide-react"
import { ImportSourceHub } from "@/components/kleio/import-source-hub"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { QuickMediaImport } from "@/components/kleio/media-import/quick-media-import"

const action = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/15"

export function ArtistImportStudioPage() {
  const { locale } = useKleioLocale()
  return <main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-6 sm:px-6 sm:py-8"><div className="mx-auto max-w-[1180px] space-y-5">
    <nav aria-label={locale === "es" ? "Navegación del espacio del artista" : "Artist workspace navigation"} className="flex flex-wrap items-center gap-2"><Link href="/artist-dashboard/" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[#746E80]"><LayoutDashboard className="size-4" />{locale === "es" ? "Resumen" : "Overview"}</Link><span aria-hidden="true" className="text-[#C7C0D4]">/</span><Link href="/artist-dashboard/passport/" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[#5B4B8A]"><ArrowLeft className="size-4" />{locale === "es" ? "Pasaporte Creativo" : "Creative Passport"}</Link></nav>

    <section className="rounded-[28px] border border-[#DED7EF] bg-white p-5 shadow-[0_18px_52px_rgba(82,64,130,0.06)] sm:p-6" aria-labelledby="private-material-upload-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">{locale === "es" ? "Material privado" : "Private material"}</p><h1 id="private-material-upload-title" className="mt-1 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#292631]">{locale === "es" ? "Añade lo que ya forma parte de tu práctica" : "Add what already belongs to your practice"}</h1><p className="mt-2 text-sm leading-7 text-[#746E80]">{locale === "es" ? "Sube imágenes, video, audio y archivos de apoyo a una biblioteca privada reutilizable. Después puedes analizarlos desde la Biblioteca de medios o directamente dentro del Pasaporte Creativo, sin cambiar de flujo." : "Upload images, video, audio, and supporting files to one reusable private library. Then analyze supported material from Media Library or directly inside Creative Passport without switching workflows."}</p></div>
        <QuickMediaImport context="existing_media_library" label={locale === "es" ? "Añadir medios" : "Add media"} onConfirm={() => undefined} />
      </div>
      <p className="mt-4 text-xs font-semibold text-[#6A5896]"><ShieldCheck className="mr-1.5 inline size-3.5" />{locale === "es" ? "Privado por defecto · tú decides qué se analiza, reutiliza o comparte" : "Private by default · you decide what is analyzed, reused, or shared"}</p>
    </section>

    <ImportSourceHub />

    <section className="grid gap-4 md:grid-cols-2" aria-label={locale === "es" ? "Siguientes pasos" : "Next steps"}>
      <Link href="/artist-dashboard/media/" className="group rounded-[24px] border border-[#E2DCF1] bg-white p-5 shadow-[0_14px_40px_rgba(82,64,130,0.05)] transition hover:border-[#B9A9DE]"><span className="grid size-10 place-items-center rounded-xl bg-[#F0EAFB] text-[#5B4B8A]"><Library className="size-5" /></span><h2 className="mt-4 font-serif text-xl font-semibold text-[#292631]">{locale === "es" ? "Biblioteca de medios" : "Media Library"}</h2><p className="mt-2 text-sm leading-6 text-[#746E80]">{locale === "es" ? "Organiza tus fuentes privadas y abre el análisis de cada medio sin salir de la biblioteca." : "Organize private sources and open each supported media analysis without leaving the library."}</p><span className={`${action} mt-4 pointer-events-none`}>{locale === "es" ? "Abrir biblioteca" : "Open library"}</span></Link>
      <Link href="/artist-dashboard/passport/" className="group rounded-[24px] border border-[#E2DCF1] bg-white p-5 shadow-[0_14px_40px_rgba(82,64,130,0.05)] transition hover:border-[#B9A9DE]"><span className="grid size-10 place-items-center rounded-xl bg-[#F0EAFB] text-[#5B4B8A]"><BrainCircuit className="size-5" /></span><h2 className="mt-4 font-serif text-xl font-semibold text-[#292631]">{locale === "es" ? "Pasaporte Creativo" : "Creative Passport"}</h2><p className="mt-2 text-sm leading-6 text-[#746E80]">{locale === "es" ? "Consulta la inteligencia de medios junto a tu perfil y revisa las sugerencias donde realmente las necesitas." : "See media intelligence beside your profile and review suggestions where you actually need them."}</p><span className={`${action} mt-4 pointer-events-none`}>{locale === "es" ? "Abrir Pasaporte" : "Open Passport"}</span></Link>
    </section>
  </div></main>
}
