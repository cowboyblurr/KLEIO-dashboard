"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react"
import {
  analyticsSnapshotCsv,
  loadKleioAdminAnalyticsSnapshot,
  type AnalyticsFilters,
  type AnalyticsSnapshot,
  type AnalyticsTrafficClass,
  type AnalyticsViewport,
} from "@/lib/kleio-admin-analytics"
import { loadKleioAccount } from "@/lib/kleio-supabase"

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const field = "min-h-11 rounded-xl border border-[#DED7EF] bg-white px-3 py-2 text-sm text-[#292631] outline-none transition focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12"

const ACQUISITION_SOURCES = [
  ["", "All acquisition sources"],
  ["direct_outreach", "Direct outreach"],
  ["artist_referral", "Artist referral"],
  ["institution_referral", "Institution referral"],
  ["linkedin", "LinkedIn"],
  ["instagram", "Instagram"],
  ["organic_search", "Organic search"],
  ["direct", "Direct traffic"],
  ["opportunity_entry", "Opportunity-specific entry"],
  ["unknown", "Unknown"],
] as const

const TRAFFIC_CLASSES: Array<[AnalyticsTrafficClass, string]> = [
  ["real_user", "Real users"],
  ["internal_qa", "Internal QA"],
  ["guided_demo", "Guided demo"],
  ["synthetic_preview", "Synthetic preview"],
  ["automated_test", "Automated test"],
]

const VIEWPORTS: Array<["" | AnalyticsViewport, string]> = [
  ["", "All device classes"],
  ["mobile", "Mobile"],
  ["tablet", "Tablet"],
  ["desktop", "Desktop"],
  ["unknown", "Unknown"],
]

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function initialFilters(): AnalyticsFilters {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 29)
  return {
    start: isoDate(start),
    end: isoDate(end),
    trafficClass: "real_user",
    acquisitionSource: null,
    viewport: null,
  }
}

function number(value: number | null | undefined) {
  return typeof value === "number" ? new Intl.NumberFormat().format(value) : "—"
}

function percentage(value: number | null | undefined) {
  return typeof value === "number" ? `${value.toFixed(1)}%` : "Not enough data"
}

function duration(value: number | null | undefined) {
  if (typeof value !== "number") return "—"
  if (value < 1) return `${Math.round(value * 60)} min`
  if (value < 48) return `${value.toFixed(1)} hr`
  return `${(value / 24).toFixed(1)} days`
}

function title(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-[20px] border border-[#E7E1F7] bg-white p-4 shadow-[0_12px_32px_rgba(82,64,130,0.04)]">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#81788E]">{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#292631]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#746E80]">{note}</p>
    </article>
  )
}

