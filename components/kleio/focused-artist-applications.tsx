"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Bell, CheckCircle2, ChevronDown, FileText, Loader2 } from "lucide-react"
import {
  applicationCall,
  loadArtistApplications,
  loadNotifications,
  markNotificationRead,
  type ApplicationRecord,
  type NotificationRecord,
} from "@/lib/kleio-live-data"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"

const surface = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.05)]"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:bg-[#F7F4FF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date unavailable"
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function statusTone(status: string) {
  if (["submitted", "under_review", "shortlisted", "awarded"].includes(status)) return "bg-emerald-50 text-emerald-800"
  if (["declined", "withdrawn"].includes(status)) return "bg-[#F4F2F6] text-[#746E80]"
  return "bg-[#F7F4FF] text-[#5B4B8A]"
}

export function FocusedArtistApplications() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([])
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function refreshNotifications() {
    setNotifications(await loadNotifications())
  }

  useEffect(() => {
    let active = true
    void Promise.all([loadArtistApplications(), loadNotifications()])
      .then(([loadedApplications, loadedNotifications]) => {
        if (!active) return
        setApplications(loadedApplications)
        setNotifications(loadedNotifications)
      })
      .catch((reason: Error) => {
        if (active) setError(reason.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const orderedApplications = useMemo(() => [...applications].sort((left, right) => {
    const leftClosed = ["declined", "withdrawn"].includes(left.status)
    const rightClosed = ["declined", "withdrawn"].includes(right.status)
    if (leftClosed !== rightClosed) return leftClosed ? 1 : -1
    return right.updated_at.localeCompare(left.updated_at)
  }), [applications])
  const unreadCount = notifications.filter((item) => !item.read_at).length

  async function readNotification(id: string) {
    setError("")
    try {
      await markNotificationRead(id)
      await refreshNotifications()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update the notification.")
    }
  }

  return (
    <main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Artist workspace"
          title="Applications"
          description="Continue active work, understand each application’s current state, and review updates without letting notifications take over the page."
          primaryCta={{ label: "Explore opportunities", href: "/artist-dashboard/opportunities/" }}
        />

        {loading && <div role="status" className={`${surface} flex items-center gap-2 text-sm text-[#746E80]`}><Loader2 className="size-4 animate-spin" />Loading your applications…</div>}
        {error && <div role="alert" className={`${surface} border-red-200 text-sm text-red-700`}>{error}</div>}

        {!loading && !applications.length && (
          <section className={`${surface} grid place-items-center py-10 text-center`}>
            <span className="grid size-12 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><FileText className="size-5" /></span>
            <h2 className="mt-4 font-serif text-2xl font-semibold text-[#292631]">No applications yet</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#746E80]">Start from an opportunity when you are ready. KLEIO will keep the draft, requirements, and status history together.</p>
            <Link href="/artist-dashboard/opportunities/" className={`${secondary} mt-5`}>Find an opportunity</Link>
          </section>
        )}

        {!loading && orderedApplications.length > 0 && (
          <section aria-labelledby="active-applications-title" className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#75639E]">Primary work</p>
              <h2 id="active-applications-title" className="mt-1 font-serif text-2xl font-semibold text-[#292631]">Your applications</h2>
            </div>
            {orderedApplications.map((application) => {
              const call = applicationCall(application)
              const history = [...(application.application_status_history ?? [])].sort((left, right) => right.created_at.localeCompare(left.created_at))
              return (
                <article className={surface} key={application.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8A8296]">{call?.institution_name || "Institution"}</p>
                      <h3 className="mt-1 font-serif text-xl font-semibold text-[#292631]">{call?.title || "Application"}</h3>
                      <p className="mt-1 text-sm text-[#746E80]">Updated {formatDate(application.updated_at)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusTone(application.status)}`}>{application.status.replaceAll("_", " ")}</span>
                  </div>

                  <details className="group mt-4 border-t border-[#EEEAF6] pt-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#5B4B8A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 [&::-webkit-details-marker]:hidden">
                      <span>{history.length ? "View status history" : "View creation record"}</span>
                      <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <ul className="mt-3 space-y-2">
                      {history.length ? history.map((entry) => (
                        <li key={entry.id} className="flex items-start gap-2 text-sm text-[#625C70]"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />{entry.new_status.replaceAll("_", " ")} · {formatDate(entry.created_at)}</li>
                      )) : <li className="text-sm text-[#746E80]">Draft created {formatDate(application.created_at)}</li>}
                    </ul>
                  </details>
                </article>
              )
            })}
          </section>
        )}

        {!loading && notifications.length > 0 && (
          <details className="group rounded-2xl border border-[#E7E1F7] bg-white shadow-[0_12px_34px_rgba(82,64,130,0.04)]">
            <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#A997E8]/20 [&::-webkit-details-marker]:hidden sm:px-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#F2EDFC] text-[#5B4B8A]"><Bell className="size-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-[#81788E]">Supporting updates</span><span className="mt-0.5 block text-sm font-semibold text-[#292631]">Notifications{unreadCount ? ` · ${unreadCount} unread` : ""}</span></span>
              <ChevronDown className="size-4 text-[#75639E] transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="space-y-2 border-t border-[#EEEAF6] px-4 py-4 sm:px-5">
              {notifications.map((item) => (
                <button key={item.id} type="button" onClick={() => void readNotification(item.id)} className={`block w-full rounded-xl border border-[#E7E1F7] p-3 text-left transition hover:bg-[#FDFBFF] ${item.read_at ? "opacity-65" : "bg-[#F7F4FF]"}`}>
                  <span className="text-sm font-semibold text-[#292631]">{item.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#746E80]">{item.body} · {formatDate(item.created_at)}</span>
                </button>
              ))}
            </div>
          </details>
        )}
      </div>
    </main>
  )
}
