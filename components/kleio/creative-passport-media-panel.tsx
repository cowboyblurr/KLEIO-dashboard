"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { FileCheck2, Images, Loader2, Sparkles } from "lucide-react"
import { loadPassportReviewCount } from "@/lib/kleio-upload-to-passport"

const action = "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[#D8D0F2] bg-white px-3 py-1.5 text-xs font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/15"

export function CreativePassportMediaPanel() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    loadPassportReviewCount()
      .then((value) => { if (active) setCount(value) })
      .catch(() => { if (active) setCount(0) })
    return () => { active = false }
  }, [])

  return (
    <section className="rounded-xl border border-[#E7E1F7] bg-[#FCFBFE] px-3 py-2.5" aria-labelledby="passport-document-tools-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#F0EBFA] text-[#5B4B8A]"><Sparkles className="size-4" /></span>
          <div className="min-w-0">
            <h2 id="passport-document-tools-title" className="text-sm font-semibold text-[#292631]">Build from your materials</h2>
            <p className="truncate text-xs text-[#746E80]">Add reusable media or supporting files. When you analyze a PDF, Gemini places findings in the matching Passport fields for your approval.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Link href="/artist-dashboard/import/" className={action}><Images className="size-3.5" />Add material</Link>
          <Link href="/artist-dashboard/passport/review/" className={action}>
            <FileCheck2 className="size-3.5" />
            {count === null ? <Loader2 className="size-3 animate-spin" /> : count ? `${count} to review` : "Review updates"}
          </Link>
          <Link href="/artist-dashboard/media/" className={action}><Images className="size-3.5" />Library</Link>
        </div>
      </div>
    </section>
  )
}
