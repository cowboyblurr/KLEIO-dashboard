"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  BadgeCheck,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  EyeOff,
  FileText,
  Flag,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Undo2,
  X,
  XCircle,
} from "lucide-react"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { OpportunityPreviewImage } from "@/components/kleio/opportunity-preview-image"
import { ARTIST_DISCIPLINE_OPTIONS } from "@/lib/kleio-artist-taxonomy"
import {
  evaluateOpportunity,
  recordOpportunityEvent,
  setGlobalOpportunitySaved,
  type OpportunityDirectoryItem,
  type OpportunityEvaluation,
} from "@/lib/kleio-opportunity-data"
import {
  assessOpportunityMaterialReadiness,
  safeOpportunityUrl,
} from "@/lib/kleio-opportunity-presentation"
import { parseOpportunitySearchIntent } from "@/lib/kleio-opportunity-search-intent"
import {
  loadPersistentOpportunityDirectory,
  reportOpportunityIssue,
  setOpportunityHidden,
  type OpportunityReportReason,
  type PersistentOpportunityDirectoryData,
  type PersistentOpportunityFilters,
} from "@/lib/kleio-persistent-opportunity-directory"
import type { OpportunityImageMetadata } from "@/lib/kleio-opportunity-images"

const STORAGE_KEY = "kleio_opportunity_filters_v1"
const SCROLL_KEY = "kleio_opportunity_scroll_v1"
const PAGE_SIZE = 24
const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]"
const input = "h-10 w-full rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
const primary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A997E8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

const REPORT_REASONS: Array<[OpportunityReportReason, string]> = [
  ["deadline_incorrect", "Deadline appears incorrect"],
  ["closed", "Opportunity is closed"],
  ["broken_link", "Application link is broken"],
  ["funding_inaccurate", "Funding information appears inaccurate"],
  ["eligibility_inaccurate", "Eligibility appears inaccurate"],
  ["possible_scam", "Possible scam or suspicious request"],
  ["rights_concern", "Rights terms are concerning"],
  ["unexpected_fee", "Unexpected application fee"],
  ["match_incorrect", "KLEIO’s fit explanation is incorrect"],
  ["duplicate", "Duplicate listing"],
  ["other", "Other issue"],
]

type VisualOpportunity = OpportunityDirectoryItem & OpportunityImageMetadata & {
  funding_display_text?: string
  funding_amount_type?: string
  funding_source_url?: string
  funding_source_note?: string
  funding_verified_at?: string | null
  application_fee_currency?: string | null
  financial_terms_verified?: boolean
  rights_terms_verified?: boolean
  institutional_verification_level?: string
  logistics_notes?: string
  reverify_at?: string | null
  insurance_supported?: boolean | null
  production_supported?: boolean | null
  living_stipend_text?: string
  submission_method?: string
}

type FilterState = {
  query: string
  type: string
  source: string
  format: string
  discipline: string
  geography: string
  deadlineWindow: string
  noFeeOnly: boolean
  requirementsOnly: boolean
}

const defaultFilters: FilterState = {
  query: "",
  type: "all",
  source: "all",
  format: "all",
  discipline: "all",
  geography: "",
  deadlineWindow: "all",
  noFeeOnly: false,
  requirementsOnly: false,
}

function cleanLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value: string | null | undefined, fallback = "Not stated by provider") {
  if (!value) return fallback
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return fallback
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(parsed)
}

function formatDeadline(item: OpportunityDirectoryItem) {
  if (item.recurring && !item.deadline_at) return "Rolling / confirm timing"
  return formatDate(item.deadline_at, item.status === "forecasted" ? "Forecast date not confirmed" : "Deadline not stated")
}

function formatAmount(item: VisualOpportunity) {
  if (item.funding_display_text?.trim()) return item.funding_display_text.trim()
  if (item.living_stipend_text?.trim()) return item.living_stipend_text.trim()
  if (item.award_min === null && item.award_max === null) return "Not stated by provider"
  const currency = item.currency || "Currency not stated"
  const format = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)
  if (item.award_min !== null && item.award_max !== null && item.award_min !== item.award_max) return `${currency} ${format(item.award_min)}–${format(item.award_max)}`
  return `${currency} ${format(item.award_max ?? item.award_min ?? 0)}`
}

