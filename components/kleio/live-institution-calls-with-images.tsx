"use client"

import { useEffect, useMemo, useState } from "react"
import { Eye, ImagePlus, Loader2, Pencil, RotateCcw, Trash2, X } from "lucide-react"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { OpportunityPreviewImage } from "@/components/kleio/opportunity-preview-image"
import {
  loadInstitutionOpenCalls,
  saveInstitutionOpenCall,
  setInstitutionOpenCallStatus,
  type OpenCallRecord,
} from "@/lib/kleio-live-data"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"
import {
  emptyOpportunityImageMetadata,
  removeOpportunityImage,
  uploadOpportunityImage,
  type OpportunityImageMetadata,
} from "@/lib/kleio-opportunity-images"

const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]"
const input = "h-10 w-full rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm outline-none focus:border-primary/40"
const textarea = "w-full rounded-xl border border-[#E7E1F7] bg-white px-3 py-2 text-sm outline-none focus:border-primary/40"
const primary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
const secondary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] disabled:opacity-50"

type VisualOpenCall = OpenCallRecord & OpportunityImageMetadata

type CallForm = {
  title: string
  opportunity_type: string
  summary: string
  description: string
  location: string
  participation_format: string
  opens_at: string
  deadline_at: string
  notification_date: string
  program_start_date: string
  program_end_date: string
  required_materials: string
} & OpportunityImageMetadata

function blankForm(): CallForm {
  return {
    title: "",
    opportunity_type: "open_call",
    summary: "",
    description: "",
    location: "",
    participation_format: "online",
    opens_at: "",
    deadline_at: "",
    notification_date: "",
    program_start_date: "",
    program_end_date: "",
    required_materials: "Artist statement, CV, Portfolio",
    ...emptyOpportunityImageMetadata(),
  }
}

function Field({ label, value, onChange, type = "text", multiline = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; multiline?: boolean }) {
  return <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground"><span>{label}</span>{multiline ? <textarea className={textarea} rows={4} value={value} onChange={(event) => onChange(event.target.value)} /> : <input type={type} className={input} value={value} onChange={(event) => onChange(event.target.value)} />}</label>
}

function normalizeVisualCall(call: OpenCallRecord): VisualOpenCall {
  const partial = call as OpenCallRecord & Partial<OpportunityImageMetadata>
  return {
    ...call,
    preview_image_path: partial.preview_image_path || "",
    preview_image_url: partial.preview_image_url || "",
    preview_image_source_url: partial.preview_image_source_url || "",
    preview_image_alt_text: partial.preview_image_alt_text || "",
    preview_image_attribution: partial.preview_image_attribution || "",
    preview_image_rights_status: partial.preview_image_rights_status || "not_supplied",
    preview_image_origin: partial.preview_image_origin || "kleio_fallback",
  }
}

