"use client"

/* eslint-disable @next/next/no-img-element -- private media uses short-lived signed URLs */

import { useCallback, useEffect, useMemo, useState } from "react"
import { AudioLines, Check, FileSearch, FileText, ImageIcon, Layers3, Library, Loader2, Search, ShieldCheck, Video, X } from "lucide-react"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { QuickMediaImport } from "@/components/kleio/media-import/quick-media-import"
import { MediaIntelligenceSheet } from "@/components/kleio/media-intelligence-sheet"
import { MediaCollectionIntelligenceSheet } from "@/components/kleio/media-collection-intelligence-sheet"
import { MediaManagementMenu } from "@/components/kleio/media-management-menu"
import { loadArtistMediaLibrary, type ArtistMediaLibraryItem, type MediaKind } from "@/lib/kleio-universal-media"
import { readMediaImportReceipt, type KleioMediaImportReceipt } from "@/lib/kleio-import-receipt"
import { signPrivateMediaPreview } from "@/lib/kleio-device-media-upload"
import { canAnalyzeMediaItem, loadMediaIntelligenceStatuses, type MediaIntelligenceStatus } from "@/lib/kleio-media-intelligence"
import { loadMediaCollectionInsights, type MediaCollectionInsight } from "@/lib/kleio-media-collection-intelligence"

const filterButton = "rounded-full border border-[#E7E1F7] bg-white px-3 py-1.5 text-xs font-semibold text-[#746E80] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3 py-2 text-xs font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:opacity-50"
const primary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:opacity-50"

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
  if (item.mediaKind === "video" && item.previewUrl) return <video src={item.previewUrl} muted playsInline preload="metadata" className="size-full object-cover" aria-label={`${item.title} video preview`} />
  if (item.mediaKind === "audio" && item.previewUrl) return <div className="flex w-full flex-col items-center gap-3 px-4"><AudioLines className="size-9 text-[#75639E]" /><audio src={item.previewUrl} controls preload="metadata" className="w-full" aria-label={`${item.title} audio`} /></div>
  if (item.mediaKind === "video") return <Video className="size-9 text-[#75639E]" />
  if (item.mediaKind === "audio") return <AudioLines className="size-9 text-[#75639E]" />
  if (item.mediaKind === "document") return <FileText className="size-9 text-[#75639E]" />
  return <ImageIcon className="size-9 text-[#75639E]" />
}

function analysisLabel(status: MediaIntelligenceStatus | undefined) {
  if (status === "ready") return "Analysis ready · Open Media Assist"
  if (status === "failed") return "Retry Media Assist"
  if (status === "available") return "Run Media Assist"
  return ""
}

