"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileText,
  Globe2,
  ImageIcon,
  LayoutDashboard,
  Loader2,
  MapPin,
  PencilLine,
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
import { loadPassportReviewCount } from "@/lib/kleio-upload-to-passport"

const surface = "rounded-xl border border-[#E7E1F7] bg-white shadow-[0_12px_32px_rgba(82,64,130,0.04)]"
const primary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#D8D0F2] bg-white px-3 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/15"
const compact = "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[#D8D0F2] bg-white px-3 py-1.5 text-xs font-semibold text-[#5B4B8A] transition hover:bg-[#FAF8FE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/15"

type Mode = "overview" | "edit" | "institution"
type PassportWithTimestamp = ArtistPassportRecord & { updated_at?: string }

type PassportHeaderProps = {
  profile: ArtistPassportRecord | null
  completion: PassportCompletionResult
  pendingReviewCount: number
  preview?: boolean
  onEdit: () => void
  onPreview?: () => void
  onReview?: () => void
  onBack?: () => void
}

function splitRecord(value: string | undefined) {
  return (value || "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatUpdatedAt(profile: ArtistPassportRecord | null) {
  const value = (profile as PassportWithTimestamp | null)?.updated_at
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date)
}

function PassportHeader({ profile, completion, pendingReviewCount, preview = false, onEdit, onPreview, onReview, onBack }: PassportHeaderProps) {
  const name = profile?.professional_name?.trim() || "Your Creative Passport"
  const descriptor = profile?.disciplines?.[0] || "Professional artist record"
  const updatedAt = formatUpdatedAt(profile)
  const completionPercentage = completion?.percentage ?? 0

  return (
    <header className={`${surface} px-4 py-4 sm:px-5`}>
      {preview && (
        <div className="mb-4 flex flex-col gap-2 border-b border-[#EEEAF6] pb-3 text-xs text-[#675F70] sm:flex-row sm:items-center sm:justify-between">
          <p><span className="font-semibold text-[#5B4B8A]">Institution preview</span> · Private preview only. This is not public, verified or evidence-facing.</p>
          <button type="button" className={compact} onClick={onBack}><ArrowLeft className="size-3.5" />Back to Passport</button>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#7F6EB4]">Creative Passport</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-[-0.03em] text-[#292631] sm:text-3xl">{name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[#746E80]">
            <span>{descriptor}</span>
            {profile?.location?.trim() && <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{profile.location}</span>}
            {updatedAt && <span>Updated {updatedAt}</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-[#5B4B8A]">
            {profile?.website_url?.trim() && <a href={profile.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:underline"><Globe2 className="size-3.5" />Website</a>}
            {profile?.instagram_url?.trim() && <a href={profile.instagram_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:underline"><span aria-hidden="true">@</span>Instagram</a>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={primary} onClick={onEdit}><PencilLine className="size-4" />Edit Passport</button>
          {!preview && onPreview && <button type="button" className={secondary} onClick={onPreview}><Eye className="size-4" />Preview for institution</button>}
          {!preview && pendingReviewCount > 0 && onReview && <button type="button" className={secondary} onClick={onReview}>Review suggestions <span className="rounded-full bg-[#EEE9F8] px-1.5 py-0.5 text-[0.68rem]">{pendingReviewCount}</span></button>}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-[#EEEAF6] pt-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EEE9F8]" aria-label={`${completionPercentage}% complete`}>
          <div className="h-full rounded-full bg-[#7F6EB4] transition-[width]" style={{ width: `${completionPercentage}%` }} />
        </div>
        <span className="shrink-0 text-xs font-semibold text-[#5B4B8A]">{completionPercentage}% complete</span>
      </div>
    </header>
  )
}

function PassportNarrative({ profile }: { profile: ArtistPassportRecord | null }) {
  const sections: Array<{ title: string; body: string }> = []
  if (profile?.bio?.trim()) sections.push({ title: "Biography", body: profile.bio.trim() })
  if (profile?.practice_description?.trim()) sections.push({ title: "Practice", body: profile.practice_description.trim() })
  if (profile?.artist_statement?.trim()) sections.push({ title: "Artist statement", body: profile.artist_statement.trim() })
  if (!sections.length) return null

  return (
    <section aria-labelledby="passport-summary-title" className={`${surface} px-4 py-5 sm:px-6`}>
      <h2 id="passport-summary-title" className="font-serif text-xl font-semibold text-[#292631]">Professional summary</h2>
      <div className="mt-4 divide-y divide-[#EEEAF6]">
        {sections.map((section) => (
          <article key={section.title} className="grid gap-2 py-4 first:pt-0 last:pb-0 md:grid-cols-[150px_minmax(0,1fr)] md:gap-6">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7F6EB4]">{section.title}</h3>
            <p className="whitespace-pre-line text-[0.95rem] leading-7 text-[#4E4954]">{section.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function PassportPractice({ profile }: { profile: ArtistPassportRecord | null }) {
  const groups = [
    { label: "Disciplines", values: profile?.disciplines || [] },
    { label: "Mediums and materials", values: profile?.mediums || [] },
    { label: "Languages", values: profile?.languages || [] },
  ].filter((group) => group.values.length)
  if (!groups.length) return null

  return (
    <section aria-labelledby="passport-practice-title" className={`${surface} px-4 py-5 sm:px-6`}>
      <h2 id="passport-practice-title" className="font-serif text-xl font-semibold text-[#292631]">Practice overview</h2>
      <dl className="mt-4 grid gap-4 md:grid-cols-3">
        {groups.map((group) => (
          <div key={group.label}>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7F6EB4]">{group.label}</dt>
            <dd className="mt-2 flex flex-wrap gap-x-2 gap-y-1.5 text-sm leading-6 text-[#4E4954]">
              {group.values.map((value, index) => <span key={`${group.label}-${value}`}>{value}{index < group.values.length - 1 ? <span className="ml-2 text-[#C2B9D7]">/</span> : null}</span>)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function PassportCareerTimeline({ profile }: { profile: ArtistPassportRecord | null }) {
  const groups = [
    { label: "Education", entries: splitRecord(profile?.education) },
    { label: "Exhibitions", entries: splitRecord(profile?.exhibition_history) },
    { label: "Awards and recognition", entries: splitRecord(profile?.awards) },
  ].filter((group) => group.entries.length)
  if (!groups.length) return null

  return (
    <section aria-labelledby="passport-career-title" className={`${surface} px-4 py-5 sm:px-6`}>
      <h2 id="passport-career-title" className="font-serif text-xl font-semibold text-[#292631]">Career record</h2>
      <div className="mt-4 divide-y divide-[#EEEAF6]">
        {groups.map((group) => (
          <div key={group.label} className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[180px_minmax(0,1fr)] md:gap-6">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7F6EB4]">{group.label}</h3>
            <ul className="space-y-2 text-sm leading-6 text-[#4E4954]">
              {group.entries.map((entry, index) => <li key={`${group.label}-${index}`} className="border-l border-[#DCD4EE] pl-3">{entry}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

function PassportSelectedWorks({ works }: { works: PortfolioWorkRecord[] }) {
  if (!works.length) return null
  return (
    <section aria-labelledby="passport-works-title" className={`${surface} px-4 py-5 sm:px-6`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="passport-works-title" className="font-serif text-xl font-semibold text-[#292631]">Selected work</h2>
          <p className="mt-1 text-xs text-[#746E80]">A restrained view of approved portfolio records.</p>
        </div>
        <Link href="/artist-dashboard/portfolio/" className="text-xs font-semibold text-[#5B4B8A] hover:underline">Manage portfolio</Link>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {works.slice(0, 6).map((work) => (
          <article key={work.id} className="min-w-0">
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-[#F3F0F8]">
              {work.image_url
                ? <img src={work.image_url} alt={`${work.title || "Untitled artwork"}${work.year ? `, ${work.year}` : ""}`} className="h-full w-full object-cover" />
                : <div className="grid h-full place-items-center text-[#9B8DBB]"><ImageIcon className="size-6" aria-hidden="true" /><span className="sr-only">No image available</span></div>}
            </div>
            <h3 className="mt-2 truncate text-sm font-semibold text-[#292631]">{work.title || "Untitled"}</h3>
            <p className="mt-0.5 text-xs leading-5 text-[#746E80]">{[work.year, work.medium, work.dimensions].filter(Boolean).join(" · ")}</p>
            {work.description?.trim() && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#5F5968]">{work.description}</p>}
          </article>
        ))}
      </div>
    </section>
  )
}

function PassportDocumentStatus({ profile, works, applicationCount, preview = false }: { profile: ArtistPassportRecord | null; works: PortfolioWorkRecord[]; applicationCount: number; preview?: boolean }) {
  const imageCount = works.filter((work) => work.image_path || work.image_url).length
  const statuses = [
    { label: "CV", value: profile?.cv_file_path ? "Available" : "Not added", ready: Boolean(profile?.cv_file_path) },
    { label: "Portfolio records", value: `${works.length} work${works.length === 1 ? "" : "s"}`, ready: works.length > 0 },
    { label: "Usable images", value: `${imageCount} image${imageCount === 1 ? "" : "s"}`, ready: imageCount > 0 },
    ...(!preview ? [{ label: "Active applications", value: String(applicationCount), ready: applicationCount > 0 }] : []),
  ]

  return (
    <section aria-labelledby="passport-documents-title" className={`${surface} px-4 py-5 sm:px-6`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="passport-documents-title" className="font-serif text-xl font-semibold text-[#292631]">Documents and readiness</h2>
          <p className="mt-1 text-xs text-[#746E80]">Availability only. Private file paths and analysis metadata stay hidden.</p>
        </div>
        {!preview && <div className="flex flex-wrap gap-3 text-xs font-semibold text-[#5B4B8A]"><Link href="/artist-dashboard/import/" className="hover:underline">Add document</Link><Link href="/artist-dashboard/media/" className="hover:underline">Media library</Link><Link href="/artist-dashboard/applications/" className="hover:underline">Applications</Link></div>}
      </div>
      <dl className="mt-4 grid gap-x-5 gap-y-3 border-t border-[#EEEAF6] pt-4 sm:grid-cols-2 lg:grid-cols-4">
        {statuses.map((status) => (
          <div key={status.label} className="flex items-start gap-2.5">
            {status.ready ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <FileText className="mt-0.5 size-4 shrink-0 text-[#9B8DBB]" />}
            <div><dt className="text-xs font-semibold text-[#292631]">{status.label}</dt><dd className="mt-0.5 text-xs text-[#746E80]">{status.value}</dd></div>
          </div>
        ))}
      </dl>
    </section>
  )
}

function ContinuePassport({ completion, onEdit }: { completion: PassportCompletionResult; onEdit: () => void }) {
  const missing = completion.criticalMissing.slice(0, 3)
  if (!missing.length) return null
  return (
    <section aria-labelledby="continue-passport-title" className="border-t border-[#E7E1F7] px-1 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#7F6EB4]">Next information to complete</p>
            <h2 id="continue-passport-title" className="mt-1 text-sm font-semibold text-[#292631]">Continue building your Passport</h2>
            <p className="mt-1 text-xs leading-5 text-[#746E80]">The next useful additions are shown here without replacing the record you already completed.</p>
          </div>
        </div>
        <button type="button" className={secondary} onClick={onEdit}>Open missing fields</button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {missing.map((item) => (
          <button key={item.key} type="button" onClick={onEdit} className="flex min-h-20 items-start justify-between gap-3 rounded-lg border border-[#E7E1F7] bg-white px-3 py-3 text-left transition hover:bg-[#FCFBFE]">
            <span><span className="block text-xs font-semibold text-[#292631]">{item.label}</span><span className="mt-1 block text-[0.7rem] leading-4 text-[#746E80]">{item.explanation}</span></span>
            <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-[#7F6EB4]" />
          </button>
        ))}
      </div>
      <details className="mt-3 border-t border-[#EEEAF6] pt-3">
        <summary className="cursor-pointer text-xs font-semibold text-[#5B4B8A]">View completion rules by category</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {completion.categories.map((item) => (
            <div key={item.key} className="flex items-start justify-between gap-3 rounded-lg bg-white px-3 py-2.5">
              <div>
                <p className="text-xs font-semibold text-[#292631]">{item.label}</p>
                <p className="mt-0.5 text-[0.7rem] leading-4 text-[#746E80]">{item.complete ? "Ready" : item.explanation}</p>
              </div>
              <span className={`text-[0.65rem] font-semibold ${item.complete ? "text-emerald-700" : "text-[#5B4B8A]"}`}>{item.complete ? "Complete" : item.tier}</span>
            </div>
          ))}
        </div>
      </details>
    </section>
  )
}

function EmptyPassportPreview({ onEdit }: { onEdit: () => void }) {
  return (
    <section className={`${surface} px-4 py-5 sm:px-6`} aria-labelledby="empty-passport-title">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#7F6EB4]">First step</p>
          <h2 id="empty-passport-title" className="mt-2 font-serif text-2xl font-semibold tracking-[-0.03em] text-[#292631]">Build the record once, then reuse it with approval.</h2>
          <p className="mt-2 text-sm leading-6 text-[#746E80]">Start with your professional name, biography and one work. KLEIO will assemble each approved addition into the Passport rather than leaving you inside a long blank form.</p>
          <button type="button" className={`${primary} mt-4`} onClick={onEdit}><PencilLine className="size-4" />Start with core information</button>
        </div>
        <div aria-label="Preview of a completed Creative Passport" className="rounded-xl border border-[#DDD5ED] bg-[#FCFBFE] p-4">
          <div className="border-b border-[#E7E1F7] pb-3"><div className="h-3 w-28 rounded bg-[#DCD4EE]" /><div className="mt-2 h-6 w-2/3 rounded bg-[#EEE9F8]" /><div className="mt-2 h-3 w-1/2 rounded bg-[#F1EEF7]" /></div>
          {["Professional summary", "Practice overview", "Selected work", "Career record"].map((label) => <div key={label} className="border-b border-[#EEEAF6] py-3 last:border-b-0"><p className="text-xs font-semibold text-[#7F6EB4]">{label}</p><div className="mt-2 h-2 w-full rounded bg-[#EEE9F8]" /><div className="mt-1.5 h-2 w-4/5 rounded bg-[#F1EEF7]" /></div>)}
        </div>
      </div>
    </section>
  )
}

function PassportRecord({ profile, works, completion, applicationCount, onEdit }: { profile: ArtistPassportRecord | null; works: PortfolioWorkRecord[]; completion: PassportCompletionResult; applicationCount: number; onEdit: () => void }) {
  const meaningful = Boolean(
    profile?.professional_name?.trim() ||
    profile?.bio?.trim() ||
    profile?.artist_statement?.trim() ||
    profile?.practice_description?.trim() ||
    profile?.disciplines?.length ||
    profile?.mediums?.length ||
    profile?.education?.trim() ||
    profile?.exhibition_history?.trim() ||
    profile?.awards?.trim() ||
    works.length,
  )

  if (!meaningful) return <EmptyPassportPreview onEdit={onEdit} />

  return (
    <>
      <PassportNarrative profile={profile} />
      <PassportPractice profile={profile} />
      <PassportCareerTimeline profile={profile} />
      <PassportSelectedWorks works={works} />
      <PassportDocumentStatus profile={profile} works={works} applicationCount={applicationCount} />
      <ContinuePassport completion={completion} onEdit={onEdit} />
    </>
  )
}

function InstitutionPassportPreview({ profile, works, completion, pendingReviewCount, onBack, onEdit }: { profile: ArtistPassportRecord | null; works: PortfolioWorkRecord[]; completion: PassportCompletionResult; pendingReviewCount: number; onBack: () => void; onEdit: () => void }) {
  return (
    <main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 pb-8 pt-2 sm:px-6">
      <div className="mx-auto max-w-[1080px] space-y-3">
        <PassportHeader profile={profile} completion={completion} pendingReviewCount={pendingReviewCount} preview onEdit={onEdit} onBack={onBack} />
        <PassportNarrative profile={profile} />
        <PassportPractice profile={profile} />
        <PassportSelectedWorks works={works} />
        <PassportCareerTimeline profile={profile} />
        <PassportDocumentStatus profile={profile} works={works} applicationCount={0} preview />
        <p className="px-1 pt-2 text-center text-[0.7rem] leading-5 text-[#817A89]">This preview uses only the artist-approved Passport record. It does not indicate institutional review, verification or public visibility.</p>
      </div>
    </main>
  )
}

export function CreativePassportWorkspace() {
  const [mode, setMode] = useState<Mode>("overview")
  const [profile, setProfile] = useState<ArtistPassportRecord | null>(null)
  const [works, setWorks] = useState<PortfolioWorkRecord[]>([])
  const [applicationCount, setApplicationCount] = useState(0)
  const [pendingReviewCount, setPendingReviewCount] = useState(0)
  const [completion, setCompletion] = useState<PassportCompletionResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [guidanceOpen, setGuidanceOpen] = useState(false)
  const [revision, setRevision] = useState(0)

  async function refresh() {
    setLoading(true)
    setError("")
    try {
      const [loadedProfile, loadedWorks, applications, loadedPendingReviewCount] = await Promise.all([
        loadArtistPassport(),
        loadPortfolioWorks(),
        loadArtistApplications(),
        loadPassportReviewCount().catch(() => 0),
      ])
      setProfile(loadedProfile)
      setWorks(loadedWorks)
      setApplicationCount(applications.filter((application) => !["declined", "withdrawn"].includes(application.status)).length)
      setPendingReviewCount(loadedPendingReviewCount)
      setCompletion(calculatePassportCompletion(loadedProfile, loadedWorks))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load the Creative Passport.")
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

  if (loading || !completion) {
    return <main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-4 sm:px-6"><div role="status" className={`${surface} mx-auto flex max-w-[1180px] items-center gap-2 px-4 py-4 text-sm text-[#746E80]`}><Loader2 className="size-4 animate-spin" />Loading your approved Passport record…</div></main>
  }

  if (mode === "institution") {
    return <InstitutionPassportPreview profile={profile} works={works} completion={completion} pendingReviewCount={pendingReviewCount} onBack={() => setMode("overview")} onEdit={() => setMode("edit")} />
  }

  return (
    <main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 pb-8 pt-2 sm:px-6">
      <div className="mx-auto max-w-[1180px] space-y-3">
        <PassportHeader
          profile={profile}
          completion={completion}
          pendingReviewCount={pendingReviewCount}
          onEdit={() => setMode("edit")}
          onPreview={() => setMode("institution")}
          onReview={() => setMode("edit")}
        />
        {error && <div role="alert" className={`${surface} border-red-200 px-4 py-3 text-sm text-red-800`}>{error}<button type="button" onClick={() => setRevision((value) => value + 1)} className="ml-3 inline-flex items-center gap-1 font-semibold underline"><RefreshCw className="size-3.5" />Retry</button></div>}
        <PassportRecord profile={profile} works={works} completion={completion} applicationCount={applicationCount} onEdit={() => setMode("edit")} />
        <nav aria-label="Related artist records" className="flex flex-wrap items-center justify-between gap-3 px-1 pt-2 text-xs text-[#746E80]">
          <p>Creative Passport is the reusable private source record. Artist Profile remains the curated public-facing presentation.</p>
          <div className="flex gap-4 font-semibold text-[#5B4B8A]"><Link href="/artist-dashboard/profile/" className="hover:underline">Artist Profile</Link><Link href="/artist-dashboard/portfolio/" className="hover:underline">Portfolio</Link></div>
        </nav>
      </div>
    </main>
  )
}