function SectionHeader({ eyebrow, title: heading, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-[0.67rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">{eyebrow}</p>
      <h2 className="mt-1 font-serif text-2xl font-semibold tracking-[-0.03em] text-[#292631]">{heading}</h2>
      <p className="mt-2 text-sm leading-6 text-[#746E80]">{description}</p>
    </div>
  )
}

function EmptyState({ children }: { children: string }) {
  return <p className="rounded-xl border border-dashed border-[#D8D0F2] bg-[#FAF9FD] p-6 text-center text-sm text-[#746E80]">{children}</p>
}

function FunnelTable({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  const maximum = Math.max(...snapshot.funnel.map((stage) => stage.people), 1)
  return (
    <div className="overflow-x-auto rounded-[20px] border border-[#E7E1F7] bg-white">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <caption className="sr-only">Artist signup and activation funnel with counts, conversion, drop-off and median time between stages.</caption>
        <thead className="bg-[#F8F5FC] text-xs uppercase tracking-[0.1em] text-[#746E80]">
          <tr>
            <th scope="col" className="px-4 py-3">Stage</th>
            <th scope="col" className="px-4 py-3">People</th>
            <th scope="col" className="px-4 py-3">Conversion</th>
            <th scope="col" className="px-4 py-3">Drop-off</th>
            <th scope="col" className="px-4 py-3">Median time</th>
          </tr>
        </thead>
        <tbody>
          {snapshot.funnel.map((stage) => (
            <tr key={stage.event_name} className="border-t border-[#EEEAF6] align-top">
              <th scope="row" className="px-4 py-4 font-semibold text-[#292631]">
                <span className="block">{stage.stage}</span>
                <span className="mt-2 block h-2 overflow-hidden rounded-full bg-[#EFEAF7]" aria-hidden="true">
                  <span className="block h-full rounded-full bg-[#75639E]" style={{ width: `${Math.max(2, (stage.people / maximum) * 100)}%` }} />
                </span>
              </th>
              <td className="px-4 py-4 font-semibold">{number(stage.people)}</td>
              <td className="px-4 py-4">{percentage(stage.conversion_from_previous_pct)}</td>
              <td className="px-4 py-4">{percentage(stage.dropoff_from_previous_pct)}</td>
              <td className="px-4 py-4">{duration(stage.median_hours_from_previous)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function exportSnapshot(snapshot: AnalyticsSnapshot) {
  const blob = new Blob([analyticsSnapshotCsv(snapshot)], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `kleio-aggregate-analytics-${snapshot.range.start.slice(0, 10)}-${snapshot.range.end.slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function AdminProductAnalyticsDashboard() {
  const [filters, setFilters] = useState<AnalyticsFilters>(() => initialFilters())
  const [appliedFilters, setAppliedFilters] = useState<AnalyticsFilters>(() => initialFilters())
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError("")
    void loadKleioAccount()
      .then((account) => {
        if (!active) return null
        if (!account) throw new Error("Sign in with an authorized KLEIO administrator account.")
        return loadKleioAdminAnalyticsSnapshot(appliedFilters)
      })
      .then((next) => {
        if (!active || !next) return
        setSnapshot(next)
        setAuthorized(true)
      })
      .catch((reason) => {
        if (!active) return
        const message = reason instanceof Error ? reason.message : "The analytics dashboard could not be loaded."
        setAuthorized(message.includes("administrator") ? false : null)
        setError(message)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [appliedFilters])

  const highestDropoff = useMemo(() => {
    if (!snapshot) return null
    return snapshot.funnel
      .filter((stage) => typeof stage.dropoff_from_previous_pct === "number")
      .sort((left, right) => (right.dropoff_from_previous_pct || 0) - (left.dropoff_from_previous_pct || 0))[0] || null
  }, [snapshot])

  if (loading && !snapshot) {
    return <main className="grid min-h-dvh place-items-center bg-[#FCFBFE] p-6"><p role="status" className="flex items-center gap-2 text-sm font-semibold text-[#625C70]"><Loader2 className="size-4 animate-spin" />Loading privacy-safe aggregate analytics…</p></main>
  }

  if (authorized === false || (!snapshot && error)) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#FCFBFE] p-6">
        <section className="max-w-lg rounded-[28px] border border-[#E2DCF1] bg-white p-7 text-center shadow-[0_22px_70px_rgba(82,64,130,0.07)]" role="alert">
          <ShieldCheck className="mx-auto size-10 text-[#75639E]" />
          <h1 className="mt-4 font-serif text-3xl font-semibold">Private KLEIO analytics</h1>
          <p className="mt-3 text-sm leading-6 text-[#746E80]">{error}</p>
          <p className="mt-3 text-xs leading-5 text-[#81788E]">This route does not expose raw event history. Access is enforced by the administrator-only database function.</p>
        </section>
      </main>
    )
  }

  if (!snapshot) return null

  return (
    <main className="min-h-dvh bg-[#FCFBFE] px-4 py-6 text-[#292631] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <header className="rounded-[30px] border border-[#E2DCF1] bg-[linear-gradient(145deg,#F7F3FF,#FFFFFF)] p-6 shadow-[0_24px_76px_rgba(82,64,130,0.08)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#75639E]">Administrator workspace</p>
              <h1 className="mt-2 font-serif text-4xl font-semibold tracking-[-0.05em]">Product analytics</h1>
              <p className="mt-3 text-sm leading-7 text-[#746E80]">Decision-useful artist-beta signals derived from limited first-party events and durable product records. Raw artwork, professional materials, free-form text and personal identifiers are not shown.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={secondary} onClick={() => setAppliedFilters({ ...appliedFilters })} disabled={loading}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
              <button type="button" className={primary} onClick={() => exportSnapshot(snapshot)}><Download className="size-4" />Export aggregate CSV</button>
            </div>
          </div>
        </header>

        <section className="rounded-[24px] border border-[#E7E1F7] bg-white p-5 shadow-[0_14px_42px_rgba(82,64,130,0.05)]" aria-labelledby="analytics-filters-title">
          <div className="flex items-center gap-2"><Filter className="size-4 text-[#75639E]" /><h2 id="analytics-filters-title" className="text-sm font-semibold">Report filters</h2></div>
          <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" onSubmit={(event) => { event.preventDefault(); setAppliedFilters({ ...filters }) }}>
            <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]">Start date<input className={field} type="date" value={filters.start} max={filters.end} onChange={(event) => setFilters((current) => ({ ...current, start: event.target.value }))} /></label>
            <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]">End date<input className={field} type="date" value={filters.end} min={filters.start} onChange={(event) => setFilters((current) => ({ ...current, end: event.target.value }))} /></label>
            <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]">Traffic class<select className={field} value={filters.trafficClass} onChange={(event) => setFilters((current) => ({ ...current, trafficClass: event.target.value as AnalyticsTrafficClass }))}>{TRAFFIC_CLASSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]">Acquisition source<select className={field} value={filters.acquisitionSource || ""} onChange={(event) => setFilters((current) => ({ ...current, acquisitionSource: event.target.value || null }))}>{ACQUISITION_SOURCES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]">Device class<select className={field} value={filters.viewport || ""} onChange={(event) => setFilters((current) => ({ ...current, viewport: (event.target.value || null) as AnalyticsViewport | null }))}>{VIEWPORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <button className={`${primary} sm:col-span-2 lg:col-span-5 lg:justify-self-end`} type="submit" disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" /> : <Filter className="size-4" />}Apply filters</button>
          </form>
          {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
        </section>

        {snapshot.sample_warnings.length > 0 && <aside className="rounded-[22px] border border-amber-200 bg-amber-50 p-5" aria-labelledby="sample-warning-title"><h2 id="sample-warning-title" className="flex items-center gap-2 text-sm font-semibold text-amber-950"><AlertTriangle className="size-4" />Interpretation warnings</h2><ul className="mt-3 grid gap-2 text-sm leading-6 text-amber-900">{snapshot.sample_warnings.map((warning) => <li key={warning}>• {warning}</li>)}</ul></aside>}

        <section aria-labelledby="overview-title">
          <SectionHeader eyebrow="Overview" title="Artist-beta health" description="Counts are shown beside rates. Real-user traffic is selected by default, and small cohorts remain visibly qualified." />
          <h2 id="overview-title" className="sr-only">Artist beta overview metrics</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <MetricCard label="Visitors" value={number(snapshot.overview.visitors)} note="Distinct landing sessions or authenticated people." />
            <MetricCard label="Signup starts" value={number(snapshot.overview.signup_starts)} note="Artists who began the account workflow." />
            <MetricCard label="Confirmed accounts" value={number(snapshot.overview.confirmed_accounts)} note="Derived from confirmed authentication state." />
            <MetricCard label="First value" value={number(snapshot.overview.first_value_artists)} note="Completed artwork or meaningful confirmed Passport record." />
            <MetricCard label="Activated artists" value={number(snapshot.overview.activated_artists)} note="Onboarding, three works, Passport and opportunity action complete." />
            <MetricCard label="Onboarding complete" value={number(snapshot.overview.onboarding_completions)} note="Durably completed artist onboarding." />
            <MetricCard label="Import success" value={percentage(snapshot.overview.upload_success_rate_pct)} note="Complete or partial import outcomes divided by starts." />
            <MetricCard label="Opportunity engaged" value={number(snapshot.overview.opportunity_engaged_artists)} note="Saved, readiness or preparation action." />
            <MetricCard label="Error-free workflows" value={percentage(snapshot.overview.error_free_workflow_rate_pct)} note="Workflows without a tracked blocking failure." />
            <MetricCard label="Highest funnel drop" value={highestDropoff ? `${highestDropoff.stage} · ${percentage(highestDropoff.dropoff_from_previous_pct)}` : "Not enough data"} note="Directional until the relevant cohort reaches ten people." />
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="funnel-title"><SectionHeader eyebrow="Core journey" title="Signup to activation funnel" description="Anonymous sessions are linked to an authenticated actor only when the same random browser-session identifier continues through signup." /><h2 id="funnel-title" className="sr-only">Signup to activation funnel</h2><FunnelTable snapshot={snapshot} /></section>

        <section className="space-y-4" aria-labelledby="onboarding-title"><SectionHeader eyebrow="Friction" title="Onboarding by step and device" description="Step views, successful persistence, intentional skips, validation failures, save failures and resumptions appear together." /><h2 id="onboarding-title" className="sr-only">Onboarding friction table</h2>{snapshot.onboarding_friction.length ? <div className="overflow-x-auto rounded-[20px] border border-[#E7E1F7] bg-white"><table className="w-full min-w-[920px] border-collapse text-left text-sm"><caption className="sr-only">Onboarding friction by step and viewport.</caption><thead className="bg-[#F8F5FC] text-xs uppercase tracking-[0.09em] text-[#746E80]"><tr><th className="px-4 py-3">Step</th><th className="px-4 py-3">Device</th><th className="px-4 py-3">Views</th><th className="px-4 py-3">Completed</th><th className="px-4 py-3">Skipped</th><th className="px-4 py-3">Validation</th><th className="px-4 py-3">Save failures</th><th className="px-4 py-3">Resumed</th></tr></thead><tbody>{snapshot.onboarding_friction.map((item) => <tr key={`${item.step}:${item.viewport}`} className="border-t border-[#EEEAF6]"><th scope="row" className="px-4 py-3 font-semibold">{title(item.step)}</th><td className="px-4 py-3">{title(item.viewport)}</td><td className="px-4 py-3">{number(item.views)}</td><td className="px-4 py-3">{number(item.completed)}</td><td className="px-4 py-3">{number(item.skipped)}</td><td className="px-4 py-3">{number(item.validation_failures)}</td><td className="px-4 py-3">{number(item.save_failures)}</td><td className="px-4 py-3">{number(item.resumed)}</td></tr>)}</tbody></table></div> : <EmptyState>No onboarding step events match this range.</EmptyState>}</section>

        <section className="space-y-4" aria-labelledby="imports-title"><SectionHeader eyebrow="Media reliability" title="Import and artwork handoff" description="Starts, complete and partial outcomes, failures, completion time, saved artwork records and portfolio inclusion remain separated." /><h2 id="imports-title" className="sr-only">Import performance table</h2>{snapshot.import_performance.length ? <div className="grid gap-3 lg:grid-cols-2">{snapshot.import_performance.map((item) => <article key={`${item.source}:${item.viewport}`} className="rounded-[20px] border border-[#E7E1F7] bg-white p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-serif text-xl font-semibold">{title(item.source)}</h3><p className="mt-1 text-xs text-[#746E80]">{title(item.viewport)}</p></div><span className="rounded-full border border-[#D8D0F2] bg-[#FAF9FD] px-3 py-1 text-xs font-semibold text-[#5B4B8A]">{percentage(item.completion_rate_pct)}</span></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><div><dt className="text-xs text-[#81788E]">Starts</dt><dd className="mt-1 font-semibold">{number(item.starts)}</dd></div><div><dt className="text-xs text-[#81788E]">Completed</dt><dd className="mt-1 font-semibold">{number(item.completed)}</dd></div><div><dt className="text-xs text-[#81788E]">Partial</dt><dd className="mt-1 font-semibold">{number(item.partially_completed)}</dd></div><div><dt className="text-xs text-[#81788E]">Failed</dt><dd className="mt-1 font-semibold">{number(item.failed)}</dd></div><div><dt className="text-xs text-[#81788E]">Median time</dt><dd className="mt-1 font-semibold">{typeof item.median_completion_minutes === "number" ? `${item.median_completion_minutes.toFixed(1)} min` : "—"}</dd></div><div><dt className="text-xs text-[#81788E]">Artwork saved</dt><dd className="mt-1 font-semibold">{number(item.artwork_records_saved)}</dd></div><div><dt className="text-xs text-[#81788E]">Portfolio inclusion</dt><dd className="mt-1 font-semibold">{number(item.portfolio_inclusions)}</dd></div></dl></article>)}</div> : <EmptyState>No import activity matches this range.</EmptyState>}</section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="space-y-4" aria-labelledby="passport-title"><SectionHeader eyebrow="Feature adoption" title="Creative Passport usage" description="The report counts starts, modes, completed sections, proposal decisions, autosave and recovery without storing Passport text." /><h2 id="passport-title" className="sr-only">Creative Passport usage</h2>{snapshot.passport_usage.length ? <div className="overflow-x-auto rounded-[20px] border border-[#E7E1F7] bg-white"><table className="w-full min-w-[620px] border-collapse text-left text-sm"><caption className="sr-only">Creative Passport feature usage.</caption><thead className="bg-[#F8F5FC] text-xs uppercase tracking-[0.09em] text-[#746E80]"><tr><th className="px-4 py-3">Event</th><th className="px-4 py-3">Mode</th><th className="px-4 py-3">Section</th><th className="px-4 py-3">People</th><th className="px-4 py-3">Events</th></tr></thead><tbody>{snapshot.passport_usage.map((item, index) => <tr key={`${item.event_name}:${item.mode}:${item.section}:${index}`} className="border-t border-[#EEEAF6]"><th scope="row" className="px-4 py-3 font-semibold">{title(item.event_name)}</th><td className="px-4 py-3">{title(item.mode)}</td><td className="px-4 py-3">{title(item.section)}</td><td className="px-4 py-3">{number(item.people)}</td><td className="px-4 py-3">{number(item.events)}</td></tr>)}</tbody></table></div> : <EmptyState>No Creative Passport usage matches this range.</EmptyState>}</section>

          <section className="space-y-4" aria-labelledby="opportunities-title"><SectionHeader eyebrow="Professional action" title="Opportunity engagement" description="Viewing, searching, saving, readiness and preparation are kept distinct so superficial browsing is not mistaken for value." /><h2 id="opportunities-title" className="sr-only">Opportunity engagement metrics</h2><dl className="grid gap-3 sm:grid-cols-2">{Object.entries(snapshot.opportunity_engagement).map(([key, value]) => <div key={key} className="rounded-[18px] border border-[#E7E1F7] bg-white p-4"><dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[#81788E]">{title(key)}</dt><dd className="mt-2 font-serif text-2xl font-semibold">{number(value)}</dd></div>)}</dl></section>
        </div>

        <section className="space-y-4" aria-labelledby="reliability-title"><SectionHeader eyebrow="Reliability" title="Errors and recovery" description="Only stable error codes and safe workflow dimensions are shown. Raw provider errors, URLs, filenames and stack traces never enter this report." /><h2 id="reliability-title" className="sr-only">Reliability events</h2><div className="grid gap-4 lg:grid-cols-[1fr_320px]">{snapshot.reliability.length ? <div className="overflow-x-auto rounded-[20px] border border-[#E7E1F7] bg-white"><table className="w-full min-w-[760px] border-collapse text-left text-sm"><caption className="sr-only">User-visible errors by stable code, product step, source and viewport.</caption><thead className="bg-[#F8F5FC] text-xs uppercase tracking-[0.09em] text-[#746E80]"><tr><th className="px-4 py-3">Event</th><th className="px-4 py-3">Stable code</th><th className="px-4 py-3">Step</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Device</th><th className="px-4 py-3">Count</th></tr></thead><tbody>{snapshot.reliability.map((item, index) => <tr key={`${item.event_name}:${item.error_code}:${item.viewport}:${index}`} className="border-t border-[#EEEAF6]"><th scope="row" className="px-4 py-3 font-semibold">{title(item.event_name)}</th><td className="px-4 py-3 font-mono text-xs">{item.error_code}</td><td className="px-4 py-3">{title(item.step)}</td><td className="px-4 py-3">{title(item.source)}</td><td className="px-4 py-3">{title(item.viewport)}</td><td className="px-4 py-3 font-semibold">{number(item.count)}</td></tr>)}</tbody></table></div> : <EmptyState>No blocking reliability events match this range.</EmptyState>}<aside className="rounded-[20px] border border-[#E7E1F7] bg-white p-5"><h3 className="flex items-center gap-2 font-serif text-xl font-semibold"><CheckCircle2 className="size-5 text-emerald-700" />Recovery</h3><dl className="mt-4 grid gap-3 text-sm"><div><dt className="text-[#81788E]">Offered</dt><dd className="font-semibold">{number(snapshot.recovery.recovery_offered)}</dd></div><div><dt className="text-[#81788E]">Recovered workflows</dt><dd className="font-semibold">{number(snapshot.recovery.workflow_recovered)}</dd></div><div><dt className="text-[#81788E]">Recovered sessions</dt><dd className="font-semibold">{number(snapshot.recovery.session_recovered)}</dd></div><div><dt className="text-[#81788E]">Drafts restored</dt><dd className="font-semibold">{number(snapshot.recovery.draft_restored)}</dd></div><div><dt className="text-[#81788E]">Success rate</dt><dd className="font-semibold">{percentage(snapshot.recovery.recovery_success_rate_pct)}</dd></div></dl></aside></div></section>

        <section className="space-y-4" aria-labelledby="cohorts-title"><SectionHeader eyebrow="Retention" title="Activated artist return cohorts" description="Return usage is derived from event timestamps after activation; no artificial day-seven browser event is fired." /><h2 id="cohorts-title" className="sr-only">Activation cohorts</h2>{snapshot.cohorts.length ? <div className="overflow-x-auto rounded-[20px] border border-[#E7E1F7] bg-white"><table className="w-full min-w-[700px] border-collapse text-left text-sm"><caption className="sr-only">Activation cohorts with same-day, one-day, seven-day and fourteen-day return counts.</caption><thead className="bg-[#F8F5FC] text-xs uppercase tracking-[0.09em] text-[#746E80]"><tr><th className="px-4 py-3">Activation week</th><th className="px-4 py-3">Activated</th><th className="px-4 py-3">Same day</th><th className="px-4 py-3">Day 1</th><th className="px-4 py-3">Day 7</th><th className="px-4 py-3">Day 14</th></tr></thead><tbody>{snapshot.cohorts.map((cohort) => <tr key={cohort.activation_week} className="border-t border-[#EEEAF6]"><th scope="row" className="px-4 py-3 font-semibold">{new Date(cohort.activation_week).toLocaleDateString()}</th><td className="px-4 py-3">{number(cohort.activated_artists)}</td><td className="px-4 py-3">{number(cohort.same_day_returned)}</td><td className="px-4 py-3">{number(cohort.day_1_returned)}</td><td className="px-4 py-3">{number(cohort.day_7_returned)}</td><td className="px-4 py-3">{number(cohort.day_14_returned)}</td></tr>)}</tbody></table></div> : <EmptyState>No activated cohort is mature enough for this range.</EmptyState>}</section>

        <section className="space-y-4" aria-labelledby="quality-title"><SectionHeader eyebrow="Trust" title="Analytics data quality" description="This panel keeps internal, demo, preview and automated activity visible without allowing it to inflate real-user reporting." /><h2 id="quality-title" className="sr-only">Analytics data quality</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{TRAFFIC_CLASSES.map(([key, label]) => <MetricCard key={key} label={label} value={number(snapshot.data_quality.traffic_classes[key] || 0)} note="Events in the selected date range before report traffic filtering." />)}<MetricCard label="Rejected events" value={number(snapshot.data_quality.rejected_events)} note="Invalid, unauthorized, oversized or rate-limited attempts." /><MetricCard label="Duplicate attempts" value={number(snapshot.data_quality.duplicate_attempts)} note="Idempotent events accepted without another row." /><MetricCard label="Unknown acquisition" value={number(snapshot.data_quality.unknown_traffic_events)} note="Events without a trustworthy normalized source." /><MetricCard label="Missing versions" value={number(snapshot.data_quality.missing_event_versions)} note="Should remain zero under the controlled contract." /></div><p className="rounded-xl border border-[#E7E1F7] bg-white p-4 text-xs leading-5 text-[#746E80]">Last successful ingestion: {snapshot.data_quality.last_successful_ingestion_at ? new Date(snapshot.data_quality.last_successful_ingestion_at).toLocaleString() : "none"}. Last rejected attempt: {snapshot.data_quality.last_rejection_at ? new Date(snapshot.data_quality.last_rejection_at).toLocaleString() : "none"}.</p></section>

        <footer className="rounded-[22px] border border-[#E2DCF1] bg-white p-5 text-xs leading-6 text-[#746E80]"><p className="flex items-center gap-2 font-semibold text-[#5B4B8A]"><ShieldCheck className="size-4" />Privacy boundary</p><p className="mt-2">KLEIO analytics is first-party and limited to product decisions and reliability. This dashboard contains aggregate counts only. It does not include artist names, emails, UUIDs, artwork titles, uploaded filenames, professional text, application answers, private URLs, session replay or advertising-pixel data.</p><p className="mt-2 flex items-center gap-2"><Users className="size-4" />Every percentage should be interpreted with its underlying count and sample warning.</p><p className="mt-2 flex items-center gap-2"><Activity className="size-4" />The next product action should follow a repeated, sufficiently sized signal—not a single internal test session.</p><p className="mt-2 flex items-center gap-2"><ArrowDown className="size-4" />No public navigation points to this route.</p></footer>
      </div>
    </main>
  )
}
