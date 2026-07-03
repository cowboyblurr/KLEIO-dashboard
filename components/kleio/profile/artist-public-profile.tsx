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
  Share2,
} from "lucide-react"
import { assetPath } from "@/lib/asset-path"
import type { kleioSyntheticArtistProfiles } from "@/lib/kleio-profile-data"
import { ProfileChip } from "@/components/kleio/profile/profile-chip"

type ArtistProfile = (typeof kleioSyntheticArtistProfiles)[number]

const inkColor = "#292631"
const mutedColor = "#7F7890"
const lavenderSoftLine = "#E7E1F7"
const lavenderDeep = "#5B4B8A"
const cardShadow = "0 18px 48px rgba(82, 64, 130, 0.08)"

const cardStyle = { borderColor: lavenderSoftLine, boxShadow: cardShadow } as const

const materialLabels: Record<string, string> = {
  bio: "Bio",
  artistStatement: "Artist Statement",
  cvResume: "CV / Resume",
  portfolio: "Portfolio",
  workSamples: "Work Samples",
  references: "References",
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

export function ArtistPublicProfile({ profile }: { profile: ArtistProfile }) {
  const [confirmation, setConfirmation] = useState<string | null>(null)

  function demoAction(message: string) {
    setConfirmation(message)
    setTimeout(() => setConfirmation(null), 3000)
  }

  const statementExcerpt = profile.artistStatement.split(". ").slice(0, 2).join(". ")

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-[1.5rem] border bg-white" style={cardStyle}>
        <div className="grid gap-6 p-5 lg:grid-cols-[auto_minmax(0,1fr)] xl:p-6">
          <div className="flex justify-center lg:block">
            <div className="size-28 overflow-hidden rounded-full border-4 border-[#F1ECFB] bg-[#F7F4FF] shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetPath(profile.portrait)}
                alt={profile.displayName}
                className="h-full w-full object-cover object-center"
              />
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em]" style={{ color: lavenderDeep }}>
              Artist Profile
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-3xl font-semibold tracking-tight" style={{ color: inkColor }}>
                {profile.displayName}
              </h1>
              <BadgeCheck className="size-5" style={{ color: lavenderDeep }} aria-label="Creative Passport" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#D8D0F2] bg-[#F7F4FF] px-2.5 py-1 text-[0.68rem] font-semibold" style={{ color: lavenderDeep }}>
                {profile.profileBadge}
              </span>
              <span className="text-sm" style={{ color: mutedColor }}>
                {profile.role} · {profile.location}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.practiceTags.map((tag) => (
                <ProfileChip key={tag} label={tag} />
              ))}
            </div>
            <p className="mt-4 max-w-xl text-sm leading-relaxed" style={{ color: "#4A4458" }}>
              {statementExcerpt}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => demoAction("Portfolio preview opened")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <ExternalLink className="size-3.5" />
                View Portfolio
              </button>
              <button
                type="button"
                onClick={() => demoAction("Share link copied")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3 text-xs font-semibold transition-colors hover:bg-[#F7F4FF]"
                style={{ color: lavenderDeep }}
              >
                <Share2 className="size-3.5" />
                Share Profile
              </button>
              <Link
                href="/signup/artist/"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D8D0F2] bg-white px-3 text-center text-xs font-semibold transition-colors hover:bg-[#F7F4FF]"
                style={{ color: lavenderDeep }}
              >
                Create Passport
              </Link>
            </div>
            {confirmation && (
              <div role="status" className="mt-3 flex items-center gap-2 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-3 py-2 text-xs text-[oklch(0.4_0.12_150)]">
                <CheckCircle2 className="size-3.5 shrink-0" />
                {confirmation} <span className="opacity-70">(demo only)</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 xl:px-6 xl:pb-6">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border bg-[#F7F4FF]" style={{ borderColor: lavenderSoftLine }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetPath(profile.heroImage)}
              alt={`${profile.displayName} featured practice image`}
              className="h-full w-full object-cover object-center"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/15 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* Selected Works */}
      <Card>
        <SectionHeading title="Selected Works" action="View all works" />
        <p className="mb-4 max-w-2xl text-xs leading-relaxed" style={{ color: mutedColor }}>
          A focused view of works connected to the artist&rsquo;s current practice and application materials.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profile.selectedWorks.map((work) => (
            <article key={work.title} className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: lavenderSoftLine }}>
              <div className="relative aspect-[4/3] overflow-hidden bg-[#F7F4FF]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={assetPath(work.image)}
                  alt={work.title}
                  className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-[1.03]"
                />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold" style={{ color: inkColor }}>
                  {work.title}
                </h3>
                <p className="mt-0.5 text-xs" style={{ color: mutedColor }}>
                  {work.year} · {work.medium}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: mutedColor }}>
                  {work.details}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Card>

      {/* Detail grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionHeading title="About / Practice" action="Read full statement" />
          <p className="text-sm leading-relaxed" style={{ color: "#4A4458" }}>
            {profile.shortBio}
          </p>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: mutedColor }}>
            {profile.artistStatement}
          </p>
        </Card>

        <Card>
          <SectionHeading title="Materials Ready" />
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(profile.materialsReady).map(([key, ready]) => (
              <div key={key} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: lavenderSoftLine }}>
                <span className="text-sm" style={{ color: inkColor }}>
                  {materialLabels[key] ?? key}
                </span>
                {ready ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.94_0.04_150)] px-2 py-0.5 text-[0.62rem] font-semibold text-[oklch(0.4_0.13_150)]">
                    <CheckCircle2 className="size-3" />
                    Ready
                  </span>
                ) : (
                  <span className="rounded-full bg-[oklch(0.95_0.04_75)] px-2 py-0.5 text-[0.62rem] font-semibold text-[oklch(0.48_0.12_65)]">
                    Needs Review
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeading title="Themes" />
          <div className="flex flex-wrap gap-1.5">
            {profile.themes.map((theme) => (
              <ProfileChip key={theme} label={theme} muted />
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeading title="Availability" />
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(profile.availability).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: lavenderSoftLine }}>
                <span className="inline-flex items-center gap-2 text-sm" style={{ color: inkColor }}>
                  <CalendarDays className="size-3.5" style={{ color: mutedColor }} />
                  {availabilityLabels[key] ?? key}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[0.62rem] font-semibold"
                  style={
                    value === "Open"
                      ? { backgroundColor: "oklch(0.94 0.04 150)", color: "oklch(0.4 0.13 150)" }
                      : { backgroundColor: "#F1ECFB", color: lavenderDeep }
                  }
                >
                  {value}
                </span>
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
                <span className="text-sm" style={{ color: "#4A4458" }}>
                  {entry}
                </span>
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

      {/* CTA band */}
      <div className="rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-8 text-center" style={{ boxShadow: cardShadow }}>
        <h2 className="font-serif text-2xl font-semibold tracking-tight" style={{ color: inkColor }}>
          Build a passport once. Adapt it for every opportunity.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: mutedColor }}>
          KLEIO helps artists organize bios, statements, CVs, portfolios, documents, and reusable answers so they are
          ready for grants, residencies, exhibitions, and open calls.
        </p>
        <Link
          href="/signup/artist/"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Create Artist Passport
        </Link>
      </div>
    </div>
  )
}
