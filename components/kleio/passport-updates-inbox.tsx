"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  CopyCheck,
  FileSearch,
  FileText,
  Loader2,
  Merge,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"
import {
  SOURCE_CLASSIFICATION_OPTIONS,
  bulkConfirmSafeClaims,
  confirmPassportClaim,
  loadPassportReviewInbox,
  mergeDuplicateClaim,
  requestSourceExtraction,
  setPassportClaimDecision,
  updateSourceClassification,
  type PassportClaim,
  type PassportReviewGroup,
  type SourceClassification,
} from "@/lib/kleio-upload-to-passport"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"

const panel = "rounded-[24px] border border-[#E2DCF1] bg-white shadow-[0_18px_52px_rgba(82,64,130,0.06)]"
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const subtle = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#746E80] transition hover:bg-[#F5F1FB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const textarea = "w-full rounded-xl border border-[#DED7EF] bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12"

const pendingStatuses: PassportClaim["status"][] = ["proposed", "needs_clarification", "conflicting", "deferred"]

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function classificationLabel(value: SourceClassification) {
  return SOURCE_CLASSIFICATION_OPTIONS.find((option) => option.value === value)?.label ?? titleCase(value)
}

function analysisLayer(claim: PassportClaim) {
  if (claim.relationship_status === "conflict" || claim.relationship_status === "unresolved" || ["conflicting", "needs_clarification"].includes(claim.status)) return 5
  if (claim.extraction_method.includes("interpret")) return 4
  if (["bio", "artist_statement", "practice_description", "project_description", "project_summary"].includes(claim.claim_type)) return 2
  return 1
}

function layerLabel(claim: PassportClaim) {
  const layer = analysisLayer(claim)
  if (layer === 1) return "Verified extracted fact"
  if (layer === 2) return "Artist-authored description"
  if (layer === 4) return "Interpretive hypothesis"
  return "Unknown, conflict, or insufficient evidence"
}

function confidenceLabel(claim: PassportClaim) {
  if (claim.relationship_status === "conflict" || claim.status === "conflicting") return "Conflicting evidence"
  if (claim.relationship_status === "unresolved" || claim.status === "needs_clarification") return "Artist confirmation required"
  if (claim.confidence === null) return "Artist confirmation required"
  if (claim.confidence >= 0.85) return "High confidence"
  if (claim.confidence >= 0.65) return "Moderate confidence"
  return "Low confidence"
}

function statusPresentation(claim: PassportClaim) {
  if (claim.relationship_status === "conflict") return { label: "Conflict", detail: "This source disagrees with existing confirmed information.", icon: AlertTriangle, className: "border-amber-200 bg-amber-50 text-amber-800" }
  if (claim.relationship_status === "duplicate") return { label: "Possible duplicate", detail: "KLEIO found similar confirmed information already in the Passport.", icon: CopyCheck, className: "border-blue-200 bg-blue-50 text-blue-800" }
  if (claim.sensitivity !== "standard") return { label: "Sensitive", detail: "This information stays private unless you deliberately authorize another use.", icon: ShieldAlert, className: "border-rose-200 bg-rose-50 text-rose-800" }
  if (analysisLayer(claim) === 2) return { label: "Artist-authored language", detail: "This wording came from an artist-authored narrative document and may be context-specific.", icon: Sparkles, className: "border-violet-200 bg-violet-50 text-violet-800" }
  if (claim.status === "needs_clarification") return { label: "Review carefully", detail: "KLEIO found a possible record but could not confirm every detail.", icon: FileSearch, className: "border-violet-200 bg-violet-50 text-violet-800" }
  return { label: "Source-backed fact", detail: "This value came from the private source and has not been added to the Passport.", icon: FileText, className: "border-emerald-200 bg-emerald-50 text-emerald-800" }
}

function sourceState(group: PassportReviewGroup) {
  if (group.source.extraction_status === "processing" || group.source.extraction_status === "queued") return "Analysis in progress"
  if (group.source.extraction_status === "failed") return "Analysis failed"
  if (group.source.extraction_status === "needs_artist_classification") return "Classification needed"
  if (group.source.extraction_status === "partially_extracted") return "Partial extraction"
  if (group.source.extraction_status === "artist_review_completed") return "Review completed"
  return `${group.pendingCount} update${group.pendingCount === 1 ? "" : "s"} to review`
}

function safeBulkClaims(group: PassportReviewGroup) {
  return group.claims.filter((claim) =>
    claim.status === "proposed"
    && claim.relationship_status === "new"
    && claim.sensitivity === "standard"
    && analysisLayer(claim) === 1
    && (claim.confidence ?? 0) >= 0.85,
  )
}

