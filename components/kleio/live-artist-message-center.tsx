"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Archive, BellOff, CheckCircle2, Flag, Inbox, Loader2, MessageCircle, X, XCircle } from "lucide-react"
import { LiveArtistCrossRoleMessages } from "@/components/kleio/live-opportunity-workspace"
import {
  loadMyArtistOpportunityInvitations,
  respondToArtistOpportunityInvitation,
  setArtistOpportunityConversationControl,
  type ArtistOpportunityInvitation,
} from "@/lib/kleio-artist-discovery"

const secondary = "inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3 text-xs font-semibold text-[#5B4B8A] disabled:opacity-50"
const primary = "inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-3 text-xs font-semibold text-white disabled:opacity-50"

function formatDate(value: string | null) {
  if (!value) return "No deadline stated"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "Deadline unavailable" : parsed.toLocaleDateString()
}

function AuthorizedArtistConversationInbox() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const rootElement = rootRef.current
    if (!rootElement) return

    const replacements = new Map([
      [
        "Contact KLEIO institutions before applying and continue conversations inside submitted applications.",
        "Reply to institution invitations and continue conversations connected to submitted applications.",
      ],
      [
        "No institution conversations yet. Use Message institution on an active KLEIO opportunity, or submit an application.",
        "No authorized institution conversations yet. A thread appears after an institution invitation or a submitted application.",
      ],
    ])

    function alignConversationCopy() {
      for (const element of rootElement.querySelectorAll("p, div")) {
        const text = element.textContent?.trim()
        const replacement = text ? replacements.get(text) : undefined
        if (replacement && element.childElementCount === 0) element.textContent = replacement
      }
    }

    alignConversationCopy()
    const observer = new MutationObserver(alignConversationCopy)
    observer.observe(rootElement, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return <div ref={rootRef} className="h-full"><LiveArtistCrossRoleMessages /></div>
}

