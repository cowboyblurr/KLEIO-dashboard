"use client"

/* eslint-disable @next/next/no-img-element -- private media uses short-lived signed URLs */

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, Cloud, FileText, FolderOpen, ImageIcon, Instagram, Library, Loader2, Search, ShieldCheck, Upload, X } from "lucide-react"
import {
  MEDIA_SOURCE_ADAPTERS,
  chooseGoogleDriveFiles,
  downloadGoogleDriveFile,
  loadArtistMediaLibrary,
  mediaImportConfig,
  revokeGoogleDriveAccess,
  uploadMediaToLibrary,
  type ArtistMediaLibraryItem,
  type MediaImportConfig,
  type MediaImportContext,
  type MediaSelectionResult,
  type MediaSourceType,
} from "@/lib/kleio-universal-media"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const sourceCard = "group flex min-h-28 items-start gap-3 rounded-2xl border border-[#E2DCF1] bg-white p-4 text-left transition hover:border-[#B9A9DE] hover:bg-[#FCFAFF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-55"

type QuickMediaImportProps = {
  context: MediaImportContext
  config?: Partial<MediaImportConfig>
  label?: string
  className?: string
  onConfirm: (result: MediaSelectionResult) => Promise<void> | void
  onOpenChange?: (open: boolean) => void
}

function sourceIcon(source: MediaSourceType) {
  if (source === "device") return Upload
  if (source === "google_drive") return Cloud
  if (source === "kleio_library") return Library
  return Instagram
}

function sourceTitle(source: MediaSourceType) {
  if (source === "device") return "Upload from device"
  if (source === "google_drive") return "Choose from Google Drive"
  if (source === "kleio_library") return "Choose from KLEIO Library"
  return "Instagram Professional Account"
}

