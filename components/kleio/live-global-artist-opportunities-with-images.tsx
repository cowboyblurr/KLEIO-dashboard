"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bookmark,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  FileText,
  Loader2,
  MessageCircle,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { OpportunityPreviewImage } from "@/components/kleio/opportunity-preview-image"
import {
  evaluateOpportunity,
  getOrCreateOpportunityConversation,
  recordOpportunityEvent,
  setGlobalOpportunitySaved,
  type OpportunityDirectoryFilters,
  type OpportunityDirectoryItem,
  type OpportunityEvaluation,
} from "@/lib/kleio-opportunity-data"
import {
  assessOpportunityMaterialReadiness,
  loadOpportunityDirectoryWithSources,
  safeOpportunityUrl,
  type OpportunityDirectoryDataWithSources,
} from "@/lib/kleio-opportunity-presentation"
import {
  buildOpportunityIntentSearchPlan,
  classifyOpportunityAgainstIntent,
  parseOpportunitySearchIntent,
  type OpportunityIntentMatch,
  type OpportunitySearchIntent,
} from "@/lib/kleio-opportunity-search-intent"
import type { OpportunityImageMetadata } from "@/lib/kleio-opportunity-images"

const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]"
const input = "h-10 w-full rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm outline-none focus:border-primary/40"
const primary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
const secondary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] disabled:opacity-50"

type VisualOpportunity = OpportunityDirectoryItem & OpportunityImageMetadata & {
  funding_display_text?: string
  funding_amount_type?: string
  funding_source_url?: string
  funding_source_note?: string
  funding_verified_at?: string | null
}

type ResultMode = "browse" | "exact" | "partial" | "none"

function LiveShell({ children }: { children: React.ReactNode }) {
  return <main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6"><div className="mx-auto max-w-[1180px] space-y-5"><WorkspacePageHeader eyebrow="Artist workspace" title="Opportunities" description="Search sourced artist opportunities by medium, location, type, or format." />{children}</div></main>
}

