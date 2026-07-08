"use client"

import Link from "next/link"
import { useMemo, useState, type CSSProperties } from "react"
import { AlertCircle, CheckCircle2, Clock3, FileText, UsersRound } from "lucide-react"
import { analytics, getPrimaryUserFirstName, getQueueForTab } from "@/lib/kleio-analytics"
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

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value))
}

type PriorityCardProps = {
  label: string
  value: string | number
  body: string
  href: string
  cta: string
  tone: "attention" | "review" | "decision"
}

const priorityTone = {
  attention: "bg-[oklch(0.97_0.025_78)] text-[oklch(0.48_0.12_65)]",
  review: "bg-[#F7F4FF] text-[#5B4B8A]",
  decision: "bg-[oklch(0.94_0.04_150)] text-[oklch(0.38_0.11_150)]",
}

function PriorityCard({ label, value, body, href, cta, tone }: PriorityCardProps) {
  return (
    <Link href={href} className="group block rounded-2xl border border-[#E7E1F7] bg-white p-4 shadow-[0_14px_38px_rgba(82,64,130,0.045)] transition-colors hover:bg-[#FDFBFF]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{label}</p>
          <p className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#292631]">{value}</p>
        </div>
        <span className={`grid size-9 place-items-center rounded-xl ${priorityTone[tone]}`}>
          {tone === "attention" ? <AlertCircle className="size-4" /> : tone === "review" ? <UsersRound className="size-4" /> : <CheckCircle2 className="size-4" />}
        </span>
      </div>
      <p className="mt-3 min-h-10 text-sm leading-relaxed text-[#6F6882]">{body}</p>
      <p className="mt-4 text-xs font-semibold text-[#5B4B8A] transition-opacity group-hover:opacity-75">{cta} →</p>
    </Link>
  )
}

