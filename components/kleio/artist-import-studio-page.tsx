"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ArtistDocumentIntelligence } from "@/components/kleio/artist-document-intelligence"
import { ImportSourceHub } from "@/components/kleio/import-source-hub"

export function ArtistImportStudioPage() {
  return (
    <main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <Link href="/artist-dashboard/passport/" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[#5B4B8A] transition hover:bg-[#F3EFFB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20">
          <ArrowLeft className="size-4" />Creative Passport
        </Link>
        <ImportSourceHub />
        <ArtistDocumentIntelligence />
      </div>
    </main>
  )
}
