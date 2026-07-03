"use client"

import Link from "next/link"
import { useState } from "react"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { SearchFilterBar } from "@/components/kleio/search-filter-bar"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { ProfileChip } from "@/components/kleio/profile/profile-chip"

const collaborators = [
  { name: "Jamal Pierre", location: "Kingston, Jamaica", tags: ["Sculpture", "Caribbean Diaspora", "Material Culture"], themes: ["Memory", "Material"] },
  { name: "Leila Martinez", location: "San Juan, PR", tags: ["Moving Image", "Social Practice", "Research-Based"], themes: ["Community", "Archives"] },
  { name: "Nadia Clarke", location: "Toronto, Canada", tags: ["Installation", "Archives", "Community Work"], themes: ["Identity", "Space"] },
]

export function ArtistCollaboratorsPageView() {
  const [query, setQuery] = useState("")
  const filtered = collaborators.filter((c) =>
    `${c.name} ${c.location} ${c.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Artist spectrum matches"
          title="Collaborators"
          description="Discover artists and collaborators with related practices, themes, locations, or opportunity interests."
          primaryCta={{ label: "Open Messages", href: "/artist-dashboard/messages/" }}
          secondaryCta={{ label: "Explore Opportunities", href: "/artist-dashboard/opportunities/" }}
        />

        <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
          <SearchFilterBar
            placeholder="Search collaborators, disciplines, locations..."
            value={query}
            onChange={setQuery}
            filterChips={["All Disciplines", "Shared Themes", "Location", "Opportunity Fit"]}
          />
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((person) => (
            <article key={person.name} className="rounded-2xl border bg-white p-5" style={cardStyle}>
              <h2 className="font-serif text-base font-semibold" style={{ color: inkColor }}>{person.name}</h2>
              <p className="mt-1 text-xs" style={{ color: mutedColor }}>{person.location}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {person.tags.map((tag) => <ProfileChip key={tag} label={tag} />)}
              </div>
              <p className="mt-3 text-xs" style={{ color: mutedColor }}>
                Shared themes: {person.themes.join(", ")}
              </p>
              <Link href="/artist-dashboard/messages/" className="mt-4 inline-flex h-9 items-center rounded-xl border px-3 text-xs font-semibold transition-colors hover:bg-[#F7F4FF]" style={{ borderColor: lavenderSoftLine, color: "#5B4B8A" }}>
                Send collaboration note
              </Link>
            </article>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <WorkflowCard title="Shared themes" body="Artists working across memory, archives, and material culture appear most often in your match set." />
          <WorkflowCard title="Invitation foundation" body="Prepare collaboration invitations connected to your current applications and open opportunities.">
            <Link href="/artist-dashboard/messages/" className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
              Draft invitation →
            </Link>
          </WorkflowCard>
        </div>
      </div>
    </main>
  )
}