function ReviewCycleStrip({ locale }: { locale: string }) {
  const steps = locale === "es" ? ["Resumen", "Cola", "Sala", "Shortlist", "Informe"] : ["Overview", "Queue", "Room", "Shortlist", "Report"]

  return (
    <section data-kleio-guide-target="institution-workflow-path" className="mb-4 rounded-2xl border border-[#E7E1F7] bg-white/90 px-4 py-3 shadow-[0_10px_30px_rgba(82,64,130,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[#6F6882]">
          <Clock3 className="size-4 text-[#A997E8]" />
          <span className="font-medium text-[#292631]">{locale === "es" ? "El flujo empieza aquí" : "Workflow starts here"}</span>
          <span className="text-[#B4ADC4]">/</span>
          <span>{locale === "es" ? "Resumen primero, trabajo después" : "Orient first, then work the queue"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[0.68rem] font-medium text-[#7F7890]">
          {steps.map((step, index) => (
            <span key={step} className="flex items-center gap-1.5">
              <span className={index === 0 ? "rounded-full bg-[#F7F4FF] px-2 py-1 text-[#5B4B8A]" : "px-1 py-1"}>{step}</span>
              {index < steps.length - 1 && <span className="text-[#D8D0F2]">→</span>}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function ReviewReadinessWidget({ locale, pct, readyCount, attentionCount }: { locale: string; pct: number; readyCount: number; attentionCount: number }) {
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const safePct = clampPercent(pct)
  const targetOffset = circumference - (safePct / 100) * circumference
  const animatedStyle = { "--target-offset": targetOffset, "--ring-length": circumference } as CSSProperties

  return (
    <aside className="relative overflow-hidden rounded-2xl border border-[#E7E1F7] bg-[radial-gradient(circle_at_35%_20%,#FFFFFF_0%,#F7F4FF_45%,#FDFBFF_100%)] p-4 shadow-[0_18px_46px_rgba(82,64,130,0.075)]">
      <style>{`
        @keyframes kleioReadinessRing { from { stroke-dashoffset: var(--ring-length); } to { stroke-dashoffset: var(--target-offset); } }
        @keyframes kleioReadinessGlow { 0%, 100% { opacity: 0.34; transform: scale(0.96); } 50% { opacity: 0.72; transform: scale(1.03); } }
        .kleio-readiness-ring { animation: kleioReadinessRing 1200ms cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .kleio-readiness-glow { animation: kleioReadinessGlow 2800ms ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .kleio-readiness-ring, .kleio-readiness-glow { animation: none; } .kleio-readiness-ring { stroke-dashoffset: var(--target-offset); } }
      `}</style>
      <div className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-[#D8D0F2]/35 blur-2xl kleio-readiness-glow" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{locale === "es" ? "Preparación" : "Review readiness"}</p>
          <p className="mt-1 max-w-36 text-sm leading-relaxed text-[#6F6882]">{locale === "es" ? "Qué parte de la cola puede revisarse con información suficiente." : "How much of the queue has enough context to review now."}</p>
        </div>
        <Link href="/review-room/" className="rounded-full border border-[#E7E1F7] bg-white/80 px-3 py-1 text-[0.65rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-white">{locale === "es" ? "Sala" : "Room"}</Link>
      </div>
      <div className="relative mt-4 grid place-items-center">
        <svg viewBox="0 0 120 120" className="size-36 rotate-[-90deg]" aria-hidden="true"><circle cx="60" cy="60" r={radius} fill="none" stroke="#EEE9FA" strokeWidth="10" /><circle cx="60" cy="60" r={radius} fill="none" stroke="#5B4B8A" strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference} className="kleio-readiness-ring" style={animatedStyle} /></svg>
        <div className="absolute text-center"><p className="font-serif text-4xl font-semibold tracking-tight text-[#292631]">{safePct}%</p><p className="mt-0.5 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[#A997E8]">{locale === "es" ? "listo" : "ready"}</p></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-white/80 px-3 py-2"><p className="font-semibold text-[#292631]">{readyCount}</p><p className="mt-0.5 text-[#7F7890]">{locale === "es" ? "revisables" : "review-ready"}</p></div><div className="rounded-xl bg-white/80 px-3 py-2"><p className="font-semibold text-[#292631]">{attentionCount}</p><p className="mt-0.5 text-[#7F7890]">{locale === "es" ? "requieren cuidado" : "need care"}</p></div></div>
    </aside>
  )
}

export function Overview() {
  const { t, locale } = useKleioLocale()
  const [activeTab, setActiveTab] = useState("priority")
  const [selectedId, setSelectedId] = useState("amina-el-badri")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const visibleSubmissions = useMemo(() => sortScenarioFirst(getQueueForTab(activeTab)), [activeTab])
  const drawerSubmissions = useMemo(() => sortScenarioFirst(analytics.reviewQueue), [])
  const index = Math.max(0, drawerSubmissions.findIndex((s) => s.id === selectedId))
  const selected = drawerSubmissions[index] ?? drawerSubmissions[0]
  const readyReviewCount = Math.max(analytics.reviewQueueCount - analytics.needsAttentionCount, 0)
  const reviewReadinessPct = Math.round((readyReviewCount / Math.max(analytics.reviewQueueCount, 1)) * 100)

  function select(id: string) { setSelectedId(id); setDrawerOpen(true) }
  function step(dir: 1 | -1) { const next = (index + dir + drawerSubmissions.length) % drawerSubmissions.length; setSelectedId(drawerSubmissions[next].id) }

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main data-kleio-guide-target="institution-overview" className="min-w-0 flex-1 overflow-y-auto px-5 py-6 xl:px-7 xl:py-7">
        <div className="w-full max-w-none">
          <header data-kleio-guide-target="institution-overview-intro" className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-pretty font-serif text-[1.7rem] font-semibold tracking-tight text-foreground xl:text-3xl">{t("institution.workspace.dashboard.greeting", { name: getPrimaryUserFirstName() })}</h1>
              <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{locale === "es" ? "Una vista tranquila para ver qué necesita atención, qué revisión sigue pendiente y qué decisiones pueden avanzar." : "A calm view of what needs attention, which reviews are still pending, and which decisions can move forward."}</p>
            </div>
            <DemoEnvironmentBadge compact className="hidden xl:inline-flex" />
          </header>

          <ReviewCycleStrip locale={locale} />

          <section data-kleio-guide-target="institution-priorities" className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="grid gap-3 md:grid-cols-3">
              <PriorityCard label={locale === "es" ? "Necesita atención" : "Needs attention"} value={analytics.needsAttentionCount} body={locale === "es" ? "Postulaciones con materiales faltantes o aclaraciones pendientes antes de revisión." : "Submissions with missing materials or clarification needed before review can move cleanly."} href="/review-queue/" cta={locale === "es" ? "Abrir cola" : "Open queue"} tone="attention" />
              <PriorityCard label={locale === "es" ? "Revisión pendiente" : "Reviewer follow-up"} value={analytics.pendingReviewerActionsCount} body={locale === "es" ? "Revisores que aún están asignados, en progreso o esperando completar su parte." : "Reviewer seats that are still assigned, in progress, or waiting for completion."} href="/committee/" cta={locale === "es" ? "Ver revisores" : "View reviewers"} tone="review" />
              <PriorityCard label={locale === "es" ? "Decisión cercana" : "Ready for decision"} value={analytics.shortlistedCount + analytics.pendingVoteCount} body={locale === "es" ? "Candidaturas con contexto suficiente para shortlist, voto de comité o informe." : "Candidates with enough context for shortlist, committee vote, or report preparation."} href="/review-room/" cta={locale === "es" ? "Abrir sala" : "Open review room"} tone="decision" />
            </div>
            <ReviewReadinessWidget locale={locale} pct={reviewReadinessPct} readyCount={readyReviewCount} attentionCount={analytics.needsAttentionCount} />
          </section>

          <section className="mt-4 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF]/55 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3"><span className="mt-0.5 grid size-8 place-items-center rounded-xl bg-white text-[#5B4B8A]"><FileText className="size-4" /></span><div><p className="text-sm font-semibold text-[#292631]">{locale === "es" ? "Siguiente movimiento recomendado" : "Recommended next move"}</p><p className="mt-0.5 text-sm leading-relaxed text-[#6F6882]">{locale === "es" ? "Empieza por limpiar materiales incompletos y revisar los asientos pendientes antes de mover candidaturas a la sala de revisión." : "Start by clearing incomplete materials and pending reviewer seats before moving candidates into the Review Room."}</p></div></div>
              <Link href="/review-queue/" className="inline-flex h-9 items-center rounded-full bg-[#5B4B8A] px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90">{locale === "es" ? "Trabajar cola" : "Work the queue"}</Link>
            </div>
          </section>

          <div data-kleio-guide-target="dashboard-review-queue" className="mt-4">
            <ReviewQueue submissions={visibleSubmissions} selectedId={selectedId} onSelect={select} activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          <section className="mt-4">
            <details className="rounded-2xl border border-[#E7E1F7] bg-white shadow-[0_12px_34px_rgba(82,64,130,0.045)]"><summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-[#292631]">{locale === "es" ? "Ver contexto del ciclo" : "View cycle context"}<span className="ml-2 text-xs font-normal text-[#7F7890]">{locale === "es" ? "tendencias y estado general" : "trends and overall status"}</span></summary><div className="grid grid-cols-1 gap-4 border-t border-[#E7E1F7] p-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(330px,0.92fr)]"><ApplicationsChart /><StatusBreakdown /></div></details>
          </section>
        </div>
      </main>
      {drawerOpen && selected && <SubmissionDrawer submission={selected} onPrev={() => step(-1)} onNext={() => step(1)} onClose={() => setDrawerOpen(false)} />}
    </div>
  )
}
