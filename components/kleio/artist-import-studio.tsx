"use client"

/* eslint-disable @next/next/no-img-element -- signed private URLs are short-lived */
/* eslint-disable @typescript-eslint/no-explicit-any -- Google Picker is a runtime global API */

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Check,
  Cloud,
  FolderOpen,
  ImagePlus,
  Loader2,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import {
  ARTWORK_IMPORT_ACCEPT,
  approveArtworkImportItem,
  blankArtworkImportDraft,
  clearArtworkImportDraft,
  confirmArtworkFields,
  createArtworkImportItem,
  downloadGoogleDriveArtwork,
  loadArtworkImportDraft,
  loadArtworkPreview,
  removeArtworkImportItem,
  saveArtworkImportDraft,
  saveArtworkImportDraftLocally,
  updateArtworkField,
  type ArtworkImportDraftPayload,
  type ArtworkImportField,
  type ArtworkImportItem,
  type GoogleDrivePickerFile,
} from "@/lib/kleio-artwork-import"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"

type SaveState = "idle" | "local" | "saving" | "saved" | "offline" | "conflict" | "error"
type GooglePickerDocument = { id?: string; name?: string; mimeType?: string; type?: string }
type GoogleTokenResponse = { access_token?: string; error?: string; error_description?: string }

declare global {
  interface Window {
    google?: any
    gapi?: any
  }
}

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const quiet = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#746E80] transition hover:bg-[#F7F4FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:opacity-50"
const input = "min-h-11 w-full rounded-xl border border-[#DED7EF] bg-white px-3 py-2 text-sm text-[#292631] outline-none transition focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12 disabled:bg-[#F7F5FA] disabled:text-[#8A8296]"
const textarea = `${input} min-h-24 resize-y leading-6`
const mediumOptions = ["Painting", "Oil on canvas", "Acrylic on canvas", "Watercolor", "Drawing", "Photography", "Ceramics", "Sculpture", "Installation", "Textile", "Printmaking", "Digital media", "Mixed media"]

function loadScript(id: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null
    if (existing?.dataset.loaded === "true") return resolve()
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("A required Google service could not load.")), { once: true })
      return
    }
    const script = document.createElement("script")
    script.id = id
    script.src = src
    script.async = true
    script.defer = true
    script.addEventListener("load", () => { script.dataset.loaded = "true"; resolve() }, { once: true })
    script.addEventListener("error", () => reject(new Error("A required Google service could not load.")), { once: true })
    document.head.appendChild(script)
  })
}

async function loadGooglePicker() {
  await Promise.all([
    loadScript("kleio-google-identity", "https://accounts.google.com/gsi/client"),
    loadScript("kleio-google-api", "https://apis.google.com/js/api.js"),
  ])
  await new Promise<void>((resolve, reject) => {
    if (!window.gapi?.load) return reject(new Error("Google Picker did not initialize."))
    window.gapi.load("picker", { callback: resolve, onerror: () => reject(new Error("Google Picker did not initialize.")) })
  })
}

function readableBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function FieldStatus({ field }: { field: ArtworkImportField }) {
  const label = field.status === "extracted" ? "Extracted" : field.status === "suggested" ? "Suggested" : field.status === "edited" ? "Edited" : field.status === "confirmed" ? "Confirmed" : "Missing"
  const confidence = field.confidence === "strong_source_match" ? "Strong source match" : field.confidence === "possible_suggestion" ? "Possible suggestion" : "Needs artist confirmation"
  return (
    <details>
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-[#E2DCF1] bg-[#FAF9FD] px-2.5 py-1 text-[0.68rem] font-semibold text-[#625C70] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20">
        <span aria-hidden="true" className={`size-1.5 rounded-full ${field.status === "missing" ? "bg-amber-500" : field.status === "confirmed" ? "bg-emerald-600" : "bg-[#826FB2]"}`} />
        {label}
      </summary>
      <div className="mt-2 rounded-lg border border-[#E7E1F7] bg-white p-2.5 text-[0.72rem] leading-5 text-[#746E80]"><p>{field.source}</p><p className="mt-1 font-semibold text-[#625C70]">{confidence}</p></div>
    </details>
  )
}

function ArtworkField({ label, field, disabled, multiline = false, list, onChange }: {
  label: string
  field: ArtworkImportField
  disabled: boolean
  multiline?: boolean
  list?: string
  onChange: (value: string) => void
}) {
  const id = `artwork-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
  return (
    <div className="grid gap-1.5">
      <div className="flex min-h-7 items-center justify-between gap-3"><label htmlFor={id} className="text-xs font-semibold text-[#625C70]">{label}</label><FieldStatus field={field} /></div>
      {multiline
        ? <textarea id={id} className={textarea} rows={4} value={field.value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
        : <input id={id} list={list} className={input} value={field.value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />}
    </div>
  )
}

function SaveStatus({ state }: { state: SaveState }) {
  const text = state === "saving" ? "Saving to KLEIO…" : state === "saved" ? "Saved to KLEIO" : state === "local" ? "Saved locally" : state === "offline" ? "Offline — saved locally" : state === "conflict" ? "A newer saved import exists" : state === "error" ? "Save needs attention" : ""
  if (!text) return null
  return <p role="status" aria-live="polite" className={`inline-flex items-center gap-2 text-xs font-semibold ${state === "error" || state === "conflict" ? "text-amber-700" : "text-[#746E80]"}`}>{state === "saving" ? <Loader2 className="size-3.5 animate-spin" /> : state === "saved" ? <Check className="size-3.5 text-emerald-600" /> : <Save className="size-3.5" />}{text}</p>
}

export function ArtistImportStudio({ onPortfolioChanged, compact = false, autoOpen = false }: {
  onPortfolioChanged?: () => void
  compact?: boolean
  autoOpen?: boolean
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const revisionRef = useRef(0)
  const hydratedRef = useRef(false)
  const lastSavedRef = useRef("")
  const googleTokenRef = useRef("")
  const autoOpenedRef = useRef(false)
  const [draft, setDraft] = useState<ArtworkImportDraftPayload>(() => blankArtworkImportDraft())
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [approving, setApproving] = useState("")
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [conflictDraft, setConflictDraft] = useState<ArtworkImportDraftPayload | null>(null)
  const [dragging, setDragging] = useState(false)

  const driveClientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID ?? ""
  const driveApiKey = process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY ?? ""
  const driveAppId = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_APP_ID ?? ""
  const driveConfigured = Boolean(driveClientId && driveApiKey)
  const activeItem = useMemo(() => draft.items.find((item) => item.id === draft.activeItemId) ?? draft.items[0] ?? null, [draft.activeItemId, draft.items])
  const readyToApprove = draft.items.filter((item) => item.status === "ready" && item.fields.title.value.trim())

  async function hydratePreviews(items: ArtworkImportItem[]) {
    const missing = items.filter((item) => item.storagePath && !previewUrls[item.id])
    if (!missing.length) return
    const results = await Promise.allSettled(missing.map(async (item) => ({ item, preview: await loadArtworkPreview(item.storagePath) })))
    setPreviewUrls((current) => {
      const next = { ...current }
      for (const result of results) if (result.status === "fulfilled") next[result.value.item.id] = result.value.preview.url
      return next
    })
  }

  useEffect(() => {
    let active = true
    void loadArtworkImportDraft()
      .then((saved) => {
        if (!active || !saved) return
        revisionRef.current = saved.revision
        setDraft(saved.payload)
        lastSavedRef.current = JSON.stringify(saved.payload)
        void hydratePreviews(saved.payload.items)
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "KLEIO could not restore the previous import.") })
      .finally(() => { if (active) { hydratedRef.current = true; setLoading(false) } })
    return () => { active = false }
  // Draft recovery is intentionally evaluated once per active account.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hydratedRef.current || loading) return
    const normalized = { ...draft, updatedAt: new Date().toISOString() }
    const serialized = JSON.stringify(normalized)
    if (serialized === lastSavedRef.current) return
    saveArtworkImportDraftLocally(normalized, revisionRef.current)
    setSaveState(navigator.onLine ? "local" : "offline")
    const timer = window.setTimeout(() => {
      if (!navigator.onLine) return setSaveState("offline")
      setSaveState("saving")
      void saveArtworkImportDraft(normalized, revisionRef.current)
        .then((saved) => { revisionRef.current = saved.revision; lastSavedRef.current = JSON.stringify(saved.payload); setSaveState("saved") })
        .catch(async (reason) => {
          if (reason instanceof Error && reason.name === "KleioDraftConflictError") {
            const saved = await loadArtworkImportDraft().catch(() => null)
            setConflictDraft(saved?.payload ?? null)
            setSaveState("conflict")
          } else setSaveState(navigator.onLine ? "error" : "offline")
        })
    }, 1_100)
    return () => window.clearTimeout(timer)
  }, [draft, loading])

  useEffect(() => {
    if (!autoOpen || loading || autoOpenedRef.current || !dialogRef.current) return
    autoOpenedRef.current = true
    dialogRef.current.showModal()
    window.setTimeout(() => headingRef.current?.focus(), 0)
    void trackKleioProductEvent("import_started", { surface: "artwork_import_studio", metadata: { source: "studio_auto_open" } })
  }, [autoOpen, loading])

  function showStudio() {
    setError("")
    setStatus("")
    if (!dialogRef.current?.open) dialogRef.current?.showModal()
    window.setTimeout(() => headingRef.current?.focus(), 0)
    void trackKleioProductEvent("import_started", { surface: "artwork_import_studio", metadata: { source: "studio_open" } })
  }

  function replaceItem(nextItem: ArtworkImportItem) {
    setDraft((current) => ({ ...current, items: current.items.map((item) => item.id === nextItem.id ? nextItem : item), updatedAt: new Date().toISOString() }))
  }

  async function importFiles(files: File[], sourceType: ArtworkImportItem["sourceType"], providerFiles?: GoogleDrivePickerFile[], force = false) {
    if (!files.length || (importing && !force)) return
    setImporting(true)
    setError("")
    let imported = 0
    const errors: string[] = []
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index]
      try {
        setStatus(`Preparing ${index + 1} of ${files.length}: ${file.name}`)
        const provider = providerFiles?.[index]
        const item = await createArtworkImportItem({
          file,
          sourceType,
          sessionId: draft.sessionId,
          providerFileId: provider?.id,
          providerMetadata: provider ? { provider_name: provider.name, provider_mime_type: provider.mimeType } : undefined,
        })
        const preview = await loadArtworkPreview(item.storagePath)
        setPreviewUrls((current) => ({ ...current, [item.id]: preview.url }))
        setDraft((current) => ({ ...current, step: "review", activeItemId: item.id, items: [...current.items, item], updatedAt: new Date().toISOString() }))
        imported += 1
      } catch (reason) {
        errors.push(reason instanceof Error ? reason.message : `${file.name} could not be imported.`)
      }
    }
    setImporting(false)
    setStatus(imported ? `${imported} artwork file${imported === 1 ? "" : "s"} prepared. Nothing has been added to your Creative Passport yet.` : "")
    setError(errors.join(" "))
    void trackKleioProductEvent("import_completed", { surface: "artwork_import_studio", metadata: { source: sourceType, result_count: imported } })
  }

  async function requestGoogleToken() {
    await loadGooglePicker()
    return new Promise<string>((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) return reject(new Error("Google authorization did not initialize."))
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: driveClientId,
        scope: "https://www.googleapis.com/auth/drive.file",
        include_granted_scopes: false,
        callback: (response: GoogleTokenResponse) => {
          if (response.error || !response.access_token) return reject(new Error(response.error_description || "Google Drive permission was not granted."))
          googleTokenRef.current = response.access_token
          resolve(response.access_token)
        },
        error_callback: () => reject(new Error("Google Drive authorization was cancelled or blocked.")),
      })
      client.requestAccessToken({ prompt: googleTokenRef.current ? "" : "consent" })
    })
  }

  async function connectGoogleDrive() {
    if (!driveConfigured || importing) return
    setImporting(true)
    setError("")
    setStatus("Opening Google Drive…")
    try {
      const accessToken = await requestGoogleToken()
      const google = window.google
      const view = new google.picker.DocsView(google.picker.ViewId.DOCS).setMimeTypes("image/jpeg,image/png,image/webp").setMode(google.picker.DocsViewMode.LIST)
      const selected = await new Promise<GoogleDrivePickerFile[]>((resolve, reject) => {
        const builder = new google.picker.PickerBuilder()
          .addView(view)
          .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
          .setOAuthToken(accessToken)
          .setDeveloperKey(driveApiKey)
          .setCallback((data: { action?: string; docs?: GooglePickerDocument[] }) => {
            if (data.action === google.picker.Action.PICKED) resolve((data.docs ?? []).flatMap((document) => document.id && (document.mimeType ?? document.type) ? [{ id: document.id, name: document.name ?? "Drive artwork", mimeType: document.mimeType ?? document.type ?? "" }] : []))
            else if (data.action === google.picker.Action.CANCEL) resolve([])
            else if (data.action === google.picker.Action.ERROR) reject(new Error("Google Drive could not complete the selection."))
          })
        if (driveAppId) builder.setAppId(driveAppId)
        builder.build().setVisible(true)
      })
      if (!selected.length) return setStatus("No Drive files were selected. Your existing progress is safe.")
      const files: File[] = []
      const accepted: GoogleDrivePickerFile[] = []
      for (const selectedFile of selected) {
        try { files.push(await downloadGoogleDriveArtwork(selectedFile, accessToken)); accepted.push(selectedFile) }
        catch (reason) { setError((current) => `${current ? `${current} ` : ""}${reason instanceof Error ? reason.message : `${selectedFile.name} could not be copied.`}`) }
      }
      await importFiles(files, "google_drive_image", accepted, true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Google Drive could not be opened.")
    } finally {
      setImporting(false)
    }
  }

  async function disconnectGoogleDrive() {
    const token = googleTokenRef.current
    googleTokenRef.current = ""
    if (token && window.google?.accounts?.oauth2?.revoke) await new Promise<void>((resolve) => window.google.accounts.oauth2.revoke(token, () => resolve()))
    setStatus("Google Drive access for this session was disconnected. Private copies already imported into KLEIO remain available.")
  }

  async function removeItem(item: ArtworkImportItem) {
    if (!window.confirm(`Remove ${item.fields.title.value || item.originalFilename} from this import?`)) return
    try {
      await removeArtworkImportItem(item)
      setPreviewUrls((current) => { const next = { ...current }; delete next[item.id]; return next })
      setDraft((current) => {
        const items = current.items.filter((entry) => entry.id !== item.id)
        return { ...current, step: items.length ? "review" : "source", activeItemId: items[0]?.id ?? "", items, updatedAt: new Date().toISOString() }
      })
      setStatus("The unfinished record and its private import file were removed.")
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The item could not be removed.") }
  }

  async function approve(item: ArtworkImportItem) {
    if (approving || item.status === "approved") return
    setApproving(item.id)
    setError("")
    try {
      const confirmed = confirmArtworkFields(item)
      const portfolioWorkId = await approveArtworkImportItem(confirmed)
      replaceItem({ ...confirmed, status: "approved", portfolioWorkId, approvedAt: new Date().toISOString() })
      setStatus(`${confirmed.fields.title.value} was approved and added to your Creative Passport portfolio.`)
      onPortfolioChanged?.()
      void trackKleioProductEvent("proposal_approved", { surface: "artwork_import_studio", metadata: { status: "artwork_approved" } })
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The artwork could not be approved.") }
    finally { setApproving("") }
  }

  async function approveAllReady() {
    if (!readyToApprove.length || approving) return
    for (const item of readyToApprove) await approve(item)
  }

  async function startFresh() {
    if (draft.items.some((item) => item.status !== "approved") && !window.confirm("Delete the unfinished import draft and its unapproved files?")) return
    setImporting(true)
    try {
      for (const item of draft.items.filter((entry) => entry.status !== "approved")) await removeArtworkImportItem(item).catch(() => undefined)
      await clearArtworkImportDraft()
      revisionRef.current = 0
      lastSavedRef.current = ""
      setPreviewUrls({})
      setDraft(blankArtworkImportDraft())
      setStatus("A new private import is ready.")
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The import could not be reset.") }
    finally { setImporting(false) }
  }

  function restoreConflict() {
    if (!conflictDraft) return
    setDraft(conflictDraft)
    setConflictDraft(null)
    setSaveState("saved")
    void hydratePreviews(conflictDraft.items)
  }

  const launcher = compact ? (
    <button type="button" className={secondary} onClick={showStudio}><Upload className="size-4" />Import artwork</button>
  ) : (
    <section className="relative overflow-hidden rounded-[26px] border border-[#E2DCF1] bg-[linear-gradient(145deg,#F9F6FF,#FFFFFF)] p-6 shadow-[0_22px_70px_rgba(82,64,130,0.07)]" aria-labelledby="artwork-import-launcher">
      <div aria-hidden="true" className="absolute -right-16 -top-20 size-56 rounded-full bg-[#E9E1FA]/70 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Creative Passport import</p><h2 id="artwork-import-launcher" className="mt-2 font-serif text-2xl font-semibold tracking-[-0.03em]">Bring your existing artwork into KLEIO</h2><p className="mt-2 text-sm leading-6 text-[#746E80]">Choose images from your device or Google Drive. KLEIO reads available file information, prepares editable records, and waits for approval before saving.</p><div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-[#6A5896]"><span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5" />Private by default</span><span className="inline-flex items-center gap-1.5"><Sparkles className="size-3.5" />Suggestions stay editable</span><span className="inline-flex items-center gap-1.5"><Save className="size-3.5" />Progress autosaves</span></div></div>
        <button type="button" className={primary} onClick={showStudio}><FolderOpen className="size-4" />Open Import Studio</button>
      </div>
    </section>
  )

  return (
    <>
      {launcher}
      <dialog ref={dialogRef} aria-labelledby="artwork-import-title" aria-describedby="artwork-import-description" className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-white p-0 text-[#292631] shadow-2xl backdrop:bg-[#20182D]/45 backdrop:backdrop-blur-sm sm:inset-auto sm:m-auto sm:h-[min(860px,calc(100dvh-32px))] sm:w-[min(1280px,calc(100vw-32px))] sm:rounded-[28px] sm:border sm:border-[#DCD4EF]" onCancel={() => setStatus("Import progress is saved. Reopen the Studio to continue.")}>
        <div className="flex h-full min-h-0 flex-col bg-[#FCFBFE]">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E7E1F7] bg-white px-4 py-4 sm:px-6">
            <div><p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Artist-controlled import</p><h2 id="artwork-import-title" ref={headingRef} tabIndex={-1} className="mt-1 font-serif text-2xl font-semibold outline-none">Import Studio</h2><p id="artwork-import-description" className="mt-1 max-w-3xl text-xs leading-5 text-[#746E80]">KLEIO imports only files you select. Extracted information and suggestions remain separate until you review and approve the artwork record.</p></div>
            <div className="flex items-center gap-2"><SaveStatus state={saveState} /><button type="button" className="grid size-11 place-items-center rounded-xl border border-[#E2DCF1] bg-white" onClick={() => dialogRef.current?.close()} aria-label="Close Import Studio"><X className="size-5" /></button></div>
          </header>
          {conflictDraft && <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="alert"><p><strong>Newer import progress exists.</strong> Load it before continuing.</p><button type="button" className={secondary} onClick={restoreConflict}><RotateCcw className="size-4" />Load latest</button></div>}
          {(error || status) && <div className={`shrink-0 border-b px-4 py-3 text-sm sm:px-6 ${error ? "border-red-200 bg-red-50 text-red-700" : "border-[#E7E1F7] bg-[#F9F7FC] text-[#625C70]"}`} role={error ? "alert" : "status"}>{error || status}</div>}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? <div className="grid min-h-full place-items-center"><p className="flex items-center gap-2 text-sm text-[#746E80]"><Loader2 className="size-4 animate-spin" />Restoring your import…</p></div> : draft.step === "source" ? (
              <main className="mx-auto flex min-h-full max-w-5xl flex-col justify-center gap-5 px-4 py-8 sm:px-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <section className={`rounded-3xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-[#8C78BF] bg-[#F5F1FD]" : "border-[#D8D0F2] bg-white"}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true) }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void importFiles(Array.from(event.dataTransfer.files), "device_image") }}>
                    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><Upload className="size-5" /></span><h3 className="mt-4 font-serif text-xl font-semibold">Upload from device</h3><p className="mt-2 text-sm leading-6 text-[#746E80]">JPEG, PNG, or WebP, up to 20 MB each. Drag files here or use the file picker.</p><button type="button" className={`${secondary} mt-5`} disabled={importing} onClick={() => fileInputRef.current?.click()}>{importing ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}Choose artwork files</button><input ref={fileInputRef} type="file" multiple accept={ARTWORK_IMPORT_ACCEPT} className="sr-only" onChange={(event) => void importFiles(Array.from(event.target.files ?? []), "device_image")} />
                  </section>
                  <section className="rounded-3xl border border-[#E2DCF1] bg-white p-6 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><Cloud className="size-5" /></span><h3 className="mt-4 font-serif text-xl font-semibold">Choose from Google Drive</h3><p className="mt-2 text-sm leading-6 text-[#746E80]">Drive permission is separate from Google login. KLEIO receives only files you deliberately select.</p><button type="button" className={`${secondary} mt-5`} disabled={!driveConfigured || importing} onClick={() => void connectGoogleDrive()}>{importing ? <Loader2 className="size-4 animate-spin" /> : <FolderOpen className="size-4" />}Connect and choose files</button>{!driveConfigured && <p className="mt-3 text-xs leading-5 text-amber-700">Drive code is ready, but the restricted client ID and Picker key must be added to this deployment.</p>}</section>
                </div>
                <button type="button" className={`${quiet} mx-auto`} onClick={() => dialogRef.current?.close()}>Skip for now</button>
              </main>
            ) : (
              <main className="grid min-h-full lg:grid-cols-[230px_minmax(0,1fr)_390px]">
                <aside className="border-b border-[#E7E1F7] bg-white p-3 lg:border-b-0 lg:border-r lg:p-4" aria-label="Imported artwork files">
                  <div className="flex items-center justify-between"><div><p className="text-xs font-semibold">Selected works</p><p className="text-[0.7rem] text-[#8A8296]">{draft.items.length} in this import</p></div><button type="button" className="grid size-10 place-items-center rounded-xl border border-[#E2DCF1]" onClick={() => fileInputRef.current?.click()} aria-label="Add more artwork files"><ImagePlus className="size-4" /></button><input ref={fileInputRef} type="file" multiple accept={ARTWORK_IMPORT_ACCEPT} className="sr-only" onChange={(event) => void importFiles(Array.from(event.target.files ?? []), "device_image")} /></div>
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-2 lg:grid lg:max-h-[calc(100dvh-270px)] lg:overflow-y-auto lg:overflow-x-hidden">{draft.items.map((item, index) => <button key={item.id} type="button" aria-current={activeItem?.id === item.id ? "true" : undefined} onClick={() => setDraft((current) => ({ ...current, activeItemId: item.id }))} className={`relative min-w-32 overflow-hidden rounded-2xl border bg-white text-left focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 lg:min-w-0 ${activeItem?.id === item.id ? "border-[#8C78BF] ring-2 ring-[#A997E8]/20" : "border-[#E7E1F7]"}`}>{previewUrls[item.id] ? <img src={previewUrls[item.id]} alt="" className="aspect-[4/3] w-full object-cover" /> : <div className="grid aspect-[4/3] place-items-center bg-[#F7F4FC]"><Loader2 className="size-4 animate-spin" /></div>}<span className="block truncate px-2.5 py-2 text-xs font-semibold">{item.fields.title.value || item.originalFilename}</span><span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[0.62rem] font-bold">{item.status === "approved" ? "Approved" : index + 1}</span></button>)}</div>
                  <div className="mt-3 grid gap-2"><button type="button" className={secondary} disabled={!driveConfigured || importing} onClick={() => void connectGoogleDrive()}><Cloud className="size-4" />Add from Drive</button>{googleTokenRef.current && <button type="button" className={quiet} onClick={() => void disconnectGoogleDrive()}>Disconnect Drive</button>}<button type="button" className={quiet} disabled={importing} onClick={() => void startFresh()}><RotateCcw className="size-4" />Start fresh</button></div>
                </aside>

                {activeItem && <>
                  <section className="min-h-[420px] bg-[#F4F1F8] p-4 sm:p-6 lg:flex lg:min-h-0 lg:items-center lg:justify-center lg:p-8"><div className="mx-auto w-full max-w-3xl"><div className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_28px_80px_rgba(58,43,92,0.16)]">{previewUrls[activeItem.id] ? <img src={previewUrls[activeItem.id]} alt={activeItem.fields.altText.value || activeItem.fields.title.value || "Imported artwork preview"} className="max-h-[58dvh] w-full object-contain" /> : <div className="grid aspect-[4/3] place-items-center"><Loader2 className="size-4 animate-spin" /></div>}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#746E80]"><div><p className="font-semibold text-[#625C70]">{activeItem.originalFilename}</p><p>{activeItem.mimeType} · {readableBytes(activeItem.byteSize)}{activeItem.width && activeItem.height ? ` · ${activeItem.width} × ${activeItem.height}px` : ""}</p></div><span className="rounded-full border border-[#D8D0F2] bg-white px-3 py-1.5 font-semibold">{activeItem.sourceType === "google_drive_image" ? "Google Drive selection" : "Device upload"}</span></div></div></section>
                  <aside className="border-t border-[#E7E1F7] bg-white p-4 lg:max-h-[calc(100dvh-170px)] lg:overflow-y-auto lg:border-l lg:border-t-0 sm:p-5" aria-label="Artwork record editor">
                    <div className="flex items-start justify-between"><div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#75639E]">Editable artwork record</p><h3 className="mt-1 font-serif text-2xl font-semibold">{activeItem.status === "approved" ? "Approved record" : "Review before saving"}</h3></div>{activeItem.status !== "approved" && <button type="button" className="grid size-10 place-items-center rounded-xl text-[#8A8296] hover:bg-red-50 hover:text-red-700" onClick={() => void removeItem(activeItem)} aria-label={`Remove ${activeItem.fields.title.value || activeItem.originalFilename}`}><Trash2 className="size-4" /></button>}</div>
                    <p className="mt-2 text-xs leading-5 text-[#746E80]">Every value shows whether it was extracted, suggested, edited, or confirmed. Blank fields remain blank rather than being invented.</p>
                    <datalist id="kleio-medium-options">{mediumOptions.map((option) => <option key={option} value={option} />)}</datalist>
                    <div className="mt-5 grid gap-4"><ArtworkField label="Artwork title" field={activeItem.fields.title} disabled={activeItem.status === "approved"} onChange={(value) => replaceItem(updateArtworkField(activeItem, "title", value))} /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"><ArtworkField label="Year" field={activeItem.fields.year} disabled={activeItem.status === "approved"} onChange={(value) => replaceItem(updateArtworkField(activeItem, "year", value))} /><ArtworkField label="Medium" list="kleio-medium-options" field={activeItem.fields.medium} disabled={activeItem.status === "approved"} onChange={(value) => replaceItem(updateArtworkField(activeItem, "medium", value))} /><ArtworkField label="Dimensions" field={activeItem.fields.dimensions} disabled={activeItem.status === "approved"} onChange={(value) => replaceItem(updateArtworkField(activeItem, "dimensions", value))} /><ArtworkField label="Series" field={activeItem.fields.series} disabled={activeItem.status === "approved"} onChange={(value) => replaceItem(updateArtworkField(activeItem, "series", value))} /></div><ArtworkField label="Description" multiline field={activeItem.fields.description} disabled={activeItem.status === "approved"} onChange={(value) => replaceItem(updateArtworkField(activeItem, "description", value))} /><ArtworkField label="Keywords" field={activeItem.fields.tags} disabled={activeItem.status === "approved"} onChange={(value) => replaceItem(updateArtworkField(activeItem, "tags", value))} /><ArtworkField label="Accessibility description" multiline field={activeItem.fields.altText} disabled={activeItem.status === "approved"} onChange={(value) => replaceItem(updateArtworkField(activeItem, "altText", value))} /></div>
                    <div className="mt-6 grid gap-2 border-t border-[#E7E1F7] pt-5">{activeItem.status === "approved" ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800"><Check className="mr-2 inline size-4" />Approved and saved to your portfolio.</p> : <button type="button" className={primary} disabled={approving === activeItem.id || !activeItem.fields.title.value.trim()} onClick={() => void approve(activeItem)}>{approving === activeItem.id ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}Approve and add to Creative Passport</button>}{readyToApprove.length > 1 && <button type="button" className={secondary} disabled={Boolean(approving)} onClick={() => void approveAllReady()}>Approve all {readyToApprove.length} complete records</button>}<p className="text-[0.7rem] leading-5 text-[#8A8296]">Saving the import draft is not approval. Only the approval button creates a portfolio record.</p></div>
                  </aside>
                </>}
              </main>
            )}
          </div>
        </div>
      </dialog>
    </>
  )
}
