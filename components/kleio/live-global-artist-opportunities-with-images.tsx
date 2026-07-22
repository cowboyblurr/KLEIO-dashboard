"use client"

import { useEffect, useState } from "react"
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
  getOrCreateApplicationDraft,
  loadPortfolioWorks,
  saveApplicationDraft,
  submitApplication,
  type ApplicationRecord,
  type OpenCallRecord,
  type PortfolioWorkRecord,
} from "@/lib/kleio-live-data"
import {
  evaluateOpportunity,
  getOrCreateOpportunityConversation,
  loadOpportunityDirectory,
  recordOpportunityEvent,
  setGlobalOpportunitySaved,
  type OpportunityDirectoryData,
  type OpportunityDirectoryItem,
  type OpportunityEvaluation,
} from "@/lib/kleio-opportunity-data"
import type { OpportunityImageMetadata } from "@/lib/kleio-opportunity-images"

const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]"
const input = "h-10 w-full rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm outline-none focus:border-primary/40"
const textarea = "w-full rounded-xl border border-[#E7E1F7] bg-white px-3 py-2 text-sm outline-none focus:border-primary/40"
const primary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
const secondary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] disabled:opacity-50"

type VisualOpportunity = OpportunityDirectoryItem & OpportunityImageMetadata

function LiveShell({ children }: { children: React.ReactNode }) {
  return <main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6"><div className="mx-auto max-w-[1180px] space-y-5"><WorkspacePageHeader eyebrow="Artist workspace" title="Opportunities" description="Discover sourced grants and creative opportunities from the United States, Spain, Mexico, and the wider Ibero-American region. Authentic source images appear when available; otherwise KLEIO shows a clearly labeled category cover." />{children}</div></main>
}

function StateNotice({ loading, error, empty }: { loading: boolean; error: string; empty?: string }) {
  if (loading) return <div className={`${card} flex items-center gap-2 text-sm text-muted-foreground`}><Loader2 className="size-4 animate-spin" />Loading authentic opportunity records…</div>
  if (error) return <div role="alert" className={`${card} border-red-200 text-sm text-red-700`}>{error}</div>
  if (empty) return <div className={`${card} text-sm text-muted-foreground`}>{empty}</div>
  return null
}

function cleanLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value: string | null) {
  if (!value) return "Deadline not confirmed"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Deadline not confirmed"
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(parsed)
}

function formatAmount(item: OpportunityDirectoryItem) {
  if (item.award_min === null && item.award_max === null) return "Amount not stated"
  const currency = item.currency || "Currency not stated"
  const format = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)
  if (item.award_min !== null && item.award_max !== null && item.award_min !== item.award_max) return `${currency} ${format(item.award_min)}–${format(item.award_max)}`
  return `${currency} ${format(item.award_max ?? item.award_min ?? 0)}`
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
  if (item.source?.source_type === "official_api") return "Official government source"
  if (item.source?.slug === "kleio-institution") return "Published by KLEIO institution"
  if (item.source?.source_type === "provider_submission") return item.verification_status === "provider_verified" ? "Provider verified" : "Provider submitted · KLEIO reviewed"
  if (item.source?.source_type === "admin_import") return "KLEIO reviewed source"
  return item.source?.name || "Source attributed"
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

function InternalApplicationEditor({ call, onComplete }: { call: OpenCallRecord; onComplete: () => void }) {
  const [application, setApplication] = useState<ApplicationRecord | null>(null)
  const [works, setWorks] = useState<PortfolioWorkRecord[]>([])
  const [answer, setAnswer] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    void Promise.all([getOrCreateApplicationDraft(call), loadPortfolioWorks()])
      .then(([draft, portfolio]) => {
        setApplication(draft)
        setWorks(portfolio)
        setAnswer(draft.application_answers?.find((item) => item.question_key === "project_proposal")?.answer_text || "")
        setSelected(draft.application_works?.map((item) => item.portfolio_work_id) || [])
      })
      .catch((reason: Error) => setError(reason.message))
  }, [call])

  async function persist(submit: boolean) {
    if (!application) return
    setSaving(true)
    setError("")
    try {
      await saveApplicationDraft(application.id, answer, selected)
      if (submit) await submitApplication(application.id)
      setMessage(submit ? "Application submitted and status history recorded." : "Draft saved to your account.")
      if (submit) onComplete()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save the application.")
    } finally {
      setSaving(false)
    }
  }

  if (error) return <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>
  if (!application) return <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Preparing your KLEIO application…</p>
  if (application.status !== "draft") return <p className="mt-4 text-sm font-medium text-emerald-700">This application is already {application.status.replaceAll("_", " ")}.</p>

  return <div className="mt-4 border-t border-[#E7E1F7] pt-4">
    <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground"><span>Project proposal / application note</span><textarea className={textarea} rows={5} value={answer} onChange={(event) => setAnswer(event.target.value)} /></label>
    <p className="mt-4 text-xs font-semibold text-muted-foreground">Select completed portfolio works</p>
    <div className="mt-2 flex flex-wrap gap-2">{works.map((work) => <label key={work.id} className="flex items-center gap-2 rounded-xl border border-[#E7E1F7] px-3 py-2 text-sm"><input type="checkbox" checked={selected.includes(work.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, work.id] : current.filter((id) => id !== work.id))} />{work.title}</label>)}</div>
    <div className="mt-4 flex flex-wrap gap-2"><button className={secondary} disabled={saving} onClick={() => void persist(false)}>Save draft</button><button className={primary} disabled={saving || !answer.trim()} onClick={() => void persist(true)}>{saving && <Loader2 className="size-4 animate-spin" />}Submit through KLEIO</button></div>
    {message && <p role="status" className="mt-3 text-sm font-medium text-emerald-700">{message}</p>}
  </div>
}

