"use client"

/* eslint-disable @next/next/no-img-element -- recipient artwork URLs are short-lived signed storage URLs */

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  ArrowRight,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  LockKeyhole,
  MailCheck,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react"
import {
  completeRecipientQuestion,
  loadRecipientConversation,
  loadRecipientReview,
  prepareRecipientQuestion,
  recordRecipientEvent,
  requestExtendedProfile,
  requestRecipientEmailVerification,
  sendRecipientMessage,
  type RecipientConversationMessage,
  type RecipientReviewResponse,
} from "@/lib/kleio-recipient-application"

const surface = "rounded-3xl border border-[#E7E1F7] bg-white p-5 shadow-[0_22px_64px_rgba(65,53,102,0.07)] sm:p-7"
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4C3E78] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:bg-[#FAF8FF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const input = "min-h-11 w-full rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/10"
const textarea = "w-full rounded-xl border border-[#E7E1F7] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/10"

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function errorCopy(error: unknown) {
  const name = error instanceof Error ? error.name : ""
  if (name === "invalid_token") return "This application link is invalid or no longer available."
  if (name === "expired") return "This application link has expired. Ask the artist for a new secure link."
  if (name === "revoked") return "The artist has revoked access to this application link."
  if (name === "draft_expired") return "The saved question expired before verification. Reopen the application and write it again."
  if (name === "verified_email_mismatch") return "The verified email does not match the address used for the question."
  if (name === "too_many_requests") return "Too many question attempts were made recently. Please try again later."
  return error instanceof Error ? error.message : "The application could not be loaded."
}

function MessageList({ messages }: { messages: RecipientConversationMessage[] }) {
  if (!messages.length) return <p className="text-sm text-[#746E80]">No messages yet.</p>
  return (
    <div className="space-y-3" aria-live="polite">
      {messages.map((message) => (
        <article key={message.id} className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.sender_kind === "recipient" ? "ml-auto bg-[#5B4B8A] text-white" : "border border-[#E7E1F7] bg-[#F8F6FD] text-[#292631]"}`}>
          <p>{message.body}</p>
          <p className={`mt-1 text-[0.68rem] ${message.sender_kind === "recipient" ? "text-white/70" : "text-[#8A8296]"}`}>{message.sender_kind === "recipient" ? "You" : "Artist"} · {formatDate(message.created_at)}</p>
        </article>
      ))}
    </div>
  )
}

export function RecipientApplicationReview() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")?.trim() ?? ""
  const draftToken = searchParams.get("draft")?.trim() ?? ""
  const [review, setReview] = useState<RecipientReviewResponse | null>(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [error, setError] = useState(token ? "" : "This secure application link is missing its access token.")
  const [status, setStatus] = useState("")
  const [receiptConfirmed, setReceiptConfirmed] = useState(false)
  const [questionOpen, setQuestionOpen] = useState(false)
  const [questionEmail, setQuestionEmail] = useState("")
  const [questionBody, setQuestionBody] = useState("")
  const [questionBusy, setQuestionBusy] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [conversationMessages, setConversationMessages] = useState<RecipientConversationMessage[]>([])
  const [conversationBusy, setConversationBusy] = useState(false)
  const [reply, setReply] = useState("")
  const [profileRequested, setProfileRequested] = useState(false)

  const refresh = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError("")
    try {
      const loaded = await loadRecipientReview(token)
      setReview(loaded)
      if (loaded.recipient?.email) setQuestionEmail(loaded.recipient.email)
      if (loaded.conversation_id) {
        const conversation = await loadRecipientConversation(token)
        setConversationMessages(conversation.messages)
      }
    } catch (reason) {
      setError(errorCopy(reason))
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { void refresh() }, [refresh])

  useEffect(() => {
    if (!token || !draftToken || !review || review.conversation_id) return
    let active = true
    setQuestionBusy(true)
    completeRecipientQuestion(token, draftToken)
      .then(async () => {
        if (!active) return
        setStatus("Your verified question was sent to the artist and saved with this application.")
        const conversation = await loadRecipientConversation(token)
        if (!active) return
        setConversationMessages(conversation.messages)
        await refresh()
        const cleanUrl = new URL(window.location.href)
        cleanUrl.searchParams.delete("draft")
        window.history.replaceState({}, "", cleanUrl.toString())
      })
      .catch((reason) => { if (active) setError(errorCopy(reason)) })
      .finally(() => { if (active) setQuestionBusy(false) })
    return () => { active = false }
  }, [draftToken, refresh, review, token])

  const snapshot = review?.snapshot
  const approvedDate = snapshot?.approved_at ? formatDate(snapshot.approved_at) : ""
  const isSynthetic = review?.access.data_scope === "synthetic_test"
  const hasConversation = Boolean(review?.conversation_id || conversationMessages.length)
  const institutionInviteVisible = receiptConfirmed || hasConversation || profileRequested
  const attachmentLabels = useMemo(() => snapshot?.documents.attachment_labels ?? [], [snapshot])

  async function confirmReceipt() {
    if (!token || receiptConfirmed) return
    setStatus("")
    try {
      await recordRecipientEvent(token, "receipt_confirmed", { surface: "recipient_application_review" })
      setReceiptConfirmed(true)
      setStatus("Receipt confirmed. KLEIO recorded this as a recipient-confirmed action, not proof of a decision.")
    } catch (reason) {
      setError(errorCopy(reason))
    }
  }

  async function beginQuestion() {
    if (!token) return
    setQuestionBusy(true)
    setError("")
    setStatus("")
    try {
      const prepared = await prepareRecipientQuestion(token, questionEmail, questionBody)
      await requestRecipientEmailVerification({
        email: prepared.email,
        reviewToken: token,
        draftToken: prepared.draft_token,
      })
      setVerificationSent(true)
      setStatus("Check your email for the secure verification link. Your question is preserved for 24 hours and will send only after verification.")
    } catch (reason) {
      setError(errorCopy(reason))
    } finally {
      setQuestionBusy(false)
    }
  }

  async function sendReply() {
    if (!token || !reply.trim()) return
    setConversationBusy(true)
    setError("")
    try {
      await sendRecipientMessage(token, reply)
      setReply("")
      const conversation = await loadRecipientConversation(token)
      setConversationMessages(conversation.messages)
    } catch (reason) {
      setError(errorCopy(reason))
    } finally {
      setConversationBusy(false)
    }
  }

  async function requestMoreProfile() {
    if (!token) return
    setError("")
    try {
      await requestExtendedProfile(token, ["expanded_portfolio", "exhibition_history", "professional_bio"])
      setProfileRequested(true)
      setStatus("Extended-profile access requested. The artist controls whether any additional information becomes visible.")
    } catch (reason) {
      setError(errorCopy(reason))
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#F8F7FB] px-4 py-12 text-[#292631]">
        <div role="status" className={`${surface} flex w-full max-w-xl items-center justify-center gap-3 text-sm text-[#746E80]`}><Loader2 className="size-5 animate-spin" />Loading the artist-approved application…</div>
      </main>
    )
  }

  if (error && !review) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#F8F7FB] px-4 py-12 text-[#292631]">
        <section className={`${surface} w-full max-w-xl text-center`}>
          <LockKeyhole className="mx-auto size-8 text-[#7F6EB4]" />
          <h1 className="mt-4 font-serif text-3xl font-semibold">Application access unavailable</h1>
          <p role="alert" className="mt-3 text-sm leading-6 text-[#746E80]">{error}</p>
        </section>
      </main>
    )
  }

  if (!review || !snapshot) return null

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(230,222,249,0.72),transparent_34%),#F8F7FB] px-4 py-8 text-[#292631] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <header className={`${surface} overflow-hidden`}>
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#D8D0F2] bg-[#F7F4FF] px-3 py-1 text-xs font-semibold text-[#5B4B8A]">Artist-approved application</span>
                {isSynthetic && <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Internal synthetic test</span>}
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.17em] text-[#7F6EB4]">{snapshot.opportunity.provider_name || "Opportunity submission"}</p>
              <h1 className="mt-2 max-w-4xl font-serif text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{snapshot.opportunity.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[#746E80]">Review the artist’s selected works, approved written materials, and supporting documents in one organized record.</p>
            </div>
            <dl className="rounded-2xl border border-[#E7E1F7] bg-[#FAF9FD] p-4 text-sm">
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-[#8A8296]">Artist</dt><dd className="mt-1 font-semibold">{snapshot.artist.professional_name}</dd></div>
              <div className="mt-4"><dt className="text-xs font-semibold uppercase tracking-wide text-[#8A8296]">Application reference</dt><dd className="mt-1 break-all font-mono text-xs">{snapshot.reference}</dd></div>
              <div className="mt-4"><dt className="text-xs font-semibold uppercase tracking-wide text-[#8A8296]">Approved</dt><dd className="mt-1">{approvedDate}</dd></div>
              <div className="mt-4"><dt className="text-xs font-semibold uppercase tracking-wide text-[#8A8296]">Secure access expires</dt><dd className="mt-1">{formatDate(review.access.expires_at)}</dd></div>
            </dl>
          </div>
          {snapshot.synthetic_notice && <div role="note" className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-medium leading-6 text-amber-900">{snapshot.synthetic_notice}</div>}
        </header>

        {status && <div role="status" aria-live="polite" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{status}</div>}
        {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

        <section className={surface} aria-labelledby="application-introduction">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7F6EB4]">Application introduction</p>
          <h2 id="application-introduction" className="mt-2 font-serif text-3xl font-semibold">Why this work is being submitted</h2>
          <div className="mt-5 whitespace-pre-wrap text-[0.98rem] leading-8 text-[#4A4652]">{snapshot.introduction || "The artist did not include a separate application introduction."}</div>
          {snapshot.alignment_map.length > 0 && (
            <details className="mt-6 rounded-2xl border border-[#E7E1F7] bg-[#FAF9FD] p-4">
              <summary className="cursor-pointer text-sm font-semibold text-[#5B4B8A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20">Why KLEIO prepared this alignment</summary>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {snapshot.alignment_map.filter((item) => item.supported !== false).map((item, index) => (
                  <article key={`${item.theme}-${index}`} className="rounded-xl border border-[#E7E1F7] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8A8296]">{item.theme || "Theme"} · {item.confidence || "reviewed"}</p>
                    <p className="mt-2 text-sm leading-6"><strong>Opportunity:</strong> {item.opportunitySource}</p>
                    <p className="mt-2 text-sm leading-6"><strong>{item.artistSourceLabel || "Artist evidence"}:</strong> {item.artistEvidence}</p>
                  </article>
                ))}
              </div>
            </details>
          )}
        </section>

        {snapshot.opportunity_response && (
          <section className={surface}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7F6EB4]">Opportunity-specific response</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold">Artist response</h2>
            <p className="mt-5 whitespace-pre-wrap text-[0.98rem] leading-8 text-[#4A4652]">{snapshot.opportunity_response}</p>
          </section>
        )}

        <section className={surface} aria-labelledby="selected-works">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7F6EB4]">Selected portfolio</p><h2 id="selected-works" className="mt-2 font-serif text-3xl font-semibold">Works included in this application</h2></div>
            <span className="text-sm text-[#746E80]">{snapshot.portfolio.length} work{snapshot.portfolio.length === 1 ? "" : "s"}</span>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {snapshot.portfolio.map((work) => (
              <article key={work.id || work.title} className="overflow-hidden rounded-2xl border border-[#E7E1F7] bg-[#FCFBFE]">
                <button type="button" className="block aspect-[4/3] w-full overflow-hidden bg-[#F0ECF8] text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25" onClick={() => void recordRecipientEvent(token, "artwork_detail_opened", { artwork_id: work.id, surface: "recipient_application_review" })}>
                  {work.image_url ? <img src={work.image_url} alt={work.title ? `${work.title} by ${snapshot.artist.professional_name}` : "Selected artwork"} className="size-full object-contain" /> : <span className="grid size-full place-items-center text-sm text-[#8A8296]">Image unavailable</span>}
                </button>
                <div className="p-4">
                  <h3 className="font-serif text-xl font-semibold">{work.title || "Untitled"}</h3>
                  <p className="mt-1 text-sm text-[#746E80]">{[work.year, work.medium, work.dimensions].filter(Boolean).join(" · ")}</p>
                  {work.description && <p className="mt-3 text-sm leading-6 text-[#5F5968]">{work.description}</p>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={surface}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7F6EB4]">Artist context</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold">Approved profile material</h2>
            {snapshot.artist.bio && <div className="mt-5"><h3 className="text-sm font-semibold">Biography</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#5F5968]">{snapshot.artist.bio}</p></div>}
            {snapshot.artist.artist_statement && <div className="mt-5"><h3 className="text-sm font-semibold">Artist statement</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#5F5968]">{snapshot.artist.artist_statement}</p></div>}
            {snapshot.artist.website_url && <a className={`${secondary} mt-5`} href={snapshot.artist.website_url} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />Open approved artist website</a>}
          </section>

          <section className={surface}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7F6EB4]">Supporting materials</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold">Documents and package</h2>
            <div className="mt-5 space-y-3">
              {snapshot.documents.cv_url && <a href={snapshot.documents.cv_url} target="_blank" rel="noreferrer" className={`${secondary} w-full justify-between`} onClick={() => void recordRecipientEvent(token, "cv_viewed", { document_kind: "cv", surface: "recipient_application_review" })}><span className="inline-flex items-center gap-2"><FileText className="size-4" />View artist CV</span><ExternalLink className="size-4" /></a>}
              {attachmentLabels.map((label) => <div key={label} className="flex items-center gap-2 rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] px-3 py-2 text-sm"><CheckCircle2 className="size-4 text-emerald-600" />{label}</div>)}
              {!snapshot.documents.cv_url && attachmentLabels.length === 0 && <p className="text-sm leading-6 text-[#746E80]">No separate downloadable supporting documents were approved for this review page.</p>}
            </div>
          </section>
        </div>

        <section className={`${surface} border-[#D8D0F2]`}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <div className="flex items-center gap-2"><MessageSquareText className="size-5 text-[#6A5896]" /><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7F6EB4]">Submission-specific communication</p></div>
              <h2 className="mt-3 font-serif text-3xl font-semibold">Continue the conversation with this artist on KLEIO</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#746E80]">Ask a question, request additional materials, and keep the application history organized in one place. The core application remains viewable without an account.</p>
            </div>
            <div className="grid gap-2">
              <button type="button" className={primary} onClick={() => setQuestionOpen(true)}><MessageSquareText className="size-4" />Ask the artist a question</button>
              <button type="button" className={secondary} disabled={receiptConfirmed} onClick={() => void confirmReceipt()}><MailCheck className="size-4" />{receiptConfirmed ? "Receipt confirmed" : "Confirm receipt"}</button>
            </div>
          </div>

          {questionOpen && !hasConversation && (
            <div className="mt-6 rounded-2xl border border-[#E7E1F7] bg-[#FAF9FD] p-4 sm:p-5">
              <h3 className="font-serif text-2xl font-semibold">Write your question first</h3>
              <p className="mt-2 text-sm leading-6 text-[#746E80]">KLEIO preserves this draft, then asks you to verify your email before it is sent. Email verification does not label you as a verified institution.</p>
              <div className="mt-4 grid gap-4">
                <label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>Work email</span><input className={input} type="email" autoComplete="email" value={questionEmail} onChange={(event) => setQuestionEmail(event.target.value)} /></label>
                <label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>Question for {snapshot.artist.professional_name}</span><textarea className={textarea} rows={5} maxLength={4000} value={questionBody} onChange={(event) => setQuestionBody(event.target.value)} placeholder="Ask about the proposal, request a specific material, or clarify the selected work." /></label>
                <div className="flex flex-wrap gap-2"><button type="button" className={primary} disabled={questionBusy || !questionEmail.trim() || !questionBody.trim()} onClick={() => void beginQuestion()}>{questionBusy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}{verificationSent ? "Send another verification link" : "Verify email and send"}</button><button type="button" className={secondary} onClick={() => setQuestionOpen(false)}>Cancel</button></div>
              </div>
            </div>
          )}

          {hasConversation && (
            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-2xl border border-[#E7E1F7] bg-[#FAF9FD] p-4 sm:p-5">
                <div className="flex items-center gap-2"><UserRoundCheck className="size-4 text-emerald-600" /><h3 className="text-sm font-semibold">Verified submission conversation</h3></div>
                <div className="mt-4"><MessageList messages={conversationMessages} /></div>
                <div className="mt-4 flex gap-2"><textarea className={textarea} rows={2} maxLength={4000} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Continue the application-specific conversation…" /><button type="button" aria-label="Send message" className={`${primary} self-end px-3`} disabled={conversationBusy || !reply.trim()} onClick={() => void sendReply()}>{conversationBusy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</button></div>
              </div>
              <aside className="rounded-2xl border border-[#E7E1F7] bg-white p-4">
                <Sparkles className="size-5 text-[#6A5896]" />
                <h3 className="mt-3 font-serif text-xl font-semibold">See more of the artist’s practice</h3>
                <p className="mt-2 text-sm leading-6 text-[#746E80]">Request access to additional portfolio and professional context. The artist decides what becomes visible.</p>
                <button type="button" className={`${secondary} mt-4 w-full`} disabled={profileRequested} onClick={() => void requestMoreProfile()}>{profileRequested ? "Request sent" : "Request extended profile"}</button>
              </aside>
            </div>
          )}
        </section>

        {institutionInviteVisible && (
          <section className="overflow-hidden rounded-3xl bg-[#332A4D] p-6 text-white shadow-[0_24px_70px_rgba(51,42,77,0.22)] sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div><p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#D7CFFA]">Institution workflow</p><h2 className="mt-2 font-serif text-3xl font-semibold">Managing multiple applicants?</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">Create a KLEIO institution workspace to receive structured submissions, coordinate reviewers, request materials, and preserve decision history.</p></div>
              <a href="/signup/institution/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#332A4D]" onClick={() => void recordRecipientEvent(token, "institution_signup_started", { source: "recipient_application_review" })}>Create institution workspace<ArrowRight className="size-4" /></a>
            </div>
          </section>
        )}

        <footer className="rounded-2xl border border-[#E7E1F7] bg-white/75 p-4 text-xs leading-5 text-[#746E80] backdrop-blur">
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#6A5896]" /><p>KLEIO records basic application activity—such as viewing this page, opening artwork details, viewing the CV, confirming receipt, or starting a conversation—so the artist can track submission progress. These events do not prove that an email was read or that an application received formal consideration.</p></div>
        </footer>
      </div>
    </main>
  )
}