function StateNotice({ loading, error }: { loading: boolean; error: string }) {
  if (loading) return <p className="flex items-center gap-2 px-1 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Searching sourced opportunity records…</p>
  if (error) return <div role="alert" className={`${card} border-red-200 text-sm text-red-700`}>{error}</div>
  return null
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

function sourceCopy(item: OpportunityDirectoryItem) {
  const sourceName = item.source?.name || "Attributed source"
  if (item.source?.slug === "kleio-institution") return `Published by KLEIO institution · ${sourceName}`
  if (item.source?.source_type === "provider_submission") return item.verification_status === "provider_verified" ? `Provider verified · ${sourceName}` : `Provider submitted · KLEIO reviewed · ${sourceName}`
  if (item.source?.source_type === "admin_import") return `KLEIO reviewed · ${sourceName}`
  if (item.verification_status === "official_source" || item.source?.source_type === "official_api" || item.source?.source_type === "manual_curation") return `Official source · ${sourceName}`
  return sourceName
}

function statusCopy(status: OpportunityDirectoryItem["status"]) {
  if (status === "forecasted") return "Forecasted"
  if (status === "upcoming") return "Upcoming"
  return "Open"
}

function statusTone(status: OpportunityDirectoryItem["status"]) {
  return status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
}

function locationCopy(item: OpportunityDirectoryItem) {
  if (item.locations.length) return item.locations.join(", ")
  if (item.participation_format === "online" || item.remote_allowed === true) return "Online / remote"
  return "Not stated by source"
}

function locationAndFormatCopy(item: OpportunityDirectoryItem) {
  const location = locationCopy(item)
  return item.participation_format === "other" ? location : `${location} · ${cleanLabel(item.participation_format)}`
}

function readinessCopy(readiness: ReturnType<typeof assessOpportunityMaterialReadiness>) {
  if (readiness.unknown || readiness.score === null) return "Application materials not structured"
  if (readiness.blockingCount) return `${readiness.score}% ready · ${readiness.blockingCount} blocking`
  if (readiness.manualReview.length) return `${readiness.score}% ready · ${readiness.manualReview.length} to confirm`
  return `${readiness.score}% of required materials ready`
}

function imageRightsCopy(item: VisualOpportunity) {
  if (item.preview_image_origin === "kleio_fallback") return "KLEIO category cover"
  if (item.preview_image_rights_status === "provider_owned") return "Provider-owned image"
  if (item.preview_image_rights_status === "official_publication") return "Official publication image"
  if (item.preview_image_rights_status === "public_domain") return "Public-domain image"
  if (item.preview_image_rights_status === "licensed") return "Licensed image"
  if (item.preview_image_rights_status === "permission_confirmed") return "Permission confirmed"
  return "Image rights not independently confirmed"
}

function withManualFilters(
  inferred: OpportunityDirectoryFilters,
  manual: { type: string; source: string; format: string; noFeeOnly: boolean },
): OpportunityDirectoryFilters {
  return {
    ...inferred,
    opportunityTypes: manual.type === "all" ? inferred.opportunityTypes : [manual.type],
    sourceSlugs: manual.source === "all" ? undefined : [manual.source],
    participationFormats: manual.format === "all" ? inferred.participationFormats : [manual.format],
    noFeeOnly: manual.noFeeOnly || Boolean(inferred.noFeeOnly),
  }
}

function broaderQuery(intent: OpportunitySearchIntent, omit: "location" | "discipline") {
  const terms = [
    ...(omit === "discipline" ? [] : intent.disciplines),
    ...(omit === "location" ? [] : intent.locations),
    ...intent.opportunityTypes.map(cleanLabel),
    ...intent.freeTextTerms,
  ]
  return [...new Set(terms)].join(" ")
}

function ResultSummary({ mode, intent, count }: { mode: ResultMode; intent: OpportunitySearchIntent; count: number }) {
  if (!intent.rawQuery.trim()) return null
  if (mode === "exact") return <p aria-live="polite" className="px-1 text-sm text-muted-foreground"><strong className="text-foreground">{count} verified result{count === 1 ? "" : "s"}.</strong></p>
  if (mode === "partial") return <div aria-live="polite" className="border-l-2 border-amber-200 pl-3 text-sm leading-relaxed text-amber-900"><strong>No exact verified match is currently available.</strong> Broader sourced results are labeled with the part of your request they do not match.</div>
  if (mode === "none") return <div aria-live="polite" className="border-l-2 border-[#D8D0F2] pl-3 text-sm leading-relaxed text-[#625C70]"><strong className="text-[#292631]">Your request was understood, but KLEIO found no verified matching record.</strong><p className="mt-1">No opportunity was created or inferred from your wording. Broaden one part of the search or return as verified coverage expands.</p></div>
  return null
}
export function LiveGlobalArtistOpportunitiesWithImages() {
  const router = useRouter()
  const requestIdRef = useRef(0)
  const [directory, setDirectory] = useState<OpportunityDirectoryDataWithSources | null>(null)
  const [query, setQuery] = useState("")
  const [type, setType] = useState("all")
  const [source, setSource] = useState("all")
  const [format, setFormat] = useState("all")
  const [noFeeOnly, setNoFeeOnly] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionId, setActionId] = useState("")
  const [resultMode, setResultMode] = useState<ResultMode>("browse")
  const [intentMatches, setIntentMatches] = useState<Record<string, OpportunityIntentMatch>>({})
  const intent = useMemo(() => parseOpportunitySearchIntent(query), [query])

  async function refresh() {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError("")
    const manual = { type, source, format, noFeeOnly }
    const plan = buildOpportunityIntentSearchPlan(intent)

    try {
      const exactDirectory = await loadOpportunityDirectoryWithSources(withManualFilters(plan.exact, manual))
      if (requestId !== requestIdRef.current) return

      if (!intent.hasStructuredIntent) {
        setDirectory(exactDirectory)
        setIntentMatches({})
        setResultMode(query.trim() ? "exact" : "browse")
        await recordOpportunityEvent(exactDirectory.items.length ? "search" : "zero_results", null, query, { search_mode: "keyword", opportunity_type: type, source, participation_format: format, no_fee_only: noFeeOnly }).catch(() => undefined)
        return
      }

      const candidateMatches = new Map<string, { item: OpportunityDirectoryDataWithSources["items"][number]; match: OpportunityIntentMatch }>()
      for (const item of exactDirectory.items) {
        const match = classifyOpportunityAgainstIntent(item as VisualOpportunity, intent)
        candidateMatches.set(item.id, { item, match })
      }

      const exactItems = [...candidateMatches.values()].filter((candidate) => candidate.match.kind === "exact")
      if (exactItems.length) {
        const matchMap = Object.fromEntries(exactItems.map((candidate) => [candidate.item.id, candidate.match]))
        setDirectory({ ...exactDirectory, items: exactItems.map((candidate) => candidate.item) })
        setIntentMatches(matchMap)
        setResultMode("exact")
        await recordOpportunityEvent("search", null, query, { search_mode: "natural_language_exact", interpreted_filters: intent.chips.map((item) => item.label), result_count: exactItems.length }).catch(() => undefined)
        return
      }

      const broaderDirectories = await Promise.all(
        plan.broader.slice(0, 4).map((filters) => loadOpportunityDirectoryWithSources(withManualFilters(filters, manual)).catch(() => null)),
      )
      if (requestId !== requestIdRef.current) return

      for (const broaderDirectory of broaderDirectories) {
        for (const item of broaderDirectory?.items ?? []) {
          const match = classifyOpportunityAgainstIntent(item as VisualOpportunity, intent)
          const existing = candidateMatches.get(item.id)
          if (!existing || match.score > existing.match.score) candidateMatches.set(item.id, { item, match })
        }
      }

      const partialItems = [...candidateMatches.values()]
        .filter((candidate) => candidate.match.kind === "partial")
        .sort((a, b) => b.match.score - a.match.score || a.item.title.localeCompare(b.item.title))
        .slice(0, 24)
      const matchMap = Object.fromEntries(partialItems.map((candidate) => [candidate.item.id, candidate.match]))
      setDirectory({ ...exactDirectory, items: partialItems.map((candidate) => candidate.item) })
      setIntentMatches(matchMap)
      setResultMode(partialItems.length ? "partial" : "none")
      await recordOpportunityEvent(partialItems.length ? "search" : "zero_results", null, query, { search_mode: partialItems.length ? "natural_language_partial" : "natural_language_zero", interpreted_filters: intent.chips.map((item) => item.label), result_count: partialItems.length }).catch(() => undefined)
    } catch (reason) {
      if (requestId === requestIdRef.current) setError(reason instanceof Error ? reason.message : "KLEIO could not search the opportunity directory.")
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh() }, 350)
    return () => window.clearTimeout(timer)
  }, [query, type, source, format, noFeeOnly])

  async function toggleSaved(item: OpportunityDirectoryItem) {
    setActionId(item.id)
    setError("")
    try {
      await setGlobalOpportunitySaved(item.id, !item.saved)
      setDirectory((current) => current ? { ...current, items: current.items.map((candidate) => candidate.id === item.id ? { ...candidate, saved: !candidate.saved } : candidate) } : current)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update the saved opportunity.")
    } finally {
      setActionId("")
    }
  }

  async function messageInstitution(item: OpportunityDirectoryItem) {
    setActionId(item.id)
    setError("")
    try {
      const conversationId = await getOrCreateOpportunityConversation(item.id)
      router.push(`/artist-dashboard/messages/?conversation=${conversationId}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to start the institution conversation.")
    } finally {
      setActionId("")
    }
  }

  const items = directory?.items ?? []
  return <LiveShell>
    <section className={`${card} space-y-4`}>
      <div>
        <label className="relative block"><span className="sr-only">Describe the opportunity you want</span><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “ceramics residencies in Asia”" className={`${input} pl-9`} /></label>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[180px_210px_170px_auto]">
        <label><span className="sr-only">Opportunity type</span><select className={input} value={type} onChange={(event) => setType(event.target.value)}><option value="all">All types</option><option value="grant">Grants</option><option value="residency">Residencies</option><option value="fellowship">Fellowships</option><option value="commission">Commissions</option><option value="prize_award">Prizes and awards</option><option value="open_call">Open calls</option><option value="professional_development">Professional development</option><option value="other">Other opportunities</option></select></label>
        <label><span className="sr-only">Opportunity source</span><select className={input} value={source} onChange={(event) => setSource(event.target.value)}><option value="all">All approved sources</option>{(directory?.sources ?? []).map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
        <label><span className="sr-only">Participation format</span><select className={input} value={format} onChange={(event) => setFormat(event.target.value)}><option value="all">All formats</option><option value="online">Online</option><option value="in_person">In person</option><option value="hybrid">Hybrid</option><option value="other">Other / confirm source</option></select></label>
        <label className="flex h-10 items-center gap-2 rounded-xl border border-[#E7E1F7] px-3 text-sm"><input type="checkbox" checked={noFeeOnly} onChange={(event) => setNoFeeOnly(event.target.checked)} />Confirmed no application fee</label>
      </div>
    </section>

    {intent.hasStructuredIntent && <section className="px-1" aria-label="Interpreted search filters">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-1 text-[0.68rem] font-semibold uppercase tracking-wide text-[#625C70]">Search interpreted as</p>
        {intent.chips.map((item) => <span key={item.key} className="rounded-full bg-[#F7F4FF] px-2.5 py-1 text-xs font-semibold text-[#5B4B8A]">{item.label}</span>)}
      </div>
    </section>}

    <StateNotice loading={loading} error={error} />
    {!loading && !error && <ResultSummary mode={resultMode} intent={intent} count={items.length} />}

    {!loading && !error && resultMode === "none" && intent.hasStructuredIntent && <div className="flex flex-wrap gap-2">
      {intent.locations.length > 0 && (intent.disciplines.length > 0 || intent.opportunityTypes.length > 0) && <button type="button" className={secondary} onClick={() => setQuery(broaderQuery(intent, "location"))}>Search without location</button>}
      {intent.disciplines.length > 0 && (intent.locations.length > 0 || intent.opportunityTypes.length > 0) && <button type="button" className={secondary} onClick={() => setQuery(broaderQuery(intent, "discipline"))}>Search without medium</button>}
      <button type="button" className={secondary} onClick={() => setQuery("")}>Browse all verified opportunities</button>
    </div>}

    <div className="space-y-4">{items.map((rawItem) => {
      const item = rawItem as VisualOpportunity
      const evaluation = evaluateOpportunity(item, directory?.passport ?? null, directory?.portfolioWorks ?? [])
      const readiness = assessOpportunityMaterialReadiness(item, directory?.passport ?? null, directory?.portfolioWorks ?? [])
      const intentMatch = intentMatches[item.id]
      const isExpanded = expanded === item.id
      const canMessage = item.application_mode === "internal" && Boolean(item.internal_call)
      const canonicalUrl = safeOpportunityUrl(item.canonical_url)
      const guidelinesUrl = safeOpportunityUrl(item.guidelines_url)
      const fundingSourceUrl = safeOpportunityUrl(item.funding_source_url || "")
      const detailsId = `opportunity-details-${item.id}`

      return <article key={item.id} className={`${card} overflow-hidden`} aria-labelledby={`opportunity-title-${item.id}`}>
        {intent.hasStructuredIntent && intentMatch && <div className={`mb-3 text-xs leading-relaxed ${intentMatch.kind === "exact" ? "text-emerald-700" : "border-l-2 border-amber-200 pl-3 text-amber-900"}`}>
          <strong>{intentMatch.kind === "exact" ? "Exact interpreted match" : "Broader verified result"}</strong>
          {intentMatch.kind === "partial" && intentMatch.missingLabels.length > 0 && <span> · Does not match: {intentMatch.missingLabels.join(", ")}</span>}
        </div>}
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

            <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-5">
              <div className="min-w-0 rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Funding</p><p className="mt-1 break-words text-sm font-semibold leading-snug">{formatAmount(item)}</p></div>
              <div className="rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Deadline</p><p className="mt-1 text-sm font-semibold">{formatDeadline(item)}</p></div>
              <div className="min-w-0 rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Location / format</p><p className="mt-1 break-words text-sm font-semibold leading-snug">{locationAndFormatCopy(item)}</p></div>
              <div className="min-w-0 rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Applicant type</p><p className="mt-1 line-clamp-3 break-words text-sm font-semibold leading-snug">{item.eligible_applicant_types.length ? item.eligible_applicant_types.map(cleanLabel).join(", ") : "Not fully structured"}</p></div>
              <div className="rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Application fee</p><p className="mt-1 text-sm font-semibold">{formatFee(item)}</p></div>
            </div>
          </div>
        </div>

        <div className="mt-4" aria-label="Artist-specific opportunity analysis">
          <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Artist-specific analysis</p>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${eligibilityTone(evaluation.eligibility)}`}>{eligibilityCopy(evaluation.eligibility)}</span>
            <span className="rounded-full bg-[#F7F4FF] px-3 py-1 text-xs font-semibold text-[#5B4B8A]">{relevanceCopy(evaluation.relevance)}</span>
            <span className="rounded-full bg-[#F7F4FF] px-3 py-1 text-xs font-semibold text-[#5B4B8A]">{readinessCopy(readiness)}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link className={item.status === "open" ? primary : secondary} href={`/artist-dashboard/applications/prepare/?opportunity=${encodeURIComponent(item.id)}`} onClick={() => void recordOpportunityEvent("application_prepare", item.id).catch(() => undefined)}>{item.status === "open" ? "Prepare application" : "Review requirements"}<FileText className="size-4" /></Link>
          {canMessage && <button type="button" className={secondary} disabled={actionId === item.id} onClick={() => void messageInstitution(item)}><MessageCircle className="size-4" />Message institution</button>}
          {guidelinesUrl && <a className={secondary} href={guidelinesUrl} target="_blank" rel="noreferrer" aria-label={`Open official guidelines for ${item.title}`}>Official guidelines<ExternalLink className="size-4" /></a>}
        </div>

        {isExpanded && <div id={detailsId} className="mt-5 border-t border-[#E7E1F7] pt-5">
          <OpportunityPreviewImage opportunity={item} variant="hero" showCaption />
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <section><h3 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-primary" />Eligibility evidence</h3><div className="mt-3 space-y-2">{evaluation.ruleResults.length ? evaluation.ruleResults.map((result) => <div key={result.rule_id} className="rounded-xl border border-[#E7E1F7] p-3 text-sm"><p className="flex items-center gap-2 font-semibold">{result.status === "passed" ? <CheckCircle2 className="size-4 text-emerald-600" /> : result.status === "failed" ? <XCircle className="size-4 text-red-600" /> : <CircleHelp className="size-4 text-amber-600" />}{result.label}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{result.explanation}</p></div>) : <p className="text-sm text-muted-foreground">The source does not yet provide enough structured evidence for a formal eligibility decision.</p>}</div></section>

            <section><h3 className="flex items-center gap-2 text-sm font-semibold"><FileText className="size-4 text-primary" />Application readiness</h3>{readiness.unknown ? <p className="mt-3 text-sm text-muted-foreground">Required materials are not stated in a structured source field. Review the official guidelines before preparing an application.</p> : <div className="mt-3 space-y-2">{readiness.requirements.map((requirement) => <div key={requirement.id} className="rounded-xl border border-[#E7E1F7] p-3"><p className="text-sm font-semibold">{requirement.label}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{requirement.status.replaceAll("_", " ")} · {requirement.explanation}</p></div>)}</div>}</section>

            <section><h3 className="text-sm font-semibold">Verified source facts</h3><dl className="mt-3 space-y-3 text-sm"><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Official source</dt><dd>{canonicalUrl ? <a className="font-medium text-primary underline-offset-4 hover:underline" href={canonicalUrl} target="_blank" rel="noreferrer">{item.source?.name || item.provider_name}<ExternalLink className="ml-1 inline size-3" /></a> : "Source link not provided"}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Funding</dt><dd className="mt-1 leading-relaxed">{formatAmount(item)}{fundingSourceUrl && <> · <a className="font-medium text-primary underline-offset-2 hover:underline" href={fundingSourceUrl} target="_blank" rel="noreferrer">Funding source</a></>}</dd>{item.funding_source_note && <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.funding_source_note}</dd>}</div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Funding checked</dt><dd>{formatDate(item.funding_verified_at ?? null, "Not separately confirmed")}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last checked</dt><dd>{formatDate(item.last_verified_at, "Not confirmed")}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deadline</dt><dd>{formatDeadline(item)}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Application fee</dt><dd>{formatFee(item)}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location / participation</dt><dd>{locationAndFormatCopy(item)}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Image provenance</dt><dd>{imageRightsCopy(item)}</dd></div></dl></section>
          </div>
          <section className="mt-5 rounded-xl border border-[#E7E1F7] p-4"><h3 className="text-sm font-semibold">Full source description</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{item.description || "The source did not provide a reusable full description. Continue to the official listing."}</p></section>
        </div>}
      </article>
    })}</div>
  </LiveShell>
}
