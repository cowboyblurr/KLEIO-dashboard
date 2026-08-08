"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowRight, Loader2, LockKeyhole, MessageSquareText, Send, ShieldCheck, UserRoundCheck } from "lucide-react"
import {
  loadRecipientConversationReturn,
  requestRecipientConversationReturn,
  sendRecipientConversationReturnMessage,
  type RecipientConversationReturn as ConversationReturn,
} from "@/lib/kleio-recipient-conversation-return"

const primary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#403653] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#332B43] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8B79B6]/25 disabled:cursor-not-allowed disabled:opacity-50"
const input = "min-h-10 w-full rounded-xl border border-[#DED8E3] bg-[#FFFDFC] px-3 text-sm text-[#2D2931] outline-none transition placeholder:text-[#9A929E] focus:border-[#9A89B7] focus:ring-4 focus:ring-[#8B79B6]/10"
const textarea = "w-full rounded-xl border border-[#DED8E3] bg-[#FFFDFC] px-3 py-3 text-sm leading-6 text-[#2D2931] outline-none transition placeholder:text-[#9A929E] focus:border-[#9A89B7] focus:ring-4 focus:ring-[#8B79B6]/10"

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

export function RecipientConversationReturn() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get("conversation")?.trim() ?? ""
  const [conversation, setConversation] = useState<ConversationReturn | null>(null)
  const [loading, setLoading] = useState(Boolean(conversationId))
  const [needsVerification, setNeedsVerification] = useState(false)
  const [email, setEmail] = useState("")
  const [reply, setReply] = useState("")
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState("")
  const [error, setError] = useState(conversationId ? "" : "This conversation link is incomplete.")

  const refresh = useCallback(async () => {
    if (!conversationId) return
    setLoading(true)
    setError("")
    try {
      const loaded = await loadRecipientConversationReturn(conversationId)
      setConversation(loaded)
      setEmail(loaded.recipient.email)
      setNeedsVerification(false)
    } catch {
      setConversation(null)
      setNeedsVerification(true)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => { void refresh() }, [refresh])

  async function requestReturnLink() {
    if (!email.trim() || !conversationId) return
    setBusy(true)
    setError("")
    setStatus("")
    try {
      await requestRecipientConversationReturn(email, conversationId)
      setStatus("Check your email for a secure return link. Use the same verified email that started this application conversation.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "A secure return link could not be sent.")
    } finally {
      setBusy(false)
    }
  }

  async function sendReply() {
    if (!reply.trim() || !conversationId) return
    setBusy(true)
    setError("")
    setStatus("")
    try {
      await sendRecipientConversationReturnMessage(conversationId, reply)
      setReply("")
      setStatus("Message sent and preserved with this application conversation.")
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The message could not be sent.")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <main className="grid min-h-dvh place-items-center bg-[#F8F5EF] px-4"><div className="flex items-center gap-2 text-sm text-[#766F7A]"><Loader2 className="size-4 animate-spin" />Opening your KLEIO conversation…</div></main>
  }

  if (!conversation && needsVerification) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#F8F5EF] px-4 py-12 text-[#2D2931]">
        <section className="w-full max-w-lg border border-[#D9D2DC] bg-[#FCFAF6] p-6 sm:p-8">
          <LockKeyhole className="size-6 text-[#77658D]" />
          <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#77658D]">KLEIO application conversation</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.035em]">Continue with your verified email.</h1>
          <p className="mt-3 text-sm leading-7 text-[#6F6873]">This keeps the artist conversation private without requiring you to create a full institution workspace. Use the email address you verified when you first messaged the artist.</p>
          {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
          {status ? <p role="status" className="mt-4 text-sm leading-6 text-emerald-800">{status}</p> : null}
          <label className="mt-5 grid gap-1.5 text-xs font-semibold text-[#6F6873]"><span>Verified email</span><input className={input} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@organization.org" /></label>
          <button type="button" className={`${primary} mt-4 w-full`} disabled={busy || !email.trim()} onClick={() => void requestReturnLink()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}Email secure return link</button>
          <p className="mt-3 text-[0.68rem] leading-5 text-[#88808D]">Email verification confirms the recipient identity only. It does not verify an institution or create an institution workspace.</p>
        </section>
      </main>
    )
  }

  if (!conversation) {
    return <main className="grid min-h-dvh place-items-center bg-[#F8F5EF] px-4 py-12 text-[#2D2931]"><p className="text-sm text-[#766F7A]">{error || "This conversation is not available."}</p></main>
  }

  return (
    <main className="min-h-dvh bg-[#F8F5EF] text-[#2D2931]">
      <header className="border-b border-[#DDD7CF] bg-[#FCFAF6]">
        <div className="mx-auto flex min-h-[58px] max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4"><span className="font-serif text-lg font-semibold tracking-[0.12em] text-[#302A38]">KLEIO</span><span className="h-4 w-px bg-[#D7D0C9]" /><span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7B737E]">Application conversation</span></div>
          <span className="hidden items-center gap-1.5 text-xs text-[#766F7A] sm:inline-flex"><ShieldCheck className="size-4 text-[#77658D]" />Verified recipient</span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="border-b border-[#DDD7CF] pb-7">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#77658D]">Conversation with {conversation.context.artistName}</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{conversation.context.opportunityTitle}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#7B737E]"><UserRoundCheck className="size-4 text-emerald-700" /><span>{conversation.recipient.display_name || conversation.recipient.email}</span>{conversation.recipient.organization_name ? <><span>·</span><span>{conversation.recipient.organization_name}</span></> : null}<span>·</span><span>Email verified—not institution verified</span></div>
        </section>

        {status ? <div role="status" className="mt-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{status}</div> : null}
        {error ? <div role="alert" className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

        <section className="py-7" aria-label="Application conversation messages">
          <div className="space-y-3">
            {conversation.messages.map((message) => <article key={message.id} className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.sender_kind === "recipient" ? "ml-auto bg-[#403653] text-white" : "border border-[#E2DCE5] bg-[#FCFAF6] text-[#2D2931]"}`}><p>{message.body}</p><p className={`mt-1 text-[0.68rem] ${message.sender_kind === "recipient" ? "text-white/70" : "text-[#88808D]"}`}>{message.sender_kind === "recipient" ? "You" : conversation.context.artistName} · {formatDate(message.created_at)}</p></article>)}
          </div>
          {conversation.conversation.status === "active" ? <div className="mt-6 flex gap-2 border-t border-[#DDD7CF] pt-5"><textarea className={textarea} rows={3} maxLength={4000} value={reply} onChange={(event) => setReply(event.target.value)} placeholder={`Reply to ${conversation.context.artistName}…`} /><button type="button" aria-label="Send reply" className={`${primary} self-end px-3.5`} disabled={busy || !reply.trim()} onClick={() => void sendReply()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</button></div> : <p className="mt-5 text-sm text-[#766F7A]">This conversation is no longer active.</p>}
        </section>

        <aside className="border-y border-[#BDB2C6] bg-[#ECE6EE] px-5 py-6">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#77658D]">Optional review workspace</p>
          <div className="mt-2 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><h2 className="font-serif text-xl font-semibold">Keep applications, conversations, notes, and decisions together.</h2><p className="mt-1 text-sm leading-6 text-[#655E68]">You do not need a full account to use this conversation. A workspace becomes useful when you are reviewing more artists or collaborating with a team.</p></div><a href="/signup/institution/" className={primary}>Create Review Workspace <ArrowRight className="size-4" /></a></div>
        </aside>

        <footer className="mt-6 flex items-start gap-2.5 border-t border-[#D5CEC6] pt-5 text-[0.7rem] leading-5 text-[#7B737E]"><MessageSquareText className="mt-0.5 size-4 shrink-0 text-[#77658D]" /><p>This thread is attached to the application conversation. Your verified email is used to protect access and return you to replies; it is not displayed as institutional verification.</p></footer>
      </div>
    </main>
  )
}
