import Link from "next/link"
import { artistAnalytics } from "@/lib/kleio-artist-analytics"
import { inkColor, mutedColor, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"

const insights = [
  {
    title: "Material gaps",
    bodyKey: "materials" as const,
    tag: "Suggested",
    tone: "warning" as const,
  },
  {
    title: "Opportunity alignment",
    bodyKey: "opportunities" as const,
    tag: "Prepared for review",
    tone: "info" as const,
  },
  {
    title: "Deadline pressure",
    bodyKey: "deadlines" as const,
    tag: "Suggested",
    tone: "warning" as const,
  },
  {
    title: "Collaborator signals",
    bodyKey: "collaborators" as const,
    tag: "You decide what gets used",
    tone: "default" as const,
  },
]

export function ArtistInsightsPageView() {
  const analytics = artistAnalytics
  const materialsGap = analytics.materialsTotalCount - analytics.materialsReadyCount

  const bodyByKey = {
    materials: `${materialsGap} passport material${materialsGap === 1 ? "" : "s"} still need review before high-fit applications.`,
    opportunities: `${analytics.opportunityCount} active opportunities align with your current practice language and funding profile.`,
    deadlines: `${analytics.dueSoon} deadline${analytics.dueSoon === 1 ? "" : "s"} arrive within the next 14 days. Next: ${analytics.nextDeadline}.`,
    collaborators: `${analytics.collaboratorMatchCount} collaborator matches share overlapping themes in your current spectrum.`,
  }

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Quiet insights"
          title="Quiet Insights"
          description="Review practical signals about your materials, opportunities, deadlines, and application readiness."
          primaryCta={{ label: "Review Passport", href: "/artist-dashboard/passport/" }}
          secondaryCta={{ label: "Explore Opportunities", href: "/artist-dashboard/opportunities/" }}
        />

        <p className="rounded-2xl border bg-[#F7F4FF] px-4 py-3 text-sm" style={{ borderColor: "#E7E1F7", color: mutedColor }}>
          Insights are prepared for review. You decide what gets used — KLEIO surfaces signals, not judgments.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((insight) => (
            <WorkflowCard key={insight.title} title={insight.title} body={bodyByKey[insight.bodyKey]}>
              <DemoStatusChip label={insight.tag} tone={insight.tone} />
            </WorkflowCard>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <h3 className="text-sm font-semibold" style={{ color: inkColor }}>Material readiness</h3>
            <p className="mt-2 font-serif text-2xl font-semibold" style={{ color: inkColor }}>{analytics.passportCompletenessPct}%</p>
            <p className="mt-1 text-xs" style={{ color: mutedColor }}>
              {analytics.materialsReadyCount} of {analytics.materialsTotalCount} core materials ready
            </p>
          </section>
          <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <h3 className="text-sm font-semibold" style={{ color: inkColor }}>Active opportunities</h3>
            <p className="mt-2 font-serif text-2xl font-semibold" style={{ color: inkColor }}>{analytics.opportunityCount}</p>
            <p className="mt-1 text-xs" style={{ color: mutedColor }}>Matched to current passport</p>
          </section>
          <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <h3 className="text-sm font-semibold" style={{ color: inkColor }}>Applications in motion</h3>
            <p className="mt-2 font-serif text-2xl font-semibold" style={{ color: inkColor }}>{analytics.activeApplications}</p>
            <p className="mt-1 text-xs" style={{ color: mutedColor }}>Drafts, reviews, and interviews</p>
          </section>
        </div>

        <Link href="/artist-dashboard/applications/" className="inline-flex text-sm font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
          Track applications →
        </Link>
      </div>
    </main>
  )
}
