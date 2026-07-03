"use client"

import Link from "next/link"
import { CheckCircle2, ExternalLink, Globe, Lock } from "lucide-react"
import { assetPath } from "@/lib/asset-path"
import { artistDashboardProfile } from "@/lib/kleio-data"
import { artistAnalytics } from "@/lib/kleio-artist-analytics"
import { getArtistProfileByUsername } from "@/lib/kleio-profile-data"
import { DEMO_ARTIST_PUBLIC_PROFILE, inkColor, mutedColor, lavenderSoftLine, lavenderDeep, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkspaceMetricCard } from "@/components/kleio/workspace-metric-card"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const materialKeys: Record<string, string> = {
  bio: "profile.material.bio",
  artistStatement: "profile.material.artistStatement",
  cvResume: "profile.material.cvResume",
  portfolio: "profile.material.portfolio",
  workSamples: "profile.material.workSamples",
  references: "profile.material.references",
}

export function ArtistPassportPageView() {
  const { t } = useKleioLocale()
  const profile = getArtistProfileByUsername("amina-el-badri")
  const analytics = artistAnalytics
  if (!profile) return null

  const materials = Object.entries(profile.materialsReady)

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow={t("artist.workspace.passport.eyebrow")}
          title={t("artist.workspace.passport.title")}
          description={t("artist.workspace.passport.description")}
          primaryCta={{ label: t("artist.workspace.passport.cta.viewPublicProfile"), href: DEMO_ARTIST_PUBLIC_PROFILE }}
          secondaryCta={{ label: t("artist.workspace.passport.cta.backToOverview"), href: "/artist-dashboard/" }}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <WorkspaceMetricCard label={t("artist.workspace.passport.metric.completeness")} value={`${analytics.passportCompletenessPct}%`} />
          <WorkspaceMetricCard
            label={t("artist.workspace.passport.metric.materialsReady")}
            value={`${analytics.materialsReadyCount} / ${analytics.materialsTotalCount}`}
          />
          <WorkspaceMetricCard label={t("artist.workspace.passport.metric.selectedWorks")} value={analytics.selectedWorksCount} />
          <WorkspaceMetricCard label={t("artist.workspace.passport.metric.activeApplications")} value={analytics.activeApplications} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <WorkflowCard
            title={t("artist.workspace.passport.materialsReadiness.title")}
            body={t("artist.workspace.passport.materialsReadiness.body")}
          >
            <div className="space-y-2">
              {materials.map(([key, ready]) => (
                <div key={key} className="flex items-center justify-between rounded-xl border px-3 py-2.5" style={{ borderColor: lavenderSoftLine }}>
                  <span className="text-sm" style={{ color: inkColor }}>{t(materialKeys[key] ?? key)}</span>
                  {ready ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.94_0.04_150)] px-2 py-0.5 text-[0.62rem] font-semibold text-[oklch(0.4_0.13_150)]">
                      <CheckCircle2 className="size-3" /> {t("artist.workspace.passport.ready")}
                    </span>
                  ) : (
                    <span className="rounded-full bg-[oklch(0.95_0.04_75)] px-2 py-0.5 text-[0.62rem] font-semibold text-[oklch(0.48_0.12_65)]">
                      {t("artist.workspace.passport.needsReview")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </WorkflowCard>

          <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <h2 className="font-serif text-lg font-semibold" style={{ color: inkColor }}>
              {t("artist.workspace.passport.publicPreview.title")}
            </h2>
            <p className="mt-2 text-sm" style={{ color: mutedColor }}>
              {t("artist.workspace.passport.publicPreview.description")}
            </p>
            <div className="mt-4 flex items-center gap-3 rounded-xl border p-4" style={{ borderColor: lavenderSoftLine }}>
              <div className="size-14 overflow-hidden rounded-full border border-[#E7E1F7] bg-[#F7F4FF]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetPath(profile.portrait)} alt={profile.displayName} className="h-full w-full object-cover object-center" />
              </div>
              <div className="min-w-0">
                <p className="font-serif text-base font-semibold" style={{ color: inkColor }}>{profile.displayName}</p>
                <p className="text-xs" style={{ color: mutedColor }}>{profile.role} · {profile.location}</p>
                <Link href={DEMO_ARTIST_PUBLIC_PROFILE} className="mt-1 inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-75" style={{ color: lavenderDeep }}>
                  <ExternalLink className="size-3" /> {t("artist.workspace.passport.cta.openPublicProfile")}
                </Link>
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <WorkflowCard
            title={t("artist.workspace.passport.profileBasics.title")}
            body={t("artist.workspace.passport.profileBasics.body")}
          />
          <WorkflowCard
            title={t("artist.workspace.passport.reusableAnswers.title")}
            body={t("artist.workspace.passport.reusableAnswers.body", { count: artistDashboardProfile.nextActions.length })}
          />
          <WorkflowCard
            title={t("artist.workspace.passport.sharingControls.title")}
            body={t("artist.workspace.passport.sharingControls.body")}
          >
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: lavenderSoftLine, color: inkColor }}>
                <Globe className="size-3" style={{ color: lavenderDeep }} /> {t("artist.workspace.passport.sharing.publicBio")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: lavenderSoftLine, color: inkColor }}>
                <Lock className="size-3" style={{ color: mutedColor }} /> {t("artist.workspace.passport.sharing.privateCvDraft")}
              </span>
            </div>
          </WorkflowCard>
          <WorkflowCard
            title={t("artist.workspace.passport.artistMaterials.title")}
            body={t("artist.workspace.passport.materialsReadiness.body")}
          />
        </div>
      </div>
    </main>
  )
}
