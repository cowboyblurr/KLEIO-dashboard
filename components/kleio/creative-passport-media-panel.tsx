"use client"

import Link from "next/link"
import { FileCheck2, FileText, Images, ShieldCheck, Sparkles } from "lucide-react"

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"

export function CreativePassportMediaPanel() {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-[#E2DCF1] bg-[linear-gradient(135deg,#F8F5FF,#FFFFFF)] p-5 shadow-[0_18px_52px_rgba(82,64,130,0.06)]" aria-labelledby="passport-media-title">
      <div aria-hidden="true" className="absolute -right-20 -top-24 size-60 rounded-full bg-[#E9E1FA]/70 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Artist-controlled document intelligence</p>
          <h2 id="passport-media-title" className="mt-2 font-serif text-2xl font-semibold tracking-[-0.03em]">Complete your Passport from documents you already have</h2>
          <p className="mt-2 text-sm leading-6 text-[#746E80]">Upload a private PDF CV, biography, statement, proposal, press document, portfolio, or other artist material. KLEIO preserves the source, prepares evidence-backed updates, and waits for your correction or approval.</p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-[#6A5896]"><span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5" />Private until you decide</span><span className="inline-flex items-center gap-1.5"><Sparkles className="size-3.5" />Facts and patterns stay separate</span></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/artist-dashboard/import/" className={primary}><FileText className="size-4" />Upload CV or artist document</Link>
          <Link href="/artist-dashboard/passport/review/" className={secondary}><FileCheck2 className="size-4" />Review Passport updates</Link>
          <Link href="/artist-dashboard/media/" className={secondary}><Images className="size-4" />Private Media Library</Link>
        </div>
      </div>
      <div className="relative mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#E7E1F7] bg-white/80 p-4"><FileCheck2 className="size-4 text-[#5B4B8A]" /><p className="mt-2 text-sm font-semibold">Evidence-backed updates</p><p className="mt-1 text-xs leading-5 text-[#746E80]">Proposed facts retain their private source, page, excerpt, extraction method, confidence state, and review decision.</p></div>
        <div className="rounded-2xl border border-[#E7E1F7] bg-white/80 p-4"><Sparkles className="size-4 text-[#5B4B8A]" /><p className="mt-2 text-sm font-semibold">Patterns, not pronouncements</p><p className="mt-1 text-xs leading-5 text-[#746E80]">Cross-document patterns are labeled as correlations. They never become verified biography or public Passport language automatically.</p></div>
      </div>
    </section>
  )
}
