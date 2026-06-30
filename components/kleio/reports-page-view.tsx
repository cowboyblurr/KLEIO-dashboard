"use client"

import { useState } from "react"
import {
  analytics,
  applicationsOverTime,
  getDisciplineDistribution,
  getReviewerProgress,
  getShortlistGroups,
  statusBreakdown,
} from "@/lib/kleio-analytics"
import { programs } from "@/lib/kleio-data"
import { DemoPageShell } from "@/components/kleio/demo-page-shell"

export function ReportsPageView() {
  const [exportConfirmation, setExportConfirmation] = useState<string | null>(null)
  const disciplineDistribution = getDisciplineDistribution()
  const reviewerProgress = getReviewerProgress()
  const shortlistOutcomes = getShortlistGroups()

  return (
    <DemoPageShell
      title="Reports"
      description="Generate funder-ready analytics on applicant demographics, review throughput, and program outcomes."
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["Total applications", analytics.totalApplications],
            ["In review", analytics.inReviewCount],
            ["Shortlisted", analytics.shortlistedCount],
            ["Pending vote", analytics.pendingVoteCount],
            ["Incomplete", analytics.incompleteCount],
            ["Deadlines this week", analytics.deadlinesThisWeekCount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="mt-1 font-serif text-2xl font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setExportConfirmation(
              `Report export queued for ${analytics.totalApplications} applications across ${programs.length} programs (demo only).`,
            )
          }
          className="inline-flex h-10 shrink-0 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Export report
        </button>
      </div>

      {exportConfirmation && (
        <p className="mb-4 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-3 py-2 text-xs font-medium text-[oklch(0.4_0.12_150)]">
          {exportConfirmation}
        </p>
      )}

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
            <h2 className="font-serif text-lg font-semibold text-foreground">Discipline distribution</h2>
          </div>
          <ul className="divide-y divide-border">
            {disciplineDistribution.map((entry) => (
              <li key={entry.medium} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-foreground">{entry.medium}</span>
                <span className="font-medium text-foreground tabular-nums">
                  {entry.count} <span className="text-muted-foreground">({entry.pct})</span>
                </span>
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
