"use client"

import Link from "next/link"
import { useState } from "react"
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  Plus,
  Star,
} from "lucide-react"
import { artists, allSubmissions, programs, institution } from "@/lib/kleio-data"
import type { Submission } from "@/lib/kleio-data"
import { getSubmissionReviewerProgress } from "@/lib/kleio-analytics"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { StatusPill, PriorityPill } from "@/components/kleio/pills"
import {
  ArtistPassportHero,
  ArtistPassportSections,
  CompletionRing,
} from "@/components/kleio/artist-passport-body"
import { cn } from "@/lib/utils"

function getScenarioLabel(submission: Submission): string {
  switch (submission.scenario) {
    case "strong-shortlist":
      return "Strong shortlist candidate"
    case "deadline-triage":
      return "Deadline triage — action needed"
    case "reviewer-bottleneck":
      return "Reviewer bottleneck — pending vote"
    default:
      return "Under review"
  }
}

function ReviewContextPanel({ submission }: { submission: Submission | undefined }) {
  const [confirmation, setConfirmation] = useState<string | null>(null)

  if (!submission) {
    return (
      <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">No active submission linked to this profile for the current cycle.</p>
      </aside>
    )
  }

  const reviewerProgress = getSubmissionReviewerProgress(submission.id)
  const program = programs.find((p) => p.id === submission.programId)
  const scenarioLabel = getScenarioLabel(submission)

  function fireAction(label: string) {
    setConfirmation(`${label} — recorded in this session.`)
    setTimeout(() => setConfirmation(null), 4000)
  }

  return (
    <aside className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-primary/15 bg-primary/5 px-4 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-primary">{scenarioLabel}</span>
            <span className="text-xs text-muted-foreground">{submission.decisionStage}</span>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Submission</p>
            <p className="font-medium text-foreground">{submission.projectTitle}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{submission.program}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Deadline: {program?.deadline ?? "—"}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={submission.status} />
            <PriorityPill priority={submission.priority} />
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3">
            <CompletionRing value={submission.completeness} size={44} />
            <div>
              <p className="text-sm font-semibold text-foreground">{submission.completeness}% complete</p>
              <p className="text-xs text-muted-foreground">Application materials</p>
            </div>
          </div>

          {submission.missingMaterials?.length ? (
            <div className="rounded-xl border border-[oklch(0.88_0.08_70)] bg-[oklch(0.98_0.035_80)] p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-[oklch(0.62_0.16_65)]" />
                <div>
                  <p className="mb-1 text-xs font-semibold text-[oklch(0.45_0.14_65)]">Missing materials</p>
                  <ul className="space-y-0.5">
                    {submission.missingMaterials.map((item) => (
                      <li key={item} className="text-xs text-[oklch(0.45_0.14_65)]">· {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          {reviewerProgress.total > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">Reviewer progress</p>
                <span className="text-xs font-semibold text-primary">
                  {reviewerProgress.completed}/{reviewerProgress.total}
                </span>
              </div>
              <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(reviewerProgress.completed / reviewerProgress.total) * 100}%` }}
                />
              </div>
              <ul className="space-y-1.5">
                {reviewerProgress.reviews.map((r) => (
                  <li key={r.reviewerId} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <InitialAvatar name={r.reviewerName} className="size-5 text-[0.55rem]" />
                      <span className="text-xs text-foreground">{r.reviewerName}</span>
                    </div>
                    <span
                      className={cn(
                        "text-[0.65rem] font-medium",
                        r.status === "Completed" ? "text-[oklch(0.4_0.13_150)]" : "text-muted-foreground",
                      )}
                    >
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {submission.score !== null && submission.score !== undefined && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Star className="size-3.5 text-[oklch(0.74_0.15_60)]" />
                <span className="text-xs font-medium text-foreground">Committee score</span>
              </div>
              <span className="text-sm font-bold text-foreground">{submission.score}/100</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Institution Actions</p>

        {confirmation && (
          <div
            role="status"
            className="mb-2 flex items-start gap-2 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-3 py-2 text-xs leading-relaxed text-[oklch(0.4_0.12_150)]"
          >
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
            <span>{confirmation} <span className="opacity-70">(demo only)</span></span>
          </div>
        )}

        <button
          type="button"
          onClick={() => fireAction("Moved to shortlist")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Bookmark className="size-4" />
          Move to Shortlist
        </button>
        <button
          type="button"
          onClick={() => fireAction("Information request drafted")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
        >
          <AlertCircle className="size-4 text-muted-foreground" />
          Request Additional Information
        </button>
        <button
          type="button"
          onClick={() => fireAction("Internal note added")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
        >
          <Plus className="size-4 text-muted-foreground" />
          Add Internal Note
        </button>
        <Link
          href="/messages/"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
        >
          <MessageSquare className="size-4 text-muted-foreground" />
          Message Artist
        </Link>
      </div>

      <Link
        href="/review-queue/"
        className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Review Queue
      </Link>
    </aside>
  )
}

export function ArtistPassportView({ artistId }: { artistId: string }) {
  const artist = artists.find((a) => a.id === artistId)
  const submission = allSubmissions.find((s) => s.artistId === artistId)

  if (!artist) {
    return (
      <main className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="font-serif text-xl text-foreground">Artist not found</p>
          <Link href="/artists/" className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80">
            <ArrowLeft className="size-4" />
            Back to Artists
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-[1400px] px-5 py-6 xl:px-8 xl:py-7">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/review-queue/" className="transition-colors hover:text-foreground">Review Queue</Link>
            <ChevronRight className="size-3.5" />
            <span className="font-medium text-foreground">{artist.name}</span>
          </div>
          <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {institution.demoLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
          <div className="min-w-0 space-y-6">
            <ArtistPassportHero artist={artist} mode="institution" />
            <ArtistPassportSections artist={artist} mode="institution" />
          </div>
          <div className="lg:sticky lg:top-0">
            <ReviewContextPanel submission={submission} />
          </div>
        </div>
      </div>
    </main>
  )
}
