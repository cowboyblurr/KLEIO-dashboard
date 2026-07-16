"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2, CheckCircle2, RefreshCw, Save } from "lucide-react"
import { getDemoSession } from "@/lib/kleio-demo-auth"
import { getCurrentInstitution, getPersistenceMode, saveInstitution, type InstitutionRecord } from "@/lib/kleio-live-data"
import { uploadSupabaseFile } from "@/lib/kleio-supabase"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const blank = {
  name: "",
  organization_type: "",
  description: "",
  location: "",
  website_url: "",
  contact_name: "",
  contact_email: "",
  logo_path: "",
}

export function ConnectedInstitutionProfileView() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [form, setForm] = useState(blank)
  const [record, setRecord] = useState<InstitutionRecord | null>(null)
  const [logo, setLogo] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const mode = getPersistenceMode()

  async function load() {
    setLoading(true)
    setError("")
    try {
      const institution = await getCurrentInstitution()
      setRecord(institution)
      if (institution) setForm({
        name: institution.name,
        organization_type: institution.organization_type,
        description: institution.description,
        location: institution.location,
        website_url: institution.website_url,
        contact_name: institution.contact_name,
        contact_email: institution.contact_email,
        logo_path: institution.logo_path ?? "",
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : (es ? "No se pudo cargar la institución." : "Unable to load the institution."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  function update(key: keyof typeof blank, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save() {
    if (!form.name.trim() || !form.organization_type.trim() || !form.location.trim() || !form.contact_name.trim() || !form.contact_email.trim()) {
      setError(es ? "Completa nombre, tipo, ubicación y contacto." : "Complete the name, type, location, and contact fields.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email.trim())) {
      setError(es ? "Ingresa un correo de contacto válido." : "Enter a valid contact email.")
      return
    }
    if (logo && logo.size > 5 * 1024 * 1024) {
      setError(es ? "El logotipo debe pesar menos de 5 MB." : "The logo must be smaller than 5 MB.")
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")
    try {
      let saved = await saveInstitution({
        name: form.name.trim(),
        organization_type: form.organization_type.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        website_url: form.website_url.trim(),
        contact_name: form.contact_name.trim(),
        contact_email: form.contact_email.trim().toLowerCase(),
        logo_path: form.logo_path || null,
      })

      if (logo) {
        const session = getDemoSession()
        const extension = logo.name.split(".").pop()?.toLowerCase() || "png"
        if (mode.mode === "supabase" && session?.userId) {
          const path = `${session.userId}/${saved.id}/logo.${extension}`
          await uploadSupabaseFile({ bucket: "institution-logos", path, file: logo, upsert: true })
          saved = await saveInstitution({
            name: saved.name,
            organization_type: saved.organization_type,
            description: saved.description,
            location: saved.location,
            website_url: saved.website_url,
            contact_name: saved.contact_name,
            contact_email: saved.contact_email,
            logo_path: path,
          })
        } else {
          saved = await saveInstitution({
            name: saved.name,
            organization_type: saved.organization_type,
            description: saved.description,
            location: saved.location,
            website_url: saved.website_url,
            contact_name: saved.contact_name,
            contact_email: saved.contact_email,
            logo_path: `preview-file:${logo.name}`,
          })
        }
      }

      setRecord(saved)
      setForm((current) => ({ ...current, logo_path: saved.logo_path ?? "" }))
      setLogo(null)
      setSuccess(es ? "Perfil institucional guardado." : "Institution profile saved.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : (es ? "No se pudo guardar la institución." : "Unable to save the institution."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-0 overflow-auto px-5 py-6 xl:px-7 xl:py-7">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{es ? "Perfil institucional conectado" : "Connected institution profile"}</p><h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">{es ? "Institución" : "Institution profile"}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{es ? "Esta información aparece en convocatorias y páginas de postulación." : "This information appears on open calls and artist-facing application pages."}</p></div><div className="flex gap-2"><button type="button" onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold hover:bg-accent/50"><RefreshCw className="size-4" />{es ? "Actualizar" : "Refresh"}</button><Link href="/programs/connected/" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">{es ? "Convocatorias" : "Open calls"}</Link></div></header>

        <div className="rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] px-4 py-3 text-xs leading-relaxed text-[#6F6882]"><span className="font-semibold text-[#5B4B8A]">{mode.label}: </span>{mode.detail}</div>
        {error && <p className="rounded-xl border border-[oklch(0.85_0.08_45)] bg-[oklch(0.97_0.03_45)] px-4 py-3 text-sm text-[oklch(0.42_0.12_45)]">{error}</p>}
        {success && <p className="flex items-center gap-2 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-4 py-3 text-sm text-[oklch(0.4_0.12_150)]"><CheckCircle2 className="size-4" />{success}</p>}

        {loading ? <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">{es ? "Cargando institución…" : "Loading institution…"}</div> : <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="grid aspect-square place-items-center rounded-2xl bg-[#F7F4FF]"><Building2 className="size-14 text-[#5B4B8A]" /></div><p className="mt-4 font-serif text-xl font-semibold">{record?.name || form.name || (es ? "Institución" : "Institution")}</p><p className="mt-1 text-sm text-muted-foreground">{record?.organization_type || form.organization_type}</p>{form.logo_path && <p className="mt-3 break-all text-[0.65rem] text-muted-foreground">{form.logo_path}</p>}<label className="mt-4 block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{es ? "Logotipo" : "Logo"}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={(event) => setLogo(event.target.files?.[0] ?? null)} className="block w-full text-xs text-muted-foreground file:mb-2 file:rounded-lg file:border-0 file:bg-[#F7F4FF] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#5B4B8A]" /><p className="mt-1 text-[0.65rem] text-muted-foreground">{mode.mode === "supabase" ? (es ? "Se carga al bucket institution-logos." : "Uploads to institution-logos.") : (es ? "Vista previa: solo nombre de archivo." : "Preview: file name only.")}</p></label></aside>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-serif text-xl font-semibold">{es ? "Información pública" : "Public information"}</h2><Field label={es ? "Nombre de institución" : "Institution name"} value={form.name} onChange={(value) => update("name", value)} /><div className="grid gap-4 sm:grid-cols-2"><Field label={es ? "Tipo de organización" : "Organization type"} value={form.organization_type} onChange={(value) => update("organization_type", value)} /><Field label={es ? "Ubicación" : "Location"} value={form.location} onChange={(value) => update("location", value)} /></div><Field label={es ? "Sitio web" : "Website"} value={form.website_url} onChange={(value) => update("website_url", value)} type="url" /><label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{es ? "Descripción" : "Description"}</span><textarea rows={7} value={form.description} onChange={(event) => update("description", event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40" /></label><h2 className="pt-3 font-serif text-xl font-semibold">{es ? "Contacto" : "Application contact"}</h2><div className="grid gap-4 sm:grid-cols-2"><Field label={es ? "Nombre" : "Contact name"} value={form.contact_name} onChange={(value) => update("contact_name", value)} /><Field label={es ? "Correo" : "Contact email"} value={form.contact_email} onChange={(value) => update("contact_email", value)} type="email" /></div><button type="button" disabled={saving} onClick={() => void save()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save className="size-4" />{saving ? (es ? "Guardando…" : "Saving…") : (es ? "Guardar perfil" : "Save profile")}</button></section>
        </div>}
      </div>
    </main>
  )
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/40" /></label>
}