function formatFee(item: VisualOpportunity) {
  if (item.application_fee === null) return "Not stated by provider"
  if (item.application_fee === 0) return "No application fee"
  const currency = item.application_fee_currency || item.currency
  return `${currency ? `${currency} ` : ""}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(item.application_fee)}`
}

function eligibilityCopy(status: OpportunityEvaluation["eligibility"]) {
  if (status === "eligible") return "Eligible based on available information"
  if (status === "likely_eligible") return "Likely eligible; confirm the unclear requirement"
  if (status === "missing_information") return "Complete Passport information to check"
  if (status === "not_eligible") return "Not eligible based on the stated requirements"
  return "Eligibility unclear"
}

function eligibilityTone(status: OpportunityEvaluation["eligibility"]) {
  if (status === "eligible") return "bg-emerald-50 text-emerald-700"
  if (status === "not_eligible") return "bg-red-50 text-red-700"
  if (status === "missing_information") return "bg-amber-50 text-amber-700"
  return "bg-[#F7F4FF] text-[#5B4B8A]"
}

function relevanceCopy(status: OpportunityEvaluation["relevance"]) {
  if (status === "strong_relevance") return "Strong practice relevance"
  if (status === "moderate_relevance") return "Moderate practice relevance"
  if (status === "limited_relevance") return "Limited structured relevance"
  return "Not enough Passport information for relevance"
}

function readinessCopy(readiness: ReturnType<typeof assessOpportunityMaterialReadiness>) {
  if (readiness.unknown || readiness.score === null) return "Application requirements not structured"
  if (readiness.blockingCount) return `${readiness.score}% ready · ${readiness.blockingCount} blocking`
  if (readiness.manualReview.length) return `${readiness.score}% ready · ${readiness.manualReview.length} to confirm`
  return `${readiness.score}% of required materials ready`
}

function statusCopy(status: OpportunityDirectoryItem["status"]) {
  if (status === "forecasted") return "Forecasted"
  if (status === "upcoming") return "Upcoming"
  return "Open"
}

function statusTone(status: OpportunityDirectoryItem["status"]) {
  return status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
}

function trustCopy(item: VisualOpportunity) {
  const sourceName = item.source?.name || item.provider_name
  if (item.source?.slug === "kleio-institution") return { label: "Hosted on KLEIO", detail: sourceName, tone: "bg-[#EEE8FF] text-[#5B4B8A]" }
  if (item.source?.source_type === "provider_submission") return { label: "Provider submitted · KLEIO reviewed", detail: sourceName, tone: "bg-sky-50 text-sky-800" }
  return { label: "Verified through official source", detail: sourceName, tone: "bg-emerald-50 text-emerald-800" }
}

function verificationDue(item: VisualOpportunity) {
  if (!item.reverify_at) return false
  const date = new Date(item.reverify_at)
  return Number.isFinite(date.getTime()) && date.getTime() <= Date.now()
}

function importantTerms(item: VisualOpportunity) {
  const terms: string[] = []
  if (item.application_fee && item.application_fee > 0) terms.push(`Application fee: ${formatFee(item)}`)
  if (item.funding_amount_type && item.funding_amount_type !== "fixed") terms.push(cleanLabel(item.funding_amount_type))
  if (item.financial_terms_verified === false) terms.push("Financial terms require review")
  if (item.rights_terms_verified === false) terms.push("Rights terms require review")
  if (item.travel_supported === false) terms.push("Artist-funded travel")
  if (item.accommodation_supported === false) terms.push("Artist-funded accommodation")
  if (item.insurance_supported === false) terms.push("Insurance is not provided")
  if (item.fiscal_sponsor_allowed === false) terms.push("Fiscal sponsorship is not accepted")
  if (item.award_min === null && item.award_max === null && !item.funding_display_text?.trim() && !item.living_stipend_text?.trim()) terms.push("Support amount not stated")
  if (verificationDue(item)) terms.push("Verification is due; confirm current details")
  return Array.from(new Set(terms)).slice(0, 6)
}

