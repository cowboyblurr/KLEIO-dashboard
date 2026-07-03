import Link from "next/link"
import { inkColor, mutedColor, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"

const insights = [
  { title: "Material gaps", body: "Work samples and references are the two passport items most likely to slow high-fit applications.", tag: "Suggested", tone: "warning" as const },
  { title: "Opportunity alignment", body: "Grants focused on light, memory, and installation show the strongest alignment with your current practice language.", tag: "Prepared for review", tone: "info" as const },
  { title: "Deadline pressure", body: "Two deadlines arrive within the next two weeks. Budget upload is the highest-priority next action.", tag: "Suggested", tone: "warning" as const },
  { title: "Collaborator signals", body: "Three artists share overlapping themes in archives, material culture, and community practice.", tag: "You decide what gets used", tone: "default" as const },
]

export function ArtistInsightsPageView() {
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
            <WorkflowCard key={insight.title} title={insight.title} body={insight.body}>
              <DemoStatusChip label={insight.tag} tone={insight.tone} />
            </WorkflowCard>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <h3 className="text-sm font-semibold" style={{ color: inkColor }}>Material readiness</h3>
            <p className="mt-2 font-serif text-2xl font-semibold" style={{ color: inkColor }}>87%</p>
            <p className="mt-1 text-xs" style={{ color: mutedColor }}>4 of 6 core materials ready</p>
          </section>
          <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <h3 className="text-sm font-semibold" style={{ color: inkColor }}>Active opportunities</h3>
            <p className="mt-2 font-serif text-2xl font-semibold" style={{ color: inkColor }}>5</p>
            <p className="mt-1 text-xs" style={{ color: mutedColor }}>Matched to current passport</p>
          </section>
          <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <h3 className="text-sm font-semibold" style={{ color: inkColor }}>Applications in motion</h3>
            <p className="mt-2 font-serif text-2xl font-semibold" style={{ color: inkColor }}>4</p>
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
