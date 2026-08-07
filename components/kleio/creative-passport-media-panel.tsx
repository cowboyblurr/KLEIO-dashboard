"use client"

/* eslint-disable @next/next/no-img-element -- private media uses short-lived signed URLs */

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { AudioLines, BrainCircuit, FileCheck2, FileText, Images, Loader2, Sparkles, Video } from "lucide-react"
import { QuickMediaImport } from "@/components/kleio/media-import/quick-media-import"
import { MediaIntelligenceSheet } from "@/components/kleio/media-intelligence-sheet"
import { loadPassportReviewCount } from "@/lib/kleio-upload-to-passport"
import { loadArtistMediaLibrary, type ArtistMediaLibraryItem } from "@/lib/kleio-universal-media"
import { signPrivateMediaPreview } from "@/lib/kleio-device-media-upload"
import { canAnalyzeMediaItem, loadMediaIntelligenceStatuses, type MediaIntelligenceStatus } from "@/lib/kleio-media-intelligence"

const action = "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[#D8D0F2] bg-white px-3 py-1.5 text-xs font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/15"

function Preview({ item }: { item: ArtistMediaLibraryItem }) {
  if (item.mediaKind === "image" && item.previewUrl) return <img src={item.previewUrl} alt="" className="size-full object-cover" loading="lazy" />
  if (item.mediaKind === "video" && item.previewUrl) return <video src={item.previewUrl} muted playsInline preload="metadata" className="size-full object-cover" aria-label={`${item.title} video preview`} />
  if (item.mediaKind === "video") return <Video className="size-5 text-[#75639E]" />
  if (item.mediaKind === "audio") return <AudioLines className="size-5 text-[#75639E]" />
  if (item.mediaKind === "document") return <FileText className="size-5 text-[#75639E]" />
  return <Images className="size-5 text-[#75639E]" />
}

function statusLabel(status: MediaIntelligenceStatus | undefined) {
  if (status === "ready") return "View analysis"
  if (status === "available") return "Analyze"
  return ""
}

export function CreativePassportMediaPanel() {
  const [count, setCount] = useState<number | null>(null)
  const [items, setItems] = useState<ArtistMediaLibraryItem[]>([])
  const [statuses, setStatuses] = useState<Map<string, MediaIntelligenceStatus>>(new Map())
  const [selectedItem, setSelectedItem] = useState<ArtistMediaLibraryItem | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [reviewCount, raw] = await Promise.all([loadPassportReviewCount(), loadArtistMediaLibrary({ limit: 8 })])
    const media = await Promise.all(raw.map(async (item) => {
      if (item.previewUrl || !["video", "audio"].includes(item.mediaKind)) return item
      return { ...item, previewUrl: await signPrivateMediaPreview(item.storagePath, item.mimeType) }
    }))
    setCount(reviewCount)
    setItems(media)
    try { setStatuses(await loadMediaIntelligenceStatuses(media)) } catch { setStatuses(new Map()) }
  }, [])

  useEffect(() => {
    let active = true
    void refresh().catch(() => { if (active) { setCount(0); setItems([]) } }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [refresh])

  return <>
    <section className="rounded-2xl border border-[#E7E1F7] bg-[linear-gradient(135deg,#FCFBFE,#FFFFFF)] px-3 py-3 shadow-[0_12px_32px_rgba(82,64,130,0.04)]" aria-labelledby="passport-media-intelligence-title">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#F0EBFA] text-[#5B4B8A]"><Sparkles className="size-4.5" /></span>
          <div className="min-w-0">
            <h2 id="passport-media-intelligence-title" className="text-sm font-semibold text-[#292631]">Media intelligence</h2>
            <p className="mt-0.5 max-w-2xl text-xs leading-5 text-[#746E80]">Add private media or files, analyze supported sources here, and reopen the same analysis from Media Library. KLEIO keeps suggestions beside the Passport instead of sending you through separate screens.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <QuickMediaImport context="creative_passport" label="Add media" onConfirm={async () => { await refresh() }} />
          <Link href="/artist-dashboard/passport/review/" className={action}><FileCheck2 className="size-3.5" />{count === null ? <Loader2 className="size-3 animate-spin" /> : count ? `${count} to review` : "Review updates"}</Link>
          <Link href="/artist-dashboard/media/" className={action}><Images className="size-3.5" />Full library</Link>
        </div>
      </div>

      <div className="mt-3 border-t border-[#EEEAF6] pt-3">
        {loading ? <p className="flex items-center gap-2 py-2 text-xs text-[#746E80]"><Loader2 className="size-3.5 animate-spin" />Loading recent private material…</p> : items.length ? <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Recent private media and analysis">
          {items.slice(0, 6).map((item) => {
            const status = statuses.get(item.id)
            const label = statusLabel(status)
            return <article key={item.id} className="flex min-w-[220px] max-w-[260px] items-center gap-2.5 rounded-xl border border-[#E7E1F7] bg-white p-2.5">
              <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#F3F0F8]"><Preview item={item} /></div>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#292631]">{item.title}</p><p className="mt-0.5 truncate text-[0.66rem] capitalize text-[#8A8296]">{item.mediaKind}{status === "ready" ? " · analysis ready" : ""}</p>{canAnalyzeMediaItem(item) && <button type="button" onClick={() => setSelectedItem(item)} className="mt-1 inline-flex items-center gap-1 text-[0.68rem] font-semibold text-[#5B4B8A] hover:underline"><BrainCircuit className="size-3" />{label || "Analyze"}</button>}</div>
            </article>
          })}
        </div> : <p className="py-2 text-xs leading-5 text-[#746E80]">No private material yet. Add media here and KLEIO will keep it available across your Passport, portfolio, and applications.</p>}
      </div>
    </section>
    <MediaIntelligenceSheet item={selectedItem} open={Boolean(selectedItem)} onClose={() => setSelectedItem(null)} onAnalyzed={() => { if (!selectedItem) return; setStatuses((current) => new Map(current).set(selectedItem.id, "ready")); void refresh() }} />
  </>
}
