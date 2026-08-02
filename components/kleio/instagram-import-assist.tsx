"use client"

/* eslint-disable @next/next/no-img-element -- Instagram previews are temporary, artist-authorized remote media */

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Eye,
  ExternalLink,
  ImageIcon,
  ImagePlus,
  Library,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
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
import { loadArtistPassport, saveArtistPassport } from "@/lib/kleio-live-data"
import {
  assetName,
  GalleryCard,
  FieldStatus,
  GallerySkeleton,
  InstagramMark,
  PreviewDialog,
} from "@/components/kleio/instagram-import-gallery-ui"
import {
  buildInstagramPracticeInsights,
  confirmedInsightSummary,
  splitInsightList,
  uniqueInsightValues,
  type PracticeInsight,
  type PracticeInsightKey,
} from "@/components/kleio/instagram-practice-insights"

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const quiet = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#746E80] transition hover:bg-[#F7F4FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:opacity-50"
const input = "min-h-11 w-full rounded-xl border border-[#DED7EF] bg-white px-3 py-2 text-sm text-[#292631] outline-none transition focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12 disabled:bg-[#F7F5FA]"
const textarea = `${input} min-h-24 resize-y leading-6`
const callbackOrigin = "https://trekynurdgxgtaaqqtyq.supabase.co"
const MAX_SELECTED = 20

type SaveState = "idle" | "saving" | "saved" | "error"
type GalleryPhase = "idle" | "loading" | "refreshing" | "loading-more" | "ready" | "error"
type OAuthMessage = { type?: string; success?: boolean; username?: string; message?: string }
type CallbackCompletion = { result: string; username: string; success: boolean } | null
type PreparationSummary = { completed: number; failed: number } | null
type CompletionSummary = {
  worksSaved: number
  portfolioCount: number
  privateCount: number
  passportUpdated: boolean
  failedCount: number
} | null

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

