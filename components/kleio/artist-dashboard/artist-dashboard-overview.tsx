"use client"

import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  DollarSign,
  FileText,
  Hourglass,
  Mail,
  MessageCircle,
  MoreVertical,
  Search,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react"
import Link from "next/link"
import type { Artist, ArtistDashboardApplicationStatus, ArtistDashboardProfile } from "@/lib/kleio-data"
import type { ArtistAnalytics } from "@/lib/kleio-artist-analytics"
import { formatArtistCurrency } from "@/lib/kleio-artist-analytics"
import type { kleioSyntheticArtistProfiles } from "@/lib/kleio-profile-data"
import { assetPath } from "@/lib/asset-path"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { cn } from "@/lib/utils"

type ArtistAssetProfile = (typeof kleioSyntheticArtistProfiles)[number]

const inkColor = "#292631"
const mutedColor = "#7F7890"
const lavenderLine = "#D8D0F2"
const lavenderSoftLine = "#E7E1F7"
const lavenderMist = "#F7F4FF"
const lavenderHover = "#F3EEFF"
const lavenderAccent = "#A997E8"
const lavenderDeep = "#5B4B8A"
const cardShadow = "0 18px 48px rgba(82, 64, 130, 0.06)"

const cardStyle = {
  borderColor: lavenderSoftLine,
  boxShadow: cardShadow,
} as const

function Card({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("rounded-[1.25rem] border bg-white", className)} style={cardStyle}>
      {children}
    </section>
  )
}

function CardHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-sm font-semibold" style={{ color: inkColor }}>
        {title}
      </h2>
      {action && (
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[0.72rem] font-medium transition-colors hover:opacity-75"
          style={{ color: lavenderDeep }}
        >
          {action}
          <ChevronRight className="size-3.5" />
        </button>
      )}
    </div>
  )
}

function StatusChip({ status }: { status: ArtistDashboardApplicationStatus }) {
  const styleByStatus: Record<ArtistDashboardApplicationStatus, string> = {
    Draft: "bg-[oklch(0.94_0.035_245)] text-[oklch(0.42_0.12_245)]",
    Submitted: "bg-[oklch(0.94_0.04_150)] text-[oklch(0.38_0.11_150)]",
    "Under Review": "bg-[oklch(0.95_0.04_75)] text-[oklch(0.48_0.12_65)]",
    Waiting: "bg-primary/10 text-primary",
    Interview: "bg-[oklch(0.94_0.035_245)] text-[oklch(0.42_0.12_245)]",
    Awarded: "bg-[oklch(0.94_0.04_150)] text-[oklch(0.38_0.11_150)]",
    Declined: "bg-muted text-muted-foreground",
  }

  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-semibold", styleByStatus[status])}>
      {status}
    </span>
  )
}

function ProgressBar({ value, tone = "lavender" }: { value: number; tone?: "lavender" | "green" | "amber" }) {
  const color = tone === "green" ? "bg-[oklch(0.62_0.12_150)]" : tone === "amber" ? "bg-[oklch(0.72_0.14_70)]" : "bg-primary"

  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-primary/10">
      <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
    </div>
  )
}

