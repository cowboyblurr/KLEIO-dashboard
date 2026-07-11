"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, LockKeyhole, MessageCircle, Send, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getDemoSession, type KleioDemoSession } from "@/lib/kleio-demo-auth"
import {
  getInternalThreadAccessLabel,
  getVisibleInternalThreads,
  type InternalThread,
  type InternalThreadMessage,
} from "@/lib/kleio-internal-threads"
import { InitialAvatar } from "@/components/kleio/initial-avatar"

function threadMatchesPath(thread: InternalThread, pathname: string) {
  return thread.surfaceHrefs.some((href) => {
    const baseHref = href.split("#")[0]
    return pathname === baseHref || pathname.startsWith(baseHref)
  })
}

function scopeLabel(scope: InternalThread["scope"]) {
  if (scope === "submission") return "Submission"
  if (scope === "program") return "Program"
  if (scope === "committee") return "Committee"
  if (scope === "reviewer") return "Reviewer"
  return "Report"
}

function totalUnread(threads: InternalThread[]) {
  return threads.reduce((sum, thread) => sum + thread.unreadCount, 0)
}

function InternalMessageBubble({ message, self }: { message: InternalThreadMessage; self: boolean }) {
  return (
    <li className={cn("flex gap-2", self && "justify-end")}>
      {!self && <InitialAvatar name={message.author} className="mt-1 size-7 text-[0.6rem]" />}
      <div className={cn("max-w-[82%] rounded-2xl border px-3 py-2", self ? "border-[#D8D0F2] bg-[#F7F4FF]" : "border-border bg-background")}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="text-xs font-semibold text-foreground">{message.author}</p>
          <p className="text-[0.62rem] text-muted-foreground">{message.role}</p>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{message.body}</p>
        <p className="mt-1 text-[0.6rem] font-medium text-[#A997E8]">{message.date}</p>
      </div>
    </li>
  )
}

