"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  Search,
  Send,
  Settings2,
  SlidersHorizontal,
  Vote,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { analytics, getQueueForTab, getSubmissionReviewerProgress, reviewQueueTabs } from "@/lib/kleio-analytics"
import type { Submission } from "@/lib/kleio-data"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { PriorityPill, StatusPill } from "@/components/kleio/pills"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const tabs = reviewQueueTabs
const quickFilters = [
  { id: "all", label: "All" },
  { id: "cleanup", label: "Needs cleanup" },
  { id: "ready", label: "Ready for review" },
  { id: "decision", label: "Decision-ready" },
] as const

type QuickFilterId = (typeof quickFilters)[number]["id"]

function needsCleanup(submission: Submission) {
  return Boolean(submission.missingMaterials?.length) || submission.status === "Incomplete" || submission.status === "Pending Info" || submission.completeness < 90
}

function needsReviewerFollowup(submission: Submission) {
  const progress = getSubmissionReviewerProgress(submission.id)
  return progress.total > 0 && progress.completed < progress.total
}

function isDecisionReady(submission: Submission) {
  return submission.status === "Pending Vote" || submission.status === "Shortlisted" || submission.status === "Interview" || submission.decisionStage === "Committee Vote" || submission.decisionStage === "Shortlist"
}

function actionForSubmission(submission: Submission) {
  if (needsCleanup(submission)) {
    return { label: "Request materials", icon: Mail, kind: "select" as const, hint: "Open an editable request draft." }
  }
  if (isDecisionReady(submission)) {
    return { label: "Open Review Room", icon: Vote, kind: "link" as const, href: "/review-room/", hint: "Move into committee context." }
  }
  if (needsReviewerFollowup(submission)) {
    return { label: "Send reminder", icon: Send, kind: "select" as const, hint: "Draft reviewer follow-up." }
  }
  return { label: "Open review", icon: Vote, kind: "select" as const, hint: "Inspect record and next step." }
}

function CompletenessBar({ value }: { value: number }) {
  const tone = value >= 100 ? "bg-[oklch(0.6_0.13_150)]" : value >= 90 ? "bg-primary" : "bg-[oklch(0.7_0.14_70)]"
  return (
    <div className="flex items-center gap-2">
      <span className="w-9 text-xs font-medium tabular-nums text-foreground">{value}%</span>
      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <span className={cn("block h-full rounded-full", tone)} style={{ width: `${value}%` }} />
      </span>
    </div>
  )
}

