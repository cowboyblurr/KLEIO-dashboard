"use client"

import { useState } from "react"
import { submissions } from "@/lib/kleio-data"
import { KpiCards } from "@/components/kleio/kpi-cards"
import { ApplicationsChart } from "@/components/kleio/applications-chart"
import { StatusBreakdown } from "@/components/kleio/status-breakdown"
import { ReviewQueue } from "@/components/kleio/review-queue"
import { SubmissionDrawer } from "@/components/kleio/submission-drawer"

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
    <div className="flex h-full min-h-0">
      <main className="min-w-0 flex-1 overflow-y-auto px-6 py-7 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="mb-6">
            <h1 className="text-pretty font-serif text-3xl font-semibold tracking-tight text-foreground">
              Good morning, Olivia.
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Here&apos;s what&apos;s happening with your programs today.
            </p>
          </header>

          <KpiCards />

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ApplicationsChart />
            <StatusBreakdown />
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
