"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Bookmark,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  FileText,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  XCircle,
} from "lucide-react"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { ExpandableInfo, InlineHelper, TrustIndicator } from "@/components/kleio/guidance-system"
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
  type OpportunityDirectoryDataWithSources,
} from "@/lib/kleio-opportunity-presentation"
import { parseOpportunitySearchIntent } from "@/lib/kleio-opportunity-search-intent"
import {
  loadPersistentOpportunityDirectory,
  type PersistentOpportunityFilters,
} from "@/lib/kleio-persistent-opportunity-directory"
import type { OpportunityImageMetadata } from "@/lib/kleio-opportunity-images"

const STORAGE_KEY = "kleio_opportunity_filters_v1"
const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]"
const input = "h-10 w-full rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
const primary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] disabled:cursor-not-allowed disabled:opacity-50"

type VisualOpportunity = OpportunityDirectoryItem & OpportunityImageMetadata & {
  funding_display_text?: string
  funding_source_url?: string
  funding_source_note?: string
  funding_verified_at?: string | null
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

function formatDate(value: string | null, fallback = "Not stated by source") {
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
  if (item.award_min === null && item.award_max === null) return "Not stated by source"
  const currency = item.currency || "Currency not stated"
  const format = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)
  if (item.award_min !== null && item.award_max !== null && item.award_min !== item.award_max) return `${currency} ${format(item.award_min)}–${format(item.award_max)}`
  return `${currency} ${format(item.award_max ?? item.award_min ?? 0)}`
}

