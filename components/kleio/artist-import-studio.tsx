"use client"

/* eslint-disable @next/next/no-img-element -- private previews use short-lived signed URLs */
/* eslint-disable @typescript-eslint/no-explicit-any -- Google Picker is a runtime global API */

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { Check, Cloud, FolderOpen, Loader2, RotateCcw, Save, ShieldCheck, Trash2, X } from "lucide-react"
import {
  blankArtworkImportDraft,
  clearArtworkImportDraft,
  loadArtworkImportDraft,
  loadArtworkPreview,
  saveArtworkImportDraft,
  saveArtworkImportDraftLocally,
  updateArtworkField,
  type ArtworkImportDraftPayload,
  type ArtworkImportItem,
  type GoogleDrivePickerFile,
} from "@/lib/kleio-artwork-import"
import {
  confirmGoogleDriveMediaImport,
  discardUnconfirmedGoogleDriveItems,
  itemWasDuplicate,
  prepareGoogleDriveArtwork,
} from "@/lib/kleio-google-drive-beta-import"
import { loadBetaImportAvailability, type KleioBetaImportAvailability } from "@/lib/kleio-import-source-availability"
import { saveMediaImportReceipt } from "@/lib/kleio-import-receipt"
import { createKleioAnalyticsWorkflowId, trackKleioProductEvent } from "@/lib/kleio-product-analytics"

type GooglePickerDocument = { id?: string; name?: string; mimeType?: string; type?: string }
type GoogleTokenResponse = { access_token?: string; error?: string; error_description?: string }
type SaveState = "idle" | "local" | "saving" | "saved" | "error"

declare global {
  interface Window {
    google?: any
    gapi?: any
  }
}

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const quiet = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#746E80] transition hover:bg-[#F7F4FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:opacity-50"
const input = "min-h-11 w-full rounded-xl border border-[#DED7EF] bg-white px-3 py-2 text-sm text-[#292631] outline-none transition focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12"

function loadScript(id: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null
    if (existing?.dataset.loaded === "true") return resolve()
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("A required Google service could not load.")), { once: true })
      return
    }
    const script = document.createElement("script")
    script.id = id
    script.src = src
    script.async = true
    script.defer = true
    script.addEventListener("load", () => { script.dataset.loaded = "true"; resolve() }, { once: true })
    script.addEventListener("error", () => reject(new Error("A required Google service could not load.")), { once: true })
    document.head.appendChild(script)
  })
}

async function loadGooglePicker() {
  await Promise.all([
    loadScript("kleio-google-identity", "https://accounts.google.com/gsi/client"),
    loadScript("kleio-google-api", "https://apis.google.com/js/api.js"),
  ])
  await new Promise<void>((resolve, reject) => {
    if (!window.gapi?.load) return reject(new Error("Google Picker did not initialize."))
    window.gapi.load("picker", { callback: resolve, onerror: () => reject(new Error("Google Picker did not initialize.")) })
  })
}

function SaveStatus({ state }: { state: SaveState }) {
  if (state === "idle") return null
  const label = state === "local" ? "Progress saved locally" : state === "saving" ? "Saving progress…" : state === "saved" ? "Progress saved" : "Progress needs attention"
  return <span role="status" aria-live="polite" className="inline-flex items-center gap-2 text-xs font-semibold text-[#746E80]">{state === "saving" ? <Loader2 className="size-3.5 animate-spin" /> : state === "saved" ? <Check className="size-3.5 text-emerald-600" /> : <Save className="size-3.5" />}{label}</span>
}

function stableImportFailure(reason: unknown) {
  const message = reason instanceof Error ? reason.message.toLowerCase() : ""
  if (message.includes("cancel")) return "import_authorization_cancelled"
  if (message.includes("permission") || message.includes("authorization")) return "import_authorization_expired"
  if (message.includes("initialize") || message.includes("load")) return "import_provider_unavailable"
  if (message.includes("unsupported") || message.includes("mime")) return "upload_type_unsupported"
  if (message.includes("large") || message.includes("size")) return "upload_file_too_large"
  if (message.includes("network") || message.includes("fetch")) return "upload_network_interrupted"
  return "import_provider_failed"
}