function fitReasons(item: VisualOpportunity, evaluation: OpportunityEvaluation, directory: PersistentOpportunityDirectoryData | null) {
  const reasons = evaluation.ruleResults.filter((result) => result.status === "passed").map((result) => result.label)
  const passportDisciplines = directory?.passport?.disciplines ?? []
  const matchingDiscipline = item.disciplines.find((discipline) => passportDisciplines.some((artistDiscipline) => artistDiscipline.toLowerCase() === discipline.toLowerCase()))
  if (matchingDiscipline) reasons.unshift(`Open to ${matchingDiscipline}`)
  if (item.application_fee === 0) reasons.push("No application fee")
  return Array.from(new Set(reasons)).slice(0, 2)
}

function confirmationItems(evaluation: OpportunityEvaluation) {
  return evaluation.ruleResults
    .filter((result) => result.status === "unknown")
    .map((result) => result.label)
    .slice(0, 2)
}

function deadlineTo(windowValue: string) {
  const days = Number(windowValue)
  if (!Number.isFinite(days) || days <= 0) return null
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  date.setUTCHours(23, 59, 59, 999)
  return date.toISOString()
}

function toDirectoryFilters(filters: FilterState, offset = 0, limit = PAGE_SIZE): PersistentOpportunityFilters {
  return {
    query: filters.query,
    opportunityTypes: filters.type === "all" ? undefined : [filters.type],
    sourceSlugs: filters.source === "all" ? undefined : [filters.source],
    participationFormats: filters.format === "all" ? undefined : [filters.format],
    disciplines: filters.discipline === "all" ? undefined : [filters.discipline],
    eligibleCountry: filters.geography,
    deadlineTo: filters.deadlineWindow === "all" ? null : deadlineTo(filters.deadlineWindow),
    structuredRequirementsOnly: filters.requirementsOnly,
    noFeeOnly: filters.noFeeOnly,
    limit,
    offset,
  }
}

function restoreFilters(value: unknown): FilterState {
  if (!value || typeof value !== "object") return defaultFilters
  const stored = value as Record<string, unknown>
  return {
    query: typeof stored.query === "string" ? stored.query : "",
    type: typeof stored.type === "string" ? stored.type : "all",
    source: typeof stored.source === "string" ? stored.source : "all",
    format: typeof stored.format === "string" ? stored.format : "all",
    discipline: typeof stored.discipline === "string" ? stored.discipline : "all",
    geography: typeof stored.geography === "string" ? stored.geography : "",
    deadlineWindow: typeof stored.deadlineWindow === "string" ? stored.deadlineWindow : "all",
    noFeeOnly: stored.noFeeOnly === true,
    requirementsOnly: stored.requirementsOnly === true,
  }
}

