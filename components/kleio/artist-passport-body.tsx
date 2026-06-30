"use client"

import Image from "next/image"
import { useState } from "react"
import {
  BadgeCheck,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Mail,
  MapPin,
  Plus,
  Share2,
} from "lucide-react"
import type {
  Artist,
  ArtistDocumentMaterial,
  ArtistWork,
  AvailabilityPreference,
  ExhibitionEntry,
} from "@/lib/kleio-data"
import { assetPath } from "@/lib/asset-path"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { cn } from "@/lib/utils"

export function completenessColor(v: number) {
  if (v >= 100) return "stroke-[oklch(0.6_0.13_150)]"
  if (v >= 90) return "stroke-primary"
  if (v >= 70) return "stroke-[oklch(0.7_0.14_70)]"
  return "stroke-[oklch(0.62_0.2_18)]"
}

export function CompletionRing({ value, size = 48 }: { value: number; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value, 100) / 100
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={4} className="stroke-muted" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={4}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        className={completenessColor(value)}
      />
    </svg>
  )
}

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
      <h2 className="font-serif text-lg font-semibold text-foreground">{title}</h2>
      {action && (
        <button type="button" className="text-xs font-medium text-primary hover:text-primary/80">
          {action}
        </button>
      )}
    </div>
  )
}

export function TagChip({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        muted
          ? "bg-muted text-muted-foreground"
          : "bg-[oklch(0.93_0.04_287)] text-[oklch(0.42_0.14_287)]",
      )}
    >
      {label}
    </span>
  )
}

function badgeStyle(badge: ExhibitionEntry["badge"]) {
  switch (badge) {
    case "Residency":
      return "bg-[oklch(0.92_0.05_150)] text-[oklch(0.4_0.13_150)]"
    case "Grant":
    case "Fellowship":
      return "bg-[oklch(0.93_0.05_70)] text-[oklch(0.45_0.13_55)]"
    case "Open Call":
      return "bg-[oklch(0.92_0.05_287)] text-[oklch(0.42_0.16_287)]"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function WorkCard({ work, primary }: { work: ArtistWork; primary?: boolean }) {
  const hasImage = work.image && work.image !== "/placeholder.svg"
  return (
    <div className={cn("group overflow-hidden rounded-2xl border border-border bg-card", primary && "col-span-2 row-span-2")}>
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {hasImage ? (
          <Image
            src={assetPath(work.image)}
            alt={work.title}
            fill
            sizes={primary ? "600px" : "260px"}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[oklch(0.96_0.01_287)]">
            <span className="font-serif text-2xl text-muted-foreground/40">{work.year}</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium text-foreground">{work.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{work.year} · {work.medium}</p>
        {work.dimensions && <p className="mt-0.5 text-xs text-muted-foreground">{work.dimensions}</p>}
      </div>
    </div>
  )
}

function ExhibitionRow({ entry }: { entry: ExhibitionEntry }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/60 py-3 last:border-0">
      <span className="mt-0.5 min-w-[2.5rem] text-xs font-medium tabular-nums text-muted-foreground">{entry.year}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{entry.title}</p>
        <p className="text-xs text-muted-foreground">{entry.venue} · {entry.location}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {entry.badge && (
          <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-semibold", badgeStyle(entry.badge))}>
            {entry.badge}
          </span>
        )}
        <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">{entry.type}</span>
      </div>
    </div>
  )
}

function MaterialRow({ material, showAdd }: { material: ArtistDocumentMaterial; showAdd?: boolean }) {
  const isMissing = material.status === "Missing"
  const isDemo = material.status === "Demo"
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5",
        isMissing ? "border-[oklch(0.88_0.08_70)] bg-[oklch(0.98_0.03_80)]" : "border-border bg-background",
      )}
    >
      <FileText className={cn("size-4 shrink-0", isMissing ? "text-[oklch(0.62_0.16_65)]" : "text-muted-foreground")} />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", isMissing ? "text-[oklch(0.45_0.14_65)]" : "text-foreground")}>{material.label}</p>
        {material.fileName && <p className="text-xs text-muted-foreground">{material.fileName} · {material.fileSize}</p>}
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
          isMissing
            ? "bg-[oklch(0.88_0.08_70)] text-[oklch(0.45_0.14_65)]"
            : isDemo
              ? "bg-primary/10 text-primary"
              : "bg-[oklch(0.92_0.05_150)] text-[oklch(0.4_0.13_150)]",
        )}
      >
        {isMissing ? "Missing" : isDemo ? "Demo" : "Submitted"}
      </span>
    </div>
  )
}

