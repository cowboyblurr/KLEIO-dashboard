"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  FileText,
  History,
  Loader2,
  MessageSquareText,
  RefreshCw,
} from "lucide-react"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import {
  applicationCall,
  loadArtistApplications,
  loadNotifications,
  markNotificationRead,
  type ApplicationRecord,
  type NotificationRecord,
} from "@/lib/kleio-live-data"
import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import { recordArtistApplicationTimelineEvent } from "@/lib/kleio-application-composer"

const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.055)]"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3.5 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:bg-[#F8F6FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:opacity-50"
const primary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:opacity-50"

type ExternalPackage = {
  id: string
  opportunity_id: string
  state: string
  submission_method: string
  submitted_at: string | null
  artist_approved_at: string | null
  provider_confirmation: string
  updated_at: string
  created_at: string
  package_version: number
  data_scope: "real" | "guided_demo" | "synthetic_test"
  opportunity: {
    id: string
    title: string
    provider_name: string
    deadline_at: string | null
    canonical_url: string
    application_url: string
  } | null
}

type TimelineOutcome = {
  package_id: string
  event_type: string
  created_at: string
}

const outcomeOptions = [
  { event: "shortlisted", label: "Shortlisted" },
  { event: "interview_requested", label: "Interview requested" },
  { event: "accepted", label: "Accepted" },
  { event: "declined", label: "Declined" },
  { event: "withdrawn", label: "Withdrawn" },
] as const

