import Link from "next/link"
import { collaboratorAnalytics } from "@/lib/kleio-collaborator-analytics"
import { inkColor, mutedColor, lavenderSoftLine, lavenderDeep, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkspaceMetricCard } from "@/components/kleio/workspace-metric-card"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"

export function CollaboratorSubmittedPageView() {
  const analytics = collaboratorAnalytics
  const rows = analytics.completedSubmissions

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Review record"
          title="Submitted Reviews"
          description="Your completed reviews and recommendations for assigned submissions."
          secondaryCta={{ label: "Back to Queue", href: "/collaborator-dashboard/review-queue/" }}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <WorkspaceMetricCard label="Submitted" value={analytics.completedReviews} />
          <WorkspaceMetricCard label="Completion rate" value={`${analytics.completionRate}%`} />
          <WorkspaceMetricCard label="Pending vote context" value={analytics.pendingVoteCount} />
        </div>

        <section className="overflow-x-auto rounded-2xl border bg-white" style={cardStyle}>
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide" style={{ borderColor: lavenderSoftLine, color: mutedColor }}>
                <th className="px-5 py-3">Artist</th>
                <th className="px-3 py-3">Project</th>
                <th className="px-3 py-3">Program</th>
                <th className="px-3 py-3">Score</th>
                <th className="px-3 py-3">Recommendation</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-sm" style={{ color: mutedColor }}>
                    No submitted reviews yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.submission.id} className="border-b" style={{ borderColor: lavenderSoftLine }}>
                    <td className="px-5 py-3 font-medium" style={{ color: inkColor }}>{row.submission.artist}</td>
                    <td className="px-3 py-3" style={{ color: inkColor }}>{row.submission.projectTitle}</td>
                    <td className="px-3 py-3" style={{ color: mutedColor }}>{row.programTitle}</td>
                    <td className="px-3 py-3" style={{ color: inkColor }}>
                      {row.score != null ? row.score : "Recorded without score"}
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
            Return to overview
          </Link>
        </p>
      </div>
    </main>
  )
}
