"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { analytics, getReviewerProgress, getShortlistGroups, statusBreakdown } from "@/lib/kleio-analytics"
import { activityLog, programs } from "@/lib/kleio-data"
import { DemoPageShell } from "@/components/kleio/demo-page-shell"
import { KleioAssistObject } from "@/components/kleio/kleio-assist-object"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"

type ExportAssistPhase = "idle" | "preparing" | "complete"

function reviewerCompletionPct(): number {
  const progress = getReviewerProgress()
  const completed = progress.reduce((sum, r) => sum + r.completed, 0)
  const assigned = progress.reduce((sum, r) => sum + r.assigned, 0)
  return Math.round((completed / Math.max(assigned, 1)) * 100)
}

function ReportSectionCard({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[#E7E1F7] bg-white p-4 shadow-sm">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{number}</p>
      <h3 className="mt-1 font-serif text-base font-semibold text-[#292631]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#7F7890]">{body}</p>
    </div>
  )
}

export function ReportsPageView() {
  const { t } = useKleioLocale()
  const { isPreview } = useKleioMode()
  const [exportPhase, setExportPhase] = useState<ExportAssistPhase>("idle")
  const [previewOpen, setPreviewOpen] = useState(true)
  const exportTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reviewerProgress = getReviewerProgress()
  const shortlistOutcomes = getShortlistGroups()
  const primaryProgram = programs[0]
  const decisionHistory = activityLog.filter((entry) => entry.type === "decision" || entry.type === "review" || entry.type === "message").slice(0, 6)
  const reviewerPct = reviewerCompletionPct()

  useEffect(() => {
    return () => {
      if (exportTimeoutRef.current) clearTimeout(exportTimeoutRef.current)
    }
  }, [])

  function handleExportReport() {
    if (exportPhase !== "idle") return
    setPreviewOpen(true)
    setExportPhase("preparing")
    exportTimeoutRef.current = setTimeout(() => setExportPhase("complete"), 950)
  }

  return (
    <DemoPageShell
      title={t("institution.workspace.reports.title")}
      description="Prepare a clear institutional record from the open call, reviewer progress, shortlist movement, and decision history."
    >
      <section className="mb-4 overflow-hidden rounded-3xl border border-[#E7E1F7] bg-white shadow-[0_18px_48px_rgba(82,64,130,0.08)]">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="bg-[#F7F4FF] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A997E8]">Program Report Draft</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-[#292631]">{primaryProgram.title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#6F6882]">
              This report draft gathers program context, applicant status, reviewer completion, shortlist movement, and decision history into one prepared institutional record.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => setPreviewOpen(true)} className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                Preview Report
              </button>
              <button type="button" onClick={handleExportReport} disabled={exportPhase !== "idle"} className="inline-flex h-10 items-center rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] transition-colors hover:bg-white/75 disabled:opacity-60">
                {isPreview ? "Export Report" : t("institution.workspace.reports.cta.exportReport")}
              </button>
              <Link href="/activity-log/" className="inline-flex h-10 items-center rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] transition-colors hover:bg-white/75">
                View Decision History
              </Link>
            </div>
          </div>

          <div className="grid gap-3 p-6 sm:grid-cols-2">
            <Metric label="Applications" value={analytics.totalApplications} />
            <Metric label="Shortlisted" value={analytics.shortlistedCount} />
            <Metric label="Reviewer completion" value={`${reviewerPct}%`} />
            <Metric label="Decision records" value={decisionHistory.length} />
          </div>
        </div>
      </section>

      {exportPhase === "preparing" && (
        <div className="mb-4 max-w-xl">
          <KleioAssistObject mode="preparing" title={t("assist.object.reports.title")} description="Preparing the report package from program context, reviewer progress, shortlist outcomes, and decision history." size="sm" compact progress={reviewerPct} />
        </div>
      )}

      {exportPhase === "complete" && (
        <section className="mb-4 max-w-2xl rounded-2xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] p-4 text-[oklch(0.4_0.12_150)]">
          <p className="text-sm font-semibold">Report package prepared.</p>
          <p className="mt-1 text-xs leading-relaxed opacity-85">
            What happened: KLEIO prepared a report draft from {analytics.totalApplications} applications across {programs.length} program cycle{programs.length === 1 ? "" : "s"}. Where it went: this preview remains inside Reports. Next step: review the decision history or export when production storage is connected.
          </p>
        </section>
      )}

      <section className="mb-4 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Report workflow</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <ReportSectionCard number="01" title="Program summary" body="Call details, dates, materials, rubric, and committee coverage are captured as the opening context." />
          <ReportSectionCard number="02" title="Decision timeline" body="Reviewer updates, messages, status changes, shortlist movement, and votes remain attached to the record." />
          <ReportSectionCard number="03" title="Export package" body="The institution can prepare a board, archive, or funder-facing report without rebuilding the review story manually." />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)]">
        {previewOpen && (
          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-serif text-lg font-semibold text-foreground">Report Preview</h2>
              <p className="mt-1 text-xs text-muted-foreground">A readable draft view of what the institution would preserve from this review cycle.</p>
            </div>
            <div className="space-y-4 p-5">
              <ReportBlock title="1. Program summary" body={`${primaryProgram.title} is currently ${primaryProgram.status.toLowerCase()} with ${analytics.totalApplications} applications in the workspace. Required materials, rubric, deadlines, and committee coverage are preserved for reference.`} />
              <ReportBlock title="2. Reviewer completion" body={`Reviewer progress is ${reviewerPct}% complete. The report preserves who was assigned, who submitted, and which records still need attention.`} />
              <ReportBlock title="3. Shortlist outcome" body={`${analytics.shortlistedCount} applicants are currently shortlisted, with ${analytics.pendingVoteCount} pending vote item${analytics.pendingVoteCount === 1 ? "" : "s"} still visible for committee follow-up.`} />
              <ReportBlock title="4. Decision history" body="Decision movement is pulled from activity history so future teams can understand why applicants moved forward, stalled, or required more information." />
            </div>
          </section>
        )}

        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-serif text-lg font-semibold text-foreground">Decision History</h2>
              <p className="mt-1 text-xs text-muted-foreground">Recent decisions, reviewer movement, and message-driven changes.</p>
            </div>
            <ul className="divide-y divide-border">
              {decisionHistory.map((entry) => (
                <li key={entry.id} className="px-5 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-foreground"><span className="font-medium">{entry.actor}</span> <span className="text-muted-foreground">{entry.action}</span></span>
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{entry.target}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-serif text-lg font-semibold text-foreground">Reviewer Completion</h2>
            </div>
            <ul className="divide-y divide-border">
              {reviewerProgress.map((reviewer) => (
                <li key={reviewer.reviewerId} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-foreground">{reviewer.name}</span>
                  <span className="font-medium text-foreground tabular-nums">{reviewer.completed}/{reviewer.assigned}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <details className="mt-4 rounded-2xl border border-border bg-card shadow-sm">
        <summary className="cursor-pointer px-5 py-4 font-serif text-lg font-semibold text-foreground">Supporting analytics</summary>
        <div className="grid gap-4 border-t border-border p-5 xl:grid-cols-3">
          <section className="rounded-2xl border border-border bg-background shadow-sm">
            <div className="border-b border-border px-4 py-3"><h3 className="font-serif text-base font-semibold text-foreground">Status breakdown</h3></div>
            <ul className="divide-y divide-border">
              {statusBreakdown.map((entry) => <li key={entry.label} className="flex items-center justify-between px-4 py-3 text-sm"><span>{entry.label}</span><span className="font-medium tabular-nums">{entry.count} <span className="text-muted-foreground">({entry.pct})</span></span></li>)}
            </ul>
          </section>
          <section className="rounded-2xl border border-border bg-background shadow-sm">
            <div className="border-b border-border px-4 py-3"><h3 className="font-serif text-base font-semibold text-foreground">Shortlist outcomes</h3></div>
            <ul className="divide-y divide-border">
              {shortlistOutcomes.map((group) => <li key={group.id} className="flex items-center justify-between px-4 py-3 text-sm"><span>{group.label}</span><span className="font-medium tabular-nums">{group.submissions.length}</span></li>)}
            </ul>
          </section>
          <section className="rounded-2xl border border-border bg-background shadow-sm">
            <div className="border-b border-border px-4 py-3"><h3 className="font-serif text-base font-semibold text-foreground">Program cycles</h3></div>
            <ul className="divide-y divide-border">
              {programs.map((program) => <li key={program.id} className="flex items-center justify-between px-4 py-3 text-sm"><span>{program.title}</span><span className="text-muted-foreground">{program.status}</span></li>)}
            </ul>
          </section>
        </div>
      </details>
    </DemoPageShell>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><p className="text-xs font-medium text-[#7F7890]">{label}</p><p className="mt-1 font-serif text-2xl font-semibold text-[#292631]">{value}</p></div>
}

function ReportBlock({ title, body }: { title: string; body: string }) {
  return <div className="rounded-2xl border border-border bg-background p-4"><h3 className="font-serif text-base font-semibold text-foreground">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p></div>
}
