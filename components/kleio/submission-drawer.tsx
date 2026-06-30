"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  MoreHorizontal,
  Plus,
  Bookmark,
  X,
  Vote,
  AlertCircle,
} from "lucide-react"
import type { Submission } from "@/lib/kleio-data"
import {
  getLatestSubmissionNote,
  getSubmissionActivity,
  getSubmissionReviewerProgress,
} from "@/lib/kleio-analytics"
import { assetPath } from "@/lib/asset-path"
import { InitialAvatar } from "@/components/kleio/initial-avatar"

function CompletionRing({ value }: { value: number }) {
  const r = 13
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <span className="relative grid size-9 place-items-center">
      <svg viewBox="0 0 32 32" className="size-9 -rotate-90">
        <circle cx="16" cy="16" r={r} fill="none" stroke="var(--color-muted)" strokeWidth="3" />
        <circle
          cx="16"
          cy="16"
          r={r}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
    </span>
  )
}

function getPrimaryAction(submission: Submission): { label: string; icon: typeof Mail; href?: string } {
  if (submission.status === "Pending Info" || submission.status === "Incomplete") {
    return { label: "Request Missing Materials", icon: Mail }
  }
  if (submission.status === "Pending Vote") {
    return { label: "View Committee Vote", icon: Vote, href: "/committee/" }
  }
  if (submission.status === "Shortlisted" || submission.status === "Interview") {
    return { label: "Open Decision Room", icon: Bookmark, href: "/shortlist/" }
  }
  return { label: "Move to Shortlist", icon: Bookmark }
}

function getScenarioLabel(submission: Submission) {
  if (submission.scenario === "deadline-triage") return "Scenario · Deadline triage"
  if (submission.scenario === "reviewer-bottleneck") return "Scenario · Reviewer bottleneck"
  if (submission.scenario === "strong-shortlist") return "Scenario · Strong shortlist candidate"
  return "Submission context"
}

function getActionConfirmation(label: string, submission: Submission) {
  switch (label) {
    case "Move to Shortlist":
      return `${submission.artist} moved to the shortlist.`
    case "Request Missing Materials":
      return `Material request drafted for ${submission.artist}.`
    case "View Committee Vote":
      return `Opened committee vote status for ${submission.artist}.`
    case "Open Decision Room":
      return `Decision room opened for ${submission.artist}.`
    case "Message Pending Reviewer":
      return "Reminder drafted for the pending committee reviewer."
    case "Request Additional Information":
      return `Information request drafted for ${submission.artist}.`
    default:
      return `Action recorded for ${submission.artist}.`
  }
}

