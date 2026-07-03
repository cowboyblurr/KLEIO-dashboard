import Link from "next/link"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkspaceMetricCard } from "@/components/kleio/workspace-metric-card"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"
import { WorkflowCard } from "@/components/kleio/workflow-card"

const applications = [
  { program: "Lumen Arts Grant", status: "Draft", due: "May 28, 2025", updated: "Aug 8, 2026", next: "Upload missing budget" },
  { program: "Caribbean Futures Fund", status: "Submitted", due: "Jun 2, 2025", updated: "Aug 1, 2026", next: "Awaiting response" },
  { program: "Citywide Artist Award", status: "Under Review", due: "Jun 6, 2025", updated: "Jul 30, 2026", next: "Submit final draft" },
  { program: "Harbor Foundation Grant", status: "Waiting", due: "—", updated: "Jul 15, 2026", next: "Follow up" },
  { program: "Global Perspectives Residency", status: "Interview", due: "May 30, 2025", updated: "Aug 5, 2026", next: "Prepare notes" },
  { program: "Emerging Voices Prize", status: "Awarded", due: "—", updated: "Jun 20, 2026", next: "Archive result" },
  { program: "Northern Light Fellowship", status: "Declined", due: "—", updated: "May 12, 2026", next: "Save record" },
]

function statusTone(status: string): "default" | "success" | "warning" | "info" {
  if (status === "Awarded" || status === "Submitted") return "success"
  if (status === "Draft" || status === "Under Review") return "warning"
  if (status === "Interview") return "info"
  return "default"
}

export function ArtistApplicationsPageView() {
  const active = applications.filter((a) => !["Awarded", "Declined"].includes(a.status)).length
  const dueSoon = applications.filter((a) => a.due !== "—").length

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
          <WorkspaceMetricCard label="Active applications" value={active} />
          <WorkspaceMetricCard label="With deadlines" value={dueSoon} />
          <WorkspaceMetricCard label="Needs action" value={3} helper="Drafts and missing materials" />
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
                  <td className="px-3 py-3" style={{ color: mutedColor }}>{app.due}</td>
                  <td className="px-3 py-3" style={{ color: mutedColor }}>{app.updated}</td>
                  <td className="px-3 py-3" style={{ color: inkColor }}>{app.next}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <WorkflowCard title="Next actions" body="Three applications need attention before upcoming deadlines.">
            <ul className="space-y-2 text-sm" style={{ color: mutedColor }}>
              <li>Lumen Arts Grant — upload budget outline</li>
              <li>Citywide Artist Award — submit final draft</li>
              <li>Global Perspectives Residency — prepare interview notes</li>
            </ul>
          </WorkflowCard>
          <WorkflowCard title="Deadline pressure" body="Two deadlines arrive within the next two weeks.">
            <Link href="/artist-dashboard/calendar/" className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
              Open calendar →
            </Link>
          </WorkflowCard>
        </div>
      </div>
    </main>
  )
}
