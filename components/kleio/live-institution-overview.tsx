"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  MapPin,
} from "lucide-react"
import {
  loadInstitutionApplications,
  loadInstitutionOpenCalls,
  loadInstitutionProfile,
  type ApplicationRecord,
  type InstitutionProfileRecord,
  type OpenCallRecord,
} from "@/lib/kleio-live-data"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const surface = "rounded-[1.35rem] border border-[#E7E1F7] bg-white shadow-[0_16px_44px_rgba(82,64,130,0.055)]"

function formatDeadline(value: string | null, locale: string) {
  if (!value) return locale === "es" ? "Sin fecha límite" : "No deadline"
  const date = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return locale === "es" ? "Sin fecha límite" : "No deadline"
  return new Intl.DateTimeFormat(locale === "es" ? "es" : "en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date)
}

function statusLabel(status: string, locale: string) {
  const normalized = status.replaceAll("_", " ")
  if (locale !== "es") return normalized
  const labels: Record<string, string> = {
    open: "abierta",
    "under review": "en revisión",
    draft: "borrador",
    submitted: "enviada",
    "in review": "en revisión",
    "needs follow up": "requiere seguimiento",
    shortlisted: "preseleccionada",
    finalist: "finalista",
    accepted: "aceptada",
  }
  return labels[normalized] ?? normalized
}

function SummaryMetric({ label, value, detail, icon: Icon }: { label: string; value: number; detail: string; icon: typeof FileText }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/80 p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#F7F4FF] text-[#5B4B8A]">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-semibold text-[#292631]">{label}</p>
          <p className="font-serif text-xl font-semibold tabular-nums text-[#292631]">{value}</p>
        </div>
        <p className="mt-0.5 text-[0.68rem] leading-snug text-[#7F7890]">{detail}</p>
      </div>
    </div>
  )
}

