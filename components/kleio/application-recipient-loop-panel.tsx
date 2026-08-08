"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileCheck2,
  Loader2,
  Mail,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"
import {
  approvalsComplete,
  loadArtistApplicationPackage,
  loadArtistSubmissionAttempts,
  prepareApplicationAlignment,
  recordArtistSubmissionSignal,
  saveApplicationAlignment,
  type ArtistApplicationPackage,
  type ArtistSubmissionAttempt,
} from "@/lib/kleio-recipient-artist-actions"
import {
  buildMailtoHref,
  createRecipientReviewAccess,
  loadRecipientEvents,
  loadRecipientTrackingSummary,
  recipientReviewUrl,
  revokeRecipientReviewAccess,
  type RecipientEvent,
  type RecipientTrackingSummary,
} from "@/lib/kleio-recipient-application"
import { loadOpportunityDirectoryWithSources } from "@/lib/kleio-opportunity-presentation"
import type { OpportunityDirectoryItem } from "@/lib/kleio-opportunity-data"

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] disabled:cursor-not-allowed disabled:opacity-50"

const EMPTY_TRACKING: RecipientTrackingSummary = {
  active_access_id: null,
  access_created_at: null,
  access_expires_at: null,
  review_room_opens: 0,
  first_opened_at: null,
  last_opened_at: null,
  receipt_confirmed: false,
  conversation_started: false,
}

type OpportunityWithSubmission = OpportunityDirectoryItem & {
  submission_email?: string
  submission_method?: string
  submission_instructions?: string
  data_scope?: "real" | "guided_demo" | "synthetic_test"
}