function TopBar({ artist, portrait }: { artist: Artist; portrait?: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_190px_auto] items-center gap-3 max-lg:grid-cols-1">
      <label
        className="flex h-11 min-w-0 items-center gap-2 rounded-2xl border bg-white px-3"
        style={{ borderColor: lavenderSoftLine, boxShadow: "0 8px 24px rgba(82, 64, 130, 0.04)" }}
      >
        <Search className="size-4 shrink-0" style={{ color: mutedColor }} />
        <input
          type="search"
          placeholder="Search opportunities, programs, or resources..."
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#A8A1B8]"
          style={{ color: inkColor }}
        />
      </label>

      <button
        type="button"
        className="flex h-11 items-center justify-between rounded-2xl border bg-white px-4 text-sm font-medium"
        style={{ borderColor: lavenderSoftLine, color: inkColor }}
      >
        All Programs
        <ChevronDown className="size-4" style={{ color: mutedColor }} />
      </button>

      <div className="flex items-center justify-end gap-2 max-lg:justify-between">
        <button type="button" aria-label="Notifications" className="grid size-10 place-items-center rounded-full border bg-white" style={{ borderColor: lavenderSoftLine }}>
          <Bell className="size-4" style={{ color: lavenderDeep }} />
        </button>
        <button type="button" aria-label="Messages" className="grid size-10 place-items-center rounded-full border bg-white" style={{ borderColor: lavenderSoftLine }}>
          <Mail className="size-4" style={{ color: mutedColor }} />
        </button>
        <button type="button" className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          + New Application
        </button>
        <button type="button" className="flex h-11 items-center gap-3 rounded-2xl border bg-white px-3" style={{ borderColor: lavenderSoftLine }}>
          {portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={assetPath(portrait)} alt={artist.name} className="size-8 rounded-full object-cover" />
          ) : (
            <InitialAvatar name={artist.name} className="size-8 text-[0.68rem]" />
          )}
          <span className="min-w-0 text-left max-sm:hidden">
            <span className="block truncate text-xs font-semibold" style={{ color: inkColor }}>
              {artist.name}
            </span>
            <span className="block truncate text-[0.68rem]" style={{ color: mutedColor }}>
              {artist.discipline}
            </span>
          </span>
          <ChevronDown className="size-3.5 max-sm:hidden" style={{ color: mutedColor }} />
        </button>
      </div>
    </div>
  )
}

function HeroVisual({ image, alt }: { image?: string; alt?: string }) {
  if (image) {
    return (
      <div className="relative min-h-[240px] overflow-hidden rounded-[1.25rem]" style={{ backgroundColor: lavenderMist }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetPath(image)} alt={alt ?? ""} className="absolute inset-0 size-full object-cover" />
      </div>
    )
  }

  return (
    <div className="relative min-h-[240px] overflow-hidden rounded-[1.25rem]" style={{ backgroundColor: lavenderMist }} aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_30%,rgba(169,151,232,0.32),transparent_30%),radial-gradient(circle_at_25%_76%,rgba(216,208,242,0.55),transparent_34%),linear-gradient(135deg,#fff,#F7F4FF)]" />
      <div className="absolute bottom-8 left-9 h-24 w-28 rounded-[50%] border border-white/80 bg-white/55 shadow-[0_18px_42px_rgba(82,64,130,0.12)] backdrop-blur" />
      <div className="absolute bottom-16 left-24 h-28 w-px rotate-[18deg] bg-[#B9ACDF]" />
      <div className="absolute bottom-28 left-28 h-16 w-10 rounded-full border border-[#B9ACDF] bg-white/35 rotate-[-28deg]" />
      <div className="absolute bottom-32 left-14 h-14 w-8 rounded-full border border-[#B9ACDF] bg-white/35 rotate-[34deg]" />
      <div className="absolute right-10 top-10 h-28 w-28 rounded-full bg-white/40 blur-2xl" />
    </div>
  )
}

function DashboardStat({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string
  detail: string
  icon: typeof FileText
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 first:pl-0 last:pr-0 max-md:px-0">
      <div className="min-w-0">
        <p className="text-[0.68rem] font-semibold uppercase tracking-wide" style={{ color: mutedColor }}>
          {label}
        </p>
        <p className="mt-2 font-serif text-3xl font-semibold tabular-nums" style={{ color: inkColor }}>
          {value}
        </p>
        <p className="mt-1 text-[0.72rem]" style={{ color: mutedColor }}>
          {detail}
        </p>
      </div>
      <span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ backgroundColor: lavenderMist, color: lavenderDeep }}>
        <Icon className="size-4" />
      </span>
    </div>
  )
}

