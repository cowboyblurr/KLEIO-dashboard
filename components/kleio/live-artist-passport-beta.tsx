"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, FileUp, ImageIcon, Loader2, Save, ShieldCheck, Trash2 } from "lucide-react"
import {
  loadArtistPassport,
  loadPortfolioWorks,
  saveArtistPassport,
  uploadArtistAsset,
  type ArtistPassportRecord,
  type PortfolioWorkRecord,
} from "@/lib/kleio-live-data"
import {
  loadArtistProfilePresentation,
  saveArtistProfilePresentation,
  uploadArtistProfileImage,
  type ArtistProfilePresentationRecord,
} from "@/lib/kleio-profile-presentation"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { TaxonomyMultiSelect } from "@/components/kleio/forms/artist-beta-taxonomy-fields"
import { TagEntryField } from "@/components/kleio/forms/artist-term-fields"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import {
  ARTIST_DISCIPLINE_OPTIONS,
  ARTIST_MEDIUM_MATERIAL_OPTIONS,
} from "@/lib/kleio-artist-taxonomy"

const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.05)]"
const input = "h-10 w-full rounded-lg border border-[#E7E1F7] bg-white px-3 text-sm outline-none focus:border-[#A997E8] focus:ring-2 focus:ring-[#A997E8]/15"
const textarea = "w-full rounded-lg border border-[#E7E1F7] bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-[#A997E8] focus:ring-2 focus:ring-[#A997E8]/15"
const primary = "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#5B4B8A] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] disabled:cursor-not-allowed disabled:opacity-50"

const blankPassport: ArtistPassportRecord = {
  user_id: "",
  professional_name: "",
  location: "",
  bio: "",
  artist_statement: "",
  practice_description: "",
  website_url: "",
  instagram_url: "",
  disciplines: [],
  mediums: [],
  languages: [],
  education: "",
  exhibition_history: "",
  awards: "",
  cv_file_path: null,
  profile_completion: 0,
}

const blankPresentation: ArtistProfilePresentationRecord = {
  profile_image_path: null,
  profile_image_url: null,
  featured_work_id: null,
  profile_image_position_x: 50,
  profile_image_position_y: 50,
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  rows = 4,
  helper,
  maxLength,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  rows?: number
  helper?: string
  maxLength?: number
}) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-[#746E80]">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        {maxLength && <span className="font-normal text-[#9A93A5]">{value.length}/{maxLength}</span>}
      </span>
      {multiline ? (
        <textarea className={textarea} rows={rows} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className={input} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
      )}
      {helper && <span className="font-normal leading-relaxed text-[#9A93A5]">{helper}</span>}
    </label>
  )
}

function initialsFor(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "A"
}

function recordSnapshot(record: ArtistPassportRecord) {
  return JSON.stringify({
    professional_name: record.professional_name,
    location: record.location,
    bio: record.bio,
    artist_statement: record.artist_statement,
    practice_description: record.practice_description,
    website_url: record.website_url,
    instagram_url: record.instagram_url,
    disciplines: record.disciplines,
    mediums: record.mediums,
    languages: record.languages,
    education: record.education,
    exhibition_history: record.exhibition_history,
    awards: record.awards,
    cv_file_path: record.cv_file_path,
  })
}

