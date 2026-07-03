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

function reviewStatusTone(status: string): "default" | "success" | "warning" | "info" {
  if (status === "Complete") return "success"
  if (status === "In Progress") return "info"
  return "warning"
}

export function CollaboratorAssignmentsPageView() {
  const analytics = collaboratorAnalytics
  const [query, setQuery] = useState("")

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
          eyebrow="Assigned submissions"
          title="My Assignments"
          description="Only submissions assigned to you for review. No global artist directory or institution-wide queue."
          primaryCta={{ label: "Open Review Queue", href: "/collaborator-dashboard/review-queue/" }}
        />

        <div className="grid gap-4 sm:grid-cols-4">
          <WorkspaceMetricCard label="Assigned" value={analytics.assignedReviews} />
          <WorkspaceMetricCard label="Pending review" value={analytics.pendingReviews} />
          <WorkspaceMetricCard label="In progress" value={analytics.inProgressReviews} />
          <WorkspaceMetricCard label="Completed" value={analytics.completedReviews} />
        </div>

        <SearchFilterBar
          value={query}
          onChange={setQuery}
          placeholder="Search artist, project, program, or status…"
        />

        <section className="overflow-x-auto rounded-2xl border bg-white" style={cardStyle}>
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide" style={{ borderColor: lavenderSoftLine, color: mutedColor }}>
                <th className="px-5 py-3">Artist</th>
                <th className="px-3 py-3">Project</th>
                <th className="px-3 py-3">Program</th>
                <th className="px-3 py-3">Submission</th>
                <th className="px-3 py-3">Review</th>
                <th className="px-3 py-3">Deadline</th>
                <th className="px-3 py-3">Timing</th>
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
                    {formatCollaboratorDeadline(row.programDeadline)}
                  </td>
                  <td className="px-3 py-3" style={{ color: mutedColor }}>
                    {formatDaysUntilDeadline(row.daysUntilDeadline)}
                  </td>
                  <td className="px-3 py-3">
                    <Link href="/collaborator-dashboard/review-queue/" className="text-xs font-medium" style={{ color: lavenderDeep }}>
                      Open Review
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
