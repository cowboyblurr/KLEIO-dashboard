"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, Clock3, FileText, UsersRound } from "lucide-react"
import { analytics, getQueueForTab } from "@/lib/kleio-analytics"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { ApplicationsChart } from "@/components/kleio/applications-chart"
import { StatusBreakdown } from "@/components/kleio/status-breakdown"
import { ReviewQueue } from "@/components/kleio/review-queue"
import { SubmissionDrawer } from "@/components/kleio/submission-drawer"
import { DemoEnvironmentBadge } from "@/components/kleio/demo-environment-badge"

function sortScenarioFirst<T extends { scenario?: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    if (a.scenario && !b.scenario) return -1
    if (!a.scenario && b.scenario) return 1
    return 0
  })
}

type SummaryMetricProps = {
  label: string
  value: number
  detail: string
  href: string
  icon: typeof FileText
  tone: "attention" | "review" | "decision"
}

const toneStyles = {
  attention: "bg-[oklch(0.97_0.025_78)] text-[oklch(0.48_0.12_65)]",
  review: "bg-[#F7F4FF] text-[#5B4B8A]",
  decision: "bg-[oklch(0.94_0.04_150)] text-[oklch(0.38_0.11_150)]",
}

function SummaryMetric({ label, value, detail, href, icon: Icon, tone }: SummaryMetricProps) {
  return (
    <Link href={href} className="group flex items-start gap-3 rounded-2xl bg-white/80 p-3 transition-colors hover:bg-white">
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${toneStyles[tone]}`}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-xs font-semibold text-[#292631]">{label}</span>
          <span className="font-serif text-xl font-semibold tabular-nums text-[#292631]">{value}</span>
        </span>
        <span className="mt-0.5 block text-[0.68rem] leading-snug text-[#7F7890]">{detail}</span>
      </span>
    </Link>
  )
}

function PriorityOverview({ locale }: { locale: string }) {
  const readyForDecision = analytics.shortlistedCount + analytics.pendingVoteCount

  return (
    <section
      data-kleio-guide-target="institution-priorities"
      className="overflow-hidden rounded-[1.4rem] border border-[#E7E1F7] bg-[linear-gradient(135deg,#F8F5FF_0%,#FFFFFF_70%)] p-5 shadow-[0_18px_48px_rgba(82,64,130,0.065)] md:p-6"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-center">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#5B4B8A] shadow-sm">
            <AlertCircle className="size-3.5" />
            {locale === "es" ? "Prioridad del ciclo" : "Cycle priority"}
          </div>
          <h2 className="mt-4 max-w-2xl font-serif text-2xl font-semibold tracking-tight text-[#292631] md:text-3xl">
            {locale === "es"
              ? `Resuelve ${analytics.needsAttentionCount} postulaciones antes de ampliar la revisión`
              : `Resolve ${analytics.needsAttentionCount} submissions before expanding review`}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6F6882]">
            {locale === "es"
              ? "Empieza con materiales incompletos y aclaraciones pendientes. Después, confirma los asientos de revisión para que las candidaturas listas puedan avanzar con contexto suficiente."
              : "Start with incomplete materials and pending clarifications. Then confirm reviewer seats so review-ready candidates can move forward with enough context."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/review-queue/" className="inline-flex h-10 items-center rounded-xl bg-[#5B4B8A] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90">
              {locale === "es" ? "Trabajar la cola" : "Work the queue"}
            </Link>
            <Link href="/review-room/" className="inline-flex h-10 items-center rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] transition-colors hover:bg-[#FDFBFF]">
              {locale === "es" ? "Abrir sala de revisión" : "Open review room"}
            </Link>
          </div>
        </div>

        <div className="space-y-2 rounded-[1.2rem] border border-white/80 bg-white/45 p-2 backdrop-blur-sm">
          <SummaryMetric
            label={locale === "es" ? "Necesita atención" : "Needs attention"}
            value={analytics.needsAttentionCount}
            detail={locale === "es" ? "Materiales o aclaraciones pendientes." : "Missing materials or clarification."}
            href="/review-queue/"
            icon={AlertCircle}
            tone="attention"
          />
          <SummaryMetric
            label={locale === "es" ? "Seguimiento de revisores" : "Reviewer follow-up"}
            value={analytics.pendingReviewerActionsCount}
            detail={locale === "es" ? "Asientos aún asignados o en progreso." : "Seats still assigned or in progress."}
            href="/committee/"
            icon={UsersRound}
            tone="review"
          />
          <SummaryMetric
            label={locale === "es" ? "Listo para decisión" : "Ready for decision"}
            value={readyForDecision}
            detail={locale === "es" ? "Shortlist, voto o informe." : "Shortlist, vote, or report."}
            href="/shortlist/"
            icon={CheckCircle2}
            tone="decision"
          />
        </div>
      </div>
    </section>
  )
}

function ReviewPath({ locale }: { locale: string }) {
  const steps = locale === "es" ? ["Cola", "Sala", "Shortlist", "Informe"] : ["Queue", "Room", "Shortlist", "Report"]
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.68rem] font-medium text-[#7F7890]">
      <Clock3 className="size-3.5 text-[#A997E8]" />
      <span className="font-semibold text-[#292631]">{locale === "es" ? "Ruta del ciclo" : "Cycle path"}</span>
      {steps.map((step, index) => (
        <span key={step} className="flex items-center gap-2">
          <span className={index === 0 ? "rounded-full bg-[#F7F4FF] px-2 py-1 text-[#5B4B8A]" : "px-1 py-1"}>{step}</span>
          {index < steps.length - 1 && <span className="text-[#D8D0F2]">→</span>}
        </span>
      ))}
    </div>
  )
}

export function Overview() {
  const { locale } = useKleioLocale()
  const [activeTab, setActiveTab] = useState("priority")
  const [selectedId, setSelectedId] = useState("amina-el-badri")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const visibleSubmissions = useMemo(() => sortScenarioFirst(getQueueForTab(activeTab)), [activeTab])
  const drawerSubmissions = useMemo(() => sortScenarioFirst(analytics.reviewQueue), [])
  const index = Math.max(0, drawerSubmissions.findIndex((submission) => submission.id === selectedId))
  const selected = drawerSubmissions[index] ?? drawerSubmissions[0]

  function select(id: string) {
    setSelectedId(id)
    setDrawerOpen(true)
  }

  function step(direction: 1 | -1) {
    const next = (index + direction + drawerSubmissions.length) % drawerSubmissions.length
    setSelectedId(drawerSubmissions[next].id)
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main data-kleio-guide-target="institution-overview" className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5 xl:px-7 xl:py-7">
        <div className="mx-auto w-full max-w-[1440px]">
          <header data-kleio-guide-target="institution-overview-intro" className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{locale === "es" ? "Centro de revisión" : "Review command center"}</p>
              <h1 className="mt-1 text-pretty font-serif text-[1.8rem] font-semibold tracking-tight text-foreground xl:text-3xl">{locale === "es" ? "Espacio institucional" : "Institution Workspace"}</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {locale === "es"
                  ? "Concentra las excepciones, el avance de revisores y las decisiones del ciclo sin convertir el espacio en una pared de métricas."
                  : "Keep exceptions, reviewer progress, and cycle decisions visible without turning the workspace into a wall of metrics."}
              </p>
              <ReviewPath locale={locale} />
            </div>
            <DemoEnvironmentBadge compact className="hidden xl:inline-flex" />
          </header>

          <div className="mt-6">
            <PriorityOverview locale={locale} />
          </div>

          <section data-kleio-guide-target="dashboard-review-queue" className="mt-5">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl font-semibold text-[#292631]">{locale === "es" ? "Trabajo activo" : "Active review work"}</h2>
                <p className="mt-1 text-sm text-[#7F7890]">{locale === "es" ? "La cola permanece como el centro operativo; el resto del contexto queda debajo." : "The queue remains the operational center; secondary context stays below it."}</p>
              </div>
              <Link href="/submissions/" className="text-xs font-semibold text-[#5B4B8A]">{locale === "es" ? "Ver todas las postulaciones" : "View all submissions"} →</Link>
            </div>
            <ReviewQueue submissions={visibleSubmissions} selectedId={selectedId} onSelect={select} activeTab={activeTab} onTabChange={setActiveTab} />
          </section>

          <section className="mt-5 pb-5">
            <details className="rounded-2xl border border-[#E7E1F7] bg-white shadow-[0_12px_34px_rgba(82,64,130,0.045)]">
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-[#292631]">
                {locale === "es" ? "Ver contexto del ciclo" : "View cycle context"}
                <span className="ml-2 text-xs font-normal text-[#7F7890]">{locale === "es" ? "tendencias y estado general" : "trends and overall status"}</span>
              </summary>
              <div className="grid grid-cols-1 gap-4 border-t border-[#E7E1F7] p-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(330px,0.92fr)]">
                <ApplicationsChart />
                <StatusBreakdown />
              </div>
            </details>
          </section>
        </div>
      </main>
      {drawerOpen && selected && (
        <SubmissionDrawer submission={selected} onPrev={() => step(-1)} onNext={() => step(1)} onClose={() => setDrawerOpen(false)} />
      )}
    </div>
  )
}
