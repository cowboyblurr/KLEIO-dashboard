"use client"

/* eslint-disable @next/next/no-img-element -- private media uses short-lived signed URLs */

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AudioLines, FileSearch, FileText, ImageIcon, Library, Loader2, Search, ShieldCheck, Trash2, Video } from "lucide-react"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { QuickMediaImport } from "@/components/kleio/media-import/quick-media-import"
import {
  archiveMediaLibraryItem,
  loadArtistMediaLibrary,
  type ArtistMediaLibraryItem,
  type MediaKind,
} from "@/lib/kleio-universal-media"
import { readMediaImportReceipt, type KleioMediaImportReceipt } from "@/lib/kleio-import-receipt"
import { requestMediaExtraction } from "@/lib/kleio-upload-to-passport"

const filterButton = "rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"

function receiptMessage(receipt: KleioMediaImportReceipt) {
  const parts: string[] = []
  if (receipt.addedCount > 0) parts.push(`${receipt.addedCount} item${receipt.addedCount === 1 ? "" : "s"} added to your Media Library.`)
  else parts.push("No new items were added.")
  if (receipt.duplicateCount > 0) parts.push(`${receipt.duplicateCount} selected file${receipt.duplicateCount === 1 ? " was" : "s were"} already in your library.`)
  if (receipt.failedCount > 0) parts.push(`${receipt.failedCount} file${receipt.failedCount === 1 ? "" : "s"} could not be imported.`)
  return parts.join(" ")
}

function MediaPreview({ item }: { item: ArtistMediaLibraryItem }) {
  if (item.mediaKind === "image" && item.previewUrl) return <img src={item.previewUrl} alt="" className="size-full object-cover transition duration-500 group-hover:scale-[1.02]" loading="lazy" />
  if (item.mediaKind === "video" && item.previewUrl) return <video src={item.previewUrl} controls preload="metadata" className="size-full object-contain" aria-label={`${item.title} video`} />
  if (item.mediaKind === "audio" && item.previewUrl) return <div className="flex w-full flex-col items-center gap-3 px-4"><AudioLines className="size-9 text-[#75639E]" /><audio src={item.previewUrl} controls preload="metadata" className="w-full" aria-label={`${item.title} audio`} /></div>
  if (item.mediaKind === "video") return <Video className="size-9 text-[#75639E]" />
  if (item.mediaKind === "audio") return <AudioLines className="size-9 text-[#75639E]" />
  if (item.mediaKind === "document") return <FileText className="size-9 text-[#75639E]" />
  return <ImageIcon className="size-9 text-[#75639E]" />
}

