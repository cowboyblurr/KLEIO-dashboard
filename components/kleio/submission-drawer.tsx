"use client"

import Image from "next/image"
import {
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  MoreHorizontal,
  Plus,
  Bookmark,
  X,
} from "lucide-react"
import type { Submission } from "@/lib/kleio-data"
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
  return (
    <aside className="flex max-h-[min(42rem,calc(100vh-5rem))] w-full shrink-0 flex-col border-t border-border bg-card xl:h-full xl:max-h-none xl:w-[24rem] xl:border-l xl:border-t-0">
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
        <div className="p-5">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted">
            <Image
              src={submission.image || "/placeholder.svg"}
              alt={`${submission.projectTitle} by ${submission.artist}`}
              fill
              sizes="384px"
              className="object-cover"
            />
          </div>

          <div className="mt-4 flex min-w-0 items-start gap-2">
            <h3 className="min-w-0 font-serif text-xl font-semibold text-foreground">
              {submission.artist}
            </h3>
            <BadgeCheck className="mt-1 size-4 shrink-0 text-primary" />
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {submission.location} &middot; {submission.discipline} &middot;{" "}
            {submission.medium}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-accent/40 p-3">
            <CompletionRing value={submission.completeness} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {submission.program}
              </p>
              <p className="text-xs text-muted-foreground">{submission.programCycle}</p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-primary tabular-nums">
              {submission.completeness}% Complete
            </span>
          </div>

          <Section title="Artist Statement" action="View full">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {submission.statement}
            </p>
          </Section>

          <Section title="Internal Notes" action="Add note">
            <div className="rounded-xl border border-[oklch(0.9_0.05_85)] bg-[oklch(0.98_0.03_85)] p-3">
              <p className="text-sm leading-relaxed text-foreground">
                {submission.internalNote.body}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {submission.internalNote.author} &middot;{" "}
                  {submission.internalNote.date}
                </p>
                <MoreHorizontal className="size-4 text-muted-foreground" />
              </div>
            </div>
          </Section>

          <Section title="Reviewer Activity" action="View all">
            <ul className="space-y-3">
              {submission.activity.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3">
                  <InitialAvatar
                    name={entry.actor === "System" ? "ISCP" : entry.actor}
                    className="size-7 text-[0.6rem]"
                  />
                  <p className="flex-1 text-sm text-foreground">
                    {entry.actor !== "System" && (
                      <span className="font-medium">{entry.actor} </span>
                    )}
                    <span className="text-muted-foreground">{entry.action}</span>
                  </p>
                  <span className="text-xs text-muted-foreground">{entry.date}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Bookmark className="size-4" />
            Move to Shortlist
          </button>
          <button
            type="button"
            aria-label="More actions"
            className="grid h-11 w-10 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent/50"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
        <button
          type="button"
          className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
        >
          <Mail className="size-4 text-muted-foreground" />
          Request Additional Information
        </button>
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
