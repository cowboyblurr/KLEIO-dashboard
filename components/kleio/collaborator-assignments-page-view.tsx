"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  collaboratorAnalytics,
  formatCollaboratorDeadline,
  formatDaysUntilDeadline,
} from "@/lib/kleio-collaborator-analytics"
import { inkColor, mutedColor, lavenderSoftLine, lavenderDeep, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkspaceMetricCard } from "@/components/kleio/workspace-metric-card"
import { SearchFilterBar } from "@/components/kleio/search-filter-bar"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

function reviewStatusTone(status: string): "default" | "success" | "warning" | "info" {
  if (status === "Complete") return "success"
  if (status === "In Progress") return "info"
  return "warning"
}

export function CollaboratorAssignmentsPageView() {
  const { locale, t } = useKleioLocale()
  const analytics = collaboratorAnalytics
  const [query, setQuery] = useState("")

  const formatDaysLocal = (days: number | null) => formatDaysUntilDeadline(days, locale)

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return analytics.assignedSubmissions

    return analytics.assignedSubmissions.filter((row) => {
      const haystack = [
        row.submission.artist,
        row.submission.projectTitle,
        row.programTitle,
        row.submission.status,
        row.reviewStatus,
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(normalized)
    })
  }, [analytics.assignedSubmissions, query])

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow={t("collaborator.assignments.eyebrow")}
          title={t("collaborator.assignments.title")}
          description={t("collaborator.assignments.description")}
          primaryCta={{ label: t("collaborator.assignments.cta.openReviewQueue"), href: "/collaborator-dashboard/review-queue/" }}
        />

        <div className="grid gap-4 sm:grid-cols-4">
          <WorkspaceMetricCard label={t("collaborator.assignments.metric.assigned")} value={analytics.assignedReviews} />
          <WorkspaceMetricCard label={t("collaborator.assignments.metric.pendingReview")} value={analytics.pendingReviews} />
          <WorkspaceMetricCard label={t("collaborator.assignments.metric.inProgress")} value={analytics.inProgressReviews} />
          <WorkspaceMetricCard label={t("collaborator.assignments.metric.completed")} value={analytics.completedReviews} />
        </div>

        <SearchFilterBar
          value={query}
          onChange={setQuery}
          placeholder={t("collaborator.assignments.searchPlaceholder")}
        />

        <section className="overflow-x-auto rounded-2xl border bg-white" style={cardStyle}>
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide" style={{ borderColor: lavenderSoftLine, color: mutedColor }}>
                <th className="px-5 py-3">{t("collaborator.assignments.column.artist")}</th>
                <th className="px-3 py-3">{t("collaborator.assignments.column.project")}</th>
                <th className="px-3 py-3">{t("collaborator.assignments.column.program")}</th>
                <th className="px-3 py-3">{t("collaborator.assignments.column.submission")}</th>
                <th className="px-3 py-3">{t("collaborator.assignments.column.review")}</th>
                <th className="px-3 py-3">{t("collaborator.assignments.column.deadline")}</th>
                <th className="px-3 py-3">{t("collaborator.assignments.column.timing")}</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.submission.id} className="border-b" style={{ borderColor: lavenderSoftLine }}>
                  <td className="px-5 py-3 font-medium" style={{ color: inkColor }}>{row.submission.artist}</td>
                  <td className="px-3 py-3" style={{ color: inkColor }}>{row.submission.projectTitle}</td>
                  <td className="px-3 py-3" style={{ color: mutedColor }}>{row.programTitle}</td>
                  <td className="px-3 py-3">
                    <DemoStatusChip label={row.submission.status} tone="default" />
                  </td>
                  <td className="px-3 py-3">
                    <DemoStatusChip label={row.reviewStatus} tone={reviewStatusTone(row.reviewStatus)} />
                  </td>
                  <td className="px-3 py-3" style={{ color: mutedColor }}>
                    {formatCollaboratorDeadline(row.programDeadline, locale)}
                  </td>
                  <td className="px-3 py-3" style={{ color: mutedColor }}>
                    {formatDaysLocal(row.daysUntilDeadline)}
                  </td>
                  <td className="px-3 py-3">
                    <Link href="/collaborator-dashboard/review-queue/" className="text-xs font-medium" style={{ color: lavenderDeep }}>
                      {t("collaborator.assignments.cta.openReview")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  )
}
