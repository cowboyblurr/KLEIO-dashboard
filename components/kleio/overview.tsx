"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { analytics, getPrimaryUserFirstName, getQueueForTab } from "@/lib/kleio-analytics"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { KpiCards } from "@/components/kleio/kpi-cards"
import { ApplicationsChart } from "@/components/kleio/applications-chart"
import { StatusBreakdown } from "@/components/kleio/status-breakdown"
import { ReviewQueue } from "@/components/kleio/review-queue"
import { SubmissionDrawer } from "@/components/kleio/submission-drawer"
import { KleioAiInsights } from "@/components/kleio/kleio-ai-insights"
import { DemoEnvironmentBadge } from "@/components/kleio/demo-environment-badge"

function sortScenarioFirst<T extends { scenario?: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    if (a.scenario && !b.scenario) return -1
    if (!a.scenario && b.scenario) return 1
    return 0
  })
}

export function Overview() {
  const { t, locale } = useKleioLocale()
  const [activeTab, setActiveTab] = useState("priority")
  const [selectedId, setSelectedId] = useState("amina-el-badri")
  const [drawerOpen, setDrawerOpen] = useState(true)

  const visibleSubmissions = useMemo(() => sortScenarioFirst(getQueueForTab(activeTab)), [activeTab])
  const drawerSubmissions = useMemo(() => sortScenarioFirst(analytics.reviewQueue), [])
  const index = Math.max(0, drawerSubmissions.findIndex((s) => s.id === selectedId))
  const selected = drawerSubmissions[index] ?? drawerSubmissions[0]

  const conversionSteps = [
    { label: locale === "es" ? "Convocatoria" : "Open Call", detail: locale === "es" ? "Programa activo configurado" : "Active program configured", href: "/programs/" },
    { label: locale === "es" ? "Postulantes" : "Applicants", detail: `${analytics.totalApplications} ${locale === "es" ? "registros" : "records"}`, href: "/review-queue/" },
    { label: locale === "es" ? "Revisores" : "Reviewers", detail: `${analytics.pendingReviewerActionsCount} ${locale === "es" ? "pendientes" : "pending"}`, href: "/committee/" },
    { label: locale === "es" ? "Incompleto" : "Incomplete", detail: `${analytics.incompleteCount} ${locale === "es" ? "necesitan atención" : "need attention"}`, href: "/review-queue/" },
    { label: locale === "es" ? "Shortlist" : "Shortlist", detail: `${analytics.shortlistedCount} ${locale === "es" ? "candidaturas" : "candidates"}`, href: "/shortlist/" },
    { label: locale === "es" ? "Informe" : "Report", detail: locale === "es" ? "Resumen listo" : "Summary ready", href: "/reports/" },
  ]

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
              <p className="mt-1.5 text-sm text-muted-foreground">{t("institution.workspace.dashboard.description")}</p>
            </div>
            <DemoEnvironmentBadge className="hidden xl:inline-flex" />
          </header>

          <section className="mb-4 rounded-2xl border border-[#E7E1F7] bg-white p-4 shadow-[0_14px_38px_rgba(82,64,130,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="max-w-2xl">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">
                  {locale === "es" ? "Ruta de conversión" : "Conversion path"}
                </p>
                <h2 className="mt-1 font-serif text-lg font-semibold text-[#292631]">
                  {locale === "es" ? "Convocatoria → Postulantes → Revisión → Shortlist → Informe" : "Open call → Applicants → Review room → Shortlist → Report"}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[#6F6882]">
                  {locale === "es"
                    ? "Empieza por el programa abierto, revisa materiales incompletos, confirma revisores y avanza candidatos al informe final."
                    : "Start with the open call, resolve incomplete materials, confirm reviewer progress, and move candidates toward a final report."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/programs/" className="inline-flex h-9 items-center rounded-full bg-[#5B4B8A] px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                  {locale === "es" ? "Ver programas" : "View Programs"}
                </Link>
                <Link href="/review-room/" className="inline-flex h-9 items-center rounded-full border border-[#E7E1F7] bg-white px-4 text-xs font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]">
                  {locale === "es" ? "Abrir sala" : "Open Review Room"}
                </Link>
              </div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
              {conversionSteps.map((step, i) => (
                <Link key={step.label} href={step.href} className="rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] p-3 transition-colors hover:bg-[#F7F4FF]">
                  <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#A997E8]">0{i + 1}</span>
                  <p className="mt-1 font-serif text-sm font-semibold text-[#292631]">{step.label}</p>
                  <p className="mt-0.5 text-xs text-[#7F7890]">{step.detail}</p>
                </Link>
              ))}
            </div>
          </section>

          <KpiCards />

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(330px,0.92fr)]">
            <ApplicationsChart />
            <StatusBreakdown />
          </div>

          <div className="mt-4"><KleioAiInsights /></div>

          <div className="mt-4">
            <ReviewQueue submissions={visibleSubmissions} selectedId={selectedId} onSelect={select} activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      </main>

      {drawerOpen && selected && <SubmissionDrawer submission={selected} onPrev={() => step(-1)} onNext={() => step(1)} onClose={() => setDrawerOpen(false)} />}
    </div>
  )
}
