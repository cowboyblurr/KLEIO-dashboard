"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Archive,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  FileWarning,
  Loader2,
  Merge,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import {
  loadOpportunityReviewQueue,
  reviewOpportunity,
  type OpportunityReviewAction,
  type OpportunityReviewFilter,
  type OpportunityReviewItem,
  type OpportunityReviewQueue,
} from "@/lib/kleio-opportunity-review"

const primary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const field = "min-h-10 rounded-xl border border-[#DED7EF] bg-white px-3 py-2 text-sm text-[#292631] outline-none transition focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12"

const FILTERS: Array<[OpportunityReviewFilter, string]> = [
  ["needs_attention", "Needs attention"],
  ["reports", "Artist reports"],
  ["verification", "Verification"],
  ["financial", "Financial terms"],
  ["rights", "Rights terms"],
  ["translation", "Translation"],
  ["reverify", "Reverification due"],
  ["duplicates", "Possible duplicates"],
  ["rejected", "Rejected"],
  ["all", "All records"],
]

const ACTIONS: Array<[OpportunityReviewAction, string]> = [
  ["verify", "Verify record"],
  ["publish", "Publish to artists"],
  ["keep_review", "Keep under review"],
  ["reverify", "Complete reverification"],
  ["resolve_reports", "Resolve artist reports"],
  ["archive", "Archive"],
  ["reject", "Reject"],
  ["merge_duplicate", "Merge as duplicate"],
  ["restore", "Restore for review"],
]

function formatDate(value: string | null) {
  if (!value) return "Not stated"
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return "Not stated"
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(date)
}

function cleanLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function isHighImpact(action: OpportunityReviewAction) {
  return ["publish", "reject", "archive", "merge_duplicate", "restore"].includes(action)
}

