"use client"

import { useState } from "react"
import Link from "next/link"
import { FileCheck2, FileText, Images, ShieldCheck, Sparkles } from "lucide-react"
import { QuickMediaImport } from "@/components/kleio/media-import/quick-media-import"
import { SupportingTaskDisclosure } from "@/components/kleio/supporting-task-disclosure"
import { attachMediaToCreativePassportCv } from "@/lib/kleio-universal-media"

const primary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"

export function CreativePassportMediaPanel() {
  const [status, setStatus] = useState("")

  return (
    <SupportingTaskDisclosure
      icon={FileText}
      label="Optional shortcut"
      title="Use an existing CV or artist document"
      description="Open only when you want KLEIO to prepare reviewable Passport updates from a private PDF."
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="max-w-3xl">
          <p className="text-sm leading-6 text-[#625C70]">
            Upload a private PDF CV, biography, statement, proposal, press document, portfolio, or related artist material. KLEIO keeps facts and interpretations separate and waits for your correction or approval.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#6A5896]">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5" />Private until you decide</span>
            <span className="inline-flex items-center gap-1.5"><Sparkles className="size-3.5" />Evidence remains reviewable</span>
          </div>
          {status && <p role="status" aria-live="polite" className="mt-3 text-xs font-semibold text-emerald-700">{status}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/artist-dashboard/import/" className={primary}><FileText className="size-4" />Upload document</Link>
          <QuickMediaImport
            context="creative_passport"
            label="Choose CV"
            className="!min-h-10"
            onConfirm={async ({ items }) => {
              const selected = items[0]
              if (!selected) return
              await attachMediaToCreativePassportCv(selected)
              setStatus(`${selected.title} is now the CV connected to your Creative Passport.`)
            }}
          />
          <Link href="/artist-dashboard/passport/review/" className={secondary}><FileCheck2 className="size-4" />Review updates</Link>
          <Link href="/artist-dashboard/media/" className={secondary}><Images className="size-4" />Media Library</Link>
        </div>
      </div>
    </SupportingTaskDisclosure>
  )
}
