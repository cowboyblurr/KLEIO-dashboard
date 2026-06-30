"use client"

import Link from "next/link"
import { analytics, getReviewerProgress, getSubmissionReviewerProgress } from "@/lib/kleio-analytics"
import { allSubmissions } from "@/lib/kleio-data"
import { DemoPageShell, DemoStatRow } from "@/components/kleio/demo-page-shell"
import { InitialAvatar } from "@/components/kleio/initial-avatar"

export function CommitteePageView() {
  const pendingVoteSubmissions = allSubmissions.filter((submission) => submission.status === "Pending Vote")
  const reviewerProgress = getReviewerProgress()
  const sofiaScenario = pendingVoteSubmissions.find((submission) => submission.id === "sofia-karim")

  return (
    <DemoPageShell
      title="Committee"
      description="Coordinate panel voting, capture deliberation notes, and track consensus through final decisions."
    >
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:max-w-3xl">
        <DemoStatRow label="Pending committee vote" value={analytics.pendingVoteCount} />
        <DemoStatRow label="Pending reviewer actions" value={analytics.pendingReviewerActionsCount} />
        <DemoStatRow label="Reviewer completion" value={analytics.reviewerCompletionRate} />
      </div>

      {sofiaScenario && (
        <section className="mb-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Scenario · Reviewer bottleneck
          </p>
          <p className="mt-2 font-medium text-foreground">
            {sofiaScenario.artist} — {sofiaScenario.projectTitle}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Two reviews complete. One committee vote is still pending before this finalist can advance.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Reviewer progress{" "}
            {(() => {
              const progress = getSubmissionReviewerProgress(sofiaScenario.id)
              return `${progress.completed}/${progress.total} complete · ${progress.pending} pending`
            })()}
          </p>
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Awaiting vote</h2>
          </div>
          <ul className="divide-y divide-border">
            {pendingVoteSubmissions.map((submission) => {
              const progress = getSubmissionReviewerProgress(submission.id)
              return (
                <li key={submission.id} className="px-5 py-4">
                  <p className="font-medium text-foreground">{submission.artist}</p>
                  <p className="text-sm text-muted-foreground">{submission.projectTitle}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Reviews completed {progress.completed}/{progress.total}
                    {progress.pending > 0 ? ` · ${progress.pending} pending` : ""}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {progress.reviews.map((review) => (
                      <li key={review.reviewerId} className="flex justify-between text-xs">
                        <span className="text-foreground">{review.reviewerName}</span>
                        <span className="text-muted-foreground">
                          {review.status}
                          {review.recommendation ? ` · ${review.recommendation}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Reviewer progress</h2>
          </div>
          <ul className="divide-y divide-border">
            {reviewerProgress.map((reviewer) => (
              <li key={reviewer.reviewerId} className="flex items-center gap-3 px-5 py-4">
                <InitialAvatar name={reviewer.name} className="size-9 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{reviewer.name}</p>
                  <p className="text-xs text-muted-foreground">{reviewer.role}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.round(reviewer.rate * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground tabular-nums">
                  {reviewer.completed}/{reviewer.assigned}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {analytics.pendingReviewerActionsCount} open review assignment
        {analytics.pendingReviewerActionsCount === 1 ? "" : "s"} across active programs.{" "}
        <Link href="/messages/" className="font-medium text-primary hover:text-primary/80">
          Message pending reviewers
        </Link>
      </p>
    </DemoPageShell>
  )
}
