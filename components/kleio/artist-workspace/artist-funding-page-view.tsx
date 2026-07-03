import Link from "next/link"
import { artistDashboardProfile } from "@/lib/kleio-data"
import {
  artistAnalytics,
  formatArtistCurrency,
  formatArtistPct,
  isApplicationTimelineReady,
} from "@/lib/kleio-artist-analytics"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkspaceMetricCard } from "@/components/kleio/workspace-metric-card"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"

const ACTIVE_STATUSES = new Set(["Draft", "Submitted", "Under Review", "Waiting", "Interview"])

function ProgressBar({ value, tone = "lavender" }: { value: number; tone?: "lavender" | "green" | "amber" }) {
  const colors = { lavender: "#5B4B8A", green: "oklch(0.6 0.13 150)", amber: "oklch(0.7 0.14 70)" }
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[#F1ECFB]">
      <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: colors[tone] }} />
    </div>
  )
}

export function ArtistFundingPageView() {
  const analytics = artistAnalytics
  const { fundingReadiness } = analytics

  const fundingRows = artistDashboardProfile.applications
    .filter((app) => ACTIVE_STATUSES.has(app.status))
    .filter((app) => typeof app.fundingAmount === "number")

  const missingMaterialApps = fundingRows.filter((app) => (app.missingMaterialCount ?? 0) > 0)

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
          <WorkspaceMetricCard label="Potential funding" value={formatArtistCurrency(analytics.potentialFunding)} />
          <WorkspaceMetricCard label="Estimated fit" value={formatArtistPct(fundingReadiness.estimatedFit)} />
          <WorkspaceMetricCard label="Completeness" value={`${fundingReadiness.completeness}%`} />
          <WorkspaceMetricCard label="Timeline confidence" value={`${fundingReadiness.timelineConfidence}%`} />
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
                    <td className="px-3 py-3" style={{ color: inkColor }}>{formatArtistCurrency(row.fundingAmount ?? 0)}</td>
                    <td className="px-3 py-3">
                      {row.fitScore != null ? (
                        <div className="w-24"><ProgressBar value={row.fitScore} /></div>
                      ) : (
                        <span className="text-xs" style={{ color: mutedColor }}>Prepared for scoring</span>
                      )}
                    </td>
                    <td className="px-3 py-3"><div className="w-24"><ProgressBar value={fundingReadiness.completeness} tone="green" /></div></td>
                    <td className="px-3 py-3">
                      <div className="w-24">
                        <ProgressBar value={isApplicationTimelineReady(row) ? 100 : 0} tone="amber" />
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>

        <WorkflowCard title="Missing-material risk" body={`${missingMaterialApps.length} active opportunit${missingMaterialApps.length === 1 ? "y depends" : "ies depend"} on materials not yet marked ready in your passport.`}>
          <div className="flex flex-wrap gap-2">
            {missingMaterialApps.map((app) => (
              <DemoStatusChip
                key={app.program}
                label={`${app.program}: ${app.missingMaterialCount} missing`}
                tone="warning"
              />
            ))}
          </div>
          <Link href="/artist-dashboard/passport/" className="mt-3 inline-block text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
            Review passport materials →
          </Link>
        </WorkflowCard>
      </div>
    </main>
  )
}
