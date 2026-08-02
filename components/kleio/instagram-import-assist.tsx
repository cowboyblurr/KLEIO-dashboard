"use client"

/* eslint-disable @next/next/no-img-element -- Instagram previews are temporary, artist-authorized remote media */

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Camera,
  Check,
  ExternalLink,
  ImagePlus,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import {
  approveInstagramImport,
  confirmedInstagramFields,
  deleteInstagramImport,
  disconnectInstagram,
  flattenInstagramMedia,
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
const input = "min-h-11 w-full rounded-xl border border-[#DED7EF] bg-white px-3 py-2 text-sm text-[#292631] outline-none transition focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12 disabled:bg-[#F7F5FA]"
const textarea = `${input} min-h-24 resize-y leading-6`
const callbackOrigin = "https://trekynurdgxgtaaqqtyq.supabase.co"
const MAX_SELECTED = 20

type SaveState = "idle" | "saving" | "saved" | "error"
type OAuthMessage = { type?: string; success?: boolean; username?: string; message?: string }

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

function message(reason: unknown, fallback: string) {
  return reason instanceof Error && reason.message ? reason.message : fallback
}

function FieldStatus({ item, name }: { item: InstagramPreparedItem; name: keyof InstagramPreparedItem["fields"] }) {
  const field = item.fields[name]
  const label = field.status === "extracted" ? "From caption" : field.status === "suggested" ? "Suggested" : field.status === "edited" ? "Edited" : field.status === "confirmed" ? "Confirmed" : "Add details"
  return <span className="rounded-full border border-[#E2DCF1] bg-[#FAF9FD] px-2 py-1 text-[0.65rem] font-semibold text-[#756F80]">{label}</span>
}

export function InstagramImportAssist() {
  const [connection, setConnection] = useState<InstagramConnectionStatus | null>(null)
  const [gallery, setGallery] = useState<InstagramGalleryAsset[]>([])
  const [nextCursor, setNextCursor] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [prepared, setPrepared] = useState<InstagramPreparedItem[]>([])
  const [rightsConfirmed, setRightsConfirmed] = useState(false)
  const [working, setWorking] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const sessionIdRef = useRef(crypto.randomUUID())
  const lastSavedRef = useRef("")
  const hydratedRef = useRef(false)
  const oauthStartRef = useRef(false)
  const oauthPopupRef = useRef<Window | null>(null)
  const oauthMonitorRef = useRef<number | null>(null)
  const [oauthInProgress, setOauthInProgress] = useState(false)

  const selectedCount = selected.size
  const preparedPending = useMemo(() => prepared.filter((item) => !item.approved), [prepared])

  async function refreshPrepared() {
    const result = await loadInstagramPreparedImports()
    setPrepared(result.items)
    lastSavedRef.current = JSON.stringify(draftPayload(result.items))
    hydratedRef.current = true
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
      await Promise.all([refreshConnection(false), refreshPrepared()])
    } catch (reason) {
      setError(message(reason, "Instagram import could not be restored."))
    } finally {
      setWorking("")
    }
  }

  useEffect(() => { void hydrate() }, [])

  useEffect(() => {
    function finishAttempt() {
      oauthStartRef.current = false
      oauthPopupRef.current = null
      if (oauthMonitorRef.current !== null) window.clearInterval(oauthMonitorRef.current)
      oauthMonitorRef.current = null
      setOauthInProgress(false)
    }
    function receive(event: MessageEvent<OAuthMessage>) {
      if (event.origin !== callbackOrigin || event.data?.type !== "kleio-instagram-oauth") return
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
    return setError("Allow pop-ups for KLEIO, then try Connect Instagram again.")
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

async function refreshGallery(reset: boolean) {
    if (working) return
    setWorking("gallery")
    setError("")
    try {
      const result = await loadInstagramMedia(reset ? "" : nextCursor)
      const assets = flattenInstagramMedia(result.items)
      setGallery((current) => reset ? assets : [...current, ...assets.filter((asset) => !current.some((existing) => existing.id === asset.id))])
      setNextCursor(result.nextCursor)
      setNotice(assets.length ? "Choose only the posts or carousel images that represent artwork you want inside KLEIO." : "No additional Instagram media was found.")
    } catch (reason) {
      setError(message(reason, "Instagram media could not be loaded."))
    } finally {
      setWorking("")
    }
  }

  function toggleAsset(asset: InstagramGalleryAsset) {
    if (!asset.selectable) return
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(asset.id)) next.delete(asset.id)
      else if (next.size < MAX_SELECTED) next.add(asset.id)
      return next
    })
  }

  async function prepareSelection() {
    if (!selected.size || !rightsConfirmed || working) return
    setWorking("prepare")
    setError("")
    setNotice(`Preparing ${selected.size} selected image${selected.size === 1 ? "" : "s"} privately…`)
    try {
      const result = await prepareInstagramImports({
        mediaIds: [...selected],
        sessionId: sessionIdRef.current,
        rightsConfirmed: true,
      })
      const completed = result.results.flatMap((entry) => entry.ok ? [entry.item] : [])
      const merged = [...prepared]
      for (const item of completed) {
        const index = merged.findIndex((existing) => existing.sourceId === item.sourceId)
        if (index >= 0) merged[index] = item
        else merged.unshift(item)
      }
      setPrepared(merged)
      lastSavedRef.current = JSON.stringify(draftPayload(merged))
      setSelected(new Set())
      setRightsConfirmed(false)
      setNotice(`${result.completed} Instagram image${result.completed === 1 ? "" : "s"} prepared for review.${result.failed ? ` ${result.failed} could not be copied.` : ""}`)
      if (result.failed) setError("Some selected media could not be prepared. Refresh Instagram and try those items again.")
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
      setSelected(new Set())
      setNotice("Instagram was disconnected. Your existing KLEIO imports remain private and available.")
    } catch (reason) {
      setError(message(reason, "Instagram could not be disconnected."))
    } finally {
      setWorking("")
    }
  }

  return (
    <section className="rounded-[28px] border border-[#E2DCF1] bg-white p-5 shadow-[0_22px_70px_rgba(82,64,130,0.07)] sm:p-7" aria-labelledby="instagram-import-title">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Connected import</p>
          <h2 id="instagram-import-title" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.03em]">Choose artwork from Instagram</h2>
          <p className="mt-3 text-sm leading-7 text-[#746E80]">Connect a public Creator or Business account, choose specific posts, and review every prepared artwork record before it enters your Creative Passport.</p>
        </div>
        <div className="grid gap-2 text-xs font-semibold text-[#625C70]">
          <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-[#6A5896]" />Read-only connection</span>
          <span className="inline-flex items-center gap-2"><Check className="size-4 text-[#6A5896]" />KLEIO cannot post, message, or comment</span>
        </div>
      </div>

      {(error || notice) && <div className={`mt-5 rounded-xl border p-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-[#E2DCF1] bg-[#F9F7FC] text-[#625C70]"}`} role={error ? "alert" : "status"} aria-live="polite">{error || notice}</div>}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E7E1F7] bg-[#FAF9FD] p-4">
        <div>
          <p className="text-sm font-semibold text-[#292631]">{connection?.connected ? `Connected as @${connection.username}` : "Instagram is not connected"}</p>
          <p className="mt-1 text-xs leading-5 text-[#746E80]">{connection?.connected ? "Only media you deliberately select is copied into KLEIO." : "Instagram will ask you to authorize access to your own professional account."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {connection?.connected ? <>
            <button type="button" className={secondary} disabled={Boolean(working)} onClick={() => void refreshGallery(true)}>{working === "gallery" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}Open media gallery</button>
            <button type="button" className={quiet} disabled={Boolean(working)} onClick={() => void disconnect()}><LogOut className="size-4" />Disconnect</button>
          </> : <button type="button" className={primary} disabled={Boolean(working) || oauthInProgress || connection?.configured === false} onClick={() => void connect()}>{working === "connect" || oauthInProgress ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}{oauthInProgress ? "Connecting Instagram…" : "Connect Instagram"}</button>}
        </div>
      </div>

      {gallery.length > 0 && <section className="mt-7" aria-labelledby="instagram-gallery-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#75639E]">1 · Select media</p><h3 id="instagram-gallery-title" className="mt-1 font-serif text-2xl font-semibold">Your Instagram gallery</h3><p className="mt-2 text-sm text-[#746E80]">{selectedCount} of {MAX_SELECTED} selected. Videos remain visible for context but still-image import is the initial beta format.</p></div>
          <button type="button" className={secondary} disabled={!nextCursor || Boolean(working)} onClick={() => void refreshGallery(false)}>{working === "gallery" ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}Load more</button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {gallery.map((asset) => {
            const active = selected.has(asset.id)
            return <article key={asset.id} className={`overflow-hidden rounded-2xl border bg-white ${active ? "border-[#8C78BF] ring-2 ring-[#A997E8]/25" : "border-[#E7E1F7]"}`}>
              <button type="button" className="relative aspect-square w-full bg-[#F2EFF7] text-left disabled:cursor-not-allowed" disabled={!asset.selectable} aria-pressed={active} onClick={() => toggleAsset(asset)}>
                <img src={asset.imageUrl} alt="Instagram media preview" referrerPolicy="no-referrer" className="size-full object-cover" />
                <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/95 shadow-sm">{asset.selectable ? active ? <Check className="size-4 text-[#5B4B8A]" /> : <span className="size-2 rounded-full bg-[#756F80]" /> : <span className="text-[0.6rem] font-bold">VIDEO</span>}</span>
              </button>
              <div className="p-3"><p className="line-clamp-2 text-xs leading-5 text-[#746E80]">{asset.caption || "No caption"}</p><div className="mt-2 flex items-center justify-between gap-2"><span className="text-[0.68rem] text-[#8A8296]">{readableDate(asset.timestamp)}</span>{asset.permalink && <a href={asset.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-[#5B4B8A]">View <ExternalLink className="size-3" /></a>}</div></div>
            </article>
          })}
        </div>
        <label className="mt-4 flex items-start gap-3 rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] p-3 text-xs leading-5"><input type="checkbox" className="mt-0.5 size-4 accent-[#5B4B8A]" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} /><span>I confirm that I own or have permission to copy the selected images and use them in my private KLEIO profile and applications.</span></label>
        <div className="mt-3 flex justify-end"><button type="button" className={primary} disabled={!selectedCount || !rightsConfirmed || Boolean(working)} onClick={() => void prepareSelection()}>{working === "prepare" ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}Prepare {selectedCount || "selected"} for review</button></div>
      </section>}

      {prepared.length > 0 && <section className="mt-8 border-t border-[#E7E1F7] pt-7" aria-labelledby="instagram-review-title">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#75639E]">2 · Artist review</p><h3 id="instagram-review-title" className="mt-1 font-serif text-2xl font-semibold">Confirm each artwork record</h3><p className="mt-2 text-sm text-[#746E80]">Edits autosave privately. Nothing reaches the portfolio until you approve it.</p></div><p role="status" className={`text-xs font-semibold ${saveState === "error" ? "text-amber-700" : "text-[#746E80]"}`}>{saveState === "saving" ? "Saving edits…" : saveState === "saved" ? "Edits saved" : saveState === "error" ? "Autosave needs attention" : `${preparedPending.length} awaiting approval`}</p></div>
        <div className="mt-5 space-y-5">
          {prepared.map((item) => <article key={item.sourceId} className={`rounded-[24px] border p-4 sm:p-5 ${item.approved ? "border-emerald-200 bg-emerald-50/40" : "border-[#E2DCF1] bg-white"}`}>
            <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div><img src={item.previewUrl} alt={item.fields.altText.value || "Prepared Instagram artwork"} className="aspect-square w-full rounded-2xl bg-[#F2EFF7] object-cover" /><div className="mt-3 flex items-center justify-between gap-2"><span className="text-xs text-[#746E80]">{readableDate(item.timestamp)}</span>{item.permalink && <a href={item.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B4B8A]">Original post <ExternalLink className="size-3" /></a>}</div></div>
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
                <div className="flex flex-wrap justify-end gap-2">{item.approved ? <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-100 px-4 text-sm font-semibold text-emerald-800"><Check className="size-4" />Approved in portfolio</span> : <><button type="button" className={quiet} disabled={Boolean(working)} onClick={() => void removePrepared(item)}>{working === `delete:${item.sourceId}` ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}Remove draft</button><button type="button" className={primary} disabled={!item.fields.title.value.trim() || Boolean(working)} onClick={() => void approve(item)}>{working === `approve:${item.sourceId}` ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Approve artwork</button></>}</div>
              </div>
            </div>
          </article>)}
        </div>
      </section>}
    </section>
  )
}
