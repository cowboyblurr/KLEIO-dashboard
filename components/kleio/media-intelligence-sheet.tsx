"use client"

/* eslint-disable @next/next/no-img-element -- private media uses short-lived signed URLs */

import { useEffect, useState } from "react"
import { AudioLines, BrainCircuit, Check, Clipboard, FileText, Loader2, RefreshCcw, ShieldCheck, Sparkles, Video, X } from "lucide-react"
import type { ArtistMediaLibraryItem } from "@/lib/kleio-universal-media"
import { analyzeMediaWithKleio, canAnalyzeMediaItem, loadMediaIntelligence, mediaIntelligenceSupportText, type MediaIntelligence } from "@/lib/kleio-media-intelligence"

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:opacity-50"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3 py-2 text-xs font-semibold text-[#5B4B8A] transition hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:opacity-50"

type Props = { item: ArtistMediaLibraryItem | null; open: boolean; onClose: () => void; onAnalyzed?: (analysis: MediaIntelligence) => void }
type Tab = "overview" | "passport" | "evidence"

function Preview({ item }: { item: ArtistMediaLibraryItem }) {
  if (item.mediaKind === "image" && item.previewUrl) return <img src={item.previewUrl} alt="" className="size-full object-contain" />
  if (item.mediaKind === "video" && item.previewUrl) return <video src={item.previewUrl} controls preload="metadata" className="size-full object-contain" aria-label={`${item.title} video`} />
  if (item.mediaKind === "audio" && item.previewUrl) return <div className="flex w-full flex-col items-center gap-4 px-5"><AudioLines className="size-9 text-[#75639E]" /><audio src={item.previewUrl} controls preload="metadata" className="w-full" aria-label={`${item.title} audio`} /></div>
  if (item.mediaKind === "video") return <Video className="size-9 text-[#75639E]" />
  if (item.mediaKind === "audio") return <AudioLines className="size-9 text-[#75639E]" />
  return <FileText className="size-9 text-[#75639E]" />
}

function Chips({ values }: { values: string[] }) {
  if (!values.length) return <p className="text-xs text-[#8A8296]">No supported suggestions from this source.</p>
  return <div className="flex flex-wrap gap-1.5">{values.map((value) => <span key={value} className="rounded-full border border-[#E1DAF0] bg-[#F9F7FC] px-2.5 py-1 text-xs text-[#625C70]">{value}</span>)}</div>
}

function List({ title, values, caution = false }: { title: string; values: string[]; caution?: boolean }) {
  if (!values.length) return null
  return <section className={`rounded-2xl border p-4 ${caution ? "border-amber-200 bg-amber-50/70" : "border-[#E7E1F7] bg-white"}`}><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">{title}</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-[#4E4954]">{values.map((value, index) => <li key={`${title}-${index}`} className="border-l border-[#DCD4EE] pl-3">{value}</li>)}</ul></section>
}

