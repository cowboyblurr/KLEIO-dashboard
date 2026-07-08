"use client"

import Link from "next/link"
import { useState } from "react"
import {
  AtSign,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Palette,
  Share2,
  SlidersHorizontal,
} from "lucide-react"
import { assetPath } from "@/lib/asset-path"
import type { kleioSyntheticArtistProfiles } from "@/lib/kleio-profile-data"
import { ProfileChip } from "@/components/kleio/profile/profile-chip"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

type ArtistProfile = (typeof kleioSyntheticArtistProfiles)[number]

const inkColor = "#292631"
const mutedColor = "#7F7890"
const lavenderSoftLine = "#E7E1F7"
const lavenderDeep = "#5B4B8A"
const lavenderMist = "#F7F4FF"
const cardShadow = "0 18px 48px rgba(82, 64, 130, 0.08)"

const cardStyle = { borderColor: lavenderSoftLine, boxShadow: cardShadow } as const

const materialLabelKeys: Record<string, string> = {
  bio: "profile.material.bio",
  artistStatement: "profile.material.artistStatement",
  cvResume: "profile.material.cvResume",
  portfolio: "profile.material.portfolio",
  workSamples: "profile.material.workSamples",
  references: "profile.material.references",
}

const availabilityLabels: Record<string, string> = {
  residencies: "Residencies",
  exhibitions: "Exhibitions",
  commissions: "Commissions",
  collaborations: "Collaborations",
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border bg-white p-5 xl:p-6 ${className}`} style={cardStyle}>
      {children}
    </section>
  )
}

function SectionHeading({ title, action }: { title: string; action?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="font-serif text-lg font-semibold tracking-tight" style={{ color: inkColor }}>
        {title}
      </h2>
      {action && (
        <button type="button" className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: lavenderDeep }}>
          {action}
        </button>
      )}
    </div>
  )
}

function ExpressionOption({ icon: Icon, title, body }: { icon: typeof Palette; title: string; body: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4" style={{ borderColor: lavenderSoftLine }}>
      <span className="grid size-8 place-items-center rounded-full" style={{ backgroundColor: lavenderMist, color: lavenderDeep }}>
        <Icon className="size-4" />
      </span>
      <h3 className="mt-3 font-serif text-sm font-semibold" style={{ color: inkColor }}>
        {title}
      </h3>
      <p className="mt-1 text-xs leading-relaxed" style={{ color: mutedColor }}>
        {body}
      </p>
    </div>
  )
}

function PublicProfileHero({ profile, statementExcerpt, onDemoAction }: { profile: ArtistProfile; statementExcerpt: string; onDemoAction: (message: string) => void }) {
  const { t } = useKleioLocale()

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border bg-white" style={cardStyle}>
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetPath(profile.heroImage)} alt={`${profile.displayName} featured practice image`} className="size-full object-cover object-center opacity-90" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.92)_36%,rgba(255,255,255,0.64)_61%,rgba(255,255,255,0.18)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_80%,rgba(241,236,251,0.95),transparent_32%),radial-gradient(circle_at_72%_22%,rgba(255,255,255,0.5),transparent_24%)]" />
      </div>

      <div aria-hidden="true" className="absolute -bottom-24 -left-10 h-60 w-72 rounded-full bg-[#F1ECFB]/70 blur-3xl" />
      <div aria-hidden="true" className="absolute right-12 top-10 h-40 w-40 rounded-full bg-white/35 blur-3xl" />

      <div className="relative z-10 grid min-h-[390px] gap-6 p-5 md:p-8 lg:grid-cols-[160px_minmax(0,1fr)_235px] lg:items-center">
        <div className="flex justify-center lg:justify-start">
          <div className="relative">
            <div className="size-32 overflow-hidden rounded-full border-[6px] border-white bg-[#F7F4FF] shadow-[0_22px_46px_rgba(82,64,130,0.18)] md:size-36">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetPath(profile.portrait)} alt={profile.displayName} className="h-full w-full object-cover object-center" />
            </div>
            {profile.nativeOnKleio && (
              <span className="absolute bottom-2 right-1 grid size-8 place-items-center rounded-full border-4 border-white bg-primary text-primary-foreground shadow-sm" aria-label={t("profile.creativePassport")}>
                <BadgeCheck className="size-4" />
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0 text-center lg:text-left">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em]" style={{ color: lavenderDeep }}>
            Artist-Controlled Public Passport
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl" style={{ color: inkColor }}>
              {profile.displayName}
            </h1>
            <BadgeCheck className="size-5" style={{ color: lavenderDeep }} aria-label={t("profile.creativePassport")} />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            <span className="rounded-full border border-[#D8D0F2] bg-[#F7F4FF]/90 px-2.5 py-1 text-[0.68rem] font-semibold" style={{ color: lavenderDeep }}>
              {profile.profileBadge}
            </span>
            <span className="text-sm" style={{ color: mutedColor }}>
              {profile.role} · {profile.location}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-1.5 lg:justify-start">
            {profile.practiceTags.map((tag) => <ProfileChip key={tag} label={tag} />)}
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed md:text-[0.95rem]" style={{ color: "#4A4458" }}>
            {statementExcerpt}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
            <button type="button" onClick={() => onDemoAction("Portfolio preview opened")} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              <ExternalLink className="size-3.5" />
              View Portfolio
            </button>
            <button type="button" onClick={() => onDemoAction("Share link copied")} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white/85 px-3 text-xs font-semibold transition-colors hover:bg-[#F7F4FF]" style={{ color: lavenderDeep }}>
              <Share2 className="size-3.5" />
              Share Profile
            </button>
            <Link href="/signup/artist/" className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D8D0F2] bg-white/85 px-3 text-center text-xs font-semibold transition-colors hover:bg-[#F7F4FF]" style={{ color: lavenderDeep }}>
              Create Passport
            </Link>
          </div>
        </div>

        <div className="hidden rounded-2xl border bg-white/72 p-4 shadow-[0_18px_40px_rgba(82,64,130,0.08)] backdrop-blur lg:block" style={{ borderColor: lavenderSoftLine }}>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]" style={{ color: lavenderDeep }}>
            Practice Atmosphere
          </p>
          <div className="mt-4 space-y-3">
            {profile.practiceTags.slice(0, 4).map((tag) => (
              <div key={tag} className="flex items-center justify-between gap-3 rounded-xl border bg-white/70 px-3 py-2" style={{ borderColor: lavenderSoftLine }}>
                <span className="text-xs font-medium" style={{ color: inkColor }}>{tag}</span>
                <span className="size-2 rounded-full bg-primary/70" />
              </div>
            ))}
          </div>
          <a href={`https://${profile.website}`} className="mt-4 inline-flex items-center gap-2 text-xs font-medium" style={{ color: lavenderDeep }}>
            <Globe className="size-3.5" />
            {profile.website}
          </a>
        </div>
      </div>
    </section>
  )
}

