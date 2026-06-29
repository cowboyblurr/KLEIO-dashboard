"use client"

import { useState } from "react"
import { institution, submissions } from "@/lib/kleio-data"
import { KpiCards } from "@/components/kleio/kpi-cards"
import { ApplicationsChart } from "@/components/kleio/applications-chart"
import { StatusBreakdown } from "@/components/kleio/status-breakdown"
import { ReviewQueue } from "@/components/kleio/review-queue"
import { SubmissionDrawer } from "@/components/kleio/submission-drawer"
import { KleioAiInsights } from "@/components/kleio/kleio-ai-insights"

export function Overview() {
  const [selectedId, setSelectedId] = useState(submissions[0].id)
  const [drawerOpen, setDrawerOpen] = useState(true)

  const index = Math.max(
    0,
    submissions.findIndex((s) => s.id === selectedId),
  )
  const selected = submissions[index]

  function select(id: string) {
    setSelectedId(id)
    setDrawerOpen(true)
  }

  function step(dir: 1 | -1) {
    const next = (index + dir + submissions.length) % submissions.length
    setSelectedId(submissions[next].id)
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main className="min-w-0 flex-1 overflow-y-auto px-5 py-6 xl:px-7 xl:py-7">
        <div className="w-full max-w-none">
          <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-pretty font-serif text-[1.7rem] font-semibold tracking-tight text-foreground xl:text-3xl">
                Good morning, Mara.
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
              submissions={submissions}
              selectedId={selectedId}
              onSelect={select}
            />
          </div>
        </div>
      </main>

      {drawerOpen && (
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
