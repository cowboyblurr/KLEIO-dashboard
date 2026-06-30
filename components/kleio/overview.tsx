"use client"

import { useMemo, useState } from "react"
import { institution } from "@/lib/kleio-data"
import { analytics, getPrimaryUserFirstName, getQueueForTab } from "@/lib/kleio-analytics"
import { KpiCards } from "@/components/kleio/kpi-cards"
import { ApplicationsChart } from "@/components/kleio/applications-chart"
import { StatusBreakdown } from "@/components/kleio/status-breakdown"
import { ReviewQueue } from "@/components/kleio/review-queue"
import { SubmissionDrawer } from "@/components/kleio/submission-drawer"
import { KleioAiInsights } from "@/components/kleio/kleio-ai-insights"

function sortScenarioFirst<T extends { scenario?: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    if (a.scenario && !b.scenario) return -1
    if (!a.scenario && b.scenario) return 1
    return 0
  })
}

export function Overview() {
  const [activeTab, setActiveTab] = useState("priority")
  const [selectedId, setSelectedId] = useState("amina-el-badri")
  const [drawerOpen, setDrawerOpen] = useState(true)

  const visibleSubmissions = useMemo(
    () => sortScenarioFirst(getQueueForTab(activeTab)),
    [activeTab],
  )

  const drawerSubmissions = useMemo(
    () => sortScenarioFirst(analytics.reviewQueue),
    [],
  )

  const index = Math.max(
    0,
    drawerSubmissions.findIndex((s) => s.id === selectedId),
  )
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
                Good morning, {getPrimaryUserFirstName()}.
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {institution.name} review health, applicant flow, and committee actions for today.
              </p>
            </div>
            <div className="hidden rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm xl:block">
              {institution.demoLabel}
            </div>
          </header>

          <KpiCards />

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(330px,0.92fr)]">
            <ApplicationsChart />
            <StatusBreakdown />
          </div>

          <div className="mt-4">
            <KleioAiInsights />
          </div>

          <div className="mt-4">
            <ReviewQueue
              submissions={visibleSubmissions}
              selectedId={selectedId}
              onSelect={select}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </main>

      {drawerOpen && selected && (
        <SubmissionDrawer
          submission={selected}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  )
}
