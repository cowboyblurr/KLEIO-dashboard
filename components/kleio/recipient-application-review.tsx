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
  Maximize2,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  X,
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
  type RecipientApplicationResponse,
  type RecipientConversationMessage,
  type RecipientReviewArtwork,
  type RecipientReviewResponse,
} from "@/lib/kleio-recipient-application"

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#403653] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#332B43] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8B79B6]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#D9D2E2] bg-[#FFFDFC] px-5 py-2.5 text-sm font-semibold text-[#403653] transition hover:border-[#B8A9CD] hover:bg-[#FBF8FD] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8B79B6]/20 disabled:cursor-not-allowed disabled:opacity-50"
const quietAction = "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#554D5F] transition hover:bg-[#F1EDF4] hover:text-[#403653] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8B79B6]/20"
const input = "min-h-11 w-full rounded-xl border border-[#DED8E3] bg-[#FFFDFC] px-3 text-sm text-[#2D2931] outline-none transition placeholder:text-[#9A929E] focus:border-[#9A89B7] focus:ring-4 focus:ring-[#8B79B6]/10"
const textarea = "w-full rounded-xl border border-[#DED8E3] bg-[#FFFDFC] px-3 py-3 text-sm leading-6 text-[#2D2931] outline-none transition placeholder:text-[#9A929E] focus:border-[#9A89B7] focus:ring-4 focus:ring-[#8B79B6]/10"
const sectionIds = ["overview", "responses", "works", "project", "documents", "artist", "communication"] as const

type SectionId = (typeof sectionIds)[number]
type WorkView = "editorial" | "grid"

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function formatDateOnly(value: string) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date)
}

function errorCopy(error: unknown) {
  const name = error instanceof Error ? error.name : ""
  if (name === "invalid_token") return "This application link is invalid or no longer available."
  if (name === "expired") return "This review link is no longer active. Ask the artist to renew secure access."
  if (name === "revoked") return "The artist has ended access to this submission."
  if (name === "draft_expired") return "The saved message expired before verification. Reopen the application and write it again."
  if (name === "verified_email_mismatch") return "The verified email does not match the address used for this message."
  if (name === "too_many_requests") return "Too many message attempts were made recently. Please try again later."
  return error instanceof Error ? error.message : "The application could not be loaded."
}

function synopsisFrom(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ")
  if (!normalized) return ""
  if (normalized.length <= 560) return normalized
  const clipped = normalized.slice(0, 560)
  const lastSentence = Math.max(clipped.lastIndexOf(". "), clipped.lastIndexOf("? "), clipped.lastIndexOf("! "))
  return `${(lastSentence > 320 ? clipped.slice(0, lastSentence + 1) : clipped).trim()}…`
}

function supportRange(minimum: number | null | undefined, maximum: number | null | undefined, currency: string | undefined) {
  if (minimum === null || minimum === undefined) {
    if (maximum === null || maximum === undefined) return ""
  }
  const format = new Intl.NumberFormat("en-US", {
    style: currency ? "currency" : "decimal",
    currency: currency || undefined,
    maximumFractionDigits: 0,
  })
  if (minimum !== null && minimum !== undefined && maximum !== null && maximum !== undefined) {
    if (minimum === maximum) return format.format(minimum)
    return `${format.format(minimum)}–${format.format(maximum)}`
  }
  if (maximum !== null && maximum !== undefined) return `Up to ${format.format(maximum)}`
  return minimum !== null && minimum !== undefined ? `From ${format.format(minimum)}` : ""
}

function projectStructureResponse(response: RecipientApplicationResponse) {
  return /budget|timeline|work[_\s-]?plan|schedule|project[_\s-]?period|funding[_\s-]?use/i.test(`${response.material_key} ${response.category} ${response.label}`)
}

