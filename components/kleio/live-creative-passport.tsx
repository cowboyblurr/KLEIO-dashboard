"use client"

import { useEffect, useState } from "react"
import { FileUp, Loader2 } from "lucide-react"
import { ArtistProfileImageControl } from "@/components/kleio/artist-profile-image-control"
import { DisciplineMultiSelect, TagEntryField } from "@/components/kleio/forms/artist-term-fields"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import {
  loadEnhancedArtistProfile,
  saveEnhancedArtistProfile,
  type EnhancedArtistProfile,
} from "@/lib/kleio-artist-profile"
import { uploadArtistAsset } from "@/lib/kleio-live-data"

const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]"
const input = "h-10 w-full rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
const textarea = "w-full rounded-xl border border-[#E7E1F7] bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
const primary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"

const blankProfile: EnhancedArtistProfile = {
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
  profile_image_path: "",
  profile_image_url: null,
  profile_image_position_x: 50,
  profile_image_position_y: 50,
}

function Field({ label, value, onChange, multiline = false, rows = 4, placeholder }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; rows?: number; placeholder?: string }) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
      <span>{label}</span>
      {multiline
        ? <textarea className={textarea} rows={rows} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
        : <input className={input} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />}
    </label>
  )
}

export function LiveCreativePassport() {
  const { locale } = useKleioLocale()
  const [profile, setProfile] = useState(blankProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [cvName, setCvName] = useState("")

  useEffect(() => {
    let active = true
    void loadEnhancedArtistProfile()
      .then((record) => { if (active && record) setProfile(record) })
      .catch((reason: Error) => { if (active) setError(reason.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  function update<K extends keyof EnhancedArtistProfile>(key: K, value: EnhancedArtistProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setError("")
    setMessage("")
    try {
      const saved = await saveEnhancedArtistProfile(profile)
      setProfile(saved)
      setMessage("Creative Passport saved. Spaces, paragraphs, disciplines, and profile identity are preserved in your account.")
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
    setMessage("")
    try {
      if (file.type !== "application/pdf") throw new Error("Choose a PDF for your CV.")
      if (file.size > 15 * 1024 * 1024) throw new Error("CV files must be 15 MB or smaller.")
      const path = await uploadArtistAsset(file, "cv")
      update("cv_file_path", path)
      setCvName(file.name)
      setMessage("CV uploaded. Save the Creative Passport to attach the new file to your profile.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to upload the CV.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader eyebrow="Artist workspace" title="Creative Passport" description="Edit the reusable source record that powers your artist profile and application preparation." />

        {loading && <div className={`${card} flex items-center gap-2 text-sm text-muted-foreground`}><Loader2 className="size-4 animate-spin" />Loading your Creative Passport…</div>}
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {!loading && (
          <>
            <section className={card}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-sm font-semibold">Passport completeness</p><p className="text-xs text-muted-foreground">{profile.profile_completion}% profile complete</p></div>
                <button type="button" className={primary} disabled={saving || !profile.professional_name.trim()} onClick={() => void save()}>{saving && <Loader2 className="size-4 animate-spin" />}Save Passport</button>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)]">
                <ArtistProfileImageControl
                  name={profile.professional_name}
                  value={{ path: profile.profile_image_path, url: profile.profile_image_url, positionX: profile.profile_image_position_x, positionY: profile.profile_image_position_y }}
                  onChange={(image) => setProfile((current) => ({ ...current, profile_image_path: image.path, profile_image_url: image.url, profile_image_position_x: image.positionX, profile_image_position_y: image.positionY }))}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Professional name" value={profile.professional_name} onChange={(value) => update("professional_name", value)} />
                  <Field label="Location" value={profile.location} onChange={(value) => update("location", value)} />
                  <Field label="Website" value={profile.website_url} onChange={(value) => update("website_url", value)} />
                  <Field label="Instagram" value={profile.instagram_url} onChange={(value) => update("instagram_url", value)} />
                </div>
              </div>
            </section>

            <section className={card}>
              <h2 className="font-serif text-xl font-semibold">Practice classification</h2>
              <p className="mt-1 text-sm text-muted-foreground">Disciplines are standardized for search and matching. Mediums and languages remain separate, artist-controlled fields.</p>
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <DisciplineMultiSelect values={profile.disciplines} onChange={(values) => update("disciplines", values)} locale={locale} helper={locale === "es" ? "Selecciona varias opciones o añade una práctica personalizada." : "Select multiple options or add a custom practice."} />
                <TagEntryField values={profile.mediums} onChange={(values) => update("mediums", values)} label="Mediums and materials" placeholder="Type a medium and press Enter" helper="Examples: oil on canvas, archival pigment print, clay, code." />
                <TagEntryField values={profile.languages} onChange={(values) => update("languages", values)} label="Languages" placeholder="Type a language and press Enter" />
                <label className="flex cursor-pointer items-center gap-3 self-start rounded-xl border border-dashed border-[#D8D0F2] p-4 text-sm text-[#5B4B8A]"><FileUp className="size-4" /><span>{cvName || (profile.cv_file_path ? "Replace saved CV" : "Upload CV as PDF")}</span><input type="file" accept="application/pdf" className="sr-only" onChange={(event) => void uploadCv(event.target.files?.[0] ?? null)} /></label>
              </div>
            </section>

            <section className={card}>
              <h2 className="font-serif text-xl font-semibold">Artist narrative</h2>
              <p className="mt-1 text-sm text-muted-foreground">Paragraphs and intentional line breaks are preserved when this content is saved and reused.</p>
              <div className="mt-5 grid gap-5">
                <Field multiline rows={6} label="Short biography" value={profile.bio} onChange={(value) => update("bio", value)} />
                <Field multiline rows={8} label="Artist statement" value={profile.artist_statement} onChange={(value) => update("artist_statement", value)} />
                <Field multiline rows={7} label="Practice description" value={profile.practice_description} onChange={(value) => update("practice_description", value)} />
              </div>
            </section>

            <section className={card}>
              <h2 className="font-serif text-xl font-semibold">Experience and recognition</h2>
              <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <Field multiline rows={7} label="Education" value={profile.education} onChange={(value) => update("education", value)} />
                <Field multiline rows={7} label="Exhibition history" value={profile.exhibition_history} onChange={(value) => update("exhibition_history", value)} />
                <Field multiline rows={7} label="Awards" value={profile.awards} onChange={(value) => update("awards", value)} />
              </div>
            </section>

            {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</p>}
          </>
        )}
      </div>
    </main>
  )
}
