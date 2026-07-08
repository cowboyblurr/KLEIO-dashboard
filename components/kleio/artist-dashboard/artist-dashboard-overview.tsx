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
} from "lucide-react"
import Link from "next/link"
import type { Artist, ArtistDashboardApplicationStatus, ArtistDashboardProfile } from "@/lib/kleio-data"
import type { ArtistAnalytics } from "@/lib/kleio-artist-analytics"
import { formatArtistCurrency, formatArtistNextDeadline, formatArtistPct } from "@/lib/kleio-artist-analytics"
import type { kleioSyntheticArtistProfiles } from "@/lib/kleio-profile-data"
import { assetPath } from "@/lib/asset-path"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { translateStatus } from "@/lib/kleio-i18n"
import { cn } from "@/lib/utils"

type ArtistAssetProfile = (typeof kleioSyntheticArtistProfiles)[number]

const inkColor = "#292631"
const mutedColor = "#7F7890"
const lavenderLine = "#D8D0F2"
const lavenderSoftLine = "#E7E1F7"
const lavenderMist = "#F7F4FF"
const lavenderDeep = "#5B4B8A"
const cardShadow = "0 18px 48px rgba(82, 64, 130, 0.06)"

const cardStyle = {
  borderColor: lavenderSoftLine,
  boxShadow: cardShadow,
} as const

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
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
        <button type="button" className="inline-flex items-center gap-1 text-[0.72rem] font-medium transition-opacity hover:opacity-75" style={{ color: lavenderDeep }}>
          {action}
          <ChevronRight className="size-3.5" />
        </button>
      )}
    </div>
  )
}

function StatusChip({ status }: { status: ArtistDashboardApplicationStatus }) {
  const { locale } = useKleioLocale()
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
      {translateStatus(locale, status)}
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
  const { t } = useKleioLocale()

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_190px_auto] items-center gap-3 max-lg:grid-cols-1">
      <label className="flex h-11 min-w-0 items-center gap-2 rounded-2xl border bg-white px-3" style={{ borderColor: lavenderSoftLine, boxShadow: "0 8px 24px rgba(82, 64, 130, 0.04)" }}>
        <Search className="size-4 shrink-0" style={{ color: mutedColor }} />
        <input type="search" placeholder={t("artist.workspace.overview.searchPlaceholder")} className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#A8A1B8]" style={{ color: inkColor }} />
      </label>

      <button type="button" className="flex h-11 items-center justify-between rounded-2xl border bg-white px-4 text-sm font-medium" style={{ borderColor: lavenderSoftLine, color: inkColor }}>
        {t("artist.workspace.overview.allPrograms")}
        <ChevronDown className="size-4" style={{ color: mutedColor }} />
      </button>

      <div className="flex items-center justify-end gap-2 max-lg:justify-between">
        <button type="button" aria-label={t("artist.workspace.overview.notifications")} className="grid size-10 place-items-center rounded-full border bg-white" style={{ borderColor: lavenderSoftLine }}>
          <Bell className="size-4" style={{ color: lavenderDeep }} />
        </button>
        <button type="button" aria-label={t("artist.workspace.overview.messages")} className="grid size-10 place-items-center rounded-full border bg-white" style={{ borderColor: lavenderSoftLine }}>
          <Mail className="size-4" style={{ color: mutedColor }} />
        </button>
        <button type="button" className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          {t("artist.workspace.overview.newApplication")}
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

