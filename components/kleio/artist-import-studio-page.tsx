"use client"

import Link from "next/link"
import { ArrowLeft, LayoutDashboard } from "lucide-react"
import { ArtistDocumentIntelligence } from "@/components/kleio/artist-document-intelligence"
import { ArtistDocumentIntelligenceSpanish } from "@/components/kleio/artist-document-intelligence-spanish"
import { DocumentDraftStudio } from "@/components/kleio/document-draft-studio"
import { ImportSourceHub } from "@/components/kleio/import-source-hub"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

export function ArtistImportStudioPage() {
  const { locale } = useKleioLocale()

  return (
    <main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <nav aria-label={locale === "es" ? "Navegación del espacio del artista" : "Artist workspace navigation"} className="flex flex-wrap items-center gap-2">
          <Link href="/artist-dashboard/" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[#746E80] transition hover:bg-[#F3EFFB] hover:text-[#5B4B8A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20">
            <LayoutDashboard className="size-4" />{locale === "es" ? "Resumen" : "Overview"}
          </Link>
          <span aria-hidden="true" className="text-[#C7C0D4]">/</span>
          <Link href="/artist-dashboard/passport/" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[#5B4B8A] transition hover:bg-[#F3EFFB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20">
            <ArrowLeft className="size-4" />{locale === "es" ? "Pasaporte Creativo" : "Creative Passport"}
          </Link>
        </nav>
        <ImportSourceHub />
        {locale === "es" ? (
          <ArtistDocumentIntelligenceSpanish />
        ) : (
          <>
            <ArtistDocumentIntelligence />
            <DocumentDraftStudio />
          </>
        )}
      </div>
    </main>
  )
}
