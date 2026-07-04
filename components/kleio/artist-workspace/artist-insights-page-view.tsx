"use client"

import Link from "next/link"
import { artistAnalytics, formatArtistNextDeadline } from "@/lib/kleio-artist-analytics"
import { inkColor, mutedColor, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

export function ArtistInsightsPageView() {
  const { t, locale } = useKleioLocale()
  const analytics = artistAnalytics
  const materialsGap = analytics.materialsTotalCount - analytics.materialsReadyCount

  const insights = [
    {
      titleKey: "artist.workspace.insights.card.materialGaps.title",
      body: t("artist.workspace.insights.card.materialGaps.body", { count: materialsGap }),
      tagKey: "artist.workspace.insights.tag.suggested",
      tone: "warning" as const,
    },
    {
      titleKey: "artist.workspace.insights.card.opportunityAlignment.title",
      body: t("artist.workspace.insights.card.opportunityAlignment.body", { count: analytics.opportunityCount }),
      tagKey: "artist.workspace.insights.tag.preparedForReview",
      tone: "info" as const,
    },
    {
      titleKey: "artist.workspace.insights.card.deadlinePressure.title",
      body: t("artist.workspace.insights.card.deadlinePressure.body", {
        count: analytics.dueSoon,
        date: formatArtistNextDeadline(analytics.nextDeadline, locale),
      }),
      tagKey: "artist.workspace.insights.tag.suggested",
      tone: "warning" as const,
    },
    {
      titleKey: "artist.workspace.insights.card.collaboratorSignals.title",
      body: t("artist.workspace.insights.card.collaboratorSignals.body", { count: analytics.collaboratorMatchCount }),
      tagKey: "artist.workspace.insights.tag.youDecide",
      tone: "default" as const,
    },
  ]

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow={t("artist.workspace.insights.eyebrow")}
          title={t("artist.workspace.insights.title")}
          description={t("artist.workspace.insights.description")}
          primaryCta={{ label: t("artist.workspace.insights.cta.reviewPassport"), href: "/artist-dashboard/passport/" }}
          secondaryCta={{ label: t("artist.workspace.insights.cta.exploreOpportunities"), href: "/artist-dashboard/opportunities/" }}
        />

        <p className="rounded-2xl border bg-[#F7F4FF] px-4 py-3 text-sm" style={{ borderColor: "#E7E1F7", color: mutedColor }}>
          {t("artist.workspace.insights.banner")}
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((insight) => (
            <WorkflowCard key={insight.titleKey} title={t(insight.titleKey)} body={insight.body}>
              <DemoStatusChip label={t(insight.tagKey)} tone={insight.tone} />
            </WorkflowCard>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <h3 className="text-sm font-semibold" style={{ color: inkColor }}>{t("artist.workspace.insights.metric.materialReadiness")}</h3>
            <p className="mt-2 font-serif text-2xl font-semibold" style={{ color: inkColor }}>{analytics.passportCompletenessPct}%</p>
            <p className="mt-1 text-xs" style={{ color: mutedColor }}>
              {t("artist.workspace.insights.metric.materialReadinessDetail", {
                ready: analytics.materialsReadyCount,
                total: analytics.materialsTotalCount,
              })}
            </p>
          </section>
          <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <h3 className="text-sm font-semibold" style={{ color: inkColor }}>{t("artist.workspace.insights.metric.activeOpportunities")}</h3>
            <p className="mt-2 font-serif text-2xl font-semibold" style={{ color: inkColor }}>{analytics.opportunityCount}</p>
            <p className="mt-1 text-xs" style={{ color: mutedColor }}>{t("artist.workspace.insights.metric.activeOpportunitiesDetail")}</p>
          </section>
          <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <h3 className="text-sm font-semibold" style={{ color: inkColor }}>{t("artist.workspace.insights.metric.applicationsInMotion")}</h3>
            <p className="mt-2 font-serif text-2xl font-semibold" style={{ color: inkColor }}>{analytics.activeApplications}</p>
            <p className="mt-1 text-xs" style={{ color: mutedColor }}>{t("artist.workspace.insights.metric.applicationsInMotionDetail")}</p>
          </section>
        </div>

        <Link href="/artist-dashboard/applications/" className="inline-flex text-sm font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
          {t("artist.workspace.insights.cta.trackApplications")}
        </Link>
      </div>
    </main>
  )
}