export function SubmissionDrawer({
  submission,
  onPrev,
  onNext,
  onClose,
}: {
  submission: Submission
  onPrev: () => void
  onNext: () => void
  onClose: () => void
}) {
  const primaryAction = getPrimaryAction(submission)
  const PrimaryIcon = primaryAction.icon
  const secondaryLabel =
    submission.status === "Pending Vote" ? "Message Pending Reviewer" : "Request Additional Information"
  const secondaryHref = submission.status === "Pending Vote" ? "/messages/" : undefined
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const reviewerProgress = getSubmissionReviewerProgress(submission.id)
  const latestNote = getLatestSubmissionNote(submission.id)
  const activity = getSubmissionActivity(submission.id)

  useEffect(() => {
    setConfirmation(null)
  }, [submission.id])

  return (
    <aside className="flex h-full w-[21.5rem] shrink-0 flex-col border-l border-border bg-card/95 backdrop-blur-sm xl:w-[22.5rem] 2xl:w-[24rem]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Selected Submission</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous submission"
            className="grid size-7 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Next submission"
            className="grid size-7 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="p-4 xl:p-5">
          <div className="mb-3 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-semibold text-primary">{getScenarioLabel(submission)}</span>
            {submission.decisionStage && <span> · {submission.decisionStage}</span>}
          </div>

          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
            <Image
              src={assetPath(submission.image || "/placeholder.svg")}
              alt={`${submission.projectTitle} by ${submission.artist}`}
              fill
              sizes="384px"
              className="object-cover"
            />
          </div>

          <div className="mt-4 flex items-start gap-2">
            <h3 className="font-serif text-xl font-semibold text-foreground">{submission.artist}</h3>
            <BadgeCheck className="mt-1 size-4 shrink-0 text-primary" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {submission.location} &middot; {submission.discipline} &middot; {submission.medium}
          </p>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-accent/40 p-3">
            <CompletionRing value={submission.completeness} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{submission.program}</p>
              <p className="text-xs text-muted-foreground">{submission.programCycle}</p>
            </div>
            <span className="text-xs font-semibold text-primary tabular-nums">
              {submission.completeness}% Complete
            </span>
          </div>

          {submission.missingMaterials?.length ? (
            <Section title="Missing Materials" action="Prepare request">
              <div className="rounded-xl border border-[oklch(0.88_0.08_70)] bg-[oklch(0.98_0.035_80)] p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-[oklch(0.62_0.16_65)]" />
                  <ul className="space-y-1 text-sm text-foreground">
                    {submission.missingMaterials.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Section>
          ) : null}

          {reviewerProgress.total > 0 && (
            <Section title="Reviewer Progress">
              <div className="rounded-xl border border-border bg-background p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">Reviews completed</span>
                  <span className="font-semibold text-primary">
                    {reviewerProgress.completed}/{reviewerProgress.total}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${reviewerProgress.total ? (reviewerProgress.completed / reviewerProgress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <ul className="mt-3 space-y-2 border-t border-border/70 pt-3">
                  {reviewerProgress.reviews.map((review) => (
                    <li key={review.reviewerId} className="text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">{review.reviewerName}</span>
                        <span className="text-muted-foreground">{review.status}</span>
                      </div>
                      {review.recommendation ? (
                        <p className="mt-0.5 text-muted-foreground">{review.recommendation}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </Section>
          )}

          <Section title="Artist Statement" action="View full">
            <p className="text-sm leading-relaxed text-muted-foreground">{submission.statement}</p>
          </Section>

          {latestNote ? (
            <Section title="Internal Notes" action="Add note">
              <div className="rounded-xl border border-[oklch(0.9_0.05_85)] bg-[oklch(0.98_0.03_85)] p-3">
                <p className="text-sm leading-relaxed text-foreground">{latestNote.body}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {latestNote.author} &middot; {latestNote.date}
                  </p>
                  <MoreHorizontal className="size-4 text-muted-foreground" />
                </div>
              </div>
            </Section>
          ) : null}

          <Section title="Reviewer Activity" action="View all">
            <ul className="space-y-3">
              {activity.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3">
                  <InitialAvatar name={entry.actor === "System" ? "KLEIO" : entry.actor} className="size-7 text-[0.6rem]" />
                  <p className="flex-1 text-sm text-foreground">
                    {entry.actor !== "System" && <span className="font-medium">{entry.actor} </span>}
                    <span className="text-muted-foreground">{entry.action}</span>
                  </p>
                  <span className="text-xs text-muted-foreground">{entry.date}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>

      <div className="border-t border-border bg-card/95 p-4">
        {confirmation && (
          <div
            role="status"
            className="mb-3 flex items-start gap-2 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-3 py-2 text-xs leading-relaxed text-[oklch(0.4_0.12_150)]"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <span>
              {confirmation} <span className="opacity-70">(demo only — no data leaves this session.)</span>
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {primaryAction.href ? (
            <Link
              href={primaryAction.href}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <PrimaryIcon className="size-4" />
              {primaryAction.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmation(getActionConfirmation(primaryAction.label, submission))}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <PrimaryIcon className="size-4" />
              {primaryAction.label}
            </button>
          )}
          <button
            type="button"
            aria-label="More actions"
            className="grid h-11 w-10 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent/50"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
        {secondaryHref ? (
          <Link
            href={secondaryHref}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
          >
            <Mail className="size-4 text-muted-foreground" />
            {secondaryLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmation(getActionConfirmation(secondaryLabel, submission))}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
          >
            <Mail className="size-4 text-muted-foreground" />
            {secondaryLabel}
          </button>
        )}
      </div>
    </aside>
  )
}

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-5 border-t border-border pt-4">
      <div className="mb-2.5 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {action && (
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            {action === "Add note" && <Plus className="size-3.5" />}
            {action}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}
