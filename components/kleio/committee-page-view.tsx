"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { analytics, getReviewerProgress, getSubmissionReviewerProgress } from "@/lib/kleio-analytics"
import { allSubmissions } from "@/lib/kleio-data"
import { artistProfileHref } from "@/lib/kleio-demo-auth"
import {
  calculateReviewTeamStats,
  formatReviewPermission,
  readReviewTeamDemoState,
  type ReviewTeamMember,
} from "@/lib/kleio-review-team"
import { DemoPageShell, DemoStatRow } from "@/components/kleio/demo-page-shell"
import { InitialAvatar } from "@/components/kleio/initial-avatar"

export function CommitteePageView() {
  const [preparedReviewTeam, setPreparedReviewTeam] = useState<ReviewTeamMember[]>([])

  useEffect(() => {
    setPreparedReviewTeam(readReviewTeamDemoState())
  }, [])

  const preparedReviewTeamStats = useMemo(
    () => calculateReviewTeamStats(preparedReviewTeam),
    [preparedReviewTeam],
  )

  const pendingVoteSubmissions = allSubmissions.filter((submission) => submission.status === "Pending Vote")
  const reviewerProgress = getReviewerProgress()
  const sofiaScenario = pendingVoteSubmissions.find((submission) => submission.id === "sofia-karim")

  return (
    <DemoPageShell
      title="Committee"
      description="Coordinate reviewers, jurors, and collaborators around the same submission context."
      actions={
        <Link
          href="/collaborator-dashboard/"
          className="inline-flex h-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
        >
          Preview Collaborator Review Seat
        </Link>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:max-w-3xl">
        <DemoStatRow label="Pending committee vote" value={analytics.pendingVoteCount} />
        <DemoStatRow label="Pending reviewer actions" value={analytics.pendingReviewerActionsCount} />
        <DemoStatRow label="Reviewer completion" value={analytics.reviewerCompletionRate} />
      </div>

      <section className="mb-4 rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">Prepared review team</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Collaborators prepared during institution signup. These are demo invite records for limited review seats.
            </p>
          </div>
          <Link
            href="/collaborator-dashboard/"
            className="inline-flex h-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
          >
            Preview Collaborator Review Seat
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 border-b border-border p-5 md:grid-cols-4">
          <DemoStatRow label="Collaborators" value={preparedReviewTeamStats.totalCollaborators} />
          <DemoStatRow label="Prepared invites" value={preparedReviewTeamStats.preparedInvites} />
          <DemoStatRow label="Limited seats" value={preparedReviewTeamStats.limitedReviewSeats} />
          <DemoStatRow label="Programs covered" value={preparedReviewTeamStats.assignedProgramCount} />
        </div>
        <ul className="divide-y divide-border">
          {preparedReviewTeam.map((member) => (
            <li key={member.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {member.role} · {member.assignedProgramTitle} · {member.accessScope}
                  </p>
                  <p className="mt-1 text-[0.65rem] font-medium text-primary">
                    {member.inviteStatus === "Prepared" ? "Prepared invite" : "Deferred invite"} · Limited review seat
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {member.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.6rem] font-medium text-primary"
                      >
                        {formatReviewPermission(permission)}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{member.inviteStatus}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {sofiaScenario && (
        <section className="mb-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Scenario · Reviewer bottleneck
          </p>
          <p className="mt-2 font-medium text-foreground">
            <Link href={artistProfileHref(sofiaScenario.artistId)} className="hover:text-primary transition-colors">
              {sofiaScenario.artist}
            </Link>
            {" — "}
            {sofiaScenario.projectTitle}
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
                  <Link
                    href={artistProfileHref(submission.artistId)}
                    className="font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {submission.artist}
                  </Link>
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Reviewer progress</h2>
            <Link
              href="/collaborator-dashboard/"
              className="text-xs font-medium text-primary hover:text-primary/80"
            >
              Preview Collaborator Review Seat
            </Link>
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
                <div className="text-right">
                  <span className="text-sm font-medium text-foreground tabular-nums">
                    {reviewer.completed}/{reviewer.assigned}
                  </span>
                  {reviewer.reviewerId === "celeste-rowan" && (
                    <Link
                      href="/collaborator-dashboard/"
                      className="mt-1 block text-[0.65rem] font-medium text-primary hover:text-primary/80"
                    >
                      Preview reviewer seat
                    </Link>
                  )}
                </div>
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
