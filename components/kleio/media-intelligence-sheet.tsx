"use client"

/* eslint-disable @next/next/no-img-element -- private media uses short-lived signed URLs */

import { useEffect, useMemo, useState } from "react"
import {
  AudioLines,
  BrainCircuit,
  Check,
  Clipboard,
  Eye,
  FileText,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Video,
  X,
} from "lucide-react"
import type { ArtistMediaLibraryItem } from "@/lib/kleio-universal-media"
import {
  analyzeMediaWithKleio,
  canAnalyzeMediaItem,
  loadMediaIntelligence,
  mediaIntelligenceSupportText,
  type MediaIntelligence,
} from "@/lib/kleio-media-intelligence"

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3 py-2 text-xs font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:opacity-50"

type Tab = "overview" | "passport" | "evidence"

type Props = {
  item: ArtistMediaLibraryItem | null
  open: boolean
  onClose: () => void
  onAnalyzed?: (analysis: MediaIntelligence) => void
}

function preview(item: ArtistMediaLibraryItem) {
  if (item.mediaKind === "image" && item.previewUrl) return <img src={item.previewUrl} alt="" className="size-full object-contain" />
  if (item.mediaKind === "video" && item.previewUrl) return <video src={item.previewUrl} controls preload="metadata" className="size-full object-contain" aria-label={`${item.title} video`} />
  if (item.mediaKind === "audio" && item.previewUrl) return <div className="flex w-full flex-col items-center gap-4 px-5"><AudioLines className="size-10 text-[#75639E]" /><audio src={item.previewUrl} controls preload="metadata" className="w-full" aria-label={`${item.title} audio`} /></div>
  if (item.mediaKind === "video") return <Video className="size-10 text-[#75639E]" />
  if (item.mediaKind === "audio") return <AudioLines className="size-10 text-[#75639E]" />
  return <FileText className="size-10 text-[#75639E]" />
}

function chips(values: string[]) {
  if (!values.length) return <p className="text-xs text-[#8A8296]">No supported suggestions from this source.</p>
  return <div className="flex flex-wrap gap-1.5">{values.map((value) => <span key={value} className="rounded-full border border-[#E1DAF0] bg-[#F9F7FC] px-2.5 py-1 text-xs text-[#625C70]">{value}</span>)}</div>
}

function ListSection({ title, values, tone = "neutral" }: { title: string; values: string[]; tone?: "neutral" | "interpretive" | "caution" }) {
  if (!values.length) return null
  const className = tone === "caution" ? "border-amber-200 bg-amber-50/70" : tone === "interpretive" ? "border-[#E5DDF6] bg-[#FAF8FE]" : "border-[#E7E1F7] bg-white"
  return <section className={`rounded-2xl border p-4 ${className}`}><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">{title}</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-[#4E4954]">{values.map((value, index) => <li key={`${title}-${index}`} className="border-l border-[#DCD4EE] pl-3">{value}</li>)}</ul></section>
}