export function ArtistPublicProfile({ profile }: { profile: ArtistProfile }) {
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const { t } = useKleioLocale()

  function demoAction(message: string) {
    setConfirmation(message)
    setTimeout(() => setConfirmation(null), 3000)
  }

  const statementExcerpt = profile.artistStatement.split(". ").slice(0, 2).join(". ")

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6">
      <div className="relative">
        <PublicProfileHero profile={profile} statementExcerpt={statementExcerpt} onDemoAction={demoAction} />
        {confirmation && (
          <div role="status" className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-3 py-2 text-xs text-[oklch(0.4_0.12_150)] shadow-lg">
            <CheckCircle2 className="size-3.5 shrink-0" />
            {confirmation} <span className="opacity-70">(demo only)</span>
          </div>
        )}
      </div>

      <Card>
        <SectionHeading title="Artistic Expression Controls" />
        <p className="mb-4 max-w-2xl text-sm leading-relaxed" style={{ color: mutedColor }}>
          KLEIO should not flatten an artist into a generic application voice. The public passport shows how the artist can choose what tone, context, visibility, and practice language remain attached to their profile.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <ExpressionOption icon={Palette} title="Practice voice" body="Keep the artist statement primary and choose whether public copy feels lyrical, concise, archival, or grant-ready." />
          <ExpressionOption icon={SlidersHorizontal} title="Profile emphasis" body="Prioritize selected works, process notes, materials, exhibition history, or availability depending on the opportunity." />
          <ExpressionOption icon={BadgeCheck} title="Artist approval" body="Suggested edits remain drafts. The artist controls what is saved, shared, submitted, or rewritten." />
        </div>
      </Card>

      <Card>
        <SectionHeading title={t("profile.selectedWorks")} action={t("common.viewAll")} />
        <p className="mb-4 max-w-2xl text-xs leading-relaxed" style={{ color: mutedColor }}>
          A focused view of works connected to the artist&rsquo;s current practice and application materials.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profile.selectedWorks.map((work) => (
            <article key={work.title} className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: lavenderSoftLine }}>
              <div className="relative aspect-[4/3] overflow-hidden bg-[#F7F4FF]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetPath(work.image)} alt={work.title} className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-[1.03]" />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold" style={{ color: inkColor }}>{work.title}</h3>
                <p className="mt-0.5 text-xs" style={{ color: mutedColor }}>{work.year} · {work.medium}</p>
                <p className="mt-0.5 text-xs" style={{ color: mutedColor }}>{work.details}</p>
              </div>
            </article>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionHeading title={t("profile.aboutPractice")} action={t("profile.artistStatement")} />
          <p className="text-sm leading-relaxed" style={{ color: "#4A4458" }}>{profile.shortBio}</p>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: mutedColor }}>{profile.artistStatement}</p>
        </Card>

        <Card>
          <SectionHeading title={t("profile.materialsReady")} />
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(profile.materialsReady).map(([key, ready]) => (
              <div key={key} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: lavenderSoftLine }}>
                <span className="text-sm" style={{ color: inkColor }}>{materialLabelKeys[key] ? t(materialLabelKeys[key]) : key}</span>
                {ready ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.94_0.04_150)] px-2 py-0.5 text-[0.62rem] font-semibold text-[oklch(0.4_0.13_150)]">
                    <CheckCircle2 className="size-3" />
                    {t("status.ready")}
                  </span>
                ) : (
                  <span className="rounded-full bg-[oklch(0.95_0.04_75)] px-2 py-0.5 text-[0.62rem] font-semibold text-[oklch(0.48_0.12_65)]">Needs Review</span>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeading title={t("profile.themes")} />
          <div className="flex flex-wrap gap-1.5">
            {profile.themes.map((theme) => <ProfileChip key={theme} label={theme} muted />)}
          </div>
        </Card>

        <Card>
          <SectionHeading title={t("profile.availability")} />
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(profile.availability).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: lavenderSoftLine }}>
                <span className="inline-flex items-center gap-2 text-sm" style={{ color: inkColor }}>
                  <CalendarDays className="size-3.5" style={{ color: mutedColor }} />
                  {availabilityLabels[key] ?? key}
                </span>
                <span className="rounded-full px-2 py-0.5 text-[0.62rem] font-semibold" style={value === "Open" ? { backgroundColor: "oklch(0.94 0.04 150)", color: "oklch(0.4 0.13 150)" } : { backgroundColor: "#F1ECFB", color: lavenderDeep }}>{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <SectionHeading title="Exhibitions & Residencies" />
          <div className="space-y-2">
            {profile.history.map((entry) => (
              <div key={entry} className="flex items-start gap-3 rounded-xl border px-3 py-2.5" style={{ borderColor: lavenderSoftLine }}>
                <span className="mt-1 size-1.5 shrink-0 rounded-full" style={{ backgroundColor: lavenderDeep }} />
                <span className="text-sm" style={{ color: "#4A4458" }}>{entry}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <SectionHeading title="Connect" />
          <div className="flex flex-wrap gap-3">
            <a href={`https://${profile.website}`} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-[#F7F4FF]" style={{ borderColor: lavenderSoftLine, color: inkColor }}>
              <Globe className="size-4" style={{ color: mutedColor }} />
              {profile.website}
            </a>
            <span className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: lavenderSoftLine, color: inkColor }}>
              <AtSign className="size-4" style={{ color: mutedColor }} />
              {profile.instagram}
            </span>
            <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-[#F7F4FF]" style={{ borderColor: lavenderSoftLine, color: inkColor }}>
              <Mail className="size-4" style={{ color: mutedColor }} />
              {profile.email}
            </a>
            <span className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: lavenderSoftLine, color: inkColor }}>
              <MapPin className="size-4" style={{ color: mutedColor }} />
              {profile.location}
            </span>
          </div>
        </Card>
      </div>

      <div className="rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-8 text-center" style={{ boxShadow: cardShadow }}>
        <h2 className="font-serif text-2xl font-semibold tracking-tight" style={{ color: inkColor }}>
          Build a passport once. Keep the artist&rsquo;s voice intact.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: mutedColor }}>
          KLEIO helps artists organize bios, statements, CVs, portfolios, documents, reusable answers, and expression settings so applications stay efficient without flattening the work.
        </p>
        <Link href="/signup/artist/" className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          Create Artist Passport
        </Link>
      </div>
    </div>
  )
}