function availabilityStyle(status: AvailabilityPreference["status"]) {
  switch (status) {
    case "Available":
      return "bg-[oklch(0.92_0.05_150)] text-[oklch(0.4_0.13_150)]"
    case "Actively Applying":
      return "bg-primary/10 text-primary"
    case "Limited":
      return "bg-[oklch(0.93_0.05_70)] text-[oklch(0.45_0.13_55)]"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function ArtistPassportHero({
  artist,
  mode = "institution",
}: {
  artist: Artist
  mode?: "artist" | "institution"
}) {
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const hasImage = artist.portfolioImage && artist.portfolioImage !== "/placeholder.svg"

  function demoAction(label: string) {
    setConfirmation(label)
    setTimeout(() => setConfirmation(null), 3000)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: "16/7" }}>
        {hasImage ? (
          <Image
            src={assetPath(artist.portfolioImage)}
            alt={`${artist.name} — featured work`}
            fill
            sizes="900px"
            priority
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[oklch(0.95_0.02_287)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      <div className="p-5 xl:p-6">
        <div className="flex flex-wrap gap-5">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <InitialAvatar name={artist.name} className="size-16 shrink-0 text-lg shadow-md ring-4 ring-background" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl font-semibold text-foreground xl:text-3xl">{artist.name}</h1>
                <BadgeCheck className="size-5 shrink-0 text-primary" aria-label="Verified KLEIO passport" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{artist.discipline} · {artist.medium}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                {artist.location}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {artist.tags.map((tag) => (
                  <TagChip key={tag} label={tag} />
                ))}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              <CompletionRing value={artist.passportCompleteness} size={40} />
              <div>
                <p className="text-sm font-bold text-foreground">{artist.passportCompleteness}%</p>
                <p className="text-[0.65rem] leading-tight text-muted-foreground">Passport<br />complete</p>
              </div>
            </div>
            {mode === "artist" && (
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => demoAction("Portfolio PDF download started")}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Download className="size-3.5" />
                  Download Portfolio PDF
                </button>
                <button
                  type="button"
                  onClick={() => demoAction("Share link copied to clipboard")}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent/50"
                >
                  <Share2 className="size-3.5" />
                  Share Profile
                </button>
              </div>
            )}
            {mode === "institution" && (
              <div className="flex items-center gap-2">
                {artist.website && (
                  <a
                    href={`https://${artist.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Website"
                    className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                  >
                    <Globe className="size-4" />
                  </a>
                )}
                {artist.contactEmail && (
                  <a
                    href={`mailto:${artist.contactEmail}`}
                    aria-label="Email"
                    className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                  >
                    <Mail className="size-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <blockquote className="mt-5 border-l-2 border-primary/40 pl-4 text-sm italic leading-relaxed text-muted-foreground">
          &ldquo;{artist.statement}&rdquo;
        </blockquote>

        {confirmation && (
          <div
            role="status"
            className="mt-4 flex items-center gap-2 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-3 py-2 text-xs text-[oklch(0.4_0.12_150)]"
          >
            <CheckCircle2 className="size-3.5 shrink-0" />
            {confirmation} <span className="opacity-70">(demo only)</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function ArtistPassportSections({
  artist,
  mode = "institution",
}: {
  artist: Artist
  mode?: "artist" | "institution"
}) {
  return (
    <div className="space-y-6">
      {artist.works && artist.works.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:p-6">
          <SectionHeader title="Featured Works" action="View full portfolio →" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {artist.works.map((work, i) => (
              <WorkCard key={work.id} work={work} primary={i === 0} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:p-6">
        <SectionHeader title="About / Practice" />
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Artist Statement</h3>
            <p className="text-sm leading-relaxed text-foreground">{artist.statement}</p>
          </div>
          <div className="border-t border-border/60 pt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bio</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{artist.bio}</p>
          </div>
        </div>
      </section>

      {artist.exhibitions && artist.exhibitions.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:p-6">
          <SectionHeader title="Exhibitions & Residencies" action="View full history →" />
          <div>
            {artist.exhibitions.map((entry, i) => (
              <ExhibitionRow key={i} entry={entry} />
            ))}
          </div>
        </section>
      )}

      {(artist.methods || artist.themes) && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:p-6">
          <SectionHeader title="Mediums, Methods & Themes" />
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Medium</p>
              <div className="flex flex-wrap gap-1.5">
                <TagChip label={artist.medium} />
                {artist.methods?.map((m) => <TagChip key={m} label={m} />)}
              </div>
            </div>
            {artist.themes && (
              <div className="border-t border-border/60 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Themes</p>
                <div className="flex flex-wrap gap-1.5">
                  {artist.themes.map((t) => <TagChip key={t} label={t} muted />)}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {artist.materials && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:p-6">
          <SectionHeader title="Resources & Materials" action={mode === "artist" ? undefined : undefined} />
          <div className="space-y-2">
            {artist.materials.map((m) => (
              <MaterialRow key={m.label} material={m} />
            ))}
            {mode === "artist" && (
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Plus className="size-4" />
                Add New
              </button>
            )}
          </div>
        </section>
      )}

      {artist.availability && mode === "artist" && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:p-6">
          <SectionHeader title="Availability" />
          <div className="grid gap-2 sm:grid-cols-2">
            {artist.availability.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5">
                <span className="text-sm text-foreground">{item.label}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-semibold", availabilityStyle(item.status))}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {(artist.website || artist.instagram || artist.contactEmail) && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:p-6">
          <SectionHeader title="Connect & Contact" />
          <div className="flex flex-wrap gap-3">
            {artist.website && (
              <a
                href={`https://${artist.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent/50"
              >
                <Globe className="size-4 text-muted-foreground" />
                {artist.website}
                <ExternalLink className="size-3 text-muted-foreground" />
              </a>
            )}
            {artist.instagram && (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground">
                <span className="font-mono text-xs text-muted-foreground">@</span>
                {artist.instagram.replace("@", "")}
                <span className="text-[0.65rem] text-muted-foreground">Instagram</span>
              </div>
            )}
            {artist.contactEmail && (
              <a
                href={`mailto:${artist.contactEmail}`}
                className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent/50"
              >
                <Mail className="size-4 text-muted-foreground" />
                {artist.contactEmail}
              </a>
            )}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground">
              <MapPin className="size-4 text-muted-foreground" />
              {artist.location}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
