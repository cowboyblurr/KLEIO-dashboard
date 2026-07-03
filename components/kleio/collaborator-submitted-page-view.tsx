"use client"

import Link from "next/link"
import { collaboratorAnalytics } from "@/lib/kleio-collaborator-analytics"
import { inkColor, mutedColor, lavenderSoftLine, lavenderDeep, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkspaceMetricCard } from "@/components/kleio/workspace-metric-card"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

export function CollaboratorSubmittedPageView() {
  const { t } = useKleioLocale()
  const analytics = collaboratorAnalytics
  const rows = analytics.completedSubmissions

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow={t("collaborator.submitted.eyebrow")}
          title={t("collaborator.submitted.title")}
          description={t("collaborator.submitted.description")}
          secondaryCta={{ label: t("collaborator.submitted.cta.backToQueue"), href: "/collaborator-dashboard/review-queue/" }}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <WorkspaceMetricCard label={t("collaborator.submitted.metric.submitted")} value={analytics.completedReviews} />
          <WorkspaceMetricCard label={t("collaborator.submitted.metric.completionRate")} value={`${analytics.completionRate}%`} />
          <WorkspaceMetricCard label={t("collaborator.submitted.metric.pendingVoteContext")} value={analytics.pendingVoteCount} />
        </div>

        <section className="overflow-x-auto rounded-2xl border bg-white" style={cardStyle}>
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide" style={{ borderColor: lavenderSoftLine, color: mutedColor }}>
                <th className="px-5 py-3">{t("collaborator.submitted.column.artist")}</th>
                <th className="px-3 py-3">{t("collaborator.submitted.column.project")}</th>
                <th className="px-3 py-3">{t("collaborator.submitted.column.program")}</th>
                <th className="px-3 py-3">{t("collaborator.submitted.column.score")}</th>
                <th className="px-3 py-3">{t("collaborator.submitted.column.recommendation")}</th>
                <th className="px-3 py-3">{t("collaborator.submitted.column.status")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-sm" style={{ color: mutedColor }}>
                    {t("collaborator.submitted.empty")}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.submission.id} className="border-b" style={{ borderColor: lavenderSoftLine }}>
                    <td className="px-5 py-3 font-medium" style={{ color: inkColor }}>{row.submission.artist}</td>
                    <td className="px-3 py-3" style={{ color: inkColor }}>{row.submission.projectTitle}</td>
                    <td className="px-3 py-3" style={{ color: mutedColor }}>{row.programTitle}</td>
                    <td className="px-3 py-3" style={{ color: inkColor }}>
                      {row.score != null ? row.score : t("collaborator.submitted.recordedWithoutScore")}
                    </td>
                    <td className="px-3 py-3" style={{ color: mutedColor }}>
                      {row.recommendation ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <DemoStatusChip label={row.reviewStatus} tone="success" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <p className="text-xs" style={{ color: mutedColor }}>
          <Link href="/collaborator-dashboard/" className="font-medium" style={{ color: lavenderDeep }}>
            {t("collaborator.submitted.returnToOverview")}
          </Link>
        </p>
      </div>
    </main>
  )
}
