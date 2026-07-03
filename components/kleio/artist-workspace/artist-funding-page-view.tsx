"use client"

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
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

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
  const { locale, t } = useKleioLocale()
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
          eyebrow={t("artist.workspace.funding.eyebrow")}
          title={t("artist.workspace.funding.title")}
          description={t("artist.workspace.funding.description")}
          primaryCta={{ label: t("artist.workspace.funding.cta.exploreOpportunities"), href: "/artist-dashboard/opportunities/" }}
          secondaryCta={{ label: t("artist.workspace.funding.cta.reviewPassport"), href: "/artist-dashboard/passport/" }}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <WorkspaceMetricCard label={t("artist.workspace.funding.metric.potentialFunding")} value={formatArtistCurrency(analytics.potentialFunding, locale)} />
          <WorkspaceMetricCard label={t("artist.workspace.funding.metric.estimatedFit")} value={formatArtistPct(fundingReadiness.estimatedFit, locale)} />
          <WorkspaceMetricCard label={t("artist.workspace.funding.metric.completeness")} value={`${fundingReadiness.completeness}%`} />
          <WorkspaceMetricCard label={t("artist.workspace.funding.metric.timelineConfidence")} value={`${fundingReadiness.timelineConfidence}%`} />
        </div>

        <section className="overflow-x-auto rounded-2xl border bg-white" style={cardStyle}>
          <div className="border-b px-5 py-4" style={{ borderColor: lavenderSoftLine }}>
            <h2 className="font-serif text-lg font-semibold" style={{ color: inkColor }}>
              {t("artist.workspace.funding.section.opportunities")}
            </h2>
          </div>
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide" style={{ borderColor: lavenderSoftLine, color: mutedColor }}>
                <th className="px-5 py-3">{t("artist.workspace.funding.column.program")}</th>
                <th className="px-3 py-3">{t("artist.workspace.funding.column.amount")}</th>
                <th className="px-3 py-3">{t("artist.workspace.funding.column.fit")}</th>
                <th className="px-3 py-3">{t("artist.workspace.funding.column.completeness")}</th>
                <th className="px-3 py-3">{t("artist.workspace.funding.column.timeline")}</th>
              </tr>
            </thead>
            <tbody>
              {fundingRows.map((row) => (
                  <tr key={row.program} className="border-b" style={{ borderColor: lavenderSoftLine }}>
                    <td className="px-5 py-3 font-medium" style={{ color: inkColor }}>{row.program}</td>
                    <td className="px-3 py-3" style={{ color: inkColor }}>{formatArtistCurrency(row.fundingAmount ?? 0, locale)}</td>
                    <td className="px-3 py-3">
                      {row.fitScore != null ? (
                        <div className="w-24"><ProgressBar value={row.fitScore} /></div>
                      ) : (
                        <DemoStatusChip label={t("status.preparedForScoring")} tone="default" />
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

        <WorkflowCard
          title={t("artist.workspace.funding.missingRisk.title")}
          body={
            missingMaterialApps.length === 1
              ? t("artist.workspace.funding.missingRisk.bodyOne", { count: missingMaterialApps.length })
              : t("artist.workspace.funding.missingRisk.bodyOther", { count: missingMaterialApps.length })
          }
        >
          <div className="flex flex-wrap gap-2">
            {missingMaterialApps.map((app) => (
              <DemoStatusChip
                key={app.program}
                label={t("artist.workspace.funding.missingChip", {
                  program: app.program,
                  count: app.missingMaterialCount ?? 0,
                })}
                tone="warning"
                translate={false}
              />
            ))}
          </div>
          <Link href="/artist-dashboard/passport/" className="mt-3 inline-block text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
            {t("artist.workspace.funding.cta.reviewPassportMaterials")}
          </Link>
        </WorkflowCard>
      </div>
    </main>
  )
}
