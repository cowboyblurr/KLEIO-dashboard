"use client"

/* eslint-disable @next/next/no-img-element -- Instagram previews are temporary, artist-authorized remote media */

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  ImageIcon,
  ImagePlus,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react"
import {
  approveInstagramImport,
  confirmedInstagramFields,
  deleteInstagramImport,
  disconnectInstagram,
  flattenInstagramMedia,
  instagramPreparedMediaId,
  loadInstagramConnection,
  loadInstagramMedia,
  loadInstagramPreparedImports,
  prepareInstagramImports,
  saveInstagramPreparedDrafts,
  startInstagramConnection,
  updateInstagramPreparedField,
  type InstagramConnectionStatus,
  type InstagramGalleryAsset,
  type InstagramPreparedItem,
} from "@/lib/kleio-instagram-import"

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const quiet = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#746E80] transition hover:bg-[#F7F4FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:opacity-50"
const iconButton = "inline-grid size-11 shrink-0 place-items-center rounded-full border border-[#DED7EF] bg-white text-[#5B4B8A] shadow-sm transition hover:bg-[#F8F6FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-40"
const input = "min-h-11 w-full rounded-xl border border-[#DED7EF] bg-white px-3 py-2 text-sm text-[#292631] outline-none transition focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12 disabled:bg-[#F7F5FA]"
const textarea = `${input} min-h-24 resize-y leading-6`
const callbackOrigin = "https://trekynurdgxgtaaqqtyq.supabase.co"
const MAX_SELECTED = 20

const focusableSelector = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",")

type SaveState = "idle" | "saving" | "saved" | "error"
type GalleryPhase = "idle" | "loading" | "refreshing" | "loading-more" | "ready" | "error"
type OAuthMessage = { type?: string; success?: boolean; username?: string; message?: string }
type CallbackCompletion = { result: string; username: string; success: boolean } | null
type PreparationSummary = { completed: number; failed: number } | null

function draftPayload(items: InstagramPreparedItem[]) {
  return items
    .filter((item) => !item.approved)
    .map((item) => ({ sourceId: item.sourceId, fields: item.fields }))
}