function readableBytes(bytes: number | null) {
  if (bytes === null) return "Size unavailable"
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function QuickMediaImport({ context, config: configOverrides, label, className = "", onConfirm, onOpenChange }: QuickMediaImportProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const config = useMemo(() => mediaImportConfig(context, configOverrides), [context, configOverrides])
  const [view, setView] = useState<"sources" | "library" | "review">("sources")
  const [library, setLibrary] = useState<ArtistMediaLibraryItem[]>([])
  const [selected, setSelected] = useState<ArtistMediaLibraryItem[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [source, setSource] = useState<MediaSelectionResult["source"]>("kleio_library")

  const accept = config.allowedMimeTypes.join(",")
  const visibleLibrary = library.filter((item) => {
    const query = search.trim().toLowerCase()
    return config.allowedMimeTypes.includes(item.mimeType) && (!query || `${item.title} ${item.originalFilename} ${item.associatedWorkTitle}`.toLowerCase().includes(query))
  })

  function open() {
    setView("sources")
    setSelected([])
    setError("")
    setStatus("")
    dialogRef.current?.showModal()
    onOpenChange?.(true)
    window.setTimeout(() => headingRef.current?.focus(), 0)
    void trackKleioProductEvent("import_started", { surface: "universal_media_quick_import", metadata: { context } })
  }

  function close() {
    dialogRef.current?.close()
    onOpenChange?.(false)
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleClose = () => onOpenChange?.(false)
    dialog.addEventListener("close", handleClose)
    return () => dialog.removeEventListener("close", handleClose)
  }, [onOpenChange])

  function toggle(item: ArtistMediaLibraryItem) {
    setSelected((current) => {
      if (current.some((candidate) => candidate.id === item.id)) return current.filter((candidate) => candidate.id !== item.id)
      if (!config.allowMultiple) return [item]
      if (current.length >= config.maxSelectionCount) return current
      return [...current, item]
    })
  }

  async function loadLibrary() {
    setLoading(true)
    setError("")
    try {
      const items = await loadArtistMediaLibrary({ mimeTypes: config.allowedMimeTypes, limit: 120 })
      setLibrary(items)
      setView("library")
      setSource("kleio_library")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not load your private media library.")
    } finally {
      setLoading(false)
    }
  }

  async function importFiles(files: File[], importSource: "device" | "google_drive", providerFiles?: Array<{ id: string; name: string; mimeType: string }>) {
    if (!files.length) return
    setLoading(true)
    setError("")
    setStatus("")
    const imported: ArtistMediaLibraryItem[] = []
    const errors: string[] = []
    for (let index = 0; index < files.slice(0, config.maxSelectionCount).length; index += 1) {
      const file = files[index]
      try {
        setStatus(`Preparing ${index + 1} of ${Math.min(files.length, config.maxSelectionCount)}: ${file.name}`)
        const result = await uploadMediaToLibrary({
          file,
          source: importSource,
          config,
          providerFileId: providerFiles?.[index]?.id,
          providerMetadata: providerFiles?.[index] ? { provider_name: providerFiles[index].name, provider_mime_type: providerFiles[index].mimeType } : undefined,
        })
        imported.push(result.item)
      } catch (reason) {
        errors.push(reason instanceof Error ? reason.message : `${file.name} could not be imported.`)
      }
    }
    setSelected(config.allowMultiple ? imported : imported.slice(0, 1))
    setSource(importSource)
    setView("review")
    setStatus(imported.length ? `${imported.length} private media item${imported.length === 1 ? "" : "s"} ready for your confirmation.` : "")
    setError(errors.join(" "))
    setLoading(false)
    void trackKleioProductEvent("import_completed", { surface: "universal_media_quick_import", metadata: { context, source: importSource, count: imported.length } })
  }

  async function chooseDrive() {
    setLoading(true)
    setError("")
    let token = ""
    try {
      const selection = await chooseGoogleDriveFiles(config)
      token = selection.accessToken
      if (!selection.files.length) {
        setStatus("No Drive files were selected. Nothing changed.")
        return
      }
      const files: File[] = []
      const accepted: typeof selection.files = []
      for (const providerFile of selection.files) {
        try {
          files.push(await downloadGoogleDriveFile(providerFile, selection.accessToken))
          accepted.push(providerFile)
        } catch (reason) {
          setError((current) => `${current ? `${current} ` : ""}${reason instanceof Error ? reason.message : `${providerFile.name} could not be copied.`}`)
        }
      }
      await importFiles(files, "google_drive", accepted)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Google Drive could not be opened.")
    } finally {
      if (token) await revokeGoogleDriveAccess(token).catch(() => undefined)
      setLoading(false)
    }
  }

  async function confirm() {
    if (!selected.length || loading) return
    setLoading(true)
    setError("")
    try {
      await onConfirm({ items: selected, source })
      void trackKleioProductEvent("proposal_approved", { surface: "universal_media_quick_import", metadata: { context, source, count: selected.length } })
      close()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not complete this media action.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" onClick={open} className={`${secondary} ${className}`}><FolderOpen className="size-4" />{label || config.title}</button>
      <dialog ref={dialogRef} aria-labelledby={`quick-media-${context}-title`} aria-describedby={`quick-media-${context}-description`} className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-white p-0 text-[#292631] shadow-2xl backdrop:bg-[#20182D]/45 backdrop:backdrop-blur-sm sm:inset-auto sm:m-auto sm:h-auto sm:max-h-[min(820px,calc(100dvh-32px))] sm:w-[min(920px,calc(100vw-32px))] sm:rounded-[28px] sm:border sm:border-[#DCD4EF]">
        <div className="flex max-h-full min-h-full flex-col bg-[#FCFBFE] sm:min-h-[620px]">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E7E1F7] bg-white px-4 py-4 sm:px-6">
            <div><p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Private media selection</p><h2 id={`quick-media-${context}-title`} ref={headingRef} tabIndex={-1} className="mt-1 font-serif text-2xl font-semibold outline-none">{config.title}</h2><p id={`quick-media-${context}-description`} className="mt-1 max-w-2xl text-xs leading-5 text-[#746E80]">{config.description}</p></div>
            <button type="button" onClick={close} className="grid size-11 place-items-center rounded-xl border border-[#E2DCF1] bg-white" aria-label="Close media picker"><X className="size-5" /></button>
          </header>

          {(error || status) && <div className={`shrink-0 border-b px-4 py-3 text-sm sm:px-6 ${error ? "border-red-200 bg-red-50 text-red-700" : "border-[#E7E1F7] bg-[#F9F7FC] text-[#625C70]"}`} role={error ? "alert" : "status"}>{error || status}</div>}

          <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {view === "sources" && <div className="grid gap-4 sm:grid-cols-2">
              {MEDIA_SOURCE_ADAPTERS.filter((adapter) => config.availableSources.includes(adapter.type)).map((adapter) => {
                const Icon = sourceIcon(adapter.type)
                const available = adapter.isAvailable(config)
                return <button key={adapter.type} type="button" disabled={!available || loading} className={sourceCard} onClick={() => {
                  if (adapter.type === "device") fileInputRef.current?.click()
                  else if (adapter.type === "google_drive") void chooseDrive()
                  else if (adapter.type === "kleio_library") void loadLibrary()
                }}><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F0EAFB] text-[#5B4B8A]"><Icon className="size-5" /></span><span><span className="block text-sm font-semibold text-[#292631]">{sourceTitle(adapter.type)}</span><span className="mt-1 block text-xs leading-5 text-[#746E80]">{adapter.getPermissionExplanation(config)}</span>{!available && adapter.type === "instagram" && <span className="mt-2 inline-flex rounded-full bg-[#F7F4FF] px-2 py-1 text-[0.65rem] font-semibold text-[#75639E]">Planned after beta</span>}</span></button>
              })}
              <input ref={fileInputRef} type="file" multiple={config.allowMultiple} accept={accept} className="sr-only" onChange={(event) => void importFiles(Array.from(event.target.files ?? []), "device")} />
              <div className="sm:col-span-2 rounded-2xl border border-[#E7E1F7] bg-white p-4 text-xs leading-5 text-[#746E80]"><ShieldCheck className="mr-2 inline size-4 text-[#5B4B8A]" />Selecting or uploading media does not attach, publish, or replace anything. The destination action happens only after confirmation.</div>
            </div>}

            {view === "library" && <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="relative block flex-1"><span className="sr-only">Search private media library</span><Search className="pointer-events-none absolute left-3 top-3 size-4 text-[#8A8296]" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search artwork or filename" className="h-11 w-full rounded-xl border border-[#DED7EF] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12" /></label><button type="button" className={secondary} onClick={() => setView("sources")}>Change source</button></div>
              {loading ? <p className="mt-8 flex items-center justify-center gap-2 text-sm text-[#746E80]"><Loader2 className="size-4 animate-spin" />Loading your private library…</p> : visibleLibrary.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visibleLibrary.map((item) => {
                const active = selected.some((candidate) => candidate.id === item.id)
                return <button key={item.id} type="button" aria-pressed={active} onClick={() => toggle(item)} className={`overflow-hidden rounded-2xl border bg-white text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 ${active ? "border-[#8C78BF] ring-2 ring-[#A997E8]/20" : "border-[#E7E1F7]"}`}><div className="relative grid aspect-[4/3] place-items-center bg-[#F4F1F8]">{item.previewUrl ? <img src={item.previewUrl} alt="" className="size-full object-cover" loading="lazy" /> : item.mediaKind === "document" ? <FileText className="size-8 text-[#75639E]" /> : <ImageIcon className="size-8 text-[#75639E]" />}{active && <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-[#5B4B8A] text-white"><Check className="size-4" /></span>}</div><div className="p-3"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-1 truncate text-xs text-[#8A8296]">{item.associatedWorkTitle || item.originalFilename}</p><p className="mt-1 text-[0.68rem] font-semibold text-[#75639E]">{item.approvalState === "approved" ? "Approved work" : "Private media"} · {readableBytes(item.byteSize)}</p></div></button>
              })}</div> : <div className="mt-8 rounded-2xl border border-dashed border-[#D8D0F2] bg-white p-8 text-center"><Library className="mx-auto size-8 text-[#75639E]" /><h3 className="mt-3 font-serif text-xl font-semibold">No matching media yet</h3><p className="mt-2 text-sm text-[#746E80]">Choose another source to add a private file without leaving this task.</p><button type="button" className={`${secondary} mt-4`} onClick={() => setView("sources")}>Choose another source</button></div>}
            </div>}

            {view === "review" && <div><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#75639E]">Ready to use</p><h3 className="mt-1 font-serif text-2xl font-semibold">Review your selection</h3></div><button type="button" className={secondary} onClick={() => setView("sources")}>Add or change</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selected.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-[#E7E1F7] bg-white"><div className="grid aspect-[4/3] place-items-center bg-[#F4F1F8]">{item.previewUrl ? <img src={item.previewUrl} alt="" className="size-full object-cover" /> : item.mediaKind === "document" ? <FileText className="size-8 text-[#75639E]" /> : <ImageIcon className="size-8 text-[#75639E]" />}</div><div className="p-3"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-1 truncate text-xs text-[#8A8296]">{item.originalFilename}</p></div></article>)}</div></div>}
          </main>

          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#E7E1F7] bg-white px-4 py-4 sm:px-6"><p className="text-xs text-[#746E80]">{selected.length ? `${selected.length} selected · nothing has changed yet` : "Choose media to continue"}</p><div className="flex gap-2"><button type="button" className={secondary} onClick={close}>Cancel</button><button type="button" className={primary} disabled={!selected.length || loading} onClick={() => void confirm()}>{loading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}{config.completionAction}</button></div></footer>
        </div>
      </dialog>
    </>
  )
}