function MessageList({ messages }: { messages: RecipientConversationMessage[] }) {
  if (!messages.length) return <p className="text-sm text-[#766F7A]">No messages yet.</p>
  return (
    <div className="space-y-3" aria-live="polite">
      {messages.map((message) => (
        <article key={message.id} className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.sender_kind === "recipient" ? "ml-auto bg-[#403653] text-white" : "border border-[#E2DCE5] bg-[#F7F3F7] text-[#2D2931]"}`}>
          <p>{message.body}</p>
          <p className={`mt-1 text-[0.68rem] ${message.sender_kind === "recipient" ? "text-white/70" : "text-[#88808D]"}`}>{message.sender_kind === "recipient" ? "You" : "Artist"} · {formatDate(message.created_at)}</p>
        </article>
      ))}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.69rem] font-semibold uppercase tracking-[0.18em] text-[#77658D]">{children}</p>
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-2 max-w-3xl font-serif text-[2rem] font-semibold leading-tight tracking-[-0.035em] text-[#27232C] sm:text-[2.35rem]">{children}</h2>
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
  const [questionName, setQuestionName] = useState("")
  const [questionOrganization, setQuestionOrganization] = useState("")
  const [questionEmail, setQuestionEmail] = useState("")
  const [questionBody, setQuestionBody] = useState("")
  const [questionBusy, setQuestionBusy] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [conversationMessages, setConversationMessages] = useState<RecipientConversationMessage[]>([])
  const [conversationBusy, setConversationBusy] = useState(false)
  const [reply, setReply] = useState("")
  const [profileRequested, setProfileRequested] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId>("overview")
  const [focusedWork, setFocusedWork] = useState<RecipientReviewArtwork | null>(null)
  const [workView, setWorkView] = useState<WorkView>("editorial")
  const [meaningfulInteraction, setMeaningfulInteraction] = useState(false)

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
        setStatus("Message sent to the artist and preserved with this application.")
        setMeaningfulInteraction(true)
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

  useEffect(() => {
    if (!review) return
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible && sectionIds.includes(visible.target.id as SectionId)) setActiveSection(visible.target.id as SectionId)
    }, { rootMargin: "-26% 0px -58% 0px", threshold: [0.05, 0.2, 0.5] })
    for (const id of sectionIds) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [review])

  useEffect(() => {
    if (!focusedWork) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setFocusedWork(null)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [focusedWork])

  const snapshot = review?.snapshot
  const approvedDate = snapshot?.approved_at ? formatDateOnly(snapshot.approved_at) : ""
  const isSynthetic = review?.access.data_scope === "synthetic_test"
  const hasConversation = Boolean(review?.conversation_id || conversationMessages.length)
  const institutionInviteVisible = receiptConfirmed || hasConversation || profileRequested || meaningfulInteraction
  const attachmentLabels = useMemo(() => snapshot?.documents.attachment_labels ?? [], [snapshot])
  const approvedResponses = useMemo(() => snapshot?.application_responses ?? [], [snapshot])
  const responses = useMemo<RecipientApplicationResponse[]>(() => {
    if (!snapshot) return []
    if (approvedResponses.length) return approvedResponses
    if (snapshot.opportunity_response) return [{ id: "project_proposal", label: "Project proposal", material_key: "project_proposal", category: "proposal", answer: snapshot.opportunity_response }]
    if (snapshot.introduction) return [{ id: "application_introduction", label: "Application introduction", material_key: "application_introduction", category: "introduction", answer: snapshot.introduction }]
    return []
  }, [approvedResponses, snapshot])
  const projectResponses = useMemo(() => responses.filter(projectStructureResponse), [responses])
  const narrativeResponses = useMemo(() => responses.filter((response) => !projectStructureResponse(response)), [responses])
  const firstNarrative = narrativeResponses[0]?.answer ?? responses[0]?.answer ?? ""
  const proposalSynopsis = synopsisFrom(snapshot?.opportunity_response || firstNarrative || snapshot?.introduction || snapshot?.opportunity.summary || "")
  const portfolioMedia = useMemo(() => {
    if (!snapshot) return []
    return Array.from(new Set(snapshot.portfolio.map((work) => work.medium.trim()).filter(Boolean))).slice(0, 3)
  }, [snapshot])
  const artistDisciplines = snapshot?.artist.disciplines ?? []
  const artistMediums = snapshot?.artist.mediums ?? []
  const disciplineLine = [...artistDisciplines, ...artistMediums, ...portfolioMedia].filter((value, index, list) => list.indexOf(value) === index).slice(0, 4)
  const materialCount = (snapshot?.portfolio.length ?? 0) + attachmentLabels.length + (snapshot?.documents.cv_url ? 1 : 0)
  const awardRange = supportRange(snapshot?.opportunity.award_min, snapshot?.opportunity.award_max, snapshot?.opportunity.currency)
  const deadline = formatDateOnly(snapshot?.opportunity.deadline_at || "")
  const messageSubject = snapshot ? `Regarding: ${snapshot.opportunity.title}${snapshot.opportunity.provider_name ? ` — ${snapshot.opportunity.provider_name}` : ""}` : ""
  const navItems = useMemo(() => [
    { id: "overview" as const, label: "Overview" },
    { id: "responses" as const, label: "Responses" },
    { id: "works" as const, label: "Works" },
    ...(projectResponses.length ? [{ id: "project" as const, label: "Project" }] : []),
    { id: "documents" as const, label: "Documents" },
    { id: "artist" as const, label: "Artist" },
    { id: "communication" as const, label: "Communication" },
  ], [projectResponses.length])

  function scrollToSection(id: SectionId) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function openQuestionComposer() {
    setQuestionOpen(true)
    setMeaningfulInteraction(true)
    window.setTimeout(() => document.getElementById("recipient-message-composer")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0)
  }

  async function confirmReceipt() {
    if (!token || receiptConfirmed) return
    setStatus("")
    try {
      await recordRecipientEvent(token, "receipt_confirmed", { surface: "recipient_application_review" })
      setReceiptConfirmed(true)
      setMeaningfulInteraction(true)
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
      const prepared = await prepareRecipientQuestion(token, questionEmail, questionBody, {
        displayName: questionName,
        organizationName: questionOrganization,
      })
      await requestRecipientEmailVerification({
        email: prepared.email,
        reviewToken: token,
        draftToken: prepared.draft_token,
      })
      setVerificationSent(true)
      setStatus("Check your email for the secure verification link. Your message is preserved for 24 hours and sends only after verification.")
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
      setMeaningfulInteraction(true)
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
      setMeaningfulInteraction(true)
      setStatus("Extended-profile access requested. The artist controls whether any additional information becomes visible.")
    } catch (reason) {
      setError(errorCopy(reason))
    }
  }

  async function openArtwork(work: RecipientReviewArtwork) {
    setFocusedWork(work)
    setMeaningfulInteraction(true)
    await recordRecipientEvent(token, "artwork_detail_opened", { artwork_id: work.id, surface: "recipient_application_review" }).catch(() => undefined)
  }

  async function viewCv() {
    setMeaningfulInteraction(true)
    await recordRecipientEvent(token, "cv_viewed", { document_kind: "cv", surface: "recipient_application_review" }).catch(() => undefined)
  }

  function saveDossier() {
    setMeaningfulInteraction(true)
    setStatus("Use your browser’s print dialog to save this artist-approved dossier as a PDF or print a review copy.")
    window.print()
  }

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#F8F5EF] px-4 py-12 text-[#2D2931]">
        <div role="status" className="flex w-full max-w-xl items-center justify-center gap-3 border-y border-[#DFD9D1] bg-[#FFFDFC] px-6 py-8 text-sm text-[#766F7A]"><Loader2 className="size-5 animate-spin" />Preparing the artist-approved submission…</div>
      </main>
    )
  }

  if (error && !review) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#F8F5EF] px-4 py-12 text-[#2D2931]">
        <section className="w-full max-w-xl border-y border-[#DFD9D1] bg-[#FFFDFC] px-6 py-12 text-center sm:px-10">
          <LockKeyhole className="mx-auto size-7 text-[#77658D]" />
          <p className="mt-5 text-[0.69rem] font-semibold uppercase tracking-[0.18em] text-[#77658D]">Secure KLEIO submission</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-[-0.03em]">Application access unavailable</h1>
          <p role="alert" className="mt-4 text-sm leading-7 text-[#766F7A]">{error}</p>
        </section>
      </main>
    )
  }

  if (!review || !snapshot) return null

  return (
    <main className="min-h-dvh bg-[#F8F5EF] text-[#2D2931] selection:bg-[#E6DDEF] selection:text-[#2D2931]">
      <header className="sticky top-0 z-50 border-b border-[#DDD7CF] bg-[#FCFAF6]/95 backdrop-blur-xl print:static print:bg-white">
        <div className="mx-auto flex min-h-[62px] max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <span className="font-serif text-lg font-semibold tracking-[0.12em] text-[#302A38]">KLEIO</span>
            <span className="hidden h-4 w-px bg-[#D7D0C9] sm:block" aria-hidden="true" />
            <span className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-[#7B737E]">Secure Submission Review</span>
          </div>
          <div className="flex items-center gap-1 print:hidden">
            <button type="button" className={quietAction} onClick={saveDossier}><Download className="size-4" /> <span className="hidden sm:inline">Save dossier</span></button>
          </div>
        </div>
      </header>

      <section className="border-b border-[#DDD7CF] bg-[#FCFAF6]">
        <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="max-w-5xl">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.19em] text-[#77658D]">{snapshot.artist.professional_name}</p>
              {isSynthetic ? <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[0.68rem] font-semibold text-amber-800">Internal synthetic test</span> : null}
            </div>
            <h1 className="mt-4 max-w-5xl font-serif text-[2.7rem] font-semibold leading-[0.98] tracking-[-0.05em] text-[#242028] sm:text-[4.4rem] lg:text-[5rem]">{snapshot.opportunity.title}</h1>
            <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-6 text-[#6F6873]">
              <span>Application to</span>
              <strong className="font-semibold text-[#3B3540]">{snapshot.opportunity.provider_name || "the receiving opportunity"}</strong>
              {snapshot.artist.location ? <><span aria-hidden="true">·</span><span>{snapshot.artist.location}</span></> : null}
              {disciplineLine.length > 0 ? <><span aria-hidden="true">·</span><span>{disciplineLine.join(" · ")}</span></> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#88808D]">
              <span>Shared by {snapshot.artist.professional_name} for this application</span>
              <span aria-hidden="true">·</span>
              <span>Prepared through KLEIO</span>
              {approvedDate ? <><span aria-hidden="true">·</span><span>Approved {approvedDate}</span></> : null}
            </div>
            <div className="mt-8 flex flex-wrap gap-2 print:hidden">
              <button type="button" className={primary} onClick={openQuestionComposer}><MessageSquareText className="size-4" />Message applicant</button>
              <button type="button" className={secondary} onClick={saveDossier}><Download className="size-4" />Download submission</button>
              <button type="button" className={quietAction} onClick={() => scrollToSection("artist")}>View artist profile<ArrowRight className="size-4" /></button>
            </div>
          </div>
          {snapshot.synthetic_notice ? <div role="note" className="mt-8 max-w-4xl border-l-2 border-amber-400 pl-4 text-sm leading-6 text-amber-900">{snapshot.synthetic_notice}</div> : null}
        </div>
      </section>

      <nav aria-label="Submission sections" className="sticky top-[62px] z-40 border-b border-[#DDD7CF] bg-[#FCFAF6]/96 backdrop-blur-xl print:static print:hidden">
        <div className="mx-auto max-w-[1320px] overflow-x-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-max items-center gap-1 py-2">
            {navItems.map((item) => (
              <button key={item.id} type="button" onClick={() => scrollToSection(item.id)} aria-current={activeSection === item.id ? "location" : undefined} className={`rounded-full px-3.5 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8B79B6]/20 ${activeSection === item.id ? "bg-[#E9E1EE] text-[#4A3B59]" : "text-[#766F7A] hover:bg-[#F1EDF0] hover:text-[#403653]"}`}>{item.label}</button>
            ))}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pb-24">
        {status ? <div role="status" aria-live="polite" className="mb-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800 print:hidden">{status}</div> : null}
        {error ? <div role="alert" className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800 print:hidden">{error}</div> : null}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_270px] lg:gap-14 xl:gap-20">
          <div className="min-w-0">
            <section id="overview" className="scroll-mt-32 border-b border-[#DDD7CF] py-12 sm:py-16" aria-labelledby="overview-title">
              <SectionLabel>Application overview</SectionLabel>
              <SectionHeading>Understand the proposal before going deep.</SectionHeading>
              <dl className="mt-9 grid border-y border-[#DDD7CF] sm:grid-cols-2 xl:grid-cols-3">
                <div className="border-b border-[#DDD7CF] py-5 sm:border-r sm:px-5 sm:first:pl-0"><dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#88808D]">Applicant</dt><dd className="mt-2 font-serif text-xl font-semibold">{snapshot.artist.professional_name}</dd></div>
                <div className="border-b border-[#DDD7CF] py-5 sm:px-5 xl:border-r"><dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#88808D]">Discipline</dt><dd className="mt-2 text-sm font-medium leading-6">{disciplineLine.length ? disciplineLine.join(" · ") : "Not specified in this submission"}</dd></div>
                <div className="border-b border-[#DDD7CF] py-5 sm:border-r sm:px-5 xl:border-r-0"><dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#88808D]">Applicant location</dt><dd className="mt-2 text-sm font-medium leading-6">{snapshot.artist.location || "Not specified in this submission"}</dd></div>
                <div className="border-b border-[#DDD7CF] py-5 sm:px-5 xl:border-b-0 xl:border-r"><dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#88808D]">Opportunity support</dt><dd className="mt-2 text-sm font-medium leading-6">{awardRange || "Not specified in the opportunity record"}</dd></div>
                <div className="border-b border-[#DDD7CF] py-5 sm:border-r sm:px-5 sm:border-b-0"><dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#88808D]">Deadline</dt><dd className="mt-2 text-sm font-medium leading-6">{deadline || "Not specified in the opportunity record"}</dd></div>
                <div className="py-5 sm:px-5 sm:pr-0"><dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#88808D]">Submission materials</dt><dd className="mt-2 text-sm font-medium leading-6">{materialCount} item{materialCount === 1 ? "" : "s"} visible in this dossier</dd></div>
              </dl>
              <div className="mt-10 max-w-4xl">
                <h3 id="overview-title" className="font-serif text-2xl font-semibold tracking-[-0.02em]">Proposal synopsis</h3>
                {proposalSynopsis ? <><p className="mt-4 text-[1.03rem] leading-8 text-[#4F4953]">{proposalSynopsis}</p><p className="mt-3 text-xs leading-5 text-[#8B838F]">Condensed from artist-approved application content for navigation; this is not a score or recommendation.</p></> : <p className="mt-4 text-sm leading-7 text-[#766F7A]">No separate proposal synopsis was included in the approved submission snapshot.</p>}
              </div>
            </section>

            <section id="responses" className="scroll-mt-32 border-b border-[#DDD7CF] py-12 sm:py-16" aria-labelledby="responses-title">
              <SectionLabel>Application responses</SectionLabel>
              <SectionHeading>Read the artist’s submission in its own voice.</SectionHeading>
              <div id="responses-title" className="mt-10">
                {narrativeResponses.length > 0 ? narrativeResponses.map((response, index) => (
                  <article key={response.id} className="grid gap-4 border-t border-[#DDD7CF] py-8 sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-7 sm:py-10">
                    <span className="font-mono text-xs text-[#948C97]">{String(index + 1).padStart(2, "0")}</span>
                    <div className="max-w-4xl">
                      <h3 className="font-serif text-2xl font-semibold tracking-[-0.02em]">{response.label}</h3>
                      <p className="mt-5 whitespace-pre-wrap text-[1rem] leading-8 text-[#4F4953]">{response.answer}</p>
                    </div>
                  </article>
                )) : projectResponses.length > 0 ? <p className="border-t border-[#DDD7CF] py-8 text-sm leading-7 text-[#766F7A]">This application’s approved written responses are organized under Project structure below.</p> : <p className="border-t border-[#DDD7CF] py-8 text-sm leading-7 text-[#766F7A]">No separate written responses were included in the approved snapshot.</p>}
              </div>
              {snapshot.alignment_map.some((item) => item.supported !== false) ? (
                <details className="mt-2 border-y border-[#DDD7CF] py-5">
                  <summary className="cursor-pointer text-sm font-semibold text-[#574665] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8B79B6]/20">View approved source connections used to prepare the introduction</summary>
                  <div className="mt-5 space-y-5">
                    {snapshot.alignment_map.filter((item) => item.supported !== false).map((item, index) => (
                      <div key={`${item.theme}-${index}`} className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#88808D]">{item.theme || "Source connection"}</p>
                        <div className="text-sm leading-6 text-[#5E5762]"><p><strong className="font-semibold text-[#39333D]">Opportunity:</strong> {item.opportunitySource}</p><p className="mt-1"><strong className="font-semibold text-[#39333D]">{item.artistSourceLabel || "Artist evidence"}:</strong> {item.artistEvidence}</p></div>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </section>

            <section id="works" className="scroll-mt-32 border-b border-[#DDD7CF] py-12 sm:py-16" aria-labelledby="works-title">
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div><SectionLabel>Selected works</SectionLabel><SectionHeading>Artwork, given room to be seen.</SectionHeading></div>
                {snapshot.portfolio.length > 1 ? <div className="flex rounded-full border border-[#D9D2DC] bg-[#FFFDFC] p-1 print:hidden" aria-label="Artwork view"><button type="button" onClick={() => setWorkView("editorial")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${workView === "editorial" ? "bg-[#E9E1EE] text-[#4A3B59]" : "text-[#7A727D]"}`}>Editorial</button><button type="button" onClick={() => setWorkView("grid")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${workView === "grid" ? "bg-[#E9E1EE] text-[#4A3B59]" : "text-[#7A727D]"}`}>Grid</button></div> : null}
              </div>
              <div id="works-title" className={workView === "grid" ? "mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2" : "mt-10 space-y-16 sm:space-y-20"}>
                {snapshot.portfolio.length > 0 ? snapshot.portfolio.map((work, index) => (
                  <article key={work.id || `${work.title}-${index}`} className={workView === "grid" ? "min-w-0" : "border-t border-[#DDD7CF] pt-8 sm:pt-10"}>
                    <button type="button" className={`group relative block w-full overflow-hidden bg-[#EEEAE4] text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8B79B6]/25 ${workView === "grid" ? "aspect-[4/3]" : "min-h-[360px] sm:min-h-[520px] lg:min-h-[620px]"}`} onClick={() => void openArtwork(work)} aria-label={`Open ${work.title || "selected artwork"} in focus view`}>
                      {work.image_url ? <img src={work.image_url} alt={work.title ? `${work.title} by ${snapshot.artist.professional_name}` : `Selected artwork by ${snapshot.artist.professional_name}`} loading={index === 0 ? "eager" : "lazy"} decoding="async" className="size-full object-contain transition duration-500 group-hover:scale-[1.01]" /> : <span className="grid size-full min-h-[280px] place-items-center px-6 text-center text-sm leading-6 text-[#837B86]">This artwork is temporarily unavailable. The remaining submission materials are still accessible.</span>}
                      {work.image_url ? <span className="absolute bottom-3 right-3 inline-flex size-9 items-center justify-center rounded-full bg-[#FFFDFC]/92 text-[#403653] opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100 print:hidden"><Maximize2 className="size-4" /></span> : null}
                    </button>
                    <div className={workView === "grid" ? "pt-4" : "grid gap-4 pt-5 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.55fr)] sm:gap-10 sm:pt-7"}>
                      <div><h3 className="font-serif text-2xl font-semibold tracking-[-0.025em]">{work.title || "Untitled"}</h3><p className="mt-2 text-sm leading-6 text-[#766F7A]">{[work.year, work.medium, work.dimensions].filter(Boolean).join(" · ") || "Artwork metadata not specified"}</p></div>
                      {work.description ? <p className="text-sm leading-7 text-[#5F5863]">{work.description}</p> : null}
                    </div>
                  </article>
                )) : <p className="border-t border-[#DDD7CF] py-8 text-sm leading-7 text-[#766F7A]">No selected works were included in this approved review snapshot.</p>}
              </div>
            </section>

            {projectResponses.length > 0 ? (
              <section id="project" className="scroll-mt-32 border-b border-[#DDD7CF] py-12 sm:py-16" aria-labelledby="project-title">
                <SectionLabel>Budget / project structure</SectionLabel>
                <SectionHeading>Operational details, preserved in the artist’s submitted language.</SectionHeading>
                <div id="project-title" className="mt-10 border-t border-[#DDD7CF]">
                  {projectResponses.map((response, index) => (
                    <article key={response.id} className="grid gap-4 border-b border-[#DDD7CF] py-8 sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-7 sm:py-9">
                      <span className="font-mono text-xs text-[#948C97]">{String(index + 1).padStart(2, "0")}</span>
                      <div className="max-w-4xl"><h3 className="font-serif text-xl font-semibold tracking-[-0.02em]">{response.label}</h3><p className="mt-4 whitespace-pre-wrap text-[0.98rem] leading-8 text-[#4F4953]">{response.answer}</p></div>
                    </article>
                  ))}
                </div>
                <p className="mt-4 max-w-3xl text-xs leading-5 text-[#8B838F]">KLEIO presents the approved response as submitted; it does not reinterpret narrative budget or timeline content as structured financial data.</p>
              </section>
            ) : null}

            <section id="documents" className="scroll-mt-32 border-b border-[#DDD7CF] py-12 sm:py-16" aria-labelledby="documents-title">
              <SectionLabel>Supporting materials</SectionLabel>
              <SectionHeading>Original documents, organized without competing with the work.</SectionHeading>
              <div id="documents-title" className="mt-10 border-t border-[#DDD7CF]">
                {snapshot.documents.cv_url ? <a href={snapshot.documents.cv_url} target="_blank" rel="noreferrer" className="group flex min-h-20 items-center justify-between gap-4 border-b border-[#DDD7CF] py-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8B79B6]/20" onClick={() => void viewCv()}><span className="flex items-center gap-4"><span className="grid size-10 place-items-center rounded-full bg-[#ECE6EE] text-[#5F4C6E]"><FileText className="size-4" /></span><span><strong className="block font-serif text-lg font-semibold">Artist CV</strong><span className="mt-1 block text-xs text-[#88808D]">Preview in a new tab · artist-approved source file</span></span></span><ExternalLink className="size-4 text-[#817886]" /></a> : null}
                {attachmentLabels.map((label) => <div key={label} className="flex min-h-20 items-center justify-between gap-4 border-b border-[#DDD7CF] py-4"><span className="flex items-center gap-4"><span className="grid size-10 place-items-center rounded-full bg-[#F0ECE8] text-[#655E66]"><CheckCircle2 className="size-4" /></span><span><strong className="block text-sm font-semibold">{label}</strong><span className="mt-1 block text-xs leading-5 text-[#88808D]">Included in the artist-approved submission package</span></span></span></div>)}
                {!snapshot.documents.cv_url && attachmentLabels.length === 0 ? <div className="border-b border-[#DDD7CF] py-7 text-sm leading-7 text-[#766F7A]">No separate supporting documents were approved for this review page.</div> : null}
              </div>
              {attachmentLabels.length > 0 ? <p className="mt-4 max-w-3xl text-xs leading-5 text-[#8B838F]">Where a browser preview is unavailable, KLEIO preserves the original material in the submission package rather than altering its content.</p> : null}
            </section>

            <section id="artist" className="scroll-mt-32 border-b border-[#DDD7CF] py-12 sm:py-16" aria-labelledby="artist-title">
              <SectionLabel>Artist context</SectionLabel>
              <SectionHeading>Enough context to understand the practice—without exposing the whole Passport.</SectionHeading>
              <div id="artist-title" className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_260px]">
                <div className="space-y-9">
                  <div><h3 className="font-serif text-2xl font-semibold">{snapshot.artist.professional_name}</h3>{snapshot.artist.location ? <p className="mt-2 text-sm text-[#766F7A]">{snapshot.artist.location}</p> : null}{disciplineLine.length ? <p className="mt-2 text-sm text-[#766F7A]">{disciplineLine.join(" · ")}</p> : null}</div>
                  {snapshot.artist.bio ? <div><h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#88808D]">Biography</h4><p className="mt-3 whitespace-pre-wrap text-[0.98rem] leading-8 text-[#4F4953]">{snapshot.artist.bio}</p></div> : null}
                  {snapshot.artist.practice_description && snapshot.artist.practice_description !== snapshot.artist.bio ? <div><h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#88808D]">Practice</h4><p className="mt-3 whitespace-pre-wrap text-[0.98rem] leading-8 text-[#4F4953]">{snapshot.artist.practice_description}</p></div> : null}
                  {snapshot.artist.artist_statement ? <div><h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#88808D]">Artist statement</h4><p className="mt-3 whitespace-pre-wrap text-[0.98rem] leading-8 text-[#4F4953]">{snapshot.artist.artist_statement}</p></div> : null}
                  {snapshot.artist.exhibition_history ? <div><h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#88808D]">Selected exhibitions</h4><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#5F5863]">{snapshot.artist.exhibition_history}</p></div> : null}
                  {snapshot.artist.awards ? <div><h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#88808D]">Awards / residencies</h4><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#5F5863]">{snapshot.artist.awards}</p></div> : null}
                  {snapshot.artist.education ? <div><h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#88808D]">Education</h4><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#5F5863]">{snapshot.artist.education}</p></div> : null}
                </div>
                <aside className="border-l border-[#DDD7CF] pl-5 sm:pl-6">
                  <p className="text-xs leading-6 text-[#766F7A]">This page shows only artist-approved context attached to this application. Private Creative Passport information is not exposed automatically.</p>
                  {snapshot.artist.website_url ? <a className={`${quietAction} mt-4 -ml-3`} href={snapshot.artist.website_url} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />Approved artist website</a> : null}
                  {hasConversation ? <button type="button" className={`${secondary} mt-5 w-full`} disabled={profileRequested} onClick={() => void requestMoreProfile()}>{profileRequested ? "Request sent" : "Request full Creative Passport"}</button> : null}
                </aside>
              </div>
            </section>

            <section id="communication" className="scroll-mt-32 py-12 sm:py-16" aria-labelledby="communication-title">
              <SectionLabel>Communication</SectionLabel>
              <SectionHeading>Continue the submission conversation without breaking context.</SectionHeading>
              <div id="communication-title" className="mt-8 grid gap-5 border-y border-[#DDD7CF] py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <p className="max-w-3xl text-sm leading-7 text-[#655E68]">Ask a question, request a specific material, or clarify part of the proposal. The core application remains viewable without an account.</p>
                <div className="flex flex-wrap gap-2 print:hidden"><button type="button" className={primary} onClick={openQuestionComposer}><MessageSquareText className="size-4" />Message applicant</button><button type="button" className={secondary} disabled={receiptConfirmed} onClick={() => void confirmReceipt()}><MailCheck className="size-4" />{receiptConfirmed ? "Receipt confirmed" : "Confirm receipt"}</button></div>
              </div>

              {questionOpen && !hasConversation ? (
                <div id="recipient-message-composer" className="mt-8 border border-[#D9D2DC] bg-[#FCFAF6] p-5 sm:p-7 print:hidden">
                  <div className="flex items-start justify-between gap-4"><div><h3 className="font-serif text-2xl font-semibold tracking-[-0.025em]">Message {snapshot.artist.professional_name}</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[#766F7A]">Write first, then verify the sending email. Email verification does not label you as a verified institution.</p></div><button type="button" aria-label="Close message composer" className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-[#F0EBF1] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8B79B6]/20" onClick={() => setQuestionOpen(false)}><X className="size-4" /></button></div>
                  <div className="mt-5 rounded-xl bg-[#F1EDF1] px-4 py-3 text-xs leading-5 text-[#655E68]"><strong className="font-semibold text-[#3F3943]">Subject:</strong> {messageSubject}</div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1.5 text-xs font-semibold text-[#6F6873]"><span>Name</span><input className={input} autoComplete="name" value={questionName} onChange={(event) => setQuestionName(event.target.value)} placeholder="Your name" /></label>
                    <label className="grid gap-1.5 text-xs font-semibold text-[#6F6873]"><span>Institution / organization</span><input className={input} autoComplete="organization" value={questionOrganization} onChange={(event) => setQuestionOrganization(event.target.value)} placeholder="Optional" /></label>
                    <label className="grid gap-1.5 text-xs font-semibold text-[#6F6873] sm:col-span-2"><span>Email</span><input className={input} type="email" autoComplete="email" value={questionEmail} onChange={(event) => setQuestionEmail(event.target.value)} placeholder="name@organization.org" /></label>
                    <label className="grid gap-1.5 text-xs font-semibold text-[#6F6873] sm:col-span-2"><span>Message</span><textarea className={textarea} rows={6} maxLength={4000} value={questionBody} onChange={(event) => setQuestionBody(event.target.value)} placeholder="Ask about the proposal, request a specific material, or clarify the selected work." /></label>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" className={primary} disabled={questionBusy || !questionEmail.trim() || !questionBody.trim()} onClick={() => void beginQuestion()}>{questionBusy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}{verificationSent ? "Send verification again" : "Verify email and send"}</button><p className="text-xs leading-5 text-[#88808D]">No full KLEIO workspace is required to send one legitimate application message.</p></div>
                </div>
              ) : null}

              {hasConversation ? (
                <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_250px] print:hidden">
                  <div className="border border-[#D9D2DC] bg-[#FCFAF6] p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2"><UserRoundCheck className="size-4 text-emerald-700" /><h3 className="text-sm font-semibold">Verified submission conversation</h3><span className="text-xs text-[#88808D]">Email verified—not institution verified</span></div>
                    <div className="mt-5"><MessageList messages={conversationMessages} /></div>
                    <div className="mt-5 flex gap-2"><textarea className={textarea} rows={2} maxLength={4000} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Continue this application-specific conversation…" /><button type="button" aria-label="Send message" className={`${primary} self-end px-3.5`} disabled={conversationBusy || !reply.trim()} onClick={() => void sendReply()}>{conversationBusy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</button></div>
                  </div>
                  <aside className="border-l border-[#DDD7CF] pl-5"><Sparkles className="size-4 text-[#77658D]" /><h3 className="mt-3 font-serif text-lg font-semibold">More artist context</h3><p className="mt-2 text-sm leading-6 text-[#766F7A]">Request additional portfolio or professional context. The artist decides what becomes visible.</p><button type="button" className={`${secondary} mt-4 w-full`} disabled={profileRequested} onClick={() => void requestMoreProfile()}>{profileRequested ? "Request sent" : "Request access"}</button></aside>
                </div>
              ) : null}
            </section>

            {institutionInviteVisible ? (
              <section className="mt-2 border-y border-[#BDB2C6] bg-[#ECE6EE] px-5 py-9 sm:px-8 sm:py-11 print:hidden">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div><SectionLabel>Institution workflow</SectionLabel><h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.035em] text-[#2D2633]">Reviewing more than one applicant?</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#5F5664]">KLEIO brings submissions, reviewer notes, conversations, decisions, and application history into one organized workspace.</p><p className="mt-3 text-xs font-medium text-[#675D6C]">No account is required to continue reviewing this submission.</p></div>
                  <a href="/signup/institution/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#403653] px-5 text-sm font-semibold text-white" onClick={() => void recordRecipientEvent(token, "institution_signup_started", { source: "recipient_application_review" })}>Create an Institution Workspace<ArrowRight className="size-4" /></a>
                </div>
              </section>
            ) : null}
          </div>

          <aside className="hidden lg:block print:hidden">
            <div className="sticky top-[118px] space-y-8 py-12">
              <div className="border-t border-[#CFC7CF] pt-5">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#88808D]">Submission snapshot</p>
                <dl className="mt-5 space-y-5 text-sm">
                  <div><dt className="text-xs text-[#8B838F]">Artist</dt><dd className="mt-1 font-semibold text-[#37313B]">{snapshot.artist.professional_name}</dd></div>
                  <div><dt className="text-xs text-[#8B838F]">Opportunity</dt><dd className="mt-1 font-medium leading-6 text-[#4E4752]">{snapshot.opportunity.title}</dd></div>
                  {snapshot.opportunity.provider_name ? <div><dt className="text-xs text-[#8B838F]">Receiving organization</dt><dd className="mt-1 font-medium leading-6 text-[#4E4752]">{snapshot.opportunity.provider_name}</dd></div> : null}
                  {deadline ? <div><dt className="text-xs text-[#8B838F]">Deadline</dt><dd className="mt-1 font-medium text-[#4E4752]">{deadline}</dd></div> : null}
                  <div><dt className="text-xs text-[#8B838F]">Materials visible</dt><dd className="mt-1 font-medium text-[#4E4752]">{materialCount}</dd></div>
                  <div><dt className="text-xs text-[#8B838F]">Reference</dt><dd className="mt-1 break-all font-mono text-[0.68rem] leading-5 text-[#736B76]">{snapshot.reference}</dd></div>
                </dl>
              </div>
              <div className="border-t border-[#CFC7CF] pt-5">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#88808D]">Quick actions</p>
                <div className="mt-3 grid gap-1"><button type="button" className={`${quietAction} justify-start px-0 hover:bg-transparent hover:underline`} onClick={openQuestionComposer}><MessageSquareText className="size-4" />Message applicant</button><button type="button" className={`${quietAction} justify-start px-0 hover:bg-transparent hover:underline`} onClick={saveDossier}><Download className="size-4" />Save review copy</button><button type="button" className={`${quietAction} justify-start px-0 hover:bg-transparent hover:underline`} onClick={() => scrollToSection("artist")}><ArrowRight className="size-4" />View artist context</button></div>
              </div>
              {institutionInviteVisible ? <div className="border-t border-[#CFC7CF] pt-5"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#77658D]">Review workspace</p><h3 className="mt-3 font-serif text-xl font-semibold">Reviewing more applications?</h3><p className="mt-2 text-sm leading-6 text-[#766F7A]">Save submissions, take notes, collaborate with reviewers, and organize decisions inside KLEIO.</p><a href="/signup/institution/" className={`${secondary} mt-4 w-full`} onClick={() => void recordRecipientEvent(token, "institution_signup_started", { source: "recipient_application_review_rail" })}>Create Review Workspace</a></div> : null}
            </div>
          </aside>
        </div>

        <footer className="mt-6 border-t border-[#D5CEC6] py-7 text-xs leading-6 text-[#7B737E]">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="flex max-w-4xl items-start gap-3"><ShieldCheck className="mt-1 size-4 shrink-0 text-[#77658D]" /><p><strong className="font-semibold text-[#514A55]">Secure KLEIO submission.</strong> Application materials were shared by {snapshot.artist.professional_name} for this review. KLEIO records basic application activity—such as viewing this page, opening artwork details, viewing the CV, confirming receipt, or starting a conversation—so the artist can understand submission status. These events do not prove that an email was read, how long someone reviewed the work, or that a formal decision was made.</p></div>
            <span className="text-[#9A929E]">Access expires {formatDateOnly(review.access.expires_at)}</span>
          </div>
        </footer>
      </div>

      {focusedWork ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-[#201C24]/80 p-3 backdrop-blur-sm print:hidden" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFocusedWork(null) }}>
          <div role="dialog" aria-modal="true" aria-label={`${focusedWork.title || "Artwork"} focus view`} className="flex max-h-[94dvh] w-full max-w-[1180px] flex-col overflow-hidden bg-[#F8F5EF] shadow-2xl">
            <header className="flex items-center justify-between gap-4 border-b border-[#D7D0C9] px-4 py-3 sm:px-5"><div className="min-w-0"><h2 className="truncate font-serif text-lg font-semibold">{focusedWork.title || "Untitled"}</h2><p className="truncate text-xs text-[#807884]">{[focusedWork.year, focusedWork.medium, focusedWork.dimensions].filter(Boolean).join(" · ")}</p></div><button type="button" aria-label="Close artwork focus view" autoFocus className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-[#ECE7E2] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8B79B6]/20" onClick={() => setFocusedWork(null)}><X className="size-4" /></button></header>
            <div className="min-h-0 flex-1 overflow-auto bg-[#ECE8E2] p-4 sm:p-7">{focusedWork.image_url ? <img src={focusedWork.image_url} alt={focusedWork.title ? `${focusedWork.title} by ${snapshot.artist.professional_name}` : `Selected artwork by ${snapshot.artist.professional_name}`} decoding="async" className="mx-auto max-h-[76dvh] max-w-full object-contain" /> : <div className="grid min-h-[55dvh] place-items-center text-center text-sm leading-6 text-[#766F7A]">This artwork is temporarily unavailable. The remaining submission materials are still accessible.</div>}</div>
            {focusedWork.description ? <div className="border-t border-[#D7D0C9] bg-[#FCFAF6] px-5 py-4 text-sm leading-6 text-[#5E5762]">{focusedWork.description}</div> : null}
          </div>
        </div>
      ) : null}
    </main>
  )
}
