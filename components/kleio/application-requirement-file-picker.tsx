"use client"

/* eslint-disable @next/next/no-img-element -- private signed Supabase previews are short-lived */

import { useMemo, useRef, useState } from "react"
import { Check, FileText, FolderOpen, ImageIcon, Loader2, Search, ShieldCheck, UploadCloud, X } from "lucide-react"
import {
  loadRequirementFileLibrary,
  uploadRequirementFile,
} from "@/lib/kleio-requirement-file-upload"
import type { ArtistMediaLibraryItem } from "@/lib/kleio-universal-media"

type Props = {
  label: string
  requirementLabel: string
  description: string
  allowedMimeTypes: string[]
  sourceAcceptedTypes: string[]
  maximumFileSizeBytes: number
  maximumSelectionCount: number
  allowMultiple: boolean
  onConfirm: (items: ArtistMediaLibraryItem[]) => Promise<void> | void
}

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"

function sourceExtensionAccepts(filename: string, accepted: string[]) {
  const extension = filename.toLowerCase().split(".").pop()?.replace(/[^a-z0-9]+/g, "") || ""
  const statedExtensions = accepted
    .map((value) => value.trim().toLowerCase().replace(/^\./, ""))
    .filter((value) => value && !value.includes("/"))
  if (!statedExtensions.length) return true
  if (statedExtensions.includes(extension)) return true
  if (["jpg", "jpeg"].includes(extension) && statedExtensions.some((value) => ["jpg", "jpeg"].includes(value))) return true
  return false
}