export function InternalMessengerAccent() {
  const pathname = usePathname()
  const [session, setSession] = useState<KleioDemoSession | null>(null)
  const [open, setOpen] = useState(false)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [localMessages, setLocalMessages] = useState<Record<string, InternalThreadMessage[]>>({})
  const [confirmation, setConfirmation] = useState<string | null>(null)

  useEffect(() => {
    setSession(getDemoSession())

    function syncSession() {
      setSession(getDemoSession())
    }

    window.addEventListener("storage", syncSession)
    window.addEventListener("focus", syncSession)

    return () => {
      window.removeEventListener("storage", syncSession)
      window.removeEventListener("focus", syncSession)
    }
  }, [])

  const visibleThreads = useMemo(() => {
    const threads = getVisibleInternalThreads(session)
    return [...threads].sort((a, b) => {
      const aMatch = threadMatchesPath(a, pathname)
      const bMatch = threadMatchesPath(b, pathname)
      if (aMatch && !bMatch) return -1
      if (!aMatch && bMatch) return 1
      return b.unreadCount - a.unreadCount
    })
  }, [session, pathname])

  const selectedThread = useMemo(() => {
    return visibleThreads.find((thread) => thread.id === selectedThreadId) ?? visibleThreads[0]
  }, [visibleThreads, selectedThreadId])

  useEffect(() => {
    if (!selectedThread && selectedThreadId) setSelectedThreadId(null)
    if (selectedThread && !selectedThreadId) setSelectedThreadId(selectedThread.id)
  }, [selectedThread, selectedThreadId])

  if (!session || session.role === "artist" || visibleThreads.length === 0) return null

  const unread = totalUnread(visibleThreads)
  const relatedToCurrentPage = selectedThread ? threadMatchesPath(selectedThread, pathname) : false
  const selectedMessages = selectedThread ? [...selectedThread.messages, ...(localMessages[selectedThread.id] ?? [])] : []

  function submitDraft() {
    if (!selectedThread || !session) return
    const body = draft.trim()
    if (!body) return

    const reply: InternalThreadMessage = {
      id: `local-internal-${selectedThread.id}-${Date.now()}`,
      author: session.name,
      role: session.role === "institution" ? "Institution team" : "Scoped reviewer",
      body,
      date: "Demo note · just now",
    }

    setLocalMessages((current) => ({
      ...current,
      [selectedThread.id]: [...(current[selectedThread.id] ?? []), reply],
    }))
    setDraft("")
    setConfirmation("Internal demo note added to this thread. No real message was sent.")
    window.setTimeout(() => setConfirmation(null), 2600)
  }

  return (
    <div className="fixed bottom-4 right-5 z-50 max-lg:right-3">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex items-center gap-2 rounded-full border border-[#E7E1F7] bg-white/95 px-3 py-2 text-left shadow-[0_18px_48px_rgba(82,64,130,0.14)] backdrop-blur transition-colors hover:bg-[#F7F4FF]"
          aria-label="Open internal committee threads"
        >
          <span className="relative grid size-8 place-items-center rounded-full bg-[#F7F4FF] text-[#5B4B8A]">
            <MessageCircle className="size-4" />
            {unread > 0 && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#5B4B8A] text-[0.55rem] font-semibold text-white">{unread}</span>}
          </span>
          <span className="hidden sm:block">
            <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#A997E8]">Internal</span>
            <span className="block text-xs font-semibold text-[#292631]">Committee threads</span>
          </span>
        </button>
      )}

      {open && selectedThread && (
        <section className="flex max-h-[min(680px,calc(100vh-2rem))] w-[390px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[1.4rem] border border-[#E7E1F7] bg-white shadow-[0_24px_72px_rgba(82,64,130,0.18)]">
          <header className="border-b border-[#E7E1F7] bg-[#F7F4FF] px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Internal messenger</p>
                <h2 className="mt-0.5 font-serif text-base font-semibold text-[#292631]">Committee threads</h2>
                <p className="mt-1 flex items-center gap-1.5 text-[0.68rem] text-[#7F7890]"><LockKeyhole className="size-3" />{getInternalThreadAccessLabel(session)}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close internal messenger" className="grid size-8 place-items-center rounded-full border border-[#D8D0F2] bg-white text-[#7F7890] transition-colors hover:text-[#292631]"><X className="size-4" /></button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-[9.5rem_minmax(0,1fr)]">
            <aside className="min-h-0 overflow-y-auto border-r border-[#E7E1F7] bg-[#FDFBFF] p-2">
              {visibleThreads.map((thread) => {
                const active = thread.id === selectedThread.id
                const pageMatch = threadMatchesPath(thread, pathname)
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => { setSelectedThreadId(thread.id); setDraft(""); setConfirmation(null) }}
                    className={cn("mb-1 w-full rounded-2xl border px-2.5 py-2 text-left transition-colors", active ? "border-[#D8D0F2] bg-white shadow-sm" : "border-transparent hover:bg-white/80")}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#A997E8]">{thread.label}</span>
                      {thread.unreadCount > 0 && <span className="rounded-full bg-[#5B4B8A] px-1.5 py-0.5 text-[0.55rem] font-semibold text-white">{thread.unreadCount}</span>}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-xs font-semibold leading-snug text-[#292631]">{thread.title}</span>
                    <span className="mt-1 block text-[0.62rem] text-[#7F7890]">{pageMatch ? "On this page" : scopeLabel(thread.scope)}</span>
                  </button>
                )
              })}
            </aside>

            <div className="flex min-h-0 flex-col">
              <div className="border-b border-[#E7E1F7] px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-[#292631]">{selectedThread.title}</h3>
                    <p className="mt-0.5 text-[0.68rem] text-[#7F7890]">{selectedThread.lastUpdated}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2 py-1 text-[0.58rem] font-semibold", relatedToCurrentPage ? "bg-[oklch(0.94_0.04_150)] text-[oklch(0.38_0.11_150)]" : "bg-[#F1ECFB] text-[#5B4B8A]")}>{relatedToCurrentPage ? "Contextual" : scopeLabel(selectedThread.scope)}</span>
                </div>
                <Link href={selectedThread.relatedRecordHref} className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#E7E1F7] bg-white px-2.5 py-1 text-[0.65rem] font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]"><FileText className="size-3" />{selectedThread.relatedRecordLabel}</Link>
              </div>

              <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {selectedMessages.map((message) => (
                  <InternalMessageBubble key={message.id} message={message} self={message.author === session.name} />
                ))}
              </ul>

              <div className="border-t border-[#E7E1F7] p-3">
                {confirmation && <p className="mb-2 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-3 py-2 text-[0.68rem] font-medium text-[oklch(0.4_0.12_150)]">{confirmation}</p>}
                <p className="mb-2 text-[0.62rem] leading-relaxed text-[#7F7890]">Internal demo thread. Artists cannot see this layer. Replies remain local until production messaging is connected.</p>
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={2}
                    placeholder="Add internal note…"
                    className="min-h-16 flex-1 resize-none rounded-2xl border border-[#E7E1F7] bg-[#FDFBFF] px-3 py-2 text-xs text-[#292631] outline-none transition-colors placeholder:text-[#9B94AA] focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/15"
                  />
                  <button type="button" onClick={submitDraft} disabled={!draft.trim()} className="grid size-10 place-items-center rounded-2xl bg-[#5B4B8A] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45" aria-label="Add internal demo note"><Send className="size-4" /></button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