export function LiveInstitutionCallsWithImages() {
  const [calls, setCalls] = useState<VisualOpenCall[]>([])
  const [form, setForm] = useState<CallForm>(blankForm())
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const localPreviewUrl = useMemo(() => imageFile ? URL.createObjectURL(imageFile) : "", [imageFile])
  useEffect(() => () => { if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl) }, [localPreviewUrl])

  const refresh = () => loadInstitutionOpenCalls().then((records) => setCalls(records.map(normalizeVisualCall)))
  useEffect(() => { void refresh().catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)) }, [])

  function reset() {
    setEditingId(null)
    setForm(blankForm())
    setImageFile(null)
    setRemoveCurrentImage(false)
  }

  function edit(call: VisualOpenCall) {
    setEditingId(call.id)
    setForm({
      title: call.title,
      opportunity_type: call.opportunity_type,
      summary: call.summary,
      description: call.description,
      location: call.location,
      participation_format: call.participation_format,
      opens_at: call.opens_at || "",
      deadline_at: call.deadline_at || "",
      notification_date: call.notification_date || "",
      program_start_date: call.program_start_date || "",
      program_end_date: call.program_end_date || "",
      required_materials: call.required_materials.join(", "),
      preview_image_path: call.preview_image_path,
      preview_image_url: call.preview_image_url,
      preview_image_source_url: call.preview_image_source_url,
      preview_image_alt_text: call.preview_image_alt_text,
      preview_image_attribution: call.preview_image_attribution,
      preview_image_rights_status: call.preview_image_rights_status,
      preview_image_origin: call.preview_image_origin,
    })
    setImageFile(null)
    setRemoveCurrentImage(false)
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function save(publish: boolean) {
    const hasPlannedImage = Boolean(imageFile || (!removeCurrentImage && (form.preview_image_path || form.preview_image_url)))
    if (hasPlannedImage && !form.preview_image_alt_text.trim()) {
      setError("Add concise alt text describing the opportunity image before saving.")
      return
    }

    setSaving(true)
    setError("")
    setMessage("")
    let uploadedPath = ""
    const previousPath = form.preview_image_path

    try {
      if (imageFile) uploadedPath = await uploadOpportunityImage(imageFile)

      const row = await saveInstitutionOpenCall({
        title: form.title,
        opportunity_type: form.opportunity_type,
        summary: form.summary,
        description: form.description,
        location: form.location,
        participation_format: form.participation_format,
        opens_at: form.opens_at || null,
        deadline_at: form.deadline_at || null,
        notification_date: form.notification_date || null,
        program_start_date: form.program_start_date || null,
        program_end_date: form.program_end_date || null,
        required_materials: form.required_materials.split(",").map((item) => item.trim()).filter(Boolean),
        id: editingId || undefined,
        publish,
      })

      const useUploadedImage = Boolean(uploadedPath)
      const useExternalImage = !useUploadedImage && !removeCurrentImage && Boolean(form.preview_image_url.trim())
      const preserveStoredImage = !useUploadedImage && !removeCurrentImage && Boolean(form.preview_image_path)
      const metadata: OpportunityImageMetadata = useUploadedImage ? {
        preview_image_path: uploadedPath,
        preview_image_url: "",
        preview_image_source_url: form.preview_image_source_url.trim(),
        preview_image_alt_text: form.preview_image_alt_text.trim(),
        preview_image_attribution: form.preview_image_attribution.trim() || row.institution_name,
        preview_image_rights_status: "provider_owned",
        preview_image_origin: "institution_upload",
      } : useExternalImage ? {
        preview_image_path: "",
        preview_image_url: form.preview_image_url.trim(),
        preview_image_source_url: form.preview_image_source_url.trim() || form.preview_image_url.trim(),
        preview_image_alt_text: form.preview_image_alt_text.trim(),
        preview_image_attribution: form.preview_image_attribution.trim(),
        preview_image_rights_status: form.preview_image_rights_status === "not_supplied" ? "unknown" : form.preview_image_rights_status,
        preview_image_origin: "official_source",
      } : preserveStoredImage ? {
        preview_image_path: form.preview_image_path,
        preview_image_url: "",
        preview_image_source_url: form.preview_image_source_url.trim(),
        preview_image_alt_text: form.preview_image_alt_text.trim(),
        preview_image_attribution: form.preview_image_attribution.trim(),
        preview_image_rights_status: form.preview_image_rights_status,
        preview_image_origin: "institution_upload",
      } : emptyOpportunityImageMetadata()

      const supabase = getSupabaseBrowserClient()
      const { error: imageError } = await supabase.from("open_calls").update(metadata).eq("id", row.id)
      if (imageError) throw imageError

      if (previousPath && previousPath !== metadata.preview_image_path) {
        await removeOpportunityImage(previousPath).catch(() => undefined)
      }

      setMessage(`${row.title} ${publish ? "published" : "saved as a draft"}${metadata.preview_image_origin === "kleio_fallback" ? " with a KLEIO category cover" : " with its preview image"}.`)
      reset()
      await refresh()
    } catch (reason) {
      if (uploadedPath) await removeOpportunityImage(uploadedPath).catch(() => undefined)
      setError(reason instanceof Error ? reason.message : "Unable to save the open call.")
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(call: VisualOpenCall, status: OpenCallRecord["status"]) {
    setSaving(true)
    setError("")
    try {
      await setInstitutionOpenCallStatus(call.id, status)
      setMessage(`${call.title} is now ${status}.`)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update the call status.")
    } finally {
      setSaving(false)
    }
  }

  const previewOpportunity = {
    title: form.title || "Opportunity preview",
    provider_name: calls.find((call) => call.id === editingId)?.institution_name || "Your institution",
    opportunity_type: form.opportunity_type,
    preview_image_path: localPreviewUrl || removeCurrentImage ? "" : form.preview_image_path,
    preview_image_url: localPreviewUrl || (removeCurrentImage ? "" : form.preview_image_url),
    preview_image_source_url: form.preview_image_source_url,
    preview_image_alt_text: form.preview_image_alt_text,
    preview_image_attribution: form.preview_image_attribution,
    preview_image_rights_status: imageFile ? "provider_owned" as const : form.preview_image_rights_status,
    preview_image_origin: imageFile ? "institution_upload" as const : removeCurrentImage ? "kleio_fallback" as const : form.preview_image_origin,
  }

  return <main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6"><div className="mx-auto max-w-[1180px] space-y-5">
    <WorkspacePageHeader eyebrow="Institution workspace" title={editingId ? "Edit open call" : "Create an open call"} description="Create and publish authentic calls with an optional source-aware preview image. When no image is supplied, artists see a clearly labeled KLEIO category cover." />
    {loading && <div className={`${card} flex items-center gap-2 text-sm text-muted-foreground`}><Loader2 className="size-4 animate-spin" />Loading institution records…</div>}
    {error && <div role="alert" className={`${card} border-red-200 text-sm text-red-700`}>{error}</div>}

    <section className={card}>
      <div className="flex items-center justify-between gap-3">{editingId && <p className="text-sm font-semibold text-[#5B4B8A]">Editing a saved call</p>}{editingId && <button className={secondary} onClick={reset}><X className="size-4" />Cancel edit</button>}</div>
      <div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Call title" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} /><Field label="Opportunity type" value={form.opportunity_type} onChange={(value) => setForm((current) => ({ ...current, opportunity_type: value }))} /><Field label="Location" value={form.location} onChange={(value) => setForm((current) => ({ ...current, location: value }))} /><Field label="Participation format" value={form.participation_format} onChange={(value) => setForm((current) => ({ ...current, participation_format: value }))} /><Field label="Opens" type="date" value={form.opens_at} onChange={(value) => setForm((current) => ({ ...current, opens_at: value }))} /><Field label="Deadline" type="date" value={form.deadline_at} onChange={(value) => setForm((current) => ({ ...current, deadline_at: value }))} /><Field label="Notification date" type="date" value={form.notification_date} onChange={(value) => setForm((current) => ({ ...current, notification_date: value }))} /><Field label="Required materials — comma separated" value={form.required_materials} onChange={(value) => setForm((current) => ({ ...current, required_materials: value }))} /></div>
      <div className="mt-4 grid gap-4"><Field label="Public summary" multiline value={form.summary} onChange={(value) => setForm((current) => ({ ...current, summary: value }))} /><Field label="Full description and eligibility" multiline value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} /></div>
    </section>

    <section className={card}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <h2 className="font-serif text-xl font-semibold">Opportunity preview image</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Upload an image owned or authorized by the institution, or provide an official source image URL. Do not use unrelated artwork or search-engine images.</p>
          <label className="mt-4 flex min-h-28 cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-[#CFC5ED] bg-[#FBF9FF] px-4 text-sm font-semibold text-[#5B4B8A] hover:bg-[#F7F4FF]"><ImagePlus className="size-5" /><span>{imageFile ? imageFile.name : "Choose JPG, PNG, or WebP · maximum 10 MB"}</span><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setImageFile(event.target.files?.[0] || null); setRemoveCurrentImage(false) }} /></label>
          <div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Official image URL — optional alternative" type="url" value={form.preview_image_url} onChange={(value) => { setForm((current) => ({ ...current, preview_image_url: value, preview_image_origin: value ? "official_source" : current.preview_image_origin })); if (value) { setImageFile(null); setRemoveCurrentImage(false) } }} /><Field label="Image source page" type="url" value={form.preview_image_source_url} onChange={(value) => setForm((current) => ({ ...current, preview_image_source_url: value }))} /><Field label="Alt text" value={form.preview_image_alt_text} onChange={(value) => setForm((current) => ({ ...current, preview_image_alt_text: value }))} /><Field label="Attribution" value={form.preview_image_attribution} onChange={(value) => setForm((current) => ({ ...current, preview_image_attribution: value }))} /></div>
          <label className="mt-4 grid gap-1.5 text-xs font-semibold text-muted-foreground"><span>Rights status</span><select className={input} value={form.preview_image_rights_status} onChange={(event) => setForm((current) => ({ ...current, preview_image_rights_status: event.target.value as OpportunityImageMetadata["preview_image_rights_status"] }))}><option value="provider_owned">Owned by institution/provider</option><option value="permission_confirmed">Permission confirmed</option><option value="licensed">Licensed for use</option><option value="official_publication">Official publication image</option><option value="public_domain">Public domain</option><option value="unknown">Unknown — requires review</option></select></label>
          {(form.preview_image_path || form.preview_image_url || imageFile) && <button className={`${secondary} mt-4`} type="button" onClick={() => { setImageFile(null); setRemoveCurrentImage(true); setForm((current) => ({ ...current, preview_image_url: "", preview_image_source_url: "", preview_image_alt_text: "", preview_image_attribution: "", preview_image_origin: "kleio_fallback", preview_image_rights_status: "not_supplied" })) }}><Trash2 className="size-4" />Use KLEIO category cover instead</button>}
        </div>
        <OpportunityPreviewImage opportunity={previewOpportunity} variant="editor" showCaption />
      </div>
      <div className="mt-5 flex flex-wrap gap-2"><button className={secondary} disabled={saving || !form.title.trim()} onClick={() => void save(false)}>Save draft</button><button className={primary} disabled={saving || !form.title.trim() || !form.deadline_at} onClick={() => void save(true)}>{saving && <Loader2 className="size-4 animate-spin" />}Publish call</button></div>
      {message && <p role="status" className="mt-3 text-sm font-medium text-emerald-700">{message}</p>}
    </section>

    <section className={card}>
      <h2 className="font-serif text-xl font-semibold">Saved calls</h2>
      <div className="mt-4 space-y-3">{calls.length ? calls.map((call) => <article key={call.id} className="rounded-xl border border-[#E7E1F7] p-4"><div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]"><OpportunityPreviewImage opportunity={{ ...call, provider_name: call.institution_name }} /><div><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{call.title}</p><p className="text-xs text-muted-foreground">{call.status} · Deadline {call.deadline_at || "not set"} · Updated {new Date(call.updated_at).toLocaleString()}</p></div><div className="flex flex-wrap gap-2"><button className={secondary} onClick={() => edit(call)}><Pencil className="size-4" />Edit</button><button className={secondary} onClick={() => setPreviewId((current) => current === call.id ? null : call.id)}><Eye className="size-4" />{previewId === call.id ? "Hide preview" : "Preview"}</button>{call.status === "open" ? <button className={secondary} disabled={saving} onClick={() => void changeStatus(call, "closed")}>Close call</button> : <button className={secondary} disabled={saving || !call.deadline_at} onClick={() => void changeStatus(call, "open")}><RotateCcw className="size-4" />Reopen</button>}<span className={`rounded-full px-3 py-2 text-xs font-semibold ${call.status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-[#F7F4FF] text-[#5B4B8A]"}`}>{call.status}</span></div></div>{previewId === call.id && <div className="mt-4 border-t border-[#E7E1F7] pt-4"><OpportunityPreviewImage opportunity={{ ...call, provider_name: call.institution_name }} variant="hero" showCaption /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#A997E8]">Artist preview · {call.institution_name}</p><h3 className="mt-1 font-serif text-2xl font-semibold">{call.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{call.description || call.summary || "No description provided."}</p><p className="mt-3 text-xs text-muted-foreground">Required: {call.required_materials.join(", ") || "None specified"}</p></div>}</div></div></article>) : <p className="text-sm text-muted-foreground">No open calls have been created yet.</p>}</div>
    </section>
  </div></main>
}