export function MediaIntelligenceSheet({ item, open, onClose, onAnalyzed }: Props) {
  const [analysis, setAnalysis] = useState<MediaIntelligence | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<Tab>("overview")
  const [copied, setCopied] = useState("")

  useEffect(() => {
    if (!open || !item?.sourceId) { setAnalysis(null); setError(""); setTab("overview"); return }
    let active = true
    setLoading(true); setError(""); setTab("overview")
    void loadMediaIntelligence(item.sourceId)
      .then((value) => { if (active) setAnalysis(value) })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "KLEIO could not load this analysis.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [item?.id, item?.sourceId, open])

  useEffect(() => {
    if (!open) return
    const handle = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    window.addEventListener("keydown", handle)
    return () => window.removeEventListener("keydown", handle)
  }, [onClose, open])

  const confidence = useMemo(() => analysis?.confidence == null ? null : Math.round(analysis.confidence * 100), [analysis?.confidence])
  if (!open || !item) return null

  async function analyze(force = false) {
    setAnalyzing(true); setError("")
    try {
      const next = await analyzeMediaWithKleio(item, { force })
      setAnalysis(next); setTab("overview"); onAnalyzed?.(next)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not analyze this private media source.")
    } finally { setAnalyzing(false) }
  }

  async function copy(value: string, label: string) {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(label)
    window.setTimeout(() => setCopied(""), 1800)
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "passport", label: "Passport language" },
    { id: "evidence", label: "Evidence & limits" },
  ]

  return <div className="fixed inset-0 z-[120] flex justify-end bg-[#21192D]/35 backdrop-blur-[2px]" role="presentation">
    <button type="button" className="absolute inset-0 cursor-default" aria-label="Close media intelligence" onClick={onClose} />
    <aside role="dialog" aria-modal="true" aria-labelledby="media-intelligence-title" className="relative z-10 flex h-dvh w-full max-w-[620px] flex-col overflow-hidden border-l border-[#DDD5EE] bg-[#FCFBFE] text-[#292631] shadow-[-24px_0_70px_rgba(54,42,82,0.16)]">
      <header className="shrink-0 border-b border-[#E7E1F7] bg-white px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0"><p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">KLEIO Assist · private</p><h2 id="media-intelligence-title" className="mt-1 truncate font-serif text-2xl font-semibold">Media intelligence</h2><p className="mt-1 truncate text-xs text-[#746E80]">{item.title} · <span className="capitalize">{item.mediaKind}</span></p></div>
          <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#E2DCF1] bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20" aria-label="Close"><X className="size-4.5" /></button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid min-h-[220px] place-items-center border-b border-[#E7E1F7] bg-[#F3F0F8]">{preview(item)}</div>
        <div className="p-4 sm:p-5">
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}

          {loading ? <div className="grid place-items-center py-12 text-sm text-[#746E80]"><Loader2 className="mb-2 size-5 animate-spin" />Loading private analysis…</div> : !analysis ? <section className="rounded-[22px] border border-[#E2DCF1] bg-white p-5 shadow-[0_16px_40px_rgba(82,64,130,0.05)]">
            <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F0EAFB] text-[#5B4B8A]"><BrainCircuit className="size-5" /></span><div><h3 className="font-serif text-xl font-semibold">Analyze without leaving this workspace</h3><p className="mt-2 text-sm leading-6 text-[#625C70]">{mediaIntelligenceSupportText(item)}</p></div></div>
            <div className="mt-4 rounded-xl border border-[#E7E1F7] bg-[#FAF8FE] px-3 py-3 text-xs leading-5 text-[#746E80]"><ShieldCheck className="mr-1.5 inline size-3.5 text-[#5B4B8A]" />Analysis stays private and does not rewrite your Creative Passport. KLEIO separates observation from interpretation and waits for your decision.</div>
            {canAnalyzeMediaItem(item) && <button type="button" className={`${primary} mt-4 w-full`} onClick={() => void analyze(false)} disabled={analyzing}>{analyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{analyzing ? "Analyzing private media…" : "Analyze with KLEIO"}</button>}
          </section> : <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"><Check className="size-3.5" />Analysis ready</span>{confidence !== null && <span className="rounded-full border border-[#E1DAF0] bg-white px-2.5 py-1 text-xs font-semibold text-[#625C70]">AI confidence {confidence}%</span>}{analysis.proposalCount > 0 && <span className="rounded-full border border-[#E1DAF0] bg-white px-2.5 py-1 text-xs font-semibold text-[#625C70]">{analysis.proposalCount} Passport suggestion{analysis.proposalCount === 1 ? "" : "s"}</span>}</div>
              <button type="button" className={secondary} onClick={() => void analyze(true)} disabled={analyzing}>{analyzing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCcw className="size-3.5" />}Refresh</button>
            </div>
            {confidence !== null && <p className="mt-2 text-[0.68rem] leading-5 text-[#8A8296]">Confidence is an AI certainty indicator, not a truth or verification score. You remain the final authority.</p>}

            <div className="mt-4 flex gap-1 overflow-x-auto rounded-xl bg-[#F1EEF6] p-1" role="tablist" aria-label="Media intelligence views">{tabs.map((entry) => <button key={entry.id} type="button" role="tab" aria-selected={tab === entry.id} onClick={() => setTab(entry.id)} className={`min-h-9 flex-1 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition ${tab === entry.id ? "bg-white text-[#4F407B] shadow-sm" : "text-[#746E80] hover:text-[#4F407B]"}`}>{entry.label}</button>)}</div>

            {tab === "overview" && <div className="mt-4 space-y-4">
              <section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]"><Eye className="size-3.5" />At a glance</div><p className="mt-3 text-sm leading-7 text-[#4E4954]">{analysis.summary || analysis.suggestedDescription || "KLEIO completed the analysis, but no concise summary was supported."}</p></section>
              <section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Themes and concepts</h3><div className="mt-3">{chips(analysis.themesConcepts)}</div></section>
              <section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Formal qualities</h3><div className="mt-3">{chips(analysis.formalQualities)}</div></section>
            </div>}

            {tab === "passport" && <div className="mt-4 space-y-4">
              {analysis.suggestedTitle && <section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Working title suggestion</h3><button type="button" className={secondary} onClick={() => void copy(analysis.suggestedTitle, "title")}><Clipboard className="size-3.5" />{copied === "title" ? "Copied" : "Copy"}</button></div><p className="mt-3 font-serif text-lg font-semibold">{analysis.suggestedTitle}</p></section>}
              {analysis.suggestedDescription && <section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Suggested description</h3><button type="button" className={secondary} onClick={() => void copy(analysis.suggestedDescription, "description")}><Clipboard className="size-3.5" />{copied === "description" ? "Copied" : "Copy"}</button></div><p className="mt-3 text-sm leading-7 text-[#4E4954]">{analysis.suggestedDescription}</p></section>}
              <section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Mediums and materials</h3><div className="mt-3">{chips(analysis.mediumsMaterials)}</div></section>
              <section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Disciplines</h3><div className="mt-3">{chips(analysis.disciplines)}</div></section>
              <section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Application keywords</h3><div className="mt-3">{chips(analysis.applicationKeywords)}</div></section>
              {analysis.accessibilityDescription && <section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Accessibility description</h3><button type="button" className={secondary} onClick={() => void copy(analysis.accessibilityDescription, "alt")}><Clipboard className="size-3.5" />{copied === "alt" ? "Copied" : "Copy"}</button></div><p className="mt-3 text-sm leading-7 text-[#4E4954]">{analysis.accessibilityDescription}</p></section>}
              <div className="rounded-xl border border-[#E7E1F7] bg-[#FAF8FE] px-3 py-3 text-xs leading-5 text-[#746E80]"><Sparkles className="mr-1.5 inline size-3.5 text-[#5B4B8A]" />These are private suggestions designed to reduce retyping. Copy or adapt only what feels accurate; KLEIO does not silently change Passport fields.</div>
            </div>}

            {tab === "evidence" && <div className="mt-4 space-y-4">
              <ListSection title="Direct observations" values={analysis.factualObservations} />
              <ListSection title="Interpretive reading" values={analysis.interpretiveObservations} tone="interpretive" />
              <ListSection title="Technical observations" values={analysis.technicalObservations} />
              <ListSection title="Presentation notes" values={analysis.presentationNotes} />
              <ListSection title="Uncertain — artist review needed" values={analysis.uncertainties} tone="caution" />
              <ListSection title="Analysis limitations" values={analysis.limitations} tone="caution" />
            </div>}
          </>}
        </div>
      </div>
    </aside>
  </div>
}
