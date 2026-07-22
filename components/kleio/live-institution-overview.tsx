"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  MapPin,
  Plus,
  UsersRound,
} from "lucide-react"
import {
  loadInstitutionApplications,
  loadInstitutionOpenCalls,
  loadInstitutionProfile,
  type ApplicationRecord,
  type InstitutionProfileRecord,
  type OpenCallRecord,
} from "@/lib/kleio-live-data"

const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]"

function MetricCard({ label, value, description, href, icon: Icon }: { label: string; value: number; description: string; href: string; icon: typeof FileText }) {
  return (
    <Link href={href} className={`${card} group transition-colors hover:bg-[#FDFBFF]`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{label}</p>
          <p className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#292631]">{value}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-[#F7F4FF] text-[#5B4B8A]">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[#6F6882]">{description}</p>
      <p className="mt-4 text-xs font-semibold text-[#5B4B8A] transition-opacity group-hover:opacity-75">Open workspace →</p>
    </Link>
  )
}

function formatDeadline(value: string | null) {
  if (!value) return "No deadline"
  const date = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return "No deadline"
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date)
}

export function LiveInstitutionOverview() {
  const [profile, setProfile] = useState<InstitutionProfileRecord | null>(null)
  const [calls, setCalls] = useState<OpenCallRecord[]>([])
  const [applications, setApplications] = useState<ApplicationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    Promise.all([loadInstitutionProfile(), loadInstitutionOpenCalls(), loadInstitutionApplications()])
      .then(([nextProfile, nextCalls, nextApplications]) => {
        if (!active) return
        setProfile(nextProfile)
        setCalls(nextCalls)
        setApplications(nextApplications)
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "KLEIO could not load this institution workspace.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const metrics = useMemo(() => {
    const activeCalls = calls.filter((call) => call.status === "open" || call.status === "under_review").length
    const needsAttention = applications.filter((application) => application.status === "needs_follow_up").length
    const underReview = applications.filter((application) => application.status === "submitted" || application.status === "in_review").length
    const decisionReady = applications.filter((application) => ["shortlisted", "finalist", "accepted"].includes(application.status)).length
    return { activeCalls, needsAttention, underReview, decisionReady }
  }, [applications, calls])

  const recentCalls = useMemo(() => calls.slice(0, 4), [calls])
  const recentApplications = useMemo(() => applications.slice(0, 5), [applications])

  if (loading) {
    return (
      <main className="flex h-full items-center justify-center bg-white">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading your institution workspace…
        </div>
      </main>
    )
  }

  if (error || !profile) {
    return (
      <main className="flex h-full items-center justify-center bg-white px-6">
        <section className={`${card} max-w-lg text-center`}>
          <AlertCircle className="mx-auto size-6 text-primary" />
          <h1 className="mt-4 font-serif text-xl font-semibold">Your institution profile needs attention</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{error || "KLEIO could not find the institution connected to this account."}</p>
          <Link href="/signup/institution/" className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Complete institution onboarding
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="h-full overflow-y-auto bg-[#FEFDFF] px-5 py-6 xl:px-7 xl:py-7">
      <div className="mx-auto w-full max-w-[1440px] space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Institution workspace</p>
            <h1 className="mt-1 text-pretty font-serif text-[1.8rem] font-semibold tracking-tight text-[#292631] xl:text-3xl">{profile.display_name || profile.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#7F7890]">
              {profile.organization_type && <span className="inline-flex items-center gap-1.5"><Building2 className="size-3.5" />{profile.organization_type}</span>}
              {profile.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{profile.location}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/settings/" className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A]">Institution settings</Link>
            <Link href="/programs/new/" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="size-4" />Create open call</Link>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Active calls" value={metrics.activeCalls} description="Published calls currently open or moving through review." href="/programs/" icon={ClipboardList} />
          <MetricCard label="Needs attention" value={metrics.needsAttention} description="Applications waiting for missing information or follow-up." href="/review-queue/" icon={AlertCircle} />
          <MetricCard label="In review" value={metrics.underReview} description="Submitted applications currently entering or moving through review." href="/review-room/" icon={UsersRound} />
          <MetricCard label="Decision ready" value={metrics.decisionReady} description="Shortlisted, finalist, or accepted applications in this workspace." href="/shortlist/" icon={CheckCircle2} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)]">
          <div className={card}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-serif text-xl font-semibold text-[#292631]">Open calls</p>
                <p className="mt-1 text-sm text-[#7F7890]">Only calls owned by this institution are shown here.</p>
              </div>
              <Link href="/programs/" className="text-xs font-semibold text-[#5B4B8A]">View all →</Link>
            </div>
            <div className="mt-4 space-y-2">
              {recentCalls.length ? recentCalls.map((call) => (
                <article key={call.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E7E1F7] px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#292631]">{call.title}</p>
                    <p className="mt-0.5 text-xs text-[#7F7890]">Deadline {formatDeadline(call.deadline_at)} · {call.status.replaceAll("_", " ")}</p>
                  </div>
                  <span className="rounded-full bg-[#F7F4FF] px-3 py-1 text-[0.65rem] font-semibold capitalize text-[#5B4B8A]">{call.status.replaceAll("_", " ")}</span>
                </article>
              )) : (
                <div className="rounded-xl border border-dashed border-[#D8D0F2] bg-[#FDFBFF] px-4 py-8 text-center">
                  <p className="text-sm font-medium text-[#292631]">No calls have been created yet.</p>
                  <p className="mt-1 text-xs text-[#7F7890]">Create the first call when the program structure is ready.</p>
                </div>
              )}
            </div>
          </div>

          <div className={card}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-serif text-xl font-semibold text-[#292631]">Recent applications</p>
                <p className="mt-1 text-sm text-[#7F7890]">Authenticated submissions connected to your calls.</p>
              </div>
              <Link href="/submissions/" className="text-xs font-semibold text-[#5B4B8A]">View all →</Link>
            </div>
            <div className="mt-4 space-y-2">
              {recentApplications.length ? recentApplications.map((application) => (
                <article key={application.id} className="rounded-xl border border-[#E7E1F7] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#292631]">{application.artist_name}</p>
                      <p className="mt-0.5 truncate text-xs text-[#7F7890]">{application.status.replaceAll("_", " ")}</p>
                    </div>
                    <FileText className="size-4 shrink-0 text-[#A997E8]" />
                  </div>
                </article>
              )) : (
                <div className="rounded-xl border border-dashed border-[#D8D0F2] bg-[#FDFBFF] px-4 py-8 text-center">
                  <p className="text-sm font-medium text-[#292631]">No submitted applications yet.</p>
                  <p className="mt-1 text-xs text-[#7F7890]">Applications will appear after artists submit to an owned call.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
