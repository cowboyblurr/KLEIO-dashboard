"use client"

import Link from "next/link"
import { ArrowLeft, LayoutDashboard, ShieldCheck } from "lucide-react"
import { ArtistDocumentIntelligence } from "@/components/kleio/artist-document-intelligence"
import { ArtistDocumentIntelligenceSpanish } from "@/components/kleio/artist-document-intelligence-spanish"
import { DocumentDraftStudio } from "@/components/kleio/document-draft-studio"
import { ImportSourceHub } from "@/components/kleio/import-source-hub"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { QuickMediaImport } from "@/components/kleio/media-import/quick-media-import"

export function ArtistImportStudioPage() {
  const { locale } = useKleioLocale()
  return <main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-6 sm:px-6 sm:py-8"><div className="mx-auto max-w-[1180px] space-y-5">
    <nav aria-label={locale === "es" ? "Navegación del espacio del artista" : "Artist workspace navigation"} className="flex flex-wrap items-center gap-2"><Link href="/artist-dashboard/" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[#746E80]"><LayoutDashboard className="size-4" />{locale === "es" ? "Resumen" : "Overview"}</Link><span aria-hidden="true" className="text-[#C7C0D4]">/</span><Link href="/artist-dashboard/passport/" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[#5B4B8A]"><ArrowLeft className="size-4" />{locale === "es" ? "Pasaporte Creativo" : "Creative Passport"}</Link></nav>
    <section className="rounded-[28px] border border-[#DED7EF] bg-white p-5 shadow-[0_18px_52px_rgba(82,64,130,0.06)] sm:p-6" aria-labelledby="private-material-upload-title"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="max-w-3xl"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">{locale === "es" ? "Carga privada" : "Private upload"}</p><h1 id="private-material-upload-title" className="mt-1 font-serif text-2xl font-semibold tracking-[-0.03em] text-[#292631]">{locale === "es" ? "Añade medios o archivos de apoyo" : "Add media or supporting files"}</h1><p className="mt-2 text-sm leading-6 text-[#746E80]">{locale === "es" ? "Sube imágenes, video, audio y documentos comunes a tu Biblioteca privada de KLEIO. Los PDF también pueden pasar al análisis documental de Gemini más abajo." : "Upload images, video, audio, and common documents to your private KLEIO Library. PDFs can also enter Gemini document analysis farther down this page."}</p></div><QuickMediaImport context="existing_media_library" label={locale === "es" ? "Subir medios" : "Upload media"} onConfirm={() => undefined} /></div><p className="mt-4 text-xs font-semibold text-[#6A5896]"><ShieldCheck className="mr-1.5 inline size-3.5" />{locale === "es" ? "Privado por defecto · nada se publica ni se adjunta hasta que lo confirmes" : "Private by default · nothing is published or attached until you confirm a destination"}</p></section>
    <ImportSourceHub />
    {locale === "es" ? <ArtistDocumentIntelligenceSpanish /> : <><ArtistDocumentIntelligence /><DocumentDraftStudio /></>}
  </div></main>
}
