"use client"

/* eslint-disable @next/next/no-img-element -- private signed Supabase URLs are short-lived */

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { FileUp, ImageIcon, Loader2, Save, Trash2 } from "lucide-react"
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
import { DisciplineMultiSelect, TagEntryField } from "@/components/kleio/forms/artist-term-fields"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { passportAutosaveLabel, usePassportDraftAutosave } from "@/components/kleio/use-passport-draft-autosave"

const card = "border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.05)]"
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

type FullPassportDraft = Record<string, unknown> & {
  passport: ArtistPassportRecord
  presentation: ArtistProfilePresentationRecord
}

function Field({ label, value, onChange, multiline = false, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; rows?: number }) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-[#746E80]">
      <span>{label}</span>
      {multiline ? <textarea className={textarea} rows={rows} value={value} onChange={(event) => onChange(event.target.value)} /> : <input className={input} value={value} onChange={(event) => onChange(event.target.value)} />}
    </label>
  )
}

function initialsFor(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "A"
}

export function LiveArtistPassportEditor() {
  const { locale } = useKleioLocale()
  const [record, setRecord] = useState(blankPassport)
  const [works, setWorks] = useState<PortfolioWorkRecord[]>([])
  const [presentation, setPresentation] = useState(blankPresentation)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")
  const [cvName, setCvName] = useState("")

  useEffect(() => {
    let active = true
    Promise.all([loadArtistPassport(), loadPortfolioWorks(), loadArtistProfilePresentation()])
      .then(([profile, portfolio, profilePresentation]) => {
        if (!active) return
        if (profile) setRecord(profile)
        setWorks(portfolio)
        setPresentation(profilePresentation)
      })
      .catch((reason: Error) => { if (active) setError(reason.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const draftPayload = useMemo<FullPassportDraft>(() => ({ passport: record, presentation }), [presentation, record])
  const autosave = usePassportDraftAutosave<FullPassportDraft>({
    draftKey: "creative_passport_full",
    payload: draftPayload,
    enabled: !loading,
    surface: "creative_passport_full",
    onRestore: (payload) => {
      setRecord(payload.passport)
      setPresentation(payload.presentation)
      setSaved("Recovered draft loaded. Review it before using Save Passport.")
    },
  })
  const autosaveLabel = passportAutosaveLabel(autosave.state)

  function update(key: keyof ArtistPassportRecord, value: string | string[] | null) {
    setRecord((current) => ({ ...current, [key]: value }))
    setSaved("")
  }

  async function save() {
    setSaving(true)
    setError("")
    setSaved("")
    try {
      const next = await saveArtistPassport({
        ...record,
        disciplines_text: record.disciplines.join(", "),
        mediums_text: record.mediums.join(", "),
        languages_text: record.languages.join(", "),
      })
      const nextPresentation = await saveArtistProfilePresentation({
        profile_image_path: presentation.profile_image_path,
        featured_work_id: presentation.featured_work_id,
        profile_image_position_x: presentation.profile_image_position_x,
        profile_image_position_y: presentation.profile_image_position_y,
      })
      setRecord(next)
      setPresentation(nextPresentation)
      autosave.markSaved()
      setSaved("Creative Passport saved. Your reusable information and profile presentation are preserved.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save the Creative Passport.")
    } finally {
      setSaving(false)
    }
  }

  async function uploadCv(file: File | null) {
    if (!file) return
    setSaving(true)
    setError("")
    try {
      if (file.type !== "application/pdf") throw new Error("Choose a PDF for your CV.")
      if (file.size > 15 * 1024 * 1024) throw new Error("CV files must be 15 MB or smaller.")
      const signature = new TextDecoder().decode(new Uint8Array(await file.slice(0, 5).arrayBuffer()))
      if (signature !== "%PDF-") throw new Error("The selected file does not have a valid PDF signature.")
      const path = await uploadArtistAsset(file, "cv")
      update("cv_file_path", path)
      setCvName(file.name)
      setSaved("CV uploaded to private storage. Save the Passport to attach it.")
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
      setPresentation((current) => ({ ...current, profile_image_path: uploaded.path, profile_image_url: uploaded.signedUrl }))
      setSaved("Profile photo uploaded. Adjust its position if needed, then save the Passport.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to upload the profile image.")
    } finally {
      setUploadingPhoto(false)
    }
  }

  const eligibleFeaturedWorks = works.filter((work) => work.image_url)

  return (
    <main className="h-full overflow-y-auto bg-white px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Creative Passport"
          title="Artist information and profile presentation"
          description="Edit reusable artist information, select standardized disciplines, and control the images shown in the shared KLEIO profile layout."
        />

        {autosaveLabel && <p role="status" aria-live="polite" className={`text-right text-xs font-semibold ${autosave.state === "conflict" || autosave.state === "error" ? "text-amber-700" : "text-[#746E80]"}`}>{autosaveLabel}</p>}
        {autosave.recovery && (
          <section className="flex flex-wrap items-center justify-between gap-3 border border-amber-200 bg-amber-50 p-4" role="status">
            <p className="text-sm leading-6 text-amber-950"><strong>Recovery available.</strong> A draft from {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(autosave.recovery.clientUpdatedAt))} differs from the saved Passport.</p>
            <div className="flex gap-2"><button type="button" className={secondary} onClick={autosave.dismissRecovery}>Keep saved Passport</button><button type="button" className={primary} onClick={autosave.restore}>Restore draft</button></div>
          </section>
        )}

        {loading && <div className={`${card} flex items-center gap-2 text-sm text-muted-foreground`}><Loader2 className="size-4 animate-spin" />Loading your Creative Passport…</div>}
        {error && <div role="alert" className={`${card} border-red-200 text-sm text-red-700`}>{error}</div>}

        {!loading && (
          <>
            <section className={`${card} relative overflow-hidden`}>
              <div aria-hidden="true" className="absolute -right-24 -top-24 size-64 rounded-full bg-[#EEE8FA]/70 blur-3xl" />
              <div className="relative grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#6A5896]">Profile presentation</p>
                  <h2 className="mt-2 font-serif text-2xl tracking-[-0.03em]">Your images, one consistent layout</h2>
                  <p className="mt-3 text-sm leading-6 text-[#746E80]">Upload, replace, remove, and position one authoritative profile photo. KLEIO reuses it across your artist identity surfaces.</p>
                  <Link href="/artist-dashboard/profile/" className={`${secondary} mt-4`}>Preview profile</Link>
                </div>

                <div className="grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)]">
                  <div>
                    <div className="grid aspect-[4/5] place-items-center overflow-hidden border border-[#D8D0F2] bg-[#F7F4FF]">
                      {presentation.profile_image_url ? <img src={presentation.profile_image_url} alt="Profile preview" className="size-full object-cover" style={{ objectPosition: `${presentation.profile_image_position_x}% ${presentation.profile_image_position_y}%` }} /> : <div className="text-center text-[#5B4B8A]"><span className="font-serif text-4xl">{initialsFor(record.professional_name)}</span><p className="mt-2 text-[0.65rem] uppercase tracking-[0.14em] text-[#8A8296]">Profile photo</p></div>}
                    </div>
                    <label className={`${secondary} mt-2 w-full cursor-pointer`}>{uploadingPhoto ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}{presentation.profile_image_url ? "Replace photo" : "Upload photo"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploadingPhoto} onChange={(event) => void uploadProfilePhoto(event.target.files?.[0] ?? null)} /></label>
                    {presentation.profile_image_path && <button type="button" className="mt-2 inline-flex w-full items-center justify-center gap-2 py-2 text-xs font-semibold text-[#8A5B65]" onClick={() => setPresentation((current) => ({ ...current, profile_image_path: null, profile_image_url: null, profile_image_position_x: 50, profile_image_position_y: 50 }))}><Trash2 className="size-3.5" />Remove photo</button>}
                  </div>

                  <div className="space-y-4">
                    <label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>Featured artwork</span><select className={input} value={presentation.featured_work_id || ""} onChange={(event) => setPresentation((current) => ({ ...current, featured_work_id: event.target.value || null }))}><option value="">Use the first portfolio work with an image</option>{eligibleFeaturedWorks.map((work) => <option key={work.id} value={work.id}>{work.title}</option>)}</select></label>
                    {presentation.profile_image_url && <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs font-medium text-[#746E80]"><span>Horizontal position</span><input type="range" min="0" max="100" value={presentation.profile_image_position_x} onChange={(event) => setPresentation((current) => ({ ...current, profile_image_position_x: Number(event.target.value) }))} /></label><label className="grid gap-1 text-xs font-medium text-[#746E80]"><span>Vertical position</span><input type="range" min="0" max="100" value={presentation.profile_image_position_y} onChange={(event) => setPresentation((current) => ({ ...current, profile_image_position_y: Number(event.target.value) }))} /></label></div>}
                    <p className="text-xs leading-5 text-[#8A8296]">JPG, PNG, or WebP, up to 5 MB. Artwork files preserve their natural proportions; portrait positioning affects only the profile-photo frame.</p>
                    {eligibleFeaturedWorks.length === 0 && <Link href="/artist-dashboard/portfolio/" className={secondary}>Add portfolio images</Link>}
                  </div>
                </div>
              </div>
            </section>

            <section className={card}>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-sm font-semibold">Passport completeness</p><p className="text-xs text-muted-foreground">{record.profile_completion}% profile complete</p></div>
                <button className={primary} disabled={saving || !record.professional_name.trim()} onClick={() => void save()}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save Passport</button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Professional name" value={record.professional_name} onChange={(value) => update("professional_name", value)} />
                <Field label="Location" value={record.location} onChange={(value) => update("location", value)} />
                <Field label="Website" value={record.website_url} onChange={(value) => update("website_url", value)} />
                <Field label="Instagram" value={record.instagram_url} onChange={(value) => update("instagram_url", value)} />
                <DisciplineMultiSelect values={record.disciplines} onChange={(values) => update("disciplines", values)} locale={locale} />
                <TagEntryField values={record.mediums} onChange={(values) => update("mediums", values)} label="Mediums and materials" placeholder="Type a medium and press Enter" />
                <TagEntryField values={record.languages} onChange={(values) => update("languages", values)} label="Languages" placeholder="Type a language and press Enter" />
              </div>

              <div className="mt-4 grid gap-4">
                <Field multiline rows={5} label="Short biography" value={record.bio} onChange={(value) => update("bio", value)} />
                <Field multiline rows={7} label="Artist statement" value={record.artist_statement} onChange={(value) => update("artist_statement", value)} />
                <Field multiline rows={6} label="Practice description" value={record.practice_description} onChange={(value) => update("practice_description", value)} />
                <Field multiline rows={5} label="Education" value={record.education} onChange={(value) => update("education", value)} />
                <Field multiline rows={6} label="Exhibition history" value={record.exhibition_history} onChange={(value) => update("exhibition_history", value)} />
                <Field multiline rows={5} label="Awards" value={record.awards} onChange={(value) => update("awards", value)} />
              </div>

              <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#D8D0F2] p-4 text-sm text-[#5B4B8A]"><FileUp className="size-4" /><span>{cvName || (record.cv_file_path ? "Replace saved CV" : "Upload CV as PDF")}</span><input type="file" accept="application/pdf" className="sr-only" onChange={(event) => void uploadCv(event.target.files?.[0] ?? null)} /></label>
              {saved && <p role="status" className="mt-4 text-sm font-medium text-emerald-700">{saved}</p>}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