export function ArtistMediaLibrary() {
  const [items, setItems] = useState<ArtistMediaLibraryItem[]>([])
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | MediaKind | "approved" | "unattached">("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [selectedItem, setSelectedItem] = useState<ArtistMediaLibraryItem | null>(null)
  const [analysisStatuses, setAnalysisStatuses] = useState<Map<string, MediaIntelligenceStatus>>(new Map())
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [collectionItems, setCollectionItems] = useState<ArtistMediaLibraryItem[]>([])
  const [collectionInsight, setCollectionInsight] = useState<MediaCollectionInsight | null>(null)
  const [collectionOpen, setCollectionOpen] = useState(false)
  const [collectionInsights, setCollectionInsights] = useState<MediaCollectionInsight[]>([])

  const refresh = useCallback(async () => {
    const raw = await loadArtistMediaLibrary({ limit: 200 })
    const next = await Promise.all(raw.map(async (item) => {
      if (item.previewUrl || !["video", "audio"].includes(item.mediaKind)) return item
      return { ...item, previewUrl: await signPrivateMediaPreview(item.storagePath, item.mimeType) }
    }))
    setItems(next)
    try { setAnalysisStatuses(await loadMediaIntelligenceStatuses(next)) } catch { setAnalysisStatuses(new Map()) }
    try { setCollectionInsights(await loadMediaCollectionInsights(6)) } catch { setCollectionInsights([]) }
    return next
  }, [])

  useEffect(() => {
    let active = true
    void refresh().then(() => { if (!active) return; const receipt = readMediaImportReceipt(); if (receipt) setMessage(receiptMessage(receipt)) }).catch((reason: Error) => { if (active) setError(reason.message) }).finally(() => { if (active) setLoading(false) })
    const onImport = (event: Event) => { const receipt = (event as CustomEvent<KleioMediaImportReceipt>).detail; void refresh().then(() => setMessage(receiptMessage(receipt))).catch((reason: Error) => setError(reason.message)) }
    window.addEventListener("kleio:media-import-completed", onImport)
    return () => { active = false; window.removeEventListener("kleio:media-import-completed", onImport) }
  }, [refresh])

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase()
    return items.filter((item) => {
      const matchesSearch = !search || `${item.title} ${item.originalFilename} ${item.associatedWorkTitle}`.toLowerCase().includes(search)
      const matchesFilter = filter === "all" ? true : filter === "approved" ? item.approvalState === "approved" : filter === "unattached" ? item.usageCount === 0 && !item.associatedWorkId : item.mediaKind === filter
      return matchesSearch && matchesFilter
    })
  }, [filter, items, query])

  const selectedItems = useMemo(() => items.filter((item) => item.sourceId && selectedIds.includes(item.sourceId)), [items, selectedIds])

  function toggleSelected(item: ArtistMediaLibraryItem) {
    if (!item.sourceId || !canAnalyzeMediaItem(item)) return
    setSelectedIds((current) => current.includes(item.sourceId as string) ? current.filter((id) => id !== item.sourceId) : current.length >= 12 ? current : [...current, item.sourceId as string])
  }

  function runSelectedMediaAssist() {
    if (!selectedItems.length) { setError("Select at least one supported private source to run Media Assist."); return }
    setError("")
    if (selectedItems.length === 1) {
      setCollectionOpen(false)
      setCollectionItems([])
      setCollectionInsight(null)
      setSelectedItem(selectedItems[0])
      return
    }
    setSelectedItem(null)
    setCollectionInsight(null)
    setCollectionItems(selectedItems)
    setCollectionOpen(true)
  }

  function reviewCollection(insight: MediaCollectionInsight) {
    const matching = items.filter((item) => item.sourceId && insight.sourceIds.includes(item.sourceId))
    setCollectionItems(matching)
    setCollectionInsight(insight)
    setCollectionOpen(true)
  }

  return <main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-5 sm:px-6 sm:py-6"><div className="mx-auto max-w-[1240px] space-y-5">
    <WorkspacePageHeader eyebrow="Artist workspace" title="Media Library" description="Keep private images, video, audio, and supporting documents in one reusable place for your Portfolio, Creative Passport, and applications." />
    <section className="rounded-[26px] border border-[#E2DCF1] bg-[linear-gradient(135deg,#F8F5FF,#FFFFFF)] p-5 shadow-[0_18px_52px_rgba(82,64,130,0.06)]"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-2xl"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Private reusable sources</p><h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.03em]">Upload, organize, and reuse your material in one place</h2><p className="mt-2 text-sm leading-6 text-[#746E80]">Upload images, video, audio, and documents. Media Assist can prepare editable metadata, source notes, and application language from one source or a selected group—without scoring or judging the quality of your work.</p></div><QuickMediaImport context="existing_media_library" label="Upload media" onConfirm={async ({ items: uploaded }) => { const next = await refresh(); const analyzableIds = uploaded.flatMap((item) => item.sourceId && canAnalyzeMediaItem(item) ? [item.sourceId] : []); if (analyzableIds.length > 1) { setSelectionMode(true); setSelectedIds(analyzableIds.slice(0, 12)); setMessage(`${analyzableIds.length} uploaded sources are selected. Run Media Assist when you are ready.`) } else { setMessage("Your private media is available in the library.") } setItems(next) }} /></div><p className="mt-4 text-xs font-semibold text-[#6A5896]"><ShieldCheck className="mr-1.5 inline size-3.5" />Media Assist stays private. Institutions cannot browse these notes, and nothing becomes reusable artist context until you review and keep it.</p></section>

    {collectionInsights.length > 0 && <section className="rounded-[24px] border border-[#E1DAF0] bg-white p-4 shadow-[0_14px_42px_rgba(82,64,130,0.04)]" aria-labelledby="media-assist-notes-heading"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F0EAFB] text-[#5B4B8A]"><Layers3 className="size-5" /></span><div><h2 id="media-assist-notes-heading" className="text-sm font-semibold text-[#292631]">Saved Media Assist notes</h2><p className="mt-1 text-xs leading-5 text-[#746E80]">Recent comparison suggestions stay private here. Only notes you approve can support future application drafts.</p></div></div><div className="mt-4 grid gap-3 lg:grid-cols-3">{collectionInsights.slice(0, 3).map((insight) => <article key={insight.id} className="rounded-2xl border border-[#E7E1F7] bg-[#FCFBFE] p-4"><div className="flex items-start justify-between gap-2"><h3 className="font-serif text-lg font-semibold text-[#292631]">{insight.title}</h3><span className={`shrink-0 rounded-full px-2 py-1 text-[0.65rem] font-semibold ${insight.status === "confirmed" ? "bg-emerald-50 text-emerald-800" : "bg-[#F1ECFB] text-[#665A85]"}`}>{insight.status === "confirmed" ? "Artist-approved" : "Review"}</span></div><p className="mt-2 line-clamp-3 text-xs leading-5 text-[#746E80]">{insight.artistSummary || insight.bodyOfWorkSummary || insight.summary}</p><button type="button" className={`${secondary} mt-3`} onClick={() => reviewCollection(insight)}>{insight.status === "confirmed" ? "Open saved note" : "Review suggestions"}</button></article>)}</div></section>}

    {(error || message) && <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`} role={error ? "alert" : "status"} aria-live="polite">{error || message}</div>}

    <section className="rounded-[22px] border border-[#E7E1F7] bg-white p-4 shadow-[0_14px_42px_rgba(82,64,130,0.05)]"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><label className="relative block flex-1 lg:max-w-md"><span className="sr-only">Search private media</span><Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-[#8A8296]" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search artwork, media, filename, or document" className="h-11 w-full rounded-xl border border-[#DED7EF] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12" /></label><div className="flex flex-wrap items-center gap-2" aria-label="Media filters">{(["all","image","video","audio","document","approved","unattached"] as const).map((value) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`${filterButton} ${filter === value ? "border-[#A997E8] bg-[#F1ECFB] text-[#5B4B8A]" : ""}`}>{value === "all" ? "All media" : value === "image" ? "Images" : value === "video" ? "Video" : value === "audio" ? "Audio" : value === "document" ? "Documents" : value === "approved" ? "In portfolio" : "Unattached"}</button>)}<button type="button" className={selectionMode ? primary : secondary} onClick={() => { setSelectionMode((current) => !current); if (selectionMode) setSelectedIds([]) }}>{selectionMode ? <X className="size-3.5" /> : <Layers3 className="size-3.5" />}{selectionMode ? "Exit Media Assist selection" : "Select for Media Assist"}</button></div></div>
      {selectionMode && <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#DDD5EE] bg-[#FAF8FE] p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-[#4F407B]">{selectedItems.length} of 12 sources selected</p><p className="mt-0.5 text-xs leading-5 text-[#746E80]">Select one source to prepare its notes, or select two or more to compare them together. Media Assist keeps every suggestion editable and optional.</p></div><div className="flex flex-wrap gap-2"><button type="button" className={secondary} disabled={!selectedIds.length} onClick={() => setSelectedIds([])}>Clear</button><button type="button" className={primary} disabled={!selectedItems.length} onClick={runSelectedMediaAssist}>{selectedItems.length === 1 ? <FileSearch className="size-3.5" /> : <Layers3 className="size-3.5" />}Run Media Assist</button></div></div>}
    </section>

    {loading ? <div className="flex items-center justify-center rounded-[22px] border border-[#E7E1F7] bg-white p-10 text-sm text-[#746E80]"><Loader2 className="mr-2 size-4 animate-spin" />Loading your private media library…</div> : visible.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visible.map((item) => { const status = analysisStatuses.get(item.id); const label = analysisLabel(status); const selected = Boolean(item.sourceId && selectedIds.includes(item.sourceId)); const selectable = canAnalyzeMediaItem(item); return <article key={item.id} className={`group overflow-visible rounded-[22px] border bg-white shadow-[0_14px_38px_rgba(82,64,130,0.05)] ${selected ? "border-[#927FC4] ring-2 ring-[#A997E8]/20" : "border-[#E7E1F7]"}`}><div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-t-[22px] bg-[#F4F1F8]"><MediaPreview item={item} />{selectionMode ? <button type="button" disabled={!selectable} aria-pressed={selected} onClick={() => toggleSelected(item)} className={`absolute left-2 top-2 grid size-9 place-items-center rounded-xl border shadow-sm transition ${selected ? "border-[#6F5DA7] bg-[#6F5DA7] text-white" : "border-white/90 bg-white/95 text-[#746E80]"} disabled:cursor-not-allowed disabled:opacity-40`} aria-label={`${selected ? "Remove" : "Add"} ${item.title} ${selected ? "from" : "to"} Media Assist selection`}>{selected ? <Check className="size-4" /> : <Layers3 className="size-4" />}</button> : <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[0.65rem] font-semibold text-[#5B4B8A]">{item.approvalState === "approved" ? "In portfolio" : "Private source"}</span>}{status === "ready" && <span className="absolute right-2 top-2 rounded-full border border-emerald-200 bg-emerald-50/95 px-2 py-1 text-[0.62rem] font-semibold text-emerald-800">Media Assist ready</span>}{status === "failed" && <span className="absolute right-2 top-2 rounded-full border border-amber-200 bg-amber-50/95 px-2 py-1 text-[0.62rem] font-semibold text-amber-800">Media Assist needs retry</span>}<span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-[0.62rem] font-semibold capitalize text-[#625C70]">{item.mediaKind}</span></div><div className="p-4"><h3 className="truncate font-serif text-lg font-semibold">{item.title}</h3><p className="mt-1 truncate text-xs text-[#746E80]">{item.originalFilename}</p><div className="mt-3 flex items-center justify-between gap-2"><span className="text-[0.68rem] text-[#8A8296]">Added {new Date(item.createdAt).toLocaleDateString()}</span><span className="flex items-center gap-1">{canAnalyzeMediaItem(item) && <button type="button" onClick={() => setSelectedItem(item)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#5B4B8A] hover:bg-[#F7F4FF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20" aria-label={`${label || "Run Media Assist"} ${item.title}`}><FileSearch className="size-4" />{label || "Run Media Assist"}</button>}<MediaManagementMenu item={item} onChanged={async () => { setSelectedItem((current) => current?.id === item.id ? null : current); if (item.sourceId) setSelectedIds((current) => current.filter((id) => id !== item.sourceId)); await refresh(); setMessage("Media Library updated.") }} /></span></div></div></article>})}</div> : <div className="grid place-items-center rounded-[22px] border border-dashed border-[#D8D0F2] bg-white p-12 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><Library className="size-6" /></span><h2 className="mt-4 font-serif text-2xl font-semibold">No matching media</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#746E80]">Choose another filter or use Upload media above. KLEIO preserves every private source and waits for your approval before reusing it.</p></div>}
  </div><MediaIntelligenceSheet item={selectedItem} open={Boolean(selectedItem)} onClose={() => setSelectedItem(null)} onAnalyzed={() => { if (!selectedItem) return; setAnalysisStatuses((current) => new Map(current).set(selectedItem.id, "ready")); setMessage("Media Assist updated. These private suggestions are also available from Creative Passport.") }} /><MediaCollectionIntelligenceSheet items={collectionItems} open={collectionOpen} initialInsight={collectionInsight} onClose={() => setCollectionOpen(false)} onConfirmed={async () => { setSelectedIds([]); setSelectionMode(false); await refresh(); setMessage("Your reviewed Media Assist note is saved and can support a future application when relevant.") }} onDismissed={async () => { await refresh(); setMessage("That Media Assist comparison was dismissed and will not be used as artist context.") }} /></main>
}