export function InstagramImportAssist() {
  const [connection, setConnection] = useState<InstagramConnectionStatus | null>(null)
  const [gallery, setGallery] = useState<InstagramGalleryAsset[]>([])
  const [galleryPhase, setGalleryPhase] = useState<GalleryPhase>("idle")
  const [galleryError, setGalleryError] = useState("")
  const [nextCursor, setNextCursor] = useState("")
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [prepared, setPrepared] = useState<InstagramPreparedItem[]>([])
  const [includeInPortfolio, setIncludeInPortfolio] = useState<Set<string>>(new Set())
  const [practiceInsights, setPracticeInsights] = useState<PracticeInsight[]>([])
  const [applyInsightsToPassport, setApplyInsightsToPassport] = useState(false)
  const [previewId, setPreviewId] = useState("")
  const [rightsConfirmed, setRightsConfirmed] = useState(false)
  const [working, setWorking] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [selectionNotice, setSelectionNotice] = useState("")
  const [prepareSummary, setPrepareSummary] = useState<PreparationSummary>(null)
  const [completionSummary, setCompletionSummary] = useState<CompletionSummary>(null)
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
  const completionRef = useRef<HTMLDivElement | null>(null)
  const [oauthInProgress, setOauthInProgress] = useState(false)
  const [initialLocationResolved, setInitialLocationResolved] = useState(false)
  const [callbackCompletion, setCallbackCompletion] = useState<CallbackCompletion>(null)

  const selectedCount = selected.size
  const preparedPending = useMemo(() => prepared.filter((item) => !item.approved), [prepared])
  const preparedMediaIds = useMemo(() => new Set(prepared.map(instagramPreparedMediaId)), [prepared])
  const previewAsset = useMemo(() => gallery.find((asset) => asset.id === previewId) || null, [gallery, previewId])
  const selectedAssets = useMemo(() => gallery.filter((asset) => selected.has(asset.id)), [gallery, selected])
  const selectedInsightsCount = practiceInsights.filter((item) => item.selected && !item.dismissed && item.value.trim()).length
  const portfolioPending = preparedPending.filter((item) => includeInPortfolio.has(item.sourceId))
  const missingPortfolioTitles = portfolioPending.filter((item) => !item.fields.title.value.trim())

  async function refreshGallery(reset: boolean) {
    if (["loading", "refreshing", "loading-more"].includes(galleryPhase)) return
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
      setPracticeInsights(buildInstagramPracticeInsights(preparedResult.items.filter((item) => !item.approved)))
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
    const payload: OAuthMessage = { type: "kleio-instagram-oauth", success, username, message: result }
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
        setNotice(`Instagram${event.data.username ? ` @${event.data.username}` : ""} is connected. Choose the works you want KLEIO to organize.`)
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
      const completionUrl = new URL("/artist-dashboard/import/instagram-complete/", window.location.origin)
      const { authorizeUrl } = await startInstagramConnection(completionUrl.href)
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
        setSelectionNotice(`Selection limit reached. You can organize up to ${MAX_SELECTED} works at a time.`)
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
    setCompletionSummary(null)
    setNotice(`KLEIO is preparing ${selected.size} artwork record${selected.size === 1 ? "" : "s"} and identifying patterns from available captions and details. Everything remains private until you choose otherwise.`)
    try {
      const result = await prepareInstagramImports({ mediaIds: requestedIds, sessionId: sessionIdRef.current, rightsConfirmed: true })
      const completed = result.results.flatMap((entry) => entry.ok ? [entry.item] : [])
      const failedIds = new Set<string>()
      for (const entry of result.results) if ("mediaId" in entry) failedIds.add(entry.mediaId)
      const merged = [...prepared]
      for (const item of completed) {
        const index = merged.findIndex((existing) => existing.sourceId === item.sourceId)
        if (index >= 0) merged[index] = item
        else merged.unshift(item)
      }
      setPrepared(merged)
      setPracticeInsights(buildInstagramPracticeInsights(merged.filter((item) => !item.approved)))
      lastSavedRef.current = JSON.stringify(draftPayload(merged))
      setSelected(failedIds)
      setRightsConfirmed(failedIds.size > 0)
      setPrepareSummary({ completed: result.completed, failed: result.failed })
      setNotice(`${result.completed} work${result.completed === 1 ? "" : "s"} added privately to your KLEIO Media Library.${result.failed ? ` ${result.failed} could not be prepared and remain selected for retry.` : ""}`)
      if (result.failed) setError("Some selected media could not be prepared. The successful works were preserved.")
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

  function togglePortfolio(sourceId: string) {
    setIncludeInPortfolio((current) => {
      const next = new Set(current)
      if (next.has(sourceId)) next.delete(sourceId)
      else next.add(sourceId)
      return next
    })
  }

  function includeAllTitledWorks() {
    setIncludeInPortfolio(new Set(preparedPending.filter((item) => item.fields.title.value.trim()).map((item) => item.sourceId)))
  }

  function updateInsight(id: PracticeInsightKey, patch: Partial<PracticeInsight>) {
    setPracticeInsights((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item))
  }

  async function applyConfirmedInsights() {
    const selectedInsights = practiceInsights.filter((item) => item.selected && !item.dismissed && item.value.trim())
    if (!applyInsightsToPassport || !selectedInsights.length) return false
    const profile = await loadArtistPassport()
    if (!profile) throw new Error("Complete the basic Creative Passport profile before applying practice insights.")
    const disciplines = uniqueInsightValues([...profile.disciplines, ...splitInsightList(selectedInsights.find((item) => item.id === "disciplines")?.value || "")])
    const mediums = uniqueInsightValues([...profile.mediums, ...splitInsightList(selectedInsights.find((item) => item.id === "mediums")?.value || "")])
    const addition = confirmedInsightSummary(selectedInsights)
    const practiceDescription = addition && !profile.practice_description.includes(addition)
      ? [profile.practice_description.trim(), addition].filter(Boolean).join("\n\n")
      : profile.practice_description
    await saveArtistPassport({
      ...profile,
      disciplines,
      mediums,
      practice_description: practiceDescription,
      disciplines_text: disciplines.join(", "),
      mediums_text: mediums.join(", "),
      languages_text: profile.languages.join(", "),
    })
    return true
  }

  async function saveWorksToKleio() {
    if (working || !preparedPending.length) return
    setWorking("save-all")
    setError("")
    setCompletionSummary(null)
    try {
      const payload = draftPayload(prepared)
      await saveInstagramPreparedDrafts(payload)
      lastSavedRef.current = JSON.stringify(payload)
      setSaveState("saved")

      if (missingPortfolioTitles.length) {
        setError(`${missingPortfolioTitles.length} work${missingPortfolioTitles.length === 1 ? " needs" : "s need"} a title before portfolio display. Add a title or switch the work to Keep private.`)
        return
      }

      const approvedResults: Array<{ sourceId: string; portfolioWorkId: string }> = []
      const failed: string[] = []
      for (const item of portfolioPending) {
        try {
          const result = await approveInstagramImport({ sourceId: item.sourceId, fields: confirmedInstagramFields(item) })
          approvedResults.push({ sourceId: item.sourceId, portfolioWorkId: result.portfolioWorkId })
        } catch {
          failed.push(item.fields.title.value.trim() || "Untitled work")
        }
      }

      const approvedBySource = new Map(approvedResults.map((item) => [item.sourceId, item.portfolioWorkId]))
      const nextPrepared = prepared.map((item) => approvedBySource.has(item.sourceId)
        ? { ...item, approved: true, portfolioWorkId: approvedBySource.get(item.sourceId) }
        : item)
      setPrepared(nextPrepared)
      setIncludeInPortfolio((current) => new Set([...current].filter((sourceId) => !approvedBySource.has(sourceId))))

      let passportUpdated = false
      try {
        passportUpdated = await applyConfirmedInsights()
      } catch (reason) {
        setError(message(reason, "Works were saved, but the selected Creative Passport insights could not be applied."))
      }

      const remainingPrivate = nextPrepared.filter((item) => !item.approved).length
      setCompletionSummary({
        worksSaved: preparedPending.length,
        portfolioCount: approvedResults.length,
        privateCount: remainingPrivate,
        passportUpdated,
        failedCount: failed.length,
      })
      setPrepareSummary(null)
      if (failed.length) setError(`${failed.length} portfolio work${failed.length === 1 ? "" : "s"} could not be added. Private Media Library records were preserved.`)
      else setNotice("Your work is organized in KLEIO. Private records, portfolio choices, and confirmed Passport insights were handled in one save.")
      window.requestAnimationFrame(() => completionRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" }))
    } catch (reason) {
      setError(message(reason, "KLEIO could not finish saving these works."))
    } finally {
      setWorking("")
    }
  }

  async function removePrepared(item: InstagramPreparedItem) {
    if (item.approved || working || !window.confirm("Remove this private Instagram artwork record from KLEIO?")) return
    setWorking(`delete:${item.sourceId}`)
    setError("")
    try {
      await deleteInstagramImport(item.sourceId)
      const next = prepared.filter((entry) => entry.sourceId !== item.sourceId)
      setPrepared(next)
      setIncludeInPortfolio((current) => { const updated = new Set(current); updated.delete(item.sourceId); return updated })
      setPracticeInsights(buildInstagramPracticeInsights(next.filter((entry) => !entry.approved)))
      lastSavedRef.current = JSON.stringify(draftPayload(next))
      setNotice("The private artwork record was removed.")
    } catch (reason) {
      setError(message(reason, "The private artwork record could not be removed."))
    } finally {
      setWorking("")
    }
  }

  async function disconnect() {
    if (working || !window.confirm("Disconnect Instagram from KLEIO? Work already saved in KLEIO will remain available.")) return
    setWorking("disconnect")
    setError("")
    try {
      await disconnectInstagram()
      setConnection((current) => current ? { ...current, connected: false, username: "", accountType: "", mediaCount: null, expiresAt: null, needsReconnect: false } : current)
      setGallery([])
      setGalleryPhase("idle")
      setSelected(new Set())
      setPreviewId("")
      setNotice("Instagram was disconnected. Existing KLEIO artwork records remain available.")
    } catch (reason) {
      setError(message(reason, "Instagram could not be disconnected."))
    } finally {
      setWorking("")
    }
  }

  const isGalleryBusy = ["loading", "refreshing", "loading-more"].includes(galleryPhase)

  if (!initialLocationResolved) {
    return <section className="rounded-[28px] border border-[#E2DCF1] bg-white p-6 shadow-[0_22px_70px_rgba(82,64,130,0.07)]" aria-live="polite">
      <div className="flex items-center gap-3 text-sm font-semibold text-[#625C70]"><Loader2 className="size-4 animate-spin motion-reduce:animate-none" />Opening Instagram Import Studio…</div>
    </section>
  }

  if (callbackCompletion) {
    const callbackCopy = callbackCompletion.success
      ? { title: "Instagram connected", body: `Instagram${callbackCompletion.username ? ` @${callbackCompletion.username}` : ""} is connected. You can close this window and continue in KLEIO.` }
      : callbackCompletion.result === "instagram_oauth_cancelled"
        ? { title: "Authorization cancelled", body: "Nothing was connected. You can close this window and continue in KLEIO." }
        : { title: "Instagram connection needs attention", body: "The connection was not completed. You can close this window and try again from KLEIO." }
    return <section className="grid min-h-[420px] place-items-center rounded-[28px] border border-[#E2DCF1] bg-[#FCFBFE] p-6" aria-labelledby="instagram-callback-title">
      <div className="w-full max-w-md rounded-[24px] border border-[#E2DCF1] bg-white p-6 text-center shadow-[0_22px_70px_rgba(82,64,130,0.10)] sm:p-8">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#F1EDF8] text-[#5B4B8A]">{callbackCompletion.success ? <Check className="size-5" /> : <AlertTriangle className="size-5" />}</span>
        <h2 id="instagram-callback-title" className="mt-4 font-serif text-2xl font-semibold tracking-[-0.03em] text-[#292631]">{callbackCopy.title}</h2>
        <p className="mt-3 text-sm leading-6 text-[#746E80]">{callbackCopy.body}</p>
        <button type="button" className={`${primary} mt-5 w-full`} onClick={() => window.close()}>Close window</button>
      </div>
    </section>
  }

  return (
    <section className="rounded-[28px] border border-[#E2DCF1] bg-white p-4 shadow-[0_22px_70px_rgba(82,64,130,0.07)] sm:p-7" aria-labelledby="instagram-import-title">
      <div className="max-w-3xl">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Connected artwork source</p>
        <h2 id="instagram-import-title" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.03em]">Turn Instagram works into reusable KLEIO records</h2>
        <p className="mt-3 text-sm leading-7 text-[#746E80]">Choose the works that represent your practice. KLEIO saves them privately once, prepares editable artwork details, surfaces source-based practice patterns, and lets you decide which works appear in your portfolio.</p>
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
              <p className="mt-1 max-w-2xl text-xs leading-5 text-[#746E80]">{connection?.connected ? "Only media you deliberately select is copied into your private KLEIO Media Library. KLEIO cannot post, message, comment, or modify Instagram." : "Instagram will ask you to authorize read-only access to your eligible professional account."}</p>
              {connection?.connected && lastRefreshed ? <p className="mt-1 text-[0.68rem] text-[#8A8296]">Last refreshed {readableTime(lastRefreshed)}</p> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {connection?.connected ? <>
              <button type="button" className={secondary} disabled={Boolean(working) || isGalleryBusy} onClick={() => void refreshGallery(true)}>{galleryPhase === "refreshing" || galleryPhase === "loading" ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <RefreshCw className="size-4" />}Refresh posts</button>
              <button type="button" className={quiet} disabled={Boolean(working)} onClick={() => void disconnect()}><LogOut className="size-4" />Disconnect</button>
            </> : <button type="button" className={primary} disabled={Boolean(working) || oauthInProgress || connection?.configured === false} onClick={() => void connect()}>{working === "connect" || oauthInProgress ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <InstagramMark />}{oauthInProgress ? "Connecting Instagram…" : "Connect Instagram"}</button>}
          </div>
        </div>
      </div>

      {connection?.connected && <section className={`mt-7 ${selectedCount ? "pb-3" : ""}`} aria-labelledby="instagram-gallery-title" aria-busy={galleryPhase === "loading" || galleryPhase === "refreshing"}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#75639E]">1 · Select works</p>
            <h3 id="instagram-gallery-title" className="mt-1 font-serif text-2xl font-semibold">Your Instagram gallery</h3>
            <p className="mt-2 text-sm text-[#746E80]">Choose works you want KLEIO to organize, reuse, and optionally display in your portfolio.</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-[#4F4660]" aria-live="polite">{selectedCount} of {MAX_SELECTED} selected</p>
            {selectedCount === MAX_SELECTED && <p className="mt-1 text-xs font-semibold text-amber-700">Selection limit reached</p>}
          </div>
        </div>
        {galleryPhase === "loading" && !gallery.length ? <><p className="sr-only" role="status">Loading Instagram posts</p><GallerySkeleton /></> : null}
        {galleryError && <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between" role="alert"><span className="flex items-start gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{galleryError} Your current selection has been preserved.</span><button type="button" className={secondary} onClick={() => void refreshGallery(true)}>Retry</button></div>}
        {gallery.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2.5 max-[340px]:grid-cols-1 md:grid-cols-3 xl:grid-cols-4">{gallery.map((asset) => <GalleryCard key={asset.id} asset={asset} selected={selected.has(asset.id)} saved={preparedMediaIds.has(asset.id)} selectionDisabled={selectedCount >= MAX_SELECTED} onPreview={(trigger) => openPreview(asset, trigger)} onToggle={() => toggleAsset(asset)} />)}</div>}
        {galleryPhase === "ready" && !gallery.length && <div className="mt-5 rounded-2xl border border-dashed border-[#D8D0F2] bg-[#FCFBFE] px-5 py-10 text-center"><ImageIcon className="mx-auto size-8 text-[#8C78BF]" /><h4 className="mt-3 font-serif text-xl font-semibold">No compatible media returned</h4><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#746E80]">KLEIO did not receive any available still images from this account. Refresh posts to try again.</p><button type="button" className={`${secondary} mt-4`} onClick={() => void refreshGallery(true)}>Refresh posts</button></div>}
        {gallery.length > 0 && <div className="mt-5 flex justify-center">{nextCursor ? <button type="button" className={secondary} disabled={isGalleryBusy} onClick={() => void refreshGallery(false)}>{galleryPhase === "loading-more" ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <ImagePlus className="size-4" />}Load more</button> : <p className="text-xs text-[#8A8296]">All available posts are shown.</p>}</div>}

        {selectedCount > 0 && <div className="sticky bottom-3 z-30 mt-6 rounded-2xl border border-[#CFC4E8] bg-white/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-[0_18px_60px_rgba(64,45,105,0.18)] backdrop-blur-md sm:p-4" aria-label="Instagram selection actions">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3"><p className="text-sm font-semibold text-[#292631]">{selectedCount} work{selectedCount === 1 ? "" : "s"} selected</p><button type="button" className="text-xs font-semibold text-[#6A5896] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20" onClick={clearSelection}>Clear selection</button></div>
              {selectedAssets.length > 0 && <div className="mt-2 flex max-w-md gap-1.5 overflow-x-auto pb-1" aria-label="Selected work previews">{selectedAssets.slice(0, 8).map((asset) => <img key={asset.id} src={asset.imageUrl} alt="" className="size-10 shrink-0 rounded-lg border border-[#E7E1F7] bg-[#F2EFF7] object-cover" referrerPolicy="no-referrer" />)}{selectedAssets.length > 8 && <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#F1EDF8] text-xs font-semibold text-[#5B4B8A]">+{selectedAssets.length - 8}</span>}</div>}
              <label className="mt-2 flex max-w-2xl items-start gap-2 text-xs leading-5 text-[#625C70]"><input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[#5B4B8A]" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} /><span>I confirm that I own or have permission to copy these images into my private KLEIO workspace.</span></label>
            </div>
            <button type="button" className={`${primary} w-full lg:w-auto`} disabled={!rightsConfirmed || Boolean(working)} onClick={() => void prepareSelection()}>{working === "prepare" ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <Sparkles className="size-4" />}{working === "prepare" ? "Preparing your artwork…" : `Continue with ${selectedCount} selected work${selectedCount === 1 ? "" : "s"}`}</button>
          </div>
        </div>}
      </section>}

      {prepareSummary && <div className="mt-6 grid gap-3 sm:grid-cols-2" role="status" aria-live="polite"><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><strong>{prepareSummary.completed}</strong> added privately and ready to review.</div>{prepareSummary.failed > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>{prepareSummary.failed}</strong> could not be prepared and remain selected.</div>}</div>}

      {prepared.length > 0 && <section ref={reviewSectionRef} className="mt-8 scroll-mt-6 border-t border-[#E7E1F7] pt-7" aria-labelledby="instagram-review-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#75639E]">2 · Review once</p><h3 ref={reviewHeadingRef} tabIndex={-1} id="instagram-review-title" className="mt-1 font-serif text-2xl font-semibold outline-none">Confirm the essentials and choose portfolio visibility</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-[#746E80]">Every prepared image is already a private Media Library record. Confirm only what is useful now, choose which titled works appear in your portfolio, and save the entire group once.</p></div>
          <p role="status" className={`text-xs font-semibold ${saveState === "error" ? "text-amber-700" : "text-[#746E80]"}`}>{saveState === "saving" ? "Saving private edits…" : saveState === "saved" ? "Private edits saved" : saveState === "error" ? "Autosave needs attention" : `${preparedPending.length} private record${preparedPending.length === 1 ? "" : "s"} ready`}</p>
        </div>

        {practiceInsights.length > 0 && <section className="mt-5 rounded-[24px] border border-[#DED7EF] bg-[linear-gradient(145deg,#F8F5FF,#FFFFFF)] p-4 sm:p-5" aria-labelledby="instagram-practice-insights-title">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Private suggestions</p><h4 id="instagram-practice-insights-title" className="mt-1 font-serif text-xl font-semibold">Practice insights from this group of works</h4><p className="mt-2 text-xs leading-5 text-[#746E80]">These suggestions use available captions, dates, tags, and artwork details. They are not verified visual judgments. Edit, select, or dismiss each suggestion before anything can update your Creative Passport.</p></div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D8D0F2] bg-white px-3 py-1.5 text-xs font-semibold text-[#625C70]"><Sparkles className="size-4 text-[#6A5896]" />{selectedInsightsCount} selected</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">{practiceInsights.filter((item) => !item.dismissed).map((item) => <article key={item.id} className={`rounded-2xl border p-3 ${item.selected ? "border-[#A997E8] bg-white" : "border-[#E7E1F7] bg-white/75"}`}><div className="flex items-start gap-2"><label className="flex min-w-0 flex-1 items-start gap-2"><input type="checkbox" className="mt-1 size-4 shrink-0 accent-[#5B4B8A]" checked={item.selected} onChange={(event) => updateInsight(item.id, { selected: event.target.checked })} /><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-[#292631]">{item.label}</span><textarea className="mt-2 min-h-20 w-full resize-y rounded-xl border border-[#E2DCF1] bg-[#FCFBFE] px-3 py-2 text-sm leading-5 text-[#4F4660] outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12" value={item.value} onChange={(event) => updateInsight(item.id, { value: event.target.value })} aria-label={`Edit ${item.label}`} /><span className="mt-1 block text-[0.65rem] leading-4 text-[#8A8296]">{item.source}</span></span></label><button type="button" className="grid size-10 shrink-0 place-items-center rounded-lg text-[#8A8296] hover:bg-[#F4F1F8] hover:text-[#5B4B8A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20" onClick={() => updateInsight(item.id, { dismissed: true, selected: false })} aria-label={`Dismiss ${item.label}`}><X className="size-4" /></button></div></article>)}</div>
          {practiceInsights.some((item) => item.dismissed) && <button type="button" className={`${quiet} mt-2`} onClick={() => setPracticeInsights((current) => current.map((item) => ({ ...item, dismissed: false })))}>Restore dismissed suggestions</button>}
          <label className="mt-4 flex items-start gap-2 rounded-xl border border-[#E7E1F7] bg-white p-3 text-xs leading-5 text-[#625C70]"><input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[#5B4B8A]" checked={applyInsightsToPassport} disabled={!selectedInsightsCount} onChange={(event) => setApplyInsightsToPassport(event.target.checked)} /><span><strong className="text-[#292631]">Apply selected insights to my Creative Passport when I save.</strong><br />KLEIO will merge confirmed disciplines and mediums and append your confirmed practice language without replacing existing artist-authored text.</span></label>
        </section>}

        <div className="mt-5 space-y-4">{prepared.map((item) => <article key={item.sourceId} className={`rounded-[24px] border p-4 sm:p-5 ${item.approved ? "border-emerald-200 bg-emerald-50/40" : "border-[#E2DCF1] bg-white"}`}>
          <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div><img src={item.previewUrl} alt={item.fields.altText.value || "Instagram artwork saved in KLEIO"} className="aspect-square w-full rounded-2xl bg-[#F2EFF7] object-contain" /><div className="mt-3 flex items-center justify-between gap-2"><span className="text-xs text-[#746E80]">{readableDate(item.timestamp)}</span>{item.permalink && <a href={item.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B4B8A]">Original post <ExternalLink className="size-3" /></a>}</div></div>
            <div className="grid gap-4">
              <div className="flex flex-col gap-3 rounded-2xl border border-[#E7E1F7] bg-[#FAF9FD] p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold text-[#292631]">{item.approved ? "Displayed in portfolio" : "Portfolio visibility"}</p><p className="mt-1 text-xs leading-5 text-[#746E80]">{item.approved ? "This work already references the same Media Library source." : "Keep private by default, or include this titled work when you save."}</p></div>{item.approved ? <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-100 px-4 text-sm font-semibold text-emerald-800"><Check className="size-4" />In portfolio</span> : <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3 text-sm font-semibold text-[#5B4B8A]"><input type="checkbox" className="size-4 accent-[#5B4B8A]" checked={includeInPortfolio.has(item.sourceId)} onChange={() => togglePortfolio(item.sourceId)} />Include in portfolio</label>}</div>
              <div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-1.5 text-xs font-semibold"><span className="flex items-center justify-between gap-2">Title <FieldStatus item={item} name="title" /></span><input className={input} disabled={item.approved} value={item.fields.title.value} onChange={(event) => editField(item.sourceId, "title", event.target.value)} placeholder="Untitled is okay while private" /></label><label className="grid gap-1.5 text-xs font-semibold"><span className="flex items-center justify-between gap-2">Year <FieldStatus item={item} name="year" /></span><input className={input} disabled={item.approved} value={item.fields.year.value} onChange={(event) => editField(item.sourceId, "year", event.target.value)} /></label><label className="grid gap-1.5 text-xs font-semibold"><span className="flex items-center justify-between gap-2">Medium <FieldStatus item={item} name="medium" /></span><input className={input} disabled={item.approved} value={item.fields.medium.value} onChange={(event) => editField(item.sourceId, "medium", event.target.value)} /></label></div>
              <details className="group rounded-2xl border border-[#E7E1F7] bg-white"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-[#5B4B8A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"><span>More artwork details</span><ChevronDown className="size-4 transition group-open:rotate-180 motion-reduce:transition-none" /></summary><div className="grid gap-4 border-t border-[#E7E1F7] p-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-semibold"><span className="flex items-center justify-between gap-2">Dimensions <FieldStatus item={item} name="dimensions" /></span><input className={input} disabled={item.approved} value={item.fields.dimensions.value} onChange={(event) => editField(item.sourceId, "dimensions", event.target.value)} /></label><label className="grid gap-1.5 text-xs font-semibold"><span className="flex items-center justify-between gap-2">Series <FieldStatus item={item} name="series" /></span><input className={input} disabled={item.approved} value={item.fields.series.value} onChange={(event) => editField(item.sourceId, "series", event.target.value)} /></label><label className="grid gap-1.5 text-xs font-semibold sm:col-span-2"><span className="flex items-center justify-between gap-2">Description <FieldStatus item={item} name="description" /></span><textarea className={textarea} disabled={item.approved} value={item.fields.description.value} onChange={(event) => editField(item.sourceId, "description", event.target.value)} /></label><label className="grid gap-1.5 text-xs font-semibold sm:col-span-2"><span className="flex items-center justify-between gap-2">Tags <FieldStatus item={item} name="tags" /></span><input className={input} disabled={item.approved} value={item.fields.tags.value} onChange={(event) => editField(item.sourceId, "tags", event.target.value)} /></label><label className="grid gap-1.5 text-xs font-semibold sm:col-span-2"><span className="flex items-center justify-between gap-2">Accessibility description <FieldStatus item={item} name="altText" /></span><textarea className={textarea} disabled={item.approved} value={item.fields.altText.value} onChange={(event) => editField(item.sourceId, "altText", event.target.value)} /></label>{item.caption && <div className="sm:col-span-2"><p className="text-xs font-semibold text-[#292631]">Source caption</p><p className="mt-1 whitespace-pre-wrap rounded-xl bg-[#FAF9FD] p-3 text-xs leading-5 text-[#746E80]">{item.caption}</p></div>}</div></details>
              {!item.approved && <div className="flex justify-end"><button type="button" className={quiet} disabled={Boolean(working)} onClick={() => void removePrepared(item)}>{working === `delete:${item.sourceId}` ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <Trash2 className="size-4" />}Remove private record</button></div>}
            </div>
          </div>
        </article>)}</div>

        {preparedPending.length > 0 && <section className="sticky bottom-3 z-20 mt-6 rounded-[22px] border border-[#CFC4E8] bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_18px_60px_rgba(64,45,105,0.18)] backdrop-blur-md" aria-labelledby="instagram-save-summary-title"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h4 id="instagram-save-summary-title" className="text-sm font-semibold text-[#292631]">Save this group once</h4><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#625C70]"><span><strong>{preparedPending.length}</strong> private Media Library record{preparedPending.length === 1 ? "" : "s"}</span><span><strong>{portfolioPending.length}</strong> selected for portfolio</span><span><strong>{preparedPending.length - portfolioPending.length}</strong> staying private</span><span><strong>{selectedInsightsCount}</strong> practice insight{selectedInsightsCount === 1 ? "" : "s"} selected</span></div>{missingPortfolioTitles.length > 0 && <p className="mt-2 text-xs font-semibold text-amber-700">{missingPortfolioTitles.length} portfolio selection{missingPortfolioTitles.length === 1 ? " needs" : "s need"} a title.</p>}{portfolioPending.length === 0 && <button type="button" className="mt-2 text-xs font-semibold text-[#6A5896] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20" onClick={includeAllTitledWorks}>Include all titled works in portfolio</button>}</div><button type="button" className={`${primary} w-full lg:w-auto`} disabled={Boolean(working)} onClick={() => void saveWorksToKleio()}>{working === "save-all" ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <Check className="size-4" />}{working === "save-all" ? "Saving works to KLEIO…" : "Save works to KLEIO"}</button></div></section>}
      </section>}

      {completionSummary && <div ref={completionRef} className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5" role="status" aria-live="polite"><div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-emerald-700"><Check className="size-5" /></span><div className="min-w-0"><h3 className="font-serif text-xl font-semibold text-emerald-950">Your works are organized in KLEIO</h3><p className="mt-2 text-sm leading-6 text-emerald-900">{completionSummary.worksSaved} work{completionSummary.worksSaved === 1 ? " was" : "s were"} saved in your Media Library. {completionSummary.portfolioCount} {completionSummary.portfolioCount === 1 ? "is" : "are"} displayed in your portfolio. {completionSummary.privateCount} remain private.{completionSummary.passportUpdated ? " Your selected Creative Passport insights were also applied." : ""}</p>{completionSummary.failedCount > 0 && <p className="mt-2 text-xs font-semibold text-amber-800">{completionSummary.failedCount} portfolio action{completionSummary.failedCount === 1 ? " needs" : "s need"} another try; the private records are safe.</p>}<div className="mt-4 flex flex-wrap gap-2"><Link href="/artist-dashboard/portfolio/" className={primary}><Eye className="size-4" />View portfolio</Link><Link href="/artist-dashboard/media/" className={secondary}><Library className="size-4" />Done</Link></div></div></div></div>}

      {previewAsset && <PreviewDialog asset={previewAsset} gallery={gallery} selected={selected.has(previewAsset.id)} saved={preparedMediaIds.has(previewAsset.id)} selectionDisabled={selectedCount >= MAX_SELECTED} onClose={closePreview} onChange={(asset) => setPreviewId(asset.id)} onToggle={() => toggleAsset(previewAsset)} />}
    </section>
  )
}
