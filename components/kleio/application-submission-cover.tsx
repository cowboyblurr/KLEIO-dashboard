"use client"

/* eslint-disable @next/next/no-img-element -- institution submission covers use controlled opportunity media URLs */

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ImageIcon, Loader2 } from "lucide-react"
import { SupportingTaskDisclosure } from "@/components/kleio/supporting-task-disclosure"
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

    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase
          .from("opportunities")
          .select("title, provider_name, opportunity_type, deadline_at, submission_cover_path, submission_cover_alt_text, submission_cover_position_x, submission_cover_position_y")
          .eq("id", opportunityId)
          .maybeSingle()

        if (error) throw error
        if (active && data?.submission_cover_path) setRecord(data as SubmissionCoverRecord)
      } catch {
        if (active) setRecord(null)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => { active = false }
  }, [opportunityId])

  if (!opportunityId || (!loading && !record)) return null
  if (loading) return <div role="status" className="flex items-center gap-2 rounded-2xl border border-[#E7E1F7] bg-white px-4 py-3 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" />Loading application introduction…</div>
  if (!record) return null

  const imageUrl = getOpportunityImagePublicUrl(record.submission_cover_path)
  return (
    <SupportingTaskDisclosure
      icon={ImageIcon}
      label="Opportunity context"
      title={record.title}
      description={`${record.provider_name} selected this cover for the application introduction.`}
      className="shadow-none"
    >
      <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#F3EFF8]">
          {imageUrl ? <img src={imageUrl} alt={record.submission_cover_alt_text || `${record.title} application cover`} className="absolute inset-0 size-full object-cover" style={{ objectPosition: `${record.submission_cover_position_x}% ${record.submission_cover_position_y}%` }} /> : <div className="grid size-full place-items-center"><ImageIcon className="size-6 text-[#7867AA]" /></div>}
        </div>
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-[#6A5896]">Application introduction · {record.provider_name}</p>
          <p className="mt-2 text-sm leading-6 text-[#746E80]">This cover provides visual context only. It does not change eligibility, source requirements, readiness, or submission status.</p>
        </div>
      </div>
    </SupportingTaskDisclosure>
  )
}
