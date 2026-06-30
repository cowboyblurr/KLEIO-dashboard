"use client"

import { useState } from "react"
import {
  analytics,
  getLatestSubmissionNote,
  getShortlistGroups,
  getSubmissionReviewerProgress,
} from "@/lib/kleio-analytics"
import { DemoPageShell, DemoStatRow } from "@/components/kleio/demo-page-shell"
import { StatusPill } from "@/components/kleio/pills"

export function ShortlistPageView() {
  const [exportConfirmation, setExportConfirmation] = useState<string | null>(null)
  const groups = getShortlistGroups()
  const selectedCount = groups.reduce((sum, group) => sum + group.submissions.length, 0)

  return (
    <DemoPageShell
      title="Shortlist"
      description="Curate finalists, compare them side by side, and prepare clean recommendations for committee review."
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-3 xl:max-w-3xl">
          <DemoStatRow label="Shortlisted" value={analytics.shortlistedCount} />
          <DemoStatRow label="Pending committee vote" value={analytics.pendingVoteCount} />
          <DemoStatRow label="Finalist / interview" value={groups[1].submissions.length} />
        </div>
        <button
          type="button"
          onClick={() =>
            setExportConfirmation(
              `Export list prepared for ${selectedCount} candidate${selectedCount === 1 ? "" : "s"} (demo only).`,
            )
          }
          className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Export selection list
        </button>
      </div>

      {exportConfirmation && (
        <p className="mb-4 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-3 py-2 text-xs font-medium text-[oklch(0.4_0.12_150)]">
          {exportConfirmation}
        </p>
      )}

      <div className="space-y-4">
        {groups.map((group) => (
          <section key={group.id} className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-serif text-lg font-semibold text-foreground">{group.label}</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
                {group.submissions.length}
              </span>
            </div>
            {group.submissions.length ? (
              <ul className="divide-y divide-border">
                {group.submissions.map((submission) => {
                  const progress = getSubmissionReviewerProgress(submission.id)
                  const note = getLatestSubmissionNote(submission.id)
                  return (
                    <li key={submission.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{submission.artist}</p>
                          <p className="text-sm text-muted-foreground">
                            {submission.projectTitle} · {submission.program}
                          </p>
                        </div>
                        <StatusPill status={submission.status} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Committee vote: {progress.completed}/{progress.total} reviews
                        </span>
                        <span>Completeness: {submission.completeness}%</span>
                      </div>
                      {note && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{note.body}</p>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="px-5 py-4 text-sm text-muted-foreground">No candidates in this stage.</p>
            )}
          </section>
        ))}
      </div>
    </DemoPageShell>
  )
}