function display(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function timelineLabel(event: RecipientEvent | ArtistSubmissionAttempt) {
  if ("event_type" in event) return display(event.event_type)
  return display(event.status)
}

function timelineEvidence(event: RecipientEvent | ArtistSubmissionAttempt) {
  if ("evidence_level" in event) return display(event.evidence_level)
  if (event.status === "artist_reported") return "Self Reported"
  return "System Observed"
}

function trackingLabel(reference: string) {
  return reference ? `KLEIO-${reference.slice(0, 8).toUpperCase()}` : "Created with handoff"
}

export function ApplicationRecipientLoopPanel() {
  const searchParams = useSearchParams()
  const opportunityId = searchParams.get("opportunity")?.trim() ?? ""
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(Boolean(opportunityId))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [item, setItem] = useState<OpportunityWithSubmission | null>(null)
  const [packageRecord, setPackageRecord] = useState<ArtistApplicationPackage | null>(null)
  const [attempts, setAttempts] = useState<ArtistSubmissionAttempt[]>([])
  const [events, setEvents] = useState<RecipientEvent[]>([])
  const [tracking, setTracking] = useState<RecipientTrackingSummary>(EMPTY_TRACKING)
  const [handoffUrl, setHandoffUrl] = useState("")
  const [handoffAccessId, setHandoffAccessId] = useState("")
  const [alignmentOpen, setAlignmentOpen] = useState(false)

  async function refresh() {
    if (!opportunityId) return
    setLoading(true)
    setError("")
    try {
      const directory = await loadOpportunityDirectoryWithSources({ limit: 100 })
      const opportunity = directory.items.find((candidate) => candidate.id === opportunityId) as OpportunityWithSubmission | undefined
      if (!opportunity) throw new Error("This opportunity is not available in the current approved directory.")
      const stored = await loadArtistApplicationPackage(opportunityId)
      setItem(opportunity)
      setPackageRecord(stored)
      if (stored) {
        const [submissionAttempts, recipientEvents, recipientTracking] = await Promise.all([
          loadArtistSubmissionAttempts(stored.id),
          loadRecipientEvents(stored.id).catch(() => []),
          loadRecipientTrackingSummary(stored.id),
        ])
        setAttempts(submissionAttempts)
        setEvents(recipientEvents)
        setTracking(recipientTracking)
      } else {
        setAttempts([])
        setEvents([])
        setTracking(EMPTY_TRACKING)
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load the recipient workflow.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [opportunityId])

  useEffect(() => {
    if (!open) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [open])

  const selectedWorks = useMemo(() => {
    if (!item || !packageRecord) return []
    const snapshots = Array.isArray(packageRecord.written_content?.selected_work_ids)
      ? packageRecord.written_content.selected_work_ids.map(String)
      : []
    return snapshots.length ? [] : []
  }, [item, packageRecord])

  const alignment = useMemo(() => {
    if (!item) return null
    const packagePortfolio = packageRecord?.written_content?.portfolio_snapshot
    void packagePortfolio
    return prepareApplicationAlignment(item, null, selectedWorks)
  }, [item, packageRecord, selectedWorks])

  const approved = Boolean(packageRecord?.artist_approved_at && approvalsComplete(packageRecord.approval_confirmations))
  const isSynthetic = item?.data_scope === "synthetic_test" || packageRecord?.data_scope === "synthetic_test"
  const recipient = item?.submission_email || packageRecord?.external_destination || packageRecord?.email_preview?.to || ""
  const attachmentLabels = packageRecord?.email_preview?.attachments ?? []
  const latestTrackingAttempt = attempts.find((attempt) => attempt.method === "secure_review" && Boolean(attempt.provider_reference))
  const trackingReference = handoffAccessId || tracking.active_access_id || latestTrackingAttempt?.provider_reference || ""
  const combinedTimeline = useMemo(() => {
    return [...events, ...attempts]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 12)
  }, [attempts, events])

  async function createTrackedHandoff() {
    if (!packageRecord) throw new Error("Save the application package before preparing the recipient handoff.")
    if (!approved) throw new Error("Review and approve the application again before preparing recipient access.")
    if (tracking.active_access_id && !handoffUrl) {
      throw new Error("A tracked recipient handoff is already active. KLEIO will not silently replace an issued recipient link. Revoke access first only if you intentionally need a fresh handoff.")
    }
    const access = await createRecipientReviewAccess(packageRecord.id)
    const url = recipientReviewUrl(access.token)
    setHandoffUrl(url)
    setHandoffAccessId(access.access_id)
    await recordArtistSubmissionSignal({
      packageId: packageRecord.id,
      method: "secure_review",
      status: "package_exported",
      destination: recipient,
      providerReference: access.access_id,
      responseSnapshot: {
        internal_tracking_reference: access.access_id,
        tracked_review_access_created: true,
        expires_at: access.expires_at,
        data_scope: access.data_scope,
      },
    })
    return { url, accessId: access.access_id }
  }

  async function openEmailClient() {
    if (!packageRecord || !item) return
    setBusy(true)
    setError("")
    setStatus("")
    try {
      if (!recipient) throw new Error("No submission email is available. Confirm or correct the detected address before continuing.")
      if (!approved) throw new Error("Artist approval is required before opening the external email draft.")
      const handoff = handoffUrl
        ? { url: handoffUrl, accessId: handoffAccessId || tracking.active_access_id || latestTrackingAttempt?.provider_reference || "" }
        : await createTrackedHandoff()
      const subject = packageRecord.email_preview?.subject || `Application — ${item.title}`
      const body = packageRecord.email_preview?.body || String(packageRecord.written_content.email_introduction ?? "")
      const href = buildMailtoHref({ recipient, subject, body, reviewUrl: handoff.url })
      await recordArtistSubmissionSignal({
        packageId: packageRecord.id,
        method: "mailto",
        status: "email_client_opened",
        destination: recipient,
        providerReference: handoff.accessId,
        requestSnapshot: {
          recipient_prefilled: true,
          subject_prefilled: true,
          body_prefilled: true,
          tracked_review_access_included: true,
          internal_tracking_reference: handoff.accessId,
          attachment_count: attachmentLabels.length,
          attachments_automatically_added: false,
        },
      })
      setStatus("Tracked email handoff prepared. KLEIO manages the secure review access internally; this confirms only the email-app handoff, not that the email was sent, delivered, opened, or read.")
      await refresh()
      window.location.href = href
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to prepare the tracked email handoff.")
    } finally {
      setBusy(false)
    }
  }

  async function revokeLink() {
    if (!packageRecord) return
    setBusy(true)
    setError("")
    try {
      await revokeRecipientReviewAccess(packageRecord.id)
      setHandoffUrl("")
      setHandoffAccessId("")
      setStatus("Recipient access revoked. Previously issued secure review access will no longer open the application.")
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to revoke recipient access.")
    } finally {
      setBusy(false)
    }
  }

  async function applyAlignment() {
    if (!packageRecord || !alignment?.introduction) return
    setBusy(true)
    setError("")
    try {
      await saveApplicationAlignment(packageRecord.id, alignment)
      setStatus("Evidence-backed introduction added as Prepared for review. Because application content changed, KLEIO cleared the prior approval and requires a new final review.")
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save the suggested introduction.")
    } finally {
      setBusy(false)
    }
  }

  if (!opportunityId) return null

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#332A4D] px-5 text-sm font-semibold text-white shadow-[0_18px_48px_rgba(51,42,77,0.3)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/30">
        <MessageSquareText className="size-4" />Recipient workflow
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-[#201A2E]/35 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="recipient-loop-title" className="ml-auto flex h-full w-full max-w-[620px] flex-col overflow-hidden rounded-3xl border border-[#E7E1F7] bg-[#F9F8FC] shadow-[0_30px_90px_rgba(32,26,46,0.28)]">
            <header className="flex items-start justify-between gap-4 border-b border-[#E7E1F7] bg-white p-5 sm:p-6">
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7F6EB4]">Premium application handoff</p><h2 id="recipient-loop-title" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.03em]">Recipient review and conversation</h2></div>
              <button type="button" aria-label="Close recipient workflow" onClick={() => setOpen(false)} className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#E7E1F7] bg-white text-[#5B4B8A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"><X className="size-4" /></button>
            </header>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
              {loading && <div role="status" className="flex items-center gap-2 rounded-2xl border border-[#E7E1F7] bg-white p-4 text-sm text-[#746E80]"><Loader2 className="size-4 animate-spin" />Loading application state…</div>}
              {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
              {status && <div role="status" aria-live="polite" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{status}</div>}

              {!loading && item && (
                <>
                  <section className="rounded-2xl border border-[#E7E1F7] bg-white p-5">
                    <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#F7F4FF] px-3 py-1 text-xs font-semibold text-[#5B4B8A]">{display(packageRecord?.state || "package not saved")}</span>{isSynthetic && <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Internal synthetic test</span>}</div>
                    <h3 className="mt-3 font-serif text-2xl font-semibold">{item.title}</h3>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div><dt className="text-xs font-semibold uppercase tracking-wide text-[#8A8296]">Detected recipient</dt><dd className="mt-1 break-all font-medium">{recipient || "Not detected"}</dd></div>
                      <div><dt className="text-xs font-semibold uppercase tracking-wide text-[#8A8296]">Source evidence</dt><dd className="mt-1 leading-6">{item.submission_instructions || "Review the source before confirming this address."}</dd></div>
                    </dl>
                    <div className={`mt-4 rounded-xl border p-3 text-sm ${approved ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}><span className="inline-flex items-center gap-2 font-semibold">{approved ? <CheckCircle2 className="size-4" /> : <ShieldCheck className="size-4" />}{approved ? "Artist-approved and eligible for recipient access" : "Final artist approval required"}</span></div>
                  </section>

                  <section className="rounded-2xl border border-[#E7E1F7] bg-white p-5">
                    <button type="button" className="flex w-full items-center justify-between gap-4 text-left" onClick={() => setAlignmentOpen((value) => !value)} aria-expanded={alignmentOpen}>
                      <span><span className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-[#6A5896]" />Opportunity-specific introduction</span><span className="mt-1 block text-xs leading-5 text-[#746E80]">Evidence is mapped to approved Passport content; weak connections are not presented as facts.</span></span>
                      <ChevronDown className={`size-4 shrink-0 transition-transform ${alignmentOpen ? "rotate-180" : ""}`} />
                    </button>
                    {alignmentOpen && (
                      <div className="mt-4 space-y-3">
                        {alignment?.introduction ? <pre className="whitespace-pre-wrap rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] p-4 font-sans text-sm leading-6">{alignment.introduction}</pre> : <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{alignment?.missingContext.join(" ") || "Complete the Passport and select works before generating a defensible introduction."}</p>}
                        {alignment?.evidence.filter((entry) => entry.supported).map((entry) => <div key={`${entry.theme}-${entry.artistSourceLabel}`} className="rounded-xl border border-[#E7E1F7] p-3 text-xs leading-5"><p className="font-semibold">{entry.theme} · {entry.confidence}</p><p className="mt-1"><strong>Opportunity:</strong> {entry.opportunitySource}</p><p className="mt-1"><strong>{entry.artistSourceLabel}:</strong> {entry.artistEvidence}</p></div>)}
                        <button type="button" className={secondary} disabled={busy || !packageRecord || !alignment?.introduction} onClick={() => void applyAlignment()}><Sparkles className="size-4" />Use as Prepared for review</button>
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-[#E7E1F7] bg-white p-5">
                    <h3 className="text-sm font-semibold">Internal submission tracking</h3>
                    <p className="mt-2 text-sm leading-6 text-[#746E80]">KLEIO creates and manages the secure recipient access behind the handoff. The artist sees the tracking identity and activity—not a raw URL to copy around.</p>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-[#FAF9FD] p-3"><dt className="text-[0.68rem] font-semibold uppercase tracking-wide text-[#8A8296]">Tracking reference</dt><dd className="mt-1 font-mono text-sm font-semibold text-[#4F416F]">{trackingLabel(trackingReference)}</dd></div>
                      <div className="rounded-xl bg-[#FAF9FD] p-3"><dt className="text-[0.68rem] font-semibold uppercase tracking-wide text-[#8A8296]">Opportunity</dt><dd className="mt-1 text-sm font-semibold">{item.title}</dd></div>
                      <div className="rounded-xl bg-[#FAF9FD] p-3"><dt className="text-[0.68rem] font-semibold uppercase tracking-wide text-[#8A8296]">Review Room opens</dt><dd className="mt-1 text-2xl font-semibold text-[#403653]">{tracking.review_room_opens}</dd></div>
                      <div className="rounded-xl bg-[#FAF9FD] p-3"><dt className="text-[0.68rem] font-semibold uppercase tracking-wide text-[#8A8296]">Conversation</dt><dd className="mt-1 text-sm font-semibold">{tracking.conversation_started ? "Started" : tracking.receipt_confirmed ? "Receipt confirmed" : "Not started"}</dd></div>
                      <div className="rounded-xl bg-[#FAF9FD] p-3"><dt className="text-[0.68rem] font-semibold uppercase tracking-wide text-[#8A8296]">First opened</dt><dd className="mt-1 text-sm">{tracking.first_opened_at ? formatDate(tracking.first_opened_at) : "Not opened yet"}</dd></div>
                      <div className="rounded-xl bg-[#FAF9FD] p-3"><dt className="text-[0.68rem] font-semibold uppercase tracking-wide text-[#8A8296]">Last opened</dt><dd className="mt-1 text-sm">{tracking.last_opened_at ? formatDate(tracking.last_opened_at) : "Not opened yet"}</dd></div>
                    </dl>
                    <p className="mt-3 text-xs leading-5 text-[#8A8296]">“Review Room opens” counts KLEIO review-page loads. It does not claim the submission email was opened, read, or meaningfully reviewed.</p>
                    <button type="button" className={`${secondary} mt-4`} disabled={busy || !packageRecord || !tracking.active_access_id} onClick={() => void revokeLink()}><X className="size-4" />Revoke recipient access</button>
                  </section>

                  <section className="rounded-2xl border border-[#E7E1F7] bg-white p-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold"><Mail className="size-4 text-[#6A5896]" />Open in the artist’s email app</h3>
                    <p className="mt-2 text-sm leading-6 text-[#746E80]">KLEIO prefills the recipient, subject, approved message, and the tracked Review Room access automatically. The artist does not need to copy or manage the secure URL. Browser email handoff cannot reliably attach files, so the artist must add the downloaded files and press Send.</p>
                    <div className="mt-4 rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8A8296]">Manual attachment checklist</p>
                      <ul className="mt-2 space-y-2 text-sm">{attachmentLabels.length ? attachmentLabels.map((label) => <li key={label} className="flex gap-2"><FileCheck2 className="mt-0.5 size-4 shrink-0 text-[#6A5896]" />{label}</li>) : <li className="text-[#746E80]">No attachment list has been generated yet.</li>}</ul>
                    </div>
                    <button type="button" className={`${primary} mt-4 w-full`} disabled={busy || !approved || !recipient} onClick={() => void openEmailClient()}><ExternalLink className="size-4" />Prepare tracked email handoff</button>
                    <p className="mt-2 text-xs leading-5 text-[#8A8296]">KLEIO records “Email client opened.” It does not call this sent, delivered, opened, or read.</p>
                  </section>

                  <section className="rounded-2xl border border-[#E7E1F7] bg-white p-5">
                    <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Evidence-based activity timeline</h3><p className="mt-1 text-xs text-[#746E80]">System-observed, recipient-confirmed, provider-confirmed, and self-reported signals remain distinct.</p></div><button type="button" aria-label="Refresh activity" onClick={() => void refresh()} className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#E7E1F7] text-[#5B4B8A]"><RefreshCw className="size-4" /></button></div>
                    <div className="mt-4 space-y-3">{combinedTimeline.length ? combinedTimeline.map((event) => <div key={`${"event_type" in event ? "recipient" : "submission"}-${event.id}`} className="flex gap-3 border-l-2 border-[#D8D0F2] pl-3"><div><p className="text-sm font-semibold">{timelineLabel(event)}</p><p className="text-xs text-[#746E80]">{timelineEvidence(event)} · {formatDate(event.created_at)}</p></div></div>) : <p className="text-sm text-[#746E80]">No recipient or email-handoff activity has been recorded yet.</p>}</div>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
