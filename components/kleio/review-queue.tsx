"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { AlertCircle, ChevronLeft, ChevronRight, Mail, Search, Send, Settings2, SlidersHorizontal, Vote } from "lucide-react"
import { cn } from "@/lib/utils"
import { analytics, getQueueForTab, getSubmissionReviewerProgress, reviewQueueTabs } from "@/lib/kleio-analytics"
import type { Submission } from "@/lib/kleio-data"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { PriorityPill, StatusPill } from "@/components/kleio/pills"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const tabs = reviewQueueTabs
const quickFilters = ["all", "cleanup", "ready", "decision"] as const
type QuickFilterId = (typeof quickFilters)[number]

function quickFilterLabel(id: QuickFilterId, es: boolean) {
  const labels = {
    all: es ? "Todo" : "All",
    cleanup: es ? "Por completar" : "Needs cleanup",
    ready: es ? "Listas para revisión" : "Ready for review",
    decision: es ? "Listas para decisión" : "Decision-ready",
  }
  return labels[id]
}

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

function actionForSubmission(submission: Submission, es: boolean) {
  if (needsCleanup(submission)) return { label: es ? "Solicitar materiales" : "Request materials", icon: Mail, kind: "select" as const, hint: es ? "Abre un borrador editable de solicitud." : "Open an editable request draft." }
  if (isDecisionReady(submission)) return { label: es ? "Abrir sala de revisión" : "Open Review Room", icon: Vote, kind: "link" as const, href: "/review-room/", hint: es ? "Mover al contexto de comité." : "Move into committee context." }
  if (needsReviewerFollowup(submission)) return { label: es ? "Enviar recordatorio" : "Send reminder", icon: Send, kind: "select" as const, hint: es ? "Preparar seguimiento para el revisor." : "Draft reviewer follow-up." }
  return { label: es ? "Abrir revisión" : "Open review", icon: Vote, kind: "select" as const, hint: es ? "Revisar el registro y el siguiente paso." : "Inspect record and next step." }
}

function CompletenessBar({ value }: { value: number }) {
  const tone = value >= 100 ? "bg-[oklch(0.6_0.13_150)]" : value >= 90 ? "bg-primary" : "bg-[oklch(0.7_0.14_70)]"
  return <div className="flex items-center gap-2"><span className="w-9 text-xs font-medium tabular-nums text-foreground">{value}%</span><span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"><span className={cn("block h-full rounded-full", tone)} style={{ width: `${value}%` }} /></span></div>
}

function uniqueSuggestions(submissions: Submission[], query: string) {
  const q = query.trim().toLowerCase()
  const values = submissions.flatMap((submission) => [submission.artist, submission.projectTitle, submission.program, submission.status, submission.reviewer, submission.medium, submission.priority, ...(submission.missingMaterials ?? [])])
  const seen = new Set<string>()
  return values.filter(Boolean).filter((value) => !q || value.toLowerCase().includes(q)).filter((value) => { const key = value.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true }).slice(0, 7)
}

