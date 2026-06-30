"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  Mail,
  MessageSquare,
  Plus,
  Star,
  Users,
} from "lucide-react"
import { artists, allSubmissions, programs, institution } from "@/lib/kleio-data"
import type {
  ArtistDocumentMaterial,
  ArtistWork,
  ExhibitionEntry,
  Submission,
} from "@/lib/kleio-data"
import { assetPath } from "@/lib/asset-path"
import { getSubmissionReviewerProgress } from "@/lib/kleio-analytics"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { StatusPill, PriorityPill } from "@/components/kleio/pills"
import { cn } from "@/lib/utils"

function getScenarioLabel(submission: Submission): string {
  switch (submission.scenario) {
    case "strong-shortlist": return "Strong shortlist candidate"
    case "deadline-triage": return "Deadline triage — action needed"
    case "reviewer-bottleneck": return "Reviewer bottleneck — pending vote"
    default: return "Under review"
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

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

function completenessColor(v: number) {
  if (v >= 100) return "stroke-[oklch(0.6_0.13_150)]"
  if (v >= 90) return "stroke-primary"
  if (v >= 70) return "stroke-[oklch(0.7_0.14_70)]"
  return "stroke-[oklch(0.62_0.2_18)]"
}

function CompletionRing({ value, size = 48 }: { value: number; size?: number }) {
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

// ─── sub-sections ────────────────────────────────────────────────────────────

function SectionHeader({ title, action }: { title: string; action?: string }) {
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

function TagChip({ label, muted }: { label: string; muted?: boolean }) {
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

function WorkCard({ work, primary }: { work: ArtistWork; primary?: boolean }) {
  const hasImage = work.image && work.image !== "/placeholder.svg"
  return (
    <div className={cn("group overflow-hidden rounded-2xl border border-border bg-card", primary && "col-span-2 row-span-2")}>
      <div className={cn("relative overflow-hidden bg-muted", primary ? "aspect-[4/3]" : "aspect-[4/3]")}>
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
        {work.dimensions && (
          <p className="mt-0.5 text-xs text-muted-foreground">{work.dimensions}</p>
        )}
      </div>
    </div>
  )
}

function ExhibitionRow({ entry }: { entry: ExhibitionEntry }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/60 last:border-0">
      <span className="mt-0.5 min-w-[2.5rem] text-xs font-medium tabular-nums text-muted-foreground">
        {entry.year}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{entry.title}</p>
        <p className="text-xs text-muted-foreground">{entry.venue} · {entry.location}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {entry.badge && (
          <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-semibold", badgeStyle(entry.badge))}>
            {entry.badge}
          </span>
        )}
        <span className="rounded-full px-2 py-0.5 text-[0.65rem] font-medium bg-muted text-muted-foreground">
          {entry.type}
        </span>
      </div>
    </div>
  )
}

function MaterialRow({ material }: { material: ArtistDocumentMaterial }) {
  const isMissing = material.status === "Missing"
  const isDemo = material.status === "Demo"
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5",
        isMissing
          ? "border-[oklch(0.88_0.08_70)] bg-[oklch(0.98_0.03_80)]"
          : "border-border bg-background",
      )}
    >
      <FileText
        className={cn("size-4 shrink-0", isMissing ? "text-[oklch(0.62_0.16_65)]" : "text-muted-foreground")}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", isMissing ? "text-[oklch(0.45_0.14_65)]" : "text-foreground")}>
          {material.label}
        </p>
        {material.fileName && (
          <p className="text-xs text-muted-foreground">{material.fileName} · {material.fileSize}</p>
        )}
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

// ─── institution review panel ────────────────────────────────────────────────

function ReviewContextPanel({ submission }: { submission: Submission | undefined }) {
  const [confirmation, setConfirmation] = useState<string | null>(null)

  if (!submission) {
    return (
      <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">No active submission linked to this profile for the current cycle.</p>
      </aside>
    )
  }

  const reviewerProgress = getSubmissionReviewerProgress(submission.id)
  const program = programs.find((p) => p.id === submission.programId)
  const scenarioLabel = getScenarioLabel(submission)

  function fireAction(label: string) {
    setConfirmation(`${label} — recorded in this session.`)
    setTimeout(() => setConfirmation(null), 4000)
  }

  return (
    <aside className="space-y-3">
      {/* Institution context card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Scenario strip */}
        <div className="border-b border-primary/15 bg-primary/5 px-4 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-primary">{scenarioLabel}</span>
            <span className="text-xs text-muted-foreground">{submission.decisionStage}</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Submission + program */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Submission</p>
            <p className="font-medium text-foreground">{submission.projectTitle}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{submission.program}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Deadline: {program?.deadline ?? "—"}</p>
          </div>

          {/* Status + priority */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusPill status={submission.status} />
            <PriorityPill priority={submission.priority} />
          </div>

          {/* Completeness */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3">
            <CompletionRing value={submission.completeness} size={44} />
            <div>
              <p className="text-sm font-semibold text-foreground">{submission.completeness}% complete</p>
              <p className="text-xs text-muted-foreground">Application materials</p>
            </div>
          </div>

          {/* Missing materials */}
          {submission.missingMaterials?.length ? (
            <div className="rounded-xl border border-[oklch(0.88_0.08_70)] bg-[oklch(0.98_0.035_80)] p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-[oklch(0.62_0.16_65)]" />
                <div>
                  <p className="text-xs font-semibold text-[oklch(0.45_0.14_65)] mb-1">Missing materials</p>
                  <ul className="space-y-0.5">
                    {submission.missingMaterials.map((item) => (
                      <li key={item} className="text-xs text-[oklch(0.45_0.14_65)]">· {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          {/* Reviewer progress */}
          {reviewerProgress.total > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-foreground">Reviewer progress</p>
                <span className="text-xs font-semibold text-primary">
                  {reviewerProgress.completed}/{reviewerProgress.total}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted mb-2">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(reviewerProgress.completed / reviewerProgress.total) * 100}%` }}
                />
              </div>
              <ul className="space-y-1.5">
                {reviewerProgress.reviews.map((r) => (
                  <li key={r.reviewerId} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <InitialAvatar name={r.reviewerName} className="size-5 text-[0.55rem]" />
                      <span className="text-xs text-foreground">{r.reviewerName}</span>
                    </div>
                    <span
                      className={cn(
                        "text-[0.65rem] font-medium",
                        r.status === "Completed" ? "text-[oklch(0.4_0.13_150)]" : "text-muted-foreground",
                      )}
                    >
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Score */}
          {submission.score !== null && submission.score !== undefined && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Star className="size-3.5 text-[oklch(0.74_0.15_60)]" />
                <span className="text-xs font-medium text-foreground">Committee score</span>
              </div>
              <span className="text-sm font-bold text-foreground">{submission.score}/100</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Institution Actions</p>

        {confirmation && (
          <div
            role="status"
            className="mb-2 flex items-start gap-2 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-3 py-2 text-xs leading-relaxed text-[oklch(0.4_0.12_150)]"
          >
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
            <span>{confirmation} <span className="opacity-70">(demo only)</span></span>
          </div>
        )}

        <button
          type="button"
          onClick={() => fireAction("Moved to shortlist")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Bookmark className="size-4" />
          Move to Shortlist
        </button>

        <button
          type="button"
          onClick={() => fireAction("Information request drafted")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
        >
          <AlertCircle className="size-4 text-muted-foreground" />
          Request Additional Information
        </button>

        <button
          type="button"
          onClick={() => fireAction("Internal note added")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
        >
          <Plus className="size-4 text-muted-foreground" />
          Add Internal Note
        </button>

        <Link
          href="/messages/"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
        >
          <MessageSquare className="size-4 text-muted-foreground" />
          Message Artist
        </Link>
      </div>

      {/* Back link */}
      <Link
        href="/review-queue/"
        className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/50"
      >
        <ArrowLeft className="size-4" />
        Back to Review Queue
      </Link>
    </aside>
  )
}

// ─── main view ───────────────────────────────────────────────────────────────

export function ArtistPassportView({ artistId }: { artistId: string }) {
  const artist = artists.find((a) => a.id === artistId)
  const submission = allSubmissions.find((s) => s.artistId === artistId)

  if (!artist) {
    return (
      <main className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="font-serif text-xl text-foreground">Artist not found</p>
          <Link href="/artists/" className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80">
            <ArrowLeft className="size-4" />
            Back to Artists
          </Link>
        </div>
      </main>
    )
  }

  const hasImage = artist.portfolioImage && artist.portfolioImage !== "/placeholder.svg"

  return (
    <main className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-[1400px] px-5 py-6 xl:px-8 xl:py-7">
        {/* Breadcrumb */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/review-queue/" className="hover:text-foreground transition-colors">
              Review Queue
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground font-medium">{artist.name}</span>
          </div>
          <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {institution.demoLabel}
          </span>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">

          {/* ── Main column ─────────────────────────────────────────────── */}
          <div className="space-y-6 min-w-0">

            {/* Hero card */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {/* Artwork hero image */}
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
                {/* Subtle gradient overlay at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>

              {/* Artist info band */}
              <div className="p-5 xl:p-6">
                <div className="flex flex-wrap gap-5">
                  {/* Left: avatar + identity */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <InitialAvatar
                      name={artist.name}
                      className="size-16 shrink-0 text-lg ring-4 ring-background shadow-md"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="font-serif text-2xl font-semibold text-foreground xl:text-3xl">
                          {artist.name}
                        </h1>
                        <BadgeCheck className="size-5 shrink-0 text-primary" aria-label="Verified KLEIO passport" />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {artist.discipline} · {artist.medium}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <span>📍</span>
                        {artist.location}
                      </p>

                      {/* Tags */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {artist.tags.map((tag) => (
                          <TagChip key={tag} label={tag} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: completeness + contact icons */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <CompletionRing value={artist.passportCompleteness} size={40} />
                        <div>
                          <p className="text-sm font-bold text-foreground">{artist.passportCompleteness}%</p>
                          <p className="text-[0.65rem] text-muted-foreground leading-tight">Passport<br />complete</p>
                        </div>
                      </div>
                    </div>
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
                  </div>
                </div>

                {/* Statement excerpt */}
                <blockquote className="mt-5 border-l-2 border-primary/40 pl-4 text-sm leading-relaxed text-muted-foreground italic">
                  "{artist.statement}"
                </blockquote>
              </div>
            </div>

            {/* Featured Works */}
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

            {/* About / Practice */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:p-6">
              <SectionHeader title="About / Practice" />
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Artist Statement
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground">{artist.statement}</p>
                </div>
                <div className="border-t border-border/60 pt-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Bio
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{artist.bio}</p>
                </div>
              </div>
            </section>

            {/* Exhibitions & Residencies */}
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

            {/* Mediums, Methods & Themes */}
            {(artist.methods || artist.themes) && (
              <section className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:p-6">
                <SectionHeader title="Mediums, Methods & Themes" />
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Medium
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <TagChip label={artist.medium} />
                      {artist.methods?.map((m) => <TagChip key={m} label={m} />)}
                    </div>
                  </div>
                  {artist.themes && (
                    <div className="border-t border-border/60 pt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Themes
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {artist.themes.map((t) => <TagChip key={t} label={t} muted />)}
                      </div>
                    </div>
                  )}
                  <div className="border-t border-border/60 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Discipline
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <TagChip label={artist.discipline} muted />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Resources & Materials */}
            {artist.materials && (
              <section className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:p-6">
                <SectionHeader title="Resources & Materials" />
                <div className="space-y-2">
                  {artist.materials.map((m) => (
                    <MaterialRow key={m.label} material={m} />
                  ))}
                </div>
                {artist.materials.some((m) => m.status === "Missing") && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Missing materials are flagged for follow-up. Use "Request Additional Information" to send a single consolidated request.
                  </p>
                )}
              </section>
            )}

            {/* Contact */}
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
                      <span className="text-muted-foreground text-xs font-mono">@</span>
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
                </div>
              </section>
            )}
          </div>

          {/* ── Right panel ─────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-0">
            <ReviewContextPanel submission={submission} />
          </div>
        </div>
      </div>
    </main>
  )
}
