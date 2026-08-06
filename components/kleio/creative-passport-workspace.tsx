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
  Plus,
  RefreshCw,
  ShieldAlert,
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

const surface = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.05)]"
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A]"
const compact = "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[#D8D0F2] bg-white px-3 py-1.5 text-xs font-semibold text-[#5B4B8A] transition hover:bg-[#FAF8FE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/15"

type Mode = "overview" | "edit"

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
      const [loadedProfile, loadedWorks, applications] = await Promise.all([
        loadArtistPassport(),
        loadPortfolioWorks(),
        loadArtistApplications(),
      ])
      const result = calculatePassportCompletion(loadedProfile, loadedWorks)
      setProfile(loadedProfile)
      setWorks(loadedWorks)
      setApplicationCount(applications.filter((application) => !["declined", "withdrawn"].includes(application.status)).length)
      setCompletion(result)
      const meaningful = Boolean(loadedProfile?.professional_name?.trim() || loadedProfile?.bio?.trim() || loadedWorks.length)
      if (!meaningful) setMode("edit")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load the Creative Passport overview.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [revision])

  if (mode === "edit") {
    return (
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="shrink-0 border-b border-[#EEEAF6] bg-white px-4 py-2 sm:px-6">
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#7F6EB4]">Creative Passport</p>
              <p className="truncate text-xs text-[#746E80]">Editing your reusable artist record</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" className={compact} onClick={() => setGuidanceOpen((value) => !value)} aria-expanded={guidanceOpen}><ChevronDown className={`size-3.5 transition-transform ${guidanceOpen ? "rotate-180" : ""}`} />Why it matters</button>
              <button type="button" className={compact} onClick={() => { setRevision((value) => value + 1); setMode("overview") }}><LayoutDashboard className="size-3.5" />Overview</button>
            </div>
          </div>
          {guidanceOpen && <div className="mx-auto mt-2 max-w-[1180px] rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] px-4 py-3 text-xs leading-5 text-[#5F5968]">The Creative Passport is your artist-approved source record. KLEIO can reuse it for readiness and drafts, but nothing becomes approved without your review.</div>}
        </div>
        <div className="min-h-0 flex-1"><AdaptiveArtistPassportExperience /></div>
      </div>
    )
  }

  return (
    <main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <header className={`${surface} overflow-hidden`}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7F6EB4]">Creative Passport · Overview</p>
              <h1 className="mt-2 font-serif text-4xl font-semibold tracking-[-0.04em]">{profile?.professional_name?.trim() || "Build your reusable artist record"}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#746E80]">See what is ready, what remains essential, and where to continue without returning to one uninterrupted form.</p>
              <div className="mt-5 flex flex-wrap gap-2"><button type="button" className={primary} onClick={() => setMode("edit")}><PencilLine className="size-4" />Edit Passport</button><Link href="/artist-dashboard/profile/" className={secondary}>View profile<ArrowRight className="size-4" /></Link><button type="button" aria-label="Refresh Passport overview" className={secondary} onClick={() => setRevision((value) => value + 1)}><RefreshCw className="size-4" />Refresh</button></div>
            </div>
            <div className="rounded-2xl border border-[#D8D0F2] bg-[#F7F4FF] p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7F6EB4]">Passport completion</p>
              <p className="mt-2 font-serif text-5xl font-semibold text-[#4E426F]">{completion?.percentage ?? 0}%</p>
              <p className="mt-2 text-xs leading-5 text-[#746E80]">Passport completion is separate from readiness for any specific opportunity.</p>
            </div>
          </div>
        </header>

        {loading && <div role="status" className={`${surface} flex items-center gap-2 text-sm text-[#746E80]`}><Loader2 className="size-4 animate-spin" />Loading live Passport information…</div>}
        {error && <div role="alert" className={`${surface} border-red-200 text-sm text-red-800`}>{error}</div>}

        {!loading && completion && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className={surface}><ImageIcon className="size-5 text-[#6A5896]" /><p className="mt-4 font-serif text-3xl font-semibold">{works.length}</p><p className="mt-1 text-sm text-[#746E80]">Portfolio work{works.length === 1 ? "" : "s"}</p><Link href="/artist-dashboard/portfolio/" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#5B4B8A]">Add or edit artwork<ArrowRight className="size-3.5" /></Link></div>
              <div className={surface}><CheckCircle2 className="size-5 text-emerald-600" /><p className="mt-4 font-serif text-3xl font-semibold">{works.filter((work) => work.image_path).length}</p><p className="mt-1 text-sm text-[#746E80]">Works with usable images</p><Link href="/artist-dashboard/media/" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#5B4B8A]">Open Media Library<ArrowRight className="size-3.5" /></Link></div>
              <div className={surface}><FileText className="size-5 text-[#6A5896]" /><p className="mt-4 font-serif text-3xl font-semibold">{profile?.cv_file_path ? 1 : 0}</p><p className="mt-1 text-sm text-[#746E80]">Ready core document{profile?.cv_file_path ? "" : "s"}</p><button type="button" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#5B4B8A]" onClick={() => setMode("edit")}>Add document<ArrowRight className="size-3.5" /></button></div>
              <div className={surface}><LayoutDashboard className="size-5 text-[#6A5896]" /><p className="mt-4 font-serif text-3xl font-semibold">{applicationCount}</p><p className="mt-1 text-sm text-[#746E80]">Active application{applicationCount === 1 ? "" : "s"}</p><Link href="/artist-dashboard/applications/" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#5B4B8A]">Review applications<ArrowRight className="size-3.5" /></Link></div>
            </section>

            {completion.criticalMissing.length > 0 ? (
              <section className={`${surface} border-amber-200`}>
                <div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-700" /><div><h2 className="font-serif text-2xl font-semibold">Critical materials still missing</h2><p className="mt-1 text-sm leading-6 text-[#746E80]">KLEIO will not display 100% while any essential category is incomplete.</p></div></div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">{completion.criticalMissing.map((item) => <Link key={item.key} href={item.actionHref} onClick={(event) => { if (item.actionHref.includes("passport")) { event.preventDefault(); setMode("edit") } }} className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left"><span className="text-sm font-semibold text-amber-900">{item.label}</span><span className="mt-1 block text-xs leading-5 text-amber-800">{item.explanation}</span></Link>)}</div>
              </section>
            ) : (
              <section className={`${surface} border-emerald-200`}><div className="flex items-center gap-3"><CheckCircle2 className="size-5 text-emerald-600" /><div><h2 className="font-serif text-2xl font-semibold">Critical Passport foundation complete</h2><p className="mt-1 text-sm text-[#746E80]">Optional enrichment can improve matching, but it does not replace opportunity-specific readiness.</p></div></div></section>
            )}

            <section className={surface}>
              <h2 className="font-serif text-2xl font-semibold">Completion by category</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">{completion.categories.map((item) => <div key={item.key} className="rounded-xl border border-[#E7E1F7] p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">{item.label}</p><span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${item.complete ? "bg-emerald-50 text-emerald-700" : "bg-[#F7F4FF] text-[#5B4B8A]"}`}>{item.complete ? "Complete" : item.tier}</span></div><p className="mt-2 text-xs leading-5 text-[#746E80]">{item.complete ? "This category currently satisfies its completion rule." : item.explanation}</p></div>)}</div>
            </section>

            <section className={`${surface} text-center`}><Plus className="mx-auto size-5 text-[#6A5896]" /><h2 className="mt-3 font-serif text-2xl font-semibold">Continue where the work is missing</h2><p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#746E80]">Every summary area links to the relevant workspace. You do not need to search through the full Passport to find one incomplete category.</p><button type="button" className={`${primary} mt-4`} onClick={() => setMode("edit")}>Open edit mode</button></section>
          </>
        )}
      </div>
    </main>
  )
}