function formatFee(item: OpportunityDirectoryItem) {
  if (item.application_fee === null) return "Not stated by source"
  if (item.application_fee === 0) return "No application fee"
  const currency = item.currency ? `${item.currency} ` : ""
  return `${currency}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(item.application_fee)}`
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

function sourceCopy(item: OpportunityDirectoryItem) {
  const sourceName = item.source?.name || "Attributed source"
  if (item.source?.slug === "kleio-institution") return `Published by a KLEIO institution · ${sourceName}`
  if (item.source?.source_type === "provider_submission") return `Provider submitted · ${sourceName}`
  if (item.source?.source_type === "admin_import") return `KLEIO reviewed · ${sourceName}`
  if (item.verification_status === "official_source" || item.source?.source_type === "official_api" || item.source?.source_type === "manual_curation") return `Official source · ${sourceName}`
  return sourceName
}

function deadlineTo(windowValue: string) {
  const days = Number(windowValue)
  if (!Number.isFinite(days) || days <= 0) return null
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  date.setUTCHours(23, 59, 59, 999)
  return date.toISOString()
}

function toDirectoryFilters(filters: FilterState): PersistentOpportunityFilters {
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
    limit: 100,
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
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [directory, setDirectory] = useState<OpportunityDirectoryDataWithSources | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionId, setActionId] = useState("")
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
      void loadPersistentOpportunityDirectory(toDirectoryFilters(filters))
        .then((result) => {
          if (requestId !== requestIdRef.current) return
          setDirectory(result)
          void recordOpportunityEvent(result.items.length ? "search" : "zero_results", null, filters.query, {
            search_mode: "persistent_database_filters",
            opportunity_type: filters.type,
            source: filters.source,
            participation_format: filters.format,
            discipline: filters.discipline,
            geography: filters.geography,
            deadline_window: filters.deadlineWindow,
            no_fee_only: filters.noFeeOnly,
            structured_requirements_only: filters.requirementsOnly,
            result_count: result.items.length,
          }).catch(() => undefined)
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

  const items = directory?.items ?? []

  return (
    <main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader eyebrow="Artist workspace" title="Opportunities" description="Search worldwide sourced opportunity records. Refine only when needed; KLEIO shows readiness only when application requirements are structured." />

        <section className={`${card} space-y-4`} aria-label="Opportunity filters">
          <div>
            <label className="relative block">
              <span className="sr-only">Search sourced opportunities</span>
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <input type="search" value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Try “ceramics residencies in Asia”" className={`${input} pl-9`} />
            </label>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs leading-relaxed text-muted-foreground">Search naturally. KLEIO never invents a listing to satisfy a query.</p>
              <button type="button" className={secondary} onClick={() => setFiltersOpen((current) => !current)} aria-expanded={filtersOpen} aria-controls="opportunity-refinement-controls">
                <SlidersHorizontal className="size-4" />
                {filtersOpen ? "Hide filters" : "Refine search"}
                <ChevronDown className={`size-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {filtersOpen && <div id="opportunity-refinement-controls" className="space-y-3 border-t border-[#E7E1F7] pt-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground"><span>Discipline</span><select className={input} value={filters.discipline} onChange={(event) => setFilters((current) => ({ ...current, discipline: event.target.value }))}><option value="all">All disciplines</option>{ARTIST_DISCIPLINE_OPTIONS.map((option) => <option key={option.value} value={option.label}>{option.label}</option>)}</select></label>
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground"><span>Opportunity type</span><select className={input} value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}><option value="all">All types</option><option value="grant">Grant</option><option value="residency">Residency</option><option value="fellowship">Fellowship</option><option value="commission">Commission</option><option value="open_call">Open call</option><option value="prize_award">Prize or award</option><option value="professional_development">Professional development</option></select></label>
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground"><span>Participation</span><select className={input} value={filters.format} onChange={(event) => setFilters((current) => ({ ...current, format: event.target.value }))}><option value="all">All formats</option><option value="online">Online</option><option value="in_person">In person</option><option value="hybrid">Hybrid</option><option value="other">Other / confirm source</option></select></label>
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground"><span>Eligible country or region</span><input className={input} value={filters.geography} onChange={(event) => setFilters((current) => ({ ...current, geography: event.target.value }))} placeholder="United States, Europe, worldwide…" /></label>
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground"><span>Deadline</span><select className={input} value={filters.deadlineWindow} onChange={(event) => setFilters((current) => ({ ...current, deadlineWindow: event.target.value }))}><option value="all">Any future deadline</option><option value="30">Next 30 days</option><option value="60">Next 60 days</option><option value="90">Next 90 days</option><option value="180">Next 6 months</option></select></label>
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground"><span>Source</span><select className={input} value={filters.source} onChange={(event) => setFilters((current) => ({ ...current, source: event.target.value }))}><option value="all">All approved sources</option>{(directory?.sources ?? []).map((source) => <option key={source.id} value={source.slug}>{source.name}</option>)}</select></label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex h-10 items-center gap-2 rounded-xl border border-[#E7E1F7] px-3 text-sm"><input type="checkbox" checked={filters.noFeeOnly} onChange={(event) => setFilters((current) => ({ ...current, noFeeOnly: event.target.checked }))} />Confirmed no application fee</label>
              <label className="flex h-10 items-center gap-2 rounded-xl border border-[#E7E1F7] px-3 text-sm"><input type="checkbox" checked={filters.requirementsOnly} onChange={(event) => setFilters((current) => ({ ...current, requirementsOnly: event.target.checked }))} />Structured requirements available</label>
              <button type="button" className={secondary} onClick={() => setFilters(defaultFilters)}><RotateCcw className="size-4" />Reset filters</button>
            </div>
          </div>}
        </section>

        {intent.hasStructuredIntent && <section className="px-1" aria-label="Interpreted search terms"><div className="flex flex-wrap items-center gap-2"><p className="mr-1 text-[0.68rem] font-semibold uppercase tracking-wide text-[#625C70]">KLEIO understood</p>{intent.chips.map((chip) => <span key={chip.key} className="rounded-full bg-[#F7F4FF] px-2.5 py-1 text-xs font-semibold text-[#5B4B8A]">{chip.label}</span>)}</div><InlineHelper className="mt-2">These chips explain the natural-language search. Open Refine search only when you need narrower database controls.</InlineHelper></section>}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1" aria-label="Opportunity trust indicators"><TrustIndicator>Worldwide sourced search</TrustIndicator><TrustIndicator>Visual-first when equally relevant</TrustIndicator><TrustIndicator>Artist review before submission</TrustIndicator></div>

        <ExpandableInfo label="How KLEIO works here" summary="search, readiness, visuals, and submission boundaries" className="px-1"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><section><p className="font-semibold text-[#292631]">Sourced discovery</p><p className="mt-1">Only approved records are searched. Unknown fee, funding, deadline, or eligibility details remain unknown.</p></section><section><p className="font-semibold text-[#292631]">Visual priority</p><p className="mt-1">When results are equally relevant, verified official visuals appear first. Missing visuals use a KLEIO fallback until rights-safe imagery is confirmed.</p></section><section><p className="font-semibold text-[#292631]">Readiness</p><p className="mt-1">A percentage appears only when source requirements are structured and can be compared with actual Passport materials.</p></section><section><p className="font-semibold text-[#292631]">Submission</p><p className="mt-1">Preparing or exporting a package is not submission. Native submission requires explicit artist approval and database validation.</p></section></div></ExpandableInfo>

        {loading && <p className="flex items-center gap-2 px-1 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Searching sourced opportunity records…</p>}
        {error && <div role="alert" className={`${card} border-red-200 text-sm text-red-700`}>{error}</div>}
        {!loading && !error && <p aria-live="polite" className="px-1 text-sm text-muted-foreground"><strong className="text-foreground">{items.length} verified result{items.length === 1 ? "" : "s"}.</strong>{items.length === 0 ? " No exact database match is currently available. Broaden one filter or review the official source directory later." : " Search refinements remain saved on this device."}</p>}

        <div className="space-y-4">
          {items.map((rawItem) => {
            const item = rawItem as VisualOpportunity
            const evaluation = evaluateOpportunity(item, directory?.passport ?? null, directory?.portfolioWorks ?? [])
            const readiness = assessOpportunityMaterialReadiness(item, directory?.passport ?? null, directory?.portfolioWorks ?? [])
            const isExpanded = expanded === item.id
            const canonicalUrl = safeOpportunityUrl(item.canonical_url)
            const guidelinesUrl = safeOpportunityUrl(item.guidelines_url)
            const hasConfirmedRequirements = item.requirements.some((requirement) => requirement.verification_status === "confirmed")
            const canPrepare = item.status === "open" && hasConfirmedRequirements
            const detailsId = `opportunity-details-${item.id}`

            return <article key={item.id} className={`${card} overflow-hidden`} aria-labelledby={`opportunity-title-${item.id}`}>
              <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(190px,240px)_minmax(0,1fr)]">
                <OpportunityPreviewImage opportunity={item} className="self-start" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#A997E8]"><span>{cleanLabel(item.opportunity_type)}</span><span className={`rounded-full px-2 py-0.5 normal-case tracking-normal ${statusTone(item.status)}`}>{statusCopy(item.status)}</span><span>·</span><span>{item.provider_name}</span></div>
                      <button id={`opportunity-title-${item.id}`} type="button" className="mt-1 flex max-w-full items-center gap-2 text-left font-serif text-xl font-semibold hover:text-primary" onClick={() => { setExpanded((current) => current === item.id ? null : item.id); void recordOpportunityEvent("view", item.id).catch(() => undefined) }} aria-expanded={isExpanded} aria-controls={detailsId}>{item.title}<ChevronDown className={`size-4 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} /></button>
                      <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Source-based synopsis</p>
                      <p className={`mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground ${isExpanded ? "" : "line-clamp-3"}`}>{item.summary || "A reliable synopsis is not available. Review the official listing before deciding whether to apply."}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{sourceCopy(item)}</p>
                    </div>
                    <button type="button" className={secondary} disabled={actionId === item.id} onClick={() => void toggleSaved(item)}><Bookmark className={`size-4 ${item.saved ? "fill-current" : ""}`} />{item.saved ? "Saved" : "Save"}</button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                    <div className="rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Funding</p><p className="mt-1 break-words text-sm font-semibold">{formatAmount(item)}</p></div>
                    <div className="rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Deadline</p><p className="mt-1 text-sm font-semibold">{formatDeadline(item)}</p></div>
                    <div className="rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Location / format</p><p className="mt-1 break-words text-sm font-semibold">{item.locations.length ? item.locations.join(", ") : item.participation_format === "online" ? "Online" : "Not stated by source"}</p></div>
                    <div className="rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Application fee</p><p className="mt-1 text-sm font-semibold">{formatFee(item)}</p></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2" aria-label="Artist-specific opportunity analysis"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${eligibilityTone(evaluation.eligibility)}`}>{eligibilityCopy(evaluation.eligibility)}</span><span className="rounded-full bg-[#F7F4FF] px-3 py-1 text-xs font-semibold text-[#5B4B8A]">{relevanceCopy(evaluation.relevance)}</span><span className="rounded-full bg-[#F7F4FF] px-3 py-1 text-xs font-semibold text-[#5B4B8A]">{readinessCopy(readiness)}</span></div>

              <div className="mt-4 flex flex-wrap gap-2">
                {canPrepare ? <Link className={primary} href={`/artist-dashboard/applications/prepare/?opportunity=${encodeURIComponent(item.id)}`} onClick={() => void recordOpportunityEvent("application_prepare", item.id).catch(() => undefined)}>Prepare application<FileText className="size-4" /></Link> : <span className="inline-flex min-h-10 items-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-900">Structured requirements needed before preparation</span>}
                {guidelinesUrl && <a className={secondary} href={guidelinesUrl} target="_blank" rel="noreferrer">Official guidelines<ExternalLink className="size-4" /></a>}
                {!guidelinesUrl && canonicalUrl && <a className={secondary} href={canonicalUrl} target="_blank" rel="noreferrer">Official source<ExternalLink className="size-4" /></a>}
              </div>

              {isExpanded && <div id={detailsId} className="mt-5 border-t border-[#E7E1F7] pt-5"><div className="grid gap-5 lg:grid-cols-2"><section><h3 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-primary" />Eligibility evidence</h3><div className="mt-3 space-y-2">{evaluation.ruleResults.length ? evaluation.ruleResults.map((result) => <div key={result.rule_id} className="rounded-xl border border-[#E7E1F7] p-3 text-sm"><p className="flex items-center gap-2 font-semibold">{result.status === "passed" ? <CheckCircle2 className="size-4 text-emerald-600" /> : result.status === "failed" ? <XCircle className="size-4 text-red-600" /> : <CircleHelp className="size-4 text-amber-600" />}{result.label}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{result.explanation}</p></div>) : <p className="text-sm text-muted-foreground">The source does not provide enough structured evidence for a formal eligibility decision.</p>}</div></section><section><h3 className="flex items-center gap-2 text-sm font-semibold"><FileText className="size-4 text-primary" />Application requirements</h3><div className="mt-3 space-y-2">{item.requirements.length ? item.requirements.map((requirement) => <div key={requirement.id} className="rounded-xl border border-[#E7E1F7] p-3"><p className="text-sm font-semibold">{requirement.label}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{requirement.required ? "Required" : "Optional"} · {requirement.verification_status === "confirmed" ? "Source confirmed" : "Needs verification"}</p></div>) : <p className="text-sm text-muted-foreground">No structured application requirements are available. KLEIO will not calculate readiness or prepare a package for this listing.</p>}</div></section></div><section className="mt-5 rounded-xl border border-[#E7E1F7] p-4"><h3 className="text-sm font-semibold">Full source description</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{item.description || "The source did not provide a reusable full description. Continue to the official listing."}</p></section></div>}
            </article>
          })}
        </div>
      </div>
    </main>
  )
}