export function LiveArtistMessageCenter() {
  const [open, setOpen] = useState(false)
  const [invitations, setInvitations] = useState<ArtistOpportunityInvitation[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [reporting, setReporting] = useState<ArtistOpportunityInvitation | null>(null)
  const [reportReason, setReportReason] = useState("")

  async function refresh() {
    setLoading(true)
    try { setInvitations(await loadMyArtistOpportunityInvitations()) }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load institution invitations.") }
    finally { setLoading(false) }
  }

  useEffect(() => { if (open) void refresh() }, [open])

  async function respond(invitation: ArtistOpportunityInvitation, status: "interested" | "declined") {
    setBusyId(invitation.invitation_id); setError(""); setMessage("")
    try { await respondToArtistOpportunityInvitation(invitation.invitation_id, status); setMessage(status === "interested" ? "Interest recorded. You may reply in the existing conversation or prepare an application." : "Invitation declined. No application was created."); await refresh() }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update the invitation.") }
    finally { setBusyId("") }
  }

  async function control(invitation: ArtistOpportunityInvitation, action: "mute" | "unmute" | "archive" | "unarchive") {
    setBusyId(invitation.invitation_id); setError(""); setMessage("")
    try { await setArtistOpportunityConversationControl({ conversationId: invitation.conversation_id, action }); setMessage(action === "mute" ? "Conversation muted." : action === "unmute" ? "Conversation unmuted." : action === "archive" ? "Conversation archived from the invitation view." : "Conversation restored."); await refresh() }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update the conversation.") }
    finally { setBusyId("") }
  }

  async function report() {
    if (!reporting) return
    setBusyId(reporting.invitation_id); setError(""); setMessage("")
    try { await setArtistOpportunityConversationControl({ conversationId: reporting.conversation_id, action: "report", reportReason }); setMessage("Outreach reported for KLEIO review. The report does not create or change an application."); setReporting(null); setReportReason(""); await refresh() }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to report the outreach.") }
    finally { setBusyId("") }
  }

  const visibleInvitations = invitations.filter((invitation) => !invitation.archived_at)
  const activeCount = visibleInvitations.filter((invitation) => ["sent", "viewed", "interested"].includes(invitation.invitation_status)).length

  return <div className="relative h-full"><AuthorizedArtistConversationInbox /><button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 inline-flex h-11 items-center gap-2 rounded-full border border-[#D8D0F2] bg-white px-5 text-sm font-semibold text-[#5B4B8A] shadow-[0_18px_50px_rgba(82,64,130,0.18)]"><Inbox className="size-4" />Invitations{activeCount > 0 && <span className="rounded-full bg-[#5B4B8A] px-2 py-0.5 text-[0.65rem] text-white">{activeCount}</span>}</button>{open && <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#201B2B]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Institution opportunity invitations"><div className="mx-auto mt-6 max-w-4xl rounded-3xl border border-[#E7E1F7] bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6A5896]">Artist-controlled outreach</p><h2 className="mt-2 font-serif text-3xl tracking-[-0.04em]">Opportunity invitations</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#7F7890]">Institutions can reach you here only through a qualifying active listing or an existing submitted application. Reviewing, replying, or expressing interest never creates an application.</p></div><button type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-full border border-[#E7E1F7]" aria-label="Close invitations"><X className="size-4" /></button></div>{error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}{message && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}{loading ? <p className="mt-6 flex items-center gap-2 text-sm text-[#7F7890]"><Loader2 className="size-4 animate-spin" />Loading invitations…</p> : visibleInvitations.length ? <div className="mt-6 space-y-4">{visibleInvitations.map((invitation) => <article key={invitation.invitation_id} className="rounded-2xl border border-[#E7E1F7] bg-[#FCFBFD] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#6A5896]">{invitation.institution_name} · {invitation.opportunity_type.replaceAll("_", " ")}</p><h3 className="mt-1 font-serif text-xl text-[#292631]">{invitation.opportunity_title}</h3><p className="mt-1 text-xs text-[#7F7890]">Deadline {formatDate(invitation.deadline_at)} · Status {invitation.invitation_status}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${invitation.invitation_status === "interested" ? "bg-emerald-50 text-emerald-700" : invitation.invitation_status === "declined" ? "bg-red-50 text-red-700" : invitation.invitation_status === "expired" ? "bg-slate-100 text-slate-600" : "bg-[#F1ECFB] text-[#5B4B8A]"}`}>{invitation.invitation_status}</span></div><div className="mt-4 rounded-xl border border-[#E7E1F7] bg-white p-4 text-sm leading-6 text-[#625C70]">{invitation.invitation_note}</div><div className="mt-4 flex flex-wrap gap-2"><Link href={`/artist-dashboard/messages/?conversation=${invitation.conversation_id}`} onClick={() => setOpen(false)} className={primary}><MessageCircle className="size-3.5" />Open conversation</Link><Link href={`/artist-dashboard/applications/prepare/?opportunity=${invitation.opportunity_id}`} className={secondary}>Review and prepare</Link>{["sent", "viewed"].includes(invitation.invitation_status) && <><button type="button" disabled={busyId === invitation.invitation_id} onClick={() => void respond(invitation, "interested")} className={secondary}><CheckCircle2 className="size-3.5" />Interested</button><button type="button" disabled={busyId === invitation.invitation_id} onClick={() => void respond(invitation, "declined")} className={secondary}><XCircle className="size-3.5" />Decline</button></>}{invitation.muted_at ? <button type="button" onClick={() => void control(invitation, "unmute")} className={secondary}>Unmute</button> : <button type="button" onClick={() => void control(invitation, "mute")} className={secondary}><BellOff className="size-3.5" />Mute</button>}<button type="button" onClick={() => void control(invitation, "archive")} className={secondary}><Archive className="size-3.5" />Archive</button><button type="button" disabled={Boolean(invitation.reported_at)} onClick={() => setReporting(invitation)} className={secondary}><Flag className="size-3.5" />{invitation.reported_at ? "Reported" : "Report"}</button></div></article>)}</div> : <div className="mt-6 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-8 text-center"><Inbox className="mx-auto size-6 text-[#6A5896]" /><h3 className="mt-3 font-serif text-xl">No institution invitations</h3><p className="mt-2 text-sm text-[#7F7890]">Artists cannot start unsolicited institution conversations. Authorized threads will appear after an institution invitation or a submitted application.</p></div>}</div></div>}{reporting && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#201B2B]/65 p-4" role="dialog" aria-modal="true" aria-label="Report outreach"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><h2 className="font-serif text-2xl">Report institution outreach</h2><p className="mt-2 text-sm leading-6 text-[#7F7890]">Explain why this invitation or conversation should be reviewed. Do not include passwords, government identifiers, or unrelated private information.</p><textarea rows={5} value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="mt-4 w-full rounded-xl border border-[#E7E1F7] px-3 py-2 text-sm" /><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => { setReporting(null); setReportReason("") }} className={secondary}>Cancel</button><button type="button" disabled={reportReason.trim().length < 10 || busyId === reporting.invitation_id} onClick={() => void report()} className={primary}>{busyId === reporting.invitation_id && <Loader2 className="size-3.5 animate-spin" />}Submit report</button></div></div></div>}</div>
}
