"use client"

import { useMemo, useState } from "react"
import { analytics, demoScenarios, getQueueForTab } from "@/lib/kleio-analytics"
import { institution } from "@/lib/kleio-data"
import { DemoPageShell, DemoStatRow } from "@/components/kleio/demo-page-shell"
import { ReviewQueue } from "@/components/kleio/review-queue"
import { SubmissionDrawer } from "@/components/kleio/submission-drawer"

function sortScenarioFirst<T extends { scenario?: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    if (a.scenario && !b.scenario) return -1
    if (!a.scenario && b.scenario) return 1
    return 0
  })
}

export function ReviewQueuePageView() {
  const [activeTab, setActiveTab] = useState("priority")
  const [selectedId, setSelectedId] = useState("mei-lin-zhang")
  const [drawerOpen, setDrawerOpen] = useState(true)

  const visibleSubmissions = useMemo(
    () => sortScenarioFirst(getQueueForTab(activeTab)),
    [activeTab],
  )
  const drawerSubmissions = useMemo(() => sortScenarioFirst(analytics.reviewQueue), [])
  const index = Math.max(0, drawerSubmissions.findIndex((s) => s.id === selectedId))
  const selected = drawerSubmissions[index] ?? drawerSubmissions[0]

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <div className="min-w-0 flex-1 overflow-y-auto">
        <DemoPageShell
          title="Review Queue"
          description="Prioritized evaluation workspace — assign reviewers, score submissions, and keep every decision moving forward."
        >
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:max-w-4xl">
            <DemoStatRow label="Assigned reviews" value={analytics.reviewQueueCount} />
            <DemoStatRow label="Needs attention" value={analytics.needsAttentionCount} />
            <DemoStatRow label="Pending committee vote" value={analytics.pendingVoteCount} />
            <DemoStatRow label="Upcoming deadlines" value={analytics.upcomingDeadlinesCount} />
          </div>

          <section className="mb-4 rounded-2xl border border-primary/15 bg-card/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Demo scenarios · {institution.name}
            </p>
            <div className="mt-3 grid gap-2 xl:grid-cols-3">
              {demoScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(scenario.submissionId)
                    setDrawerOpen(true)
                  }}
                  className="rounded-xl border border-border bg-background/70 p-3 text-left transition-colors hover:bg-accent/40"
                >
                  <p className="text-xs font-semibold text-foreground">{scenario.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{scenario.pain}</p>
                </button>
              ))}
            </div>
          </section>

          <ReviewQueue
            submissions={visibleSubmissions}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id)
              setDrawerOpen(true)
            }}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </DemoPageShell>
      </div>

      {drawerOpen && selected && (
        <SubmissionDrawer
          submission={selected}
          onPrev={() => {
            const next = (index - 1 + drawerSubmissions.length) % drawerSubmissions.length
            setSelectedId(drawerSubmissions[next].id)
          }}
          onNext={() => {
            const next = (index + 1) % drawerSubmissions.length
            setSelectedId(drawerSubmissions[next].id)
          }}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  )
}
