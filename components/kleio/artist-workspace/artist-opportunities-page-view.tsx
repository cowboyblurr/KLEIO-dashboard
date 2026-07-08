"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { artistDashboardProfile } from "@/lib/kleio-data"
import { artistAnalytics, formatDemoDateDisplay } from "@/lib/kleio-artist-analytics"
import { formatKleioCurrency } from "@/lib/kleio-i18n"
import { inkColor, mutedColor, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { SearchFilterBar } from "@/components/kleio/search-filter-bar"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { KleioAssistObject } from "@/components/kleio/kleio-assist-object"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

type DirectoryOpportunity = {
  title: string
  institution: string
  type: "Grant" | "Residency" | "Open Call" | "Fellowship"
  deadline: string
  amount: number | null
  fit: number
  readiness: number
  urgency: "This week" | "Due soon" | "Upcoming"
  effort: "Low" | "Medium" | "High"
  missing: string[]
  why: string
  tags: string[]
}

const directoryOpportunities: DirectoryOpportunity[] = [
  {
    title: "Light & Memory Installation Residency",
    institution: "KLEIO Arthouse",
    type: "Residency",
    deadline: "2026-08-14",
    amount: 6000,
    fit: 94,
    readiness: 86,
    urgency: "This week",
    effort: "Medium",
    missing: ["Reference confirmation"],
    why: "Strong match for installation, light, memory, and spatial practice.",
    tags: ["Installation", "Residency", "Light"],
  },
  {
    title: "Archive Futures Fellowship",
    institution: "Emerging Image Foundation",
    type: "Fellowship",
    deadline: "2026-08-21",
    amount: 8500,
    fit: 89,
    readiness: 78,
    urgency: "Due soon",
    effort: "High",
    missing: ["Research summary", "Timeline"],
    why: "Good fit for archival fragments, cultural memory, and research-based practice.",
    tags: ["Archive", "Fellowship", "Research"],
  },
  {
    title: "Material Practice Grant",
    institution: "Contemporary Arts Fund",
    type: "Grant",
    deadline: "2026-09-02",
    amount: 5000,
    fit: 87,
    readiness: 92,
    urgency: "Upcoming",
    effort: "Low",
    missing: [],
    why: "Portfolio and statement already cover material experimentation and process language.",
    tags: ["Grant", "Materials", "Process"],
  },
  {
    title: "Public Forms Exhibition Call",
    institution: "KLEIO Arthouse",
    type: "Open Call",
    deadline: "2026-09-10",
    amount: null,
    fit: 82,
    readiness: 88,
    urgency: "Upcoming",
    effort: "Medium",
    missing: ["Installation plan"],
    why: "Relevant to site-responsive installation and public-facing spatial work.",
    tags: ["Open Call", "Exhibition", "Site-specific"],
  },
]

function toneForPct(value: number): "success" | "warning" | "info" {
  if (value >= 88) return "success"
  if (value >= 78) return "info"
  return "warning"
}

export function ArtistOpportunitiesPageView() {
  const { locale, t } = useKleioLocale()
  const [query, setQuery] = useState("")
  const analytics = artistAnalytics

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase()
    return directoryOpportunities.filter((opportunity) =>
      `${opportunity.title} ${opportunity.institution} ${opportunity.type} ${opportunity.tags.join(" ")}`.toLowerCase().includes(normalized),
    )
  }, [query])

  const readyToApply = directoryOpportunities.filter((opportunity) => opportunity.missing.length === 0).length
  const dueSoon = directoryOpportunities.filter((opportunity) => opportunity.urgency !== "Upcoming").length
  const potentialFunding = directoryOpportunities.reduce((sum, opportunity) => sum + (opportunity.amount ?? 0), 0)
  const materialsGap = analytics.materialsTotalCount - analytics.materialsReadyCount

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Grant & Opportunity Directory"
          title="Find aligned opportunities without rebuilding every application."
          description="KLEIO matches the Creative Passport against grants, residencies, fellowships, and open calls, then shows fit, readiness, missing materials, deadline urgency, and application effort."
          primaryCta={{ label: t("artist.workspace.opportunities.cta.prepareDraft"), href: "/artist-dashboard/applications/" }}
          secondaryCta={{ label: t("artist.workspace.opportunities.cta.reviewPassport"), href: "/artist-dashboard/passport/" }}
        />

        <section className="grid gap-3 md:grid-cols-4">
          <Metric label="Matched opportunities" value={directoryOpportunities.length} detail="Curated from passport signals" />
          <Metric label="Ready to apply" value={readyToApply} detail="No missing materials" />
          <Metric label="Due soon" value={dueSoon} detail="Needs prioritization" />
          <Metric label="Potential funding" value={formatKleioCurrency(locale, potentialFunding)} detail="Visible grant value" />
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
              <SearchFilterBar
                placeholder="Search grants, residencies, open calls, tags, or institutions"
                value={query}
                onChange={setQuery}
                filterChips={["All types", "Grants", "Residencies", "High fit", "Due soon"]}
              />
            </section>

            <div className="grid gap-3">
              {filtered.map((opportunity) => (
                <article key={opportunity.title} className="rounded-2xl border bg-white p-5" style={cardStyle}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "#A997E8" }}>{opportunity.type}</p>
                      <h2 className="mt-1 font-serif text-lg font-semibold" style={{ color: inkColor }}>{opportunity.title}</h2>
                      <p className="mt-1 text-sm" style={{ color: mutedColor }}>
                        {opportunity.institution} · Deadline {formatDemoDateDisplay(opportunity.deadline, locale)}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <DemoStatusChip label={`${opportunity.fit}% match`} tone={toneForPct(opportunity.fit)} translate={false} />
                      <DemoStatusChip label={`${opportunity.readiness}% ready`} tone={toneForPct(opportunity.readiness)} translate={false} />
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed" style={{ color: mutedColor }}>{opportunity.why}</p>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <Info label="Deadline urgency" value={opportunity.urgency} />
                    <Info label="Application effort" value={opportunity.effort} />
                    <Info label="Funding" value={opportunity.amount ? formatKleioCurrency(locale, opportunity.amount) : "Non-cash / exhibition"} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {opportunity.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-[#F7F4FF] px-2 py-0.5 text-[0.65rem] font-medium text-[#5B4B8A]">{tag}</span>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Application readiness</p>
                    {opportunity.missing.length ? (
                      <p className="mt-1 text-sm" style={{ color: mutedColor }}>
                        Missing: {opportunity.missing.join(", ")}. KLEIO can prepare a draft checklist from the Creative Passport.
                      </p>
                    ) : (
                      <p className="mt-1 text-sm" style={{ color: mutedColor }}>
                        Materials are ready. KLEIO can prepare a draft application for review.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href="/artist-dashboard/applications/" className="inline-flex h-9 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                      Prepare application draft
                    </Link>
                    <Link href="/artist-dashboard/passport/" className="inline-flex h-9 items-center rounded-xl border border-[#D8D0F2] bg-white px-3 text-xs font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]">
                      Review passport materials
                    </Link>
                  </div>
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
                  ? ` ${materialsGap === 1
                      ? t("artist.workspace.opportunities.readinessSummary.gapOne", { count: materialsGap })
                      : t("artist.workspace.opportunities.readinessSummary.gapOther", { count: materialsGap })}`
                  : "")
              }
            >
              <Link href="/artist-dashboard/passport/" className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
                {t("artist.workspace.opportunities.cta.reviewPassportLink")}
              </Link>
            </WorkflowCard>
            <WorkflowCard
              title="Active application tracker"
              body={`${artistDashboardProfile.applications.length} applications are already being tracked. New matched opportunities can move into Applications after the artist approves the draft.`}
            />
            <KleioAssistObject
              mode="reviewing"
              title={t("assist.object.opportunities.title")}
              description="KLEIO reviews the Creative Passport against opportunity criteria, then surfaces match, readiness, deadline pressure, effort, and missing materials for artist approval."
              size="sm"
              compact
              progress={analytics.fundingReadiness.completeness}
            />
          </div>
        </div>
      </div>
    </main>
  )
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4" style={cardStyle}>
      <p className="text-xs font-medium" style={{ color: mutedColor }}>{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold" style={{ color: inkColor }}>{value}</p>
      <p className="mt-1 text-xs" style={{ color: mutedColor }}>{detail}</p>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E7E1F7] bg-white px-3 py-2">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em]" style={{ color: mutedColor }}>{label}</p>
      <p className="mt-1 text-sm font-semibold" style={{ color: inkColor }}>{value}</p>
    </div>
  )
}
