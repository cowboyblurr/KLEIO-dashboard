"use client"

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import type { Artist, ArtistDashboardApplicationStatus, ArtistDashboardProfile } from "@/lib/kleio-data"
import type { ArtistAnalytics } from "@/lib/kleio-artist-analytics"
import { formatArtistNextDeadline } from "@/lib/kleio-artist-analytics"
import type { kleioSyntheticArtistProfiles } from "@/lib/kleio-profile-data"
import { assetPath } from "@/lib/asset-path"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { translateStatus } from "@/lib/kleio-i18n"
import { cn } from "@/lib/utils"

type ArtistAssetProfile = (typeof kleioSyntheticArtistProfiles)[number]

const inkColor = "#292631"
const mutedColor = "#7F7890"
const lavenderLine = "#E7E1F7"
const lavenderMist = "#F7F4FF"
const lavenderDeep = "#5B4B8A"
const cardShadow = "0 16px 44px rgba(82, 64, 130, 0.055)"

function Surface({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cn("rounded-[1.35rem] border bg-white", className)}
      style={{ borderColor: lavenderLine, boxShadow: cardShadow }}
    >
      {children}
    </section>
  )
}

function SectionHeader({ title, description, href, action }: { title: string; description?: string; href?: string; action?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold" style={{ color: inkColor }}>{title}</h2>
        {description && <p className="mt-1 text-xs leading-relaxed" style={{ color: mutedColor }}>{description}</p>}
      </div>
      {href && action && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-75" style={{ color: lavenderDeep }}>
          {action}
          <ChevronRight className="size-3.5" />
        </Link>
      )}
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-primary/10">
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
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

function WorkspaceHeader({ artist, assetProfile, passportComplete }: { artist: Artist; assetProfile?: ArtistAssetProfile; passportComplete: boolean }) {
  const { locale } = useKleioLocale()
  const profileHref = assetProfile ? `/artist/${assetProfile.username}/` : "/artist-dashboard/profile/"
  const primaryHref = passportComplete ? "/artist-dashboard/applications/" : "/artist-dashboard/passport/"

  return (
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-2xl">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "#A997E8" }}>
          {locale === "es" ? "Espacio del artista" : "Artist workspace"}
        </p>
        <h1 className="mt-1 font-serif text-[1.9rem] font-semibold tracking-tight md:text-4xl" style={{ color: inkColor }}>
          {artist.name}
        </h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: mutedColor }}>
          {locale === "es"
            ? "Mantén tu pasaporte listo, termina la próxima solicitud y concentra tu atención en las fechas que realmente importan."
            : "Keep your passport ready, finish the next application, and focus on the deadlines that actually need your attention."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={profileHref} className="inline-flex h-10 items-center justify-center rounded-xl border bg-white px-4 text-sm font-semibold transition-colors hover:bg-[#FDFBFF]" style={{ borderColor: "#D8D0F2", color: lavenderDeep }}>
          {locale === "es" ? "Ver perfil" : "View profile"}
        </Link>
        <Link href={primaryHref} className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          {passportComplete ? (locale === "es" ? "Continuar solicitudes" : "Continue applications") : (locale === "es" ? "Completar pasaporte" : "Complete passport")}
        </Link>
      </div>
    </header>
  )
}

function ContextSignal({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof FileText }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 py-1">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: lavenderMist, color: lavenderDeep }}>
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-xs font-semibold" style={{ color: inkColor }}>{label}</p>
          <p className="text-xs font-semibold tabular-nums" style={{ color: lavenderDeep }}>{value}</p>
        </div>
        <p className="mt-0.5 text-[0.68rem] leading-snug" style={{ color: mutedColor }}>{detail}</p>
      </div>
    </div>
  )
}