export function ReviewQueue({ submissions: submissionsProp, selectedId, onSelect, activeTab: controlledTab, onTabChange }: { submissions?: Submission[]; selectedId: string; onSelect: (id: string) => void; activeTab?: string; onTabChange?: (tabId: string) => void }) {
  const { t, locale } = useKleioLocale()
  const es = locale === "es"
  const [internalTab, setInternalTab] = useState("priority")
  const [search, setSearch] = useState("")
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [quickFilter, setQuickFilter] = useState<QuickFilterId>("all")
  const [page, setPage] = useState(1)
  const activeTab = controlledTab ?? internalTab

  const baseSubmissions = useMemo(() => submissionsProp ? submissionsProp : getQueueForTab(activeTab), [submissionsProp, activeTab])
  const searchSuggestions = useMemo(() => uniqueSuggestions(baseSubmissions, search), [baseSubmissions, search])

  const visibleSubmissions = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return baseSubmissions.filter((submission) => {
      const matchesSearch = !normalized || [submission.artist, submission.projectTitle, submission.program, submission.status, submission.reviewer, submission.priority, submission.discipline, submission.medium, submission.missingMaterials?.join(" ") ?? ""].join(" ").toLowerCase().includes(normalized)
      if (!matchesSearch) return false
      if (quickFilter === "cleanup") return needsCleanup(submission)
      if (quickFilter === "ready") return !needsCleanup(submission) && !isDecisionReady(submission)
      if (quickFilter === "decision") return isDecisionReady(submission)
      return true
    })
  }, [baseSubmissions, search, quickFilter])

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
        {tabs.map((tab) => { const active = tab.id === activeTab; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-2 whitespace-nowrap border-b-2 py-4 text-sm font-medium transition-colors", active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{t(tab.labelKey)}<span className={cn("rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums", active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>{tab.count}</span></button> })}
      </div>
      <div className="border-b border-border/70 px-5 py-4">
        <div className="mb-3 grid gap-2 md:grid-cols-3">
          <button type="button" onClick={() => setQuickFilter("cleanup")} className={cn("rounded-xl border p-3 text-left transition-colors", quickFilter === "cleanup" ? "border-primary/30 bg-primary/10" : "border-border bg-background hover:bg-accent/40")}><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{quickFilterLabel("cleanup", es)}</p><p className="mt-1 font-serif text-2xl font-semibold text-foreground">{cleanupCount}</p><p className="mt-0.5 text-xs text-muted-foreground">{es ? "Solicita primero los materiales faltantes." : "Request missing materials first."}</p></button>
          <button type="button" onClick={() => setQuickFilter("ready")} className={cn("rounded-xl border p-3 text-left transition-colors", quickFilter === "ready" ? "border-primary/30 bg-primary/10" : "border-border bg-background hover:bg-accent/40")}><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{quickFilterLabel("ready", es)}</p><p className="mt-1 font-serif text-2xl font-semibold text-foreground">{readyCount}</p><p className="mt-0.5 text-xs text-muted-foreground">{es ? "Abre registros con contexto suficiente." : "Open records with enough context."}</p></button>
          <button type="button" onClick={() => setQuickFilter("decision")} className={cn("rounded-xl border p-3 text-left transition-colors", quickFilter === "decision" ? "border-primary/30 bg-primary/10" : "border-border bg-background hover:bg-accent/40")}><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{quickFilterLabel("decision", es)}</p><p className="mt-1 font-serif text-2xl font-semibold text-foreground">{decisionCount}</p><p className="mt-0.5 text-xs text-muted-foreground">{es ? "Mover a la sala de revisión." : "Move into Review Room."}</p></button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input type="search" value={search} onFocus={() => setSuggestionsOpen(true)} onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)} onChange={(event) => { setSearch(event.target.value); setSuggestionsOpen(true) }} onKeyDown={(event) => { if (event.key === "Escape") setSuggestionsOpen(false); if (event.key === "Enter" && searchSuggestions[0]) { event.preventDefault(); setSearch(searchSuggestions[0]); setSuggestionsOpen(false) } }} placeholder={t("institution.reviewQueue.searchPlaceholder")} className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-4 focus:ring-primary/10" aria-label={t("institution.reviewQueue.searchPlaceholder")} />{suggestionsOpen && searchSuggestions.length > 0 && <div className="absolute left-0 right-0 top-11 z-40 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_40px_rgba(40,30,70,0.12)]"><p className="border-b border-border px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{es ? "Búsquedas sugeridas" : "Suggested queue searches"}</p><div className="p-1.5">{searchSuggestions.map((suggestion) => <button key={suggestion} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setSearch(suggestion); setSuggestionsOpen(false) }} className="block w-full rounded-xl px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-accent/50">{suggestion}</button>)}</div></div>}</div>
          {quickFilters.map((filter) => <button key={filter} type="button" onClick={() => setQuickFilter(filter)} className={cn("flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors", quickFilter === filter ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-background text-foreground hover:bg-accent/50")}>{quickFilterLabel(filter, es)}</button>)}
          <button type="button" className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent/50"><SlidersHorizontal className="size-3.5 text-muted-foreground" />{es ? "Vistas guardadas" : "Saved views"}</button>
          <button type="button" aria-label={es ? "Ajustes de tabla" : "Table settings"} className="grid size-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"><Settings2 className="size-4" /></button>
        </div>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[920px] border-collapse text-sm"><thead><tr className="border-y border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"><th className="w-10 px-5 py-3"><input type="checkbox" aria-label={es ? "Seleccionar todo" : "Select all"} className="accent-primary" /></th><th className="px-3 py-3 font-medium">{t("institution.reviewQueue.column.artist")}</th><th className="px-3 py-3 font-medium">{t("institution.reviewQueue.column.project")}</th><th className="px-3 py-3 font-medium">{t("institution.reviewQueue.column.completeness")}</th><th className="px-3 py-3 font-medium">{t("institution.reviewQueue.column.status")}</th><th className="px-3 py-3 font-medium">{t("institution.reviewQueue.column.priority")}</th><th className="px-3 py-3 font-medium">{es ? "Acción recomendada" : "Recommended action"}</th></tr></thead><tbody>{visibleSubmissions.map((s) => { const active = s.id === selectedId; const action = actionForSubmission(s, es); const ActionIcon = action.icon; return <tr key={s.id} onClick={() => onSelect(s.id)} className={cn("group cursor-pointer border-b border-border/70 transition-colors", active ? "bg-accent/50" : "hover:bg-accent/30")}><td className="px-5 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label={es ? `Seleccionar ${s.artist}` : `Select ${s.artist}`} className="accent-primary" /></td><td className="px-3 py-3"><div className="flex items-center gap-3"><Link href={`/artists/${s.artistId}/`} onClick={(e) => e.stopPropagation()} aria-label={es ? `Ver perfil completo de ${s.artist}` : `View ${s.artist}'s full profile`} className="shrink-0"><InitialAvatar name={s.artist} className="size-9 text-xs transition-opacity hover:opacity-75" /></Link><div className="min-w-0"><Link href={`/artists/${s.artistId}/`} onClick={(e) => e.stopPropagation()} className="block truncate font-medium text-foreground transition-colors hover:text-primary">{s.artist}</Link><p className="truncate text-xs text-muted-foreground">{s.location}</p></div></div></td><td className="px-3 py-3"><p className="font-medium text-foreground">{s.projectTitle}</p><p className="text-xs text-muted-foreground">{s.program}</p></td><td className="px-3 py-3"><CompletenessBar value={s.completeness} /></td><td className="px-3 py-3"><StatusPill status={s.status} /></td><td className="px-3 py-3"><PriorityPill priority={s.priority} /></td><td className="px-3 py-3" onClick={(e) => e.stopPropagation()}><div className="flex flex-wrap items-center gap-2">{action.kind === "link" ? <Link href={action.href} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"><ActionIcon className="size-3.5" />{action.label}</Link> : <button type="button" onClick={() => onSelect(s.id)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"><ActionIcon className="size-3.5" />{action.label}</button>}{needsCleanup(s) && <span className="inline-flex items-center gap-1 text-[0.68rem] text-muted-foreground"><AlertCircle className="size-3.5" />{es ? "requiere cuidado" : "needs care"}</span>}</div><p className="mt-1 text-[0.68rem] text-muted-foreground">{action.hint}</p></td></tr> })}</tbody></table></div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><p className="text-xs text-muted-foreground">{es ? `Mostrando ${visibleSubmissions.length} registros filtrados de ${tabTotal}. Cada fila tiene una acción principal recomendada.` : `Showing ${visibleSubmissions.length} filtered records from ${tabTotal}. Every row has one primary next action.`}</p><div className="flex items-center gap-1"><button type="button" onClick={() => setPage(Math.max(1, page - 1))} aria-label={es ? "Página anterior" : "Previous page"} className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent/50"><ChevronLeft className="size-4" /></button>{[1, 2, 3].map((pageNumber) => <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} className={cn("grid size-8 place-items-center rounded-lg text-sm font-medium transition-colors", pageNumber === page ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:bg-accent/50")}>{pageNumber}</button>)}<button type="button" onClick={() => setPage(page + 1)} aria-label={es ? "Página siguiente" : "Next page"} className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent/50"><ChevronRight className="size-4" /></button></div></div>
    </section>
  )
}
