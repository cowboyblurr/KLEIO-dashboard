"use client"

/* eslint-disable @next/next/no-img-element -- private portfolio images use short-lived signed URLs */

import { useEffect, useMemo, useState } from "react"
import { Check, ChevronDown, ImageIcon, Images, Loader2, Pencil, Search, Trash2, X } from "lucide-react"
import { ArtistImportStudio } from "@/components/kleio/artist-import-studio"
import { QuickMediaImport } from "@/components/kleio/media-import/quick-media-import"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import {
  loadPortfolioWorks,
  updatePortfolioWork,
  type PortfolioWorkRecord,
} from "@/lib/kleio-live-data"
import {
  createPortfolioWorkFromMedia,
  type ArtistMediaLibraryItem,
} from "@/lib/kleio-universal-media"
import { deletePortfolioWorkPreservingLibrary } from "@/lib/kleio-media-destinations"

const surface = "rounded-[24px] border border-[#E7E1F7] bg-white shadow-[0_18px_52px_rgba(82,64,130,0.06)]"
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const field = "min-h-11 w-full rounded-xl border border-[#DED7EF] bg-white px-3 py-2 text-sm text-[#292631] outline-none transition focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12"

const mediumOptions = ["Painting", "Oil on canvas", "Acrylic on canvas", "Watercolor", "Drawing", "Photography", "Ceramics", "Sculpture", "Installation", "Textile", "Printmaking", "Digital media", "Mixed media"]

type DraftWork = {
  item: ArtistMediaLibraryItem
  title: string
  year: string
  medium: string
  dimensions: string
  description: string
  series: string
  tags: string
  altText: string
}

function draftFromItem(item: ArtistMediaLibraryItem): DraftWork {
  const title = item.associatedWorkTitle || item.title || item.originalFilename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ")
  return { item, title, year: "", medium: "", dimensions: "", description: "", series: "", tags: "", altText: "" }
}

