"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { CheckCircle2, FileText, WandSparkles, X } from "lucide-react"
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

function draftBody(opportunity: DirectoryOpportunity) {
  return `I am preparing an application for ${opportunity.title} because the opportunity aligns with my current installation practice around memory, material presence, light, and spatial experience. The proposed project would expand my ongoing body of work through a focused presentation of immersive environments built from fabric, sound, archival fragments, and subtle light.`
}

function ApplicationDraftWizard({
  opportunity,
  locale,
  onClose,
}: {
  opportunity: DirectoryOpportunity
  locale: string
  onClose: () => void
}) {
  const [step, setStep] = useState<"materials" | "draft" | "approve">("materials")
  const [proposal, setProposal] = useState(draftBody(opportunity))
  const [confirmed, setConfirmed] = useState(false)

  const missing = opportunity.missing.length ? opportunity.missing : ["No required materials missing"]

  return (
    <aside className="sticky top-6 rounded-2xl border bg-white" style={cardStyle}>
      <div className="flex items-start justify-between gap-3 border-b border-[#E7E1F7] px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Application draft tool</p>
          <h2 className="mt-1 font-serif text-lg font-semibold" style={{ color: inkColor }}>{opportunity.title}</h2>
          <p className="mt-1 text-xs" style={{ color: mutedColor }}>{opportunity.institution} · {opportunity.fit}% match · {opportunity.readiness}% ready</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close draft tool" className="grid size-8 place-items-center rounded-lg text-[#7F7890] transition-colors hover:bg-[#F7F4FF] hover:text-[#292631]">
          <X className="size-4" />
        </button>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-3 gap-2 text-[0.65rem] font-semibold">
          {[
            ["materials", locale === "es" ? "Materiales" : "Materials"],
            ["draft", locale === "es" ? "Borrador" : "Draft"],
            ["approve", locale === "es" ? "Aprobar" : "Approve"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStep(id as "materials" | "draft" | "approve")}
              className={`rounded-full px-2 py-1.5 transition-colors ${step === id ? "bg-[#5B4B8A] text-white" : "bg-[#F7F4FF] text-[#5B4B8A]"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {step === "materials" && (
          <div className="mt-5 space-y-3">
            <KleioAssistObject
              mode="reviewing"
              title="Passport scan complete"
              description="KLEIO matched the opportunity against the Creative Passport and separated ready materials from items needing attention."
              size="sm"
              compact
              progress={opportunity.readiness}
            />
            <div className="rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Materials check</p>
              <ul className="mt-2 space-y-2 text-sm" style={{ color: mutedColor }}>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[oklch(0.45_0.12_150)]" /> Bio, statement, portfolio, and CV can be pulled from the Creative Passport.</li>
                {missing.map((item) => (
                  <li key={item} className="flex gap-2"><FileText className="mt-0.5 size-4 shrink-0 text-[#5B4B8A]" /> {item}</li>
                ))}
              </ul>
            </div>
            <button type="button" onClick={() => setStep("draft")} className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Prepare draft from passport
            </button>
          </div>
        )}

        {step === "draft" && (
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Draft answer</p>
              <p className="mt-1 text-xs" style={{ color: mutedColor }}>Editable demo copy. The artist reviews and approves before anything is saved or submitted.</p>
              <textarea
                value={proposal}
                onChange={(event) => setProposal(event.target.value)}
                rows={8}
                className="mt-3 w-full resize-none rounded-xl border border-[#E7E1F7] bg-white p-3 text-sm leading-relaxed outline-none transition-colors focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/15"
                style={{ color: inkColor }}
              />
            </div>
            <button type="button" onClick={() => setStep("approve")} className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Review application package
            </button>
          </div>
        )}

        {step === "approve" && (
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Application package</p>
              <div className="mt-3 grid gap-2 text-sm" style={{ color: mutedColor }}>
                <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[oklch(0.45_0.12_150)]" /> Artist bio attached</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[oklch(0.45_0.12_150)]" /> Artist statement attached</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[oklch(0.45_0.12_150)]" /> Portfolio PDF attached</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[oklch(0.45_0.12_150)]" /> Draft answer prepared</div>
              </div>
            </div>
            {confirmed && (
              <p className="rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-3 py-2 text-xs font-medium text-[oklch(0.4_0.12_150)]">
                Demo draft saved to Applications. Nothing was submitted outside this prototype.
              </p>
            )}
            <button type="button" onClick={() => setConfirmed(true)} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              <WandSparkles className="size-4" />
              Save draft to Applications
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

export function ArtistOpportunitiesPageView() {
  const { locale, t } = useKleioLocale()
  const [query, setQuery] = useState("")
  const [selectedOpportunity, setSelectedOpportunity] = useState<DirectoryOpportunity | null>(null)
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
  const strongestOpportunity = directoryOpportunities[0]

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Grant & Opportunity Directory"
          title="Find aligned opportunities without rebuilding every application."
          description="KLEIO matches the Creative Passport against grants, residencies, fellowships, and open calls, then shows fit, readiness, missing materials, deadline urgency, and application effort."
          secondaryCta={{ label: t("artist.workspace.opportunities.cta.reviewPassport"), href: "/artist-dashboard/passport/" }}
        />

        <section className="rounded-2xl border bg-white p-4" style={cardStyle}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: inkColor }}>Application draft tool</p>
              <p className="mt-0.5 text-sm" style={{ color: mutedColor }}>Choose an opportunity and KLEIO will open a reviewable draft wizard instead of sending you to another page.</p>
            </div>
            <button type="button" onClick={() => setSelectedOpportunity(strongestOpportunity)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              <WandSparkles className="size-4" />
              Start strongest draft
            </button>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          <Metric label="Matched opportunities" value={directoryOpportunities.length} detail="Curated from passport signals" />
          <Metric label="Ready to apply" value={readyToApply} detail="No missing materials" />
          <Metric label="Due soon" value={dueSoon} detail="Needs prioritization" />
          <Metric label="Potential funding" value={formatKleioCurrency(locale, potentialFunding)} detail="Visible grant value" />
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
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
                    <button type="button" onClick={() => setSelectedOpportunity(opportunity)} className="inline-flex h-9 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                      Prepare application draft
                    </button>
                    <Link href="/artist-dashboard/passport/" className="inline-flex h-9 items-center rounded-xl border border-[#D8D0F2] bg-white px-3 text-xs font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]">
                      Review passport materials
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {selectedOpportunity ? (
              <ApplicationDraftWizard opportunity={selectedOpportunity} locale={locale} onClose={() => setSelectedOpportunity(null)} />
            ) : (
              <KleioAssistObject
                mode="reviewing"
                title={t("assist.object.opportunities.title")}
                description="Select Prepare application draft to open the tool here. KLEIO will scan materials, draft an answer, and let the artist approve before saving."
                size="sm"
                compact
                progress={analytics.fundingReadiness.completeness}
              />
            )}
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
