"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  Settings2,
  SlidersHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { analytics, getQueueForTab, reviewQueueTabs } from "@/lib/kleio-analytics"
import type { Submission } from "@/lib/kleio-data"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { PriorityPill, StatusPill } from "@/components/kleio/pills"

const tabs = reviewQueueTabs
const filterChips = ["All Programs", "All Reviewers", "All Priorities", "All Statuses"]

function CompletenessBar({ value }: { value: number }) {
  const tone =
    value >= 100
      ? "bg-[oklch(0.6_0.13_150)]"
      : value >= 90
        ? "bg-primary"
        : "bg-[oklch(0.7_0.14_70)]"
  return (
    <div className="flex items-center gap-2">
      <span className="w-9 text-xs font-medium tabular-nums text-foreground">
        {value}%
      </span>
      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <span
          className={cn("block h-full rounded-full", tone)}
          style={{ width: `${value}%` }}
        />
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
  const [internalTab, setInternalTab] = useState("priority")
  const activeTab = controlledTab ?? internalTab

  const visibleSubmissions = useMemo(() => {
    if (submissionsProp) return submissionsProp
    return getQueueForTab(activeTab)
  }, [submissionsProp, activeTab])

  useEffect(() => {
    if (!visibleSubmissions.some((submission) => submission.id === selectedId) && visibleSubmissions[0]) {
      onSelect(visibleSubmissions[0].id)
    }
  }, [activeTab, visibleSubmissions, selectedId, onSelect])

  function setActiveTab(tabId: string) {
    if (!controlledTab) setInternalTab(tabId)
    onTabChange?.(tabId)
  }

  const tabTotal =
    activeTab === "attention"
      ? analytics.needsAttentionCount
      : activeTab === "deadlines"
        ? analytics.upcomingDeadlinesCount
        : analytics.reviewQueueCount

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm kleio-card-shadow">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-border px-5">
        {tabs.map((tab) => {
          const active = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap border-b-2 py-4 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums",
                  active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 py-4">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search submissions in queue…"
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
            aria-label="Search submissions in queue"
          />
        </div>
        {filterChips.map((chip) => (
          <button
            key={chip}
            type="button"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent/50"
          >
            {chip}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
        ))}
        <button
          type="button"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent/50"
        >
          <SlidersHorizontal className="size-3.5 text-muted-foreground" />
          Saved Filters
        </button>
        <button
          type="button"
          aria-label="Table settings"
          className="grid size-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <Settings2 className="size-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-y border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="w-10 px-5 py-3">
                <input type="checkbox" aria-label="Select all" className="accent-primary" />
              </th>
              <th className="px-3 py-3 font-medium">Artist</th>
              <th className="px-3 py-3 font-medium">Project Title</th>
              <th className="px-3 py-3 font-medium">Program</th>
              <th className="px-3 py-3 font-medium">Completeness</th>
              <th className="px-3 py-3 font-medium">Assigned Reviewer</th>
              <th className="px-3 py-3 font-medium">Submitted</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Priority</th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {visibleSubmissions.map((s) => {
              const active = s.id === selectedId
              return (
                <tr
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  className={cn(
                    "group cursor-pointer border-b border-border/70 transition-colors",
                    active ? "bg-accent/50" : "hover:bg-accent/30",
                  )}
                >
                  <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${s.artist}`}
                      className="accent-primary"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <InitialAvatar name={s.artist} className="size-9 text-xs" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{s.artist}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.location}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-foreground">{s.projectTitle}</td>
                  <td className="px-3 py-3">
                    <p className="text-foreground">{s.program}</p>
                    <p className="text-xs text-muted-foreground">{s.programCycle}</p>
                  </td>
                  <td className="px-3 py-3">
                    <CompletenessBar value={s.completeness} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <InitialAvatar name={s.reviewer} className="size-6 text-[0.6rem]" />
                      <span className="text-foreground">{s.reviewer}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{s.submitted}</td>
                  <td className="px-3 py-3">
                    <StatusPill status={s.status} />
                  </td>
                  <td className="px-3 py-3">
                    <PriorityPill priority={s.priority} />
                  </td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      aria-label={`More actions for ${s.artist}`}
                      className="grid size-7 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <p className="text-xs text-muted-foreground">
          Showing 1–{visibleSubmissions.length} of {tabTotal}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent/50"
          >
            <ChevronLeft className="size-4" />
          </button>
          {[1, 2, 3, 4, 5].map((page) => (
            <button
              key={page}
              type="button"
              className={cn(
                "grid size-8 place-items-center rounded-lg text-sm font-medium transition-colors",
                page === 1
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-foreground hover:bg-accent/50",
              )}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            aria-label="Next page"
            className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent/50"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