export function ReviewQueue({
  submissions: submissionsProp,
  selectedId,
  onSelect,
  activeTab: controlledTab,
  onTabChange,
}: {
  submissions?: Submission[]
  selectedId: string
  onSelect: (id: string) => void
  activeTab?: string
  onTabChange?: (tabId: string) => void
}) {
  const { t } = useKleioLocale()
  const [internalTab, setInternalTab] = useState("priority")
  const [search, setSearch] = useState("")
  const [quickFilter, setQuickFilter] = useState<QuickFilterId>("all")
  const [page, setPage] = useState(1)
  const activeTab = controlledTab ?? internalTab

  const baseSubmissions = useMemo(() => {
    if (submissionsProp) return submissionsProp
    return getQueueForTab(activeTab)
  }, [submissionsProp, activeTab])

  const visibleSubmissions = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return baseSubmissions.filter((submission) => {
      const matchesSearch = !normalized || [submission.artist, submission.projectTitle, submission.program, submission.status, submission.reviewer, submission.priority, submission.discipline, submission.medium].join(" ").toLowerCase().includes(normalized)
      if (!matchesSearch) return false
      if (quickFilter === "cleanup") return needsCleanup(submission)
      if (quickFilter === "ready") return !needsCleanup(submission) && !isDecisionReady(submission)
      if (quickFilter === "decision") return isDecisionReady(submission)
      return true
    })
  }, [baseSubmissions, search, quickFilter])

  useEffect(() => {
    if (!visibleSubmissions.some((submission) => submission.id === selectedId) && visibleSubmissions[0]) {
      // Keep selection in sync, but do not force the drawer open unless parent chooses to.
      onSelect(visibleSubmissions[0].id)
    }
  }, [activeTab, visibleSubmissions, selectedId, onSelect])

  function setActiveTab(tabId: string) {
    if (!controlledTab) setInternalTab(tabId)
    setQuickFilter("all")
    setPage(1)
    onTabChange?.(tabId)
  }

  const tabTotal = activeTab === "attention" ? analytics.needsAttentionCount : activeTab === "deadlines" ? analytics.upcomingDeadlinesCount : analytics.reviewQueueCount
  const cleanupCount = baseSubmissions.filter(needsCleanup).length
  const readyCount = baseSubmissions.filter((submission) => !needsCleanup(submission) && !isDecisionReady(submission)).length
  const decisionCount = baseSubmissions.filter(isDecisionReady).length

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm kleio-card-shadow">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-border px-5">
        {tabs.map((tab) => {
          const active = tab.id === activeTab
          return (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-2 whitespace-nowrap border-b-2 py-4 text-sm font-medium transition-colors", active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {t(tab.labelKey)}
              <span className={cn("rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums", active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>{tab.count}</span>
            </button>
          )
        })}
      </div>

      <div className="border-b border-border/70 px-5 py-4">
        <div className="mb-3 grid gap-2 md:grid-cols-3">
          <button type="button" onClick={() => setQuickFilter("cleanup")} className={cn("rounded-xl border p-3 text-left transition-colors", quickFilter === "cleanup" ? "border-primary/30 bg-primary/10" : "border-border bg-background hover:bg-accent/40")}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Needs cleanup</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-foreground">{cleanupCount}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Request missing materials first.</p>
          </button>
          <button type="button" onClick={() => setQuickFilter("ready")} className={cn("rounded-xl border p-3 text-left transition-colors", quickFilter === "ready" ? "border-primary/30 bg-primary/10" : "border-border bg-background hover:bg-accent/40")}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Ready for review</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-foreground">{readyCount}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Open records with enough context.</p>
          </button>
          <button type="button" onClick={() => setQuickFilter("decision")} className={cn("rounded-xl border p-3 text-left transition-colors", quickFilter === "decision" ? "border-primary/30 bg-primary/10" : "border-border bg-background hover:bg-accent/40")}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Decision-ready</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-foreground">{decisionCount}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Move into Review Room.</p>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("institution.reviewQueue.searchPlaceholder")} className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-4 focus:ring-primary/10" aria-label={t("institution.reviewQueue.searchPlaceholder")} />
          </div>
          {quickFilters.map((filter) => (
            <button key={filter.id} type="button" onClick={() => setQuickFilter(filter.id)} className={cn("flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors", quickFilter === filter.id ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-background text-foreground hover:bg-accent/50")}>{filter.label}</button>
          ))}
          <button type="button" className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent/50"><SlidersHorizontal className="size-3.5 text-muted-foreground" />Saved views</button>
          <button type="button" aria-label="Table settings" className="grid size-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"><Settings2 className="size-4" /></button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead>
            <tr className="border-y border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="w-10 px-5 py-3"><input type="checkbox" aria-label="Select all" className="accent-primary" /></th>
              <th className="px-3 py-3 font-medium">{t("institution.reviewQueue.column.artist")}</th>
              <th className="px-3 py-3 font-medium">{t("institution.reviewQueue.column.project")}</th>
              <th className="px-3 py-3 font-medium">{t("institution.reviewQueue.column.completeness")}</th>
              <th className="px-3 py-3 font-medium">{t("institution.reviewQueue.column.status")}</th>
              <th className="px-3 py-3 font-medium">{t("institution.reviewQueue.column.priority")}</th>
              <th className="px-3 py-3 font-medium">Recommended action</th>
            </tr>
          </thead>
          <tbody>
            {visibleSubmissions.map((s) => {
              const active = s.id === selectedId
              const action = actionForSubmission(s)
              const ActionIcon = action.icon
              return (
                <tr key={s.id} onClick={() => onSelect(s.id)} className={cn("group cursor-pointer border-b border-border/70 transition-colors", active ? "bg-accent/50" : "hover:bg-accent/30")}>
                  <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label={`Select ${s.artist}`} className="accent-primary" /></td>
                  <td className="px-3 py-3"><div className="flex items-center gap-3"><Link href={`/artists/${s.artistId}/`} onClick={(e) => e.stopPropagation()} aria-label={`View ${s.artist}'s full profile`} className="shrink-0"><InitialAvatar name={s.artist} className="size-9 text-xs transition-opacity hover:opacity-75" /></Link><div className="min-w-0"><Link href={`/artists/${s.artistId}/`} onClick={(e) => e.stopPropagation()} className="block truncate font-medium text-foreground transition-colors hover:text-primary">{s.artist}</Link><p className="truncate text-xs text-muted-foreground">{s.location}</p></div></div></td>
                  <td className="px-3 py-3"><p className="font-medium text-foreground">{s.projectTitle}</p><p className="text-xs text-muted-foreground">{s.program}</p></td>
                  <td className="px-3 py-3"><CompletenessBar value={s.completeness} /></td>
                  <td className="px-3 py-3"><StatusPill status={s.status} /></td>
                  <td className="px-3 py-3"><PriorityPill priority={s.priority} /></td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap items-center gap-2">
                      {action.kind === "link" ? (
                        <Link href={action.href} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"><ActionIcon className="size-3.5" />{action.label}</Link>
                      ) : (
                        <button type="button" onClick={() => onSelect(s.id)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"><ActionIcon className="size-3.5" />{action.label}</button>
                      )}
                      {needsCleanup(s) && <span className="inline-flex items-center gap-1 text-[0.68rem] text-muted-foreground"><AlertCircle className="size-3.5" />needs care</span>}
                    </div>
                    <p className="mt-1 text-[0.68rem] text-muted-foreground">{action.hint}</p>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <p className="text-xs text-muted-foreground">Showing {visibleSubmissions.length} filtered records from {tabTotal}. Every row has one primary next action.</p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setPage(Math.max(1, page - 1))} aria-label="Previous page" className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent/50"><ChevronLeft className="size-4" /></button>
          {[1, 2, 3].map((pageNumber) => <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} className={cn("grid size-8 place-items-center rounded-lg text-sm font-medium transition-colors", pageNumber === page ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:bg-accent/50")}>{pageNumber}</button>)}
          <button type="button" onClick={() => setPage(page + 1)} aria-label="Next page" className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent/50"><ChevronRight className="size-4" /></button>
        </div>
      </div>
    </section>
  )
}