export function ArtistMediaLibrary() {
  const [items, setItems] = useState<ArtistMediaLibraryItem[]>([])
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | MediaKind | "approved" | "unattached">("all")
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const refresh = useCallback(async () => {
    const next = await loadArtistMediaLibrary({ limit: 200 })
    setItems(next)
    return next
  }, [])

  useEffect(() => {
    let active = true
    void refresh()
      .then(() => {
        if (!active) return
        const receipt = readMediaImportReceipt()
        if (receipt) setMessage(receiptMessage(receipt))
      })
      .catch((reason: Error) => { if (active) setError(reason.message) })
      .finally(() => { if (active) setLoading(false) })

    const onImport = (event: Event) => {
      const receipt = (event as CustomEvent<KleioMediaImportReceipt>).detail
      void refresh().then(() => setMessage(receiptMessage(receipt))).catch((reason: Error) => setError(reason.message))
    }
    window.addEventListener("kleio:media-import-completed", onImport)
    return () => {
      active = false
      window.removeEventListener("kleio:media-import-completed", onImport)
    }
  }, [refresh])

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase()
    return items.filter((item) => {
      const matchesSearch = !search || `${item.title} ${item.originalFilename} ${item.associatedWorkTitle}`.toLowerCase().includes(search)
      const matchesFilter = filter === "all"
        ? true
        : filter === "approved"
          ? item.approvalState === "approved"
          : filter === "unattached"
            ? item.usageCount === 0 && !item.associatedWorkId
            : item.mediaKind === filter
      return matchesSearch && matchesFilter
    })
  }, [filter, items, query])

  async function archive(item: ArtistMediaLibraryItem) {
    if (!window.confirm(`Archive ${item.title}? It will remain unavailable until a future restore action.`)) return
    setError("")
    setMessage("")
    try {
      await archiveMediaLibraryItem(item)
      setItems((current) => current.filter((candidate) => candidate.id !== item.id))
      setMessage("The unused private media item was archived.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The media item could not be archived.")
    }
  }

  async function analyze(item: ArtistMediaLibraryItem) {
    if (item.mimeType !== "application/pdf") return
    setActiveId(item.id)
    setError("")
    setMessage("")
    try {
      const result = await requestMediaExtraction(item)
      setMessage(result.warnings.includes("ocr_required")
        ? "The PDF is private, but it needs OCR or manual classification before its contents can become Passport updates."
        : `${result.proposalCount} reviewable Passport update${result.proposalCount === 1 ? "" : "s"} prepared.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not analyze this private PDF.")
    } finally {
      setActiveId("")
    }
  }

  return (
    <main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1240px] space-y-5">
        <WorkspacePageHeader eyebrow="Artist workspace" title="Media Library" description="Keep private images, video, audio, and supporting documents in one reusable place for your Portfolio, Creative Passport, and applications." />

        <section className="rounded-[26px] border border-[#E2DCF1] bg-[linear-gradient(135deg,#F8F5FF,#FFFFFF)] p-5 shadow-[0_18px_52px_rgba(82,64,130,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Private reusable sources</p>
              <h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.03em]">One private library for the material you bring into KLEIO</h2>
              <p className="mt-2 text-sm leading-6 text-[#746E80]">Upload common images, video, audio, and documents from your device. Files remain private until you explicitly reuse them. PDF analysis is an optional separate workflow—not the definition of what KLEIO can store.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <QuickMediaImport context="existing_media_library" label="Upload media" onConfirm={async () => { await refresh(); setMessage("Your private media is available in the library.") }} />
              <Link href="/artist-dashboard/import/" className={secondary}><FileSearch className="size-4" />Import & analyze</Link>
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-[#6A5896]"><ShieldCheck className="mr-1.5 inline size-3.5" />Institutions cannot browse this library, extraction jobs, rejected proposals, or unconfirmed interpretations. They see only material you explicitly authorize.</p>
        </section>

        {(error || message) && <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`} role={error ? "alert" : "status"} aria-live="polite">{error || message}</div>}

        <section className="rounded-[22px] border border-[#E7E1F7] bg-white p-4 shadow-[0_14px_42px_rgba(82,64,130,0.05)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block flex-1 lg:max-w-md"><span className="sr-only">Search private media</span><Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-[#8A8296]" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search artwork, media, filename, or document" className="h-11 w-full rounded-xl border border-[#DED7EF] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12" /></label>
            <div className="flex flex-wrap gap-2" aria-label="Media filters">{(["all","image","video","audio","document","approved","unattached"] as const).map((value) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`${filterButton} ${filter === value ? "border-[#A997E8] bg-[#F1ECFB] text-[#5B4B8A]" : "border-[#E7E1F7] bg-white text-[#746E80]"}`}>{value === "all" ? "All media" : value === "image" ? "Images" : value === "video" ? "Video" : value === "audio" ? "Audio" : value === "document" ? "Documents" : value === "approved" ? "In portfolio" : "Unattached"}</button>)}</div>
          </div>
        </section>

        {loading ? <div className="flex items-center justify-center rounded-[22px] border border-[#E7E1F7] bg-white p-10 text-sm text-[#746E80]"><Loader2 className="mr-2 size-4 animate-spin" />Loading your private media library…</div> : visible.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visible.map((item) => <article key={item.id} className="group overflow-hidden rounded-[22px] border border-[#E7E1F7] bg-white shadow-[0_14px_38px_rgba(82,64,130,0.05)]">
          <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-[#F4F1F8]"><MediaPreview item={item} /><span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[0.65rem] font-semibold text-[#5B4B8A]">{item.approvalState === "approved" ? "In portfolio" : "Private source"}</span><span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-[0.62rem] font-semibold capitalize text-[#625C70]">{item.mediaKind}</span></div>
          <div className="p-4"><h3 className="truncate font-serif text-lg font-semibold">{item.title}</h3><p className="mt-1 truncate text-xs text-[#746E80]">{item.originalFilename}</p><dl className="mt-3 grid grid-cols-2 gap-2 text-[0.68rem]"><div><dt className="font-semibold uppercase tracking-wide text-[#8A8296]">Source</dt><dd className="mt-0.5 truncate text-[#625C70]">{item.sourceType.replaceAll("_", " ")}</dd></div><div><dt className="font-semibold uppercase tracking-wide text-[#8A8296]">Uses</dt><dd className="mt-0.5 text-[#625C70]">{Math.max(item.usageCount, item.associatedWorkId ? 1 : 0)}</dd></div></dl>{item.associatedWorkTitle && <p className="mt-3 rounded-lg bg-[#F7F4FF] px-2.5 py-2 text-xs font-semibold text-[#5B4B8A]">Artwork: {item.associatedWorkTitle}</p>}<div className="mt-3 flex items-center justify-between gap-2"><span className="text-[0.68rem] text-[#8A8296]">Added {new Date(item.createdAt).toLocaleDateString()}</span><span className="flex items-center gap-1">{item.mimeType === "application/pdf" && item.sourceId && <button type="button" onClick={() => void analyze(item)} disabled={Boolean(activeId)} className="grid size-9 place-items-center rounded-lg text-[#6A5896] hover:bg-[#F7F4FF] disabled:opacity-50" aria-label={`Analyze ${item.title} PDF for Passport updates`}>{activeId === item.id ? <Loader2 className="size-4 animate-spin" /> : <FileSearch className="size-4" />}</button>}{item.usageCount === 0 && !item.associatedWorkId && <button type="button" onClick={() => void archive(item)} className="grid size-9 place-items-center rounded-lg text-[#8A8296] hover:bg-red-50 hover:text-red-700" aria-label={`Archive ${item.title}`}><Trash2 className="size-4" /></button>}</span></div></div>
        </article>)}</div> : <div className="grid place-items-center rounded-[22px] border border-dashed border-[#D8D0F2] bg-white p-12 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><Library className="size-6" /></span><h2 className="mt-4 font-serif text-2xl font-semibold">No matching media</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#746E80]">Choose another filter or use Upload media above. KLEIO preserves every private source and waits for your approval before reusing it.</p></div>}
      </div>
    </main>
  )
}