function EmptyState({ title, body, href, action }: { title: string; body: string; href?: string; action?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#D8D0F2] bg-[#FDFBFF] px-4 py-8 text-center">
      <p className="text-sm font-medium text-[#292631]">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[#7F7890]">{body}</p>
      {href && action && <Link href={href} className="mt-4 inline-flex text-xs font-semibold text-[#5B4B8A]">{action} →</Link>}
    </div>
  )
}

export function LiveInstitutionOverview() {
  const { locale } = useKleioLocale()
  const [profile, setProfile] = useState<InstitutionProfileRecord | null>(null)
  const [calls, setCalls] = useState<OpenCallRecord[]>([])
  const [applications, setApplications] = useState<ApplicationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    Promise.all([loadInstitutionProfile(), loadInstitutionOpenCalls(), loadInstitutionApplications()])
      .then(([nextProfile, nextCalls, nextApplications]) => {
        if (!active) return
        setProfile(nextProfile)
        setCalls(nextCalls)
        setApplications(nextApplications)
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "KLEIO could not load this institution workspace.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const metrics = useMemo(() => {
    const activeCalls = calls.filter((call) => call.status === "open" || call.status === "under_review").length
    const needsAttention = applications.filter((application) => application.status === "needs_follow_up").length
    const underReview = applications.filter((application) => application.status === "submitted" || application.status === "in_review").length
    const decisionReady = applications.filter((application) => ["shortlisted", "finalist", "accepted"].includes(application.status)).length
    return { activeCalls, needsAttention, underReview, decisionReady }
  }, [applications, calls])

  const recentCalls = useMemo(() => calls.slice(0, 4), [calls])
  const recentApplications = useMemo(() => applications.slice(0, 5), [applications])

  if (loading) {
    return (
      <main className="flex h-full items-center justify-center bg-white">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {locale === "es" ? "Cargando tu espacio institucional…" : "Loading your institution workspace…"}
        </div>
      </main>
    )
  }

  if (error || !profile) {
    return (
      <main className="flex h-full items-center justify-center bg-white px-6">
        <section className={`${surface} max-w-lg p-6 text-center`}>
          <AlertCircle className="mx-auto size-6 text-primary" />
          <h1 className="mt-4 font-serif text-xl font-semibold">{locale === "es" ? "Tu perfil institucional necesita atención" : "Your institution profile needs attention"}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{error || (locale === "es" ? "KLEIO no encontró la institución conectada a esta cuenta." : "KLEIO could not find the institution connected to this account.")}</p>
          <Link href="/signup/institution/" className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
            {locale === "es" ? "Completar registro institucional" : "Complete institution onboarding"}
          </Link>
        </section>
      </main>
    )
  }

  const noCalls = calls.length === 0
  const primaryTitle = noCalls
    ? locale === "es" ? "Crea la primera convocatoria de la institución" : "Create the institution’s first open call"
    : metrics.needsAttention > 0
      ? locale === "es" ? `Resuelve ${metrics.needsAttention} solicitudes antes de ampliar la revisión` : `Resolve ${metrics.needsAttention} applications before expanding review`
      : metrics.underReview > 0
        ? locale === "es" ? `Continúa la revisión de ${metrics.underReview} solicitudes activas` : `Continue reviewing ${metrics.underReview} active applications`
        : locale === "es" ? "Prepara el próximo movimiento del programa" : "Prepare the program’s next move"
  const primaryBody = noCalls
    ? locale === "es" ? "Define el programa, los requisitos y el calendario antes de invitar a artistas a postularse." : "Define the program, requirements, and timeline before inviting artists to apply."
    : metrics.needsAttention > 0
      ? locale === "es" ? "Empieza con información faltante y solicitudes de aclaración para que el comité revise expedientes comparables." : "Start with missing information and clarification requests so the committee reviews comparable files."
      : metrics.underReview > 0
        ? locale === "es" ? "Mantén el trabajo activo visible y mueve solamente los expedientes con suficiente contexto." : "Keep active work visible and move only the files with enough context."
        : locale === "es" ? "Revisa el estado de las convocatorias y prepara el siguiente ciclo cuando la estructura esté lista." : "Review call status and prepare the next cycle when the structure is ready."
  const primaryHref = noCalls ? "/programs/new/" : metrics.needsAttention > 0 ? "/review-queue/" : metrics.underReview > 0 ? "/review-room/" : "/programs/"
  const primaryAction = noCalls
    ? locale === "es" ? "Crear convocatoria" : "Create open call"
    : metrics.needsAttention > 0
      ? locale === "es" ? "Trabajar la cola" : "Work the queue"
      : metrics.underReview > 0
        ? locale === "es" ? "Abrir sala de revisión" : "Open review room"
        : locale === "es" ? "Revisar programas" : "Review programs"

  return (
    <main className="h-full overflow-y-auto bg-[#FEFDFF] px-4 py-5 sm:px-5 xl:px-7 xl:py-7">
      <div className="mx-auto w-full max-w-[1440px]">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{locale === "es" ? "Centro de revisión" : "Review command center"}</p>
            <h1 className="mt-1 text-pretty font-serif text-[1.8rem] font-semibold tracking-tight text-[#292631] xl:text-3xl">{profile.display_name || profile.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#7F7890]">
              {profile.organization_type && <span className="inline-flex items-center gap-1.5"><Building2 className="size-3.5" />{profile.organization_type}</span>}
              {profile.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{profile.location}</span>}
            </div>
          </div>
          <Link href="/settings/" className="text-xs font-semibold text-[#5B4B8A]">{locale === "es" ? "Configuración institucional" : "Institution settings"} →</Link>
        </header>

        <section className="mt-6 overflow-hidden rounded-[1.4rem] border border-[#E7E1F7] bg-[linear-gradient(135deg,#F8F5FF_0%,#FFFFFF_70%)] p-5 shadow-[0_18px_48px_rgba(82,64,130,0.065)] md:p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#5B4B8A] shadow-sm">
                <AlertCircle className="size-3.5" />
                {locale === "es" ? "Prioridad actual" : "Current priority"}
              </div>
              <h2 className="mt-4 max-w-2xl font-serif text-2xl font-semibold tracking-tight text-[#292631] md:text-3xl">{primaryTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6F6882]">{primaryBody}</p>
              <Link href={primaryHref} className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#5B4B8A] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90">{primaryAction}</Link>
            </div>

            <div className="space-y-2 rounded-[1.2rem] border border-white/80 bg-white/45 p-2 backdrop-blur-sm">
              <SummaryMetric label={locale === "es" ? "Convocatorias activas" : "Active calls"} value={metrics.activeCalls} detail={locale === "es" ? "Abiertas o en revisión." : "Open or under review."} icon={ClipboardList} />
              <SummaryMetric label={locale === "es" ? "Necesita atención" : "Needs attention"} value={metrics.needsAttention} detail={locale === "es" ? "Información o seguimiento pendiente." : "Missing information or follow-up."} icon={AlertCircle} />
              <SummaryMetric label={locale === "es" ? "Listo para decisión" : "Decision ready"} value={metrics.decisionReady} detail={locale === "es" ? "Preseleccionada, finalista o aceptada." : "Shortlisted, finalist, or accepted."} icon={CheckCircle2} />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)]">
          <div className={`${surface} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl font-semibold text-[#292631]">{locale === "es" ? "Programas activos" : "Active programs"}</h2>
                <p className="mt-1 text-sm leading-relaxed text-[#7F7890]">{locale === "es" ? "Convocatorias propiedad de esta institución, con estado y fecha visibles." : "Calls owned by this institution, with status and timing kept clear."}</p>
              </div>
              <Link href="/programs/" className="shrink-0 text-xs font-semibold text-[#5B4B8A]">{locale === "es" ? "Ver todos" : "View all"} →</Link>
            </div>
            <div className="mt-5 divide-y divide-[#E7E1F7]">
              {recentCalls.length ? recentCalls.map((call) => (
                <article key={call.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#292631]">{call.title}</p>
                    <p className="mt-0.5 text-xs text-[#7F7890]">{locale === "es" ? "Fecha límite" : "Deadline"} {formatDeadline(call.deadline_at, locale)}</p>
                  </div>
                  <span className="rounded-full bg-[#F7F4FF] px-3 py-1 text-[0.65rem] font-semibold capitalize text-[#5B4B8A]">{statusLabel(call.status, locale)}</span>
                </article>
              )) : (
                <EmptyState
                  title={locale === "es" ? "Todavía no hay convocatorias." : "No calls have been created yet."}
                  body={locale === "es" ? "Crea la primera cuando la estructura del programa esté lista." : "Create the first call when the program structure is ready."}
                  href="/programs/new/"
                  action={locale === "es" ? "Crear convocatoria" : "Create open call"}
                />
              )}
            </div>
          </div>

          <div className={`${surface} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl font-semibold text-[#292631]">{locale === "es" ? "Solicitudes recientes" : "Recent applications"}</h2>
                <p className="mt-1 text-sm leading-relaxed text-[#7F7890]">{locale === "es" ? "Expedientes autenticados conectados a convocatorias propias." : "Authenticated submissions connected to owned calls."}</p>
              </div>
              <Link href="/submissions/" className="shrink-0 text-xs font-semibold text-[#5B4B8A]">{locale === "es" ? "Ver todas" : "View all"} →</Link>
            </div>
            <div className="mt-5 divide-y divide-[#E7E1F7]">
              {recentApplications.length ? recentApplications.map((application) => (
                <article key={application.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#F7F4FF] text-[#5B4B8A]"><FileText className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#292631]">{application.artist_name}</p>
                    <p className="mt-0.5 truncate text-xs capitalize text-[#7F7890]">{statusLabel(application.status, locale)}</p>
                  </div>
                </article>
              )) : (
                <EmptyState
                  title={locale === "es" ? "Todavía no hay solicitudes enviadas." : "No submitted applications yet."}
                  body={locale === "es" ? "Aparecerán después de que artistas se postulen a una convocatoria propia." : "Applications will appear after artists submit to an owned call."}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
