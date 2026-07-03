import Link from "next/link"
import { assetPath } from "@/lib/asset-path"
import { getArtistProfileByUsername } from "@/lib/kleio-profile-data"
import { DEMO_ARTIST_ID } from "@/lib/kleio-data"
import { DEMO_ARTIST_PUBLIC_PROFILE, inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkflowCard } from "@/components/kleio/workflow-card"

export function ArtistPortfolioPageView() {
  const profile = getArtistProfileByUsername(DEMO_ARTIST_ID)
  if (!profile) return null

  const portfolioSets = [
    { name: "Grant applications", count: 6, status: "Current" },
    { name: "Residency portfolio", count: 4, status: "Updated" },
    { name: "Exhibition selection", count: 3, status: "Draft" },
  ]

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Portfolio library"
          title="Portfolio"
          description="Organize selected works, media, installation views, and portfolio materials for future applications."
          primaryCta={{ label: "View Creative Passport", href: "/artist-dashboard/passport/" }}
          secondaryCta={{ label: "View Public Profile", href: DEMO_ARTIST_PUBLIC_PROFILE }}
        />

        <WorkflowCard title="Selected works" body="Choose the works that best represent your current practice.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.selectedWorks.map((work) => (
              <article key={work.title} className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: lavenderSoftLine }}>
                <div className="relative aspect-[4/3] overflow-hidden bg-[#F7F4FF]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetPath(work.image)} alt={work.title} className="h-full w-full object-cover object-center" />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold" style={{ color: inkColor }}>{work.title}</h3>
                  <p className="mt-0.5 text-xs" style={{ color: mutedColor }}>{work.year} · {work.medium}</p>
                </div>
              </article>
            ))}
          </div>
        </WorkflowCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <WorkflowCard title="Portfolio sets" body="Prepare different versions for grants, residencies, exhibitions, and open calls.">
            <div className="space-y-2">
              {portfolioSets.map((set) => (
                <div key={set.name} className="flex items-center justify-between rounded-xl border px-3 py-2.5" style={{ borderColor: lavenderSoftLine }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: inkColor }}>{set.name}</p>
                    <p className="text-xs" style={{ color: mutedColor }}>{set.count} works</p>
                  </div>
                  <span className="rounded-full bg-[#F1ECFB] px-2 py-0.5 text-[0.62rem] font-semibold" style={{ color: "#5B4B8A" }}>{set.status}</span>
                </div>
              ))}
            </div>
          </WorkflowCard>

          <WorkflowCard title="Media & links" body="Keep images, videos, sound works, and external portfolio links connected.">
            <div className="space-y-2 text-sm" style={{ color: mutedColor }}>
              <p>Installation documentation · 12 files</p>
              <p>Process video · 2 links</p>
              <p>External portfolio · {profile.website}</p>
            </div>
          </WorkflowCard>
        </div>

        <WorkflowCard title="Export ready" body="Keep portfolio materials ready for review or PDF export.">
          <div className="flex flex-wrap gap-2">
            <Link href="/artist-dashboard/passport/" className="inline-flex h-9 items-center rounded-xl border px-3 text-xs font-semibold transition-colors hover:bg-[#F7F4FF]" style={{ borderColor: lavenderSoftLine, color: "#5B4B8A" }}>
              Review passport materials
            </Link>
            <Link href={DEMO_ARTIST_PUBLIC_PROFILE} className="inline-flex h-9 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Preview public portfolio
            </Link>
          </div>
        </WorkflowCard>
      </div>
    </main>
  )
}
