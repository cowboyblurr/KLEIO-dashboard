"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, Check, ChevronDown, Clock3, FileSearch, Flag, Loader2, PenLine, Sparkles, X } from "lucide-react"
import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import {
  scanAllowsTextOrganization,
  websiteFunctionMessage,
  type WebsiteScanSession,
  type WebsiteScanSummary,
} from "@/lib/kleio-website-scan-api"

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3 py-2 text-xs font-semibold text-[#5B4B8A] transition hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:opacity-50"
const textarea = "min-h-24 w-full resize-y rounded-xl border border-[#DED7EF] bg-white px-3 py-2 text-sm leading-6 text-[#292631] outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12"
const professionalHistoryFields = new Set([
  "education", "solo_exhibitions", "group_exhibitions", "other_exhibitions", "residencies", "awards",
  "grants_and_fellowships", "publications", "press", "collections", "commissions", "talks_and_panels",
  "teaching_and_professional_experience", "memberships",
])

type OrganizedItem = {
  proposed_value?: { raw?: string; fields?: Array<{ name: string; value: string }> }
  display_value?: string
  source_page_ref?: string
  source_url?: string
  source_excerpt?: string
  evidence_image_refs?: string[]
  classification?: "extracted" | "normalized" | "ai_suggested" | "conflicting" | "uncertain"
  confidence?: "high" | "medium" | "low"
  requires_artist_confirmation?: boolean
  reason?: string
}
type ProposalRow = {
  id: string
  target_field: string
  proposed_value: string
  artist_edited_value: string
  status: "proposed" | "approved" | "edited_approved" | "rejected" | "deferred" | "conflicting" | "needs_clarification"
  normalized_value: OrganizedItem & { category?: string }
  evidence_excerpt: string
  evidence_location: { source_page_ref?: string; source_url?: string; evidence_image_refs?: string[] }
  confidence: number | null
}
type Capability = {
  configured: boolean
  model: string
  privacy_boundary: string
  daily_limit: number
  per_session_limit: number
}
type Conflict = { field: string; values: string[]; evidence_refs: string[]; explanation: string }
type MissingInformation = { field: string; reason: string }
type Coverage = {
  pages_discovered: number
  pages_collected: number
  pages_skipped: number
  image_candidates: number
}
type RunSummary = {
  coverage?: Coverage
  proposal_count?: number
  professional_history_count?: number
  likely_artwork_count?: number
  conflict_count?: number
  uncertain_count?: number
  organized_output?: { conflicts?: Conflict[]; missing_information?: MissingInformation[]; limitations?: string[] }
}

const categoryLabels: Record<string, string> = {
  identity: "Identity", biography: "Biography", artist_statement: "Artist statement", practice_description: "Practice description",
  disciplines: "Disciplines", mediums: "Mediums", education: "Education", solo_exhibitions: "Solo exhibitions",
  group_exhibitions: "Group exhibitions", other_exhibitions: "Other exhibitions", residencies: "Residencies", awards: "Awards",
  grants_and_fellowships: "Grants and fellowships", publications: "Publications", press: "Press", collections: "Collections",
  commissions: "Commissions", talks_and_panels: "Talks and panels", teaching_and_professional_experience: "Teaching and professional experience",
  memberships: "Memberships", artworks: "Artwork evidence",
}

function classificationLabel(value?: OrganizedItem["classification"]) {
  if (value === "extracted") return "Copied from website"
  if (value === "normalized") return "Cleaned and organized"
  if (value === "ai_suggested") return "Possible interpretation"
  if (value === "conflicting") return "Conflicting information"
  return "Needs artist confirmation"
}
function statusLabel(value: ProposalRow["status"]) {
  if (value === "approved") return "Accepted"
  if (value === "edited_approved") return "Edited and accepted"
  if (value === "rejected") return "Rejected"
  if (value === "deferred") return "Deferred"
  if (value === "conflicting") return "Conflict review"
  if (value === "needs_clarification") return "Needs confirmation"
  return "Awaiting review"
}
function scanMetrics(summary?: WebsiteScanSummary) {
  if (!summary) return []
  return [
    ["Pages discovered", summary.pages_discovered || 0],
    ["Pages collected", summary.pages_collected || 0],
    ["Pages skipped", summary.pages_skipped || 0],
    ["Pages blocked", summary.pages_blocked || 0],
    ["Text sections found", summary.text_sections_found || 0],
    ["Structured data found", summary.structured_data_found || 0],
    ["Valid images found", summary.valid_images_found || 0],
    ["Weak candidates rejected", summary.weak_candidates_rejected || 0],
  ] as const
}

export function WebsiteOrganizationAssist() {
  const [session, setSession] = useState<WebsiteScanSession | null>(null)
  const [capability, setCapability] = useState<Capability | null>(null)
  const [proposals, setProposals] = useState<ProposalRow[]>([])
  const [summary, setSummary] = useState<RunSummary>({})
  const [editing, setEditing] = useState("")
  const [editValue, setEditValue] = useState("")
  const [working, setWorking] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  const loadLatest = useCallback(async () => {
    const account = await loadKleioAccount()
    if (!account || account.profile.role !== "artist") return
    const supabase = getSupabaseBrowserClient()
    const { data: latest } = await supabase
      .from("artist_website_import_sessions")
      .select("id,artist_user_id,canonical_url,website_url,status,pages,profile_suggestions,image_candidates,imported_source_ids,rights_confirmed_at,error_code,extractor_version,expires_at,created_at,updated_at,scan_summary,dismissed_at")
      .eq("artist_user_id", account.user.id)
      .in("status", ["review_ready", "limited_review", "image_only_review", "manual_input_recommended", "blocked", "failed", "completed"])
      .is("dismissed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!latest) {
      setSession(null)
      setProposals([])
      setSummary({})
      return
    }
    const next = latest as WebsiteScanSession
    setSession((current) => current?.id === next.id ? { ...current, ...next } : next)
    const { data: run } = await supabase
      .from("artist_extraction_jobs")
      .select("id,summary,status")
      .eq("artist_user_id", account.user.id)
      .eq("website_import_session_id", next.id)
      .eq("action", "organize_website_evidence")
      .eq("status", "ready_for_review")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!run) {
      setProposals([])
      setSummary({})
      return
    }
    const { data: rows } = await supabase
      .from("artist_import_proposals")
      .select("id,target_field,proposed_value,artist_edited_value,status,normalized_value,evidence_excerpt,evidence_location,confidence")
      .eq("artist_user_id", account.user.id)
      .eq("extraction_job_id", run.id)
      .order("created_at", { ascending: true })
    setProposals((rows || []) as ProposalRow[])
    setSummary((run.summary || {}) as RunSummary)
  }, [])

  useEffect(() => {
    let active = true
    const supabase = getSupabaseBrowserClient()
    void loadKleioAccount().then(async (account) => {
      if (!active || !account || account.profile.role !== "artist") return
      const { data } = await supabase.functions.invoke("organize-website-evidence", { body: { action: "capabilities" } })
      if (active && data) setCapability(data as Capability)
      await loadLatest()
    })
    const timer = window.setInterval(() => { void loadLatest() }, 5_000)
    return () => { active = false; window.clearInterval(timer) }
  }, [loadLatest])

  const grouped = useMemo(() => {
    const map = new Map<string, ProposalRow[]>()
    proposals.forEach((proposal) => map.set(proposal.target_field, [...(map.get(proposal.target_field) || []), proposal]))
    return [...map.entries()]
  }, [proposals])
  const canOrganize = Boolean(session && scanAllowsTextOrganization(session))
  const scanSummary = session?.scan_summary
  const metrics = scanMetrics(scanSummary)
  const organized = summary.organized_output || {}
  const conflicts = organized.conflicts || []
  const missing = organized.missing_information || []
  const limitations = organized.limitations || []
  const reviewed = proposals.filter((item) => ["approved", "edited_approved", "rejected", "deferred"].includes(item.status)).length
  const professionalHistoryCount = summary.professional_history_count ?? proposals.filter((item) => professionalHistoryFields.has(item.target_field)).length
  const likelyArtworkCount = summary.likely_artwork_count ?? proposals.filter((item) => item.target_field === "artworks").length
  const uncertainCount = summary.uncertain_count ?? proposals.filter((item) => item.normalized_value?.classification === "uncertain").length

  async function organize(force = false) {
    if (!session || !canOrganize || working) return
    setWorking("organize")
    setError("")
    setNotice("Organizing only the public evidence KLEIO already collected. The website is not being re-crawled.")
    const supabase = getSupabaseBrowserClient()
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("organize-website-evidence", {
        body: { action: "organize_website_evidence", website_import_session_id: session.id, force_reanalysis: force },
      })
      if (invokeError) throw invokeError
      if (data?.error) throw new Error(String(data.error))
      setProposals((data?.proposals || []) as ProposalRow[])
      setSummary((data?.run?.summary || { coverage: data?.coverage, organized_output: data?.result }) as RunSummary)
      setNotice(data?.cached ? "A compatible source-backed result was reused without another Gemini call." : "Organization complete. Review every proposal before it can move forward.")
    } catch (reason) {
      setError(await websiteFunctionMessage(reason, "Website evidence could not be organized."))
      setNotice("")
    } finally {
      setWorking("")
    }
  }

  async function decide(
    proposal: ProposalRow,
    status: "approved" | "rejected" | "deferred" | "edited_approved",
    editedValue = "",
    decisionReason = "Artist reviewed this website proposal.",
  ) {
    if (working) return
    setWorking(proposal.id)
    setError("")
    const supabase = getSupabaseBrowserClient()
    try {
      const { data, error: updateError } = await supabase
        .from("artist_import_proposals")
        .update({
          status,
          artist_edited_value: status === "edited_approved" ? editedValue.trim() : proposal.artist_edited_value || "",
          decided_at: new Date().toISOString(),
          decision_reason: decisionReason,
        })
        .eq("id", proposal.id)
        .select("id,target_field,proposed_value,artist_edited_value,status,normalized_value,evidence_excerpt,evidence_location,confidence")
        .single()
      if (updateError) throw updateError
      setProposals((current) => current.map((item) => item.id === proposal.id ? data as ProposalRow : item))
      setEditing("")
      setEditValue("")
      setNotice(status === "approved" || status === "edited_approved"
        ? "Accepted for the existing Passport review workflow. Nothing was published or submitted."
        : status === "rejected" ? "Proposal marked incorrect and rejected." : "Proposal deferred for more context.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The review decision could not be saved.")
    } finally {
      setWorking("")
    }
  }

  return (
    <section className="rounded-[28px] border border-[#E2DCF1] bg-[linear-gradient(145deg,#F8F5FF,#FFFFFF)] p-5 shadow-[0_22px_70px_rgba(82,64,130,0.07)] sm:p-7" aria-labelledby="website-organization-title">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Passport updates for review</p><h2 id="website-organization-title" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#292631]">Organize the active website scan</h2><p className="mt-3 text-sm leading-7 text-[#746E80]">Gemini classifies only the public evidence KLEIO collected. It does not crawl the website, access private KLEIO files, or save information to the Creative Passport automatically.</p></div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#D8D0F2] bg-white px-3 py-1.5 text-xs font-semibold text-[#625C70]"><Sparkles className="size-4 text-[#6A5896]" />{capability?.configured ? capability.model : "Manual review remains available"}</span>
      </div>

      <div className="mt-5 rounded-2xl border border-[#E7E1F7] bg-white p-4">
        {session ? <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Active deterministic scan</p><p className="mt-1 break-all text-sm font-semibold text-[#292631]">{session.canonical_url || session.website_url}</p><p className="mt-1 text-xs leading-5 text-[#81788E]">Scan outcome: {session.status.replaceAll("_", " ")} · Nothing has been saved to the Creative Passport</p></div><div className="flex flex-wrap gap-2"><button className={primary} disabled={!capability?.configured || !canOrganize || working === "organize"} onClick={() => void organize(false)}>{working === "organize" ? <Loader2 className="size-4 animate-spin" /> : <FileSearch className="size-4" />}{proposals.length ? "Reuse or refresh organization" : "Organize collected evidence"}</button>{proposals.length > 0 && <button className={secondary} disabled={Boolean(working) || !canOrganize} onClick={() => void organize(true)}>Run a new review</button>}</div></div> : <p className="text-sm leading-6 text-[#746E80]">Complete a Website Import Assist scan. Dismissed and expired scans will not reappear here.</p>}
      </div>

      {session && !canOrganize && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Not enough public website material was collected.</strong><p className="mt-1">KLEIO cannot send this scan to Gemini because it contains no usable biography, statement, practice, history, or artwork text. Try a direct About, Portfolio, Work, or CV page, paste public text, upload a CV or statement, use Google Drive, or continue manually.</p></div>}
      <p className="mt-3 text-xs leading-5 text-[#81788E]">{capability?.privacy_boundary || "AI organization currently processes public website material only. Private KLEIO materials remain outside this workflow."}</p>
      {notice && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status" aria-live="polite">{notice}</p>}
      {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900" role="alert">{error}</p>}

      {metrics.length > 0 && <details className="mt-5 rounded-2xl border border-[#E7E1F7] bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-[#5B4B8A]">What KLEIO reviewed</summary><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(([label, value]) => <div key={label} className="rounded-xl bg-[#FAF9FD] p-3"><p className="text-xl font-semibold text-[#292631]">{value}</p><p className="mt-1 text-xs text-[#746E80]">{label}</p></div>)}</div><div className="mt-4 grid gap-2 text-xs leading-5 text-[#746E80]"><p><strong className="text-[#292631]">Collection methods:</strong> {(scanSummary?.extraction_methods || []).join(", ") || "Public HTML"}</p><p><strong className="text-[#292631]">JavaScript rendering:</strong> {(scanSummary?.javascript_rendering || "not_required").replaceAll("_", " ")}</p><p><strong className="text-[#292631]">Gemini called during scan:</strong> {scanSummary?.gemini_called ? "Yes" : "No"}</p>{(scanSummary?.limitations || []).map((item, index) => <p key={`${item}-${index}`}>• {item}</p>)}</div></details>}

      {proposals.length > 0 && <div className="mt-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="font-serif text-2xl font-semibold">Reviewable proposals</h3><p className="mt-1 text-sm text-[#746E80]">{reviewed} of {proposals.length} decisions recorded · {professionalHistoryCount} professional-history entries · {likelyArtworkCount} likely artwork proposals · {uncertainCount} uncertain items</p></div></div><div className="mt-4 grid gap-5">{grouped.map(([category, items]) => <section key={category} className="rounded-2xl border border-[#E7E1F7] bg-white p-4 sm:p-5" aria-labelledby={`website-category-${category}`}><h4 id={`website-category-${category}`} className="font-serif text-xl font-semibold">{categoryLabels[category] || category.replaceAll("_", " ")}</h4><div className="mt-4 grid gap-3">{items.map((proposal) => { const item = proposal.normalized_value || {}; const busy = working === proposal.id; const proposalText = proposal.artist_edited_value || proposal.proposed_value; return <article key={proposal.id} className="rounded-2xl border border-[#E7E1F7] bg-[#FCFBFE] p-4"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-[#D8D0F2] bg-white px-2.5 py-1 text-[0.68rem] font-semibold text-[#5B4B8A]">{classificationLabel(item.classification)}</span><span className="rounded-full border border-[#E7E1F7] bg-white px-2.5 py-1 text-[0.68rem] text-[#746E80]">{item.confidence || "low"} confidence</span><span className="ml-auto text-xs font-semibold text-[#746E80]">{statusLabel(proposal.status)}</span></div>{editing === proposal.id ? <div className="mt-3"><label className="grid gap-1.5 text-xs font-semibold text-[#625C70]">Edit proposal<textarea className={textarea} value={editValue} onChange={(event) => setEditValue(event.target.value)} /></label><div className="mt-3 flex flex-wrap gap-2"><button className={primary} disabled={!editValue.trim() || busy} onClick={() => void decide(proposal, "edited_approved", editValue, "Artist edited and accepted this website proposal.")}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Edit and accept</button><button className={secondary} onClick={() => { setEditing(""); setEditValue("") }}>Cancel</button></div></div> : <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#292631]">{proposalText}</p>}{item.reason && <p className="mt-2 text-xs leading-5 text-[#81788E]">{item.reason}</p>}<details className="mt-3 rounded-xl border border-[#E7E1F7] bg-white p-3"><summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-[#5B4B8A]"><ChevronDown className="size-4" />View source</summary><div className="mt-3 grid gap-2 text-xs leading-5 text-[#746E80]"><p><strong className="text-[#292631]">Source:</strong> {item.source_page_ref || proposal.evidence_location?.source_page_ref}</p><p className="break-all"><strong className="text-[#292631]">URL:</strong> {item.source_url || proposal.evidence_location?.source_url}</p><blockquote className="border-l-2 border-[#C9BCE8] pl-3 text-[#625C70]">{item.source_excerpt || proposal.evidence_excerpt || "Image-backed suggestion; no textual excerpt was used."}</blockquote>{Boolean(item.evidence_image_refs?.length) && <p><strong className="text-[#292631]">Images:</strong> {item.evidence_image_refs?.join(", ")}</p>}</div></details>{editing !== proposal.id && <div className="mt-4 flex flex-wrap gap-2"><button className={secondary} disabled={busy} onClick={() => void decide(proposal, "approved", "", "Artist accepted this website proposal.")}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Accept</button><button className={secondary} disabled={busy} onClick={() => { setEditing(proposal.id); setEditValue(proposalText) }}><PenLine className="size-4" />Edit</button><button className={secondary} disabled={busy} onClick={() => void decide(proposal, "rejected", "", "Artist rejected this website proposal.")}><X className="size-4" />Reject</button><button className={secondary} disabled={busy} onClick={() => void decide(proposal, "rejected", "", "Artist marked this website proposal as incorrect.")}><Flag className="size-4" />Mark as incorrect</button><button className={secondary} disabled={busy} onClick={() => void decide(proposal, "deferred", "", "Artist reported missing context and deferred this website proposal.")}><AlertTriangle className="size-4" />Report missing context</button><button className={secondary} disabled={busy} onClick={() => void decide(proposal, "deferred", "", "Artist deferred this website proposal.")}><Clock3 className="size-4" />Defer</button></div>}</article> })}</div></section>)}</div></div>}

      {(conflicts.length > 0 || missing.length > 0 || limitations.length > 0) && <div className="mt-6 grid gap-4 lg:grid-cols-3"><section className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><h3 className="flex items-center gap-2 text-sm font-semibold text-amber-950"><AlertTriangle className="size-4" />Conflicting information</h3><ul className="mt-3 grid gap-2 text-xs leading-5 text-amber-900">{conflicts.length ? conflicts.map((item, index) => <li key={`${item.field}-${index}`}><strong>{item.field}:</strong> {item.explanation}</li>) : <li>No conflicts reported.</li>}</ul></section><section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-sm font-semibold">Missing information</h3><ul className="mt-3 grid gap-2 text-xs leading-5 text-[#746E80]">{missing.length ? missing.map((item, index) => <li key={`${item.field}-${index}`}><strong className="text-[#292631]">{item.field}:</strong> {item.reason}</li>) : <li>No missing-information notes.</li>}</ul></section><section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-sm font-semibold">Scan limitations</h3><ul className="mt-3 grid gap-2 text-xs leading-5 text-[#746E80]">{limitations.length ? limitations.map((item, index) => <li key={`${item}-${index}`}>{item}</li>) : <li>Organization covers only the evidence KLEIO collected.</li>}</ul></section></div>}
    </section>
  )
}