export function LiveGlobalArtistOpportunitiesWithImages() {
  const router = useRouter()
  const [directory, setDirectory] = useState<OpportunityDirectoryData | null>(null)
  const [query, setQuery] = useState("")
  const [type, setType] = useState("all")
  const [source, setSource] = useState("all")
  const [format, setFormat] = useState("all")
  const [noFeeOnly, setNoFeeOnly] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [applying, setApplying] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionId, setActionId] = useState("")

  function refresh() {
    setLoading(true)
    setError("")
    return loadOpportunityDirectory({
      query,
      opportunityTypes: type === "all" ? undefined : [type],
      sourceSlugs: source === "all" ? undefined : [source],
      participationFormats: format === "all" ? undefined : [format],
      noFeeOnly,
    }).then((result) => {
      setDirectory(result)
      return recordOpportunityEvent(result.items.length ? "search" : "zero_results", null, query, { opportunity_type: type, source, participation_format: format, no_fee_only: noFeeOnly }).catch(() => undefined)
    }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh() }, 300)
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
    <section className={`${card} grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_180px_210px_170px_auto]`}>
      <label className="relative"><span className="sr-only">Search opportunities</span><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search in English or Spanish" className={`${input} pl-9`} /></label>
      <label><span className="sr-only">Opportunity type</span><select className={input} value={type} onChange={(event) => setType(event.target.value)}><option value="all">All types</option><option value="grant">Grants</option><option value="residency">Residencies</option><option value="fellowship">Fellowships</option><option value="commission">Commissions</option><option value="prize_award">Prizes and awards</option><option value="open_call">Open calls</option></select></label>
      <label><span className="sr-only">Opportunity source</span><select className={input} value={source} onChange={(event) => setSource(event.target.value)}><option value="all">All approved sources</option><option value="grants-gov">Grants.gov</option><option value="spain-culture-bdns">Spain Ministry of Culture</option><option value="mexico-cultura">Mexico Secretaría de Cultura</option><option value="ibermusicas">Ibermúsicas</option><option value="kleio-institution">KLEIO institutions</option><option value="provider-submission">Reviewed providers</option></select></label>
      <label><span className="sr-only">Participation format</span><select className={input} value={format} onChange={(event) => setFormat(event.target.value)}><option value="all">All formats</option><option value="online">Online</option><option value="in_person">In person</option><option value="hybrid">Hybrid</option><option value="other">Not specified</option></select></label>
      <label className="flex h-10 items-center gap-2 rounded-xl border border-[#E7E1F7] px-3 text-sm"><input type="checkbox" checked={noFeeOnly} onChange={(event) => setNoFeeOnly(event.target.checked)} />No stated fee</label>
    </section>

    <div className="rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] px-4 py-3 text-xs leading-relaxed text-muted-foreground">KLEIO now includes selected Spanish-language opportunities from official Spain and Mexico sources and current Ibermúsicas programs. Country participation can vary by call, and the official guidelines remain controlling. Preview images are shown only when supplied by an institution, provider, or official source; otherwise KLEIO uses a clearly labeled category cover.</div>
    <StateNotice loading={loading} error={error} empty={!loading && !items.length ? "No approved opportunities match these filters. Try broadening the search; KLEIO will not substitute demo records." : undefined} />

    <div className="space-y-4">{items.map((rawItem) => {
      const item = rawItem as VisualOpportunity
      const evaluation = evaluateOpportunity(item, directory?.passport ?? null, directory?.portfolioWorks ?? [])
      const isExpanded = expanded === item.id
      const canMessage = item.application_mode === "internal" && Boolean(item.internal_call)
      return <article key={item.id} className={card}>
        <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
          <OpportunityPreviewImage opportunity={item} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#A997E8]"><span>{cleanLabel(item.opportunity_type)}</span><span>·</span><span>{item.provider_name}</span></div>
                <button className="mt-1 flex max-w-full items-center gap-2 text-left font-serif text-xl font-semibold hover:text-primary" onClick={() => { setExpanded((current) => current === item.id ? null : item.id); void recordOpportunityEvent("view", item.id).catch(() => undefined) }} aria-expanded={isExpanded}>{item.title}<ChevronDown className={`size-4 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} /></button>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{item.summary || "No summary was supplied by the source. Open the official listing for full details."}</p>
              </div>
              <button className={secondary} disabled={actionId === item.id} onClick={() => void toggleSaved(item)}><Bookmark className={`size-4 ${item.saved ? "fill-current" : ""}`} />{item.saved ? "Saved" : "Save"}</button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Funding</p><p className="mt-1 text-sm font-semibold">{formatAmount(item)}</p></div>
              <div className="rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Deadline</p><p className="mt-1 text-sm font-semibold">{formatDate(item.deadline_at)}</p></div>
              <div className="rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Applicant type</p><p className="mt-1 text-sm font-semibold">{item.eligible_applicant_types.length ? item.eligible_applicant_types.map(cleanLabel).join(", ") : "Eligibility details incomplete"}</p></div>
              <div className="rounded-xl bg-[#F7F4FF] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">Source</p><p className="mt-1 text-sm font-semibold">{sourceCopy(item)}</p></div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${eligibilityTone(evaluation.eligibility)}`}>{eligibilityCopy(evaluation.eligibility)}</span>
          <span className="rounded-full bg-[#F7F4FF] px-3 py-1 text-xs font-semibold text-[#5B4B8A]">{relevanceCopy(evaluation.relevance)}</span>
          <span className="rounded-full bg-[#F7F4FF] px-3 py-1 text-xs font-semibold text-[#5B4B8A]">{evaluation.readiness.unknown ? "Application materials not structured" : `${evaluation.readiness.readyCount} of ${evaluation.readiness.totalCount} required materials ready`}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {item.application_mode === "external" ? <a href={item.application_url || item.canonical_url} target="_blank" rel="noreferrer" className={primary} onClick={() => void recordOpportunityEvent("external_application_click", item.id).catch(() => undefined)}>Continue to official application<ExternalLink className="size-4" /></a> : item.internal_call ? <button className={primary} onClick={() => setApplying((current) => current === item.id ? null : item.id)}>{applying === item.id ? "Close application" : "Apply through KLEIO"}</button> : null}
          {canMessage && <button className={secondary} disabled={actionId === item.id} onClick={() => void messageInstitution(item)}><MessageCircle className="size-4" />Message institution</button>}
          {item.guidelines_url && <a className={secondary} href={item.guidelines_url} target="_blank" rel="noreferrer">Official guidelines<ExternalLink className="size-4" /></a>}
        </div>

        {applying === item.id && item.internal_call && <InternalApplicationEditor call={item.internal_call} onComplete={() => setApplying(null)} />}

        {isExpanded && <div className="mt-5 border-t border-[#E7E1F7] pt-5">
          <OpportunityPreviewImage opportunity={item} variant="hero" showCaption />
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <section><h3 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-primary" />Eligibility evidence</h3><div className="mt-3 space-y-2">{evaluation.ruleResults.length ? evaluation.ruleResults.map((result) => <div key={result.rule_id} className="rounded-xl border border-[#E7E1F7] p-3 text-sm"><p className="flex items-center gap-2 font-semibold">{result.status === "passed" ? <CheckCircle2 className="size-4 text-emerald-600" /> : result.status === "failed" ? <XCircle className="size-4 text-red-600" /> : <CircleHelp className="size-4 text-amber-600" />}{result.label}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{result.explanation}</p></div>) : <p className="text-sm text-muted-foreground">The source does not yet provide enough structured evidence for a formal eligibility decision.</p>}</div></section>
            <section><h3 className="flex items-center gap-2 text-sm font-semibold"><FileText className="size-4 text-primary" />Application readiness</h3>{evaluation.readiness.unknown ? <p className="mt-3 text-sm text-muted-foreground">Required materials are not stated in a structured source field. Review the official guidelines before preparing an application.</p> : <div className="mt-3 space-y-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Ready</p><ul className="mt-1 space-y-1 text-sm text-muted-foreground">{evaluation.readiness.ready.length ? evaluation.readiness.ready.map((label) => <li key={label}>✓ {label}</li>) : <li>No required materials are confirmed ready yet.</li>}</ul></div><div><p className="text-xs font-semibold uppercase tracking-wide text-red-700">Missing</p><ul className="mt-1 space-y-1 text-sm text-muted-foreground">{evaluation.readiness.missing.length ? evaluation.readiness.missing.map((label) => <li key={label}>• {label}</li>) : <li>No confirmed materials are missing.</li>}</ul></div></div>}</section>
            <section><h3 className="text-sm font-semibold">Source and details</h3><dl className="mt-3 space-y-3 text-sm"><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Image provenance</dt><dd>{imageRightsCopy(item)}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last checked</dt><dd>{item.last_verified_at ? new Date(item.last_verified_at).toLocaleString() : "Not confirmed"}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Application fee</dt><dd>{item.application_fee === null ? "Application fee not stated" : `${item.currency || ""} ${item.application_fee}`.trim()}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</dt><dd>{item.locations.length ? item.locations.join(", ") : "Location not stated"}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Full description</dt><dd className="mt-1 whitespace-pre-wrap leading-relaxed text-muted-foreground">{item.description || "The source did not provide a reusable full description. Continue to the official listing."}</dd></div></dl></section>
          </div>
        </div>}
      </article>
    })}</div>
  </LiveShell>
}