function WorkEditor({
  draft,
  saving,
  onChange,
  onSave,
  onRemove,
}: {
  draft: DraftWork
  saving: boolean
  onChange: (next: DraftWork) => void
  onSave: () => void
  onRemove: () => void
}) {
  return (
    <section className={`${surface} overflow-hidden`} aria-labelledby="new-work-editor-title">
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="relative min-h-[320px] bg-[#F2EFF7] p-4 sm:p-6 lg:min-h-[620px] lg:p-8">
          <div className="flex h-full items-center justify-center overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(58,43,92,0.14)]">
            {draft.item.previewUrl ? <img src={draft.item.previewUrl} alt={draft.altText || draft.title || "Selected artwork"} className="max-h-[70dvh] w-full object-contain" /> : <ImageIcon className="size-12 text-[#8D80AA]" />}
          </div>
          <span className="absolute left-7 top-7 rounded-full bg-white/95 px-3 py-1.5 text-[0.7rem] font-semibold text-[#5B4B8A] shadow-sm">Private draft</span>
        </div>
        <div className="flex flex-col border-t border-[#E7E1F7] bg-white p-5 lg:border-l lg:border-t-0 lg:p-6">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Artwork details</p>
            <h2 id="new-work-editor-title" className="mt-1 font-serif text-2xl font-semibold tracking-[-0.03em]">Describe this work</h2>
            <p className="mt-2 text-sm leading-6 text-[#746E80]">Start with title, year, and medium. Optional context can be added now or later.</p>
          </div>
          <datalist id="visual-portfolio-mediums">{mediumOptions.map((option) => <option key={option} value={option} />)}</datalist>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]"><span>Artwork title *</span><input autoFocus className={field} value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]"><span>Year</span><input className={field} inputMode="numeric" value={draft.year} onChange={(event) => onChange({ ...draft, year: event.target.value })} /></label>
              <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]"><span>Medium</span><input list="visual-portfolio-mediums" className={field} value={draft.medium} onChange={(event) => onChange({ ...draft, medium: event.target.value })} /></label>
            </div>
            <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]"><span>Dimensions or duration</span><input className={field} value={draft.dimensions} onChange={(event) => onChange({ ...draft, dimensions: event.target.value })} placeholder="For example: 24 × 36 in" /></label>
            <details className="rounded-2xl border border-[#E7E1F7] bg-[#FCFBFE] p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#5B4B8A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 [&::-webkit-details-marker]:hidden">Add story, series, and accessibility details<ChevronDown className="size-4" /></summary>
              <div className="mt-4 grid gap-4">
                <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]"><span>Description</span><textarea rows={4} className={`${field} resize-y leading-6`} value={draft.description} onChange={(event) => onChange({ ...draft, description: event.target.value })} /></label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]"><span>Series</span><input className={field} value={draft.series} onChange={(event) => onChange({ ...draft, series: event.target.value })} /></label>
                  <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]"><span>Keywords</span><input className={field} value={draft.tags} onChange={(event) => onChange({ ...draft, tags: event.target.value })} /></label>
                </div>
                <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]"><span>Accessibility description</span><textarea rows={3} className={`${field} resize-y leading-6`} value={draft.altText} onChange={(event) => onChange({ ...draft, altText: event.target.value })} placeholder="Describe meaningful visual details for someone who cannot see the image." /></label>
              </div>
            </details>
          </div>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#E7E1F7] pt-5">
            <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#746E80] hover:bg-red-50 hover:text-red-700" onClick={onRemove}><X className="size-4" />Remove from draft</button>
            <button type="button" className={primary} disabled={saving || !draft.title.trim()} onClick={onSave}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Approve and add to Portfolio</button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function FocusedVisualArtistPortfolioStudio() {
  const [works, setWorks] = useState<PortfolioWorkRecord[]>([])
  const [drafts, setDrafts] = useState<DraftWork[]>([])
  const [activeDraft, setActiveDraft] = useState(0)
  const [editing, setEditing] = useState<PortfolioWorkRecord | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const refresh = () => loadPortfolioWorks().then(setWorks)
  useEffect(() => { void refresh().catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)) }, [])
  const active = drafts[activeDraft] ?? null
  const visibleWorks = useMemo(() => {
    const query = search.trim().toLowerCase()
    return works.filter((work) => !query || `${work.title} ${work.year} ${work.medium} ${work.series} ${work.tags.join(" ")}`.toLowerCase().includes(query))
  }, [search, works])

  function addDraftItems(items: ArtistMediaLibraryItem[]) {
    const newDrafts = items.filter((item) => !item.associatedWorkId).map(draftFromItem)
    if (!newDrafts.length) {
      setMessage("Those files are already connected to portfolio works. Choose the existing work from your portfolio grid.")
      return
    }
    setDrafts((current) => [...current, ...newDrafts])
    setActiveDraft(drafts.length)
    setEditing(null)
    setMessage(`${newDrafts.length} image${newDrafts.length === 1 ? " is" : "s are"} ready for artwork review.`)
  }

  async function saveActiveDraft() {
    if (!active || saving) return
    setSaving(true)
    setError("")
    setMessage("")
    try {
      await createPortfolioWorkFromMedia({
        item: active.item,
        title: active.title,
        year: active.year,
        medium: active.medium,
        dimensions: active.dimensions,
        description: active.description,
        series: active.series,
        tags: active.tags.split(/[,;\n]/).map((value) => value.trim()).filter(Boolean),
        accessibilityAltText: active.altText,
      })
      const remaining = drafts.filter((_, index) => index !== activeDraft)
      setDrafts(remaining)
      setActiveDraft(Math.max(0, Math.min(activeDraft, remaining.length - 1)))
      await refresh()
      setMessage(`${active.title} was approved and added to your portfolio.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The artwork could not be saved.")
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit() {
    if (!editing || saving) return
    setSaving(true)
    setError("")
    setMessage("")
    try {
      await updatePortfolioWork(editing.id, {
        title: editing.title,
        year: editing.year,
        medium: editing.medium,
        dimensions: editing.dimensions,
        description: editing.description,
        series: editing.series,
        tags: editing.tags.join(", "),
      })
      await refresh()
      setEditing(null)
      setMessage("Artwork details updated.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The artwork could not be updated.")
    } finally {
      setSaving(false)
    }
  }

  async function removeWork(work: PortfolioWorkRecord) {
    if (!window.confirm(`Remove ${work.title} from the portfolio? Its reusable media file will remain in your private KLEIO Library.`)) return
    setError("")
    try {
      await deletePortfolioWorkPreservingLibrary(work)
      setWorks((current) => current.filter((item) => item.id !== work.id))
      if (editing?.id === work.id) setEditing(null)
      setMessage("The portfolio record was removed. Its media remains private in your KLEIO Library.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The portfolio work could not be removed.")
    }
  }

  return (
    <main className="h-full overflow-y-auto bg-[#FCFBFE] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1240px] space-y-5">
        <WorkspacePageHeader eyebrow="Artist workspace" title="Portfolio" description="See, add, and edit the works you reuse across your artist profile and applications." />

        <section className="rounded-2xl border border-[#E7E1F7] bg-white p-4 shadow-[0_12px_34px_rgba(82,64,130,0.045)]" aria-labelledby="portfolio-add-work-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="portfolio-add-work-title" className="text-sm font-semibold text-[#292631]">Add artwork</h2>
              <p className="mt-1 text-xs leading-5 text-[#746E80]">Choose images first, then approve only the details needed to reuse each work.</p>
            </div>
            <div className="flex flex-wrap gap-2"><ArtistImportStudio compact onPortfolioChanged={() => void refresh()} /><QuickMediaImport context="portfolio" label="Choose media" onConfirm={({ items }) => addDraftItems(items)} /></div>
          </div>
        </section>

        {(error || message) && <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`} role={error ? "alert" : "status"} aria-live="polite">{error || message}</div>}

        {drafts.length > 0 && (
          <section className="space-y-3" aria-labelledby="new-work-queue-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#75639E]">New work queue</p><h2 id="new-work-queue-title" className="mt-1 text-sm font-semibold text-[#292631]">Review one image at a time</h2></div>
              <span className="rounded-full bg-[#EEE8FA] px-3 py-1.5 text-xs font-semibold text-[#5B4B8A]">{activeDraft + 1} of {drafts.length}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Artwork draft tray">
              {drafts.map((draft, index) => <button key={draft.item.id} type="button" aria-current={activeDraft === index ? "true" : undefined} onClick={() => { setActiveDraft(index); setEditing(null) }} className={`relative min-w-36 overflow-hidden rounded-2xl border bg-white text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 ${activeDraft === index ? "border-[#8C78BF] ring-2 ring-[#A997E8]/20" : "border-[#E7E1F7]"}`}>{draft.item.previewUrl ? <img src={draft.item.previewUrl} alt="" className="aspect-[4/3] w-full object-cover" /> : <div className="grid aspect-[4/3] place-items-center bg-[#F4F1F8]"><ImageIcon className="size-5 text-[#8D80AA]" /></div>}<span className="block truncate px-3 py-2 text-xs font-semibold">{draft.title || draft.item.originalFilename}</span><span className="absolute left-2 top-2 grid size-6 place-items-center rounded-full bg-white/95 text-[0.65rem] font-bold text-[#5B4B8A]">{index + 1}</span></button>)}
            </div>
            {active && <WorkEditor draft={active} saving={saving} onChange={(next) => setDrafts((current) => current.map((draft, index) => index === activeDraft ? next : draft))} onSave={() => void saveActiveDraft()} onRemove={() => { const remaining = drafts.filter((_, index) => index !== activeDraft); setDrafts(remaining); setActiveDraft(Math.max(0, Math.min(activeDraft, remaining.length - 1))) }} />}
          </section>
        )}

        {editing && (
          <section className={`${surface} overflow-hidden`} aria-labelledby="edit-existing-work-title">
            <div className="flex items-center justify-between border-b border-[#E7E1F7] px-5 py-4">
              <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#75639E]">Edit existing work</p><h2 id="edit-existing-work-title" className="mt-1 font-serif text-2xl font-semibold">{editing.title}</h2></div>
              <button type="button" className="grid size-10 place-items-center rounded-xl border border-[#E7E1F7]" onClick={() => setEditing(null)} aria-label="Close artwork editor"><X className="size-4" /></button>
            </div>
            <div className="grid lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="grid min-h-80 place-items-center bg-[#F2EFF7] p-6">{editing.image_url ? <img src={editing.image_url} alt={editing.title} className="max-h-[62dvh] w-full rounded-2xl object-contain shadow-[0_20px_60px_rgba(58,43,92,0.15)]" /> : <ImageIcon className="size-10 text-[#8D80AA]" />}</div>
              <div className="grid content-start gap-4 border-t border-[#E7E1F7] p-5 lg:border-l lg:border-t-0">
                <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]"><span>Title</span><input className={field} value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]"><span>Year</span><input className={field} value={editing.year} onChange={(event) => setEditing({ ...editing, year: event.target.value })} /></label>
                  <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]"><span>Medium</span><input className={field} value={editing.medium} onChange={(event) => setEditing({ ...editing, medium: event.target.value })} /></label>
                </div>
                <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]"><span>Dimensions</span><input className={field} value={editing.dimensions} onChange={(event) => setEditing({ ...editing, dimensions: event.target.value })} /></label>
                <details className="rounded-2xl border border-[#E7E1F7] p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-[#5B4B8A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20">More artwork details</summary>
                  <div className="mt-4 grid gap-4">
                    <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]"><span>Description</span><textarea rows={4} className={`${field} resize-y`} value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} /></label>
                    <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]"><span>Series</span><input className={field} value={editing.series} onChange={(event) => setEditing({ ...editing, series: event.target.value })} /></label>
                    <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]"><span>Keywords</span><input className={field} value={editing.tags.join(", ")} onChange={(event) => setEditing({ ...editing, tags: event.target.value.split(/[,;\n]/).map((value) => value.trim()).filter(Boolean) })} /></label>
                  </div>
                </details>
                <div className="flex flex-wrap gap-2"><button type="button" className={primary} disabled={saving || !editing.title.trim()} onClick={() => void saveEdit()}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Save changes</button><button type="button" className={secondary} onClick={() => void removeWork(editing)}><Trash2 className="size-4" />Remove work</button></div>
              </div>
            </div>
          </section>
        )}

        <section className="space-y-4" aria-labelledby="approved-portfolio-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#75639E]">Approved portfolio</p><h2 id="approved-portfolio-title" className="mt-1 font-serif text-2xl font-semibold">Your works</h2></div>
            <label className="relative block sm:w-72"><span className="sr-only">Search portfolio works</span><Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-[#8A8296]" /><input type="search" className={`${field} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your works" /></label>
          </div>
          {loading ? <div role="status" className={`${surface} flex items-center justify-center p-8 text-sm text-[#746E80]`}><Loader2 className="mr-2 size-4 animate-spin" />Loading your portfolio…</div> : visibleWorks.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleWorks.map((work) => <article key={work.id} className="group overflow-hidden rounded-[22px] border border-[#E7E1F7] bg-white shadow-[0_14px_38px_rgba(82,64,130,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(82,64,130,0.11)]"><button type="button" onClick={() => { setEditing(work); setDrafts([]) }} className="block w-full text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#A997E8]/25"><div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-[#F4F1F8]">{work.image_url ? <img src={work.image_url} alt={work.title} className="size-full object-cover transition duration-500 group-hover:scale-[1.025]" loading="lazy" /> : <ImageIcon className="size-8 text-[#8D80AA]" />}<span className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-white/92 text-[#5B4B8A] opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-within:opacity-100"><Pencil className="size-4" /></span></div><div className="p-4"><h3 className="truncate font-serif text-lg font-semibold">{work.title}</h3><p className="mt-1 truncate text-xs text-[#746E80]">{[work.year, work.medium].filter(Boolean).join(" · ") || "Details can be added later"}</p>{work.series && <p className="mt-2 truncate text-[0.68rem] font-semibold uppercase tracking-wide text-[#75639E]">{work.series}</p>}</div></button></article>)}</div> : <div className={`${surface} grid place-items-center p-10 text-center`}><span className="grid size-14 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><Images className="size-6" /></span><h3 className="mt-4 font-serif text-2xl font-semibold">Your portfolio begins with an image</h3><p className="mt-2 max-w-md text-sm leading-6 text-[#746E80]">Choose one work or import a group. KLEIO will help you organize details after you can see the work.</p><div className="mt-5 flex flex-wrap justify-center gap-2"><ArtistImportStudio compact onPortfolioChanged={() => void refresh()} /><QuickMediaImport context="portfolio" label="Choose first image" onConfirm={({ items }) => addDraftItems(items)} /></div></div>}
        </section>
      </div>
    </main>
  )
}
