"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ChevronDown,
  ExternalLink,
  FileText,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
} from "lucide-react"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { ARTIST_DISCIPLINE_OPTIONS } from "@/lib/kleio-artist-taxonomy"
import type { OpportunityDirectoryItem } from "@/lib/kleio-opportunity-data"
import { safeOpportunityUrl, type OpportunityDirectoryDataWithSources } from "@/lib/kleio-opportunity-presentation"
import { parseOpportunitySearchIntent } from "@/lib/kleio-opportunity-search-intent"
import { loadPublicOpportunityDirectory } from "@/lib/kleio-public-opportunity-directory"

const STORAGE_KEY = "kleio_public_opportunity_filters_v1"
const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]"
const input = "h-10 w-full rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
const primary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A]"

type FilterState = {
  query: string
  type: string
  discipline: string
  geography: string
  noFeeOnly: boolean
}

const defaultFilters: FilterState = {
  query: "",
  type: "all",
  discipline: "all",
  geography: "",
  noFeeOnly: false,
}

function cleanLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value: string | null, fallback: string) {
  if (!value) return fallback
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return fallback
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(parsed)
}

function formatAmount(item: OpportunityDirectoryItem) {
  if (item.award_min === null && item.award_max === null) return "Not stated by source"
  const currency = item.currency || "Currency not stated"
  const format = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)
  if (item.award_min !== null && item.award_max !== null && item.award_min !== item.award_max) {
    return `${currency} ${format(item.award_min)}–${format(item.award_max)}`
  }
  return `${currency} ${format(item.award_max ?? item.award_min ?? 0)}`
}

function formatFee(item: OpportunityDirectoryItem) {
  if (item.application_fee === null) return "Not stated by source"
  if (item.application_fee === 0) return "No application fee"
  const currency = item.currency ? `${item.currency} ` : ""
  return `${currency}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(item.application_fee)}`
}

function restoreFilters(value: unknown): FilterState {
  if (!value || typeof value !== "object") return defaultFilters
  const record = value as Record<string, unknown>
  return {
    query: typeof record.query === "string" ? record.query : "",
    type: typeof record.type === "string" ? record.type : "all",
    discipline: typeof record.discipline === "string" ? record.discipline : "all",
    geography: typeof record.geography === "string" ? record.geography : "",
    noFeeOnly: record.noFeeOnly === true,
  }
}