function AmbientStudioAccent() {
  return (
    <div className="relative min-h-[315px] overflow-hidden rounded-[1.25rem] bg-[#F8F4FF] max-lg:min-h-[245px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(255,255,255,0.84),transparent_26%),radial-gradient(circle_at_31%_61%,rgba(206,190,232,0.38),transparent_36%),linear-gradient(130deg,#ECE3F4_0%,#F8F4FF_48%,#FFFFFF_100%)]" />
      <div aria-hidden="true" className="absolute -left-16 bottom-0 h-52 w-64 rounded-full bg-white/55 blur-3xl" />
      <div aria-hidden="true" className="absolute left-6 top-8 h-[78%] w-24 rounded-[1.4rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(231,222,240,0.28))] shadow-[20px_0_42px_rgba(82,64,130,0.08)]" />
      <div aria-hidden="true" className="absolute bottom-0 left-0 h-24 w-44 rounded-tr-[5rem] bg-white/45 blur-xl" />

      <div aria-hidden="true" className="absolute bottom-0 left-0 h-24 w-44 rounded-tr-[4rem] bg-[linear-gradient(25deg,rgba(255,255,255,0.96),rgba(238,232,244,0.68))] shadow-[0_-18px_42px_rgba(82,64,130,0.08)]" />
      <div aria-hidden="true" className="absolute bottom-4 left-8 h-14 w-40 rounded-[50%] bg-[linear-gradient(180deg,#F5EFE7,#D8C9BB)] shadow-[0_20px_50px_rgba(73,57,91,0.14)]" />
      <div aria-hidden="true" className="absolute bottom-8 left-11 h-[4.75rem] w-28 rounded-[50%] border border-white/70 bg-[linear-gradient(145deg,#F9F5EE,#E8DED3)] shadow-[inset_-12px_-18px_28px_rgba(111,91,75,0.12),0_16px_34px_rgba(82,64,130,0.1)]" />

      <div aria-hidden="true" className="absolute bottom-[5.9rem] left-[4.6rem] h-24 w-16 rounded-[54%_46%_47%_53%] bg-[linear-gradient(145deg,#FBF8F2,#E2D5C8)] shadow-[inset_-10px_-18px_24px_rgba(87,67,52,0.12),0_18px_44px_rgba(82,64,130,0.12)]" />
      <div aria-hidden="true" className="absolute bottom-[11.25rem] left-[5.72rem] h-7 w-7 rounded-[50%] bg-[#F6EFE7] shadow-[inset_-4px_-5px_8px_rgba(87,67,52,0.1)]" />
      <div aria-hidden="true" className="absolute bottom-[12.15rem] left-[6.32rem] h-28 w-px -rotate-[13deg] bg-[#6A563D]/72" />
      <div aria-hidden="true" className="absolute bottom-[13.8rem] left-[4.85rem] h-20 w-px rotate-[30deg] bg-[#7C674B]/54" />
      <div aria-hidden="true" className="absolute bottom-[15.8rem] left-[6.9rem] h-24 w-px rotate-[36deg] bg-[#6A563D]/56" />
      <div aria-hidden="true" className="absolute bottom-[18.4rem] left-[6.08rem] h-9 w-5 rotate-[31deg] rounded-[50%] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(229,215,200,0.34))] shadow-[0_8px_18px_rgba(82,64,130,0.08)]" />
      <div aria-hidden="true" className="absolute bottom-[17.1rem] left-[4.64rem] h-8 w-5 -rotate-[44deg] rounded-[50%] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.68),rgba(229,215,200,0.32))]" />
      <div aria-hidden="true" className="absolute bottom-[15.4rem] left-[8.6rem] h-8 w-5 rotate-[46deg] rounded-[50%] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.7),rgba(229,215,200,0.28))]" />
      <div aria-hidden="true" className="absolute bottom-[14.2rem] left-[5.9rem] h-7 w-4 rotate-[13deg] rounded-[50%] border border-white/70 bg-white/36" />

      <div aria-hidden="true" className="absolute bottom-[4.6rem] left-[11.2rem] size-[4.35rem] rounded-full bg-[radial-gradient(circle_at_38%_28%,rgba(255,255,255,0.98),rgba(244,240,250,0.64)_42%,rgba(198,181,225,0.36)_100%)] shadow-[inset_-16px_-18px_22px_rgba(112,92,146,0.1),0_18px_42px_rgba(82,64,130,0.13)]" />
      <div aria-hidden="true" className="absolute bottom-[4.9rem] left-[16.2rem] h-14 w-20 rounded-[47%_53%_48%_52%] bg-[linear-gradient(145deg,#F6EFE7,#D7C6B8)] shadow-[inset_-10px_-12px_18px_rgba(87,67,52,0.12),0_14px_34px_rgba(82,64,130,0.1)]" />
      <div aria-hidden="true" className="absolute bottom-[6.1rem] left-[17.3rem] h-5 w-10 rounded-[50%] bg-[radial-gradient(circle,#F9F5EF_0%,#DCCBBE_74%)] shadow-[inset_0_3px_8px_rgba(91,71,58,0.14)]" />
      <div aria-hidden="true" className="absolute bottom-[2.1rem] left-[13.5rem] h-24 w-36 rounded-[56%_44%_55%_45%] border border-white/38 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.72),rgba(218,207,238,0.2)_44%,rgba(170,151,210,0.12)_100%)] shadow-[0_18px_50px_rgba(82,64,130,0.08)] backdrop-blur-[2px]" />
    </div>
  )
}

