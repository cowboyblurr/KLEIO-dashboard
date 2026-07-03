"use client"

import Link from "next/link"
import { CheckCircle2, ExternalLink, Globe, Lock } from "lucide-react"
import { assetPath } from "@/lib/asset-path"
import { getArtistProfileByUsername } from "@/lib/kleio-profile-data"
import { DEMO_ARTIST_ID } from "@/lib/kleio-data"
import { DEMO_ARTIST_PUBLIC_PROFILE, inkColor, mutedColor, lavenderSoftLine, lavenderDeep, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkspaceMetricCard } from "@/components/kleio/workspace-metric-card"
import { WorkflowCard } from "@/components/kleio/workflow-card"

const materialLabels: Record<string, string> = {
  bio: "Bio",
  artistStatement: "Artist Statement",
  cvResume: "CV / Resume",
  portfolio: "Portfolio",
  workSamples: "Work Samples",
  references: "References",
}

export function ArtistPassportPageView() {
  const profile = getArtistProfileByUsername(DEMO_ARTIST_ID)
  if (!profile) return null

  const materials = Object.entries(profile.materialsReady)
  const readyCount = materials.filter(([, ready]) => ready).length
  const completeness = Math.round((readyCount / materials.length) * 100)

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Creative Passport"
          title="Creative Passport"
          description="Manage your reusable artist profile for grants, residencies, exhibitions, open calls, and institutional review."
          primaryCta={{ label: "View Public Profile", href: DEMO_ARTIST_PUBLIC_PROFILE }}
          secondaryCta={{ label: "Back to Artist Overview", href: "/artist-dashboard/" }}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <WorkspaceMetricCard label="Passport completeness" value={`${completeness}%`} />
          <WorkspaceMetricCard label="Materials ready" value={`${readyCount} / ${materials.length}`} />
          <WorkspaceMetricCard label="Public profile" value="Active" helper="Visible to institutions" />
          <WorkspaceMetricCard label="Reusable answers" value="4" helper="Saved for future applications" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <WorkflowCard title="Materials readiness" body="Organize your statement, CV, portfolio, work samples, references, and support documents.">
            <div className="space-y-2">
              {materials.map(([key, ready]) => (
                <div key={key} className="flex items-center justify-between rounded-xl border px-3 py-2.5" style={{ borderColor: lavenderSoftLine }}>
                  <span className="text-sm" style={{ color: inkColor }}>{materialLabels[key] ?? key}</span>
                  {ready ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.94_0.04_150)] px-2 py-0.5 text-[0.62rem] font-semibold text-[oklch(0.4_0.13_150)]">
                      <CheckCircle2 className="size-3" /> Ready
                    </span>
                  ) : (
                    <span className="rounded-full bg-[oklch(0.95_0.04_75)] px-2 py-0.5 text-[0.62rem] font-semibold text-[oklch(0.48_0.12_65)]">
                      Needs review
                    </span>
                  )}
                </div>
              ))}
            </div>
          </WorkflowCard>

          <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <h2 className="font-serif text-lg font-semibold" style={{ color: inkColor }}>Public Creative Passport preview</h2>
            <p className="mt-2 text-sm" style={{ color: mutedColor }}>How institutions see your public profile identity.</p>
            <div className="mt-4 flex items-center gap-3 rounded-xl border p-4" style={{ borderColor: lavenderSoftLine }}>
              <div className="size-14 overflow-hidden rounded-full border border-[#E7E1F7] bg-[#F7F4FF]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetPath(profile.portrait)} alt={profile.displayName} className="h-full w-full object-cover object-center" />
              </div>
              <div className="min-w-0">
                <p className="font-serif text-base font-semibold" style={{ color: inkColor }}>{profile.displayName}</p>
                <p className="text-xs" style={{ color: mutedColor }}>{profile.role} · {profile.location}</p>
                <Link href={DEMO_ARTIST_PUBLIC_PROFILE} className="mt-1 inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-75" style={{ color: lavenderDeep }}>
                  <ExternalLink className="size-3" /> Open public profile
                </Link>
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <WorkflowCard title="Profile basics" body="Keep your bio, location, practice language, contact links, and public profile identity current." />
          <WorkflowCard title="Reusable answers" body="Save responses you can adapt across future applications without rewriting from scratch." />
          <WorkflowCard title="Sharing controls" body="Choose what to share publicly, what to keep private, and what to prepare for each opportunity.">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: lavenderSoftLine, color: inkColor }}>
                <Globe className="size-3" style={{ color: lavenderDeep }} /> Public bio
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: lavenderSoftLine, color: inkColor }}>
                <Lock className="size-3" style={{ color: mutedColor }} /> Private CV draft
              </span>
            </div>
          </WorkflowCard>
          <WorkflowCard title="Artist materials" body="Organize your statement, CV, portfolio, work samples, references, and support documents." />
        </div>
      </div>
    </main>
  )
}