function readableDate(value: string) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function readableTime(value: Date | null) {
  if (!value) return ""
  return value.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

function message(reason: unknown, fallback: string) {
  return reason instanceof Error && reason.message ? reason.message : fallback
}

function assetBadge(asset: InstagramGalleryAsset) {
  if (asset.parentMediaType === "CAROUSEL_ALBUM") return "Carousel"
  if (asset.mediaProductType === "REELS") return "Reel"
  if (asset.kind === "video") return "Video"
  return ""
}

function assetName(asset: InstagramGalleryAsset) {
  if (asset.isCarouselChild && asset.carouselIndex && asset.carouselTotal) {
    return `Carousel image ${asset.carouselIndex} of ${asset.carouselTotal}`
  }
  return asset.kind === "video" ? "Instagram video" : "Instagram artwork"
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.25" />
      <circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FieldStatus({ item, name }: { item: InstagramPreparedItem; name: keyof InstagramPreparedItem["fields"] }) {
  const field = item.fields[name]
  const label = field.status === "extracted" ? "From caption" : field.status === "suggested" ? "Suggested" : field.status === "edited" ? "Edited" : field.status === "confirmed" ? "Confirmed" : "Add details"
  return <span className="rounded-full border border-[#E2DCF1] bg-[#FAF9FD] px-2 py-1 text-[0.65rem] font-semibold text-[#756F80]">{label}</span>
}

function GallerySkeleton() {
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

function GalleryCard({
  asset,
  selected,
  prepared,
  selectionDisabled,
  onPreview,
  onToggle,
}: {
  asset: InstagramGalleryAsset
  selected: boolean
  prepared: boolean
  selectionDisabled: boolean
  onPreview: (trigger: HTMLButtonElement) => void
  onToggle: () => void
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const badge = assetBadge(asset)
  const unavailable = asset.unavailable || imageFailed
  const canSelect = asset.selectable && !prepared && !unavailable
  const selectionLabel = selected ? `Deselect ${assetName(asset)}` : `Select ${assetName(asset)}`

  useEffect(() => setImageFailed(false), [asset.imageUrl])

  return (
    <article className={`group overflow-hidden rounded-2xl border bg-white transition ${selected ? "border-[#8C78BF] ring-2 ring-[#A997E8]/25" : "border-[#E7E1F7] hover:border-[#CFC4E8]"}`} aria-label={`${assetName(asset)}${selected ? ", selected" : ""}${prepared ? ", already prepared" : ""}`}>
      <div className="relative aspect-square overflow-hidden bg-[#F2EFF7]">
        <button
          type="button"
          className="size-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#A997E8]/45"
          onClick={(event) => onPreview(event.currentTarget)}
          aria-label={`Preview ${assetName(asset)}`}
        >
          {!unavailable ? (
            <img src={asset.imageUrl} alt="" referrerPolicy="no-referrer" className="size-full object-contain transition duration-300 group-hover:scale-[1.015] motion-reduce:transition-none motion-reduce:group-hover:scale-100" onError={() => setImageFailed(true)} />
          ) : <MediaPlaceholder compact />}
        </button>

        {badge && <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-[#292631]/82 px-2 py-1 text-[0.62rem] font-semibold text-white backdrop-blur-sm">{badge}</span>}
        {prepared && <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[0.62rem] font-semibold text-[#5B4B8A] shadow-sm"><Check className="size-3" />Prepared</span>}

        <label className={`absolute right-2 top-2 grid size-11 place-items-center rounded-full border shadow-sm transition ${selected ? "border-[#7964AD] bg-[#5B4B8A] text-white" : "border-white/80 bg-white/95 text-[#5B4B8A]"} ${!canSelect ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:scale-105 motion-reduce:hover:scale-100"}`}>
          <span className="sr-only">{prepared ? `${assetName(asset)} is already prepared` : canSelect ? selectionLabel : `${assetName(asset)} cannot be selected`}</span>
          <input
            type="checkbox"
            className="sr-only"
            checked={selected}
            disabled={!canSelect || (!selected && selectionDisabled)}
            onChange={onToggle}
            aria-label={selectionLabel}
          />
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

function PreviewDialog({
  asset,
  gallery,
  selected,
  prepared,
  selectionDisabled,
  onClose,
  onChange,
  onToggle,
}: {
  asset: InstagramGalleryAsset
  gallery: InstagramGalleryAsset[]
  selected: boolean
  prepared: boolean
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
  const canSelect = asset.selectable && !prepared && !unavailable

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
  }, [asset.id, currentIndex, gallery, onChange, onClose])

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
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#75639E]">Instagram preview</p>
              <h3 id="instagram-preview-title" className="mt-1 font-serif text-xl font-semibold text-[#292631]">{assetName(asset)}</h3>
            </div>
            <button ref={closeRef} type="button" className={iconButton} onClick={onClose} aria-label="Close Instagram preview"><X className="size-5" /></button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#746E80]">
              <span>{readableDate(asset.timestamp) || "Date unavailable"}</span>
              <span aria-hidden="true">•</span>
              <span>{asset.kind === "video" ? "Video" : "Still image"}</span>
              {asset.isCarouselChild && asset.carouselIndex && asset.carouselTotal ? <><span aria-hidden="true">•</span><span aria-label={`Carousel image ${asset.carouselIndex} of ${asset.carouselTotal}`}>Image {asset.carouselIndex} of {asset.carouselTotal}</span></> : null}
            </div>

            {carouselAssets.length > 1 && <div className="mt-4" aria-label="Carousel images">
              <p className="mb-2 text-xs font-semibold text-[#625C70]">Carousel images</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {carouselAssets.map((item) => (
                  <button key={item.id} type="button" className={`relative size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-[#F3F0F7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 ${item.id === asset.id ? "border-[#7964AD]" : "border-transparent"}`} onClick={() => onChange(item)} aria-label={`Show carousel image ${item.carouselIndex || 1} of ${item.carouselTotal || carouselAssets.length}`} aria-current={item.id === asset.id ? "true" : undefined}>
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="size-full object-cover" referrerPolicy="no-referrer" /> : <MediaPlaceholder compact />}
                  </button>
                ))}
              </div>
            </div>}

            <p id="instagram-preview-description" className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#625C70]">{asset.caption || "No caption was available for this post."}</p>
          </div>

          <div className="border-t border-[#E7E1F7] bg-[#FCFBFE] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {asset.permalink ? <a href={asset.permalink} target="_blank" rel="noreferrer" className={quiet}>Open on Instagram <ExternalLink className="size-4" /></a> : <span />}
              {prepared ? <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#EEE9F7] px-4 text-sm font-semibold text-[#5B4B8A]"><Check className="size-4" />Already prepared</span> : (
                <button type="button" className={selected ? secondary : primary} disabled={!canSelect || (!selected && selectionDisabled)} onClick={onToggle} aria-pressed={selected}>
                  {selected ? <Check className="size-4" /> : <ImagePlus className="size-4" />}
                  {selected ? "Deselect work" : canSelect ? "Select work" : asset.kind === "video" ? "Video selection unavailable" : "Image unavailable"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function InstagramImportAssist() {
  const [connection, setConnection] = useState<InstagramConnectionStatus | null>(null)
  const [gallery, setGallery] = useState<InstagramGalleryAsset[]>([])
  const [galleryPhase, setGalleryPhase] = useState<GalleryPhase>("idle")
  const [galleryError, setGalleryError] = useState("")
  const [nextCursor, setNextCursor] = useState("")
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [prepared, setPrepared] = useState<InstagramPreparedItem[]>([])
  const [previewId, setPreviewId] = useState("")
  const [rightsConfirmed, setRightsConfirmed] = useState(false)
  const [working, setWorking] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [selectionNotice, setSelectionNotice] = useState("")
  const [prepareSummary, setPrepareSummary] = useState<PreparationSummary>(null)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const sessionIdRef = useRef(crypto.randomUUID())
  const lastSavedRef = useRef("")
  const hydratedRef = useRef(false)
  const oauthStartRef = useRef(false)
  const oauthPopupRef = useRef<Window | null>(null)
  const oauthMonitorRef = useRef<number | null>(null)
  const galleryRequestRef = useRef(0)
  const previewTriggerRef = useRef<HTMLButtonElement | null>(null)
  const reviewSectionRef = useRef<HTMLElement | null>(null)
  const reviewHeadingRef = useRef<HTMLHeadingElement | null>(null)
  const [oauthInProgress, setOauthInProgress] = useState(false)
  const [initialLocationResolved, setInitialLocationResolved] = useState(false)
  const [callbackCompletion, setCallbackCompletion] = useState<CallbackCompletion>(null)

  const selectedCount = selected.size
  const preparedPending = useMemo(() => prepared.filter((item) => !item.approved), [prepared])
  const preparedMediaIds = useMemo(() => new Set(prepared.map(instagramPreparedMediaId)), [prepared])
  const previewAsset = useMemo(() => gallery.find((asset) => asset.id === previewId) || null, [gallery, previewId])

  async function refreshGallery(reset: boolean) {
    if (galleryPhase === "loading" || galleryPhase === "refreshing" || galleryPhase === "loading-more") return
    const requestId = ++galleryRequestRef.current
    setGalleryError("")
    setGalleryPhase(reset ? (gallery.length ? "refreshing" : "loading") : "loading-more")
    try {
      const result = await loadInstagramMedia(reset ? "" : nextCursor)
      if (requestId !== galleryRequestRef.current) return
      const assets = flattenInstagramMedia(result.items)
      setGallery((current) => {
        if (!reset) return [...current, ...assets.filter((asset) => !current.some((existing) => existing.id === asset.id))]
        const selectedOutsideFirstPage = current.filter((asset) => selected.has(asset.id) && !assets.some((fresh) => fresh.id === asset.id))
        return [...assets, ...selectedOutsideFirstPage]
      })
      setNextCursor(result.nextCursor)
      setLastRefreshed(new Date())
      setGalleryPhase("ready")
      if (reset && selectedCount) setNotice("Posts refreshed. Your current selection was preserved.")
      else if (!assets.length && !reset) setNotice("No additional Instagram media was found.")
      else setNotice("")
    } catch (reason) {
      if (requestId !== galleryRequestRef.current) return
      setGalleryPhase("error")
      setGalleryError(message(reason, "Instagram media could not be loaded."))
    }
  }

  async function refreshConnection(loadMedia = false) {
    const status = await loadInstagramConnection()
    setConnection(status)
    if (status.connected && loadMedia) await refreshGallery(true)
  }

  async function hydrate() {
    setWorking("hydrate")
    setError("")
    try {
      const [status, preparedResult] = await Promise.all([loadInstagramConnection(), loadInstagramPreparedImports()])
      setConnection(status)
      setPrepared(preparedResult.items)
      lastSavedRef.current = JSON.stringify(draftPayload(preparedResult.items))
      hydratedRef.current = true
      setWorking("")
      if (status.connected) await refreshGallery(true)
    } catch (reason) {
      setError(message(reason, "Instagram import could not be restored."))
      setWorking("")
    }
  }

  useEffect(() => {
    const url = new URL(window.location.href)
    const result = url.searchParams.get("instagram_result")
    if (!result) {
      setInitialLocationResolved(true)
      void hydrate()
      return
    }

    const username = url.searchParams.get("instagram_username") || ""
    const success = result === "instagram_oauth_success"
    const payload: OAuthMessage = {
      type: "kleio-instagram-oauth",
      success,
      username,
      message: result,
    }

    url.searchParams.delete("instagram")
    url.searchParams.delete("instagram_result")
    url.searchParams.delete("instagram_username")
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
    setCallbackCompletion({ result, username, success })
    setInitialLocationResolved(true)

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, window.location.origin)
      window.setTimeout(() => window.close(), 150)
    }
  }, [])

  useEffect(() => {
    function finishAttempt() {
      oauthStartRef.current = false
      oauthPopupRef.current = null
      if (oauthMonitorRef.current !== null) window.clearInterval(oauthMonitorRef.current)
      oauthMonitorRef.current = null
      setOauthInProgress(false)
    }

    function receive(event: MessageEvent<OAuthMessage>) {
      if (![callbackOrigin, window.location.origin].includes(event.origin) || event.data?.type !== "kleio-instagram-oauth") return
      finishAttempt()
      if (event.data.success) {
        setNotice(`Instagram${event.data.username ? ` @${event.data.username}` : ""} is connected. Choose the posts you want to review.`)
        setError("")
        void refreshConnection(true)
        return
      }
      const callbackMessage = event.data.message === "instagram_oauth_expired"
        ? "This Instagram connection attempt expired. Start a fresh connection."
        : event.data.message === "instagram_oauth_cancelled"
          ? "Instagram authorization was cancelled. Nothing was connected."
          : event.data.message === "instagram_oauth_consumed"
            ? "That Instagram connection link was already used. Start a fresh connection."
            : event.data.message === "instagram_oauth_in_progress"
              ? "An Instagram connection is already processing. Wait a moment and try again."
              : "Instagram connection was not completed. Try again from this page."
      setError(callbackMessage)
    }

    window.addEventListener("message", receive)
    return () => {
      window.removeEventListener("message", receive)
      if (oauthMonitorRef.current !== null) window.clearInterval(oauthMonitorRef.current)
    }
  }, [])

  useEffect(() => {
    if (!hydratedRef.current) return
    const payload = draftPayload(prepared)
    const serialized = JSON.stringify(payload)
    if (serialized === lastSavedRef.current) return
    setSaveState("saving")
    const timer = window.setTimeout(() => {
      void saveInstagramPreparedDrafts(payload)
        .then(() => { lastSavedRef.current = serialized; setSaveState("saved") })
        .catch(() => setSaveState("error"))
    }, 900)
    return () => window.clearTimeout(timer)
  }, [prepared])

  async function connect() {
    if (working || oauthStartRef.current || oauthInProgress) {
      oauthPopupRef.current?.focus()
      return
    }
    oauthStartRef.current = true
    const popup = window.open("about:blank", "kleio-instagram-connect", "popup,width=620,height=760,resizable=yes,scrollbars=yes")
    if (!popup) {
      oauthStartRef.current = false
      setError("Allow pop-ups for KLEIO, then try Connect Instagram again.")
      return
    }
    oauthPopupRef.current = popup
    setOauthInProgress(true)
    setWorking("connect")
    setError("")
    setNotice("Opening Instagram’s secure authorization screen…")
    try {
      const { authorizeUrl } = await startInstagramConnection(window.location.href)
      popup.location.href = authorizeUrl
      popup.focus()
      oauthMonitorRef.current = window.setInterval(() => {
        if (!popup.closed) return
        if (oauthMonitorRef.current !== null) window.clearInterval(oauthMonitorRef.current)
        oauthMonitorRef.current = null
        oauthPopupRef.current = null
        oauthStartRef.current = false
        setOauthInProgress(false)
      }, 500)
    } catch (reason) {
      popup.close()
      oauthPopupRef.current = null
      oauthStartRef.current = false
      setOauthInProgress(false)
      setError(message(reason, "Instagram connection could not start."))
      setNotice("")
    } finally {
      setWorking("")
    }
  }

  function toggleAsset(asset: InstagramGalleryAsset) {
    if (!asset.selectable || preparedMediaIds.has(asset.id) || asset.unavailable) return
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(asset.id)) {
        next.delete(asset.id)
        setSelectionNotice(`${assetName(asset)} deselected.`)
      } else if (next.size >= MAX_SELECTED) {
        setSelectionNotice(`Selection limit reached. You can review up to ${MAX_SELECTED} works at a time.`)
        return current
      } else {
        next.add(asset.id)
        setSelectionNotice(`${assetName(asset)} selected. ${next.size} of ${MAX_SELECTED} selected.`)
      }
      if (!next.size) setRightsConfirmed(false)
      return next
    })
  }

  function clearSelection() {
    setSelected(new Set())
    setRightsConfirmed(false)
    setSelectionNotice("Selection cleared.")
  }

  function openPreview(asset: InstagramGalleryAsset, trigger: HTMLButtonElement) {
    previewTriggerRef.current = trigger
    setPreviewId(asset.id)
  }

  function closePreview() {
    setPreviewId("")
    window.requestAnimationFrame(() => previewTriggerRef.current?.focus())
  }

  async function prepareSelection() {
    if (!selected.size || !rightsConfirmed || working) return
    const requestedIds = [...selected]
    setWorking("prepare")
    setError("")
    setPrepareSummary(null)
    setNotice(`Preparing ${selected.size} selected work${selected.size === 1 ? "" : "s"} for review. Nothing will be added to your Creative Passport until you approve it.`)
    try {
      const result = await prepareInstagramImports({
        mediaIds: requestedIds,
        sessionId: sessionIdRef.current,
        rightsConfirmed: true,
      })
      const completed = result.results.flatMap((entry) => entry.ok ? [entry.item] : [])
      const failedIds = new Set<string>()
      for (const entry of result.results) {
        if ("mediaId" in entry) failedIds.add(entry.mediaId)
      }
      const merged = [...prepared]
      for (const item of completed) {
        const index = merged.findIndex((existing) => existing.sourceId === item.sourceId)
        if (index >= 0) merged[index] = item
        else merged.unshift(item)
      }
      setPrepared(merged)
      lastSavedRef.current = JSON.stringify(draftPayload(merged))
      setSelected(failedIds)
      setRightsConfirmed(failedIds.size > 0)
      setPrepareSummary({ completed: result.completed, failed: result.failed })
      setNotice(`${result.completed} work${result.completed === 1 ? "" : "s"} prepared as editable drafts.${result.failed ? ` ${result.failed} could not be prepared and remain selected for retry.` : ""}`)
      if (result.failed) setError("Some selected media could not be prepared. Refresh posts and retry the remaining selection.")
      if (result.completed) {
        window.requestAnimationFrame(() => {
          reviewSectionRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" })
          reviewHeadingRef.current?.focus({ preventScroll: true })
        })
      }
    } catch (reason) {
      setError(message(reason, "The selected Instagram images could not be prepared."))
      setNotice("")
    } finally {
      setWorking("")
    }
  }

  function editField(sourceId: string, name: keyof InstagramPreparedItem["fields"], value: string) {
    setPrepared((current) => current.map((item) => item.sourceId === sourceId ? updateInstagramPreparedField(item, name, value) : item))
    setSaveState("idle")
  }

  async function approve(item: InstagramPreparedItem) {
    if (working || item.approved) return
    setWorking(`approve:${item.sourceId}`)
    setError("")
    try {
      const result = await approveInstagramImport({ sourceId: item.sourceId, fields: confirmedInstagramFields(item) })
      setPrepared((current) => current.map((entry) => entry.sourceId === item.sourceId ? { ...entry, approved: true, portfolioWorkId: result.portfolioWorkId } : entry))
      setNotice(`${item.fields.title.value.trim()} was approved and added to the Creative Passport portfolio.`)
    } catch (reason) {
      setError(message(reason, "The artwork could not be approved."))
    } finally {
      setWorking("")
    }
  }

  async function removePrepared(item: InstagramPreparedItem) {
    if (item.approved || working || !window.confirm("Remove this unfinished Instagram import? Approved portfolio work will not be affected.")) return
    setWorking(`delete:${item.sourceId}`)
    setError("")
    try {
      await deleteInstagramImport(item.sourceId)
      const next = prepared.filter((entry) => entry.sourceId !== item.sourceId)
      setPrepared(next)
      lastSavedRef.current = JSON.stringify(draftPayload(next))
      setNotice("The unfinished Instagram import was removed.")
    } catch (reason) {
      setError(message(reason, "The unfinished import could not be removed."))
    } finally {
      setWorking("")
    }
  }

  async function disconnect() {
    if (working || !window.confirm("Disconnect Instagram from KLEIO? Private copies already prepared or approved will remain in your account.")) return
    setWorking("disconnect")
    setError("")
    try {
      await disconnectInstagram()
      setConnection((current) => current ? { ...current, connected: false, username: "", accountType: "", mediaCount: null, expiresAt: null, needsReconnect: false } : current)
      setGallery([])
      setGalleryPhase("idle")
      setSelected(new Set())
      setPreviewId("")
      setNotice("Instagram was disconnected. Your existing KLEIO imports remain private and available.")
    } catch (reason) {
      setError(message(reason, "Instagram could not be disconnected."))
    } finally {
      setWorking("")
    }
  }

  const isGalleryBusy = galleryPhase === "loading" || galleryPhase === "refreshing" || galleryPhase === "loading-more"

  if (!initialLocationResolved) {
    return (
      <section className="rounded-[28px] border border-[#E2DCF1] bg-white p-6 shadow-[0_22px_70px_rgba(82,64,130,0.07)]" aria-live="polite">
        <div className="flex items-center gap-3 text-sm font-semibold text-[#625C70]"><Loader2 className="size-4 animate-spin motion-reduce:animate-none" />Opening Instagram Import Studio…</div>
      </section>
    )
  }

  if (callbackCompletion) {
    const callbackCopy = callbackCompletion.success
      ? { title: "Instagram connected", body: `Instagram${callbackCompletion.username ? ` @${callbackCompletion.username}` : ""} is connected. You can close this window and continue in KLEIO.` }
      : callbackCompletion.result === "instagram_oauth_cancelled"
        ? { title: "Authorization cancelled", body: "Nothing was connected. You can close this window and continue in KLEIO." }
        : { title: "Instagram connection needs attention", body: "The connection was not completed. You can close this window and try again from KLEIO." }
    return (
      <section className="grid min-h-[420px] place-items-center rounded-[28px] border border-[#E2DCF1] bg-[#FCFBFE] p-6" aria-labelledby="instagram-callback-title">
        <div className="w-full max-w-md rounded-[24px] border border-[#E2DCF1] bg-white p-6 text-center shadow-[0_22px_70px_rgba(82,64,130,0.10)] sm:p-8">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#F1EDF8] text-[#5B4B8A]">{callbackCompletion.success ? <Check className="size-5" /> : <AlertTriangle className="size-5" />}</span>
          <h2 id="instagram-callback-title" className="mt-4 font-serif text-2xl font-semibold tracking-[-0.03em] text-[#292631]">{callbackCopy.title}</h2>
          <p className="mt-3 text-sm leading-6 text-[#746E80]">{callbackCopy.body}</p>
          <button type="button" className={`${primary} mt-5 w-full`} onClick={() => window.close()}>Close window</button>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-[28px] border border-[#E2DCF1] bg-white p-4 shadow-[0_22px_70px_rgba(82,64,130,0.07)] sm:p-7" aria-labelledby="instagram-import-title">
      <div className="max-w-3xl">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Connected import</p>
        <h2 id="instagram-import-title" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.03em]">Choose artwork from Instagram</h2>
        <p className="mt-3 text-sm leading-7 text-[#746E80]">Browse your connected account, preview individual works, and prepare only the media you choose. Every artwork remains an editable draft until you approve it.</p>
      </div>

      {(error || notice) && <div className={`mt-5 rounded-xl border p-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-[#E2DCF1] bg-[#F9F7FC] text-[#625C70]"}`} role={error ? "alert" : "status"} aria-live="polite">{error || notice}</div>}
      <p className="sr-only" role="status" aria-live="polite">{selectionNotice}</p>

      <div className="mt-5 rounded-2xl border border-[#E7E1F7] bg-[#FAF9FD] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#5B4B8A] shadow-sm"><InstagramMark /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-[#292631]">{connection?.connected ? `Connected as @${connection.username}` : "Instagram is not connected"}</p>
                {connection?.connected && <span className="inline-flex items-center gap-1 rounded-full border border-[#D8D0F2] bg-white px-2 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-[#75639E]"><ShieldCheck className="size-3" />Read only</span>}
              </div>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-[#746E80]">{connection?.connected ? "Only media you deliberately select is copied into KLEIO. KLEIO cannot post, message, or comment, or modify your Instagram account." : "Instagram will ask you to authorize read-only access to your eligible professional account."}</p>
              {connection?.connected && lastRefreshed ? <p className="mt-1 text-[0.68rem] text-[#8A8296]">Last refreshed {readableTime(lastRefreshed)}</p> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {connection?.connected ? <>
              <button type="button" className={secondary} disabled={Boolean(working) || isGalleryBusy} onClick={() => void refreshGallery(true)}>{galleryPhase === "refreshing" || galleryPhase === "loading" ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <RefreshCw className="size-4" />}Refresh posts</button>
              <button type="button" className={quiet} disabled={Boolean(working)} onClick={() => void disconnect()}><LogOut className="size-4" />Disconnect</button>
            </> : <button type="button" className={primary} disabled={Boolean(working) || oauthInProgress || connection?.configured === false} onClick={() => void connect()}>{working === "connect" || oauthInProgress ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <Instagram className="size-4" />}{oauthInProgress ? "Connecting Instagram…" : "Connect Instagram"}</button>}
          </div>
        </div>
      </div>

      {connection?.connected && <section className={`mt-7 ${selectedCount ? "pb-3" : ""}`} aria-labelledby="instagram-gallery-title" aria-busy={galleryPhase === "loading" || galleryPhase === "refreshing"}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#75639E]">1 · Select media</p>
            <h3 id="instagram-gallery-title" className="mt-1 font-serif text-2xl font-semibold">Your Instagram gallery</h3>
            <p className="mt-2 text-sm text-[#746E80]">Preview a work by opening its image. Use the checkbox to select it for preparation.</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-[#4F4660]" aria-live="polite">{selectedCount} of {MAX_SELECTED} selected</p>
            {selectedCount === MAX_SELECTED && <p className="mt-1 text-xs font-semibold text-amber-700">Selection limit reached</p>}
          </div>
        </div>

        {galleryPhase === "loading" && !gallery.length ? <><p className="sr-only" role="status">Loading Instagram posts</p><GallerySkeleton /></> : null}

        {galleryError && <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <span className="flex items-start gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{galleryError} Your current selection has been preserved.</span>
          <button type="button" className={secondary} onClick={() => void refreshGallery(true)}>Retry</button>
        </div>}

        {gallery.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2.5 max-[340px]:grid-cols-1 md:grid-cols-3 xl:grid-cols-4">
          {gallery.map((asset) => (
            <GalleryCard
              key={asset.id}
              asset={asset}
              selected={selected.has(asset.id)}
              prepared={preparedMediaIds.has(asset.id)}
              selectionDisabled={selectedCount >= MAX_SELECTED}
              onPreview={(trigger) => openPreview(asset, trigger)}
              onToggle={() => toggleAsset(asset)}
            />
          ))}
        </div>}

        {galleryPhase === "ready" && !gallery.length && <div className="mt-5 rounded-2xl border border-dashed border-[#D8D0F2] bg-[#FCFBFE] px-5 py-10 text-center">
          <ImageIcon className="mx-auto size-8 text-[#8C78BF]" />
          <h4 className="mt-3 font-serif text-xl font-semibold">No compatible media returned</h4>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#746E80]">KLEIO did not receive any available still images from this account. Refresh posts to try again.</p>
          <button type="button" className={`${secondary} mt-4`} onClick={() => void refreshGallery(true)}>Refresh posts</button>
        </div>}

        {gallery.length > 0 && <div className="mt-5 flex justify-center">
          {nextCursor ? <button type="button" className={secondary} disabled={isGalleryBusy} onClick={() => void refreshGallery(false)}>{galleryPhase === "loading-more" ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <ImagePlus className="size-4" />}Load more</button> : <p className="text-xs text-[#8A8296]">All available posts are shown.</p>}
        </div>}

        {selectedCount > 0 && <div className="sticky bottom-3 z-30 mt-6 rounded-2xl border border-[#CFC4E8] bg-white/95 p-3 shadow-[0_18px_60px_rgba(64,45,105,0.18)] backdrop-blur-md sm:p-4" aria-label="Instagram selection actions">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold text-[#292631]">{selectedCount} work{selectedCount === 1 ? "" : "s"} selected</p>
                <button type="button" className="text-xs font-semibold text-[#6A5896] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20" onClick={clearSelection}>Clear selection</button>
              </div>
              <label className="mt-2 flex max-w-2xl items-start gap-2 text-xs leading-5 text-[#625C70]"><input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[#5B4B8A]" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} /><span>I confirm that I own or have permission to copy these images into my private KLEIO workspace.</span></label>
            </div>
            <button type="button" className={`${primary} w-full lg:w-auto`} disabled={!rightsConfirmed || Boolean(working)} onClick={() => void prepareSelection()}>{working === "prepare" ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <ImagePlus className="size-4" />}{working === "prepare" ? "Preparing selected works…" : `Review ${selectedCount} selected work${selectedCount === 1 ? "" : "s"}`}</button>
          </div>
        </div>}
      </section>}

      {prepareSummary && <div className="mt-6 grid gap-3 sm:grid-cols-2" role="status" aria-live="polite">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><strong>{prepareSummary.completed}</strong> completed and ready for artist review.</div>
        {prepareSummary.failed > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>{prepareSummary.failed}</strong> could not be prepared and remain selected.</div>}
      </div>}

      {prepared.length > 0 && <section ref={reviewSectionRef} className="mt-8 scroll-mt-6 border-t border-[#E7E1F7] pt-7" aria-labelledby="instagram-review-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#75639E]">2 · Artist review</p>
            <h3 ref={reviewHeadingRef} tabIndex={-1} id="instagram-review-title" className="mt-1 font-serif text-2xl font-semibold outline-none">Confirm each artwork record</h3>
            <p className="mt-2 text-sm text-[#746E80]">These are private drafts. Edits autosave privately. Nothing reaches the Creative Passport until you approve it.</p>
          </div>
          <p role="status" className={`text-xs font-semibold ${saveState === "error" ? "text-amber-700" : "text-[#746E80]"}`}>{saveState === "saving" ? "Saving edits…" : saveState === "saved" ? "Edits saved" : saveState === "error" ? "Autosave needs attention" : `${preparedPending.length} awaiting approval`}</p>
        </div>
        <div className="mt-5 space-y-5">
          {prepared.map((item) => <article key={item.sourceId} className={`rounded-[24px] border p-4 sm:p-5 ${item.approved ? "border-emerald-200 bg-emerald-50/40" : "border-[#E2DCF1] bg-white"}`}>
            <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div><img src={item.previewUrl} alt={item.fields.altText.value || "Prepared Instagram artwork"} className="aspect-square w-full rounded-2xl bg-[#F2EFF7] object-contain" /><div className="mt-3 flex items-center justify-between gap-2"><span className="text-xs text-[#746E80]">{readableDate(item.timestamp)}</span>{item.permalink && <a href={item.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B4B8A]">Original post <ExternalLink className="size-3" /></a>}</div></div>
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-semibold"><span className="flex items-center justify-between gap-2">Artist-confirmed title <FieldStatus item={item} name="title" /></span><input className={input} disabled={item.approved} value={item.fields.title.value} onChange={(event) => editField(item.sourceId, "title", event.target.value)} /></label>
                  <label className="grid gap-1.5 text-xs font-semibold"><span className="flex items-center justify-between gap-2">Year <FieldStatus item={item} name="year" /></span><input className={input} disabled={item.approved} value={item.fields.year.value} onChange={(event) => editField(item.sourceId, "year", event.target.value)} /></label>
                  <label className="grid gap-1.5 text-xs font-semibold"><span className="flex items-center justify-between gap-2">Medium <FieldStatus item={item} name="medium" /></span><input className={input} disabled={item.approved} value={item.fields.medium.value} onChange={(event) => editField(item.sourceId, "medium", event.target.value)} /></label>
                  <label className="grid gap-1.5 text-xs font-semibold"><span className="flex items-center justify-between gap-2">Dimensions <FieldStatus item={item} name="dimensions" /></span><input className={input} disabled={item.approved} value={item.fields.dimensions.value} onChange={(event) => editField(item.sourceId, "dimensions", event.target.value)} /></label>
                  <label className="grid gap-1.5 text-xs font-semibold sm:col-span-2"><span className="flex items-center justify-between gap-2">Series <FieldStatus item={item} name="series" /></span><input className={input} disabled={item.approved} value={item.fields.series.value} onChange={(event) => editField(item.sourceId, "series", event.target.value)} /></label>
                  <label className="grid gap-1.5 text-xs font-semibold sm:col-span-2"><span className="flex items-center justify-between gap-2">Description <FieldStatus item={item} name="description" /></span><textarea className={textarea} disabled={item.approved} value={item.fields.description.value} onChange={(event) => editField(item.sourceId, "description", event.target.value)} /></label>
                  <label className="grid gap-1.5 text-xs font-semibold sm:col-span-2"><span className="flex items-center justify-between gap-2">Tags <FieldStatus item={item} name="tags" /></span><input className={input} disabled={item.approved} value={item.fields.tags.value} onChange={(event) => editField(item.sourceId, "tags", event.target.value)} /></label>
                  <label className="grid gap-1.5 text-xs font-semibold sm:col-span-2"><span className="flex items-center justify-between gap-2">Accessibility description <FieldStatus item={item} name="altText" /></span><textarea className={textarea} disabled={item.approved} value={item.fields.altText.value} onChange={(event) => editField(item.sourceId, "altText", event.target.value)} /></label>
                </div>
                <div className="flex flex-wrap justify-end gap-2">{item.approved ? <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-100 px-4 text-sm font-semibold text-emerald-800"><Check className="size-4" />Approved in portfolio</span> : <><button type="button" className={quiet} disabled={Boolean(working)} onClick={() => void removePrepared(item)}>{working === `delete:${item.sourceId}` ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <Trash2 className="size-4" />}Remove draft</button><button type="button" className={primary} disabled={!item.fields.title.value.trim() || Boolean(working)} onClick={() => void approve(item)}>{working === `approve:${item.sourceId}` ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <Check className="size-4" />}Approve artwork</button></>}</div>
              </div>
            </div>
          </article>)}
        </div>
      </section>}

      {previewAsset && <PreviewDialog
        asset={previewAsset}
        gallery={gallery}
        selected={selected.has(previewAsset.id)}
        prepared={preparedMediaIds.has(previewAsset.id)}
        selectionDisabled={selectedCount >= MAX_SELECTED}
        onClose={closePreview}
        onChange={(asset) => setPreviewId(asset.id)}
        onToggle={() => toggleAsset(previewAsset)}
      />}
    </section>
  )
}
