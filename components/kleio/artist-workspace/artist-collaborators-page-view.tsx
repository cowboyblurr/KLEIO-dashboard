"use client"

import Link from "next/link"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { ProfileChip } from "@/components/kleio/profile/profile-chip"

const comingSoonMatches = [
  { name: "Practice-aligned artists", tags: ["Shared mediums", "Themes", "Practice interests"] },
  { name: "Residency cohorts", tags: ["Opportunity interests", "Location", "Availability"] },
  { name: "Project collaborators", tags: ["Research overlap", "Complementary skills", "Project goals"] },
]

export function ArtistCollaboratorsPageView() {
  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Coming soon"
          title="Artist Matches"
          description="Discover practice-aligned artists, residency peers, and potential collaborators through information artists choose to share in their Creative Passports."
          primaryCta={{ label: "Explore opportunities", href: "/artist-dashboard/opportunities/" }}
          secondaryCta={{ label: "Review Creative Passport", href: "/artist-dashboard/passport/" }}
        />

        <section className="rounded-[1.5rem] border bg-[#F7F4FF] p-5" style={{ borderColor: lavenderSoftLine }}>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "#A997E8" }}>Coming soon</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold" style={{ color: inkColor }}>Find relevant creative connections.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: mutedColor }}>
            Artist Matches will help you discover artists with related practices, themes, locations, opportunity interests, and collaboration goals.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          {comingSoonMatches.map((match) => (
            <article key={match.name} className="rounded-2xl border bg-white p-5" style={cardStyle}>
              <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em]" style={{ color: "#A997E8" }}>Match type</p>
              <h2 className="mt-1 font-serif text-base font-semibold" style={{ color: inkColor }}>{match.name}</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {match.tags.map((tag) => <ProfileChip key={tag} label={tag} />)}
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <WorkflowCard title="Prepare for future matches" body="Complete your Creative Passport and keep your practice, location, availability, and collaboration interests current so future recommendations can reflect what you are looking for." />
          <WorkflowCard title="Artist-controlled discovery" body="Artists will choose whether they want to be discoverable and what profile information can be used to suggest a connection.">
            <Link href="/artist-dashboard/passport/" className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
              Review Creative Passport →
            </Link>
          </WorkflowCard>
        </div>
      </div>
    </main>
  )
}
