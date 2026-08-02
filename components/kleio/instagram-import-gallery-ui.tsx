"use client"

/* eslint-disable @next/next/no-img-element -- Instagram previews are temporary, artist-authorized remote media */

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Check, ExternalLink, ImageIcon, ImagePlus, Library, X } from "lucide-react"
import type { InstagramGalleryAsset, InstagramPreparedItem } from "@/lib/kleio-instagram-import"

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const quiet = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#746E80] transition hover:bg-[#F7F4FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:opacity-50"
const iconButton = "inline-grid size-11 shrink-0 place-items-center rounded-full border border-[#DED7EF] bg-white text-[#5B4B8A] shadow-sm transition hover:bg-[#F8F6FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-40"
const focusableSelector = ["button:not([disabled])", "[href]", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])", "[tabindex]:not([tabindex='-1'])"].join(",")

function readableDate(value: string) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function assetBadge(asset: InstagramGalleryAsset) {
  if (asset.parentMediaType === "CAROUSEL_ALBUM") return "Carousel"
  if (asset.mediaProductType === "REELS") return "Reel"
  if (asset.kind === "video") return "Video"
  return ""
}

export function assetName(asset: InstagramGalleryAsset) {
  if (asset.isCarouselChild && asset.carouselIndex && asset.carouselTotal) {
    return `Carousel image ${asset.carouselIndex} of ${asset.carouselTotal}`
  }
  return asset.kind === "video" ? "Instagram video" : "Instagram artwork"
}

export function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.25" />
      <circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function FieldStatus({ item, name }: { item: InstagramPreparedItem; name: keyof InstagramPreparedItem["fields"] }) {
  const field = item.fields[name]
  const label = field.status === "extracted" ? "From Instagram" : field.status === "suggested" ? "Suggested" : field.status === "edited" ? "Edited by you" : field.status === "confirmed" ? "Confirmed" : "Optional"
  return <span className="rounded-full border border-[#E2DCF1] bg-[#FAF9FD] px-2 py-1 text-[0.65rem] font-semibold text-[#756F80]">{label}</span>
}

