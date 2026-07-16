"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, RefreshCw, Save } from "lucide-react"
import { getCurrentArtistProfile, getPersistenceMode, saveArtistProfile, type ArtistProfileRecord } from "@/lib/kleio-live-data"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const blank = {
  professional_name: "",
  location: "",
  bio: "",
  artist_statement: "",
  practice_description: "",
  website_url: "",
  instagram_url: "",
  disciplines: "",
  mediums: "",
  languages: "",
  education: "",
  exhibition_history: "",
  awards: "",
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" /></label>
}

function Area({ label, value, onChange, rows = 5 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" /></label>
}

function listValue(value: string[]) {
  return value.join(", ")
}

function parseList(value: string) {
  return value.split(",").map((entry) => entry.trim()).filter(Boolean)
}

export function ConnectedArtistPassportView() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [form, setForm] = useState(blank)
  const [profile, setProfile] = useState<ArtistProfileRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const mode = getPersistenceMode()

  async function load() {
    setLoading(true)
    setError("")
    try {
      const record = await getCurrentArtistProfile()
      setProfile(record)
      if (record) setForm({
        professional_name: record.professional_name,
        location: record.location,
        bio: record.bio,
        artist_statement: record.artist_statement,
        practice_description: record.practice_description,
        website_url: record.website_url,
        instagram_url: record.instagram_url,
        disciplines: listValue(record.disciplines),
        mediums: listValue(record.mediums),
        languages: listValue(record.languages),
        education: record.education,
        exhibition_history: record.exhibition_history,
        awards: record.awards,
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : (es ? "No se pudo cargar el Pasaporte." : "Unable to load the Passport."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const completion = useMemo(() => {
    const values = Object.values(form)
    return Math.round((values.filter((value) => value.trim()).length / values.length) * 100)
  }, [form])

  function update(key: keyof typeof blank, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save() {
    if (!form.professional_name.trim() || !form.location.trim() || !form.bio.trim() || !form.artist_statement.trim()) {
      setError(es ? "Nombre, ubicación, bio y declaración son obligatorios." : "Name, location, bio, and artist statement are required.")
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const record = await saveArtistProfile({
        professional_name: form.professional_name.trim(),
        location: form.location.trim(),
        bio: form.bio.trim(),
        artist_statement: form.artist_statement.trim(),
        practice_description: form.practice_description.trim(),
        website_url: form.website_url.trim(),
        instagram_url: form.instagram_url.trim(),
        disciplines: parseList(form.disciplines),
        mediums: parseList(form.mediums),
        languages: parseList(form.languages),
        education: form.education.trim(),
        exhibition_history: form.exhibition_history.trim(),
        awards: form.awards.trim(),
        cv_file_path: profile?.cv_file_path ?? null,
        profile_completion: completion,
      })
      setProfile(record)
      setSuccess(es ? "Pasaporte Creativo guardado." : "Creative Passport saved.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : (es ? "No se pudo guardar el Pasaporte." : "Unable to save the Passport."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1080px] space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{es ? "Perfil reutilizable" : "Reusable artist profile"}</p><h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">{es ? "Pasaporte Creativo" : "Creative Passport"}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{es ? "Edita la misma información que las instituciones ven al revisar una postulación." : "Edit the same profile information institutions see when reviewing an application."}</p></div><div className="flex gap-2"><button type="button" onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold hover:bg-accent/50"><RefreshCw className="size-4" />{es ? "Actualizar" : "Refresh"}</button><Link href="/artist-dashboard/portfolio/connected/" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">{es ? "Administrar portafolio" : "Manage portfolio"}</Link></div></header>

        <div className="rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] px-4 py-3 text-xs leading-relaxed text-[#6F6882]"><span className="font-semibold text-[#5B4B8A]">{mode.label}: </span>{mode.detail}</div>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{es ? "Completitud" : "Profile completion"}</p><p className="mt-2 font-serif text-2xl font-semibold">{completion}%</p></div><div className="h-2 w-48 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completion}%` }} /></div></div></section>

        {error && <p className="rounded-xl border border-[oklch(0.85_0.08_45)] bg-[oklch(0.97_0.03_45)] px-4 py-3 text-sm font-medium text-[oklch(0.42_0.12_45)]">{error}</p>}
        {success && <p className="flex items-center gap-2 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-4 py-3 text-sm font-medium text-[oklch(0.4_0.12_150)]"><CheckCircle2 className="size-4" />{success}</p>}

        {loading ? <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">{es ? "Cargando Pasaporte…" : "Loading Passport…"}</div> : <div className="grid gap-5 lg:grid-cols-2">
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-serif text-xl font-semibold">{es ? "Identidad profesional" : "Professional identity"}</h2><Field label={es ? "Nombre profesional" : "Professional name"} value={form.professional_name} onChange={(value) => update("professional_name", value)} /><Field label={es ? "Ubicación" : "Location"} value={form.location} onChange={(value) => update("location", value)} /><Field label={es ? "Disciplinas" : "Disciplines"} value={form.disciplines} onChange={(value) => update("disciplines", value)} /><Field label={es ? "Medios" : "Mediums"} value={form.mediums} onChange={(value) => update("mediums", value)} /><Field label={es ? "Idiomas" : "Languages"} value={form.languages} onChange={(value) => update("languages", value)} /><Field label={es ? "Sitio web" : "Website"} type="url" value={form.website_url} onChange={(value) => update("website_url", value)} /><Field label="Instagram" value={form.instagram_url} onChange={(value) => update("instagram_url", value)} /></section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-serif text-xl font-semibold">{es ? "Práctica" : "Practice"}</h2><Area label={es ? "Bio" : "Biography"} value={form.bio} onChange={(value) => update("bio", value)} /><Area label={es ? "Declaración artística" : "Artist statement"} value={form.artist_statement} onChange={(value) => update("artist_statement", value)} rows={8} /><Area label={es ? "Descripción de práctica" : "Practice description"} value={form.practice_description} onChange={(value) => update("practice_description", value)} /></section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2"><h2 className="font-serif text-xl font-semibold">{es ? "Historia profesional" : "Professional history"}</h2><div className="grid gap-4 lg:grid-cols-3"><Area label={es ? "Educación" : "Education"} value={form.education} onChange={(value) => update("education", value)} rows={6} /><Area label={es ? "Exposiciones" : "Exhibition history"} value={form.exhibition_history} onChange={(value) => update("exhibition_history", value)} rows={6} /><Area label={es ? "Premios y becas" : "Awards and grants"} value={form.awards} onChange={(value) => update("awards", value)} rows={6} /></div></section>
        </div>}

        <button type="button" onClick={() => void save()} disabled={saving || loading} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><Save className="size-4" />{saving ? (es ? "Guardando…" : "Saving…") : (es ? "Guardar Pasaporte" : "Save Passport")}</button>
      </div>
    </main>
  )
}
