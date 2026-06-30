"use client"

import { useState } from "react"
import { Mail, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { institution, messageThreads } from "@/lib/kleio-data"
import { analytics, getDemoMessageForThread, isSubmissionMessagePending } from "@/lib/kleio-analytics"
import { InitialAvatar } from "@/components/kleio/initial-avatar"

const channelStyles: Record<string, string> = {
  Applicant: "bg-[oklch(0.95_0.03_287)] text-[oklch(0.45_0.16_287)]",
  Reviewer: "bg-[oklch(0.95_0.06_150)] text-[oklch(0.45_0.12_150)]",
  Committee: "bg-[oklch(0.96_0.05_75)] text-[oklch(0.5_0.12_60)]",
}

export function MessagesView() {
  const [selectedId, setSelectedId] = useState(messageThreads[0]?.id ?? "")
  const [sent, setSent] = useState(false)

  const selected =
    messageThreads.find((thread) => thread.id === selectedId) ?? messageThreads[0]

  function select(id: string) {
    setSelectedId(id)
    setSent(false)
  }

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden px-5 py-6 xl:px-7 xl:py-7">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground xl:text-3xl">
            Messages
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Applicant, reviewer, and committee conversations for {institution.name}, tied to each submission.
          </p>
        </div>
        <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {institution.demoLabel} · {analytics.pendingMessagesCount} pending
        </span>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Threads
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {messageThreads.map((thread) => {
              const active = thread.id === selected?.id
              const linkedMessage = getDemoMessageForThread(thread.linkedMessageId)
              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => select(thread.id)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-border/70 px-4 py-3 text-left transition-colors",
                      active ? "bg-accent/50" : "hover:bg-accent/30",
                    )}
                  >
                    <InitialAvatar name={thread.counterpart} className="size-9 text-xs" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {thread.counterpart}
                        </span>
                        {isSubmissionMessagePending(thread.submissionId) && (
                          <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Pending message" />
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-foreground/80">
                        {thread.subject}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {thread.preview}
                        {linkedMessage ? ` · ${linkedMessage.status}` : ""}
                      </span>
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
                <h2 className="truncate font-serif text-lg font-semibold text-foreground">
                  {selected.subject}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  with {selected.counterpart} · {selected.counterpartRole}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  channelStyles[selected.channel] ?? "bg-muted text-muted-foreground",
                )}
              >
                {selected.channel}
              </span>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {selected.messages.map((message) => (
                <div key={message.id} className="flex items-start gap-3">
                  <InitialAvatar
                    name={message.role === "System" ? "KLEIO" : message.author}
                    className="size-8 text-[0.65rem]"
                  />
                  <div className="min-w-0 flex-1 rounded-2xl border border-border bg-background p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{message.author}</p>
                      <p className="shrink-0 text-xs text-muted-foreground">{message.date}</p>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{message.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-4">
              {sent && (
                <p className="mb-2 rounded-lg border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-3 py-2 text-xs font-medium text-[oklch(0.4_0.12_150)]">
                  Demo reply queued — no message is actually sent in this synthetic environment.
                </p>
              )}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    readOnly
                    value={`Reply to ${selected.counterpart}…`}
                    aria-label="Message reply (demo)"
                    className="h-10 w-full cursor-default rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-muted-foreground outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSent(true)}
                  className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  <Send className="size-4" />
                  Send
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