function PriorityPanel({ profile, analytics }: { profile: ArtistDashboardProfile; analytics: ArtistAnalytics }) {
  const { locale } = useKleioLocale()
  const incompleteItems = profile.passportCompleteness.filter((item) => item.status !== "complete")
  const nextAction = profile.nextActions[0]
  const passportNeedsAttention = analytics.passportCompletenessPct < 100
  const actionHref = passportNeedsAttention ? "/artist-dashboard/passport/" : "/artist-dashboard/applications/"
  const title = passportNeedsAttention
    ? locale === "es"
      ? `Completa ${incompleteItems.length || 1} elemento del Pasaporte Creativo`
      : `Complete ${incompleteItems.length || 1} Creative Passport item${incompleteItems.length === 1 ? "" : "s"}`
    : nextAction?.program || (locale === "es" ? "Revisa tu próxima solicitud" : "Review your next application")
  const body = passportNeedsAttention
    ? locale === "es"
      ? "Estos materiales alimentan tu preparación para solicitudes y reducen el trabajo repetido en futuras convocatorias."
      : "These materials improve application readiness and reduce repeated work across future opportunities."
    : nextAction?.task || (locale === "es" ? "Confirma materiales, respuestas y fecha límite antes de enviar." : "Confirm materials, responses, and the deadline before submitting.")

  return (
    <Surface className="overflow-hidden bg-[linear-gradient(135deg,#F9F6FF_0%,#FFFFFF_68%)] p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.13em] shadow-sm" style={{ color: lavenderDeep }}>
            <AlertCircle className="size-3.5" />
            {locale === "es" ? "Prioridad actual" : "Current priority"}
          </div>
          <h2 className="mt-4 max-w-2xl font-serif text-2xl font-semibold tracking-tight md:text-3xl" style={{ color: inkColor }}>{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: mutedColor }}>{body}</p>
          {nextAction?.due && (
            <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold" style={{ color: nextAction.tone === "follow-up" ? "#A85656" : lavenderDeep }}>
              <Clock3 className="size-3.5" />
              {nextAction.due}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={actionHref} className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              {passportNeedsAttention ? (locale === "es" ? "Revisar pasaporte" : "Review passport") : (locale === "es" ? "Abrir solicitudes" : "Open applications")}
            </Link>
            <Link href="/artist-dashboard/opportunities/" className="inline-flex h-10 items-center justify-center rounded-xl border bg-white px-4 text-sm font-semibold transition-colors hover:bg-[#FDFBFF]" style={{ borderColor: "#D8D0F2", color: lavenderDeep }}>
              {locale === "es" ? "Explorar oportunidades" : "Explore opportunities"}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-3" style={{ borderColor: lavenderLine }}>
        <ContextSignal
          label={locale === "es" ? "Preparación del perfil" : "Profile readiness"}
          value={`${analytics.passportCompletenessPct}%`}
          detail={passportNeedsAttention ? (locale === "es" ? "Todavía faltan materiales útiles." : "Useful materials are still missing.") : (locale === "es" ? "Listo para reutilizar." : "Ready to reuse.")}
          icon={CheckCircle2}
        />
        <ContextSignal
          label={locale === "es" ? "Fechas próximas" : "Upcoming deadlines"}
          value={String(analytics.upcomingDeadlines)}
          detail={locale === "es" ? `La próxima es ${formatArtistNextDeadline(analytics.nextDeadline, locale)}.` : `Next is ${formatArtistNextDeadline(analytics.nextDeadline, locale)}.`}
          icon={CalendarDays}
        />
        <ContextSignal
          label={locale === "es" ? "Solicitudes activas" : "Active applications"}
          value={String(analytics.activeApplications)}
          detail={locale === "es" ? `${analytics.dueSoon} necesitan atención pronto.` : `${analytics.dueSoon} need attention soon.`}
          icon={FileText}
        />
      </div>
    </Surface>
  )
}

function ApplicationTracker({ profile }: { profile: ArtistDashboardProfile }) {
  const { locale, t } = useKleioLocale()
  const visibleApplications = profile.applications.slice(0, 5)

  return (
    <Surface className="p-5">
      <SectionHeader
        title={t("artist.workspace.overview.applicationTracker.title")}
        description={locale === "es" ? "Tus solicitudes más activas, ordenadas para que puedas ver estado y fecha sin abrir cada registro." : "Your most active applications, organized so status and timing are clear without opening every record."}
        href="/artist-dashboard/applications/"
        action={t("artist.workspace.overview.applicationTracker.action")}
      />
      <div className="mt-5 divide-y" style={{ borderColor: lavenderLine }}>
        {visibleApplications.map((app) => (
          <div key={app.program} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1.3fr)_auto_minmax(8rem,0.55fr)]">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: inkColor }}>{app.program}</p>
              <p className="mt-0.5 text-xs" style={{ color: mutedColor }}>{locale === "es" ? `Actualizado ${app.updated}` : `Updated ${app.updated}`}</p>
            </div>
            <StatusChip status={app.status} />
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium" style={{ color: app.note ? "#A85656" : inkColor }}>{app.dueDate}</p>
              {app.note && <p className="mt-0.5 text-[0.65rem] font-semibold text-[#A85656]">{app.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </Surface>
  )
}

function WorkspaceStatus({ profile, analytics }: { profile: ArtistDashboardProfile; analytics: ArtistAnalytics }) {
  const { locale } = useKleioLocale()
  const incompleteItems = profile.passportCompleteness.filter((item) => item.status !== "complete").slice(0, 3)
  const timeline = profile.timeline.slice(0, 3)

  return (
    <Surface className="p-5">
      <SectionHeader
        title={locale === "es" ? "Estado del espacio" : "Workspace status"}
        description={locale === "es" ? "Solo lo que requiere contexto o una próxima decisión." : "Only the items that need context or a next decision."}
      />

      <div className="mt-5 rounded-2xl p-4" style={{ backgroundColor: lavenderMist }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold" style={{ color: inkColor }}>{locale === "es" ? "Pasaporte Creativo" : "Creative Passport"}</p>
            <p className="mt-0.5 text-[0.68rem]" style={{ color: mutedColor }}>{locale === "es" ? "Preparación para reutilizar en solicitudes." : "Readiness for reusable applications."}</p>
          </div>
          <span className="text-sm font-semibold tabular-nums" style={{ color: lavenderDeep }}>{analytics.passportCompletenessPct}%</span>
        </div>
        <div className="mt-3"><ProgressBar value={analytics.passportCompletenessPct} /></div>
        <div className="mt-3 space-y-2">
          {incompleteItems.length ? incompleteItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs" style={{ color: inkColor }}>
              <span className="grid size-4 shrink-0 place-items-center rounded-full bg-white text-[0.55rem] font-bold" style={{ color: "#A85656" }}>!</span>
              <span className="truncate">{item.label}</span>
            </div>
          )) : (
            <p className="flex items-center gap-2 text-xs font-medium" style={{ color: lavenderDeep }}><CheckCircle2 className="size-3.5" />{locale === "es" ? "Los elementos principales están completos." : "Core passport items are complete."}</p>
          )}
        </div>
        <Link href="/artist-dashboard/passport/" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: lavenderDeep }}>
          {locale === "es" ? "Revisar pasaporte" : "Review passport"}<ChevronRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-5 border-t pt-5" style={{ borderColor: lavenderLine }}>
        <p className="text-xs font-semibold uppercase tracking-[0.13em]" style={{ color: "#A997E8" }}>{locale === "es" ? "Próximas decisiones" : "Upcoming decisions"}</p>
        <div className="mt-3 space-y-3">
          {timeline.map((item) => (
            <div key={item.program} className="flex items-start gap-3">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: item.tone === "overdue" ? "#FFF4F4" : lavenderMist, color: item.tone === "overdue" ? "#A85656" : lavenderDeep }}>
                <Clock3 className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" style={{ color: inkColor }}>{item.program}</p>
                <p className="mt-0.5 text-xs" style={{ color: mutedColor }}>{item.expected}</p>
              </div>
              <span className="shrink-0 text-[0.68rem] font-semibold" style={{ color: item.tone === "overdue" ? "#A85656" : mutedColor }}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </Surface>
  )
}

function SelectedWorksPreview({ assetProfile }: { assetProfile: ArtistAssetProfile }) {
  const { locale } = useKleioLocale()
  return (
    <Surface className="p-5">
      <SectionHeader
        title={locale === "es" ? "Obras seleccionadas" : "Selected works"}
        description={locale === "es" ? "Una vista breve del portafolio que acompaña tu perfil." : "A brief view of the portfolio supporting your profile."}
        href="/artist-dashboard/portfolio/"
        action={locale === "es" ? "Administrar" : "Manage"}
      />
      <div className="mt-4 grid grid-cols-3 gap-2">
        {assetProfile.selectedWorks.slice(0, 3).map((work) => (
          <Link key={work.title} href={`/artist/${assetProfile.username}/`} className="group block overflow-hidden rounded-xl border" style={{ borderColor: lavenderLine }}>
            <span className="relative block aspect-[4/3] overflow-hidden bg-[#F7F4FF]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetPath(work.image)} alt={work.title} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </span>
            <span className="block truncate px-2 py-1.5 text-[0.66rem] font-medium" style={{ color: inkColor }}>{work.title}</span>
          </Link>
        ))}
      </div>
    </Surface>
  )
}

function AssistDisclosure({ profile }: { profile: ArtistDashboardProfile }) {
  const { locale } = useKleioLocale()

  return (
    <details className="group border-t" style={{ borderColor: lavenderLine }}>
      <summary
        className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-xs transition-colors hover:text-[#5B4B8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A997E8]/50 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden"
        style={{ color: mutedColor }}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Sparkles className="size-3.5 shrink-0" style={{ color: "#9B91AA" }} />
          <span className="font-semibold" style={{ color: inkColor }}>KLEIO Assist</span>
          <span aria-hidden="true">·</span>
          <span>{locale === "es" ? "Próximamente" : "Coming soon"}</span>
          <span className="hidden sm:inline">— {locale === "es" ? "orientación opcional y revisable" : "optional, review-first guidance"}</span>
        </span>
        <ChevronRight className="size-3.5 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" />
      </summary>

      <div className="pb-4 pl-5 pr-1">
        <p className="max-w-2xl text-xs leading-relaxed" style={{ color: mutedColor }}>
          {locale === "es"
            ? "Cuando esté disponible, KLEIO Assist ofrecerá sugerencias editables solo cuando las solicites. Nada se guardará, publicará o modificará sin tu aprobación."
            : "When available, KLEIO Assist will offer editable suggestions only when you request them. Nothing will be saved, published, or changed without your approval."}
        </p>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {profile.quietInsights.slice(0, 2).map((insight) => (
            <li key={insight} className="flex gap-2 text-xs leading-relaxed" style={{ color: mutedColor }}>
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#B8AEC8]" />
              {insight}
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}

export function ArtistDashboardOverview({ artist, profile, assetProfile, analytics }: { artist: Artist; profile: ArtistDashboardProfile; assetProfile?: ArtistAssetProfile; analytics: ArtistAnalytics }) {
  const passportComplete = analytics.passportCompletenessPct >= 100

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-10 pt-5 sm:px-6 lg:px-7">
      <WorkspaceHeader artist={artist} assetProfile={assetProfile} passportComplete={passportComplete} />

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <section className="min-w-0 space-y-5">
          <PriorityPanel profile={profile} analytics={analytics} />
          <ApplicationTracker profile={profile} />
        </section>

        <aside className="min-w-0 space-y-5">
          <WorkspaceStatus profile={profile} analytics={analytics} />
          {assetProfile && <SelectedWorksPreview assetProfile={assetProfile} />}
        </aside>
      </div>

      <div className="mt-7">
        <AssistDisclosure profile={profile} />
      </div>
    </div>
  )
}
