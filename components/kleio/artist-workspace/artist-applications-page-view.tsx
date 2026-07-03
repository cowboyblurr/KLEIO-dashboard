import Link from "next/link"
import { artistDashboardProfile } from "@/lib/kleio-data"
import { artistAnalytics, formatDemoDateDisplay } from "@/lib/kleio-artist-analytics"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkspaceMetricCard } from "@/components/kleio/workspace-metric-card"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import type { ArtistDashboardApplicationStatus } from "@/lib/kleio-data"

function statusTone(status: ArtistDashboardApplicationStatus): "default" | "success" | "warning" | "info" {
  if (status === "Awarded" || status === "Submitted") return "success"
  if (status === "Draft" || status === "Under Review") return "warning"
  if (status === "Interview") return "info"
  return "default"
}

const nextActionByProgram = Object.fromEntries(
  artistDashboardProfile.nextActions.map((action) => [action.program, action.task]),
)

export function ArtistApplicationsPageView() {
  const analytics = artistAnalytics
  const applications = artistDashboardProfile.applications

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Application tracker"
          title="Applications"
          description="Track drafts, submitted applications, missing materials, responses, and deadlines."
          primaryCta={{ label: "Explore Opportunities", href: "/artist-dashboard/opportunities/" }}
          secondaryCta={{ label: "Review Calendar", href: "/artist-dashboard/calendar/" }}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <WorkspaceMetricCard label="Active applications" value={analytics.activeApplications} />
          <WorkspaceMetricCard label="Draft applications" value={analytics.applicationStatusCounts.Draft} />
          <WorkspaceMetricCard label="Pending decisions" value={analytics.pendingDecisions} />
        </div>

        <section className="overflow-x-auto rounded-2xl border bg-white" style={cardStyle}>
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide" style={{ borderColor: lavenderSoftLine, color: mutedColor }}>
                <th className="px-5 py-3">Program</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Due Date</th>
                <th className="px-3 py-3">Updated</th>
                <th className="px-3 py-3">Next Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.program} className="border-b" style={{ borderColor: lavenderSoftLine }}>
                  <td className="px-5 py-3 font-medium" style={{ color: inkColor }}>{app.program}</td>
                  <td className="px-3 py-3"><DemoStatusChip label={app.status} tone={statusTone(app.status)} /></td>
                  <td className="px-3 py-3" style={{ color: mutedColor }}>{formatDemoDateDisplay(app.dueDate)}</td>
                  <td className="px-3 py-3" style={{ color: mutedColor }}>{app.updated}</td>
                  <td className="px-3 py-3" style={{ color: inkColor }}>{nextActionByProgram[app.program] ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <WorkflowCard title="Next actions" body={`${analytics.nextActionsCount} tracked actions across open applications.`}>
            <ul className="space-y-2 text-sm" style={{ color: mutedColor }}>
              {artistDashboardProfile.nextActions.map((action) => (
                <li key={action.program}>{action.program} — {action.task}</li>
              ))}
            </ul>
          </WorkflowCard>
          <WorkflowCard title="Deadline pressure" body={`${analytics.dueSoon} deadlines arrive within the next 14 days. Next: ${analytics.nextDeadline}.`}>
            <Link href="/artist-dashboard/calendar/" className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
              Open calendar →
            </Link>
          </WorkflowCard>
        </div>
      </div>
    </main>
  )
}