function CompletionItem({ complete, label }: { complete: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-xs text-[#625C70]">
      {complete ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Circle className="size-4 text-[#C9C2D8]" />}
      {label}
    </li>
  )
}

export function LiveArtistPassportBeta() {
  const { locale } = useKleioLocale()
  const [record, setRecord] = useState(blankPassport)
  const [works, setWorks] = useState<PortfolioWorkRecord[]>([])
  const [presentation, setPresentation] = useState(blankPresentation)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState("")
  const [saveStatus, setSaveStatus] = useState("Loading your saved Passport…")
  const [cvName, setCvName] = useState("")
  const lastSavedSnapshot = useRef("")
  const saveSequence = useRef(0)

  useEffect(() => {
    let active = true
    Promise.all([loadArtistPassport(), loadPortfolioWorks(), loadArtistProfilePresentation()])
      .then(([profile, portfolio, profilePresentation]) => {
        if (!active) return
        const nextRecord = profile ?? blankPassport
        setRecord(nextRecord)
        setWorks(portfolio)
        setPresentation(profilePresentation)
        lastSavedSnapshot.current = recordSnapshot(nextRecord)
        setSaveStatus("Saved to your private KLEIO account.")
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

  function update(key: keyof ArtistPassportRecord, value: string | string[] | null) {
    setRecord((current) => ({ ...current, [key]: value }))
  }

  async function persist(nextRecord: ArtistPassportRecord = record, announce = true) {
    if (!nextRecord.professional_name.trim()) return
    const sequence = ++saveSequence.current
    setSaving(true)
    setError("")
    if (announce) setSaveStatus("Saving…")
    try {
      const savedRecord = await saveArtistPassport({
        ...nextRecord,
        disciplines_text: nextRecord.disciplines.join(", "),
        mediums_text: nextRecord.mediums.join(", "),
        languages_text: nextRecord.languages.join(", "),
      })
      const savedPresentation = await saveArtistProfilePresentation({
        profile_image_path: presentation.profile_image_path,
        featured_work_id: presentation.featured_work_id,
        profile_image_position_x: presentation.profile_image_position_x,
        profile_image_position_y: presentation.profile_image_position_y,
      })
      if (sequence !== saveSequence.current) return
      lastSavedSnapshot.current = recordSnapshot(savedRecord)
      setRecord(savedRecord)
      setPresentation(savedPresentation)
      setSaveStatus(`Saved ${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date())}.`)
    } catch (reason) {
      if (sequence === saveSequence.current) {
        setError(reason instanceof Error ? reason.message : "Unable to save the Creative Passport.")
        setSaveStatus("Autosave paused. Use Save Passport after resolving the error.")
      }
    } finally {
      if (sequence === saveSequence.current) setSaving(false)
    }
  }

  useEffect(() => {
    if (loading || !record.user_id) return
    const snapshot = recordSnapshot(record)
    if (snapshot === lastSavedSnapshot.current) return
    setSaveStatus("Unsaved changes — autosaving…")
    const timer = window.setTimeout(() => {
      void persist(record, false)
    }, 1400)
    return () => window.clearTimeout(timer)
  // Presentation is saved when a profile-image action or manual save occurs; text autosave tracks the Passport record.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record, loading])

  async function uploadCv(file: File | null) {
    if (!file) return
    setSaving(true)
    setError("")
    try {
      if (file.type !== "application/pdf") throw new Error("Choose a PDF for your CV.")
      if (file.size > 15 * 1024 * 1024) throw new Error("CV files must be 15 MB or smaller.")
      const path = await uploadArtistAsset(file, "cv")
      setCvName(file.name)
      const next = { ...record, cv_file_path: path }
      setRecord(next)
      await persist(next)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to upload the CV.")
    } finally {
      setSaving(false)
    }
  }

  async function uploadProfilePhoto(file: File | null) {
    if (!file) return
    setUploadingPhoto(true)
    setError("")
    try {
      const uploaded = await uploadArtistProfileImage(file)
      const nextPresentation = {
        ...presentation,
        profile_image_path: uploaded.path,
        profile_image_url: uploaded.signedUrl,
      }
      setPresentation(nextPresentation)
      await saveArtistProfilePresentation({
        profile_image_path: nextPresentation.profile_image_path,
        featured_work_id: nextPresentation.featured_work_id,
        profile_image_position_x: nextPresentation.profile_image_position_x,
        profile_image_position_y: nextPresentation.profile_image_position_y,
      })
      setSaveStatus("Profile photo saved to your private account.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to upload the profile image.")
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function removeProfilePhoto() {
    const next = {
      ...presentation,
      profile_image_path: null,
      profile_image_url: null,
      profile_image_position_x: 50,
      profile_image_position_y: 50,
    }
    setPresentation(next)
    try {
      await saveArtistProfilePresentation({
        profile_image_path: null,
        featured_work_id: next.featured_work_id,
        profile_image_position_x: 50,
        profile_image_position_y: 50,
      })
      setSaveStatus("Profile photo removed.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to remove the profile image.")
    }
  }

  const eligibleFeaturedWorks = works.filter((work) => work.image_url)
  const coreItems = useMemo(() => [
    { label: "Professional name and location", complete: Boolean(record.professional_name.trim() && record.location.trim()) },
    { label: "Primary creative practice", complete: record.disciplines.length > 0 },
    { label: "Biography", complete: Boolean(record.bio.trim()) },
    { label: "Artist statement", complete: Boolean(record.artist_statement.trim()) },
    { label: "CV", complete: Boolean(record.cv_file_path) },
    { label: "Portfolio work", complete: works.length > 0 },
  ], [record, works.length])
  const coreReady = coreItems.filter((item) => item.complete).length

  return (
    <main className="h-full overflow-y-auto bg-white px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Creative Passport"
          title="Reusable artist information, under your control"
          description="KLEIO autosaves your editable source record. Nothing becomes public or is submitted to an institution without a separate artist action."
        />

        <div className="flex flex-col gap-3 rounded-2xl border border-[#E7E1F7] bg-[#FDFBFF] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs leading-relaxed text-[#625C70]">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#6A5896]" />
            <p><strong className="text-[#292631]">Private source record:</strong> drafts, CVs, and application materials remain private until you publish a profile or approve a submission.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {saving && <Loader2 className="size-4 animate-spin text-[#6A5896]" />}
            <span role="status" className="text-xs font-medium text-[#6A5896]">{saveStatus}</span>
          </div>
        </div>

        {loading && <div className={`${card} flex items-center gap-2 text-sm text-muted-foreground`}><Loader2 className="size-4 animate-spin" />Loading your Creative Passport…</div>}
        {error && <div role="alert" className={`${card} border-red-200 text-sm text-red-700`}>{error}</div>}

        {!loading && (
          <>
            <section className={card}>
              <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#6A5896]">Profile presentation</p>
                  <h2 className="mt-2 font-serif text-2xl tracking-[-0.03em]">One approved identity image</h2>
                  <p className="mt-3 text-sm leading-6 text-[#746E80]">Upload or replace the photo used across your KLEIO artist profile. It is not public until you choose to publish the profile.</p>
                  <Link href="/artist-dashboard/profile/" className={`${secondary} mt-4`}>Preview profile</Link>
                </div>
                <div className="grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)]">
                  <div>
                    <div className="grid aspect-[4/5] place-items-center overflow-hidden rounded-xl border border-[#D8D0F2] bg-[#F7F4FF]">
                      {presentation.profile_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={presentation.profile_image_url} alt="Profile preview" className="size-full object-cover" style={{ objectPosition: `${presentation.profile_image_position_x}% ${presentation.profile_image_position_y}%` }} />
                      ) : (
                        <div className="text-center text-[#5B4B8A]"><span className="font-serif text-4xl">{initialsFor(record.professional_name)}</span><p className="mt-2 text-[0.65rem] uppercase tracking-[0.14em] text-[#8A8296]">Profile photo</p></div>
                      )}
                    </div>
                    <label className={`${secondary} mt-2 w-full cursor-pointer`}>
                      {uploadingPhoto ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
                      {presentation.profile_image_url ? "Replace photo" : "Upload photo"}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploadingPhoto} onChange={(event) => void uploadProfilePhoto(event.target.files?.[0] ?? null)} />
                    </label>
                    {presentation.profile_image_path && (
                      <button type="button" className="mt-2 inline-flex w-full items-center justify-center gap-2 py-2 text-xs font-semibold text-[#8A5B65]" onClick={() => void removeProfilePhoto()}><Trash2 className="size-3.5" />Remove photo</button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <label className="grid gap-1.5 text-xs font-semibold text-[#746E80]">
                      <span>Featured artwork</span>
                      <select className={input} value={presentation.featured_work_id || ""} onChange={(event) => setPresentation((current) => ({ ...current, featured_work_id: event.target.value || null }))}>
                        <option value="">Use the first portfolio work with an image</option>
                        {eligibleFeaturedWorks.map((work) => <option key={work.id} value={work.id}>{work.title}</option>)}
                      </select>
                    </label>
                    {presentation.profile_image_url && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-1 text-xs font-medium text-[#746E80]"><span>Horizontal position</span><input type="range" min="0" max="100" value={presentation.profile_image_position_x} onChange={(event) => setPresentation((current) => ({ ...current, profile_image_position_x: Number(event.target.value) }))} /></label>
                        <label className="grid gap-1 text-xs font-medium text-[#746E80]"><span>Vertical position</span><input type="range" min="0" max="100" value={presentation.profile_image_position_y} onChange={(event) => setPresentation((current) => ({ ...current, profile_image_position_y: Number(event.target.value) }))} /></label>
                      </div>
                    )}
                    <p className="text-xs leading-5 text-[#8A8296]">JPG, PNG, or WebP, up to 5 MB. Positioning affects only the profile-photo frame.</p>
                    {eligibleFeaturedWorks.length === 0 && <Link href="/artist-dashboard/portfolio/" className={secondary}>Add portfolio images</Link>}
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-5">
                <section className={card}>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#6A5896]">Identity</p><h2 className="mt-1 font-serif text-xl font-semibold">Essential profile details</h2></div>
                    <button className={primary} disabled={saving || !record.professional_name.trim()} onClick={() => void persist(record)}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save Passport</button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Professional name" value={record.professional_name} onChange={(value) => update("professional_name", value)} />
                    <Field label="Location" value={record.location} onChange={(value) => update("location", value)} helper="Use a city, region, or country artists and institutions will understand." />
                    <Field label="Website" value={record.website_url} onChange={(value) => update("website_url", value)} />
                    <Field label="Instagram" value={record.instagram_url} onChange={(value) => update("instagram_url", value)} />
                    <TagEntryField values={record.languages} onChange={(values) => update("languages", values)} label="Languages" placeholder="Type a language and press Enter" />
                  </div>
                </section>

                <section className={card}>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#6A5896]">Practice</p>
                  <h2 className="mt-1 font-serif text-xl font-semibold">Disciplines, mediums, and materials</h2>
                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <TaxonomyMultiSelect label="Disciplines" values={record.disciplines} onChange={(values) => update("disciplines", values)} options={ARTIST_DISCIPLINE_OPTIONS} locale={locale} placeholder="Search photography, ceramics…" helper="Disciplines describe the kind of creative practice." kind="discipline" />
                    <TaxonomyMultiSelect label="Mediums and materials" values={record.mediums} onChange={(values) => update("mediums", values)} options={ARTIST_MEDIUM_MATERIAL_OPTIONS} locale={locale} placeholder="Search clay, film, textile…" helper="Mediums and materials describe what the work uses or is made from." kind="medium" />
                  </div>
                </section>

                <section className={card}>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#6A5896]">Core texts</p>
                  <h2 className="mt-1 font-serif text-xl font-semibold">Reusable writing</h2>
                  <div className="mt-5 grid gap-4">
                    <Field multiline rows={5} maxLength={1200} label="Short biography" value={record.bio} onChange={(value) => update("bio", value)} helper="A concise factual biography. KLEIO will never invent credentials or exhibitions." />
                    <Field multiline rows={7} maxLength={5000} label="Artist statement" value={record.artist_statement} onChange={(value) => update("artist_statement", value)} />
                    <Field multiline rows={6} maxLength={5000} label="Practice description" value={record.practice_description} onChange={(value) => update("practice_description", value)} />
                  </div>
                </section>

                <section className={card}>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#6A5896]">History and documents</p>
                  <h2 className="mt-1 font-serif text-xl font-semibold">Supporting record</h2>
                  <div className="mt-5 grid gap-4">
                    <Field multiline rows={5} label="Education" value={record.education} onChange={(value) => update("education", value)} />
                    <Field multiline rows={6} label="Exhibition history" value={record.exhibition_history} onChange={(value) => update("exhibition_history", value)} />
                    <Field multiline rows={5} label="Awards and grants" value={record.awards} onChange={(value) => update("awards", value)} />
                  </div>
                  <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#D8D0F2] p-4 text-sm text-[#5B4B8A]">
                    <FileUp className="size-4" />
                    <span>{cvName || (record.cv_file_path ? "Replace saved CV" : "Upload CV as PDF")}</span>
                    <input type="file" accept="application/pdf" className="sr-only" onChange={(event) => void uploadCv(event.target.files?.[0] ?? null)} />
                  </label>
                </section>
              </div>

              <aside className={`${card} h-fit lg:sticky lg:top-5`}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#6A5896]">Application readiness</p>
                <h2 className="mt-2 font-serif text-xl font-semibold">{coreReady} of {coreItems.length} core items ready</h2>
                <p className="mt-2 text-xs leading-5 text-[#746E80]">This checklist reflects actual saved materials. Opportunity-specific readiness is calculated separately from the source requirements.</p>
                <ul className="mt-4 space-y-3">
                  {coreItems.map((item) => <CompletionItem key={item.label} complete={item.complete} label={item.label} />)}
                </ul>
                <div className="mt-5 grid gap-2 border-t border-[#E7E1F7] pt-4">
                  <Link href="/artist-dashboard/portfolio/" className={secondary}>Manage portfolio</Link>
                  <Link href="/artist-dashboard/opportunities/" className={secondary}>Search opportunities</Link>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
