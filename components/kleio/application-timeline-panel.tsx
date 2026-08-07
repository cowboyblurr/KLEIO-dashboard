"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Clock3, Eye, History, Loader2, Mail, MessageSquareText } from "lucide-react"
import { loadApplicationPackage } from "@/lib/kleio-application-preparation"
import { loadApplicationTimeline, loadApplicationSubmissionVersions, type ApplicationSubmissionVersion, type ApplicationTimelineItem } from "@/lib/kleio-application-composer"

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function evidenceLabel(value: ApplicationTimelineItem["evidenceLevel"]) {
  if (value === "provider_confirmed") return "Provider confirmed"
  if (value === "recipient_confirmed") return "Recipient confirmed"
  if (value === "system_observed") return "System observed"
  return "Artist reported"
}

function iconFor(item: ApplicationTimelineItem) {
  if (item.eventType.includes("view") || item.eventType.includes("opened") || item.eventType.includes("accessed")) return Eye
  if (item.eventType.includes("message") || item.eventType.includes("contact") || item.eventType.includes("replied")) return MessageSquareText
  if (item.eventType.includes("email") || item.eventType.includes("sent")) return Mail
  if (item.eventType.includes("finalized") || item.eventType.includes("confirmed") || item.eventType.includes("accepted")) return CheckCircle2
  return Clock3
}

export function ApplicationTimelinePanel() {
  const searchParams = useSearchParams()
  const opportunityId = searchParams.get("opportunity")?.trim() ?? ""
  const [items, setItems] = useState<ApplicationTimelineItem[]>([])
  const [versions, setVersions] = useState<ApplicationSubmissionVersion[]>([])
  const [loading, setLoading] = useState(Boolean(opportunityId))
  const [error, setError] = useState("")

  async function refresh() {
    if (!opportunityId) return
    setLoading(true)
    setError("")
    try {
      const packageRecord = await loadApplicationPackage(opportunityId)
      if (!packageRecord) {
        setItems([])
        setVersions([])
        return
      }
      const [timeline, submissionVersions] = await Promise.all([
        loadApplicationTimeline(packageRecord.id),
        loadApplicationSubmissionVersions(packageRecord.id),
      ])
      setItems(timeline)
      setVersions(submissionVersions)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not load this application history.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [opportunityId])

  if (!opportunityId) return null

  return (
    <section className="rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.055)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <History className="mt-0.5 size-5 text-[#6F5DA7]" />
          <div>
            <h2 className="text-base font-semibold text-[#292631]">Application timeline</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">One history for preparation, delivery, recipient activity, and outcomes. Evidence labels show what KLEIO actually knows.</p>
          </div>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#665A85] hover:bg-[#F5F1FB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:opacity-50">
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <History className="size-3.5" />}Refresh
        </button>
      </div>

      {versions.length > 0 && <div className="mt-4 flex flex-wrap gap-2" aria-label="Preserved application versions">
        {versions.map((version) => <span key={version.id} className="rounded-full border border-[#DED7EF] bg-[#FAF8FD] px-3 py-1.5 text-xs font-semibold text-[#665A85]">Version {version.version_number} · {formatDate(version.finalized_at)}</span>)}
      </div>}

      {loading && !items.length ? <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground" role="status"><Loader2 className="size-4 animate-spin" />Loading application history…</div> : null}
      {error ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900" role="alert">{error}</div> : null}
      {!loading && !error && !items.length ? <div className="mt-4 rounded-xl border border-[#E7E1F7] bg-[#FAF8FD] px-4 py-3 text-sm leading-6 text-muted-foreground">No application events yet. Save and finalize the application to begin its preserved history.</div> : null}

      {items.length > 0 && <ol className="relative mt-5 space-y-0 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-[#E3DDF0]">
        {items.map((item) => {
          const Icon = iconFor(item)
          return <li key={item.id} className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-3 pb-5 last:pb-0">
            <span className="relative z-10 grid size-8 place-items-center rounded-full border border-[#DED7EF] bg-white text-[#6F5DA7]"><Icon className="size-3.5" /></span>
            <div className="min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="text-sm font-semibold text-[#292631]">{item.label}</h3><span className="rounded-full bg-[#F4F1FA] px-2 py-0.5 text-[0.66rem] font-semibold uppercase tracking-wide text-[#665A85]">{evidenceLabel(item.evidenceLevel)}</span></div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
              <time className="mt-1 block text-[0.7rem] font-medium text-muted-foreground">{formatDate(item.createdAt)}</time>
            </div>
          </li>
        })}
      </ol>}

      <p className="mt-4 border-t border-[#EEEAF6] pt-3 text-xs leading-5 text-muted-foreground">A page access means the hosted application opened. An email-client event means KLEIO prepared and opened the client. Neither event is represented as proof that an institution read or received the submission.</p>
    </section>
  )
}