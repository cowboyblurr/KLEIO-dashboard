"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, MessageSquareText, Send, UserRoundCheck } from "lucide-react"
import { loadArtistApplicationPackage } from "@/lib/kleio-recipient-artist-actions"
import {
  loadArtistRecipientConversation,
  loadArtistRecipientMessages,
  sendArtistRecipientReply,
  type ArtistRecipientConversation as Conversation,
  type ArtistRecipientMessage,
} from "@/lib/kleio-artist-recipient-conversation"

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
const textarea = "w-full rounded-xl border border-[#E7E1F7] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/10"

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

export function ArtistRecipientConversation() {
  const searchParams = useSearchParams()
  const opportunityId = searchParams.get("opportunity")?.trim() ?? ""
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ArtistRecipientMessage[]>([])
  const [reply, setReply] = useState("")
  const [loading, setLoading] = useState(Boolean(opportunityId))
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")

  async function refresh() {
    if (!opportunityId) return
    setLoading(true)
    setError("")
    try {
      const packageRecord = await loadArtistApplicationPackage(opportunityId)
      if (!packageRecord) {
        setConversation(null)
        setMessages([])
        return
      }
      const nextConversation = await loadArtistRecipientConversation(packageRecord.id)
      setConversation(nextConversation)
      setMessages(nextConversation ? await loadArtistRecipientMessages(nextConversation.id) : [])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load the recipient conversation.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [opportunityId])

  async function sendReply() {
    if (!conversation || !reply.trim()) return
    setSending(true)
    setError("")
    setStatus("")
    try {
      const result = await sendArtistRecipientReply(conversation.id, reply)
      setReply("")
      setMessages(await loadArtistRecipientMessages(conversation.id))
      if (result.notification_status === "sent") {
        setStatus("Reply sent and preserved with this application conversation. The recipient was notified by email with a secure return link.")
      } else if (result.notification_status === "unconfigured") {
        setStatus("Reply sent and preserved with this application conversation. Email notification delivery is not configured yet, so KLEIO is not claiming the recipient was notified.")
      } else {
        setStatus("Reply sent and preserved with this application conversation. The email notification could not be confirmed, but the message is safely stored in KLEIO.")
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to send the reply.")
    } finally {
      setSending(false)
    }
  }

  if (!opportunityId) return null
  if (loading) return <section role="status" className="rounded-2xl border border-[#E7E1F7] bg-white p-5 text-sm text-[#746E80]"><span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" />Checking for recipient questions…</span></section>
  if (!conversation && !error) return null

  return (
    <section className="rounded-2xl border border-[#D8D0F2] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.05)] sm:p-6" aria-labelledby="artist-recipient-conversation-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7F6EB4]"><MessageSquareText className="size-4" />Application conversation</p>
          <h2 id="artist-recipient-conversation-title" className="mt-2 font-serif text-2xl font-semibold">Continue with the verified recipient</h2>
          {conversation && <p className="mt-2 text-sm text-[#746E80]">{conversation.recipient.display_name || conversation.recipient.email}{conversation.recipient.organization_name ? ` · ${conversation.recipient.organization_name}` : ""}</p>}
        </div>
        {conversation && <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"><UserRoundCheck className="size-3.5" />Email verified—not institution verified</span>}
      </div>

      {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {status && <div role="status" aria-live="polite" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{status}</div>}

      {conversation && (
        <>
          <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-[#E7E1F7] bg-[#FAF9FD] p-4">
            {messages.length ? messages.map((message) => (
              <article key={message.id} className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.sender_kind === "artist" ? "ml-auto bg-[#5B4B8A] text-white" : "border border-[#E7E1F7] bg-white text-[#292631]"}`}>
                <p>{message.body}</p>
                <p className={`mt-1 text-[0.68rem] ${message.sender_kind === "artist" ? "text-white/70" : "text-[#8A8296]"}`}>{message.sender_kind === "artist" ? "You" : "Recipient"} · {formatDate(message.created_at)}</p>
              </article>
            )) : <p className="text-sm text-[#746E80]">The verified recipient has not sent a message yet.</p>}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="grid flex-1 gap-1.5 text-xs font-semibold text-[#746E80]"><span>Reply about this application</span><textarea className={textarea} rows={3} maxLength={4000} value={reply} onChange={(event) => setReply(event.target.value)} /></label>
            <button type="button" className={primary} disabled={sending || !reply.trim() || conversation.status !== "active"} onClick={() => void sendReply()}>{sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Send reply</button>
          </div>
        </>
      )}
    </section>
  )
}
