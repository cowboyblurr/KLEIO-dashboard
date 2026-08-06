"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  ImageIcon,
  LayoutDashboard,
  Loader2,
  PencilLine,
  RefreshCw,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react"
import { AdaptiveArtistPassportExperience } from "@/components/kleio/adaptive-artist-passport-experience"
import { calculatePassportCompletion, type PassportCompletionResult } from "@/lib/kleio-passport-completion"
import {
  loadArtistApplications,
  loadArtistPassport,
  loadPortfolioWorks,
  type ArtistPassportRecord,
  type PortfolioWorkRecord,
} from "@/lib/kleio-live-data"
import { loadPassportReviewCount } from "@/lib/kleio-upload-to-passport"

const surface = "rounded-xl border border-[#E7E1F7] bg-white shadow-[0_12px_32px_rgba(82,64,130,0.04)]"
const primary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#D8D0F2] bg-white px-3 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/15"
const compact = "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[#D8D0F2] bg-white px-3 py-1.5 text-xs font-semibold text-[#5B4B8A] transition hover:bg-[#FAF8FE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/15"

type Mode = "overview" | "edit"
type PassportSummaryItem = {
  value: number
  label: string
  icon: LucideIcon
  href: string | null
}

export function CreativePassportWorkspace() {
  const [mode, setMode] = useState<Mode>("overview")
  const [profile, setProfile] = useState<ArtistPassportRecord | null>(null)
  const [works, setWorks] = useState<PortfolioWorkRecord[]>([])
  const [applicationCount, setApplicationCount] = useState(0)
  const [completion, setCompletion] = useState<PassportCompletionResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [guidanceOpen, setGuidanceOpen] = useState(false)
  const [revision, setRevision] = useState(0)

  async function refresh() {
    setLoading(true)
    setError("")
    try {
      const [loadedProfile, loadedWorks, applications, pendingReviewCount] = await Promise.all([
        loadArtistPassport(),
        loadPortfolioWorks(),
        loadArtistApplications(),
        loadPassportReviewCount().catch(() => 0),
      ])
      const result = calculatePassportCompletion(loadedProfile, loadedWorks)
      setProfile(loadedProfile)
      setWorks(loadedWorks)
      setApplicationCount(applications.filter((application) => !["declined", "withdrawn"].includes(application.status)).length)
      setCompletion(result)
      const meaningful = Boolean(loadedProfile?.professional_name?.trim() || loadedProfile?.bio?.trim() || loadedWorks.length)
      if (!meaningful || pendingReviewCount > 0) setMode("edit")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load the Creative Passport overview.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [revision])

  if (mode === "edit") {
    return (
      <main data-passport-scroll-owner="creative-passport" className="h-full overflow-y-auto bg-white">
        <style>{`
          [data-passport-scroll-owner="creative-passport"] [data-passport-edit-header] {
            position: static !important;
          }
          [data-passport-scroll-owner="creative-passport"] [data-passport-edit-content] > div {
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
          }
          [data-passport-scroll-owner="creative-passport"] [data-passport-edit-content] > div > section[aria-label="Creative Passport workflow"] {
            position: static !important;
          }
          [data-passport-scroll-owner="creative-passport"] [data-passport-edit-content] > div > div {
            min-height: 0 !important;
          }
          [data-passport-scroll-owner="creative-passport"] [data-passport-edit-content] main {
            height: auto !important;
            overflow: visible !important;
          }
        `}</style>

        <div data-passport-edit-header className="border-b border-[#EEEAF6] bg-white px-4 py-2 sm:px-6">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 truncate text-xs text-[#746E80]"><span className="font-semibold text-[#5B4B8A]">Creative Passport</span> · Edit your reusable artist information</p>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" className={compact} onClick={() => setGuidanceOpen((value) => !value)} aria-expanded={guidanceOpen}><ChevronDown className={`size-3.5 transition-transform ${guidanceOpen ? "rotate-180" : ""}`} />Why it matters</button>
              <button type="button" className={compact} onClick={() => { setRevision((value) => value + 1); setMode("overview") }}><LayoutDashboard className="size-3.5" />Overview</button>
            </div>
          </div>
          {guidanceOpen && <div className="mx-auto mt-2 max-w-[1180px] border-t border-[#EEEAF6] pt-2 text-xs leading-5 text-[#5F5968]">Your Passport is the artist-approved source record KLEIO can reuse for readiness and drafting. Gemini suggestions remain editable and private until you approve them in the matching field.</div>}
        </div>

        <div data-passport-edit-content>
          <AdaptiveArtistPassportExperience />
        </div>
      </main>
    )
  }

  const imageCount = works.filter((work) => work.image_path).length
  const missing = completion?.criticalMissing ?? []
  const summaryItems: PassportSummaryItem[] = [
    { value: works.length, label: "Portfolio works", icon: ImageIcon, href: "/artist-dashboard/portfolio/" },
    { value: imageCount, label: "Usable images", icon: CheckCircle2, href: "/artist-dashboard/media/" },
    { value: profile?.cv_file_path ? 1 : 0, label: "Core documents", icon: FileText, href: null },
    { value: applicationCount, label: "Active applications", icon: LayoutDashboard, href: "/artist-dashboard/applications/" },
  ]

  return (
    <main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 pb-6 pt-2 sm:px-6">
      <div className="mx-auto max-w-[1180px] space-y-3">
        <header className={`${surface} px-4 py-4 sm:px-5`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#7F6EB4]">Creative Passport</p>
              <h1 className="mt-1 truncate font-serif text-2xl font-semibold tracking-[-0.03em] text-[#292631] sm:text-3xl">{profile?.professional_name?.trim() || "Your reusable artist record"}</h1>
              <p className="mt-1 text-sm text-[#746E80]">Continue with the information that matters now; supporting details stay out of the way.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={primary} onClick={() => setMode("edit")}><PencilLine className="size-4" />Edit Passport</button>
              <Link href="/artist-dashboard/profile/" className={secondary}>View profile<ArrowRight className="size-4" /></Link>
              <button type="button" aria-label="Refresh Passport overview" className={secondary} onClick={() => setRevision((value) => value + 1)}><RefreshCw className="size-4" />Refresh</button>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EEE9F8]" aria-label={`${completion?.percentage ?? 0}% complete`}><div className="h-full rounded-full bg-[#7F6EB4] transition-[width]" style={{ width: `${completion?.percentage ?? 0}%` }} /></div>
            <span className="shrink-0 text-sm font-semibold text-[#5B4B8A]">{completion?.percentage ?? 0}% complete</span>
          </div>
        </header>

        {loading && <div role="status" className={`${surface} flex items-center gap-2 px-4 py-3 text-sm text-[#746E80]`}><Loader2 className="size-4 animate-spin" />Loading live Passport information…</div>}
        {error && <div role="alert" className={`${surface} border-red-200 px-4 py-3 text-sm text-red-800`}>{error}</div>}

        {!loading && completion && (
          <>
            <section className={`${surface} overflow-hidden`} aria-label="Passport summary">
              <div className="grid grid-cols-2 sm:grid-cols-4">
                {summaryItems.map((item, index) => {
                  const Icon = item.icon
                  const content = <><Icon className="size-4 text-[#6A5896]" /><div><p className="text-lg font-semibold text-[#292631]">{item.value}</p><p className="text-xs text-[#746E80]">{item.label}</p></div></>
                  const className = `flex items-center gap-3 px-4 py-3 ${index % 2 ? "border-l border-[#EEEAF6]" : ""} ${index > 1 ? "border-t border-[#EEEAF6] sm:border-t-0 sm:border-l" : ""}`
                  return item.href
                    ? <Link key={item.label} href={item.href} className={`${className} transition hover:bg-[#FCFBFE]`}>{content}</Link>
                    : <button key={item.label} type="button" onClick={() => setMode("edit")} className={`${className} text-left transition hover:bg-[#FCFBFE]`}>{content}</button>
                })}
              </div>
            </section>

            <section className={`${surface} px-4 py-4 sm:px-5`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {missing.length ? <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-700" /> : <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />}
                  <div>
                    <h2 className="text-base font-semibold text-[#292631]">{missing.length ? "Next information to complete" : "Essential Passport information is complete"}</h2>
                    <p className="mt-1 text-xs leading-5 text-[#746E80]">{missing.length ? "Open only the field you need; you do not have to work through one uninterrupted form." : "Optional details can improve matching without blocking your current work."}</p>
                  </div>
                </div>
                {missing.length > 0 && <button type="button" className={secondary} onClick={() => setMode("edit")}>Open fields</button>}
              </div>

              {missing.length > 0 && (
                <div className="mt-3 divide-y divide-[#EEEAF6] border-y border-[#EEEAF6]">
                  {missing.map((item) => (
                    <button key={item.key} type="button" onClick={() => setMode("edit")} className="flex w-full items-center justify-between gap-4 py-3 text-left">
                      <div><p className="text-sm font-semibold text-[#292631]">{item.label}</p><p className="mt-0.5 text-xs text-[#746E80]">{item.explanation}</p></div>
                      <ArrowRight className="size-4 shrink-0 text-[#7F6EB4]" />
                    </button>
                  ))}
                </div>
              )}

              <details className="mt-3 border-t border-[#EEEAF6] pt-3">
                <summary className="cursor-pointer text-xs font-semibold text-[#5B4B8A]">View completion rules by category</summary>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {completion.categories.map((item) => (
                    <div key={item.key} className="flex items-start justify-between gap-3 rounded-lg bg-[#FAF9FD] px-3 py-2.5">
                      <div><p className="text-xs font-semibold text-[#292631]">{item.label}</p><p className="mt-0.5 text-[0.7rem] leading-4 text-[#746E80]">{item.complete ? "Ready" : item.explanation}</p></div>
                      <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${item.complete ? "bg-emerald-50 text-emerald-700" : "bg-[#EEE9F8] text-[#5B4B8A]"}`}>{item.complete ? "Complete" : item.tier}</span>
                    </div>
                  ))}
                </div>
              </details>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
