"use client"

/* eslint-disable @next/next/no-img-element -- institution submission covers use controlled opportunity media URLs */

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ImageIcon, Loader2 } from "lucide-react"
import { getOpportunityImagePublicUrl } from "@/lib/kleio-opportunity-images"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

type SubmissionCoverRecord = {
  title: string
  provider_name: string
  opportunity_type: string
  deadline_at: string | null
  submission_cover_path: string
  submission_cover_alt_text: string
  submission_cover_position_x: number
  submission_cover_position_y: number
}

export function ApplicationSubmissionCover() {
  const searchParams = useSearchParams()
  const opportunityId = searchParams.get("opportunity") || ""
  const [record, setRecord] = useState<SubmissionCoverRecord | null>(null)
  const [loading, setLoading] = useState(Boolean(opportunityId))

  useEffect(() => {
    if (!opportunityId) return
    let active = true
    const supabase = getSupabaseBrowserClient()
    void supabase.from("opportunities").select("title, provider_name, opportunity_type, deadline_at, submission_cover_path, submission_cover_alt_text, submission_cover_position_x, submission_cover_position_y").eq("id", opportunityId).maybeSingle()
      .then(({ data, error }) => {
        if (error) throw error
        if (active && data?.submission_cover_path) setRecord(data as SubmissionCoverRecord)
      })
      .catch(() => undefined)
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [opportunityId])

  if (!opportunityId || (!loading && !record)) return null
  if (loading) return <div className="shrink-0 border-b border-[#E7E1F7] bg-white px-4 py-2 sm:px-6"><div className="mx-auto flex max-w-[1120px] items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" />Loading application cover…</div></div>
  if (!record) return null

  const imageUrl = getOpportunityImagePublicUrl(record.submission_cover_path)
  return (
    <section className="shrink-0 border-b border-[#E7E1F7] bg-[#FCFBFD] px-4 py-4 sm:px-6">
      <div className="mx-auto grid max-w-[1120px] overflow-hidden rounded-2xl border border-[#E7E1F7] bg-white sm:grid-cols-[240px_minmax(0,1fr)]">
        <div className="relative min-h-40 overflow-hidden bg-[#F3EFF8]">
          {imageUrl ? <img src={imageUrl} alt={record.submission_cover_alt_text || `${record.title} application cover`} className="absolute inset-0 size-full object-cover" style={{ objectPosition: `${record.submission_cover_position_x}% ${record.submission_cover_position_y}%` }} /> : <div className="grid size-full place-items-center"><ImageIcon className="size-6 text-[#7867AA]" /></div>}
        </div>
        <div className="p-5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-[#6A5896]">Application introduction · {record.provider_name}</p>
          <h2 className="mt-2 font-serif text-2xl tracking-[-0.03em] text-[#292631]">{record.title}</h2>
          <p className="mt-2 text-xs leading-5 text-[#7F7890]">This institution-selected cover introduces the application. It does not change eligibility, requirements, readiness, or submission status.</p>
        </div>
      </div>
    </section>
  )
}
