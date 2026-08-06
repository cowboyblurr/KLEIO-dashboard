"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCheck,
  CopyCheck,
  FileSearch,
  FileText,
  Loader2,
  RefreshCcw,
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

const primary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#D8D0F2] bg-white px-3 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/15 disabled:cursor-not-allowed disabled:opacity-50"
const quiet = "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#6F6882] transition hover:bg-[#F4F0FB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/15 disabled:opacity-50"
const textarea = "w-full rounded-lg border border-[#D8D0F2] bg-white px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12"
const pendingStatuses = new Set<PassportClaim["status"]>(["proposed", "needs_clarification", "conflicting", "deferred"])

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function fieldLabel(claim: PassportClaim) {
  const value = claim.target_field || claim.target_section || claim.claim_type
  const aliases: Record<string, string> = {
    bio: "Short biography",
    artist_biography: "Short biography",
    artist_statement: "Artist statement",
    practice_description: "Practice description",
    exhibition_history: "Exhibitions and professional history",
    education: "Education and training",
    awards: "Awards, grants, and fellowships",
    mediums: "Mediums and materials",
    disciplines: "Disciplines",
    languages: "Languages",
  }
  return aliases[value] || titleCase(value)
}

function sourceLabel(claim: PassportClaim) {
  return claim.source?.original_filename || claim.source?.label || "Private document"
}

function confidenceLabel(claim: PassportClaim) {
  if (claim.relationship_status === "conflict") return "Conflict"
  if (claim.relationship_status === "duplicate") return "Possible duplicate"
  if (claim.confidence === null) return "Needs review"
  if (claim.confidence >= 0.85) return "High confidence"
  if (claim.confidence >= 0.65) return "Moderate confidence"
  return "Low confidence"
}

function safeClaim(claim: PassportClaim) {
  return claim.status === "proposed"
    && claim.relationship_status === "new"
    && claim.sensitivity === "standard"
    && (claim.confidence ?? 0) >= 0.85
    && !["bio", "artist_statement", "practice_description", "project_description", "project_summary"].includes(claim.claim_type)
}

function sourceStatus(group: PassportReviewGroup) {
  if (["processing", "queued"].includes(group.source.extraction_status)) return "Analysis in progress"
  if (group.source.extraction_status === "failed") return "Analysis failed"
  if (group.source.extraction_status === "needs_artist_classification") return "Classification needed"
  if (["partial", "partially_extracted"].includes(group.source.extraction_status)) return "Partial analysis"
  if (group.source.extraction_status === "artist_review_completed") return "Review complete"
  return `${group.pendingCount} pending`
}

