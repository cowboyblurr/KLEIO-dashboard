"use client"

import type { CSSProperties } from "react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { analytics, demoScenarios, getQueueForTab } from "@/lib/kleio-analytics"
import { institution } from "@/lib/kleio-data"
import { DemoPageShell, DemoStatRow } from "@/components/kleio/demo-page-shell"
import { ReviewQueue } from "@/components/kleio/review-queue"
import { SubmissionDrawer } from "@/components/kleio/submission-drawer"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import workflowMotion from "@/components/kleio/workflow-motion.module.css"

function sortScenarioFirst<T extends { scenario?: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    if (a.scenario && !b.scenario) return -1
    if (!a.scenario && b.scenario) return 1
    return 0
  })
}

function workflowDelay(index: number): CSSProperties {
  return { "--workflow-delay": `${index * 95}ms` } as CSSProperties
}

export function ReviewQueuePageView() {
  const { t } = useKleioLocale()
  const [activeTab, setActiveTab] = useState("priority")
  const [selectedId, setSelectedId] = useState("mei-lin-zhang")
  const [drawerOpen, setDrawerOpen] = useState(false)

  const visibleSubmissions = useMemo(() => sortScenarioFirst(getQueueForTab(activeTab)), [activeTab])
  const drawerSubmissions = useMemo(() => sortScenarioFirst(analytics.reviewQueue), [])
  const index = Math.max(0, drawerSubmissions.findIndex((s) => s.id === selectedId))
  const selected = drawerSubmissions[index] ?? drawerSubmissions[0]

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <div className="min-w-0 flex-1 overflow-y-auto">
        <DemoPageShell
          title={t("institution.reviewQueue.title")}
          description="Start here to clean incomplete records, follow up with reviewers, and move ready applicants into the Review Room."
          actions={
            <>
              <Link href="/review-room/" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">Open Review Room</Link>
              <Link href="/reports/" className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent/50">View Report</Link>
            </>
          }
        >
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:max-w-4xl">
            <DemoStatRow label={t("institution.reviewQueue.stat.assignedReviews")} value={analytics.reviewQueueCount} href="/review-queue/" />
            <DemoStatRow label={t("institution.reviewQueue.stat.needsAttention")} value={analytics.needsAttentionCount} href="/review-queue/" />
            <DemoStatRow label={t("institution.reviewQueue.stat.pendingVote")} value={analytics.pendingVoteCount} href="/review-room/" />
            <DemoStatRow label={t("institution.reviewQueue.stat.upcomingDeadlines")} value={analytics.upcomingDeadlinesCount} href="/programs/" />
          </div>

          <section className="mb-4 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Before committee review</p>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[#6F6882]">Every applicant row now has one recommended action: request missing materials, open review, send a reviewer reminder, or move the record into the Review Room.</p>
            <div className="mt-3 grid gap-2 xl:grid-cols-4">
              {[
                ["Applicants", `${analytics.reviewQueueCount} records in queue`],
                ["Incomplete", `${analytics.incompleteCount} need material cleanup`],
                ["Reviewer follow-up", `${analytics.pendingReviewerActionsCount} actions pending`],
                ["Next room", "Ready records move into Review Room"],
              ].map(([title, body], index) => (
                <div key={title} className={`${workflowMotion.step} rounded-xl border border-[#E7E1F7] bg-white p-3`} style={workflowDelay(index)}>
                  <p className="font-serif text-sm font-semibold text-[#292631]">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#7F7890]">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-4 rounded-2xl border border-primary/15 bg-card/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("institution.reviewQueue.scenariosEyebrow", { institution: institution.name })}</p>
            <div className="mt-3 grid gap-2 xl:grid-cols-3">
              {demoScenarios.map((scenario, index) => (
                <button key={scenario.id} type="button" onClick={() => { setSelectedId(scenario.submissionId); setDrawerOpen(true) }} className={`${workflowMotion.step} rounded-xl border border-border bg-background/70 p-3 text-left transition-colors hover:bg-accent/40`} style={workflowDelay(index)}>
                  <p className="text-xs font-semibold text-foreground">{scenario.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{scenario.pain}</p>
                </button>
              ))}
            </div>
          </section>

          <ReviewQueue submissions={visibleSubmissions} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setDrawerOpen(true) }} activeTab={activeTab} onTabChange={setActiveTab} />
        </DemoPageShell>
      </div>

      {drawerOpen && selected && (
        <SubmissionDrawer
          submission={selected}
          onPrev={() => { const next = (index - 1 + drawerSubmissions.length) % drawerSubmissions.length; setSelectedId(drawerSubmissions[next].id) }}
          onNext={() => { const next = (index + 1) % drawerSubmissions.length; setSelectedId(drawerSubmissions[next].id) }}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  )
}