export function MediaIntelligenceSheet({ item, open, onClose, onAnalyzed }: Props) {
  const [analysis, setAnalysis] = useState<MediaIntelligence | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<Tab>("overview")
  const [copied, setCopied] = useState("")

  useEffect(() => {
    if (!open || !item?.sourceId) { setAnalysis(null); setError(""); return }
    let active = true
    setLoading(true); setError(""); setTab("overview")
    void loadMediaIntelligence(item.sourceId).then((value) => { if (active) setAnalysis(value) }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "KLEIO could not load this analysis.") }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [item?.id, item?.sourceId, open])

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [onClose, open])

  const confidence = analysis?.confidence == null ? null : Math.round(analysis.confidence * 100)
  if (!open || !item) return null
  const activeItem = item

  async function analyze(force = false) {
    if (analyzing) return
    setAnalyzing(true); setError("")
    try {
      const next = await analyzeMediaWithKleio(activeItem, { force })
      setAnalysis(next)
      setTab("overview")
      onAnalyzed?.(next)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not analyze this private media source.")
    } finally {
      setAnalyzing(false)
    }
  }

  async function copy(value: string, label: string) {
    if (!value) return
    await navigator.clipboard.writeText(value); setCopied(label); window.setTimeout(() => setCopied(""), 1600)
  }

  return <div className="fixed inset-0 z-[120] flex justify-end bg-[#21192D]/35 backdrop-blur-[2px]">
    <button type="button" className="absolute inset-0" aria-label="Close media intelligence" onClick={onClose} />
    <aside role="dialog" aria-modal="true" aria-labelledby="media-intelligence-title" aria-busy={analyzing} className="relative z-10 flex h-dvh w-full max-w-[620px] flex-col overflow-hidden border-l border-[#DDD5EE] bg-[#FCFBFE] text-[#292631] shadow-[-24px_0_70px_rgba(54,42,82,0.16)]">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E7E1F7] bg-white px-5 py-4"><div className="min-w-0"><p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">KLEIO Assist · private</p><h2 id="media-intelligence-title" className="mt-1 font-serif text-2xl font-semibold">Media intelligence</h2><p className="mt-1 truncate text-xs text-[#746E80]">{activeItem.title} · <span className="capitalize">{activeItem.mediaKind}</span></p></div><button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-xl border border-[#E2DCF1] bg-white" aria-label="Close"><X className="size-4" /></button></header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid min-h-[220px] place-items-center border-b border-[#E7E1F7] bg-[#F3F0F8]"><Preview item={activeItem} /></div>
        <div className="p-5">
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}{analysis && <p className="mt-1 text-xs leading-5 text-red-700/80">Your previous successful analysis is still available below.</p>}</div>}
          {loading ? <div className="grid place-items-center py-12 text-sm text-[#746E80]"><Loader2 className="mb-2 size-5 animate-spin" />Loading private analysis…</div> : !analysis ? <section className="rounded-[22px] border border-[#E2DCF1] bg-white p-5"><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#F0EAFB] text-[#5B4B8A]"><BrainCircuit className="size-5" /></span><div><h3 className="font-serif text-xl font-semibold">Understand this source here</h3><p className="mt-2 text-sm leading-6 text-[#625C70]">{mediaIntelligenceSupportText(activeItem)}</p></div></div><div className="mt-4 rounded-xl border border-[#E7E1F7] bg-[#FAF8FE] px-3 py-3 text-xs leading-5 text-[#746E80]"><ShieldCheck className="mr-1.5 inline size-3.5 text-[#5B4B8A]" />Analysis stays private. KLEIO separates observation from interpretation and does not rewrite your Passport without your approval.</div>{canAnalyzeMediaItem(activeItem) && <button type="button" aria-label="Analyze with KLEIO" className={`${primary} mt-4 w-full`} onClick={() => void analyze()} disabled={analyzing}>{analyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{analyzing ? "Analyzing…" : "Analyze"}</button>}</section> : <>
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"><Check className="size-3.5" />Analysis ready</span>{confidence !== null && <span className="rounded-full border border-[#E1DAF0] bg-white px-2.5 py-1 text-xs font-semibold text-[#625C70]">AI confidence {confidence}%</span>}{analysis.proposalCount > 0 && <span className="rounded-full border border-[#E1DAF0] bg-white px-2.5 py-1 text-xs font-semibold text-[#625C70]">{analysis.proposalCount} Passport suggestion{analysis.proposalCount === 1 ? "" : "s"}</span>}</div><button type="button" className={secondary} onClick={() => void analyze(true)} disabled={analyzing}>{analyzing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCcw className="size-3.5" />}{analyzing ? "Re-analyzing…" : "Re-analyze"}</button></div>
            <p className="mt-2 text-[0.68rem] leading-5 text-[#8A8296]">Re-analysis keeps this successful result available until a new result succeeds. AI confidence is a review aid, not verification.</p>
            <div className="mt-4 flex gap-1 rounded-xl bg-[#F1EEF6] p-1">{(["overview","passport","evidence"] as Tab[]).map((value) => <button key={value} type="button" onClick={() => setTab(value)} className={`min-h-9 flex-1 rounded-lg px-3 text-xs font-semibold capitalize ${tab === value ? "bg-white text-[#4F407B] shadow-sm" : "text-[#746E80]"}`}>{value === "passport" ? "Passport language" : value}</button>)}</div>
            {tab === "overview" && <div className="mt-4 space-y-4"><section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">At a glance</h3><p className="mt-3 text-sm leading-7 text-[#4E4954]">{analysis.summary || analysis.suggestedDescription || "No concise summary was supported."}</p></section><section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Themes and concepts</h3><div className="mt-3"><Chips values={analysis.themesConcepts} /></div></section><section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Formal qualities</h3><div className="mt-3"><Chips values={analysis.formalQualities} /></div></section></div>}
            {tab === "passport" && <div className="mt-4 space-y-4">{analysis.suggestedDescription && <section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><div className="flex items-center justify-between gap-2"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Suggested description</h3><button type="button" className={secondary} onClick={() => void copy(analysis.suggestedDescription, "description")}><Clipboard className="size-3.5" />{copied === "description" ? "Copied" : "Copy"}</button></div><p className="mt-3 text-sm leading-7 text-[#4E4954]">{analysis.suggestedDescription}</p></section>}<section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Mediums and materials</h3><div className="mt-3"><Chips values={analysis.mediumsMaterials} /></div></section><section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Disciplines</h3><div className="mt-3"><Chips values={analysis.disciplines} /></div></section><section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Application keywords</h3><div className="mt-3"><Chips values={analysis.applicationKeywords} /></div></section></div>}
            {tab === "evidence" && <div className="mt-4 space-y-4"><List title="Direct observations" values={analysis.factualObservations} /><List title="Interpretive reading" values={analysis.interpretiveObservations} /><List title="Technical observations" values={analysis.technicalObservations} /><List title="Uncertain — artist review needed" values={analysis.uncertainties} caution /><List title="Analysis limitations" values={analysis.limitations} caution /></div>}
          </>}
        </div>
      </div>
    </aside>
  </div>
}
