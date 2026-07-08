"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  analytics,
  applicationsOverTime,
  getDisciplineDistribution,
  getReviewerProgress,
  getShortlistGroups,
  statusBreakdown,
} from "@/lib/kleio-analytics"
import { activityLog, programs } from "@/lib/kleio-data"
import { DemoPageShell } from "@/components/kleio/demo-page-shell"
import { KleioAssistObject } from "@/components/kleio/kleio-assist-object"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

type ExportAssistPhase = "idle" | "preparing" | "complete"

function reviewerCompletionPct(): number {
  const progress = getReviewerProgress()
  const completed = progress.reduce((sum, r) => sum + r.completed, 0)
  const assigned = progress.reduce((sum, r) => sum + r.assigned, 0)
  return Math.round((completed / Math.max(assigned, 1)) * 100)
}

export function ReportsPageView() {
  const { t } = useKleioLocale()
  const [exportPhase, setExportPhase] = useState<ExportAssistPhase>("idle")
  const exportTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const disciplineDistribution = getDisciplineDistribution()
  const reviewerProgress = getReviewerProgress()
  const shortlistOutcomes = getShortlistGroups()
  const decisionHistory = activityLog.filter((entry) => entry.type === "decision" || entry.type === "review" || entry.type === "message").slice(0, 6)

  useEffect(() => {
    return () => {
      if (exportTimeoutRef.current) clearTimeout(exportTimeoutRef.current)
    }
  }, [])

  function handleExportReport() {
    if (exportPhase !== "idle") return
    setExportPhase("preparing")
    exportTimeoutRef.current = setTimeout(() => {
      setExportPhase("complete")
    }, 1050)
  }

  return (
    <DemoPageShell
      title={t("institution.workspace.reports.title")}
      description="Here is the report: program summary, applicant status, reviewer progress, shortlist outcomes, and decision history preserved from the workflow."
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            [t("institution.workspace.reports.metric.totalApplications"), analytics.totalApplications],
            [t("institution.workspace.reports.metric.inReview"), analytics.inReviewCount],
            [t("institution.workspace.reports.metric.shortlisted"), analytics.shortlistedCount],
            [t("institution.workspace.reports.metric.pendingVote"), analytics.pendingVoteCount],
            [t("institution.workspace.reports.metric.incomplete"), analytics.incompleteCount],
            [t("institution.workspace.reports.metric.deadlinesThisWeek"), analytics.deadlinesThisWeekCount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="mt-1 font-serif text-2xl font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/reports/new/"
            className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("institution.workspace.reports.cta.prepareReport")}
          </Link>
          <Link
            href="/activity-log/"
            className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent/50"
          >
            Decision History
          </Link>
          <button
            type="button"
            onClick={handleExportReport}
            disabled={exportPhase !== "idle"}
            className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent/50 disabled:opacity-60"
          >
            {t("institution.workspace.reports.cta.exportReport")}
          </button>
        </div>
      </div>

      {exportPhase === "preparing" && (
        <div className="mb-4 max-w-lg">
          <KleioAssistObject
            mode="preparing"
            title={t("assist.object.reports.title")}
            description={t("assist.object.reports.description")}
            size="sm"
            compact
            progress={reviewerCompletionPct()}
          />
        </div>
      )}

      {exportPhase === "complete" && (
        <div className="mb-4 max-w-lg space-y-2">
          <KleioAssistObject
            mode="complete"
            title={t("assist.object.reportPrepared.title")}
            description={t("assist.object.reportPrepared.description")}
            size="sm"
            compact
          />
          <p className="px-1 text-[0.7rem] text-muted-foreground">{t("assist.object.demoOnlyNote")}</p>
          <p className="rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-3 py-2 text-xs font-medium text-[oklch(0.4_0.12_150)]">
            {t("institution.workspace.reports.exportConfirmation", {
              applications: analytics.totalApplications,
              programs: programs.length,
            })}
          </p>
        </div>
      )}

      <section className="mb-4 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Report proof points</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {[
            ["Open call context", "Dates, required materials, rubric, and committee coverage."],
            ["Decision movement", "Incomplete files, reviewer actions, shortlist status, and pending votes."],
            ["Preserved history", "A traceable activity record for reports, debriefs, and future cycles."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-[#E7E1F7] bg-white p-3">
              <p className="font-serif text-sm font-semibold text-[#292631]">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#7F7890]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Status breakdown</h2>
          </div>
          <ul className="divide-y divide-border">
            {statusBreakdown.map((entry) => (
              <li key={entry.label} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-foreground">{entry.label}</span>
                <span className="font-medium text-foreground tabular-nums">
                  {entry.count} <span className="text-muted-foreground">({entry.pct})</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Decision History</h2>
            <p className="mt-1 text-xs text-muted-foreground">Visible module for decisions, reviewer movement, and message-driven changes.</p>
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
            <h2 className="font-serif text-lg font-semibold text-foreground">Applications over time</h2>
          </div>
          <ul className="divide-y divide-border">
            {applicationsOverTime.map((entry) => (
              <li key={entry.month} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-foreground">{entry.month}</span>
                <span className="font-medium text-foreground tabular-nums">{entry.applications}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Reviewer progress</h2>
          </div>
          <ul className="divide-y divide-border">
            {reviewerProgress.map((reviewer) => (
              <li key={reviewer.reviewerId} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-foreground">{reviewer.name}</span>
                <span className="font-medium text-foreground tabular-nums">
                  {reviewer.completed}/{reviewer.assigned}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-serif text-lg font-semibold text-foreground">Shortlist outcomes</h2>
        </div>
        <ul className="divide-y divide-border">
          {shortlistOutcomes.map((group) => (
            <li key={group.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-foreground">{group.label}</span>
              <span className="font-medium text-foreground tabular-nums">{group.submissions.length}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-serif text-lg font-semibold text-foreground">Program summary</h2>
        </div>
        <ul className="divide-y divide-border">
          {programs.map((program) => (
            <li key={program.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-foreground">{program.title}</span>
              <span className="text-muted-foreground">{program.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </DemoPageShell>
  )
}
