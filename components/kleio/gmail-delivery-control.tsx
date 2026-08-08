"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, Loader2, Mail, MessageSquareText, Send, Unplug, X } from "lucide-react"
import {
  disconnectGmail,
  loadGmailConnectionStatus,
  loadGmailDeliveryState,
  sendFinalizedApplicationWithGmail,
  startGmailConnection,
  type GmailConnectionStatus,
  type GmailDeliveryRecord,
} from "@/lib/kleio-gmail-delivery"

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-45"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:bg-[#F8F6FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-45"

const terminalSentStates = new Set(["provider_accepted", "artist_reported_sent", "review_room_opened", "receipt_confirmed", "conversation_started"])
const progressSteps = ["Sent", "Review activity", "Receipt", "Conversation"] as const

function progressIndex(state: string) {
  if (state === "conversation_started") return 4
  if (state === "receipt_confirmed") return 3
  if (state === "review_room_opened") return 2
  if (state === "provider_accepted" || state === "artist_reported_sent") return 1
  return 0
}

function cleanOAuthParams() {
  const url = new URL(window.location.href)
  const outcome = url.searchParams.get("gmail")
  const code = url.searchParams.get("code")
  if (outcome) {
    url.searchParams.delete("gmail")
    url.searchParams.delete("code")
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
  }
  return { outcome, code }
}

function currentReturnPath() {
  const url = new URL(window.location.href)
  url.searchParams.delete("gmail")
  url.searchParams.delete("code")
  return `${url.pathname}${url.search}`
}

