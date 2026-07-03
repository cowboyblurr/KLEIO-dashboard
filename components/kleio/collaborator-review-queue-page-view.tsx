"use client"

import { useState } from "react"
import { collaboratorAnalytics } from "@/lib/kleio-collaborator-analytics"
import { inkColor, mutedColor, lavenderSoftLine, lavenderDeep, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

function reviewStatusTone(status: string): "default" | "success" | "warning" | "info" {
  if (status === "Complete") return "success"
  if (status === "In Progress") return "info"
  return "warning"
}

const RECOMMENDATION_KEYS = [
  "collaborator.reviewQueue.recommendation.advance",
  "collaborator.reviewQueue.recommendation.shortlist",
  "collaborator.reviewQueue.recommendation.hold",
  "collaborator.reviewQueue.recommendation.decline",
] as const

export function CollaboratorReviewQueuePageView() {
  const { t } = useKleioLocale()
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
          eyebrow={t("collaborator.reviewQueue.eyebrow")}
          title={t("collaborator.reviewQueue.title")}
          description={t("collaborator.reviewQueue.description")}
        />

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border bg-white" style={cardStyle}>
            <div className="border-b px-5 py-4" style={{ borderColor: lavenderSoftLine }}>
              <h2 className="font-serif text-lg font-semibold" style={{ color: inkColor }}>
                {t("collaborator.reviewQueue.section.pending")}
              </h2>
              <p className="mt-1 text-sm" style={{ color: mutedColor }}>
                {pendingRows.length === 1
                  ? t("collaborator.reviewQueue.queueCountOne", { count: pendingRows.length })
                  : t("collaborator.reviewQueue.queueCountOther", { count: pendingRows.length })}
              </p>
            </div>
            <ul className="divide-y" style={{ borderColor: lavenderSoftLine }}>
              {pendingRows.length === 0 ? (
                <li className="px-5 py-8 text-sm" style={{ color: mutedColor }}>
                  {t("collaborator.reviewQueue.empty")}
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
                    {t("collaborator.reviewQueue.selectedReview")}
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
                    {t("collaborator.reviewQueue.rubricPreview")}
                  </h3>
                  {selectedProgram ? (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm" style={{ color: mutedColor }}>
                      {selectedProgram.rubric.map((criterion) => (
                        <li key={criterion}>{criterion}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm" style={{ color: mutedColor }}>
                      {t("collaborator.reviewQueue.noRubric")}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border bg-white p-5" style={cardStyle}>
                  <h3 className="font-serif text-base font-semibold" style={{ color: inkColor }}>
                    {t("collaborator.reviewQueue.reviewNotes")}
                  </h3>
                  <textarea
                    readOnly
                    placeholder={t("collaborator.reviewQueue.notesPlaceholder")}
                    className="mt-3 min-h-[120px] w-full rounded-xl border bg-[#FBFAFF] px-3 py-2 text-sm"
                    style={{ borderColor: lavenderSoftLine, color: inkColor }}
                    defaultValue=""
                  />
                  <p className="mt-2 text-xs" style={{ color: mutedColor }}>
                    {t("collaborator.reviewQueue.notesFootnote")}
                  </p>
                </div>

                <div className="rounded-2xl border bg-white p-5" style={cardStyle}>
                  <h3 className="font-serif text-base font-semibold" style={{ color: inkColor }}>
                    {t("collaborator.reviewQueue.recommendation")}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {RECOMMENDATION_KEYS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        disabled
                        title={t("collaborator.reviewQueue.demoAction")}
                        className="rounded-full border px-3 py-1.5 text-xs font-medium opacity-60"
                        style={{ borderColor: lavenderSoftLine, color: mutedColor }}
                      >
                        {t(key)}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled
                      title={t("collaborator.reviewQueue.demoAction")}
                      className="inline-flex h-9 items-center justify-center rounded-xl border px-4 text-sm font-medium opacity-60"
                      style={{ borderColor: lavenderSoftLine, color: inkColor }}
                    >
                      {t("collaborator.reviewQueue.saveDraftDemo")}
                    </button>
                    <button
                      type="button"
                      disabled
                      title={t("collaborator.reviewQueue.demoAction")}
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground opacity-60"
                    >
                      {t("collaborator.reviewQueue.submitReviewDemo")}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border bg-white p-8 text-sm" style={{ ...cardStyle, color: mutedColor }}>
                {t("collaborator.reviewQueue.selectAssignment")}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
