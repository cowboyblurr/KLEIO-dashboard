"use client"

import { useEffect, useState } from "react"
import { Check, Images, Loader2, X } from "lucide-react"
import { QuickMediaImport } from "@/components/kleio/media-import/quick-media-import"
import { loadPortfolioWorks } from "@/lib/kleio-live-data"
import {
  createPortfolioWorkFromMedia,
  type ArtistMediaLibraryItem,
  type MediaSelectionResult,
} from "@/lib/kleio-universal-media"

type PendingArtwork = {
  item: ArtistMediaLibraryItem
  title: string
  year: string
  medium: string
  dimensions: string
}

const field = "min-h-10 w-full rounded-lg border border-[#DED7EF] bg-white px-3 py-2 text-sm text-[#292631] outline-none transition focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3 py-2 text-xs font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const primary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"

function suggestedTitle(item: ArtistMediaLibraryItem) {
  return (item.associatedWorkTitle || item.title || item.originalFilename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ")).trim() || "Untitled work"
}

function suggestedMedium(item: ArtistMediaLibraryItem) {
  if (item.mediaKind === "video") return "Video"
  if (item.mediaKind === "audio") return "Sound"
  return ""
}

function notifyPortfolioChanged(workIds: string[]) {
  if (!workIds.length) return
  window.dispatchEvent(new CustomEvent("kleio:application-portfolio-changed", { detail: { workIds } }))
}

export function ApplicationMediaImportBar() {
  const [portfolioCount, setPortfolioCount] = useState<number | null>(null)
  const [pending, setPending] = useState<PendingArtwork[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")

  async function refreshPortfolioCount() {
    const works = await loadPortfolioWorks()
    setPortfolioCount(works.length)
    return works
  }

  useEffect(() => {
    let active = true
    void loadPortfolioWorks()
      .then((works) => { if (active) setPortfolioCount(works.length) })
      .catch(() => { if (active) setPortfolioCount(null) })
    return () => { active = false }
  }, [])

  const hasPortfolio = Boolean(portfolioCount && portfolioCount > 0)

  function prepareSelectedArtwork(result: MediaSelectionResult) {
    setError("")
    const existingWorkIds = Array.from(new Set(result.items.flatMap((item) => item.associatedWorkId ? [item.associatedWorkId] : [])))
    const newItems = result.items.filter((item) => !item.associatedWorkId)
    if (existingWorkIds.length) notifyPortfolioChanged(existingWorkIds)
    setPending(newItems.map((item) => ({
      item,
      title: suggestedTitle(item),
      year: "",
      medium: suggestedMedium(item),
      dimensions: "",
    })))
    if (newItems.length) {
      setStatus(`${newItems.length} new work${newItems.length === 1 ? " is" : "s are"} ready for a quick title and metadata check before joining your Portfolio.`)
    } else if (existingWorkIds.length) {
      setStatus(`${existingWorkIds.length} existing Portfolio work${existingWorkIds.length === 1 ? " is" : "s are"} now available in the application selection below.`)
    }
  }

  function updatePending(index: number, patch: Partial<Omit<PendingArtwork, "item">>) {
    setPending((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, ...patch } : entry))
  }

  async function addPendingToPortfolio() {
    if (!pending.length || saving) return
    if (pending.some((entry) => !entry.title.trim())) {
      setError("Add a title for every new work before placing it in your Portfolio.")
      return
    }
    setSaving(true)
    setError("")
    setStatus("")
    try {
      const workIds: string[] = []
      for (const entry of pending) {
        workIds.push(await createPortfolioWorkFromMedia({
          item: entry.item,
          title: entry.title,
          year: entry.year,
          medium: entry.medium,
          dimensions: entry.dimensions,
        }))
      }
      await refreshPortfolioCount()
      setPending([])
      notifyPortfolioChanged(workIds)
      setStatus(`${workIds.length} work${workIds.length === 1 ? " was" : "s were"} added to your Portfolio and made available in this application without leaving the page.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not add the selected artwork to your Portfolio.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-2xl border border-[#E7E1F7] bg-white px-4 py-3 sm:px-5" aria-label="Application artwork actions">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#292631]">{hasPortfolio ? `${portfolioCount} portfolio work${portfolioCount === 1 ? "" : "s"} ready to choose from` : "Add your first artwork without leaving this application"}</p>
          <p className="mt-1 text-xs leading-5 text-[#746E80]">{hasPortfolio ? "Reuse approved Portfolio works below. If this opportunity needs a missing work, add it here without leaving this application." : "Upload or reuse private artwork media here, confirm only the basic details, and KLEIO will return the new work to the Portfolio selection in this application."}</p>
        </div>
        <QuickMediaImport context="application_portfolio_selection" label={hasPortfolio ? "Add missing artwork" : "Add your first artwork"} onConfirm={prepareSelectedArtwork} />
      </div>

      {(error || status) && <div className={`mt-3 rounded-xl border px-3 py-2 text-xs leading-5 ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`} role={error ? "alert" : "status"} aria-live="polite">{error || status}</div>}

      {pending.length > 0 && <div className="mt-4 rounded-2xl border border-[#E7E1F7] bg-[#FAF8FD] p-3 sm:p-4" aria-label="Review new application artwork">
        <div className="flex items-start gap-2"><Images className="mt-0.5 size-4 text-[#6F5DA7]" /><div><p className="text-sm font-semibold text-[#292631]">Quick artwork review</p><p className="mt-1 text-xs leading-5 text-[#746E80]">Confirm the title and any details you know. Everything remains editable later; this step exists only so the application can use a real Portfolio work rather than a loose file.</p></div></div>
        <div className="mt-3 grid gap-3">
          {pending.map((entry, index) => <div key={entry.item.id} className="rounded-xl border border-[#E7E1F7] bg-white p-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-1 text-[0.68rem] font-semibold text-[#625C70] sm:col-span-2"><span>Artwork title *</span><input className={field} value={entry.title} onChange={(event) => updatePending(index, { title: event.target.value })} /></label>
              <label className="grid gap-1 text-[0.68rem] font-semibold text-[#625C70]"><span>Year</span><input className={field} inputMode="numeric" value={entry.year} onChange={(event) => updatePending(index, { year: event.target.value })} /></label>
              <label className="grid gap-1 text-[0.68rem] font-semibold text-[#625C70]"><span>Medium</span><input className={field} value={entry.medium} onChange={(event) => updatePending(index, { medium: event.target.value })} /></label>
              <label className="grid gap-1 text-[0.68rem] font-semibold text-[#625C70] sm:col-span-2"><span>Dimensions or duration</span><input className={field} value={entry.dimensions} onChange={(event) => updatePending(index, { dimensions: event.target.value })} /></label>
              <div className="flex items-end text-[0.68rem] leading-5 text-[#8A8296] sm:col-span-2">Private source · {entry.item.originalFilename}</div>
            </div>
          </div>)}
        </div>
        <div className="mt-3 flex flex-wrap justify-end gap-2"><button type="button" className={secondary} disabled={saving} onClick={() => { setPending([]); setError(""); setStatus("The new media remains private in your KLEIO Library. Nothing was added to your Portfolio.") }}><X className="size-3.5" />Cancel review</button><button type="button" className={primary} disabled={saving || pending.some((entry) => !entry.title.trim())} onClick={() => void addPendingToPortfolio()}>{saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}Add to Portfolio & application</button></div>
      </div>}
    </section>
  )
}