export function PassportUpdatesInbox() {
  const [groups, setGroups] = useState<PassportReviewGroup[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [activeId, setActiveId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const next = await loadPassportReviewInbox()
      setGroups(next)
      setEdits((current) => {
        const updated = { ...current }
        for (const group of next) for (const claim of group.claims) if (!(claim.id in updated)) updated[claim.id] = claim.artist_edited_value || claim.proposed_value
        return updated
      })
      setExpanded((current) => {
        if (Object.keys(current).length) return current
        const firstPending = next.find((group) => group.pendingCount > 0)
        return firstPending ? { [firstPending.source.id]: true } : {}
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not load Passport updates.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    void trackKleioProductEvent("proposal_review_opened", { surface: "passport_updates" })
  }, [refresh])

  const totals = useMemo(() => groups.reduce((current, group) => {
    for (const claim of group.claims) {
      if (pendingStatuses.includes(claim.status)) current.pending += 1
      if (analysisLayer(claim) === 1) current.facts += 1
      if (analysisLayer(claim) === 2) current.language += 1
      if (claim.relationship_status === "conflict") current.conflicts += 1
      if (claim.relationship_status === "duplicate") current.duplicates += 1
    }
    return current
  }, { pending: 0, facts: 0, language: 0, conflicts: 0, duplicates: 0 }), [groups])

  async function confirm(claim: PassportClaim, replaceExisting = false) {
    setActiveId(claim.id)
    setError("")
    setMessage("")
    try {
      await confirmPassportClaim(claim, { value: edits[claim.id] ?? claim.proposed_value, visibility: "private", replaceExisting })
      setMessage(`${titleCase(claim.claim_type)} confirmed in your private Creative Passport.`)
      void trackKleioProductEvent("proposal_approved", { surface: "passport_updates", metadata: { source: "document", section: claim.target_section, edited: (edits[claim.id] ?? claim.proposed_value) !== claim.proposed_value } })
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not confirm this Passport update.")
    } finally {
      setActiveId("")
    }
  }

  async function decide(claim: PassportClaim, decision: "rejected" | "deferred") {
    setActiveId(claim.id)
    setError("")
    setMessage("")
    try {
      await setPassportClaimDecision(claim.id, decision, decision === "rejected" ? "Artist rejected the extracted claim." : "Artist chose to review this claim later.")
      setMessage(decision === "rejected" ? "The suggestion was rejected and not added to the Passport." : "The update remains private and available for later review.")
      void trackKleioProductEvent("proposal_rejected", { surface: "passport_updates", metadata: { source: "document", section: claim.target_section, reason: decision } })
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not update this review decision.")
    } finally {
      setActiveId("")
    }
  }

  async function merge(claim: PassportClaim) {
    setActiveId(claim.id)
    setError("")
    setMessage("")
    try {
      await mergeDuplicateClaim(claim)
      setMessage("The existing Passport record was kept and this source was marked as supporting evidence.")
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not merge this duplicate.")
    } finally {
      setActiveId("")
    }
  }

  async function classify(sourceId: string, classification: SourceClassification) {
    setActiveId(sourceId)
    setError("")
    setMessage("")
    try {
      const result = await updateSourceClassification(sourceId, classification)
      setMessage(result.proposalCount ? `${result.proposalCount} reviewable update${result.proposalCount === 1 ? "" : "s"} prepared from the corrected classification.` : "The classification was corrected. No structured Passport update was created automatically.")
      void trackKleioProductEvent("document_classification_corrected", { surface: "passport_updates", metadata: { source: "document", status: "reanalyzed" } })
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not reclassify this source.")
    } finally {
      setActiveId("")
    }
  }

  async function retry(group: PassportReviewGroup) {
    setActiveId(group.source.id)
    setError("")
    setMessage("")
    try {
      const result = await requestSourceExtraction(group.source.id, group.source.classification)
      setMessage(result.warnings.includes("ocr_required") ? "The original PDF is private, but it has no accessible text layer. OCR is not configured, so no document content was invented." : `${result.proposalCount} reviewable update${result.proposalCount === 1 ? "" : "s"} prepared.`)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not analyze this source again.")
    } finally {
      setActiveId("")
    }
  }

  async function confirmSafe(group: PassportReviewGroup) {
    const safe = safeBulkClaims(group)
    if (!safe.length) return
    setActiveId(group.source.id)
    setError("")
    setMessage("")
    try {
      const results = await bulkConfirmSafeClaims(safe)
      setMessage(`${results.length} high-confidence factual update${results.length === 1 ? "" : "s"} confirmed. Artist-authored descriptions, interpretations, conflicts, and sensitive information were left for individual review.`)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not confirm these updates.")
    } finally {
      setActiveId("")
    }
  }

  return (
    <main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <header className={`${panel} overflow-hidden bg-[linear-gradient(135deg,#F8F5FF,#FFFFFF)] p-5 sm:p-7`}>
          <Link href="/artist-dashboard/passport/" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#5B4B8A]"><ArrowLeft className="size-4" />Creative Passport</Link>
          <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Artist-controlled intelligence</p>
              <h1 className="mt-2 max-w-3xl font-serif text-3xl font-semibold tracking-[-0.04em] text-[#292631] sm:text-4xl">Passport Updates for Review</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#746E80]">Facts, artist-authored descriptions, correlations, interpretations, and uncertainty remain visibly separate. Nothing becomes public or application-ready automatically.</p>
            </div>
            <div className="flex flex-wrap gap-2"><Link href="/artist-dashboard/import/" className={primary}><FileText className="size-4" />Upload document</Link><button type="button" className={secondary} disabled={loading} onClick={() => void refresh()}><RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />Refresh review</button></div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Waiting", totals.pending, "Private decisions"],
              ["Facts", totals.facts, "Layer 1"],
              ["Artist language", totals.language, "Layer 2"],
              ["Duplicates", totals.duplicates, "Possible matches"],
              ["Conflicts", totals.conflicts, "Need comparison"],
            ].map(([label, value, note]) => <div key={String(label)} className="rounded-2xl border border-[#E7E1F7] bg-white/85 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#8A8296]">{label}</p><p className="mt-1 font-serif text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-[#746E80]">{note}</p></div>)}
          </div>
        </header>

        {(error || message) && <div role={error ? "alert" : "status"} aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || message}</div>}
        {loading && !groups.length && <div className={`${panel} flex items-center justify-center p-10 text-sm text-[#746E80]`}><Loader2 className="mr-2 size-4 animate-spin" />Loading your private review inbox…</div>}
        {!loading && !groups.length && <section className={`${panel} grid place-items-center p-10 text-center`}><CheckCheck className="size-8 text-[#75639E]" /><h2 className="mt-4 font-serif text-2xl font-semibold">No Passport updates are waiting</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[#746E80]">Upload a PDF artist document. KLEIO will preserve the source and prepare only reviewable information.</p><Link href="/artist-dashboard/import/" className={`${primary} mt-5`}>Upload document</Link></section>}

        <div className="space-y-4">
          {groups.map((group) => {
            const isOpen = Boolean(expanded[group.source.id])
            const safeCount = safeBulkClaims(group).length
            const warning = group.source.review_summary.ocr_required === true
            return <section key={group.source.id} className={`${panel} overflow-hidden`}>
              <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                <button type="button" className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20" aria-expanded={isOpen} aria-controls={`source-${group.source.id}`} onClick={() => setExpanded((current) => ({ ...current, [group.source.id]: !current[group.source.id] }))}>
                  <span className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F0EAFB] text-[#5B4B8A]"><FileText className="size-5" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="break-all font-serif text-xl font-semibold text-[#292631]">{group.source.original_filename || group.source.label}</span><span className="rounded-full border border-[#D8D0F2] bg-[#F8F5FF] px-2.5 py-1 text-[0.67rem] font-semibold text-[#675789]">Version {group.source.document_version}</span></span><span className="mt-1 block text-xs leading-5 text-[#746E80]">{classificationLabel(group.source.classification)} · {sourceState(group)}</span><span className="mt-2 block text-[0.68rem] font-semibold text-[#8A8296]">Original preserved · classification remains artist-correctable</span></span><ChevronDown className={`mt-2 size-5 shrink-0 text-[#75639E] transition ${isOpen ? "rotate-180" : ""}`} /></span>
                </button>
                <div className="flex flex-wrap gap-2">{safeCount > 0 && <button type="button" className={secondary} disabled={Boolean(activeId)} onClick={() => void confirmSafe(group)}><CheckCheck className="size-4" />Confirm {safeCount} factual update{safeCount === 1 ? "" : "s"}</button>}<button type="button" className={secondary} disabled={Boolean(activeId)} onClick={() => void retry(group)}>{activeId === group.source.id ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}Analyze again</button></div>
              </div>

              {warning && <div className="border-y border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900"><AlertTriangle className="mr-2 inline size-4" />This PDF has no accessible text layer. OCR is not configured, so KLEIO preserved the private source without pretending it was read.</div>}

              <div id={`source-${group.source.id}`} hidden={!isOpen} className="border-t border-[#E7E1F7] bg-[#FCFBFE] p-4 sm:p-6">
                <div className="mb-5 grid gap-3 rounded-2xl border border-[#E7E1F7] bg-white p-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
                  <div><p className="text-xs font-semibold text-[#625C70]">Source classification</p><p className="mt-1 text-xs leading-5 text-[#8A8296]">Correcting the category analyzes the same private source again. It does not create a second file.</p></div>
                  <label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>Document type</span><select value={group.source.classification} disabled={Boolean(activeId)} onChange={(event) => void classify(group.source.id, event.target.value as SourceClassification)} className="h-11 rounded-xl border border-[#DED7EF] bg-white px-3 text-sm outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12">{SOURCE_CLASSIFICATION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}{option.sensitive ? " — sensitive" : ""}</option>)}</select></label>
                </div>

                <div className="space-y-4">
                  {group.claims.map((claim) => {
                    const presentation = statusPresentation(claim)
                    const StatusIcon = presentation.icon
                    const pending = pendingStatuses.includes(claim.status)
                    const layer = analysisLayer(claim)
                    return <article key={claim.id} className="rounded-2xl border border-[#E7E1F7] bg-white p-4 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#75639E]">Layer {layer} · {layerLabel(claim)}</p><h3 className="mt-1 font-serif text-xl font-semibold text-[#292631]">{claim.proposed_value.split("\n")[0]}</h3><p className="mt-1 text-xs text-[#8A8296]">{claim.page_number ? `Page ${claim.page_number} · ` : ""}{claim.extraction_method.replaceAll("_", " ")} · {confidenceLabel(claim)}</p></div>
                        <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${presentation.className}`} title={presentation.detail}><StatusIcon className="size-3.5" />{presentation.label}</span>
                      </div>

                      {pending ? <label className="mt-4 grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>Review and correct before confirmation</span><textarea className={textarea} rows={Math.min(12, Math.max(3, Math.ceil((edits[claim.id]?.length ?? claim.proposed_value.length) / 92)))} value={edits[claim.id] ?? claim.proposed_value} onChange={(event) => setEdits((current) => ({ ...current, [claim.id]: event.target.value }))} /></label> : <p className="mt-4 whitespace-pre-wrap rounded-xl bg-[#F8F6FC] px-3 py-3 text-sm leading-6 text-[#625C70]">{claim.artist_edited_value || claim.proposed_value}</p>}

                      {claim.existing_record && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Existing confirmed Passport record</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-amber-950">{claim.existing_record.display_value}</p></div>}

                      <details className="mt-4 rounded-xl border border-[#E7E1F7] bg-[#FCFBFE] px-3 py-3"><summary className="cursor-pointer text-xs font-semibold text-[#5B4B8A]">Review evidence and provenance</summary><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#746E80]">{claim.evidence_excerpt || "No reliable excerpt is available. Artist confirmation is required."}</p><p className="mt-2 text-[0.67rem] font-semibold text-[#8A8296]">{claim.page_number ? `Private source page ${claim.page_number}. ` : ""}Confirmation does not make the source public.</p></details>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="max-w-xl text-xs leading-5 text-[#8A8296]"><ShieldCheck className="mr-1.5 inline size-3.5" />Confirmed records default to private. Layer 4 interpretations can never be bulk-confirmed as facts.</p>{pending ? <div className="flex flex-wrap justify-end gap-2"><button type="button" className={subtle} disabled={activeId === claim.id} onClick={() => void decide(claim, "deferred")}>Review later</button><button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50" disabled={activeId === claim.id} onClick={() => void decide(claim, "rejected")}><X className="size-4" />Reject</button>{claim.relationship_status === "duplicate" && claim.existing_record_id && <button type="button" className={secondary} disabled={activeId === claim.id} onClick={() => void merge(claim)}><Merge className="size-4" />Merge evidence</button>}{claim.relationship_status === "conflict" && claim.existing_record_id && <button type="button" className={secondary} disabled={activeId === claim.id} onClick={() => void confirm(claim, true)}><RefreshCcw className="size-4" />Replace existing</button>}<button type="button" className={primary} disabled={activeId === claim.id || !(edits[claim.id] ?? claim.proposed_value).trim()} onClick={() => void confirm(claim)}>{activeId === claim.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}{claim.relationship_status === "conflict" ? "Keep both privately" : "Confirm privately"}</button></div> : <span className="rounded-full bg-[#F2EFF7] px-3 py-1.5 text-xs font-semibold text-[#625C70]">{titleCase(claim.status)}</span>}</div>
                    </article>
                  })}
                </div>
              </div>
            </section>
          })}
        </div>
      </div>
    </main>
  )
}