export function PublicOpportunityDirectory() {
  const requestIdRef = useRef(0)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [directory, setDirectory] = useState<OpportunityDirectoryDataWithSources | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const intent = useMemo(() => parseOpportunitySearchIntent(filters.query), [filters.query])
  const signupHref = `/signup/artist/?returnTo=${encodeURIComponent("/artist-dashboard/opportunities/")}`

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
      void loadPublicOpportunityDirectory({
        query: filters.query,
        opportunityTypes: filters.type === "all" ? undefined : [filters.type],
        disciplines: filters.discipline === "all" ? undefined : [filters.discipline],
        eligibleCountry: filters.geography,
        noFeeOnly: filters.noFeeOnly,
        limit: 100,
      })
        .then((result) => {
          if (requestId === requestIdRef.current) setDirectory(result)
        })
        .catch((reason) => {
          if (requestId === requestIdRef.current) setError(reason instanceof Error ? reason.message : "KLEIO could not search the public opportunity directory.")
        })
        .finally(() => {
          if (requestId === requestIdRef.current) setLoading(false)
        })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [filters, hydrated])

  const items = directory?.items ?? []

  return (
    <main className="min-h-dvh bg-[#FAFAFA] text-[#292631]">
      <header className="border-b border-[#E7E1F7] bg-white/95">
        <div className="mx-auto flex min-h-16 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
          <KleioWordmarkLink href="/" />
          <nav className="flex items-center gap-2" aria-label="Public opportunity actions">
            <Link href="/#login" className={secondary}>Sign in</Link>
            <Link href={signupHref} className={primary}>Create free Passport<UserPlus className="size-4" /></Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] space-y-5 px-4 py-7 sm:px-6 sm:py-9">
        <section className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7F6EB4]">Public opportunity discovery</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Browse before you create an account.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#746E80]">Search sourced artist opportunities and review the organizer’s available details. Create a free Creative Passport only when you want personalized fit, readiness, saving, or application preparation.</p>
        </section>

        <section className={`${card} space-y-4`} aria-label="Opportunity filters">
          <label className="relative block">
            <span className="sr-only">Search sourced opportunities</span>
            <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
            <input type="search" value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Try “ceramics residencies in Asia”" className={`${input} pl-9`} />
          </label>
          <div className="flex justify-end">
            <button type="button" className={secondary} onClick={() => setFiltersOpen((current) => !current)} aria-expanded={filtersOpen} aria-controls="public-opportunity-filters">
              <SlidersHorizontal className="size-4" />{filtersOpen ? "Hide filters" : "Refine search"}<ChevronDown className={`size-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
          {filtersOpen && <div id="public-opportunity-filters" className="grid gap-3 border-t border-[#E7E1F7] pt-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-1 text-xs font-semibold text-muted-foreground"><span>Discipline</span><select className={input} value={filters.discipline} onChange={(event) => setFilters((current) => ({ ...current, discipline: event.target.value }))}><option value="all">All disciplines</option>{ARTIST_DISCIPLINE_OPTIONS.map((option) => <option key={option.value} value={option.label}>{option.label}</option>)}</select></label>
            <label className="grid gap-1 text-xs font-semibold text-muted-foreground"><span>Opportunity type</span><select className={input} value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}><option value="all">All types</option><option value="grant">Grant</option><option value="residency">Residency</option><option value="fellowship">Fellowship</option><option value="commission">Commission</option><option value="open_call">Open call</option><option value="prize_award">Prize or award</option><option value="professional_development">Professional development</option></select></label>
            <label className="grid gap-1 text-xs font-semibold text-muted-foreground"><span>Eligible country or region</span><input className={input} value={filters.geography} onChange={(event) => setFilters((current) => ({ ...current, geography: event.target.value }))} placeholder="United States, Europe, worldwide…" /></label>
            <div className="flex items-end gap-2"><label className="flex min-h-10 flex-1 items-center gap-2 rounded-xl border border-[#E7E1F7] px-3 text-sm"><input type="checkbox" checked={filters.noFeeOnly} onChange={(event) => setFilters((current) => ({ ...current, noFeeOnly: event.target.checked }))} />No application fee</label><button type="button" className={secondary} onClick={() => setFilters(defaultFilters)} aria-label="Reset filters"><RotateCcw className="size-4" /></button></div>
          </div>}
        </section>

        {intent.hasStructuredIntent && <section className="px-1" aria-label="Interpreted search terms"><div className="flex flex-wrap items-center gap-2"><p className="mr-1 text-[0.68rem] font-semibold uppercase tracking-wide text-[#625C70]">Search interpreted as</p>{intent.chips.map((chip) => <span key={chip.key} className="rounded-full bg-[#F7F4FF] px-2.5 py-1 text-xs font-semibold text-[#5B4B8A]">{chip.label}</span>)}</div></section>}
        {loading && <p className="flex items-center gap-2 px-1 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Searching sourced opportunity records…</p>}
        {error && <div role="alert" className={`${card} border-red-200 text-sm text-red-700`}>{error}</div>}
        {!loading && !error && <p aria-live="polite" className="px-1 text-sm text-muted-foreground"><strong className="text-foreground">{items.length} verified result{items.length === 1 ? "" : "s"}.</strong>{items.length === 0 ? " Broaden one filter or return later as verified coverage expands." : ""}</p>}

        <div className="space-y-4">
          {items.map((item) => {
            const isExpanded = expanded === item.id
            const sourceUrl = safeOpportunityUrl(item.guidelines_url) || safeOpportunityUrl(item.canonical_url)
            return <article key={item.id} className={card} aria-labelledby={`public-opportunity-${item.id}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8E79C5]">{cleanLabel(item.opportunity_type)} · {item.provider_name}</p>
                  <button id={`public-opportunity-${item.id}`} type="button" className="mt-1 flex max-w-full items-center gap-2 text-left font-serif text-xl font-semibold hover:text-primary" onClick={() => setExpanded((current) => current === item.id ? null : item.id)} aria-expanded={isExpanded}>{item.title}<ChevronDown className={`size-4 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} /></button>
                  <p className={`mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground ${isExpanded ? "" : "line-clamp-3"}`}>{item.summary || "A reliable synopsis is not available. Review the official listing before deciding whether to apply."}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.source?.name ? `Source: ${item.source.name}` : "Attributed source"} · Last checked {formatDate(item.last_verified_at, "date not stated")}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Funding</p><p className="mt-1 text-sm font-semibold">{formatAmount(item)}</p></div>
                <div className="rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Deadline</p><p className="mt-1 text-sm font-semibold">{formatDate(item.deadline_at, item.recurring ? "Rolling / confirm timing" : "Not stated by source")}</p></div>
                <div className="rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Location / format</p><p className="mt-1 text-sm font-semibold">{item.locations.length ? item.locations.join(", ") : cleanLabel(item.participation_format || "not stated")}</p></div>
                <div className="rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Application fee</p><p className="mt-1 text-sm font-semibold">{formatFee(item)}</p></div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={signupHref} className={primary}>Check your fit<UserPlus className="size-4" /></Link>
                <Link href={signupHref} className={secondary}>Save and prepare<FileText className="size-4" /></Link>
                {sourceUrl && <a href={sourceUrl} target="_blank" rel="noreferrer" className={secondary}>Official source<ExternalLink className="size-4" /></a>}
              </div>

              {isExpanded && <div className="mt-5 grid gap-5 border-t border-[#E7E1F7] pt-5 lg:grid-cols-2">
                <section><h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-primary" />Eligibility from the source</h2><div className="mt-3 space-y-2">{item.rules.length ? item.rules.map((rule) => <div key={rule.id} className="rounded-xl border border-[#E7E1F7] p-3"><p className="text-sm font-semibold">{cleanLabel(rule.rule_type)}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{rule.source_text || "Review the official source for the complete eligibility language."}</p></div>) : <p className="text-sm text-muted-foreground">The source does not provide enough structured evidence for a formal eligibility summary.</p>}</div></section>
                <section><h2 className="flex items-center gap-2 text-sm font-semibold"><FileText className="size-4 text-primary" />Application requirements</h2><div className="mt-3 space-y-2">{item.requirements.length ? item.requirements.map((requirement) => <div key={requirement.id} className="rounded-xl border border-[#E7E1F7] p-3"><p className="text-sm font-semibold">{requirement.label}</p><p className="mt-1 text-xs text-muted-foreground">{requirement.required ? "Required" : "Optional"} · {requirement.verification_status === "confirmed" ? "Source confirmed" : "Needs confirmation"}</p></div>) : <p className="text-sm text-muted-foreground">No structured application requirements are available. Continue to the official listing for complete instructions.</p>}</div></section>
                <section className="lg:col-span-2"><h2 className="text-sm font-semibold">Source-based description</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{item.description || item.summary || "The source did not provide a reusable full description."}</p></section>
              </div>}
            </article>
          })}
        </div>
      </div>
    </main>
  )
}
