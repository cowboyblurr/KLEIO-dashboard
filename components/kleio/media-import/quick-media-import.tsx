"use client"

/* eslint-disable @next/next/no-img-element -- private media uses short-lived signed URLs */

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, FileText, FolderOpen, ImageIcon, Library, Loader2, Search, ShieldCheck, UploadCloud, X } from "lucide-react"
import {
  loadArtistMediaLibrary,
  mediaImportConfig,
  uploadMediaToLibrary,
  type ArtistMediaLibraryItem,
  type MediaImportConfig,
  type MediaImportContext,
  type MediaSelectionResult,
} from "@/lib/kleio-universal-media"
import { loadBetaImportAvailability, type KleioBetaImportAvailability } from "@/lib/kleio-import-source-availability"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"

type QuickMediaImportProps = {
  context: MediaImportContext
  config?: Partial<MediaImportConfig>
  label?: string
  className?: string
  onConfirm: (result: MediaSelectionResult) => Promise<void> | void
  onOpenChange?: (open: boolean) => void
}

export function QuickMediaImport({ context, config: configOverrides, label, className = "", onConfirm, onOpenChange }: QuickMediaImportProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const config = useMemo(() => mediaImportConfig(context, configOverrides), [context, configOverrides])
  const [availability, setAvailability] = useState<KleioBetaImportAvailability | null>(null)
  const [library, setLibrary] = useState<ArtistMediaLibraryItem[]>([])
  const [selected, setSelected] = useState<ArtistMediaLibraryItem[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")

  const libraryEnabled = availability?.existing_kleio_media !== false && config.availableSources.includes("kleio_library")
  const deviceEnabledForMimeType = (mimeType: string) => {
    if (!config.availableSources.includes("device")) return false
    if (mimeType === "application/pdf") return availability?.device_document !== false
    if (mimeType.startsWith("image/")) return availability?.device_image !== false
    return false
  }
  const deviceEnabled = config.allowedMimeTypes.some(deviceEnabledForMimeType)
  const visibleLibrary = library.filter((item) => {
    const query = search.trim().toLowerCase()
    return config.allowedMimeTypes.includes(item.mimeType)
      && (!query || `${item.title} ${item.originalFilename} ${item.associatedWorkTitle}`.toLowerCase().includes(query))
  })

  useEffect(() => {
    void loadBetaImportAvailability().then(setAvailability).catch(() => setAvailability(null))
  }, [])

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

  async function refreshLibrary() {
    if (!libraryEnabled) {
      setLibrary([])
      return []
    }
    const nextLibrary = await loadArtistMediaLibrary({ mimeTypes: config.allowedMimeTypes, limit: 120 })
    setLibrary(nextLibrary)
    return nextLibrary
  }

  async function open() {
    setSelected([])
    setSearch("")
    setError("")
    setStatus("")
    dialogRef.current?.showModal()
    onOpenChange?.(true)
    window.setTimeout(() => headingRef.current?.focus(), 0)
    void trackKleioProductEvent("import_started", {
      surface: "universal_media_quick_import",
      metadata: { mode: deviceEnabled ? "device_or_private_library" : "reuse_private_library", source: deviceEnabled ? "device" : "kleio_library" },
    })

    if (!libraryEnabled) return

    setLoading(true)
    try {
      await refreshLibrary()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not load your private media library.")
    } finally {
      setLoading(false)
    }
  }

  function toggle(item: ArtistMediaLibraryItem) {
    setSelected((current) => {
      if (current.some((candidate) => candidate.id === item.id)) return current.filter((candidate) => candidate.id !== item.id)
      if (!config.allowMultiple) return [item]
      if (current.length >= config.maxSelectionCount) return current
      return [...current, item]
    })
  }

  async function uploadFromDevice(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])
    if (!files.length || loading) return

    setError("")
    setStatus("")

    const accepted = files.slice(0, config.maxSelectionCount)
    const unavailable = accepted.find((file) => !deviceEnabledForMimeType(file.type))
    if (unavailable) {
      setError(`${unavailable.name} is not an available file type for this step. Choose ${config.allowedMimeTypes.join(", ")}.`)
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    setLoading(true)
    try {
      const uploaded: ArtistMediaLibraryItem[] = []
      for (const file of accepted) {
        const result = await uploadMediaToLibrary({ file, source: "device", config })
        uploaded.push(result.item)
      }

      await refreshLibrary()
      setSelected(uploaded.slice(0, config.maxSelectionCount))
      setStatus(`${uploaded.length} file${uploaded.length === 1 ? " was" : "s were"} added privately and selected. Review ${uploaded.length === 1 ? "it" : "them"} below, then confirm.`)
      void trackKleioProductEvent("media_upload_completed", {
        surface: "universal_media_quick_import",
        metadata: { source: "device", count: uploaded.length, mode: context },
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not upload the selected media.")
    } finally {
      if (inputRef.current) inputRef.current.value = ""
      setLoading(false)
    }
  }

  async function confirm() {
    if (!selected.length || loading) return
    setLoading(true)
    setError("")
    try {
      await onConfirm({ items: selected, source: "kleio_library" })
      void trackKleioProductEvent("proposal_approved", {
        surface: "universal_media_quick_import",
        metadata: { source: "kleio_library", count: selected.length, mode: context },
      })
      close()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not complete this private media action.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" onClick={() => void open()} className={`${secondary} ${className}`}>
        <FolderOpen className="size-4" />{label || config.title}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`quick-media-${context}-title`}
        aria-describedby={`quick-media-${context}-description`}
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-white p-0 text-[#292631] shadow-2xl backdrop:bg-[#20182D]/45 backdrop:backdrop-blur-sm sm:inset-auto sm:m-auto sm:h-auto sm:max-h-[min(820px,calc(100dvh-32px))] sm:w-[min(920px,calc(100vw-32px))] sm:rounded-[28px] sm:border sm:border-[#DCD4EF]"
      >
        <div className="flex max-h-full min-h-full flex-col bg-[#FCFBFE] sm:min-h-[620px]">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E7E1F7] bg-white px-4 py-4 sm:px-6">
            <div>
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Add private media</p>
              <h2 id={`quick-media-${context}-title`} ref={headingRef} tabIndex={-1} className="mt-1 font-serif text-2xl font-semibold outline-none">{config.title}</h2>
              <p id={`quick-media-${context}-description`} className="mt-1 max-w-2xl text-xs leading-5 text-[#746E80]">
                {deviceEnabled ? "Upload from this device or reuse material already stored in your private KLEIO Library. Nothing is attached until you confirm." : "Reuse material already stored in your private KLEIO Library. Nothing is attached until you confirm."}
              </p>
            </div>
            <button type="button" onClick={close} className="grid size-11 place-items-center rounded-xl border border-[#E2DCF1] bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20" aria-label="Close media picker"><X className="size-5" /></button>
          </header>

          {(error || status) && <div className={`shrink-0 border-b px-4 py-3 text-sm sm:px-6 ${error ? "border-red-200 bg-red-50 text-red-700" : "border-[#E7E1F7] bg-[#F9F7FC] text-[#625C70]"}`} role={error ? "alert" : "status"} aria-live="polite">{error || status}</div>}

          <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative block flex-1">
                <span className="sr-only">Search private media library</span>
                <Search className="pointer-events-none absolute left-3 top-3 size-4 text-[#8A8296]" />
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search private media" className="h-11 w-full rounded-xl border border-[#DED7EF] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12" />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {deviceEnabled && (
                  <>
                    <button type="button" className={secondary} onClick={() => inputRef.current?.click()} disabled={loading}>
                      <UploadCloud className="size-4" />Upload from device
                    </button>
                    <input
                      ref={inputRef}
                      className="sr-only"
                      type="file"
                      accept={config.allowedMimeTypes.join(",")}
                      multiple={config.allowMultiple}
                      onChange={(event) => void uploadFromDevice(event.target.files)}
                    />
                  </>
                )}
                <span className="text-xs font-semibold text-[#746E80]">{selected.length} of {config.maxSelectionCount} selected</span>
              </div>
            </div>

            {loading ? <p className="mt-8 flex items-center justify-center gap-2 text-sm text-[#746E80]"><Loader2 className="size-4 animate-spin" />Working with your private media…</p> : visibleLibrary.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visibleLibrary.map((item) => {
              const active = selected.some((candidate) => candidate.id === item.id)
              return (
                <button key={item.id} type="button" aria-pressed={active} onClick={() => toggle(item)} className={`overflow-hidden rounded-2xl border bg-white text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 ${active ? "border-[#8C78BF] ring-2 ring-[#A997E8]/20" : "border-[#E7E1F7]"}`}>
                  <div className="relative grid aspect-[4/3] place-items-center bg-[#F4F1F8]">
                    {item.previewUrl ? <img src={item.previewUrl} alt="" className="size-full object-cover" loading="lazy" /> : item.mediaKind === "document" ? <FileText className="size-8 text-[#75639E]" /> : <ImageIcon className="size-8 text-[#75639E]" />}
                    {active && <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-[#5B4B8A] text-white"><Check className="size-4" /></span>}
                  </div>
                  <div className="p-3"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-1 truncate text-xs text-[#746E80]">{item.originalFilename}</p></div>
                </button>
              )
            })}</div> : <div className="mt-8 grid place-items-center rounded-2xl border border-dashed border-[#D8D0F2] bg-white p-8 text-center"><Library className="size-8 text-[#75639E]" /><p className="mt-3 text-sm font-semibold">No matching private media yet</p><p className="mt-1 max-w-sm text-xs leading-5 text-[#746E80]">{deviceEnabled ? "Upload from this device to begin, or change your search." : "Add material through the appropriate KLEIO upload workspace, then return here to reuse it."}</p></div>}

            <div className="mt-5 rounded-2xl border border-[#E7E1F7] bg-white p-4 text-xs leading-5 text-[#746E80]"><ShieldCheck className="mr-2 inline size-4 text-[#5B4B8A]" />Uploaded media stays private. Selecting a file does not publish, replace, or attach it until you confirm the destination action.</div>
          </main>

          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#E7E1F7] bg-white px-4 py-4 sm:px-6">
            <button type="button" className={secondary} onClick={close}>Cancel</button>
            <button type="button" className={primary} disabled={!selected.length || loading} onClick={() => void confirm()}>{loading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Confirm selected media</button>
          </footer>
        </div>
      </dialog>
    </>
  )
}