function ReviewCard({ item, onSelect }: { item: OpportunityReviewItem; onSelect: (item: OpportunityReviewItem) => void }) {
  return (
    <article className="rounded-[22px] border border-[#E7E1F7] bg-white p-5 shadow-[0_14px_44px_rgba(82,64,130,0.05)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#75639E]">
            <span>{item.provider_name}</span>
            <span>·</span>
            <span>{item.source_name}</span>
            {!item.source_active && <span className="rounded-full bg-red-50 px-2 py-0.5 normal-case text-red-700">Inactive source</span>}
          </div>
          <h2 className="mt-1 font-serif text-xl font-semibold text-[#292631]">{item.title}</h2>
          {item.original_title && item.original_title !== item.title && <p className="mt-1 text-xs text-[#746E80]">Original title: {item.original_title}</p>}
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#746E80]">{item.summary || "No reliable synopsis is stored."}</p>
        </div>
        <button type="button" className={primary} onClick={() => onSelect(item)}>Review record</button>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-[#F8F5FC] p-3"><dt className="text-[0.66rem] font-semibold uppercase tracking-wide text-[#81788E]">Status</dt><dd className="mt-1 text-sm font-semibold">{cleanLabel(item.status)} · {cleanLabel(item.lifecycle_status)}</dd></div>
        <div className="rounded-xl bg-[#F8F5FC] p-3"><dt className="text-[0.66rem] font-semibold uppercase tracking-wide text-[#81788E]">Verification</dt><dd className="mt-1 text-sm font-semibold">{cleanLabel(item.verification_status)}</dd></div>
        <div className="rounded-xl bg-[#F8F5FC] p-3"><dt className="text-[0.66rem] font-semibold uppercase tracking-wide text-[#81788E]">Deadline</dt><dd className="mt-1 text-sm font-semibold">{formatDate(item.deadline_at)}</dd></div>
        <div className="rounded-xl bg-[#F8F5FC] p-3"><dt className="text-[0.66rem] font-semibold uppercase tracking-wide text-[#81788E]">Reports</dt><dd className="mt-1 text-sm font-semibold">{item.open_reports} unresolved</dd></div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Review flags">
        {item.review_flags.map((flag) => <span key={flag} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">{cleanLabel(flag)}</span>)}
        {!item.review_flags.length && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">No automated flags</span>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.canonical_url && <a className={secondary} href={item.canonical_url} target="_blank" rel="noreferrer">Canonical source<ExternalLink className="size-4" /></a>}
        {item.application_url && <a className={secondary} href={item.application_url} target="_blank" rel="noreferrer">Application path<ExternalLink className="size-4" /></a>}
        {item.guidelines_url && <a className={secondary} href={item.guidelines_url} target="_blank" rel="noreferrer">Guidelines<ExternalLink className="size-4" /></a>}
      </div>
    </article>
  )
}

export function AdminOpportunityReviewQueue() {
  const [filter, setFilter] = useState<OpportunityReviewFilter>("needs_attention")
  const [queue, setQueue] = useState<OpportunityReviewQueue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<OpportunityReviewItem | null>(null)
  const [action, setAction] = useState<OpportunityReviewAction>("verify")
  const [reason, setReason] = useState("")
  const [sourceUrl, setSourceUrl] = useState("")
  const [duplicateTarget, setDuplicateTarget] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState("")
  const highImpact = useMemo(() => isHighImpact(action), [action])

  function refresh() {
    setLoading(true)
    setError("")
    void loadOpportunityReviewQueue(filter)
      .then(setQueue)
      .catch((reasonValue) => setError(reasonValue instanceof Error ? reasonValue.message : "The opportunity review queue could not be loaded."))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [filter])

  async function applyAction() {
    if (!selected) return
    setSubmitting(true)
    setError("")
    setConfirmation("")
    try {
      await reviewOpportunity({
        opportunityId: selected.id,
        action,
        reason,
        duplicateTargetId: action === "merge_duplicate" ? duplicateTarget : null,
        sourceUrl: sourceUrl || selected.canonical_url,
      })
      setConfirmation(`${selected.title}: ${cleanLabel(action)} completed and written to the audit history.`)
      setSelected(null)
      setReason("")
      setSourceUrl("")
      setDuplicateTarget("")
      refresh()
    } catch (reasonValue) {
      setError(reasonValue instanceof Error ? reasonValue.message : "KLEIO could not apply this review action.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !queue) {
    return <main className="grid min-h-dvh place-items-center bg-[#FCFBFE] p-6"><p role="status" className="flex items-center gap-2 text-sm font-semibold text-[#625C70]"><Loader2 className="size-4 animate-spin" />Loading the private opportunity review queue…</p></main>
  }

  if (!queue && error) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#FCFBFE] p-6">
        <section className="max-w-lg rounded-[28px] border border-[#E2DCF1] bg-white p-7 text-center shadow-[0_22px_70px_rgba(82,64,130,0.07)]" role="alert">
          <ShieldCheck className="mx-auto size-10 text-[#75639E]" />
          <h1 className="mt-4 font-serif text-3xl font-semibold">Private opportunity review</h1>
          <p className="mt-3 text-sm leading-6 text-[#746E80]">{error}</p>
          <p className="mt-3 text-xs leading-5 text-[#81788E]">Access is enforced by the administrator-only database functions and cannot be granted from this page.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-[#FCFBFE] px-4 py-6 text-[#292631] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1380px] space-y-6">
        <header className="rounded-[30px] border border-[#E2DCF1] bg-[linear-gradient(145deg,#F7F3FF,#FFFFFF)] p-6 shadow-[0_24px_76px_rgba(82,64,130,0.08)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#75639E]">Administrator workspace</p>
              <h1 className="mt-2 font-serif text-4xl font-semibold tracking-[-0.05em]">Opportunity review queue</h1>
              <p className="mt-3 text-sm leading-7 text-[#746E80]">Verify sources, resolve artist reports, document risk, and control which opportunities become visible without deleting historical records.</p>
            </div>
            <div className="flex flex-wrap gap-2"><Link href="/admin/analytics/" className={secondary}>Product analytics</Link><Link href="/artist-dashboard/opportunities/" className={secondary}>Artist directory</Link><button type="button" className={primary} onClick={refresh} disabled={loading}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />Refresh</button></div>
          </div>
        </header>

        <section className="rounded-[22px] border border-[#E7E1F7] bg-white p-4 shadow-[0_12px_34px_rgba(82,64,130,0.04)]" aria-label="Opportunity review filters">
          <div className="flex flex-wrap gap-2">{FILTERS.map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`min-h-10 rounded-full border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A997E8] ${filter === value ? "border-[#75639E] bg-[#EEE8FF] text-[#4F407B]" : "border-[#E1DBEF] bg-white text-[#625C70] hover:bg-[#FBFAFE]"}`}>{label}</button>)}</div>
        </section>

        {confirmation && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{confirmation}</div>}
        {error && queue && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#746E80]"><strong className="text-[#292631]">{queue?.total ?? 0} record{queue?.total === 1 ? "" : "s"}</strong> in {FILTERS.find(([value]) => value === filter)?.[1].toLowerCase()}.</p>
          <p className="text-xs text-[#81788E]">Publishing is blocked unless the record meets the database publication standard.</p>
        </div>

        <section className="space-y-4" aria-live="polite">
          {(queue?.items ?? []).map((item) => <ReviewCard key={item.id} item={item} onSelect={(next) => { setSelected(next); setAction(next.verification_status === "rejected" ? "restore" : "verify"); setReason(""); setSourceUrl(next.canonical_url); setDuplicateTarget(next.duplicate_of || "") }} />)}
          {!loading && queue?.items.length === 0 && <div className="rounded-[22px] border border-dashed border-[#D8D0F2] bg-white p-10 text-center"><CheckCircle2 className="mx-auto size-8 text-emerald-600" /><p className="mt-3 font-serif text-xl font-semibold">No records in this queue</p><p className="mt-2 text-sm text-[#746E80]">This review category is currently clear.</p></div>}
        </section>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#211B2E]/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="review-action-title" className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-[26px] border border-[#E7E1F7] bg-white p-5 shadow-[0_30px_100px_rgba(35,26,54,0.28)] sm:p-6">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#75639E]">Controlled moderation action</p><h2 id="review-action-title" className="mt-1 font-serif text-2xl font-semibold">{selected.title}</h2><p className="mt-2 text-sm text-[#746E80]">Every change records the administrator, previous values, new values, reason, timestamp, and supporting source.</p></div><button type="button" className="grid size-10 shrink-0 place-items-center rounded-full border border-[#E7E1F7] hover:bg-[#F7F4FF]" aria-label="Close review action" onClick={() => setSelected(null)}><XCircle className="size-4" /></button></div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold text-[#4F4858]">Action<select className={field} value={action} onChange={(event) => setAction(event.target.value as OpportunityReviewAction)}>{ACTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="grid gap-1.5 text-sm font-semibold text-[#4F4858]">Supporting source URL<input className={field} type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://official-source.example/call" /></label>
              {action === "merge_duplicate" && <label className="grid gap-1.5 text-sm font-semibold text-[#4F4858] sm:col-span-2">Canonical opportunity ID<input className={field} value={duplicateTarget} onChange={(event) => setDuplicateTarget(event.target.value)} placeholder="UUID of the record to preserve" /></label>}
              <label className="grid gap-1.5 text-sm font-semibold text-[#4F4858] sm:col-span-2">Review reason<textarea className="min-h-28 rounded-xl border border-[#DED7EF] bg-white px-3 py-2 text-sm outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="State what was verified, what remains unresolved, and why this action is appropriate." /></label>
            </div>

            {highImpact && <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><AlertTriangle className="mt-0.5 size-5 shrink-0" /><p><strong>{cleanLabel(action)}</strong> is a high-impact action. Confirm the source and describe the decision clearly. Historical records will be preserved.</p></div>}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-[#F8F5FC] p-3"><p className="text-xs font-semibold uppercase tracking-wide text-[#81788E]">Financial terms</p><p className="mt-1 text-sm font-semibold">{selected.financial_terms_verified ? "Verified" : "Review required"}</p></div>
              <div className="rounded-xl bg-[#F8F5FC] p-3"><p className="text-xs font-semibold uppercase tracking-wide text-[#81788E]">Rights terms</p><p className="mt-1 text-sm font-semibold">{selected.rights_terms_verified ? "Verified" : "Review required"}</p></div>
              <div className="rounded-xl bg-[#F8F5FC] p-3"><p className="text-xs font-semibold uppercase tracking-wide text-[#81788E]">Artist reports</p><p className="mt-1 text-sm font-semibold">{selected.open_reports} unresolved</p></div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" className={secondary} onClick={() => setSelected(null)}>Cancel</button><button type="button" className={primary} onClick={() => void applyAction()} disabled={submitting || reason.trim().length < 5}>{submitting ? <Loader2 className="size-4 animate-spin" /> : action === "publish" ? <BadgeCheck className="size-4" /> : action === "reject" ? <FileWarning className="size-4" /> : action === "archive" ? <Archive className="size-4" /> : action === "merge_duplicate" ? <Merge className="size-4" /> : action === "restore" ? <RotateCcw className="size-4" /> : <ShieldCheck className="size-4" />}{submitting ? "Applying…" : cleanLabel(action)}</button></div>
          </section>
        </div>
      )}
    </main>
  )
}
