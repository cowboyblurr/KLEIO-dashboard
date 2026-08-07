"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { BrainCircuit, Check, Loader2, ShieldCheck, Sparkles, X } from "lucide-react"
import type { ArtistMediaLibraryItem } from "@/lib/kleio-universal-media"
import { analyzeMediaWithKleio, canAnalyzeMediaItem, loadMediaIntelligenceStatuses } from "@/lib/kleio-media-intelligence"
import {
  confirmMediaCollectionInsight,
  dismissMediaCollectionInsight,
  requestMediaCollectionInsight,
  type CollectionPattern,
  type MediaCollectionInsight,
} from "@/lib/kleio-media-collection-intelligence"

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3 py-2 text-xs font-semibold text-[#5B4B8A] transition hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:opacity-50"

const synthesisStages = [
  "Comparing recurring themes across the selected sources…",
  "Looking for formal, material, spatial, and sonic relationships…",
  "Examining how the works echo, resist, or extend one another…",
  "Separating direct patterns from interpretations that need your voice…",
  "Preparing reusable body-of-work language for your review…",
]

type Props = {
  items: ArtistMediaLibraryItem[]
  open: boolean
  initialInsight?: MediaCollectionInsight | null
  onClose: () => void
  onConfirmed?: (insight: MediaCollectionInsight) => void
  onDismissed?: (id: string) => void
}

function PatternList({ title, patterns, sourceLabel }: { title: string; patterns: CollectionPattern[]; sourceLabel: (ref: string) => string }) {
  if (!patterns.length) return null
  return <section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">{title}</h3><div className="mt-3 space-y-3">{patterns.map((pattern, index) => <div key={`${title}-${index}`} className="border-l border-[#DCD4EE] pl-3"><p className="text-sm leading-6 text-[#4E4954]">{pattern.text}</p><p className="mt-1 text-[0.68rem] leading-5 text-[#8A8296]">Supported by {pattern.sourceRefs.map(sourceLabel).join(", ")}{pattern.confidence !== null ? ` · ${Math.round(pattern.confidence * 100)}% review confidence` : ""}</p></div>)}</div></section>
}

export function MediaCollectionIntelligenceSheet({ items, open, initialInsight = null, onClose, onConfirmed, onDismissed }: Props) {
  const startedKeyRef = useRef("")
  const [insight, setInsight] = useState<MediaCollectionInsight | null>(initialInsight)
  const [draftSummary, setDraftSummary] = useState("")
  const [phase, setPhase] = useState<"idle" | "individual" | "synthesis" | "ready">(initialInsight ? "ready" : "idle")
  const [stage, setStage] = useState(0)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const selectionKey = useMemo(() => items.flatMap((item) => item.sourceId ? [item.sourceId] : []).sort().join(":"), [items])
  const sourceNames = useMemo(() => new Map(items.flatMap((item) => item.sourceId ? [[`source_${item.sourceId}`, item.title] as const] : [])), [items])
  const sourceLabel = (ref: string) => sourceNames.get(ref) || "selected source"

  useEffect(() => {
    if (!open) return
    if (initialInsight) {
      setInsight(initialInsight)
      setDraftSummary(initialInsight.artistSummary || initialInsight.bodyOfWorkSummary || initialInsight.summary)
      setPhase("ready")
      setError("")
      return
    }
    setInsight(null)
    setDraftSummary("")
    setPhase("idle")
    setError("")
  }, [initialInsight, open, selectionKey])

  useEffect(() => {
    if (!open || initialInsight || items.length < 2 || !selectionKey || startedKeyRef.current === selectionKey) return
    startedKeyRef.current = selectionKey
    let cancelled = false
    const run = async () => {
      setError("")
      try {
        const statuses = await loadMediaIntelligenceStatuses(items)
        const missing = items.filter((item) => canAnalyzeMediaItem(item) && statuses.get(item.id) !== "ready")
        if (missing.length) {
          setPhase("individual")
          for (let index = 0; index < missing.length; index += 1) {
            if (cancelled) return
            const item = missing[index]
            setStatus(`Understanding ${item.title} · ${index + 1} of ${missing.length}`)
            await analyzeMediaWithKleio(item)
          }
        }
        if (cancelled) return
        setPhase("synthesis")
        setStage(0)
        setStatus("")
        const next = await requestMediaCollectionInsight(items)
        if (cancelled) return
        setInsight(next)
        setDraftSummary(next.artistSummary || next.bodyOfWorkSummary || next.summary)
        setPhase("ready")
      } catch (reason) {
        if (!cancelled) {
          setPhase("idle")
          setError(reason instanceof Error ? reason.message : "KLEIO could not compare these private sources.")
          startedKeyRef.current = ""
        }
      }
    }
    void run()
    return () => { cancelled = true }
  }, [initialInsight, items, open, selectionKey])

  useEffect(() => {
    if (phase !== "synthesis") return
    const timer = window.setInterval(() => setStage((current) => Math.min(current + 1, synthesisStages.length - 1)), 1900)
    return () => window.clearInterval(timer)
  }, [phase])

  useEffect(() => {
    if (!open) startedKeyRef.current = ""
  }, [open])

  if (!open) return null

  async function confirm() {
    if (!insight || saving) return
    setSaving(true); setError("")
    try {
      const confirmed = await confirmMediaCollectionInsight(insight.id, draftSummary)
      setInsight(confirmed)
      setDraftSummary(confirmed.artistSummary)
      onConfirmed?.(confirmed)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not save your reviewed collection context.")
    } finally { setSaving(false) }
  }

  async function dismiss() {
    if (!insight || saving) return
    setSaving(true); setError("")
    try {
      await dismissMediaCollectionInsight(insight.id)
      onDismissed?.(insight.id)
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not dismiss this collection analysis.")
    } finally { setSaving(false) }
  }

  return <div className="fixed inset-0 z-[125] flex justify-end bg-[#21192D]/35 backdrop-blur-[2px]">
    <button type="button" className="absolute inset-0" aria-label="Close body-of-work intelligence" onClick={onClose} />
    <aside role="dialog" aria-modal="true" aria-labelledby="collection-intelligence-title" aria-busy={phase === "individual" || phase === "synthesis"} className="relative z-10 flex h-dvh w-full max-w-[680px] flex-col overflow-hidden border-l border-[#DDD5EE] bg-[#FCFBFE] text-[#292631] shadow-[-24px_0_70px_rgba(54,42,82,0.16)]">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E7E1F7] bg-white px-5 py-4"><div><p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">KLEIO Assist · private comparison</p><h2 id="collection-intelligence-title" className="mt-1 font-serif text-2xl font-semibold">Body-of-work intelligence</h2><p className="mt-1 text-xs leading-5 text-[#746E80]">{items.length || insight?.sourceIds.length || 0} selected sources · patterns stay private until you decide what is useful.</p></div><button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-xl border border-[#E2DCF1] bg-white" aria-label="Close"><X className="size-4" /></button></header>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700" role="alert">{error}</div>}

        {(phase === "individual" || phase === "synthesis") && <section className="rounded-[22px] border border-[#E2DCF1] bg-white p-5" aria-live="polite"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F0EAFB] text-[#5B4B8A]"><BrainCircuit className="size-5" /></span><div><h3 className="font-serif text-xl font-semibold">Understanding the selected work together</h3><p className="mt-2 text-sm leading-6 text-[#625C70]">KLEIO first makes sure each private source has its own grounded analysis, then compares the group for relationships that may help you describe the work later.</p></div></div><div className="mt-5 rounded-2xl border border-[#E7E1F7] bg-[#FAF8FE] p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#75639E]">What KLEIO is reviewing</p>{phase === "individual" ? <div className="mt-3 flex items-center gap-3 text-sm font-semibold text-[#4F407B]"><Loader2 className="size-4 animate-spin" />{status || "Checking individual private analyses…"}</div> : <div className="mt-3 space-y-2">{synthesisStages.map((label, index) => <div key={label} className={`flex items-center gap-2 text-sm ${index === stage ? "font-semibold text-[#4F407B]" : index < stage ? "text-[#746E80]" : "text-[#A39CAB]"}`}>{index < stage ? <Check className="size-3.5" /> : index === stage ? <Loader2 className="size-3.5 animate-spin" /> : <span className="size-3.5" />}{label}</div>)}</div>}</div><p className="mt-3 text-xs leading-5 text-[#8A8296]">No percentage is invented. These are the actual review categories KLEIO is working through while the analysis runs.</p></section>}

        {phase === "idle" && !insight && !error && <section className="rounded-[22px] border border-[#E2DCF1] bg-white p-5 text-sm leading-6 text-[#746E80]">Select at least two analyzable private sources in Media Library, then choose <strong className="text-[#5B4B8A]">Analyze together</strong>.</section>}

        {insight && phase === "ready" && <div className="space-y-4">
          <section className="rounded-[22px] border border-[#E2DCF1] bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#75639E]">Suggested reading</p><h3 className="mt-1 font-serif text-2xl font-semibold">{insight.title}</h3></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${insight.status === "confirmed" ? "bg-emerald-50 text-emerald-800" : "bg-[#F2EEFA] text-[#665A85]"}`}>{insight.status === "confirmed" ? "Artist-approved context" : "Needs your review"}</span></div><p className="mt-3 text-sm leading-7 text-[#4E4954]">{insight.summary || "KLEIO found relationships across the selected sources, but the artist should review the detailed patterns below before using them."}</p>{insight.confidence !== null && <p className="mt-2 text-xs text-[#8A8296]">Overall review confidence {Math.round(insight.confidence * 100)}% · confidence is a review aid, not verification.</p>}</section>

          <PatternList title="Recurring themes" patterns={insight.recurringThemes} sourceLabel={sourceLabel} />
          <PatternList title="Formal relationships" patterns={insight.formalRelationships} sourceLabel={sourceLabel} />
          <PatternList title="Materials and process patterns" patterns={insight.materialProcessPatterns} sourceLabel={sourceLabel} />
          <PatternList title="Dialogue between works" patterns={insight.workDialogues} sourceLabel={sourceLabel} />

          {insight.seriesPossibilities.length > 0 && <section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Possible ways to frame the group</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-[#4E4954]">{insight.seriesPossibilities.map((value) => <li key={value} className="border-l border-[#DCD4EE] pl-3">{value}</li>)}</ul></section>}

          {insight.applicationKeywords.length > 0 && <section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Application and discovery language</h3><div className="mt-3 flex flex-wrap gap-1.5">{insight.applicationKeywords.map((value) => <span key={value} className="rounded-full border border-[#E1DAF0] bg-[#F9F7FC] px-2.5 py-1 text-xs text-[#625C70]">{value}</span>)}</div></section>}

          {insight.questionsForArtist.length > 0 && <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-900">What only you can confirm</h3><ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-6 text-amber-950">{insight.questionsForArtist.map((value) => <li key={value}>{value}</li>)}</ul></section>}

          <section className="rounded-[22px] border border-[#D8D0F2] bg-white p-5"><div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#5B4B8A]" /><div><h3 className="text-sm font-semibold">Choose what becomes reusable artist context</h3><p className="mt-1 text-xs leading-5 text-[#746E80]">Generated patterns stay suggestions. KLEIO application drafting can use only the text you review and keep below.</p></div></div><label className="mt-4 block"><span className="text-xs font-semibold text-[#625C70]">Artist-approved body-of-work note</span><textarea value={draftSummary} onChange={(event) => setDraftSummary(event.target.value)} rows={7} className="mt-2 w-full rounded-xl border border-[#DED7EF] bg-white px-3 py-3 text-sm leading-6 text-[#292631] outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12" /></label><div className="mt-4 flex flex-wrap items-center justify-between gap-2"><button type="button" className={secondary} onClick={() => void dismiss()} disabled={saving}>Not useful</button><button type="button" className={primary} onClick={() => void confirm()} disabled={saving || !draftSummary.trim()}>{saving ? <Loader2 className="size-4 animate-spin" /> : insight.status === "confirmed" ? <Check className="size-4" /> : <Sparkles className="size-4" />}{insight.status === "confirmed" ? "Save reviewed context" : "Keep as artist context"}</button></div></section>

          {insight.limitations.length > 0 && <details className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Analysis limitations</summary><ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-5 text-[#746E80]">{insight.limitations.map((value) => <li key={value}>{value}</li>)}</ul></details>}
        </div>}
      </div>
    </aside>
  </div>
}
