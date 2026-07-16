"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileImage, Pencil, Plus, RefreshCw, Save, Trash2 } from "lucide-react"
import { getDemoSession } from "@/lib/kleio-demo-auth"
import { deleteConnectedPortfolioWork } from "@/lib/kleio-connected-profile-data"
import { getPersistenceMode, listPortfolioWorks, savePortfolioWork, type PortfolioWorkRecord } from "@/lib/kleio-live-data"
import { uploadSupabaseFile } from "@/lib/kleio-supabase"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const blank = {
  id: "",
  title: "",
  year: "",
  medium: "",
  dimensions: "",
  description: "",
  series: "",
  tags: "",
  image_path: "",
}

export function ConnectedPortfolioManagerView() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [works, setWorks] = useState<PortfolioWorkRecord[]>([])
  const [form, setForm] = useState(blank)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const mode = getPersistenceMode()

  async function load() {
    setLoading(true)
    setError("")
    try {
      setWorks(await listPortfolioWorks())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : (es ? "No se pudo cargar el portafolio." : "Unable to load the portfolio."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  function update(key: keyof typeof blank, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function edit(work: PortfolioWorkRecord) {
    setForm({
      id: work.id,
      title: work.title,
      year: work.year,
      medium: work.medium,
      dimensions: work.dimensions,
      description: work.description,
      series: work.series,
      tags: work.tags.join(", "),
      image_path: work.image_path ?? "",
    })
    setFile(null)
    setSuccess("")
    setError("")
  }

  function reset() {
    setForm(blank)
    setFile(null)
  }

  async function save() {
    if (!form.title.trim() || !form.year.trim() || !form.medium.trim()) {
      setError(es ? "Título, año y medio son obligatorios." : "Title, year, and medium are required.")
      return
    }
    if (file && file.size > 10 * 1024 * 1024) {
      setError(es ? "La imagen debe pesar menos de 10 MB." : "Image files must be smaller than 10 MB.")
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")
    try {
      let record = await savePortfolioWork({
        id: form.id || undefined,
        title: form.title.trim(),
        year: form.year.trim(),
        medium: form.medium.trim(),
        dimensions: form.dimensions.trim(),
        description: form.description.trim(),
        series: form.series.trim(),
        tags: form.tags.split(",").map((entry) => entry.trim()).filter(Boolean),
        image_path: form.image_path || null,
        sort_order: form.id ? (works.find((work) => work.id === form.id)?.sort_order ?? works.length) : works.length,
      })

      if (file) {
        const session = getDemoSession()
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"
        if (mode.mode === "supabase" && session?.userId) {
          const path = `${session.userId}/${record.id}/primary.${extension}`
          await uploadSupabaseFile({ bucket: "portfolio-images", path, file, upsert: true })
          record = await savePortfolioWork({ ...record, image_path: path })
        } else {
          record = await savePortfolioWork({ ...record, image_path: `preview-file:${file.name}` })
        }
      }

      setWorks((current) => [...current.filter((work) => work.id !== record.id), record].sort((a, b) => a.sort_order - b.sort_order))
      setSuccess(es ? "Obra guardada en el portafolio conectado." : "Work saved to the connected portfolio.")
      reset()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : (es ? "No se pudo guardar la obra." : "Unable to save the work."))
    } finally {
      setSaving(false)
    }
  }

  async function remove(work: PortfolioWorkRecord) {
    const confirmed = window.confirm(es ? `¿Eliminar “${work.title}”?` : `Delete “${work.title}”?`)
    if (!confirmed) return
    try {
      await deleteConnectedPortfolioWork(work.id)
      setWorks((current) => current.filter((entry) => entry.id !== work.id))
      if (form.id === work.id) reset()
      setSuccess(es ? "Obra eliminada." : "Work removed.")
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : (es ? "No se pudo eliminar la obra." : "Unable to remove the work."))
    }
  }

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1160px] space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{es ? "Portafolio conectado" : "Connected portfolio"}</p><h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">{es ? "Obras" : "Portfolio works"}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{es ? "Añade, edita o elimina obras reutilizables y selecciónalas en postulaciones específicas." : "Add, edit, or remove reusable works and select them in specific applications."}</p></div><div className="flex gap-2"><button type="button" onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold hover:bg-accent/50"><RefreshCw className="size-4" />{es ? "Actualizar" : "Refresh"}</button><Link href="/artist-dashboard/passport/connected/" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">{es ? "Pasaporte" : "Creative Passport"}</Link></div></header>

        <div className="rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] px-4 py-3 text-xs leading-relaxed text-[#6F6882]"><span className="font-semibold text-[#5B4B8A]">{mode.label}: </span>{mode.detail}</div>
        {error && <p className="rounded-xl border border-[oklch(0.85_0.08_45)] bg-[oklch(0.97_0.03_45)] px-4 py-3 text-sm text-[oklch(0.42_0.12_45)]">{error}</p>}
        {success && <p className="rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-4 py-3 text-sm text-[oklch(0.4_0.12_150)]">{success}</p>}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="font-serif text-xl font-semibold">{es ? "Obras guardadas" : "Saved works"}</h2><span className="rounded-full bg-[#F7F4FF] px-2.5 py-1 text-xs font-semibold text-[#5B4B8A]">{works.length}</span></div>{loading ? <p className="mt-6 text-sm text-muted-foreground">{es ? "Cargando…" : "Loading…"}</p> : works.length === 0 ? <div className="mt-6 rounded-xl border border-dashed border-border p-6 text-center"><FileImage className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 text-sm font-semibold">{es ? "No hay obras" : "No portfolio works"}</p><p className="mt-1 text-xs text-muted-foreground">{es ? "Añade la primera obra desde el formulario." : "Add the first work from the form."}</p></div> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{works.map((work) => <article key={work.id} className="rounded-xl border border-border bg-background p-3"><div className="grid aspect-[4/3] place-items-center rounded-lg bg-muted"><FileImage className="size-7 text-muted-foreground" /></div><p className="mt-3 text-sm font-semibold">{work.title}</p><p className="mt-1 text-xs text-muted-foreground">{work.year} · {work.medium}</p><p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{work.description || (es ? "Sin descripción" : "No description")}</p>{work.image_path && <p className="mt-2 truncate text-[0.62rem] text-[#7F7890]">{work.image_path}</p>}<div className="mt-3 flex gap-2"><button type="button" onClick={() => edit(work)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-semibold hover:bg-accent/50"><Pencil className="size-3.5" />{es ? "Editar" : "Edit"}</button><button type="button" onClick={() => void remove(work)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-semibold text-[oklch(0.45_0.12_45)] hover:bg-[oklch(0.97_0.03_45)]"><Trash2 className="size-3.5" />{es ? "Eliminar" : "Remove"}</button></div></article>)}</div>}</section>

          <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="font-serif text-xl font-semibold">{form.id ? (es ? "Editar obra" : "Edit work") : (es ? "Añadir obra" : "Add work")}</h2>{form.id && <button type="button" onClick={reset} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-semibold"><Plus className="size-3.5" />{es ? "Nueva" : "New"}</button>}</div><div className="mt-4 space-y-4"><Field label={es ? "Título" : "Title"} value={form.title} onChange={(value) => update("title", value)} /><div className="grid gap-3 sm:grid-cols-2"><Field label={es ? "Año" : "Year"} value={form.year} onChange={(value) => update("year", value)} /><Field label={es ? "Medio" : "Medium"} value={form.medium} onChange={(value) => update("medium", value)} /></div><Field label={es ? "Dimensiones" : "Dimensions"} value={form.dimensions} onChange={(value) => update("dimensions", value)} /><Field label={es ? "Serie" : "Series"} value={form.series} onChange={(value) => update("series", value)} /><Field label={es ? "Etiquetas" : "Tags"} value={form.tags} onChange={(value) => update("tags", value)} /><label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{es ? "Descripción" : "Description"}</span><textarea rows={5} value={form.description} onChange={(event) => update("description", event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40" /></label><label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{es ? "Imagen" : "Image"}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-[#F7F4FF] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#5B4B8A]" /><p className="mt-1 text-[0.65rem] text-muted-foreground">{mode.mode === "supabase" ? (es ? "Se carga al bucket privado portfolio-images." : "Uploads to the private portfolio-images bucket.") : (es ? "En vista previa se guarda solo el nombre del archivo." : "Preview mode stores only the file name.")}</p></label><button type="button" disabled={saving} onClick={() => void save()} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save className="size-4" />{saving ? (es ? "Guardando…" : "Saving…") : (es ? "Guardar obra" : "Save work")}</button></div></aside>
        </div>
      </div>
    </main>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/40" /></label>
}
