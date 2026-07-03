"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { artistDashboardProfile } from "@/lib/kleio-data"
import {
  artistAnalytics,
  formatDemoDateDisplay,
} from "@/lib/kleio-artist-analytics"
import { formatKleioCurrency, translateStatus } from "@/lib/kleio-i18n"
import { inkColor, mutedColor, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { SearchFilterBar } from "@/components/kleio/search-filter-bar"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const ACTIVE_STATUSES = new Set(["Draft", "Submitted", "Under Review", "Waiting", "Interview"])

function readinessLabel(status: string, missing: number, locale: "en" | "es") {
  if (missing > 0) return translateStatus(locale, "Needs materials")
  if (status === "Interview") return translateStatus(locale, "Interview")
  if (status === "Draft") return translateStatus(locale, "Draft")
  return translateStatus(locale, "Ready")
}

export function ArtistOpportunitiesPageView() {
  const { locale, t } = useKleioLocale()
  const [query, setQuery] = useState("")
  const analytics = artistAnalytics

  const opportunities = useMemo(
    () =>
      artistDashboardProfile.applications
        .filter((app) => ACTIVE_STATUSES.has(app.status))
        .map((app) => ({
          title: app.program,
          type: app.status,
          deadline: formatDemoDateDisplay(app.dueDate, locale),
          fit: app.fitScore ?? null,
          readiness: readinessLabel(app.status, app.missingMaterialCount ?? 0, locale),
          missing: app.missingMaterialCount ?? 0,
        })),
    [locale],
  )

  const filtered = opportunities.filter((o) =>
    `${o.title} ${o.type}`.toLowerCase().includes(query.toLowerCase()),
  )

  const materialsGap = analytics.materialsTotalCount - analytics.materialsReadyCount

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow={t("artist.workspace.opportunities.eyebrow")}
          title={t("artist.workspace.opportunities.title")}
          description={t("artist.workspace.opportunities.description")}
          primaryCta={{ label: t("artist.workspace.opportunities.cta.prepareDraft"), href: "/artist-dashboard/applications/" }}
          secondaryCta={{ label: t("artist.workspace.opportunities.cta.reviewPassport"), href: "/artist-dashboard/passport/" }}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
              <SearchFilterBar
                placeholder={t("artist.workspace.opportunities.searchPlaceholder")}
                value={query}
                onChange={setQuery}
                filterChips={[
                  t("artist.workspace.opportunities.filter.allTypes"),
                  t("artist.workspace.opportunities.filter.grants"),
                  t("artist.workspace.opportunities.filter.residencies"),
                  t("artist.workspace.opportunities.filter.fitScore"),
                  t("artist.workspace.opportunities.filter.deadline"),
                ]}
              />
            </section>

            <div className="grid gap-3">
              {filtered.map((opp) => (
                <article key={opp.title} className="rounded-2xl border bg-white p-5" style={cardStyle}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-base font-semibold" style={{ color: inkColor }}>{opp.title}</h2>
                      <p className="mt-1 text-xs" style={{ color: mutedColor }}>
                        {opp.type} · {t("artist.workspace.opportunities.deadline", { date: opp.deadline })}
                      </p>
                    </div>
                    {opp.fit != null && (
                      <DemoStatusChip
                        label={t("artist.workspace.opportunities.fitScore", { pct: opp.fit })}
                        tone="info"
                        translate={false}
                      />
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <DemoStatusChip label={opp.readiness} tone={opp.missing === 0 ? "success" : "warning"} />
                    {opp.missing > 0 && (
                      <span className="text-xs" style={{ color: mutedColor }}>
                        {opp.missing === 1
                          ? t("artist.workspace.opportunities.missingMaterialOne", { count: opp.missing })
                          : t("artist.workspace.opportunities.missingMaterialOther", { count: opp.missing })}
                      </span>
                    )}
                  </div>
                  <Link
                    href="/artist-dashboard/applications/"
                    className="mt-4 inline-flex h-9 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {t("common.prepareDraft")}
                  </Link>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <WorkflowCard
              title={t("artist.workspace.opportunities.readinessSummary.title")}
              body={
                t("artist.workspace.opportunities.readinessSummary.complete", { pct: analytics.passportCompletenessPct }) +
                (materialsGap > 0
                  ? ` ${
                      materialsGap === 1
                        ? t("artist.workspace.opportunities.readinessSummary.gapOne", { count: materialsGap })
                        : t("artist.workspace.opportunities.readinessSummary.gapOther", { count: materialsGap })
                    }`
                  : "")
              }
            >
              <Link href="/artist-dashboard/passport/" className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
                {t("artist.workspace.opportunities.cta.reviewPassportLink")}
              </Link>
            </WorkflowCard>
            <WorkflowCard
              title={t("artist.workspace.opportunities.fundingOutlook.title")}
              body={t("artist.workspace.opportunities.fundingOutlook.body", {
                count: analytics.opportunityCount,
                amount: formatKleioCurrency(locale, analytics.potentialFunding),
              })}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