export function ArtistImportStudio({ onPortfolioChanged, compact = false, autoOpen = false }: {
  onPortfolioChanged?: () => void
  compact?: boolean
  autoOpen?: boolean
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const revisionRef = useRef(0)
  const hydratedRef = useRef(false)
  const lastSavedRef = useRef("")
  const googleTokenRef = useRef("")
  const autoOpenedRef = useRef(false)
  const analyticsWorkflowIdRef = useRef<string | null>(createKleioAnalyticsWorkflowId())
  const analyticsStartedRef = useRef(false)
  const autosaveSuccessTrackedRef = useRef(false)
  const autosaveFailureTrackedRef = useRef(false)
  const restoreTrackedRef = useRef(false)
  const [draft, setDraft] = useState<ArtworkImportDraftPayload>(() => blankArtworkImportDraft())
  const [availability, setAvailability] = useState<KleioBetaImportAvailability | null>(null)
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState("")
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [failedCount, setFailedCount] = useState(0)

  const driveClientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID ?? ""
  const driveApiKey = process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY ?? ""
  const driveAppId = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_APP_ID ?? ""
  const driveConfigured = Boolean(driveClientId && driveApiKey)
  const driveEnabled = availability?.google_drive_image === true
  const addedCount = useMemo(() => draft.items.filter((item) => !itemWasDuplicate(item)).length, [draft.items])
  const duplicateCount = draft.items.length - addedCount

  function workflowId() {
    if (!analyticsWorkflowIdRef.current) analyticsWorkflowIdRef.current = createKleioAnalyticsWorkflowId()
    return analyticsWorkflowIdRef.current
  }

  function resetAnalyticsWorkflow() {
    analyticsWorkflowIdRef.current = createKleioAnalyticsWorkflowId()
    analyticsStartedRef.current = false
    autosaveSuccessTrackedRef.current = false
    autosaveFailureTrackedRef.current = false
    restoreTrackedRef.current = false
  }

  function startAnalyticsWorkflow() {
    const activeWorkflowId = workflowId()
    if (!analyticsStartedRef.current) {
      analyticsStartedRef.current = true
      void trackKleioProductEvent("import_source_selected", {
        surface: "artwork_import_studio",
        workflowId: activeWorkflowId,
        metadata: { source: "google_drive" },
      })
      void trackKleioProductEvent("import_started", {
        surface: "artwork_import_studio",
        workflowId: activeWorkflowId,
        deduplicationKey: `import_started:${activeWorkflowId}`,
        metadata: { source: "google_drive", mode: "private_media_library" },
      })
    }
    return activeWorkflowId
  }

  function trackImportFailure(errorCode: string, count = 0) {
    const activeWorkflowId = workflowId()
    void trackKleioProductEvent("import_failed", {
      surface: "artwork_import_studio",
      workflowId: activeWorkflowId,
      deduplicationKey: `import_failed:${activeWorkflowId}:${errorCode}`,
      metadata: { source: "google_drive", reason: errorCode, error_code: errorCode, count },
    })
    void trackKleioProductEvent("user_visible_error", {
      surface: "artwork_import_studio",
      workflowId: activeWorkflowId,
      deduplicationKey: `user_visible_error:${activeWorkflowId}:${errorCode}`,
      metadata: { source: "google_drive", step: "import", error_code: errorCode, retryable: true },
    })
  }

  async function hydratePreviews(items: ArtworkImportItem[]) {
    const results = await Promise.allSettled(items.map(async (item) => ({ id: item.id, preview: await loadArtworkPreview(item.storagePath) })))
    setPreviewUrls((current) => {
      const next = { ...current }
      for (const result of results) if (result.status === "fulfilled") next[result.value.id] = result.value.preview.url
      return next
    })
  }

  useEffect(() => {
    let active = true
    void Promise.all([loadArtworkImportDraft().catch(() => null), loadBetaImportAvailability().catch(() => null)])
      .then(([saved, sourceAvailability]) => {
        if (!active) return
        setAvailability(sourceAvailability)
        if (!saved) return
        revisionRef.current = saved.revision
        const googleItems = saved.payload.items.filter((item) => item.sourceType === "google_drive_image")
        const restored = {
          ...saved.payload,
          items: googleItems,
          activeItemId: googleItems[0]?.id ?? "",
          step: saved.payload.step === "complete" ? "complete" : googleItems.length ? "review" : "source",
        } satisfies ArtworkImportDraftPayload
        setDraft(restored)
        lastSavedRef.current = JSON.stringify(restored)
        void hydratePreviews(googleItems)
        if (googleItems.length && !restoreTrackedRef.current) {
          restoreTrackedRef.current = true
          analyticsStartedRef.current = true
          const activeWorkflowId = workflowId()
          void trackKleioProductEvent("draft_restored", {
            surface: "artwork_import_studio",
            workflowId: activeWorkflowId,
            deduplicationKey: `draft_restored:${activeWorkflowId}`,
            metadata: { source: "google_drive", step: restored.step, count: googleItems.length },
          })
          void trackKleioProductEvent("workflow_recovered", {
            surface: "artwork_import_studio",
            workflowId: activeWorkflowId,
            deduplicationKey: `workflow_recovered:${activeWorkflowId}:draft_restored`,
            metadata: { source: "google_drive", reason: "draft_restored", step: restored.step },
          })
        }
        if (saved.payload.items.length !== googleItems.length) setStatus("Only Google Drive selections are available in the initial artist beta. Older device-import draft items were not reopened.")
      })
      .finally(() => { if (active) { hydratedRef.current = true; setLoading(false) } })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!hydratedRef.current || loading) return
    const normalized = { ...draft, updatedAt: new Date().toISOString() }
    const serialized = JSON.stringify(normalized)
    if (serialized === lastSavedRef.current) return
    saveArtworkImportDraftLocally(normalized, revisionRef.current)
    setSaveState("local")
    const timer = window.setTimeout(() => {
      setSaveState("saving")
      void saveArtworkImportDraft(normalized, revisionRef.current)
        .then((saved) => {
          revisionRef.current = saved.revision
          lastSavedRef.current = JSON.stringify(saved.payload)
          setSaveState("saved")
          const activeWorkflowId = workflowId()
          if (!autosaveSuccessTrackedRef.current) {
            autosaveSuccessTrackedRef.current = true
            void trackKleioProductEvent("autosave_succeeded", {
              surface: "artwork_import_studio",
              workflowId: activeWorkflowId,
              deduplicationKey: `autosave_succeeded:${activeWorkflowId}`,
              metadata: { source: "google_drive", step: saved.payload.step },
            })
          }
          if (autosaveFailureTrackedRef.current) {
            autosaveFailureTrackedRef.current = false
            void trackKleioProductEvent("workflow_recovered", {
              surface: "artwork_import_studio",
              workflowId: activeWorkflowId,
              deduplicationKey: `workflow_recovered:${activeWorkflowId}:autosave`,
              metadata: { source: "google_drive", reason: "autosave_failed", step: saved.payload.step },
            })
          }
        })
        .catch(() => {
          setSaveState("error")
          if (!autosaveFailureTrackedRef.current) {
            autosaveFailureTrackedRef.current = true
            const activeWorkflowId = workflowId()
            void trackKleioProductEvent("autosave_failed", {
              surface: "artwork_import_studio",
              workflowId: activeWorkflowId,
              deduplicationKey: `autosave_failed:${activeWorkflowId}`,
              metadata: { source: "google_drive", step: normalized.step, reason: "autosave_failed", error_code: "autosave_failed" },
            })
            void trackKleioProductEvent("workflow_recovery_offered", {
              surface: "artwork_import_studio",
              workflowId: activeWorkflowId,
              deduplicationKey: `workflow_recovery_offered:${activeWorkflowId}:autosave`,
              metadata: { source: "google_drive", step: normalized.step, reason: "autosave_failed" },
            })
          }
        })
    }, 900)
    return () => window.clearTimeout(timer)
  }, [draft, loading])

  useEffect(() => {
    if (!autoOpen || loading || autoOpenedRef.current || !dialogRef.current) return
    autoOpenedRef.current = true
    dialogRef.current.showModal()
    startAnalyticsWorkflow()
    window.setTimeout(() => headingRef.current?.focus(), 0)
  }, [autoOpen, loading])

  function showStudio() {
    setError("")
    if (!dialogRef.current?.open) dialogRef.current?.showModal()
    startAnalyticsWorkflow()
    window.setTimeout(() => headingRef.current?.focus(), 0)
  }

  async function requestGoogleToken() {
    await loadGooglePicker()
    return new Promise<string>((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) return reject(new Error("Google authorization did not initialize."))
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: driveClientId,
        scope: "https://www.googleapis.com/auth/drive.file",
        include_granted_scopes: false,
        callback: (response: GoogleTokenResponse) => {
          if (response.error || !response.access_token) return reject(new Error(response.error_description || "Google Drive permission was not granted."))
          googleTokenRef.current = response.access_token
          resolve(response.access_token)
        },
        error_callback: () => reject(new Error("Google Drive authorization was cancelled or blocked.")),
      })
      client.requestAccessToken({ prompt: googleTokenRef.current ? "" : "consent" })
    })
  }

  async function chooseGoogleDriveFiles() {
    if (!driveEnabled || !driveConfigured || working) return
    const activeWorkflowId = startAnalyticsWorkflow()
    setWorking("drive")
    setError("")
    setStatus("Opening Google Drive…")
    try {
      const accessToken = await requestGoogleToken()
      const google = window.google
      const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
        .setMimeTypes("image/jpeg,image/png,image/webp")
        .setMode(google.picker.DocsViewMode.LIST)
      const selected = await new Promise<GoogleDrivePickerFile[]>((resolve, reject) => {
        const builder = new google.picker.PickerBuilder()
          .addView(view)
          .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
          .setOAuthToken(accessToken)
          .setDeveloperKey(driveApiKey)
          .setCallback((data: { action?: string; docs?: GooglePickerDocument[] }) => {
            if (data.action === google.picker.Action.PICKED) {
              resolve((data.docs || []).flatMap((document) => document.id && (document.mimeType || document.type)
                ? [{ id: document.id, name: document.name || "Drive artwork", mimeType: document.mimeType || document.type || "" }]
                : []))
            } else if (data.action === google.picker.Action.CANCEL) resolve([])
            else if (data.action === google.picker.Action.ERROR) reject(new Error("Google Drive could not complete the selection."))
          })
        if (driveAppId) builder.setAppId(driveAppId)
        builder.build().setVisible(true)
      })
      if (!selected.length) {
        setStatus("No Drive files were selected. Your existing progress is unchanged.")
        return
      }

      const prepared: ArtworkImportItem[] = []
      const failures: string[] = []
      for (let index = 0; index < selected.length; index += 1) {
        const selectedFile = selected[index]
        setStatus(`Validating and copying ${index + 1} of ${selected.length}: ${selectedFile.name}`)
        try {
          const item = await prepareGoogleDriveArtwork({ selectedFile, accessToken, sessionId: draft.sessionId })
          prepared.push(item)
        } catch (reason) {
          failures.push(stableImportFailure(reason))
        }
      }
      if (prepared.length) {
        await hydratePreviews(prepared)
        setDraft((current) => ({
          ...current,
          step: "review",
          activeItemId: prepared[0]?.id || current.activeItemId,
          items: [...current.items, ...prepared],
          updatedAt: new Date().toISOString(),
        }))
      } else {
        trackImportFailure(failures[0] || "import_no_items_saved", selected.length)
      }
      setFailedCount((current) => current + failures.length)
      setStatus(prepared.length ? `${prepared.length} selected file${prepared.length === 1 ? " is" : "s are"} ready for private Media Library confirmation.` : "")
      setError(failures.length ? `${failures.length} selected file${failures.length === 1 ? " needs" : "s need"} attention before confirmation.` : "")
      if (failures.length && prepared.length) {
        void trackKleioProductEvent("workflow_recovery_offered", {
          surface: "artwork_import_studio",
          workflowId: activeWorkflowId,
          deduplicationKey: `workflow_recovery_offered:${activeWorkflowId}:partial_selection`,
          metadata: { source: "google_drive", reason: "import_partial_failure", step: "file_validation", failed_count: failures.length },
        })
      }
    } catch (reason) {
      const errorCode = stableImportFailure(reason)
      setError("Google Drive could not be opened. Reconnect and try again.")
      setStatus("")
      trackImportFailure(errorCode)
      void trackKleioProductEvent("workflow_recovery_offered", {
        surface: "artwork_import_studio",
        workflowId: activeWorkflowId,
        deduplicationKey: `workflow_recovery_offered:${activeWorkflowId}:${errorCode}`,
        metadata: { source: "google_drive", reason: errorCode, step: "authorization" },
      })
    } finally {
      setWorking("")
    }
  }

  async function removePrepared(item: ArtworkImportItem) {
    if (!window.confirm(`Remove ${item.fields.title.value || item.originalFilename} from this import review?`)) return
    setWorking(item.id)
    try {
      if (!itemWasDuplicate(item)) await discardUnconfirmedGoogleDriveItems([item])
      setDraft((current) => {
        const items = current.items.filter((candidate) => candidate.id !== item.id)
        return { ...current, items, step: items.length ? "review" : "source", activeItemId: items[0]?.id || "", updatedAt: new Date().toISOString() }
      })
      setPreviewUrls((current) => { const next = { ...current }; delete next[item.id]; return next })
      setStatus("The selection was removed from this import review.")
    } finally {
      setWorking("")
    }
  }

  async function confirmImport() {
    if (!draft.items.length || working) return
    const activeWorkflowId = startAnalyticsWorkflow()
    setWorking("confirm")
    setError("")
    try {
      const sourceIds = await confirmGoogleDriveMediaImport(draft.items)
      saveMediaImportReceipt({ source: "google_drive", addedCount, duplicateCount, failedCount, sourceIds })
      setDraft((current) => ({ ...current, step: "complete", updatedAt: new Date().toISOString() }))
      setStatus("")
      onPortfolioChanged?.()
      const eventName = failedCount > 0 ? "import_partially_completed" : "import_completed"
      void trackKleioProductEvent(eventName, {
        surface: "artwork_import_studio",
        workflowId: activeWorkflowId,
        deduplicationKey: `${eventName}:${activeWorkflowId}`,
        metadata: {
          source: "google_drive",
          result_count: addedCount,
          duplicate_count: duplicateCount,
          failed_count: failedCount,
          count: draft.items.length + failedCount,
        },
      })
      if (failedCount > 0) {
        void trackKleioProductEvent("workflow_recovered", {
          surface: "artwork_import_studio",
          workflowId: activeWorkflowId,
          deduplicationKey: `workflow_recovered:${activeWorkflowId}:partial_import`,
          metadata: { source: "google_drive", reason: "import_partial_failure", step: "confirmation", result_count: addedCount },
        })
      }
    } catch {
      setError("The selected files could not be confirmed in the Media Library. Your review remains available so you can try again.")
      trackImportFailure("import_confirmation_failed", draft.items.length)
      void trackKleioProductEvent("workflow_recovery_offered", {
        surface: "artwork_import_studio",
        workflowId: activeWorkflowId,
        deduplicationKey: `workflow_recovery_offered:${activeWorkflowId}:confirmation`,
        metadata: { source: "google_drive", reason: "import_confirmation_failed", step: "confirmation" },
      })
    } finally {
      setWorking("")
    }
  }

  async function importMore() {
    await clearArtworkImportDraft().catch(() => undefined)
    revisionRef.current = 0
    lastSavedRef.current = ""
    setDraft(blankArtworkImportDraft())
    setPreviewUrls({})
    setFailedCount(0)
    setError("")
    setStatus("Choose another set of files from Google Drive.")
    resetAnalyticsWorkflow()
  }

  async function discardReview() {
    if (draft.items.length && !window.confirm("Discard this unconfirmed import review? New private copies from this review will be removed; existing duplicates remain in your Media Library.")) return
    setWorking("discard")
    try {
      await discardUnconfirmedGoogleDriveItems(draft.items)
      await clearArtworkImportDraft()
      revisionRef.current = 0
      lastSavedRef.current = ""
      setDraft(blankArtworkImportDraft())
      setPreviewUrls({})
      setFailedCount(0)
      setError("")
      setStatus("A fresh Google Drive import is ready.")
      resetAnalyticsWorkflow()
    } finally {
      setWorking("")
    }
  }

  const launcher = compact ? (
    <button type="button" className={secondary} onClick={showStudio}><Cloud className="size-4" />Import from Google Drive</button>
  ) : (
    <section className="rounded-[26px] border border-[#E2DCF1] bg-[linear-gradient(145deg,#F9F6FF,#FFFFFF)] p-6 shadow-[0_22px_70px_rgba(82,64,130,0.07)]" aria-labelledby="drive-import-launcher">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Active beta import source</p><h2 id="drive-import-launcher" className="mt-2 font-serif text-2xl font-semibold">Choose artwork from Google Drive</h2><p className="mt-2 text-sm leading-6 text-[#746E80]">KLEIO receives only the files you deliberately select. Private Media Library records are created first; nothing is added to a public Portfolio, Creative Passport, profile, or application automatically.</p><p className="mt-3 text-xs font-semibold text-[#6A5896]"><ShieldCheck className="mr-1.5 inline size-3.5" />Private by default · artist account ownership required</p></div>
        <button type="button" className={primary} onClick={showStudio}><FolderOpen className="size-4" />Open Google Drive import</button>
      </div>
    </section>
  )

  return (
    <>
      {launcher}
      <dialog ref={dialogRef} aria-labelledby="drive-import-title" aria-describedby="drive-import-description" className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-white p-0 text-[#292631] shadow-2xl backdrop:bg-[#20182D]/45 backdrop:backdrop-blur-sm sm:inset-auto sm:m-auto sm:h-[min(840px,calc(100dvh-32px))] sm:w-[min(1120px,calc(100vw-32px))] sm:rounded-[28px] sm:border sm:border-[#DCD4EF]" onCancel={() => setStatus("Import progress is saved. Reopen the Studio to continue.")}>
        <div className="flex h-full min-h-0 flex-col bg-[#FCFBFE]">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E7E1F7] bg-white px-4 py-4 sm:px-6">
            <div><p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Google Drive · artist beta</p><h2 id="drive-import-title" ref={headingRef} tabIndex={-1} className="mt-1 font-serif text-2xl font-semibold outline-none">Import Studio</h2><p id="drive-import-description" className="mt-1 max-w-3xl text-xs leading-5 text-[#746E80]">Review the exact files KLEIO copied privately before confirming the Media Library handoff.</p></div>
            <div className="flex items-center gap-2"><SaveStatus state={saveState} /><button type="button" className="grid size-11 place-items-center rounded-xl border border-[#E2DCF1] bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20" onClick={() => dialogRef.current?.close()} aria-label="Close Import Studio"><X className="size-5" /></button></div>
          </header>

          {(error || status) && <div className={`shrink-0 border-b px-4 py-3 text-sm sm:px-6 ${error ? "border-red-200 bg-red-50 text-red-700" : "border-[#E7E1F7] bg-[#F9F7FC] text-[#625C70]"}`} role={error ? "alert" : "status"} aria-live="polite">{error || status}</div>}

          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {loading ? <div className="grid min-h-full place-items-center"><p className="flex items-center gap-2 text-sm text-[#746E80]"><Loader2 className="size-4 animate-spin" />Restoring your private import review…</p></div> : draft.step === "complete" ? (
              <main className="mx-auto grid min-h-full max-w-2xl place-items-center py-8 text-center">
                <section className="w-full rounded-[28px] border border-emerald-200 bg-[linear-gradient(145deg,#F2FCF7,#FFFFFF)] p-6 shadow-[0_22px_70px_rgba(54,112,82,0.08)] sm:p-8" role="status" aria-live="polite">
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-800"><Check className="size-7" /></span>
                  <h3 className="mt-5 font-serif text-3xl font-semibold">{addedCount} item{addedCount === 1 ? "" : "s"} added to your Media Library</h3>
                  <p className="mt-3 text-sm leading-7 text-[#625C70]">Your selected files were saved privately. You can review, organize, and reuse them across your Portfolio, Creative Passport, profile, and applications.</p>
                  {duplicateCount > 0 && <p className="mt-3 text-sm font-semibold text-[#5B4B8A]">{duplicateCount} selected file{duplicateCount === 1 ? " was" : "s were"} already in your Media Library and were not counted as new.</p>}
                  {failedCount > 0 && <p className="mt-2 text-sm font-semibold text-amber-800">{failedCount} file{failedCount === 1 ? "" : "s"} could not be imported. The successful items remain available.</p>}
                  <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/artist-dashboard/media/" className={primary}>View Media Library</Link><button type="button" className={secondary} onClick={() => void importMore()}><RotateCcw className="size-4" />Import more</button></div>
                </section>
              </main>
            ) : draft.step === "source" ? (
              <main className="mx-auto flex min-h-full max-w-3xl flex-col justify-center py-8">
                <section className="rounded-[28px] border border-[#E2DCF1] bg-white p-6 text-center shadow-[0_18px_52px_rgba(82,64,130,0.06)] sm:p-8">
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><Cloud className="size-6" /></span><h3 className="mt-5 font-serif text-2xl font-semibold">Choose from Google Drive</h3><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#746E80]">Google permission is separate from KLEIO sign-in. The Picker lets you choose specific JPEG, PNG, or WebP files; KLEIO does not browse the rest of your Drive.</p>
                  <button type="button" className={`${primary} mt-6`} disabled={!driveConfigured || !driveEnabled || Boolean(working)} onClick={() => void chooseGoogleDriveFiles()}>{working === "drive" ? <Loader2 className="size-4 animate-spin" /> : <FolderOpen className="size-4" />}Connect and choose files</button>
                  {!driveEnabled && <p className="mt-4 text-xs font-semibold text-amber-800">Google Drive import is not enabled in the current beta configuration.</p>}
                  {driveEnabled && !driveConfigured && <p className="mt-4 text-xs font-semibold text-amber-800">The restricted Google client ID and Picker key are not configured for this deployment.</p>}
                </section>
              </main>
            ) : (
              <main className="mx-auto max-w-5xl py-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#75639E]">Private import review</p><h3 className="mt-1 font-serif text-2xl font-semibold">Confirm the selected files</h3><p className="mt-2 text-sm text-[#746E80]">{draft.items.length} valid selection{draft.items.length === 1 ? "" : "s"} · {addedCount} new · {duplicateCount} already in your library{failedCount ? ` · ${failedCount} failed` : ""}</p></div><div className="flex flex-wrap gap-2"><button type="button" className={secondary} disabled={Boolean(working)} onClick={() => void chooseGoogleDriveFiles()}><Cloud className="size-4" />Add from Drive</button><button type="button" className={primary} disabled={!draft.items.length || Boolean(working)} onClick={() => void confirmImport()}>{working === "confirm" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Confirm private import</button></div></div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{draft.items.map((item) => <article key={item.id} className="overflow-hidden rounded-[22px] border border-[#E7E1F7] bg-white shadow-[0_14px_38px_rgba(82,64,130,0.05)]"><div className="grid aspect-[4/3] place-items-center bg-[#F4F1F8]">{previewUrls[item.id] ? <img src={previewUrls[item.id]} alt={item.fields.altText.value || "Selected artwork preview"} className="size-full object-cover" /> : <Loader2 className="size-4 animate-spin" />}</div><div className="p-4"><div className="flex items-start justify-between gap-3"><span className="rounded-full border border-[#D8D0F2] bg-[#FAF9FD] px-2.5 py-1 text-[0.65rem] font-semibold text-[#5B4B8A]">{itemWasDuplicate(item) ? "Already in library" : "New private item"}</span><button type="button" className="grid size-9 place-items-center rounded-lg text-[#8A8296] hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20" disabled={working === item.id} onClick={() => void removePrepared(item)} aria-label={`Remove ${item.fields.title.value || item.originalFilename} from import review`}>{working === item.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</button></div><label className="mt-4 grid gap-1.5 text-xs font-semibold text-[#625C70]">Private library title<input className={input} value={item.fields.title.value} placeholder={item.originalFilename} onChange={(event) => setDraft((current) => ({ ...current, items: current.items.map((candidate) => candidate.id === item.id ? updateArtworkField(candidate, "title", event.target.value) : candidate), updatedAt: new Date().toISOString() }))} /></label><p className="mt-3 truncate text-xs text-[#81788E]">{item.originalFilename}</p></div></article>)}</div>
                <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-[#E7E1F7] pt-5"><button type="button" className={quiet} disabled={Boolean(working)} onClick={() => void discardReview()}><RotateCcw className="size-4" />Discard review</button><p className="max-w-xl text-xs leading-5 text-[#81788E]">Confirming creates or updates private Media Library records only. Public Portfolio and Creative Passport use still require a separate artist approval.</p></div>
              </main>
            )}
          </div>
        </div>
      </dialog>
    </>
  )
}
