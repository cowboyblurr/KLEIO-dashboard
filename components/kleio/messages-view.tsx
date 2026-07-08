"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { FileText, Mail, Save, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { institution, messageThreads, type MessageEntry, type MessageThread } from "@/lib/kleio-data"
import { analytics, getDemoMessageForThread, isSubmissionMessagePending } from "@/lib/kleio-analytics"
import { artistProfileHref } from "@/lib/kleio-demo-auth"
import { InitialAvatar } from "@/components/kleio/initial-avatar"

const channelStyles: Record<string, string> = {
  Applicant: "bg-[oklch(0.95_0.03_287)] text-[oklch(0.45_0.16_287)]",
  Reviewer: "bg-[oklch(0.95_0.06_150)] text-[oklch(0.45_0.12_150)]",
  Committee: "bg-[oklch(0.96_0.05_75)] text-[oklch(0.5_0.12_60)]",
}

function todayLabel() {
  return "Today · just now"
}

function templateForThread(thread: MessageThread, type: "materials" | "reminder" | "decision") {
  if (type === "materials") {
    return `Hi ${thread.counterpart}, thank you again for your application. We are reviewing your materials and need one clarification before the committee can continue: please confirm or upload the missing item connected to this submission. Once received, we can move the record forward cleanly.`
  }
  if (type === "reminder") {
    return `Hi ${thread.counterpart}, checking in on this review thread. Please update your recommendation when you have a chance so the committee can keep the current review cycle moving.`
  }
  return `Hi ${thread.counterpart}, the committee is preparing the next review step. I am adding this note so the decision context stays connected to the submission record.`
}

export function MessagesView() {
  const [selectedId, setSelectedId] = useState(messageThreads[0]?.id ?? "")
  const [sent, setSent] = useState<null | "sent" | "saved">(null)
  const [draft, setDraft] = useState("")
  const [localReplies, setLocalReplies] = useState<Record<string, MessageEntry[]>>({})

  useEffect(() => {
    const requestedThreadId = new URLSearchParams(window.location.search).get("thread")
    if (requestedThreadId && messageThreads.some((thread) => thread.id === requestedThreadId)) {
      setSelectedId(requestedThreadId)
      setSent(null)
      setDraft("")
    }
  }, [])

  const selected = messageThreads.find((thread) => thread.id === selectedId) ?? messageThreads[0]
  const visibleMessages = useMemo(() => {
    if (!selected) return []
    return [...selected.messages, ...(localReplies[selected.id] ?? [])]
  }, [selected, localReplies])

  function select(id: string) {
    setSelectedId(id)
    setSent(null)
    setDraft("")
  }

  function addReply(mode: "sent" | "saved") {
    if (!selected) return
    const body = draft.trim()
    if (!body) return

    const reply: MessageEntry = {
      id: `local-reply-${selected.id}-${Date.now()}`,
      author: "Mara Voss",
      role: "Program Team",
      body,
      date: mode === "saved" ? "Draft · just now" : todayLabel(),
    }

    setLocalReplies((current) => ({ ...current, [selected.id]: [...(current[selected.id] ?? []), reply] }))
    setDraft("")
    setSent(mode)
  }

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden px-5 py-6 xl:px-7 xl:py-7">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground xl:text-3xl">Messages</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Resolve missing information and applicant questions without scattering context across inboxes.</p>
        </div>
        <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">{institution.demoLabel} · {analytics.pendingMessagesCount} pending</span>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Threads</div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {messageThreads.map((thread) => {
              const active = thread.id === selected?.id
              const linkedMessage = getDemoMessageForThread(thread.linkedMessageId)
              return (
                <li key={thread.id}>
                  <button type="button" onClick={() => select(thread.id)} className={cn("flex w-full items-start gap-3 border-b border-border/70 px-4 py-3 text-left transition-colors", active ? "bg-accent/50" : "hover:bg-accent/30")}>
                    <InitialAvatar name={thread.counterpart} className="size-9 text-xs" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        {thread.channel === "Applicant" ? <Link href={artistProfileHref(thread.submissionId)} onClick={(e) => e.stopPropagation()} className="truncate text-sm font-medium text-foreground hover:text-primary">{thread.counterpart}</Link> : <span className="truncate text-sm font-medium text-foreground">{thread.counterpart}</span>}
                        {isSubmissionMessagePending(thread.submissionId) && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Pending message" />}
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-foreground/80">{thread.subject}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{thread.preview}{linkedMessage ? ` · ${linkedMessage.status}` : ""}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        {selected && (
          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate font-serif text-lg font-semibold text-foreground">{selected.subject}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">with {selected.channel === "Applicant" ? <Link href={artistProfileHref(selected.submissionId)} className="font-medium text-foreground hover:text-primary">{selected.counterpart}</Link> : selected.counterpart} · {selected.counterpartRole}</p>
              </div>
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", channelStyles[selected.channel] ?? "bg-muted text-muted-foreground")}>{selected.channel}</span>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {visibleMessages.map((message) => (
                <div key={message.id} className="flex items-start gap-3">
                  <InitialAvatar name={message.role === "System" ? "KLEIO" : message.author} className="size-8 text-[0.65rem]" />
                  <div className="min-w-0 flex-1 rounded-2xl border border-border bg-background p-3">
                    <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium text-foreground">{message.author}</p><p className="shrink-0 text-xs text-muted-foreground">{message.date}</p></div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{message.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-4">
              {sent && <p className="mb-2 rounded-lg border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-3 py-2 text-xs font-medium text-[oklch(0.4_0.12_150)]">{sent === "saved" ? "Draft saved inside this message thread. You can keep editing or send a demo message next." : "Demo message added to this thread. No real message is sent outside the prototype."}</p>}

              <div className="mb-3 rounded-xl border border-border bg-background/70 p-3">
                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <p><span className="font-semibold text-foreground">To:</span> {selected.counterpart}</p>
                  <p><span className="font-semibold text-foreground">Channel:</span> {selected.channel} message</p>
                  <p><span className="font-semibold text-foreground">Status:</span> Demo draft only</p>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><FileText className="size-3.5" /> Related record: {selected.subject}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setDraft(templateForThread(selected, "materials"))} className="rounded-full border border-border bg-card px-3 py-1 text-[0.68rem] font-medium text-foreground transition-colors hover:bg-accent/50">Use material request</button>
                  <button type="button" onClick={() => setDraft(templateForThread(selected, "reminder"))} className="rounded-full border border-border bg-card px-3 py-1 text-[0.68rem] font-medium text-foreground transition-colors hover:bg-accent/50">Use reviewer reminder</button>
                  <button type="button" onClick={() => setDraft(templateForThread(selected, "decision"))} className="rounded-full border border-border bg-card px-3 py-1 text-[0.68rem] font-medium text-foreground transition-colors hover:bg-accent/50">Use decision note</button>
                </div>
              </div>

              <div className="flex items-end gap-2">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Reply to ${selected.counterpart}…`} aria-label="Message reply" rows={3} className="min-h-20 w-full resize-none rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <button type="button" onClick={() => addReply("saved")} disabled={!draft.trim()} className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50"><Save className="size-4" />Save</button>
                  <button type="button" onClick={() => addReply("sent")} disabled={!draft.trim()} className="flex h-10 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"><Send className="size-4" />Send</button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