export function GallerySkeleton() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2.5 max-[340px]:grid-cols-1 md:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-[#E7E1F7] bg-white">
          <div className="aspect-square animate-pulse bg-[#F0EDF6] motion-reduce:animate-none" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-3/4 animate-pulse rounded bg-[#EEEAF5] motion-reduce:animate-none" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#F2EFF7] motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  )
}

function MediaPlaceholder({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 bg-[#F4F1F8] px-4 text-center text-[#746E80]">
      <ImageIcon className={compact ? "size-5" : "size-8"} aria-hidden="true" />
      <span className={compact ? "text-[0.65rem] font-semibold" : "text-sm font-semibold"}>Preview unavailable</span>
    </div>
  )
}

export function GalleryCard({
  asset,
  selected,
  saved,
  selectionDisabled,
  onPreview,
  onToggle,
}: {
  asset: InstagramGalleryAsset
  selected: boolean
  saved: boolean
  selectionDisabled: boolean
  onPreview: (trigger: HTMLButtonElement) => void
  onToggle: () => void
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const badge = assetBadge(asset)
  const unavailable = asset.unavailable || imageFailed
  const canSelect = asset.selectable && !saved && !unavailable
  const selectionLabel = selected ? `Deselect ${assetName(asset)}` : `Select ${assetName(asset)}`

  useEffect(() => setImageFailed(false), [asset.imageUrl])

  return (
    <article className={`group overflow-hidden rounded-2xl border bg-white transition [content-visibility:auto] [contain-intrinsic-size:320px] ${selected ? "border-[#8C78BF] ring-2 ring-[#A997E8]/25" : "border-[#E7E1F7] hover:border-[#CFC4E8]"}`} aria-label={`${assetName(asset)}${selected ? ", selected" : ""}${saved ? ", already saved" : ""}`}>
      <div className="relative aspect-square overflow-hidden bg-[#F2EFF7]">
        <button type="button" className="size-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#A997E8]/45" onClick={(event) => onPreview(event.currentTarget)} aria-label={`Preview ${assetName(asset)}`}>
          {!unavailable ? <img src={asset.imageUrl} alt="" referrerPolicy="no-referrer" className="size-full object-contain transition duration-300 group-hover:scale-[1.015] motion-reduce:transition-none motion-reduce:group-hover:scale-100" onError={() => setImageFailed(true)} /> : <MediaPlaceholder compact />}
        </button>
        {badge && <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-[#292631]/82 px-2 py-1 text-[0.62rem] font-semibold text-white backdrop-blur-sm">{badge}</span>}
        {saved && <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[0.62rem] font-semibold text-[#5B4B8A] shadow-sm"><Library className="size-3" />In KLEIO</span>}
        <label className={`absolute right-2 top-2 grid size-11 place-items-center rounded-full border shadow-sm transition ${selected ? "border-[#7964AD] bg-[#5B4B8A] text-white" : "border-white/80 bg-white/95 text-[#5B4B8A]"} ${!canSelect ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:scale-105 motion-reduce:hover:scale-100"}`}>
          <span className="sr-only">{saved ? `${assetName(asset)} is already in KLEIO` : canSelect ? selectionLabel : `${assetName(asset)} cannot be selected`}</span>
          <input type="checkbox" className="sr-only" checked={selected} disabled={!canSelect || (!selected && selectionDisabled)} onChange={onToggle} aria-label={selectionLabel} />
          {selected ? <Check className="size-5" aria-hidden="true" /> : <span className="size-4 rounded-full border-2 border-current" aria-hidden="true" />}
        </label>
      </div>
      <div className="min-h-[5.25rem] p-3">
        <p className="line-clamp-2 text-xs leading-5 text-[#625C70]">{asset.caption || (asset.kind === "video" ? "Video shown for context" : "No caption available")}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="truncate text-[0.68rem] text-[#8A8296]">{readableDate(asset.timestamp)}</span>
          {asset.isCarouselChild && asset.carouselIndex && asset.carouselTotal ? <span className="text-[0.68rem] font-semibold text-[#75639E]">{asset.carouselIndex}/{asset.carouselTotal}</span> : null}
        </div>
      </div>
    </article>
  )
}

export function PreviewDialog({
  asset,
  gallery,
  selected,
  saved,
  selectionDisabled,
  onClose,
  onChange,
  onToggle,
}: {
  asset: InstagramGalleryAsset
  gallery: InstagramGalleryAsset[]
  selected: boolean
  saved: boolean
  selectionDisabled: boolean
  onClose: () => void
  onChange: (asset: InstagramGalleryAsset) => void
  onToggle: () => void
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const [imageFailed, setImageFailed] = useState(false)
  const currentIndex = gallery.findIndex((item) => item.id === asset.id)
  const carouselAssets = gallery.filter((item) => item.parentId === asset.parentId)
  const badge = assetBadge(asset)
  const unavailable = asset.unavailable || imageFailed
  const canSelect = asset.selectable && !saved && !unavailable

  useEffect(() => {
    setImageFailed(false)
    closeRef.current?.focus()
  }, [asset.id])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === "ArrowLeft" && gallery.length > 1) {
        event.preventDefault()
        onChange(gallery[(currentIndex - 1 + gallery.length) % gallery.length])
        return
      }
      if (event.key === "ArrowRight" && gallery.length > 1) {
        event.preventDefault()
        onChange(gallery[(currentIndex + 1) % gallery.length])
        return
      }
      if (event.key !== "Tab" || !dialogRef.current) return
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, gallery, onChange, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#211B2E]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="instagram-preview-title" aria-describedby="instagram-preview-description" className="flex max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[28px] border border-[#DED7EF] bg-white shadow-[0_30px_100px_rgba(25,18,40,0.3)] sm:max-h-[90vh] sm:rounded-[28px] lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.65fr)]">
        <div className="relative flex min-h-[42dvh] items-center justify-center bg-[#F3F0F7] sm:min-h-[55vh]">
          {!unavailable ? <img src={asset.imageUrl} alt="" referrerPolicy="no-referrer" className="max-h-[66vh] max-w-full object-contain" onError={() => setImageFailed(true)} /> : <MediaPlaceholder />}
          {gallery.length > 1 && <>
            <button type="button" className={`${iconButton} absolute left-3 top-1/2 -translate-y-1/2`} onClick={() => onChange(gallery[(currentIndex - 1 + gallery.length) % gallery.length])} aria-label="Previous Instagram work"><ArrowLeft className="size-5" /></button>
            <button type="button" className={`${iconButton} absolute right-3 top-1/2 -translate-y-1/2`} onClick={() => onChange(gallery[(currentIndex + 1) % gallery.length])} aria-label="Next Instagram work"><ArrowRight className="size-5" /></button>
          </>}
          {badge && <span className="absolute left-3 top-3 rounded-full bg-[#292631]/82 px-3 py-1.5 text-xs font-semibold text-white">{badge}</span>}
        </div>
        <div className="flex min-h-0 flex-col">
          <div className="flex items-center justify-between border-b border-[#E7E1F7] px-5 py-4">
            <div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#75639E]">Instagram preview</p><h3 id="instagram-preview-title" className="mt-1 font-serif text-xl font-semibold text-[#292631]">{assetName(asset)}</h3></div>
            <button ref={closeRef} type="button" className={iconButton} onClick={onClose} aria-label="Close Instagram preview"><X className="size-5" /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#746E80]"><span>{readableDate(asset.timestamp) || "Date unavailable"}</span><span aria-hidden="true">•</span><span>{asset.kind === "video" ? "Video" : "Still image"}</span>{asset.isCarouselChild && asset.carouselIndex && asset.carouselTotal ? <><span aria-hidden="true">•</span><span>Image {asset.carouselIndex} of {asset.carouselTotal}</span></> : null}</div>
            {carouselAssets.length > 1 && <div className="mt-4" aria-label="Carousel images"><p className="mb-2 text-xs font-semibold text-[#625C70]">Carousel images</p><div className="flex gap-2 overflow-x-auto pb-1">{carouselAssets.map((item) => <button key={item.id} type="button" className={`relative size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-[#F3F0F7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 ${item.id === asset.id ? "border-[#7964AD]" : "border-transparent"}`} onClick={() => onChange(item)} aria-label={`Show carousel image ${item.carouselIndex || 1} of ${item.carouselTotal || carouselAssets.length}`} aria-current={item.id === asset.id ? "true" : undefined}>{item.imageUrl ? <img src={item.imageUrl} alt="" className="size-full object-cover" referrerPolicy="no-referrer" /> : <MediaPlaceholder compact />}</button>)}</div></div>}
            <p id="instagram-preview-description" className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#625C70]">{asset.caption || "No caption was available for this post."}</p>
          </div>
          <div className="border-t border-[#E7E1F7] bg-[#FCFBFE] p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3">{asset.permalink ? <a href={asset.permalink} target="_blank" rel="noreferrer" className={quiet}>Open original post <ExternalLink className="size-4" /></a> : <span />}{saved ? <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#EEE9F7] px-4 text-sm font-semibold text-[#5B4B8A]"><Library className="size-4" />Already in KLEIO</span> : <button type="button" className={selected ? secondary : primary} disabled={!canSelect || (!selected && selectionDisabled)} onClick={onToggle} aria-pressed={selected}>{selected ? <Check className="size-4" /> : <ImagePlus className="size-4" />}{selected ? "Deselect work" : canSelect ? "Select work" : asset.kind === "video" ? "Video selection unavailable" : "Image unavailable"}</button>}</div></div>
        </div>
      </div>
    </div>
  )
}