function DashboardStat({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof FileText }) {
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

function HeroCard({ profile, assetProfile, analytics }: { profile: ArtistDashboardProfile; assetProfile?: ArtistAssetProfile; analytics: ArtistAnalytics }) {
  const { locale, t } = useKleioLocale()
  const funding = formatArtistCurrency(analytics.potentialFunding, locale)

  const title = assetProfile?.dashboardHero.title ?? profile.hero.title
  const subtitle = assetProfile?.dashboardHero.subtitle ?? profile.hero.subtitle

  return (
    <section className="relative grid min-h-[315px] grid-cols-[minmax(320px,0.37fr)_minmax(0,1fr)] gap-7 overflow-hidden rounded-[1.5rem] border bg-white p-4 max-lg:grid-cols-1" style={cardStyle}>
      <div aria-hidden="true" className="pointer-events-none absolute right-10 top-6 h-44 w-44 rounded-full bg-[#F1ECFB]/60 blur-3xl" />
      <AmbientStudioAccent />

      <div className="relative z-10 flex min-w-0 flex-col justify-center py-6 pr-5 max-lg:px-2 max-md:py-3">
        {assetProfile && (
          <div className="mb-4 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetPath(assetProfile.portrait)} alt={assetProfile.displayName} className="size-11 rounded-full border-2 border-[#F1ECFB] object-cover shadow-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: inkColor }}>
                {assetProfile.displayName}
              </p>
              <Link href={`/artist/${assetProfile.username}/`} className="text-[0.72rem] font-medium transition-opacity hover:opacity-75" style={{ color: lavenderDeep }}>
                {t("artist.workspace.overview.viewPublicProfile")}
              </Link>
            </div>
          </div>
        )}

        <h1 className="max-w-3xl font-serif text-3xl font-semibold tracking-tight md:text-5xl" style={{ color: inkColor }}>
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed md:text-base" style={{ color: mutedColor }}>
          {subtitle}
        </p>

        {assetProfile && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {assetProfile.practiceTags.map((tag) => (
              <span key={tag} className="rounded-full px-2.5 py-1 text-[0.65rem] font-medium" style={{ backgroundColor: lavenderMist, color: lavenderDeep }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-4 divide-x max-md:grid-cols-2 max-md:gap-4 max-md:divide-x-0" style={{ borderColor: lavenderSoftLine }}>
          <DashboardStat label={t("artist.workspace.passport.metric.activeApplications")} value={String(analytics.activeApplications)} detail={t("artist.workspace.overview.stat.dueSoonDetail", { count: analytics.dueSoon })} icon={FileText} />
          <DashboardStat label={t("artist.workspace.calendar.metric.upcomingDeadlines")} value={String(analytics.upcomingDeadlines)} detail={t("artist.workspace.overview.stat.nextDeadline", { date: formatArtistNextDeadline(analytics.nextDeadline, locale) })} icon={CalendarDays} />
          <DashboardStat label={t("artist.workspace.applications.metric.pendingDecisions")} value={String(analytics.pendingDecisions)} detail={t("artist.workspace.overview.stat.overdueDetail", { count: analytics.overdueDecisions })} icon={Hourglass} />
          <DashboardStat label={t("artist.workspace.funding.metric.potentialFunding")} value={funding} detail={t("artist.workspace.overview.stat.opportunitiesDetail", { count: analytics.opportunityCount })} icon={DollarSign} />
        </div>
      </div>
    </section>
  )
}

function SelectedWorksPreview({ assetProfile }: { assetProfile: ArtistAssetProfile }) {
  const { t } = useKleioLocale()

  return (
    <Card className="p-4">
      <CardHeader title={t("artist.workspace.overview.selectedWorks.title")} action={t("artist.workspace.overview.selectedWorks.action")} />
      <div className="grid grid-cols-3 gap-2">
        {assetProfile.selectedWorks.map((work) => (
          <Link key={work.title} href={`/artist/${assetProfile.username}/`} className="group block overflow-hidden rounded-xl border" style={{ borderColor: lavenderSoftLine }}>
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
  const { t } = useKleioLocale()

  return (
    <Card className="p-4">
      <CardHeader title={t("artist.workspace.overview.applicationTracker.title")} action={t("artist.workspace.overview.applicationTracker.action")} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <thead>
            <tr className="border-b text-[0.68rem] uppercase tracking-wide" style={{ borderColor: lavenderSoftLine, color: mutedColor }}>
              <th className="py-2 font-semibold">{t("artist.workspace.overview.applicationTracker.column.program")}</th>
              <th className="py-2 font-semibold">{t("artist.workspace.overview.applicationTracker.column.status")}</th>
              <th className="py-2 font-semibold">{t("artist.workspace.overview.applicationTracker.column.dueDate")}</th>
              <th className="py-2 font-semibold">{t("artist.workspace.overview.applicationTracker.column.updated")}</th>
              <th className="py-2 text-right font-semibold">{t("artist.workspace.overview.applicationTracker.column.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {profile.applications.map((app) => (
              <tr key={app.program} className="border-b last:border-0" style={{ borderColor: lavenderSoftLine }}>
                <td className="py-3 text-sm font-medium" style={{ color: inkColor }}>{app.program}</td>
                <td className="py-3"><StatusChip status={app.status} /></td>
                <td className="py-3 text-sm" style={{ color: app.note ? "#A85656" : inkColor }}>
                  <span>{app.dueDate}</span>
                  {app.note && <span className="ml-2 rounded-full bg-[oklch(0.96_0.035_25)] px-2 py-0.5 text-[0.62rem] font-semibold text-[oklch(0.48_0.14_25)]">{app.note}</span>}
                </td>
                <td className="py-3 text-sm" style={{ color: mutedColor }}>{app.updated}</td>
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
  const { t } = useKleioLocale()

  return (
    <Card className="p-4">
      <CardHeader title={t("artist.workspace.overview.decisionTimeline.title")} action={t("artist.workspace.overview.viewAll")} />
      <div className="space-y-3">
        {profile.timeline.map((item) => (
          <div key={item.program} className="flex gap-3">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full" style={{ backgroundColor: item.tone === "overdue" ? "#FFF4F4" : lavenderMist, color: item.tone === "overdue" ? "#A85656" : lavenderDeep }}>
              {item.tone === "overdue" ? <Hourglass className="size-4" /> : <Clock3 className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium" style={{ color: inkColor }}>{item.program}</p>
              <p className="text-xs" style={{ color: mutedColor }}>{item.expected}</p>
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
  const { t } = useKleioLocale()

  return (
    <Card className="p-4">
      <CardHeader title={t("artist.workspace.overview.spectrumMatches.title")} action={t("artist.workspace.overview.viewAll")} />
      <p className="mb-3 text-xs leading-relaxed" style={{ color: mutedColor }}>
        {t("artist.workspace.overview.spectrumMatches.description")}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {profile.collaboratorMatches.map((match) => (
          <article key={match.name} className="rounded-2xl border bg-white p-3" style={{ borderColor: lavenderSoftLine }}>
            <InitialAvatar name={match.name} className="size-11 text-xs" />
            <h3 className="mt-3 text-sm font-semibold" style={{ color: inkColor }}>{match.name}</h3>
            <p className="text-[0.68rem]" style={{ color: mutedColor }}>{match.location}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {match.tags.map((tag) => (
                <span key={tag} className="rounded-full px-2 py-0.5 text-[0.62rem] font-medium" style={{ backgroundColor: lavenderMist, color: lavenderDeep }}>{tag}</span>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button type="button" className="h-8 flex-1 rounded-lg border text-xs font-semibold transition-colors hover:bg-primary/5" style={{ borderColor: lavenderLine, color: lavenderDeep }}>
                {t("artist.workspace.overview.spectrumMatches.invite")}
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
  const { t } = useKleioLocale()

  return (
    <Card className="p-4">
      <CardHeader title={t("artist.workspace.overview.nextActions.title")} />
      <div className="space-y-3">
        {profile.nextActions.map((action, index) => (
          <div key={action.program} className="flex items-start gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold" style={{ backgroundColor: lavenderMist, color: lavenderDeep }}>{index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: inkColor }}>{action.program}</p>
              <p className="text-xs" style={{ color: mutedColor }}>{action.task}</p>
            </div>
            <span className="shrink-0 text-[0.68rem] font-medium" style={{ color: action.tone === "follow-up" ? "#A85656" : mutedColor }}>{action.due}</span>
          </div>
        ))}
      </div>
      <button type="button" className="mt-4 flex w-full items-center justify-between border-t pt-3 text-xs font-medium" style={{ borderColor: lavenderSoftLine, color: lavenderDeep }}>
        {t("artist.workspace.overview.nextActions.viewAll")}
        <ChevronRight className="size-3.5" />
      </button>
    </Card>
  )
}

function PassportCompleteness({ profile, analytics }: { profile: ArtistDashboardProfile; analytics: ArtistAnalytics }) {
  const { t } = useKleioLocale()

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold" style={{ color: inkColor }}>{t("artist.workspace.overview.passportCompleteness.title")}</h2>
        <span className="rounded-full px-2 py-1 text-[0.65rem] font-semibold" style={{ backgroundColor: lavenderMist, color: lavenderDeep }}>
          {t("artist.workspace.overview.passportCompleteness.complete", { pct: analytics.passportCompletenessPct })}
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
        {t("artist.workspace.overview.passportCompleteness.review")}
        <ChevronRight className="size-3.5" />
      </button>
    </Card>
  )
}

function QuietInsights({ profile }: { profile: ArtistDashboardProfile }) {
  const { t } = useKleioLocale()

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4" style={{ color: lavenderDeep }} />
          <h2 className="text-sm font-semibold" style={{ color: inkColor }}>{t("artist.workspace.overview.quietInsights.title")}</h2>
        </div>
        <span className="rounded-full px-2 py-0.5 text-[0.62rem] font-semibold" style={{ backgroundColor: lavenderMist, color: lavenderDeep }}>
          {t("artist.workspace.overview.quietInsights.new")}
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
  const { locale, t } = useKleioLocale()
  const metrics = [
    { labelKey: "artist.workspace.funding.metric.estimatedFit", value: analytics.fundingReadiness.estimatedFit, tone: "lavender" as const },
    { labelKey: "artist.workspace.funding.metric.completeness", value: analytics.fundingReadiness.completeness, tone: "lavender" as const },
    { labelKey: "artist.workspace.funding.metric.timelineConfidence", value: analytics.fundingReadiness.timelineConfidence, tone: "amber" as const },
  ]

  return (
    <Card className="p-4">
      <CardHeader title={t("artist.workspace.funding.title")} />
      <div className="space-y-3">
        {metrics.map((metric) => (
          <div key={metric.labelKey}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span style={{ color: mutedColor }}>{t(metric.labelKey)}</span>
              <span className="font-semibold tabular-nums" style={{ color: inkColor }}>
                {formatArtistPct(metric.value, locale)}
              </span>
            </div>
            {metric.value != null ? (
              <ProgressBar value={metric.value} tone={metric.tone} />
            ) : (
              <p className="text-[0.68rem]" style={{ color: mutedColor }}>{t("status.preparedForScoring")}</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

export function ArtistDashboardOverview({ artist, profile, assetProfile, analytics }: { artist: Artist; profile: ArtistDashboardProfile; assetProfile?: ArtistAssetProfile; analytics: ArtistAnalytics }) {
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
