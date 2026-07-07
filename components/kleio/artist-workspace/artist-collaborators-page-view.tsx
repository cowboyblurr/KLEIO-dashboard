"use client"

import Link from "next/link"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { ProfileChip } from "@/components/kleio/profile/profile-chip"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const comingSoonMatches = [
  { name: "Practice-aligned artists", tags: ["Shared mediums", "Themes", "Application stage"] },
  { name: "Residency cohorts", tags: ["Opportunity fit", "Location", "Availability"] },
  { name: "Project collaborators", tags: ["Research overlap", "Material needs", "Funding goals"] },
]

export function ArtistCollaboratorsPageView() {
  const { t } = useKleioLocale()

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Coming soon"
          title="Artist Matches"
          description="A future KLEIO feature for finding practice-aligned artists and collaborators. For this demo, the core artist flow remains Creative Passport, Opportunities, readiness, and application tracking."
          primaryCta={{ label: "Explore opportunities", href: "/artist-dashboard/opportunities/" }}
          secondaryCta={{ label: "Review Creative Passport", href: "/artist-dashboard/passport/" }}
        />

        <section className="rounded-[1.5rem] border bg-[#F7F4FF] p-5" style={{ borderColor: lavenderSoftLine }}>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "#A997E8" }}>Not part of the core pilot</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold" style={{ color: inkColor }}>Artist Matches stays secondary for now.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: mutedColor }}>
            KLEIO should first prove the application workflow: reusable artist materials, opportunity readiness, missing-material clarity, and submission tracking. Artist matching can become valuable later, but it should not compete with the first product wedge.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          {comingSoonMatches.map((match) => (
            <article key={match.name} className="rounded-2xl border bg-white p-5" style={cardStyle}>
              <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em]" style={{ color: "#A997E8" }}>Future match type</p>
              <h2 className="mt-1 font-serif text-base font-semibold" style={{ color: inkColor }}>{match.name}</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {match.tags.map((tag) => <ProfileChip key={tag} label={tag} />)}
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <WorkflowCard title="Current artist priority" body="Complete the Creative Passport, understand opportunity fit, resolve missing materials, and track active applications." />
          <WorkflowCard title="Future direction" body="Once KLEIO has enough artists and opportunity context, matching can surface aligned practices, cohorts, and collaborators without becoming a distraction.">
            <Link href="/artist-dashboard/opportunities/" className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
              Return to opportunities →
            </Link>
          </WorkflowCard>
        </div>
      </div>
    </main>
  )
}
