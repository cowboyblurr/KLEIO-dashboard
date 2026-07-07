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
                  {locale === "es" ? "Siguiente mejor acción" : "Next best action"}
                </p>
                <h2 className="mt-1 font-serif text-lg font-semibold text-[#292631]">
                  {locale === "es" ? "Revisa postulaciones incompletas y asignaciones pendientes" : "Review incomplete submissions and pending reviewer assignments"}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[#6F6882]">
                  {locale === "es"
                    ? "Empieza por la Cola de revisión para ver qué materiales faltan, qué revisores siguen pendientes y qué candidaturas pueden avanzar."
                    : "Start in Review Queue to see missing materials, pending reviewers, and which candidates can move forward."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/review-queue/" className="inline-flex h-9 items-center rounded-full bg-[#5B4B8A] px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                  {locale === "es" ? "Abrir Cola" : "Open Review Queue"}
                </Link>
                <Link href="/committee/" className="inline-flex h-9 items-center rounded-full border border-[#E7E1F7] bg-white px-4 text-xs font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]">
                  {locale === "es" ? "Ver Comité" : "View Committee"}
                </Link>
              </div>
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
