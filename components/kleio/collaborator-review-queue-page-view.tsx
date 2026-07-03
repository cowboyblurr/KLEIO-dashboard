"use client"

import { useState } from "react"
import { collaboratorAnalytics } from "@/lib/kleio-collaborator-analytics"
import { inkColor, mutedColor, lavenderSoftLine, lavenderDeep, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"

function reviewStatusTone(status: string): "default" | "success" | "warning" | "info" {
  if (status === "Complete") return "success"
  if (status === "In Progress") return "info"
  return "warning"
}

export function CollaboratorReviewQueuePageView() {
  const analytics = collaboratorAnalytics
  const pendingRows = analytics.pendingSubmissions
  const [selectedId, setSelectedId] = useState(pendingRows[0]?.submission.id ?? "")
  const selectedRow = pendingRows.find((row) => row.submission.id === selectedId) ?? pendingRows[0]
  const selectedProgram = analytics.guidelinePrograms.find(
    (program) => program.id === selectedRow?.submission.programId,
  )

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Focused review queue"
          title="Review Queue"
          description="Work through assigned submissions only. Rubric, notes, and recommendation controls are scoped to your review seat."
        />

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border bg-white" style={cardStyle}>
            <div className="border-b px-5 py-4" style={{ borderColor: lavenderSoftLine }}>
              <h2 className="font-serif text-lg font-semibold" style={{ color: inkColor }}>
                Pending assignments
              </h2>
              <p className="mt-1 text-sm" style={{ color: mutedColor }}>
                {pendingRows.length} submission{pendingRows.length === 1 ? "" : "s"} in your queue.
              </p>
            </div>
            <ul className="divide-y" style={{ borderColor: lavenderSoftLine }}>
              {pendingRows.length === 0 ? (
                <li className="px-5 py-8 text-sm" style={{ color: mutedColor }}>
                  No pending reviews. View submitted work in Submitted Reviews.
                </li>
              ) : (
                pendingRows.map((row) => {
                  const active = row.submission.id === selectedRow?.submission.id
                  return (
                    <li key={row.submission.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(row.submission.id)}
                        className={`flex w-full items-start justify-between gap-3 px-5 py-4 text-left transition-colors ${
                          active ? "bg-[#F7F4FF]" : "hover:bg-[#FBFAFF]"
                        }`}
                      >
                        <div>
                          <p className="font-medium" style={{ color: inkColor }}>{row.submission.artist}</p>
                          <p className="text-sm" style={{ color: mutedColor }}>{row.submission.projectTitle}</p>
                        </div>
                        <DemoStatusChip label={row.reviewStatus} tone={reviewStatusTone(row.reviewStatus)} />
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </section>

          <section className="space-y-4">
            {selectedRow ? (
              <>
                <div className="rounded-2xl border bg-white p-5" style={cardStyle}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: lavenderDeep }}>
                    Selected review
                  </p>
                  <h2 className="mt-2 font-serif text-xl font-semibold" style={{ color: inkColor }}>
                    {selectedRow.submission.projectTitle}
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: mutedColor }}>
                    {selectedRow.submission.artist} · {selectedRow.programTitle}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed" style={{ color: inkColor }}>
                    {selectedRow.submission.statement}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <DemoStatusChip label={selectedRow.submission.status} />
                    <DemoStatusChip label={selectedRow.reviewStatus} tone={reviewStatusTone(selectedRow.reviewStatus)} />
                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-5" style={cardStyle}>
                  <h3 className="font-serif text-base font-semibold" style={{ color: inkColor }}>
                    Rubric preview
                  </h3>
                  {selectedProgram ? (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm" style={{ color: mutedColor }}>
                      {selectedProgram.rubric.map((criterion) => (
                        <li key={criterion}>{criterion}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm" style={{ color: mutedColor }}>
                      No rubric available for this program.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border bg-white p-5" style={cardStyle}>
                  <h3 className="font-serif text-base font-semibold" style={{ color: inkColor }}>
                    Review notes
                  </h3>
                  <textarea
                    readOnly
                    placeholder="Draft review notes for this submission…"
                    className="mt-3 min-h-[120px] w-full rounded-xl border bg-[#FBFAFF] px-3 py-2 text-sm"
                    style={{ borderColor: lavenderSoftLine, color: inkColor }}
                    defaultValue=""
                  />
                  <p className="mt-2 text-xs" style={{ color: mutedColor }}>
                    Foundation field — notes stay private to your review seat in this demo.
                  </p>
                </div>

                <div className="rounded-2xl border bg-white p-5" style={cardStyle}>
                  <h3 className="font-serif text-base font-semibold" style={{ color: inkColor }}>
                    Recommendation
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Advance", "Shortlist", "Hold", "Decline"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        disabled
                        title="Demo action"
                        className="rounded-full border px-3 py-1.5 text-xs font-medium opacity-60"
                        style={{ borderColor: lavenderSoftLine, color: mutedColor }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled
                      title="Demo action"
                      className="inline-flex h-9 items-center justify-center rounded-xl border px-4 text-sm font-medium opacity-60"
                      style={{ borderColor: lavenderSoftLine, color: inkColor }}
                    >
                      Save Draft (Demo)
                    </button>
                    <button
                      type="button"
                      disabled
                      title="Demo action"
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground opacity-60"
                    >
                      Submit Review (Demo)
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border bg-white p-8 text-sm" style={{ ...cardStyle, color: mutedColor }}>
                Select a pending assignment to open the review workspace.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