export function PassportUpdatesInbox() {
  const [groups, setGroups] = useState<PassportReviewGroup[]>([])
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

  const pendingClaims = useMemo(() => groups.flatMap((group) => group.claims).filter((claim) => pendingStatuses.has(claim.status)), [groups])
  const groupedByField = useMemo(() => {
    const map = new Map<string, PassportClaim[]>()
    for (const claim of pendingClaims) {
      const key = fieldLabel(claim)
      map.set(key, [...(map.get(key) ?? []), claim])
    }
    return Array.from(map.entries()).sort((left, right) => right[1].length - left[1].length)
  }, [pendingClaims])
  const safeClaims = pendingClaims.filter(safeClaim)
  const attentionCount = pendingClaims.filter((claim) => claim.relationship_status === "conflict" || claim.relationship_status === "duplicate" || claim.status === "needs_clarification").length

  async function approve(claim: PassportClaim) {
    setActiveId(claim.id)
    setError("")
    setMessage("")
    try {
      await confirmPassportClaim(claim, {
        value: edits[claim.id] ?? claim.proposed_value,
        visibility: "private",
        replaceExisting: claim.relationship_status === "conflict" && Boolean(claim.existing_record_id),
      })
      setMessage(`${fieldLabel(claim)} approved and added to the private Passport.`)
      void trackKleioProductEvent("proposal_approved", { surface: "passport_updates", metadata: { source: "document", section: claim.target_section, edited: (edits[claim.id] ?? claim.proposed_value) !== claim.proposed_value } })
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not approve this update.")
    } finally {
      setActiveId("")
    }
  }

  async function reject(claim: PassportClaim) {
    setActiveId(claim.id)
    setError("")
    setMessage("")
    try {
      await setPassportClaimDecision(claim.id, "rejected", "Artist rejected this suggestion.")
      setMessage("Suggestion rejected. The Passport was not changed.")
      void trackKleioProductEvent("proposal_rejected", { surface: "passport_updates", metadata: { source: "document", section: claim.target_section, reason: "artist_rejected" } })
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not reject this update.")
    } finally {
      setActiveId("")
    }
  }

  async function keepCurrent(claim: PassportClaim) {
    setActiveId(claim.id)
    setError("")
    setMessage("")
    try {
      await mergeDuplicateClaim(claim)
      setMessage("The current Passport value was kept and this document was linked as supporting evidence.")
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not keep the existing record.")
    } finally {
      setActiveId("")
    }
  }

  async function approveSafe() {
    if (!safeClaims.length) return
    setActiveId("bulk")
    setError("")
    setMessage("")
    try {
      const results = await bulkConfirmSafeClaims(safeClaims)
      setMessage(`${results.length} high-confidence factual update${results.length === 1 ? "" : "s"} approved. Narrative language, conflicts, and sensitive information remain for individual review.`)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not approve these updates.")
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
      setMessage(result.proposalCount ? `${result.proposalCount} field suggestion${result.proposalCount === 1 ? "" : "s"} prepared.` : "The document type was corrected. No supported field suggestion was created.")
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not reclassify this document.")
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
      setMessage(`${result.proposalCount} field suggestion${result.proposalCount === 1 ? "" : "s"} prepared.`)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not analyze this document again.")
    } finally {
      setActiveId("")
    }
  }

  return (
    <main className="h-full overflow-y-auto bg-white px-4 pb-8 pt-4 sm:px-6">
      <div className="mx-auto max-w-[920px]">
        <header className="border-b border-[#EEEAF6] pb-4">
          <Link href="/artist-dashboard/passport/" className="inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-[#5B4B8A]"><ArrowLeft className="size-3.5" />Creative Passport</Link>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Document suggestions</p>
              <h1 className="mt-1 font-serif text-2xl font-semibold tracking-[-0.03em] text-[#292631] sm:text-3xl">Review information by field</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#746E80]">Most suggestions now appear directly in the matching Passport field. Use this page for structured records, conflicts, duplicates, and document maintenance.</p>
            </div>
            <div className="flex flex-wrap gap-2"><Link href="/artist-dashboard/passport/" className={primary}><Sparkles className="size-4" />Review in fields</Link><Link href="/artist-dashboard/import/" className={secondary}><FileText className="size-4" />Upload PDF</Link></div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#746E80]"><span><strong className="text-[#292631]">{pendingClaims.length}</strong> waiting</span><span><strong className="text-[#292631]">{groupedByField.length}</strong> fields</span><span><strong className={attentionCount ? "text-amber-700" : "text-[#292631]"}>{attentionCount}</strong> need comparison</span></div>
        </header>

        {(error || message) && <div role={error ? "alert" : "status"} className={`mt-3 rounded-lg border px-3 py-2 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || message}</div>}

        {loading ? (
          <div className="flex items-center gap-2 border-b border-[#EEEAF6] py-5 text-sm text-[#746E80]"><Loader2 className="size-4 animate-spin" />Loading suggestions…</div>
        ) : pendingClaims.length === 0 ? (
          <section className="py-10 text-center"><Check className="mx-auto size-6 text-emerald-600" /><h2 className="mt-3 font-serif text-xl font-semibold">No suggestions are waiting</h2><p className="mx-auto mt-1 max-w-lg text-sm text-[#746E80]">Upload another document or continue editing your Passport manually.</p><Link href="/artist-dashboard/passport/" className={`${primary} mt-4`}>Return to Passport</Link></section>
        ) : (
          <>
            {safeClaims.length > 0 && (
              <div className="flex flex-col gap-2 border-b border-[#EEEAF6] py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-[#746E80]">{safeClaims.length} high-confidence factual update{safeClaims.length === 1 ? "" : "s"} can be approved together. Descriptions and conflicts stay individual.</p>
                <button type="button" className={secondary} disabled={activeId === "bulk"} onClick={() => void approveSafe()}>{activeId === "bulk" ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}Approve safe facts</button>
              </div>
            )}

            <div className="divide-y divide-[#EEEAF6]">
              {groupedByField.map(([label, fieldClaims]) => (
                <section key={label} className="py-5" aria-labelledby={`field-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}>
                  <div className="mb-3 flex items-center justify-between gap-3"><h2 id={`field-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`} className="font-serif text-xl font-semibold text-[#292631]">{label}</h2><span className="rounded-full bg-[#EEE9F8] px-2.5 py-1 text-[0.68rem] font-semibold text-[#5B4B8A]">{fieldClaims.length}</span></div>
                  <div className="divide-y divide-[#EEEAF6] border-y border-[#EEEAF6]">
                    {fieldClaims.map((claim) => {
                      const busy = activeId === claim.id
                      const draft = edits[claim.id] ?? claim.artist_edited_value || claim.proposed_value
                      const conflict = claim.relationship_status === "conflict"
                      const duplicate = claim.relationship_status === "duplicate"
                      return (
                        <article key={claim.id} className="py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[0.7rem] text-[#746E80]">
                            <p className="min-w-0 truncate"><span className="font-semibold text-[#5B4B8A]">{sourceLabel(claim)}</span>{claim.page_number ? ` · page ${claim.page_number}` : ""}</p>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${conflict ? "bg-amber-100 text-amber-800" : duplicate ? "bg-blue-100 text-blue-800" : "bg-[#F7F4FF] text-[#6F6882]"}`}>{conflict ? <AlertTriangle className="size-3" /> : duplicate ? <CopyCheck className="size-3" /> : null}{confidenceLabel(claim)}</span>
                          </div>
                          <textarea className={`${textarea} mt-2`} rows={Math.min(6, Math.max(2, draft.split("\n").length + 1))} value={draft} onChange={(event) => setEdits((current) => ({ ...current, [claim.id]: event.target.value }))} />
                          {claim.existing_record && <details className="mt-2 text-xs text-[#746E80]"><summary className="cursor-pointer font-semibold text-[#6A5896]">Compare current Passport value</summary><p className="mt-2 whitespace-pre-wrap rounded-lg bg-[#FAF9FD] px-3 py-2 leading-5">{claim.existing_record.display_value}</p></details>}
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <details className="text-xs text-[#746E80]"><summary className="cursor-pointer inline-flex items-center gap-1 font-semibold text-[#6A5896]"><FileSearch className="size-3.5" />View source evidence</summary><div className="mt-2 max-w-2xl rounded-lg bg-[#FAF9FD] px-3 py-2 leading-5"><p>{claim.evidence_excerpt || "No readable excerpt was returned. Open the original document before approving."}</p><p className="mt-1 text-[0.68rem] text-[#8A8296]">{claim.extraction_method.replaceAll("_", " ")}</p></div></details>
                            <div className="flex flex-wrap gap-1.5">{duplicate && <button type="button" className={quiet} disabled={busy} onClick={() => void keepCurrent(claim)}><Check className="size-3.5" />Keep current</button>}<button type="button" className={quiet} disabled={busy} onClick={() => void reject(claim)}><X className="size-3.5" />Reject</button><button type="button" className={primary} disabled={busy || !draft.trim()} onClick={() => void approve(claim)}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}{conflict ? "Approve replacement" : "Approve"}</button></div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}

        {groups.length > 0 && (
          <details className="mt-5 border-t border-[#EEEAF6] pt-4">
            <summary className="cursor-pointer text-sm font-semibold text-[#5B4B8A]">Document classification and reanalysis</summary>
            <div className="mt-3 divide-y divide-[#EEEAF6] border-y border-[#EEEAF6]">
              {groups.map((group) => (
                <div key={group.source.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-[#292631]">{group.source.original_filename || group.source.label}</p><p className="mt-0.5 text-xs text-[#746E80]">{sourceStatus(group)}</p></div>
                  <div className="flex flex-wrap gap-2"><select className="h-9 rounded-lg border border-[#D8D0F2] bg-white px-2 text-xs text-[#5B4B8A]" value={group.source.classification} disabled={activeId === group.source.id} onChange={(event) => void classify(group.source.id, event.target.value as SourceClassification)}>{SOURCE_CLASSIFICATION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><button type="button" className={secondary} disabled={activeId === group.source.id} onClick={() => void retry(group)}>{activeId === group.source.id ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}Analyze again</button></div>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </main>
  )
}
