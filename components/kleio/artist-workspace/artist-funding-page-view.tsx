import Link from "next/link"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkspaceMetricCard } from "@/components/kleio/workspace-metric-card"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"

const fundingRows = [
  { program: "Lumen Arts Grant", amount: "$25,000", fit: 92, completeness: 87, timeline: 68 },
  { program: "Caribbean Futures Fund", amount: "$18,000", fit: 88, completeness: 100, timeline: 74 },
  { program: "Citywide Artist Award", amount: "$12,500", fit: 81, completeness: 75, timeline: 55 },
  { program: "Northern Light Fellowship", amount: "$40,000", fit: 74, completeness: 67, timeline: 42 },
]

function ProgressBar({ value, tone = "lavender" }: { value: number; tone?: "lavender" | "green" | "amber" }) {
  const colors = { lavender: "#5B4B8A", green: "oklch(0.6 0.13 150)", amber: "oklch(0.7 0.14 70)" }
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[#F1ECFB]">
      <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: colors[tone] }} />
    </div>
  )
}

export function ArtistFundingPageView() {
  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Funding readiness"
          title="Funding"
          description="Understand potential funding, application readiness, and opportunity fit across grants and programs."
          primaryCta={{ label: "Explore Opportunities", href: "/artist-dashboard/opportunities/" }}
          secondaryCta={{ label: "Review Passport", href: "/artist-dashboard/passport/" }}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <WorkspaceMetricCard label="Potential funding" value="$184,500" />
          <WorkspaceMetricCard label="Estimated fit" value="76%" />
          <WorkspaceMetricCard label="Completeness" value="87%" />
          <WorkspaceMetricCard label="Timeline confidence" value="68%" />
        </div>

        <section className="overflow-x-auto rounded-2xl border bg-white" style={cardStyle}>
          <div className="border-b px-5 py-4" style={{ borderColor: lavenderSoftLine }}>
            <h2 className="font-serif text-lg font-semibold" style={{ color: inkColor }}>Funding opportunities</h2>
          </div>
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide" style={{ borderColor: lavenderSoftLine, color: mutedColor }}>
                <th className="px-5 py-3">Program</th>
                <th className="px-3 py-3">Amount</th>
                <th className="px-3 py-3">Fit</th>
                <th className="px-3 py-3">Completeness</th>
                <th className="px-3 py-3">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {fundingRows.map((row) => (
                <tr key={row.program} className="border-b" style={{ borderColor: lavenderSoftLine }}>
                  <td className="px-5 py-3 font-medium" style={{ color: inkColor }}>{row.program}</td>
                  <td className="px-3 py-3" style={{ color: inkColor }}>{row.amount}</td>
                  <td className="px-3 py-3"><div className="w-24"><ProgressBar value={row.fit} /></div></td>
                  <td className="px-3 py-3"><div className="w-24"><ProgressBar value={row.completeness} tone="green" /></div></td>
                  <td className="px-3 py-3"><div className="w-24"><ProgressBar value={row.timeline} tone="amber" /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <WorkflowCard title="Missing-material risk" body="Two high-fit opportunities still depend on materials not yet marked ready in your passport.">
          <div className="flex flex-wrap gap-2">
            <DemoStatusChip label="Budget outline missing" tone="warning" />
            <DemoStatusChip label="References pending" tone="warning" />
          </div>
          <Link href="/artist-dashboard/passport/" className="mt-3 inline-block text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
            Review passport materials →
          </Link>
        </WorkflowCard>
      </div>
    </main>
  )
}