function formatDate(value: string | null | undefined) {
  if (!value) return "Not recorded"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not recorded"
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function displayLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function latestOutcomeFor(packageId: string, outcomes: TimelineOutcome[]) {
  return outcomes
    .filter((item) => item.package_id === packageId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null
}

function artistStage(packageRecord: ExternalPackage, outcome: TimelineOutcome | null) {
  if (outcome) {
    if (outcome.event_type === "accepted") return "Accepted"
    if (outcome.event_type === "declined") return "Declined"
    if (outcome.event_type === "withdrawn") return "Withdrawn"
    if (outcome.event_type === "shortlisted") return "Shortlisted"
    if (outcome.event_type === "interview_requested") return "Response received"
  }
  if (packageRecord.state === "missing_information") return "Needs information"
  if (["draft", "artist_review_required"].includes(packageRecord.state)) return "Draft"
  if (["ready_for_submission", "email_preview_ready", "external_submission_required"].includes(packageRecord.state)) return "Ready"
  if (["submitted_unconfirmed", "submitted", "provider_confirmed"].includes(packageRecord.state)) return "Submitted"
  if (packageRecord.state === "withdrawn") return "Withdrawn"
  if (packageRecord.state === "deadline_passed") return "Needs information"
  return displayLabel(packageRecord.state)
}

function nextAction(packageRecord: ExternalPackage, outcome: TimelineOutcome | null) {
  if (outcome?.event_type === "accepted") return "Review next steps with the institution."
  if (outcome?.event_type === "declined") return "No action required. Keep the preserved application for reference."
  if (outcome?.event_type === "withdrawn") return "No action required."
  if (outcome?.event_type === "shortlisted") return "Check for interview or additional-material requests."
  if (outcome?.event_type === "interview_requested") return "Respond to the institution and keep the application thread current."
  if (packageRecord.state === "missing_information") return "Resolve the missing application items."
  if (["draft", "artist_review_required"].includes(packageRecord.state)) return "Continue preparing and review the application."
  if (["ready_for_submission", "email_preview_ready", "external_submission_required"].includes(packageRecord.state)) return "Finalize the exact version, then deliver it through the official channel."
  if (["submitted_unconfirmed", "submitted", "provider_confirmed"].includes(packageRecord.state)) return "Await a response; update the outcome only when something actually changes."
  if (packageRecord.state === "deadline_passed") return "The recorded deadline passed before this package was finalized."
  return "Open the application to review its current state."
}

function nativeStatusLabel(application: ApplicationRecord) {
  return displayLabel(application.status)
}

export function UnifiedArtistApplications() {
  const [nativeApplications, setNativeApplications] = useState<ApplicationRecord[]>([])
  const [packages, setPackages] = useState<ExternalPackage[]>([])
  const [outcomes, setOutcomes] = useState<TimelineOutcome[]>([])
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [updatingPackage, setUpdatingPackage] = useState("")
  const [outcomeMenu, setOutcomeMenu] = useState("")

  async function loadExternalPackages() {
    const account = await loadKleioAccount()
    if (!account) throw new Error("Please sign in to view your applications.")
    const supabase = getSupabaseBrowserClient()
    const [{ data: packageRows, error: packageError }, { data: eventRows, error: eventError }] = await Promise.all([
      supabase
        .from("application_packages")
        .select("id,opportunity_id,state,submission_method,submitted_at,artist_approved_at,provider_confirmation,updated_at,created_at,package_version,data_scope,opportunity:opportunities(id,title,provider_name,deadline_at,canonical_url,application_url)")
        .eq("artist_user_id", account.user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("application_timeline_events")
        .select("package_id,event_type,created_at")
        .eq("artist_user_id", account.user.id)
        .in("event_type", outcomeOptions.map((option) => option.event))
        .order("created_at", { ascending: false }),
    ])
    if (packageError) throw packageError
    if (eventError) throw eventError
    return {
      packages: (packageRows ?? []) as unknown as ExternalPackage[],
      outcomes: (eventRows ?? []) as TimelineOutcome[],
    }
  }

  async function refresh({ quiet = false } = {}) {
    if (quiet) setRefreshing(true)
    else setLoading(true)
    setError("")
    try {
      const [native, external, nextNotifications] = await Promise.all([
        loadArtistApplications(),
        loadExternalPackages(),
        loadNotifications(),
      ])
      setNativeApplications(native)
      setPackages(external.packages)
      setOutcomes(external.outcomes)
      setNotifications(nextNotifications)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not load your applications.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  async function readNotification(id: string) {
    try {
      await markNotificationRead(id)
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, read_at: item.read_at || new Date().toISOString() } : item))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not update this notification.")
    }
  }

  async function recordOutcome(packageRecord: ExternalPackage, eventType: typeof outcomeOptions[number]["event"], label: string) {
    setUpdatingPackage(packageRecord.id)
    setOutcomeMenu("")
    setError("")
    setMessage("")
    try {
      await recordArtistApplicationTimelineEvent({
        packageId: packageRecord.id,
        eventType,
        summary: `Artist updated the application outcome to ${label}.`,
        eventMetadata: { source: "applications_dashboard" },
      })
      setOutcomes((current) => [{ package_id: packageRecord.id, event_type: eventType, created_at: new Date().toISOString() }, ...current])
      setMessage(`${label} recorded as an artist update. KLEIO is not treating it as institution-confirmed evidence.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not update this application outcome.")
    } finally {
      setUpdatingPackage("")
    }
  }

  const totalCount = nativeApplications.length + packages.length
  const submittedCount = useMemo(() => packages.filter((item) => ["submitted_unconfirmed", "submitted", "provider_confirmed"].includes(item.state)).length + nativeApplications.filter((item) => item.status !== "draft").length, [nativeApplications, packages])

  return (
    <main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <WorkspacePageHeader eyebrow="Artist workspace" title="Applications" description="Your source of truth for KLEIO-hosted, email, portal, and downloaded application packages." />
          <button className={secondary} type="button" disabled={refreshing} onClick={() => void refresh({ quiet: true })}>{refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}Refresh</button>
        </div>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className={card}><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Applications</p><p className="mt-1 font-serif text-3xl font-semibold text-[#3E3654]">{totalCount}</p></div>
          <div className={card}><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Submitted</p><p className="mt-1 font-serif text-3xl font-semibold text-[#3E3654]">{submittedCount}</p></div>
          <div className={card}><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">External packages</p><p className="mt-1 font-serif text-3xl font-semibold text-[#3E3654]">{packages.length}</p></div>
        </section>

        {loading ? <div className={`${card} flex items-center gap-2 text-sm text-muted-foreground`} role="status"><Loader2 className="size-4 animate-spin" />Loading your application history…</div> : null}
        {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">{error}</div> : null}
        {message ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">{message}</div> : null}

        {!loading && notifications.length > 0 && <section className={card}>
          <div className="flex items-start gap-3"><MessageSquareText className="mt-0.5 size-5 text-[#6F5DA7]" /><div><h2 className="font-serif text-xl font-semibold">Notifications</h2><p className="mt-1 text-sm text-muted-foreground">Application replies and status changes that need your attention.</p></div></div>
          <div className="mt-4 space-y-2">{notifications.map((item) => <button key={item.id} onClick={() => void readNotification(item.id)} className={`block w-full rounded-xl border border-[#E7E1F7] p-3 text-left transition hover:bg-[#FAF8FD] ${item.read_at ? "opacity-60" : "bg-[#F7F4FF]"}`}><span className="text-sm font-semibold">{item.title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.body} · {formatDate(item.created_at)}</span></button>)}</div>
        </section>}

        {!loading && totalCount === 0 ? <section className={`${card} text-sm leading-6 text-muted-foreground`}>No applications yet. Start from an opportunity and KLEIO will keep the prepared package and its history here.</section> : null}

        {packages.map((packageRecord) => {
          const outcome = latestOutcomeFor(packageRecord.id, outcomes)
          const stage = artistStage(packageRecord, outcome)
          const deadline = packageRecord.opportunity?.deadline_at
          const sourceUrl = packageRecord.opportunity?.canonical_url || packageRecord.opportunity?.application_url
          return <article className={card} key={packageRecord.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8874C1]">{displayLabel(packageRecord.submission_method)} application</p>
                <h2 className="mt-1 font-serif text-xl font-semibold text-[#292631]">{packageRecord.opportunity?.title || "Application package"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{packageRecord.opportunity?.provider_name || "Institution"}{deadline ? ` · Deadline ${formatDate(deadline)}` : ""}</p>
              </div>
              <span className="rounded-full bg-[#F4F1FA] px-3 py-1 text-xs font-semibold text-[#665A85]">{stage}</span>
            </div>

            <div className="mt-4 grid gap-3 rounded-xl border border-[#ECE7F5] bg-[#FCFBFE] p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next relevant action</p><p className="mt-1 text-sm leading-6 text-[#403A4A]">{nextAction(packageRecord, outcome)}</p><p className="mt-1 text-xs text-muted-foreground">Updated {formatDate(outcome?.created_at || packageRecord.updated_at)} · Package revision {packageRecord.package_version}</p></div>
              <div className="flex flex-wrap gap-2"><Link className={primary} href={`/artist-dashboard/applications/prepare/?opportunity=${encodeURIComponent(packageRecord.opportunity_id)}`}><FileText className="size-4" />Open application</Link>{sourceUrl && <a className={secondary} href={sourceUrl} target="_blank" rel="noreferrer">Source<ExternalLink className="size-4" /></a>}</div>
            </div>

            {["submitted_unconfirmed", "submitted", "provider_confirmed"].includes(packageRecord.state) && !["accepted", "declined", "withdrawn"].includes(outcome?.event_type || "") ? <div className="mt-4 border-t border-[#EEEAF6] pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-[#292631]">Outcome update</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Use this only when something actually changed. Your update is labelled artist-reported unless KLEIO has separate evidence.</p></div><div className="relative"><button type="button" className={secondary} aria-expanded={outcomeMenu === packageRecord.id} disabled={updatingPackage === packageRecord.id} onClick={() => setOutcomeMenu((current) => current === packageRecord.id ? "" : packageRecord.id)}>{updatingPackage === packageRecord.id ? <Loader2 className="size-4 animate-spin" /> : <History className="size-4" />}Update outcome<ChevronDown className="size-4" /></button>{outcomeMenu === packageRecord.id && <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-[#DED7EF] bg-white p-1.5 shadow-xl">{outcomeOptions.map((option) => <button key={option.event} type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#403A4A] hover:bg-[#F5F1FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A997E8]" onClick={() => void recordOutcome(packageRecord, option.event, option.label)}>{option.label}</button>)}</div>}</div></div>
            </div> : null}
          </article>
        })}

        {nativeApplications.map((application) => {
          const call = applicationCall(application)
          return <article className={card} key={application.id}>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8874C1]">KLEIO-hosted application</p><h2 className="mt-1 font-serif text-xl font-semibold">{call?.title || "Application"}</h2><p className="mt-1 text-sm text-muted-foreground">{call?.institution_name || "Institution"} · Updated {formatDate(application.updated_at)}</p></div><span className="rounded-full bg-[#F4F1FA] px-3 py-1 text-xs font-semibold text-[#665A85]">{nativeStatusLabel(application)}</span></div>
            <div className="mt-4 border-t border-[#EEEAF6] pt-4"><div className="flex items-start gap-2"><Clock3 className="mt-0.5 size-4 text-[#6F5DA7]" /><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status history</p><ul className="mt-2 space-y-2">{(application.application_status_history || []).length ? application.application_status_history?.sort((a,b) => a.created_at.localeCompare(b.created_at)).map((entry) => <li key={entry.id} className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-600" />{displayLabel(entry.new_status)} · {formatDate(entry.created_at)}</li>) : <li className="text-sm text-muted-foreground">Draft created {formatDate(application.created_at)}</li>}</ul></div></div></div>
          </article>
        })}
      </div>
    </main>
  )
}