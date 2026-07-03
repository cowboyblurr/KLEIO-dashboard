"use client"

import Link from "next/link"
import { useState } from "react"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { SearchFilterBar } from "@/components/kleio/search-filter-bar"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"
import { WorkflowCard } from "@/components/kleio/workflow-card"

const opportunities = [
  { title: "Lumen Arts Grant", type: "Grant", deadline: "May 28, 2025", fit: 92, readiness: "Strong", missing: 1 },
  { title: "Caribbean Futures Fund", type: "Grant", deadline: "Jun 2, 2025", fit: 88, readiness: "Ready", missing: 0 },
  { title: "Citywide Artist Award", type: "Award", deadline: "Jun 6, 2025", fit: 81, readiness: "Draft", missing: 2 },
  { title: "Global Perspectives Residency", type: "Residency", deadline: "May 30, 2025", fit: 79, readiness: "Interview", missing: 0 },
  { title: "Northern Light Fellowship", type: "Fellowship", deadline: "Jul 12, 2025", fit: 74, readiness: "Explore", missing: 3 },
]

export function ArtistOpportunitiesPageView() {
  const [query, setQuery] = useState("")

  const filtered = opportunities.filter((o) =>
    `${o.title} ${o.type}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Opportunity discovery"
          title="Opportunities"
          description="Discover grants, residencies, exhibitions, and open calls that align with your Creative Passport."
          primaryCta={{ label: "Prepare Application Draft", href: "/artist-dashboard/applications/" }}
          secondaryCta={{ label: "Review Passport", href: "/artist-dashboard/passport/" }}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
              <SearchFilterBar
                placeholder="Search opportunities, types, deadlines..."
                value={query}
                onChange={setQuery}
                filterChips={["All Types", "Grants", "Residencies", "Fit Score", "Deadline"]}
              />
            </section>

            <div className="grid gap-3">
              {filtered.map((opp) => (
                <article key={opp.title} className="rounded-2xl border bg-white p-5" style={cardStyle}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-base font-semibold" style={{ color: inkColor }}>{opp.title}</h2>
                      <p className="mt-1 text-xs" style={{ color: mutedColor }}>{opp.type} · Deadline {opp.deadline}</p>
                    </div>
                    <DemoStatusChip label={`${opp.fit}% fit`} tone="info" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <DemoStatusChip label={opp.readiness} tone={opp.missing === 0 ? "success" : "warning"} />
                    {opp.missing > 0 && (
                      <span className="text-xs" style={{ color: mutedColor }}>{opp.missing} missing material{opp.missing > 1 ? "s" : ""}</span>
                    )}
                  </div>
                  <Link
                    href="/artist-dashboard/applications/"
                    className="mt-4 inline-flex h-9 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Prepare Draft
                  </Link>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <WorkflowCard title="Readiness summary" body="Your passport is 87% complete. Two materials still need review before high-fit applications.">
              <Link href="/artist-dashboard/passport/" className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
                Review passport →
              </Link>
            </WorkflowCard>
            <WorkflowCard title="Saved opportunities" body="3 opportunities saved for later review.">
              <p className="text-xs" style={{ color: mutedColor }}>Northern Light Fellowship · Harbor Foundation Grant · Emerging Voices Prize</p>
            </WorkflowCard>
          </div>
        </div>
      </div>
    </main>
  )
}
