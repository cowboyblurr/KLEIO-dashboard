"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Loader2,
  Save,
  ShieldCheck,
} from "lucide-react"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import {
  loadReviewerWorkspace,
  saveReviewerReview,
  type ReviewerAssignment,
  type ReviewerWorkspaceData,
} from "@/lib/kleio-reviewer-data"

const surface = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]"
const input = "h-10 w-full rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
const textarea = "w-full rounded-xl border border-[#E7E1F7] bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
const primary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] disabled:cursor-not-allowed disabled:opacity-50"

type ReviewForm = {
  score: string
  recommendation: "" | "advance" | "discuss" | "decline" | "abstain"
  notes: string
  status: "not_started" | "in_progress" | "completed"
}

function reviewFormFor(assignment: ReviewerAssignment): ReviewForm {
  return {
    score: assignment.review?.score === null || assignment.review?.score === undefined ? "" : String(assignment.review.score),
    recommendation: (assignment.review?.recommendation ?? "") as ReviewForm["recommendation"],
    notes: assignment.review?.internal_notes ?? "",
    status: assignment.review?.review_status ?? "not_started",
  }
}

function formatDate(value: string | null, fallback = "Not stated") {
  if (!value) return fallback
  const date = new Date(`${value.length === 10 ? `${value}T12:00:00Z` : value}`)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(date)
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function statusTone(status: string) {
  if (status === "completed") return "bg-emerald-50 text-emerald-700"
  if (status === "in_progress") return "bg-blue-50 text-blue-700"
  return "bg-amber-50 text-amber-800"
}

function profileValue(profile: Record<string, unknown>, key: string) {
  const value = profile[key]
  if (typeof value === "string") return value.trim()
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(", ")
  return ""
}

function AssignmentReviewCard({
  assignment,
  form,
  expanded,
  saving,
  onToggle,
  onChange,
  onSave,
}: {
  assignment: ReviewerAssignment
  form: ReviewForm
  expanded: boolean
  saving: boolean
  onToggle: () => void
  onChange: (next: ReviewForm) => void
  onSave: (complete: boolean) => Promise<void>
}) {
  const profile = assignment.application.profile_snapshot
  const call = assignment.application.call
  const biography = profileValue(profile, "bio") || profileValue(profile, "biography")
  const statement = profileValue(profile, "artist_statement")
  const disciplines = profileValue(profile, "disciplines")
  const works = assignment.application.works.filter((selection) => selection.work)

  return (
    <article className={`${surface} overflow-hidden`}>
      <button type="button" onClick={onToggle} className="flex w-full items-start justify-between gap-4 text-left" aria-expanded={expanded}>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#A997E8]">{call?.title || "Assigned application"}</p>
          <h2 className="mt-1 font-serif text-xl font-semibold text-[#292631]">{assignment.application.artist_name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Due {formatDate(assignment.due_at, "date not assigned")} · Application {statusLabel(assignment.application.status)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(form.status)}`}>{statusLabel(form.status)}</span>
          <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {expanded && <div className="mt-5 space-y-5 border-t border-[#E7E1F7] pt-5">
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-[#E7E1F7] p-4">
            <h3 className="text-sm font-semibold">Artist context</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Disciplines</dt><dd className="mt-1">{disciplines || "Not included in the submitted snapshot"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Biography</dt><dd className="mt-1 whitespace-pre-wrap leading-relaxed">{biography || "Not included in the submitted snapshot"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Artist statement</dt><dd className="mt-1 whitespace-pre-wrap leading-relaxed">{statement || "Not included in the submitted snapshot"}</dd></div>
            </dl>
          </div>
          <div className="rounded-xl border border-[#E7E1F7] p-4">
            <h3 className="text-sm font-semibold">Program context</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Institution</dt><dd className="mt-1">{call?.institution_name || "Institution context unavailable"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Program deadline</dt><dd className="mt-1">{formatDate(call?.deadline_at ?? null)}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary</dt><dd className="mt-1 leading-relaxed">{call?.summary || "No program summary was included."}</dd></div>
            </dl>
          </div>
        </section>

        <section className="rounded-xl border border-[#E7E1F7] p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><FileText className="size-4 text-primary" />Application answers</h3>
          <div className="mt-3 space-y-3">
            {assignment.application.answers.length ? assignment.application.answers.map((answer) => <div key={answer.question_key} className="rounded-xl bg-[#F9F7FD] p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{statusLabel(answer.question_key)}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{answer.answer_text || "No answer provided."}</p></div>) : <p className="text-sm text-muted-foreground">No application answers are available for this assignment.</p>}
          </div>
        </section>

        <section className="rounded-xl border border-[#E7E1F7] p-4">
          <h3 className="text-sm font-semibold">Selected works</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {works.length ? works.map(({ sort_order, work }) => work && <article key={work.id} className="rounded-xl bg-[#F9F7FD] p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Work {sort_order + 1}</p><p className="mt-1 text-sm font-semibold">{work.title}</p><p className="mt-1 text-xs text-muted-foreground">{[work.year, work.medium, work.dimensions].filter(Boolean).join(" · ") || "Metadata incomplete"}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{work.description || "No description provided."}</p></article>) : <p className="text-sm text-muted-foreground">No selected works are available for this application.</p>}
          </div>
        </section>

        <section className="rounded-xl border border-[#D8D0F2] bg-[#F9F7FD] p-4">
          <div className="flex items-start gap-3"><ClipboardCheck className="mt-0.5 size-5 text-primary" /><div><h3 className="text-sm font-semibold">Your private review</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Only your assigned review record is editable here. Completing the review does not change the application decision.</p></div></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground"><span>Score (0–100)</span><input className={input} type="number" min="0" max="100" step="1" value={form.score} onChange={(event) => onChange({ ...form, score: event.target.value, status: form.status === "not_started" ? "in_progress" : form.status })} /></label>
            <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground"><span>Recommendation</span><select className={input} value={form.recommendation} onChange={(event) => onChange({ ...form, recommendation: event.target.value as ReviewForm["recommendation"], status: form.status === "not_started" ? "in_progress" : form.status })}><option value="">Choose recommendation</option><option value="advance">Advance</option><option value="discuss">Discuss</option><option value="decline">Decline</option><option value="abstain">Abstain</option></select></label>
          </div>
          <label className="mt-4 grid gap-1.5 text-xs font-semibold text-muted-foreground"><span>Private reviewer notes</span><textarea className={textarea} rows={5} value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value, status: form.status === "not_started" ? "in_progress" : form.status })} placeholder="Record evidence, questions, and rationale for the committee." /></label>
          <div className="mt-4 flex flex-wrap gap-2"><button type="button" className={secondary} disabled={saving} onClick={() => void onSave(false)}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save in progress</button><button type="button" className={primary} disabled={saving || !form.score || !form.recommendation} onClick={() => void onSave(true)}><CheckCircle2 className="size-4" />Complete review</button></div>
        </section>
      </div>}
    </article>
  )
}

export function LiveReviewerWorkspace({ mode = "overview" }: { mode?: "overview" | "queue" }) {
  const [data, setData] = useState<ReviewerWorkspaceData | null>(null)
  const [forms, setForms] = useState<Record<string, ReviewForm>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [savingId, setSavingId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  async function refresh() {
    setLoading(true)
    setError("")
    try {
      const next = await loadReviewerWorkspace()
      setData(next)
      setForms(Object.fromEntries(next.assignments.map((assignment) => [assignment.id, reviewFormFor(assignment)])))
      if (!expanded && next.assignments.length === 1) setExpanded(next.assignments[0].id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not load the reviewer workspace.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  const counts = useMemo(() => {
    const assignments = data?.assignments ?? []
    return {
      total: assignments.length,
      pending: assignments.filter((assignment) => (forms[assignment.id]?.status ?? assignment.review?.review_status ?? "not_started") !== "completed").length,
      completed: assignments.filter((assignment) => (forms[assignment.id]?.status ?? assignment.review?.review_status) === "completed").length,
      dueSoon: assignments.filter((assignment) => {
        if (!assignment.due_at) return false
        const days = (new Date(`${assignment.due_at}T23:59:59Z`).getTime() - Date.now()) / 86400000
        return days >= 0 && days <= 7
      }).length,
    }
  }, [data, forms])

  async function save(assignment: ReviewerAssignment, complete: boolean) {
    const form = forms[assignment.id] ?? reviewFormFor(assignment)
    setSavingId(assignment.id)
    setError("")
    setMessage("")
    try {
      await saveReviewerReview({
        applicationId: assignment.application_id,
        score: form.score.trim() ? Number(form.score) : null,
        recommendation: form.recommendation,
        internalNotes: form.notes,
        reviewStatus: complete ? "completed" : form.status === "not_started" ? "in_progress" : form.status,
      })
      setMessage(complete ? "Review completed and returned to the institution." : "Review progress saved.")
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not save this review.")
    } finally {
      setSavingId("")
    }
  }

  if (loading) return <main className="h-full overflow-y-auto px-6 py-6"><div className="mx-auto flex max-w-[1120px] items-center gap-2 rounded-2xl border border-[#E7E1F7] bg-white p-5 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading assigned reviews…</div></main>

  return (
    <main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1120px] space-y-5">
        <WorkspacePageHeader eyebrow="Reviewer workspace" title={mode === "queue" ? "Assigned review queue" : "Reviewer overview"} description="A focused, permission-scoped view of the applications assigned to this reviewer account." />

        {data && <section className={`${surface} flex flex-wrap items-start justify-between gap-4`}><div><p className="text-xs font-semibold uppercase tracking-wide text-[#A997E8]">Active review seat</p><h2 className="mt-1 font-serif text-xl font-semibold">{data.accountName}</h2><p className="mt-1 text-sm text-muted-foreground">{data.institution?.institution_name || "Institution membership"} · {statusLabel(data.institution?.member_role || "reviewer")}</p></div><div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"><ShieldCheck className="size-4" />Assigned applications only</div></section>}

        {mode === "overview" && <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className={surface}><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assigned</p><p className="mt-2 font-serif text-3xl font-semibold">{counts.total}</p></div><div className={surface}><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">In progress</p><p className="mt-2 font-serif text-3xl font-semibold">{counts.pending}</p></div><div className={surface}><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Completed</p><p className="mt-2 font-serif text-3xl font-semibold">{counts.completed}</p></div><div className={surface}><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Due within 7 days</p><p className="mt-2 font-serif text-3xl font-semibold">{counts.dueSoon}</p></div></section>}

        {mode === "overview" && <section className={`${surface} flex flex-wrap items-center justify-between gap-3`}><div><h2 className="text-sm font-semibold">Review work is isolated by assignment</h2><p className="mt-1 text-sm text-muted-foreground">You cannot manage programs, change application status, or open submissions that were not assigned to you.</p></div><Link href="/collaborator-dashboard/review-queue/" className={primary}>Open review queue</Link></section>}

        {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}</div>}
        {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}

        {!error && data?.assignments.length === 0 && <section className={surface}><h2 className="font-serif text-xl font-semibold">No assigned reviews</h2><p className="mt-2 text-sm text-muted-foreground">This reviewer account is active, but no application has been assigned yet.</p></section>}

        <div className="space-y-4">{data?.assignments.map((assignment) => <AssignmentReviewCard key={assignment.id} assignment={assignment} form={forms[assignment.id] ?? reviewFormFor(assignment)} expanded={expanded === assignment.id} saving={savingId === assignment.id} onToggle={() => setExpanded((current) => current === assignment.id ? null : assignment.id)} onChange={(next) => setForms((current) => ({ ...current, [assignment.id]: next }))} onSave={(complete) => save(assignment, complete)} />)}</div>
      </div>
    </main>
  )
}