export function GmailDeliveryControl({
  submissionVersionId,
  opportunityTitle,
  recipient,
  disabled = false,
  onFallback,
}: {
  submissionVersionId: string
  opportunityTitle: string
  recipient: string
  disabled?: boolean
  onFallback: () => void | Promise<void>
}) {
  const [connection, setConnection] = useState<GmailConnectionStatus | null>(null)
  const [delivery, setDelivery] = useState<GmailDeliveryRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [confirmSend, setConfirmSend] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [status, deliveryState] = await Promise.all([
        loadGmailConnectionStatus(),
        loadGmailDeliveryState(submissionVersionId),
      ])
      setConnection(status)
      setDelivery(deliveryState)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not load Gmail delivery status.")
    } finally {
      setLoading(false)
    }
  }, [submissionVersionId])

  useEffect(() => {
    const { outcome, code } = cleanOAuthParams()
    if (outcome === "connected") setMessage("Gmail connected. KLEIO still requires your explicit confirmation before sending any application.")
    if (outcome === "error") setError(code ? `Gmail connection was not completed (${code.replaceAll("_", " ")}).` : "Gmail connection was not completed.")
    void refresh()
  }, [refresh])

  useEffect(() => {
    const refreshWhenActive = () => { if (document.visibilityState === "visible") void refresh() }
    window.addEventListener("focus", refreshWhenActive)
    document.addEventListener("visibilitychange", refreshWhenActive)
    return () => {
      window.removeEventListener("focus", refreshWhenActive)
      document.removeEventListener("visibilitychange", refreshWhenActive)
    }
  }, [refresh])

  const state = delivery?.state ?? ""
  const alreadySent = terminalSentStates.has(state)
  const uncertain = state === "provider_unknown"
  const sending = state === "provider_sending"
  const fallbackLocked = disabled || busy || sending || uncertain || alreadySent
  const completedProgress = progressIndex(state)

  async function connect() {
    setBusy(true); setError(""); setMessage("")
    try {
      const result = await startGmailConnection(currentReturnPath())
      window.location.assign(result.authorization_url)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not start the Gmail connection.")
      setBusy(false)
    }
  }

  async function sendNow() {
    setBusy(true); setError(""); setMessage(""); setConfirmSend(false)
    try {
      const result = await sendFinalizedApplicationWithGmail(submissionVersionId)
      setMessage(result.message || "Connected Gmail accepted the application message for sending.")
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not complete the Gmail send.")
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function disconnect() {
    setBusy(true); setError(""); setMessage(""); setConfirmDisconnect(false)
    try {
      await disconnectGmail()
      setMessage("Gmail disconnected. Your finalized applications, Review Rooms, and KLEIO conversations are unchanged.")
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not disconnect Gmail.")
    } finally {
      setBusy(false)
    }
  }

  if (loading && !connection) {
    return <button type="button" className={secondary} disabled={disabled} onClick={() => void onFallback()}><Mail className="size-4" />Open email to send</button>
  }

  if (!connection?.configured) {
    return <button type="button" className={primary} disabled={disabled} onClick={() => void onFallback()}><Mail className="size-4" />Open email to send</button>
  }

  return <>
    <div className="w-full rounded-2xl border border-[#DED7EF] bg-[#FAF8FD] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8874C1]">Application delivery</p>
          {connection.connected ? <>
            <p className="mt-1 text-sm font-semibold text-[#292631]">Gmail connected · {connection.account_email}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Send-only access. KLEIO cannot read or modify your inbox. You still approve every application before it leaves KLEIO.</p>
          </> : <>
            <p className="mt-1 text-sm font-semibold text-[#292631]">Send with Gmail or use your normal email app</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Connecting Gmail is optional. KLEIO requests permission to send email only—not to read or modify your inbox.</p>
          </>}
        </div>
        {connection.connected && <button type="button" className="text-xs font-semibold text-[#746E80] underline-offset-4 hover:underline" onClick={() => setConfirmDisconnect(true)} disabled={busy}>Disconnect</button>}
      </div>

      {delivery && completedProgress > 0 && <section className="mt-4 rounded-xl border border-[#E3DCF2] bg-white p-3" aria-label="Application progress">
        <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-[#41384E]">Application progress</p><p className="text-[0.68rem] text-muted-foreground">Evidence updates when you return to KLEIO</p></div>
        <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {progressSteps.map((label, index) => {
            const complete = completedProgress >= index + 1
            return <li key={label} className={`rounded-lg border px-2.5 py-2 text-[0.68rem] font-semibold ${complete ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-[#E8E3F0] bg-[#FAF9FC] text-[#8A8296]"}`}><span className="mr-1.5">{complete ? "✓" : "○"}</span>{label}</li>
          })}
        </ol>
        <p className="mt-2 text-[0.68rem] leading-5 text-muted-foreground">Review activity means KLEIO observed the secure Review Room being loaded. It does not mean the email was read or that a reviewer meaningfully evaluated the application.</p>
        {state === "conversation_started" && <a href="/artist-dashboard/messages/" className={`${primary} mt-3 w-full`}><MessageSquareText className="size-4" />Open KLEIO conversation</a>}
      </section>}

      {alreadySent && <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /><span>{state === "provider_accepted" ? "Connected Gmail accepted this preserved version for sending." : state === "artist_reported_sent" ? "You marked this preserved version as sent outside KLEIO." : state === "review_room_opened" ? "The Review Room has been opened after the submission handoff." : state === "receipt_confirmed" ? "The recipient confirmed receipt in KLEIO." : "A KLEIO conversation has started for this application."} KLEIO does not treat any of these as proof the email was read.</span></div>}
      {uncertain && <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-950"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><span>KLEIO lost the provider response after a Gmail send began. <strong>Check Gmail Sent before doing anything else.</strong> KLEIO has blocked another send or fallback from this screen to avoid a duplicate application.</span></div>}
      {sending && <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#E2DCF0] bg-white p-3 text-xs text-[#625C70]"><Loader2 className="size-4 animate-spin" />Sending this preserved version through Gmail…</div>}
      {delivery?.state === "failed" && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">The previous Gmail attempt was not accepted. Nothing is marked sent. You can retry Gmail or use the normal email fallback.</div>}
      {connection.requires_reauth && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Google authorization needs to be renewed before KLEIO can send through Gmail. Reconnect Gmail below; your application is unchanged.</div>}
      {error && <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800">{error}</div>}
      {message && <div role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">{message}</div>}

      <div className="mt-4 flex flex-wrap gap-2">
        {connection.connected && !alreadySent && !uncertain && <button type="button" className={primary} disabled={disabled || busy || sending || connection.requires_reauth} onClick={() => setConfirmSend(true)}>{busy || sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Send application</button>}
        {!connection.connected && <button type="button" className={secondary} disabled={disabled || busy} onClick={() => void connect()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}Connect Gmail</button>}
        {connection.requires_reauth && <button type="button" className={primary} disabled={disabled || busy} onClick={() => void connect()}><Mail className="size-4" />Reconnect Gmail</button>}
        <button type="button" className={connection.connected ? secondary : primary} disabled={fallbackLocked} onClick={() => void onFallback()}><Mail className="size-4" />{connection.connected ? "Open email instead" : "Open email to send"}</button>
      </div>
      {!connection.connected && <p className="mt-2 text-[0.7rem] leading-5 text-muted-foreground">Gmail is a convenience option, never a requirement. Both paths preserve the same immutable KLEIO application and recipient tracking model.</p>}
    </div>

    {confirmSend && <div className="fixed inset-0 z-[160] grid place-items-center bg-[#21192D]/30 px-4 py-6" role="presentation">
      <button type="button" className="absolute inset-0" aria-label="Cancel Gmail send" onClick={() => setConfirmSend(false)} />
      <section role="dialog" aria-modal="true" aria-labelledby="gmail-send-title" className="relative z-10 w-full max-w-lg rounded-[22px] border border-[#DED7EF] bg-white p-5 text-[#292631] shadow-[0_28px_80px_rgba(39,29,58,0.24)]">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8874C1]">Final delivery confirmation</p><h3 id="gmail-send-title" className="mt-1 font-serif text-2xl font-semibold">Send this application now?</h3></div><button type="button" aria-label="Close" className="grid size-9 place-items-center rounded-lg border border-[#E7E1F7]" onClick={() => setConfirmSend(false)}><X className="size-4" /></button></div>
        <dl className="mt-4 grid gap-3 rounded-xl border border-[#E7E1F7] bg-[#FAF8FD] p-4 text-sm"><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">From</dt><dd className="mt-1 font-semibold">{connection.account_email}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">To</dt><dd className="mt-1 break-all font-semibold">{recipient}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Opportunity</dt><dd className="mt-1 font-semibold">{opportunityTitle}</dd></div></dl>
        <p className="mt-4 text-sm leading-6 text-[#5F5968]">KLEIO will send the exact preserved application email, create its secure Review Room, and attach the approved private files and selected works in this finalized package. If the message exceeds Gmail&apos;s safe size limit, KLEIO stops before sending and keeps the normal email fallback available.</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Google accepting the message confirms provider handoff only. KLEIO will not call that proof the institution received or read your application.</p>
        <div className="mt-5 flex justify-end gap-2"><button type="button" className={secondary} onClick={() => setConfirmSend(false)}>Cancel</button><button type="button" className={primary} onClick={() => void sendNow()}><Send className="size-4" />Send application</button></div>
      </section>
    </div>}

    {confirmDisconnect && <div className="fixed inset-0 z-[160] grid place-items-center bg-[#21192D]/30 px-4 py-6" role="presentation">
      <button type="button" className="absolute inset-0" aria-label="Cancel Gmail disconnect" onClick={() => setConfirmDisconnect(false)} />
      <section role="dialog" aria-modal="true" aria-labelledby="gmail-disconnect-title" className="relative z-10 w-full max-w-md rounded-[22px] border border-[#DED7EF] bg-white p-5 text-[#292631] shadow-[0_28px_80px_rgba(39,29,58,0.24)]">
        <h3 id="gmail-disconnect-title" className="font-serif text-2xl font-semibold">Disconnect Gmail?</h3>
        <p className="mt-3 text-sm leading-6 text-[#5F5968]">KLEIO will remove its stored Gmail authorization from Supabase Vault and ask Google to revoke the token. Finalized applications, Review Rooms, tracking history, and conversations remain in KLEIO.</p>
        <div className="mt-5 flex justify-end gap-2"><button type="button" className={secondary} onClick={() => setConfirmDisconnect(false)}>Keep connected</button><button type="button" className={secondary} onClick={() => void disconnect()}><Unplug className="size-4" />Disconnect Gmail</button></div>
      </section>
    </div>}
  </>
}