export function ApplicationRequirementFilePicker(props: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [library, setLibrary] = useState<ArtistMediaLibraryItem[]>([])
  const [selected, setSelected] = useState<ArtistMediaLibraryItem[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")

  const visibleLibrary = useMemo(() => {
    const query = search.trim().toLowerCase()
    return library.filter((item) => !query || `${item.title} ${item.originalFilename}`.toLowerCase().includes(query))
  }, [library, search])

  async function refreshLibrary() {
    const next = await loadRequirementFileLibrary(props.allowedMimeTypes)
    setLibrary(next)
    return next
  }

  async function open() {
    setSelected([])
    setSearch("")
    setError("")
    setStatus("")
    dialogRef.current?.showModal()
    setLoading(true)
    try {
      await refreshLibrary()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not load your private files.")
    } finally {
      setLoading(false)
    }
  }

  function close() {
    dialogRef.current?.close()
  }

  function toggle(item: ArtistMediaLibraryItem) {
    if (!sourceExtensionAccepts(item.originalFilename, props.sourceAcceptedTypes)) {
      setError(`${item.originalFilename} does not use one of the file extensions stated by this opportunity.`)
      return
    }
    setError("")
    setSelected((current) => {
      if (current.some((candidate) => candidate.id === item.id)) return current.filter((candidate) => candidate.id !== item.id)
      if (!props.allowMultiple) return [item]
      if (current.length >= props.maximumSelectionCount) return current
      return [...current, item]
    })
  }

  async function upload(files: FileList | null) {
    const chosen = Array.from(files ?? []).slice(0, props.maximumSelectionCount)
    if (!chosen.length || loading) return
    const invalidExtension = chosen.find((file) => !sourceExtensionAccepts(file.name, props.sourceAcceptedTypes))
    if (invalidExtension) {
      setError(`${invalidExtension.name} does not use one of the file extensions stated by this opportunity.`)
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }
    setLoading(true)
    setError("")
    setStatus("")
    try {
      const uploaded: ArtistMediaLibraryItem[] = []
      for (const file of chosen) {
        const result = await uploadRequirementFile({
          file,
          allowedMimeTypes: props.allowedMimeTypes,
          maximumFileSizeBytes: props.maximumFileSizeBytes,
          sourceAcceptedTypes: props.sourceAcceptedTypes,
        })
        uploaded.push(result.item)
      }
      await refreshLibrary()
      setSelected(uploaded.slice(0, props.maximumSelectionCount))
      setStatus(`${uploaded.length} private file${uploaded.length === 1 ? " is" : "s are"} selected. Confirm below to attach ${uploaded.length === 1 ? "it" : "them"} to this requirement.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not upload the selected requirement file.")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
      setLoading(false)
    }
  }

  async function confirm() {
    if (!selected.length || loading) return
    setLoading(true)
    setError("")
    try {
      await props.onConfirm(selected)
      close()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not attach the selected file.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" onClick={() => void open()} className={secondary}><FolderOpen className="size-4" />{props.label}</button>
      <dialog ref={dialogRef} aria-labelledby="application-requirement-file-picker-title" className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-white p-0 text-[#292631] shadow-2xl backdrop:bg-[#20182D]/45 backdrop:backdrop-blur-sm sm:inset-auto sm:m-auto sm:h-auto sm:max-h-[min(820px,calc(100dvh-32px))] sm:w-[min(900px,calc(100vw-32px))] sm:rounded-[28px] sm:border sm:border-[#DCD4EF]">
        <div className="flex max-h-full min-h-full flex-col bg-[#FCFBFE] sm:min-h-[600px]">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E7E1F7] bg-white px-4 py-4 sm:px-6">
            <div>
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Private application file</p>
              <h2 id="application-requirement-file-picker-title" className="mt-1 font-serif text-2xl font-semibold">{props.requirementLabel}</h2>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-[#746E80]">{props.description}</p>
            </div>
            <button type="button" onClick={close} className="grid size-11 place-items-center rounded-xl border border-[#E2DCF1] bg-white" aria-label="Close requirement file picker"><X className="size-5" /></button>
          </header>

          {(error || status) && <div role={error ? "alert" : "status"} aria-live="polite" className={`shrink-0 border-b px-4 py-3 text-sm sm:px-6 ${error ? "border-red-200 bg-red-50 text-red-700" : "border-[#E7E1F7] bg-[#F9F7FC] text-[#625C70]"}`}>{error || status}</div>}

          <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative block flex-1"><span className="sr-only">Search private requirement files</span><Search className="pointer-events-none absolute left-3 top-3 size-4 text-[#8A8296]" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search private files" className="h-11 w-full rounded-xl border border-[#DED7EF] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12" /></label>
              <button type="button" className={secondary} onClick={() => fileInputRef.current?.click()} disabled={loading}><UploadCloud className="size-4" />Upload from device</button>
              <input ref={fileInputRef} type="file" className="sr-only" accept={props.allowedMimeTypes.join(",")} multiple={props.allowMultiple} onChange={(event) => void upload(event.target.files)} />
            </div>

            {loading ? <p className="mt-8 flex items-center justify-center gap-2 text-sm text-[#746E80]"><Loader2 className="size-4 animate-spin" />Working with your private files…</p> : visibleLibrary.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visibleLibrary.map((item) => {
              const active = selected.some((candidate) => candidate.id === item.id)
              return <button key={item.id} type="button" aria-pressed={active} onClick={() => toggle(item)} className={`overflow-hidden rounded-2xl border bg-white text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 ${active ? "border-[#8C78BF] ring-2 ring-[#A997E8]/20" : "border-[#E7E1F7]"}`}><div className="relative grid aspect-[4/3] place-items-center bg-[#F4F1F8]">{item.previewUrl ? <img src={item.previewUrl} alt="" className="size-full object-cover" /> : item.mediaKind === "image" ? <ImageIcon className="size-8 text-[#75639E]" /> : <FileText className="size-8 text-[#75639E]" />}{active && <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-[#5B4B8A] text-white"><Check className="size-4" /></span>}</div><div className="p-3"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-1 truncate text-xs text-[#746E80]">{item.originalFilename}</p></div></button>
            })}</div> : <div className="mt-8 rounded-2xl border border-dashed border-[#D8D0F2] bg-white p-8 text-center"><FileText className="mx-auto size-8 text-[#75639E]" /><p className="mt-3 text-sm font-semibold">No matching private file yet</p><p className="mt-1 text-xs leading-5 text-[#746E80]">Upload the required file from this device. It stays private until you confirm this requirement.</p></div>}

            <div className="mt-5 rounded-2xl border border-[#E7E1F7] bg-white p-4 text-xs leading-5 text-[#746E80]"><ShieldCheck className="mr-2 inline size-4 text-[#5B4B8A]" />Choosing or uploading a file does not submit it to the institution. KLEIO attaches it only after your confirmation.</div>
          </main>

          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#E7E1F7] bg-white px-4 py-4 sm:px-6"><button type="button" className={secondary} onClick={close}>Cancel</button><span className="text-xs font-semibold text-[#746E80]">{selected.length} of {props.maximumSelectionCount} selected</span><button type="button" className={primary} disabled={!selected.length || loading} onClick={() => void confirm()}>{loading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Attach selected</button></footer>
        </div>
      </dialog>
    </>
  )
}