function HeroCard({
  profile,
  assetProfile,
  analytics,
}: {
  profile: ArtistDashboardProfile
  assetProfile?: ArtistAssetProfile
  analytics: ArtistAnalytics
}) {
  const funding = formatArtistCurrency(analytics.potentialFunding)

  const title = assetProfile?.dashboardHero.title ?? profile.hero.title
  const subtitle = assetProfile?.dashboardHero.subtitle ?? profile.hero.subtitle
  // Hero composites bake in mockup text; the selected-work images are clean artwork, so use one here.
  const heroArtwork = assetProfile?.selectedWorks[0]

  return (
    <section className="grid min-h-[260px] grid-cols-[260px_minmax(0,1fr)] overflow-hidden rounded-[1.5rem] border bg-white p-4 max-lg:grid-cols-1" style={cardStyle}>
      <HeroVisual image={heroArtwork?.image} alt={heroArtwork ? `${assetProfile?.displayName} — ${heroArtwork.title}` : undefined} />
      <div className="flex min-w-0 flex-col justify-center p-6 max-md:p-4">
        {assetProfile && (
          <div className="mb-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetPath(assetProfile.portrait)} alt={assetProfile.displayName} className="size-11 rounded-full border-2 border-[#F1ECFB] object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: inkColor }}>
                {assetProfile.displayName}
              </p>
              <Link href={`/artist/${assetProfile.username}/`} className="text-[0.72rem] font-medium transition-opacity hover:opacity-75" style={{ color: lavenderDeep }}>
                View public profile →
              </Link>
            </div>
          </div>
        )}
        <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl" style={{ color: inkColor }}>
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: mutedColor }}>
          {subtitle}
        </p>
        {assetProfile && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {assetProfile.practiceTags.map((tag) => (
              <span key={tag} className="rounded-full px-2 py-0.5 text-[0.62rem] font-medium" style={{ backgroundColor: lavenderMist, color: lavenderDeep }}>
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-7 grid grid-cols-4 divide-x max-md:grid-cols-2 max-md:gap-4 max-md:divide-x-0" style={{ borderColor: lavenderSoftLine }}>
          <DashboardStat label="Active Applications" value={String(analytics.activeApplications)} detail={`${analytics.dueSoon} due soon`} icon={FileText} />
          <DashboardStat label="Upcoming Deadlines" value={String(analytics.upcomingDeadlines)} detail={`Next: ${analytics.nextDeadline}`} icon={CalendarDays} />
          <DashboardStat label="Pending Decisions" value={String(analytics.pendingDecisions)} detail={`${analytics.overdueDecisions} overdue`} icon={Hourglass} />
          <DashboardStat label="Potential Funding" value={funding} detail={`Across ${analytics.opportunityCount} opportunities`} icon={DollarSign} />
        </div>
      </div>
    </section>
  )
}

function SelectedWorksPreview({ assetProfile }: { assetProfile: ArtistAssetProfile }) {
  return (
    <Card className="p-4">
      <CardHeader title="Selected Works" action="View public profile" />
      <div className="grid grid-cols-3 gap-2">
        {assetProfile.selectedWorks.map((work) => (
          <Link
            key={work.title}
            href={`/artist/${assetProfile.username}/`}
            className="group block overflow-hidden rounded-xl border"
            style={{ borderColor: lavenderSoftLine }}
          >
            <span className="relative block aspect-[4/3] overflow-hidden bg-[#F7F4FF]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetPath(work.image)} alt={work.title} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </span>
            <span className="block truncate px-2 py-1.5 text-[0.68rem] font-medium" style={{ color: inkColor }}>
              {work.title}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  )
}

function ApplicationTracker({ profile }: { profile: ArtistDashboardProfile }) {
  return (
    <Card className="p-4">
      <CardHeader title="Application Tracker" action="View all applications" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <thead>
            <tr className="border-b text-[0.68rem] uppercase tracking-wide" style={{ borderColor: lavenderSoftLine, color: mutedColor }}>
              <th className="py-2 font-semibold">Program</th>
              <th className="py-2 font-semibold">Status</th>
              <th className="py-2 font-semibold">Due Date</th>
              <th className="py-2 font-semibold">Updated</th>
              <th className="py-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profile.applications.map((app) => (
              <tr key={app.program} className="border-b last:border-0" style={{ borderColor: lavenderSoftLine }}>
                <td className="py-3 text-sm font-medium" style={{ color: inkColor }}>
                  {app.program}
                </td>
                <td className="py-3">
                  <StatusChip status={app.status} />
                </td>
                <td className="py-3 text-sm" style={{ color: app.note ? "#A85656" : inkColor }}>
                  <span>{app.dueDate}</span>
                  {app.note && <span className="ml-2 rounded-full bg-[oklch(0.96_0.035_25)] px-2 py-0.5 text-[0.62rem] font-semibold text-[oklch(0.48_0.14_25)]">{app.note}</span>}
                </td>
                <td className="py-3 text-sm" style={{ color: mutedColor }}>
                  {app.updated}
                </td>
                <td className="py-3 text-right">
                  <button type="button" aria-label={`Actions for ${app.program}`} className="inline-grid size-8 place-items-center rounded-full transition-colors hover:bg-primary/5">
                    <MoreVertical className="size-4" style={{ color: mutedColor }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function DecisionTimeline({ profile }: { profile: ArtistDashboardProfile }) {
  return (
    <Card className="p-4">
      <CardHeader title="Decision Timeline" action="View all" />
      <div className="space-y-3">
        {profile.timeline.map((item) => (
          <div key={item.program} className="flex gap-3">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full" style={{ backgroundColor: item.tone === "overdue" ? "#FFF4F4" : lavenderMist, color: item.tone === "overdue" ? "#A85656" : lavenderDeep }}>
              {item.tone === "overdue" ? <Hourglass className="size-4" /> : <Clock3 className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium" style={{ color: inkColor }}>
                {item.program}
              </p>
              <p className="text-xs" style={{ color: mutedColor }}>
                {item.expected}
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium" style={{ color: item.tone === "overdue" ? "#A85656" : mutedColor }}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ArtistSpectrumMatches({ profile }: { profile: ArtistDashboardProfile }) {
  return (
    <Card className="p-4">
      <CardHeader title="Artist Spectrum Matches" action="View all" />
      <p className="mb-3 text-xs leading-relaxed" style={{ color: mutedColor }}>
        Suggested based on practice context and opportunity fit.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {profile.collaboratorMatches.map((match) => (
          <article key={match.name} className="rounded-2xl border bg-white p-3" style={{ borderColor: lavenderSoftLine }}>
            <InitialAvatar name={match.name} className="size-11 text-xs" />
            <h3 className="mt-3 text-sm font-semibold" style={{ color: inkColor }}>
              {match.name}
            </h3>
            <p className="text-[0.68rem]" style={{ color: mutedColor }}>
              {match.location}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {match.tags.map((tag) => (
                <span key={tag} className="rounded-full px-2 py-0.5 text-[0.62rem] font-medium" style={{ backgroundColor: lavenderMist, color: lavenderDeep }}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button type="button" className="h-8 flex-1 rounded-lg border text-xs font-semibold transition-colors hover:bg-primary/5" style={{ borderColor: lavenderLine, color: lavenderDeep }}>
                Invite
              </button>
              <button type="button" aria-label={`Message ${match.name}`} className="grid size-8 place-items-center rounded-lg border transition-colors hover:bg-primary/5" style={{ borderColor: lavenderLine, color: lavenderDeep }}>
                <MessageCircle className="size-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </Card>
  )
}

function NextBestActions({ profile }: { profile: ArtistDashboardProfile }) {
  return (
    <Card className="p-4">
      <CardHeader title="Next Best Actions" />
      <div className="space-y-3">
        {profile.nextActions.map((action, index) => (
          <div key={action.program} className="flex items-start gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold" style={{ backgroundColor: lavenderMist, color: lavenderDeep }}>
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: inkColor }}>
                {action.program}
              </p>
              <p className="text-xs" style={{ color: mutedColor }}>
                {action.task}
              </p>
            </div>
            <span className="shrink-0 text-[0.68rem] font-medium" style={{ color: action.tone === "follow-up" ? "#A85656" : mutedColor }}>
              {action.due}
            </span>
          </div>
        ))}
      </div>
      <button type="button" className="mt-4 flex w-full items-center justify-between border-t pt-3 text-xs font-medium" style={{ borderColor: lavenderSoftLine, color: lavenderDeep }}>
        View all actions
        <ChevronRight className="size-3.5" />
      </button>
    </Card>
  )
}

function PassportCompleteness({
  profile,
  analytics,
}: {
  profile: ArtistDashboardProfile
  analytics: ArtistAnalytics
}) {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold" style={{ color: inkColor }}>
          Passport Completeness
        </h2>
        <span className="rounded-full px-2 py-1 text-[0.65rem] font-semibold" style={{ backgroundColor: lavenderMist, color: lavenderDeep }}>
          {analytics.passportCompletenessPct}% Complete
        </span>
      </div>
      <div className="space-y-2.5">
        {profile.passportCompleteness.map((item) => (
          <div key={item.label} className="grid grid-cols-[1fr_92px_16px] items-center gap-2">
            <span className="inline-flex min-w-0 items-center gap-2 text-xs" style={{ color: inkColor }}>
              <FileText className="size-3.5 shrink-0" style={{ color: mutedColor }} />
              <span className="truncate">{item.label}</span>
            </span>
            <ProgressBar value={item.progress} tone={item.status === "complete" ? "green" : "amber"} />
            {item.status === "complete" ? (
              <CheckCircle2 className="size-3.5 text-[oklch(0.55_0.13_150)]" />
            ) : (
              <span className="grid size-3.5 place-items-center rounded-full bg-[oklch(0.93_0.05_70)] text-[0.55rem] font-bold text-[oklch(0.45_0.13_55)]">!</span>
            )}
          </div>
        ))}
      </div>
      <button type="button" className="mt-4 flex w-full items-center justify-between border-t pt-3 text-xs font-medium" style={{ borderColor: lavenderSoftLine, color: lavenderDeep }}>
        Review passport
        <ChevronRight className="size-3.5" />
      </button>
    </Card>
  )
}

function QuietInsights({ profile }: { profile: ArtistDashboardProfile }) {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4" style={{ color: lavenderDeep }} />
          <h2 className="text-sm font-semibold" style={{ color: inkColor }}>
            Quiet Insights
          </h2>
        </div>
        <span className="rounded-full px-2 py-0.5 text-[0.62rem] font-semibold" style={{ backgroundColor: lavenderMist, color: lavenderDeep }}>
          New
        </span>
      </div>
      <ul className="space-y-2.5">
        {profile.quietInsights.map((insight) => (
          <li key={insight} className="flex gap-2 text-xs leading-relaxed" style={{ color: mutedColor }}>
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
            {insight}
          </li>
        ))}
      </ul>
    </Card>
  )
}

function FundingReadiness({ analytics }: { analytics: ArtistAnalytics }) {
  const metrics = [
    { label: "Estimated Fit", value: analytics.fundingReadiness.estimatedFit, tone: "lavender" as const },
    { label: "Completeness", value: analytics.fundingReadiness.completeness, tone: "lavender" as const },
    { label: "Timeline Confidence", value: analytics.fundingReadiness.timelineConfidence, tone: "amber" as const },
  ]

  return (
    <Card className="p-4">
      <CardHeader title="Funding Readiness" />
      <div className="space-y-3">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span style={{ color: mutedColor }}>{metric.label}</span>
              <span className="font-semibold tabular-nums" style={{ color: inkColor }}>
                {metric.value == null ? "Prepared for scoring" : `${metric.value}%`}
              </span>
            </div>
            {metric.value != null ? (
              <ProgressBar value={metric.value} tone={metric.tone} />
            ) : (
              <p className="text-[0.68rem]" style={{ color: mutedColor }}>
                Prepared for scoring
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs" style={{ color: mutedColor }}>
        Keep going — you are on track.
      </p>
    </Card>
  )
}

export function ArtistDashboardOverview({
  artist,
  profile,
  assetProfile,
  analytics,
}: {
  artist: Artist
  profile: ArtistDashboardProfile
  assetProfile?: ArtistAssetProfile
  analytics: ArtistAnalytics
}) {
  return (
    <div className="mx-auto grid w-full max-w-[1540px] grid-cols-[minmax(0,1fr)_330px] gap-5 px-5 py-5 max-2xl:grid-cols-[minmax(0,1fr)_310px] max-xl:grid-cols-1 max-lg:px-4">
      <section className="min-w-0 space-y-4">
        <TopBar artist={artist} portrait={assetProfile?.portrait} />
        <HeroCard profile={profile} assetProfile={assetProfile} analytics={analytics} />
        <ApplicationTracker profile={profile} />
        <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
          <DecisionTimeline profile={profile} />
          <ArtistSpectrumMatches profile={profile} />
        </div>
      </section>

      <aside className="min-w-0 space-y-4">
        <NextBestActions profile={profile} />
        <PassportCompleteness profile={profile} analytics={analytics} />
        {assetProfile && <SelectedWorksPreview assetProfile={assetProfile} />}
        <QuietInsights profile={profile} />
        <FundingReadiness analytics={analytics} />
      </aside>
    </div>
  )
}
