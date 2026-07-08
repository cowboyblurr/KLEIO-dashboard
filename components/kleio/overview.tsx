"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
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
  const steps = locale === "es" ? ["Recepción", "Revisión", "Shortlist", "Informe"] : ["Intake", "Review", "Shortlist", "Report"]

  return (
    <section className="mb-4 rounded-2xl border border-[#E7E1F7] bg-white/90 px-4 py-3 shadow-[0_10px_30px_rgba(82,64,130,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[#6F6882]">
          <Clock3 className="size-4 text-[#A997E8]" />
          <span className="font-medium text-[#292631]">{locale === "es" ? "Ciclo actual" : "Current cycle"}</span>
          <span className="text-[#B4ADC4]">/</span>
          <span>{locale === "es" ? "Revisión activa" : "Active review"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[0.68rem] font-medium text-[#7F7890]">
          {steps.map((step, index) => (
            <span key={step} className="flex items-center gap-1.5">
              <span className={index === 1 ? "rounded-full bg-[#F7F4FF] px-2 py-1 text-[#5B4B8A]" : "px-1 py-1"}>{step}</span>
              {index < steps.length - 1 && <span className="text-[#D8D0F2]">→</span>}
            </span>
          ))}
        </div>
      </div>
    </section>
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

  function select(id: string) {
    setSelectedId(id)
    setDrawerOpen(true)
  }

  function step(dir: 1 | -1) {
    const next = (index + dir + drawerSubmissions.length) % drawerSubmissions.length
    setSelectedId(drawerSubmissions[next].id)
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main className="min-w-0 flex-1 overflow-y-auto px-5 py-6 xl:px-7 xl:py-7">
        <div className="w-full max-w-none">
          <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-pretty font-serif text-[1.7rem] font-semibold tracking-tight text-foreground xl:text-3xl">
                {t("institution.workspace.dashboard.greeting", { name: getPrimaryUserFirstName() })}
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                {locale === "es"
                  ? "Una vista tranquila para ver qué necesita atención, qué revisión sigue pendiente y qué decisiones pueden avanzar."
                  : "A calm view of what needs attention, which reviews are still pending, and which decisions can move forward."}
              </p>
            </div>
            <DemoEnvironmentBadge compact className="hidden xl:inline-flex" />
          </header>

          <ReviewCycleStrip locale={locale} />

          <section className="grid gap-3 md:grid-cols-3">
            <PriorityCard
              label={locale === "es" ? "Necesita atención" : "Needs attention"}
              value={analytics.needsAttentionCount}
              body={locale === "es" ? "Postulaciones con materiales faltantes o aclaraciones pendientes antes de revisión." : "Submissions with missing materials or clarification needed before review can move cleanly."}
              href="/review-queue/"
              cta={locale === "es" ? "Abrir cola" : "Open queue"}
              tone="attention"
            />
            <PriorityCard
              label={locale === "es" ? "Revisión pendiente" : "Reviewer follow-up"}
              value={analytics.pendingReviewerActionsCount}
              body={locale === "es" ? "Revisores que aún están asignados, en progreso o esperando completar su parte." : "Reviewer seats that are still assigned, in progress, or waiting for completion."}
              href="/committee/"
              cta={locale === "es" ? "Ver revisores" : "View reviewers"}
              tone="review"
            />
            <PriorityCard
              label={locale === "es" ? "Decisión cercana" : "Ready for decision"}
              value={analytics.shortlistedCount + analytics.pendingVoteCount}
              body={locale === "es" ? "Candidaturas con contexto suficiente para shortlist, voto de comité o informe." : "Candidates with enough context for shortlist, committee vote, or report preparation."}
              href="/review-room/"
              cta={locale === "es" ? "Abrir sala" : "Open review room"}
              tone="decision"
            />
          </section>

          <section className="mt-4 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF]/55 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid size-8 place-items-center rounded-xl bg-white text-[#5B4B8A]">
                  <FileText className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#292631]">{locale === "es" ? "Siguiente movimiento recomendado" : "Recommended next move"}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-[#6F6882]">
                    {locale === "es"
                      ? "Empieza por limpiar materiales incompletos y revisar los asientos pendientes antes de mover candidaturas a la sala de revisión."
                      : "Start by clearing incomplete materials and pending reviewer seats before moving candidates into the Review Room."}
                  </p>
                </div>
              </div>
              <Link href="/review-queue/" className="inline-flex h-9 items-center rounded-full bg-[#5B4B8A] px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                {locale === "es" ? "Trabajar cola" : "Work the queue"}
              </Link>
            </div>
          </section>

          <div className="mt-4">
            <ReviewQueue submissions={visibleSubmissions} selectedId={selectedId} onSelect={select} activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          <section className="mt-4">
            <details className="rounded-2xl border border-[#E7E1F7] bg-white shadow-[0_12px_34px_rgba(82,64,130,0.045)]">
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-[#292631]">
                {locale === "es" ? "Ver contexto del ciclo" : "View cycle context"}
                <span className="ml-2 text-xs font-normal text-[#7F7890]">
                  {locale === "es" ? "tendencias y estado general" : "trends and overall status"}
                </span>
              </summary>
              <div className="grid grid-cols-1 gap-4 border-t border-[#E7E1F7] p-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(330px,0.92fr)]">
                <ApplicationsChart />
                <StatusBreakdown />
              </div>
            </details>
          </section>
        </div>
      </main>

      {drawerOpen && selected && <SubmissionDrawer submission={selected} onPrev={() => step(-1)} onNext={() => step(1)} onClose={() => setDrawerOpen(false)} />}
    </div>
  )
}