export function ProductionArtistOpportunityDirectory() {
  const requestIdRef = useRef(0)
  const scrollRef = useRef<HTMLElement | null>(null)
  const reportReasonRef = useRef<HTMLSelectElement | null>(null)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [directory, setDirectory] = useState<PersistentOpportunityDirectoryData | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [actionId, setActionId] = useState("")
  const [announcement, setAnnouncement] = useState("")
  const [hiddenUndo, setHiddenUndo] = useState<{ item: VisualOpportunity; index: number } | null>(null)
  const [reportTarget, setReportTarget] = useState<VisualOpportunity | null>(null)
  const [reportReason, setReportReason] = useState<OpportunityReportReason>("deadline_incorrect")
  const [reportNotes, setReportNotes] = useState("")
  const [reporting, setReporting] = useState(false)
  const [reportConfirmation, setReportConfirmation] = useState("")
  const intent = useMemo(() => parseOpportunitySearchIntent(filters.query), [filters.query])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) setFilters(restoreFilters(JSON.parse(stored)))
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  }, [filters, hydrated])

  useEffect(() => {
    if (!hydrated) return
    const requestId = ++requestIdRef.current
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError("")
      setHiddenUndo(null)
      void loadPersistentOpportunityDirectory(toDirectoryFilters(filters))
        .then((result) => {
          if (requestId !== requestIdRef.current) return
          setDirectory(result)
          setAnnouncement(result.total ? `Showing ${result.items.length} of ${result.total} verified opportunities.` : "No verified opportunities match the current filters.")
          void recordOpportunityEvent(result.items.length ? "search" : "zero_results", null, filters.query, {
            search_mode: "persistent_database_filters_paginated",
            opportunity_type: filters.type,
            source: filters.source,
            participation_format: filters.format,
            discipline: filters.discipline,
            geography: filters.geography,
            deadline_window: filters.deadlineWindow,
            no_fee_only: filters.noFeeOnly,
            structured_requirements_only: filters.requirementsOnly,
            result_count: result.items.length,
            verified_total: result.total,
          }).catch(() => undefined)
          window.requestAnimationFrame(() => {
            const storedScroll = Number(window.sessionStorage.getItem(SCROLL_KEY) || 0)
            if (scrollRef.current && Number.isFinite(storedScroll) && storedScroll > 0) scrollRef.current.scrollTop = storedScroll
          })
        })
        .catch((reason) => {
          if (requestId === requestIdRef.current) setError(reason instanceof Error ? reason.message : "KLEIO could not search the opportunity directory.")
        })
        .finally(() => {
          if (requestId === requestIdRef.current) setLoading(false)
        })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [filters, hydrated])

  useEffect(() => {
    if (!reportTarget) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const timer = window.setTimeout(() => reportReasonRef.current?.focus(), 0)
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setReportTarget(null)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("keydown", onKeyDown)
      previousFocus?.focus()
    }
  }, [reportTarget])

  async function loadMore() {
    if (!directory || loadingMore || directory.items.length >= directory.total) return
    const requestId = requestIdRef.current
    setLoadingMore(true)
    setError("")
    try {
      const result = await loadPersistentOpportunityDirectory(toDirectoryFilters(filters, directory.items.length))
      if (requestId !== requestIdRef.current) return
      setDirectory((current) => {
        if (!current) return result
        const ids = new Set(current.items.map((item) => item.id))
        const additions = result.items.filter((item) => !ids.has(item.id))
        const next = { ...current, total: result.total, items: [...current.items, ...additions] }
        setAnnouncement(`${additions.length} more opportunities loaded. Showing ${next.items.length} of ${next.total}.`)
        return next
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not load more opportunities.")
    } finally {
      setLoadingMore(false)
    }
  }

  async function toggleSaved(item: OpportunityDirectoryItem) {
    setActionId(item.id)
    setError("")
    try {
      await setGlobalOpportunitySaved(item.id, !item.saved)
      setDirectory((current) => current ? {
        ...current,
        items: current.items.map((candidate) => candidate.id === item.id ? { ...candidate, saved: !candidate.saved } : candidate),
      } : current)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update the saved opportunity.")
    } finally {
      setActionId("")
    }
  }

  async function hideOpportunity(item: VisualOpportunity) {
    if (!directory) return
    const index = directory.items.findIndex((candidate) => candidate.id === item.id)
    setActionId(item.id)
    setError("")
    try {
      await setOpportunityHidden(item.id, true)
      setDirectory((current) => current ? {
        ...current,
        total: Math.max(0, current.total - 1),
        items: current.items.filter((candidate) => candidate.id !== item.id),
      } : current)
      setHiddenUndo({ item, index: Math.max(index, 0) })
      setAnnouncement(`${item.title} hidden from your recommendations. You can undo this action.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to hide this opportunity.")
    } finally {
      setActionId("")
    }
  }

  async function undoHide() {
    if (!hiddenUndo) return
    setActionId(hiddenUndo.item.id)
    setError("")
    try {
      await setOpportunityHidden(hiddenUndo.item.id, false)
      setDirectory((current) => {
        if (!current) return current
        const items = [...current.items]
        items.splice(Math.min(hiddenUndo.index, items.length), 0, hiddenUndo.item)
        return { ...current, total: current.total + 1, items }
      })
      setAnnouncement(`${hiddenUndo.item.title} restored to your opportunity directory.`)
      setHiddenUndo(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to restore this opportunity.")
    } finally {
      setActionId("")
    }
  }

  async function submitReport() {
    if (!reportTarget) return
    setReporting(true)
    setError("")
    try {
      await reportOpportunityIssue(reportTarget.id, reportReason, reportNotes)
      setReportConfirmation("Thank you. KLEIO added this listing to the internal review queue.")
      setAnnouncement(`Issue reported for ${reportTarget.title}.`)
      setReportTarget(null)
      setReportNotes("")
      setReportReason("deadline_incorrect")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to report this opportunity.")
    } finally {
      setReporting(false)
    }
  }

  const items = directory?.items ?? []
  const total = directory?.total ?? 0

  return (
    <main
      ref={scrollRef}
      className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6"
      onScroll={(event) => window.sessionStorage.setItem(SCROLL_KEY, String(event.currentTarget.scrollTop))}
    >
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader eyebrow="Artist workspace" title="Opportunities" description="Search trustworthy artist opportunities and understand the real offer before investing application time." />

        <section className={`${card} space-y-4`} aria-label="Opportunity filters">
          <div>
            <label className="relative block">
              <span className="sr-only">Search verified opportunities</span>
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <input type="search" value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Try “ceramics residencies in Asia”" className={`${input} pl-9`} />
            </label>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs leading-5 text-muted-foreground">Only publication-ready records with a current trusted source appear here.</p>
              <button type="button" className={secondary} onClick={() => setFiltersOpen((current) => !current)} aria-expanded={filtersOpen} aria-controls="opportunity-refinement-controls">
                <SlidersHorizontal className="size-4" />
                {filtersOpen ? "Hide filters" : "Refine search"}
                <ChevronDown className={`size-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {filtersOpen && (
            <div id="opportunity-refinement-controls" className="space-y-3 border-t border-[#E7E1F7] pt-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <label className="grid gap-1 text-xs font-semibold text-muted-foreground"><span>Discipline</span><select className={input} value={filters.discipline} onChange={(event) => setFilters((current) => ({ ...current, discipline: event.target.value }))}><option value="all">All disciplines</option>{ARTIST_DISCIPLINE_OPTIONS.map((option) => <option key={option.value} value={option.label}>{option.label}</option>)}</select></label>
                <label className="grid gap-1 text-xs font-semibold text-muted-foreground"><span>Opportunity type</span><select className={input} value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}><option value="all">All types</option><option value="grant">Grant</option><option value="residency">Residency</option><option value="fellowship">Fellowship</option><option value="commission">Commission</option><option value="open_call">Open call</option><option value="prize_award">Prize or award</option><option value="professional_development">Professional development</option></select></label>
                <label className="grid gap-1 text-xs font-semibold text-muted-foreground"><span>Participation</span><select className={input} value={filters.format} onChange={(event) => setFilters((current) => ({ ...current, format: event.target.value }))}><option value="all">All formats</option><option value="online">Online</option><option value="in_person">In person</option><option value="hybrid">Hybrid</option><option value="other">Other / confirm source</option></select></label>
                <label className="grid gap-1 text-xs font-semibold text-muted-foreground"><span>Eligible country or region</span><input className={input} value={filters.geography} onChange={(event) => setFilters((current) => ({ ...current, geography: event.target.value }))} placeholder="United States, Europe, worldwide…" /></label>
                <label className="grid gap-1 text-xs font-semibold text-muted-foreground"><span>Deadline</span><select className={input} value={filters.deadlineWindow} onChange={(event) => setFilters((current) => ({ ...current, deadlineWindow: event.target.value }))}><option value="all">Any future deadline</option><option value="30">Next 30 days</option><option value="60">Next 60 days</option><option value="90">Next 90 days</option><option value="180">Next 6 months</option></select></label>
                <label className="grid gap-1 text-xs font-semibold text-muted-foreground"><span>Source</span><select className={input} value={filters.source} onChange={(event) => setFilters((current) => ({ ...current, source: event.target.value }))}><option value="all">All approved sources</option>{(directory?.sources ?? []).map((source) => <option key={source.id} value={source.slug}>{source.name}</option>)}</select></label>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex min-h-10 items-center gap-2 rounded-xl border border-[#E7E1F7] px-3 text-sm"><input type="checkbox" checked={filters.noFeeOnly} onChange={(event) => setFilters((current) => ({ ...current, noFeeOnly: event.target.checked }))} />Confirmed no application fee</label>
                <label className="flex min-h-10 items-center gap-2 rounded-xl border border-[#E7E1F7] px-3 text-sm"><input type="checkbox" checked={filters.requirementsOnly} onChange={(event) => setFilters((current) => ({ ...current, requirementsOnly: event.target.checked }))} />Structured requirements available</label>
                <button type="button" className={secondary} onClick={() => setFilters(defaultFilters)}><RotateCcw className="size-4" />Reset filters</button>
              </div>
            </div>
          )}
        </section>

        {intent.hasStructuredIntent && <section className="px-1" aria-label="Interpreted search terms"><div className="flex flex-wrap items-center gap-2"><p className="mr-1 text-[0.68rem] font-semibold uppercase tracking-wide text-[#625C70]">Search interpreted as</p>{intent.chips.map((chip) => <span key={chip.key} className="rounded-full bg-[#F7F4FF] px-2.5 py-1 text-xs font-semibold text-[#5B4B8A]">{chip.label}</span>)}</div></section>}

        <p className="sr-only" aria-live="polite">{announcement}</p>
        {loading && <p role="status" className="flex items-center gap-2 px-1 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Searching verified opportunity records…</p>}
        {error && <div role="alert" className={`${card} border-red-200 text-sm text-red-700`}>{error}</div>}
        {reportConfirmation && <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><span>{reportConfirmation}</span><button type="button" aria-label="Dismiss confirmation" onClick={() => setReportConfirmation("")}><X className="size-4" /></button></div>}
        {hiddenUndo && <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D8D0F2] bg-[#F7F4FF] p-4 text-sm text-[#4D426C]"><span><strong>{hiddenUndo.item.title}</strong> is hidden from your recommendations.</span><button type="button" className={secondary} disabled={actionId === hiddenUndo.item.id} onClick={() => void undoHide()}><Undo2 className="size-4" />Undo</button></div>}

        {!loading && !error && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{total} verified opportunit{total === 1 ? "y" : "ies"}.</strong>{total > 0 ? ` Showing ${items.length} of ${total}.` : " Broaden one filter or return later as verified coverage expands."}
            </p>
            <p className="text-xs text-muted-foreground">Unverified, expired, rejected, and personally hidden records are excluded.</p>
          </div>
        )}

        <div className="space-y-4">
          {items.map((rawItem) => {
            const item = rawItem as VisualOpportunity
            const evaluation = evaluateOpportunity(item, directory?.passport ?? null, directory?.portfolioWorks ?? [])
            const readiness = assessOpportunityMaterialReadiness(item, directory?.passport ?? null, directory?.portfolioWorks ?? [])
            const isExpanded = expanded === item.id
            const canonicalUrl = safeOpportunityUrl(item.application_url || item.canonical_url)
            const guidelinesUrl = safeOpportunityUrl(item.guidelines_url)
            const hasConfirmedRequirements = item.requirements.some((requirement) => requirement.verification_status === "confirmed")
            const canPrepare = item.status === "open" && hasConfirmedRequirements
            const detailsId = `opportunity-details-${item.id}`
            const trust = trustCopy(item)
            const terms = importantTerms(item)
            const reasons = fitReasons(item, evaluation, directory)
            const stillConfirm = confirmationItems(evaluation)

            return (
              <article key={item.id} className={`${card} overflow-hidden`} aria-labelledby={`opportunity-title-${item.id}`}>
                <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(190px,240px)_minmax(0,1fr)]">
                  <OpportunityPreviewImage opportunity={item} className="self-start" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#A997E8]"><span>{cleanLabel(item.opportunity_type)}</span><span className={`rounded-full px-2 py-0.5 normal-case tracking-normal ${statusTone(item.status)}`}>{statusCopy(item.status)}</span><span>·</span><span>{item.provider_name}</span></div>
                        <button id={`opportunity-title-${item.id}`} type="button" className="mt-1 flex max-w-full items-center gap-2 text-left font-serif text-xl font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" onClick={() => { setExpanded((current) => current === item.id ? null : item.id); void recordOpportunityEvent("view", item.id).catch(() => undefined) }} aria-expanded={isExpanded} aria-controls={detailsId}>{item.title}<ChevronDown className={`size-4 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} /></button>
                        <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Source-based synopsis</p>
                        <p className={`mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground ${isExpanded ? "" : "line-clamp-3"}`}>{item.summary || "A reliable synopsis is not available. Review the official listing before deciding whether to apply."}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${trust.tone}`}><BadgeCheck className="size-3.5" />{trust.label}</span>
                          <span className="text-muted-foreground">{trust.detail}</span>
                          <span className="text-muted-foreground">· Last checked {formatDate(item.last_verified_at)}</span>
                          {verificationDue(item) && <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">Verification due</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className={secondary} disabled={actionId === item.id} onClick={() => void toggleSaved(item)}><Bookmark className={`size-4 ${item.saved ? "fill-current" : ""}`} />{item.saved ? "Saved" : "Save"}</button>
                        <button type="button" className={secondary} disabled={actionId === item.id} onClick={() => void hideOpportunity(item)}><EyeOff className="size-4" />Hide</button>
                        <button type="button" className={secondary} onClick={() => { setReportTarget(item); setReportConfirmation("") }}><Flag className="size-4" />Report</button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                      <div className="rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Funding & support</p><p className="mt-1 break-words text-sm font-semibold">{formatAmount(item)}</p></div>
                      <div className="rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Deadline</p><p className="mt-1 text-sm font-semibold">{formatDeadline(item)}</p></div>
                      <div className="rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Location / format</p><p className="mt-1 break-words text-sm font-semibold">{item.locations.length ? item.locations.join(", ") : item.participation_format === "online" ? "Online" : "Not stated by provider"}</p></div>
                      <div className="rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Application fee</p><p className="mt-1 text-sm font-semibold">{formatFee(item)}</p></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2" aria-label="Artist-specific opportunity analysis"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${eligibilityTone(evaluation.eligibility)}`}>{eligibilityCopy(evaluation.eligibility)}</span><span className="rounded-full bg-[#F7F4FF] px-3 py-1 text-xs font-semibold text-[#5B4B8A]">{relevanceCopy(evaluation.relevance)}</span><span className="rounded-full bg-[#F7F4FF] px-3 py-1 text-xs font-semibold text-[#5B4B8A]">{readinessCopy(readiness)}</span></div>

                {(reasons.length > 0 || stillConfirm.length > 0) && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {reasons.length > 0 && <section className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3"><h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Why this may fit you</h3><ul className="mt-2 space-y-1 text-sm text-emerald-950">{reasons.map((reason) => <li key={reason}>• {reason}</li>)}</ul></section>}
                    {stillConfirm.length > 0 && <section className="rounded-xl border border-amber-100 bg-amber-50/60 p-3"><h3 className="text-xs font-semibold uppercase tracking-wide text-amber-800">Still needs confirmation</h3><ul className="mt-2 space-y-1 text-sm text-amber-950">{stillConfirm.map((reason) => <li key={reason}>• {reason}</li>)}</ul></section>}
                  </div>
                )}

                {terms.length > 0 && (
                  <section className="mt-4 rounded-xl border border-[#E7E1F7] bg-[#FCFBFE] p-3" aria-label="Important terms">
                    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#625C70]"><AlertTriangle className="size-4 text-amber-600" />Important terms</h3>
                    <div className="mt-2 flex flex-wrap gap-2">{terms.map((term) => <span key={term} className="rounded-full border border-[#DDD5EE] bg-white px-2.5 py-1 text-xs font-semibold text-[#5D5668]">{term}</span>)}</div>
                  </section>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {canPrepare ? <Link className={primary} href={`/artist-dashboard/applications/prepare/?opportunity=${encodeURIComponent(item.id)}`} onClick={() => void recordOpportunityEvent("application_prepare", item.id).catch(() => undefined)}>Prepare application<FileText className="size-4" /></Link> : <span className="inline-flex min-h-10 items-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">Structured requirements needed before preparation</span>}
                  {guidelinesUrl && <a className={secondary} href={guidelinesUrl} target="_blank" rel="noreferrer">Official guidelines<ExternalLink className="size-4" /></a>}
                  {!guidelinesUrl && canonicalUrl && <a className={secondary} href={canonicalUrl} target="_blank" rel="noreferrer">Official source<ExternalLink className="size-4" /></a>}
                </div>

                {isExpanded && (
                  <div id={detailsId} className="mt-5 border-t border-[#E7E1F7] pt-5">
                    <div className="grid gap-5 lg:grid-cols-2">
                      <section><h3 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-primary" />Eligibility evidence</h3><div className="mt-3 space-y-2">{evaluation.ruleResults.length ? evaluation.ruleResults.map((result) => <div key={result.rule_id} className="rounded-xl border border-[#E7E1F7] p-3 text-sm"><p className="flex items-center gap-2 font-semibold">{result.status === "passed" ? <CheckCircle2 className="size-4 text-emerald-600" /> : result.status === "failed" ? <XCircle className="size-4 text-red-600" /> : <CircleHelp className="size-4 text-amber-600" />}{result.label}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{result.explanation}</p></div>) : <p className="text-sm text-muted-foreground">The source does not provide enough structured evidence for a formal eligibility decision.</p>}</div></section>
                      <section><h3 className="flex items-center gap-2 text-sm font-semibold"><FileText className="size-4 text-primary" />Application requirements</h3><div className="mt-3 space-y-2">{item.requirements.length ? item.requirements.map((requirement) => <div key={requirement.id} className="rounded-xl border border-[#E7E1F7] p-3"><p className="text-sm font-semibold">{requirement.label}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{requirement.required ? "Required" : "Optional"} · {requirement.verification_status === "confirmed" ? "Source confirmed" : "Needs verification"}</p></div>) : <p className="text-sm text-muted-foreground">No structured application requirements are available. KLEIO will not calculate readiness or prepare a package for this listing.</p>}</div></section>
                    </div>
                    {item.logistics_notes?.trim() && <section className="mt-5 rounded-xl border border-amber-100 bg-amber-50/50 p-4"><h3 className="text-sm font-semibold">Logistics and participation notes</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{item.logistics_notes}</p></section>}
                    <section className="mt-5 rounded-xl border border-[#E7E1F7] p-4"><h3 className="text-sm font-semibold">Full source description</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{item.description || "The source did not provide a reusable full description. Continue to the official listing."}</p></section>
                  </div>
                )}
              </article>
            )
          })}
        </div>

        {!loading && !error && items.length < total && (
          <div className="flex flex-col items-center gap-2 py-2">
            <button type="button" className={`${primary} min-w-56`} onClick={() => void loadMore()} disabled={loadingMore}>{loadingMore ? <Loader2 className="size-4 animate-spin" /> : null}{loadingMore ? "Loading more…" : "Load more opportunities"}</button>
            <p className="text-xs text-muted-foreground">Showing {items.length} of {total} verified opportunities.</p>
          </div>
        )}

        {!loading && !error && total > 0 && items.length >= total && <p className="py-3 text-center text-xs font-semibold text-muted-foreground">You have reached the end of the verified directory.</p>}
      </div>

      {reportTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#211B2E]/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReportTarget(null) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="report-opportunity-title" className="w-full max-w-lg rounded-[24px] border border-[#E7E1F7] bg-white p-5 shadow-[0_28px_90px_rgba(35,26,54,0.24)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#75639E]">Artist feedback</p><h2 id="report-opportunity-title" className="mt-1 font-serif text-2xl font-semibold">Report a problem</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Your report is private and sends <strong>{reportTarget.title}</strong> to KLEIO’s internal review queue.</p></div>
              <button type="button" className="grid size-10 shrink-0 place-items-center rounded-full border border-[#E7E1F7] hover:bg-[#F7F4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A997E8]" aria-label="Close report dialog" onClick={() => setReportTarget(null)}><X className="size-4" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <label className="grid gap-1.5 text-sm font-semibold text-[#4F4858]">What is wrong?<select ref={reportReasonRef} className={input} value={reportReason} onChange={(event) => setReportReason(event.target.value as OpportunityReportReason)}>{REPORT_REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="grid gap-1.5 text-sm font-semibold text-[#4F4858]">Additional context <span className="font-normal text-muted-foreground">(optional)</span><textarea className="min-h-28 rounded-xl border border-[#E7E1F7] bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10" maxLength={2000} value={reportNotes} onChange={(event) => setReportNotes(event.target.value)} placeholder="Share the page, term, or discrepancy KLEIO should check." /></label>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" className={secondary} onClick={() => setReportTarget(null)}>Cancel</button><button type="button" className={primary} disabled={reporting} onClick={() => void submitReport()}>{reporting ? <Loader2 className="size-4 animate-spin" /> : <Flag className="size-4" />}{reporting ? "Sending…" : "Send to review"}</button></div>
          </section>
        </div>
      )}
    </main>
  )
}
