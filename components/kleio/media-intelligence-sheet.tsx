"use client"

/* eslint-disable @next/next/no-img-element -- private media uses short-lived signed URLs */

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { AudioLines, Check, Clipboard, FileSearch, FileText, Loader2, RefreshCcw, ShieldCheck, Video, X } from "lucide-react"
import type { ArtistMediaLibraryItem } from "@/lib/kleio-universal-media"
import { analyzeMediaWithKleio, canAnalyzeMediaItem, loadMediaIntelligence, mediaIntelligenceSupportText, retryDocumentPassportSynthesis, type MediaIntelligence } from "@/lib/kleio-media-intelligence"

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:opacity-50"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3 py-2 text-xs font-semibold text-[#5B4B8A] transition hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:opacity-50"

type Props = { item: ArtistMediaLibraryItem | null; open: boolean; onClose: () => void; onAnalyzed?: (analysis: MediaIntelligence) => void }
type Tab = "overview" | "passport" | "evidence"

function analysisStages(item: ArtistMediaLibraryItem) {
  if (item.mediaKind === "document") return [
    "Reading the document and its visual structure…",
    "Organizing page-grounded source details…",
    "Preparing Creative Passport fields from supported material…",
    "Checking for useful supported details that may have been missed…",
    "Preparing editable suggestions without changing your approved Passport…",
  ]
  if (item.mediaKind === "video") return [
    "Preparing the private video source…",
    "Noting visible motion, pacing, framing, and presentation…",
    "Organizing possible materials, processes, and descriptive terms…",
    "Keeping visible details separate from optional interpretation…",
    "Preparing editable Passport and application language…",
  ]
  if (item.mediaKind === "audio") return [
    "Preparing the private audio source…",
    "Noting structure, texture, voice/non-voice qualities, and production…",
    "Organizing possible sonic, material, and descriptive terms…",
    "Keeping source details separate from optional interpretation…",
    "Preparing editable Passport and application language…",
  ]
  return [
    "Preparing the private image source…",
    "Noting visible details, composition, and presentation…",
    "Organizing possible materials, processes, and descriptive terms…",
    "Keeping visible details separate from optional interpretation…",
    "Preparing editable metadata and application language…",
  ]
}

const PASSPORT_RETRY_STAGES = [
  "Reviewing your saved source evidence…",
  "Mapping supported details to your Creative Passport…",
  "Drafting bio, practice, mediums and disciplines…",
  "Checking themes, visual language and application terms…",
  "Verifying every suggestion against its source…",
  "Saving editable suggestions to your private review queue…",
] as const

function Preview({ item }: { item: ArtistMediaLibraryItem }) {
  if (item.mediaKind === "image" && item.previewUrl) return <img src={item.previewUrl} alt="" className="size-full object-contain" />
  if (item.mediaKind === "video" && item.previewUrl) return <video src={item.previewUrl} controls preload="metadata" className="size-full object-contain" aria-label={`${item.title} video`} />
  if (item.mediaKind === "audio" && item.previewUrl) return <div className="flex w-full flex-col items-center gap-4 px-5"><AudioLines className="size-9 text-[#75639E]" /><audio src={item.previewUrl} controls preload="metadata" className="w-full" aria-label={`${item.title} audio`} /></div>
  if (item.mediaKind === "video") return <Video className="size-9 text-[#75639E]" />
  if (item.mediaKind === "audio") return <AudioLines className="size-9 text-[#75639E]" />
  return <FileText className="size-9 text-[#75639E]" />
}

function Chips({ values, incomplete = false }: { values: string[]; incomplete?: boolean }) {
  if (!values.length) return <p className="text-xs leading-5 text-[#8A8296]">{incomplete ? "Media Assist needs another pass before it can prepare a useful suggestion for this field." : "Media Assist couldn't prepare a useful suggestion for this field from this source."}</p>
  return <div className="flex flex-wrap gap-1.5">{values.map((value) => <span key={value} className="rounded-full border border-[#E1DAF0] bg-[#F9F7FC] px-2.5 py-1 text-xs text-[#625C70]">{value}</span>)}</div>
}

function List({ title, values, caution = false }: { title: string; values: string[]; caution?: boolean }) {
  if (!values.length) return null
  return <section className={`rounded-2xl border p-4 ${caution ? "border-amber-200 bg-amber-50/70" : "border-[#E7E1F7] bg-white"}`}><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">{title}</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-[#4E4954]">{values.map((value, index) => <li key={`${title}-${index}`} className="border-l border-[#DCD4EE] pl-3">{value}</li>)}</ul></section>
}

function DraftCard({ title, text, copyLabel, copied, onCopy, reviewable = false }: { title: string; text: string; copyLabel: string; copied: string; onCopy: (value: string, label: string) => Promise<void>; reviewable?: boolean }) {
  if (!text) return null
  return <section className="rounded-2xl border border-[#DCD4EE] bg-[linear-gradient(145deg,#FFFFFF,#FBF9FF)] p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-[#8A79B2]">Source-grounded draft</p><h3 className="mt-1 font-serif text-lg font-semibold text-[#3E354D]">{title}</h3></div><div className="flex flex-wrap gap-2">{reviewable && <Link href="/artist-dashboard/passport/review/" className={secondary}><FileSearch className="size-3.5" />Edit & apply</Link>}<button type="button" className={secondary} onClick={() => void onCopy(text, copyLabel)}><Clipboard className="size-3.5" />{copied === copyLabel ? "Copied" : "Copy"}</button></div></div><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#4E4954]">{text}</p><p className="mt-3 text-[0.68rem] leading-5 text-[#8A8296]">Prepared from your private source for review. It remains a suggestion until you edit or approve it.</p></section>
}

function AnalysisProgress({ item, stage }: { item: ArtistMediaLibraryItem; stage: number }) {
  const stages = analysisStages(item)
  return <div className="mt-4 rounded-2xl border border-[#E7E1F7] bg-[#FAF8FE] p-4" aria-live="polite"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#75639E]">Media Assist is preparing</p><div className="mt-3 space-y-2">{stages.map((label, index) => <div key={label} className={`flex items-center gap-2 text-sm ${index === stage ? "font-semibold text-[#4F407B]" : index < stage ? "text-[#746E80]" : "text-[#A39CAB]"}`}>{index < stage ? <Check className="size-3.5" /> : index === stage ? <Loader2 className="size-3.5 animate-spin" /> : <span className="size-3.5" />}{label}</div>)}</div><p className="mt-3 text-xs leading-5 text-[#8A8296]">No creative score is created. These steps organize source-grounded suggestions for you to edit, keep, or ignore.</p></div>
}

function PassportRetryProgress({ stage, elapsedMs }: { stage: number; elapsedMs: number }) {
  const slow = elapsedMs >= 45_000
  return <div className="mt-3 rounded-xl border border-[#E6D9AE] bg-white/75 p-3" aria-live="polite">
    <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-amber-950">Preparing your Passport suggestions</p><span className="text-[0.65rem] text-amber-900/65">You can close this panel safely</span></div>
    <div className="mt-3 flex gap-1" aria-hidden="true">{PASSPORT_RETRY_STAGES.map((_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full transition-colors ${index < stage ? "bg-[#8B79B4]" : index === stage ? "animate-pulse bg-[#B4A2DA]" : "bg-[#E9E3F2]"}`} />)}</div>
    <div className="mt-3 space-y-1.5">{PASSPORT_RETRY_STAGES.map((label, index) => <div key={label} className={`flex items-start gap-2 text-xs leading-5 ${index === stage ? "font-semibold text-[#4F407B]" : index < stage ? "text-[#746E80]" : "text-[#A39CAB]"}`}>{index < stage ? <Check className="mt-0.5 size-3.5 shrink-0" /> : index === stage ? <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin" /> : <span className="mt-0.5 size-3.5 shrink-0" />}{label}</div>)}</div>
    <p className="mt-3 text-[0.68rem] leading-5 text-[#746E80]">{slow ? "Still working — larger portfolios can take a little longer while KLEIO verifies the suggestions against the source." : "KLEIO is working through the saved evidence and checking each editable suggestion before it reaches your review queue."}</p>
    <p className="mt-1 text-[0.62rem] leading-4 text-[#9A93A4]">This is a workflow activity indicator, not an exact percentage or countdown.</p>
  </div>
}

export function MediaIntelligenceSheet({ item, open, onClose, onAnalyzed }: Props) {
  const [analysis, setAnalysis] = useState<MediaIntelligence | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [repairing, setRepairing] = useState(false)
  const [analysisStage, setAnalysisStage] = useState(0)
  const [repairStage, setRepairStage] = useState(0)
  const [repairElapsedMs, setRepairElapsedMs] = useState(0)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<Tab>("overview")
  const [copied, setCopied] = useState("")
  const dialogRef = useRef<HTMLElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!open || !item?.sourceId) { setAnalysis(null); setError(""); return }
    let active = true
    setLoading(true); setError(""); setTab("overview")
    void loadMediaIntelligence(item.sourceId).then((value) => { if (active) setAnalysis(value) }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Media Assist could not load this source yet.") }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [item?.id, item?.sourceId, open])

  useEffect(() => {
    if (!open) return
    if (!dialogRef.current) return
    const activeDialog = dialogRef.current!
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(",")

    function focusableElements() {
      return Array.from(activeDialog.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true")
    }

    function handleMediaAssistDialogKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== "Tab") return
      const focusable = focusableElements()
      if (!focusable.length) {
        event.preventDefault()
        activeDialog.focus()
        return
      }
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

    activeDialog.addEventListener("keydown", handleMediaAssistDialogKeyDown)
    window.requestAnimationFrame(() => focusableElements()[0]?.focus() ?? activeDialog.focus())
    return () => {
      activeDialog.removeEventListener("keydown", handleMediaAssistDialogKeyDown)
      window.requestAnimationFrame(() => previousFocusRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    if (!analyzing || !item) return
    const stages = analysisStages(item)
    setAnalysisStage(0)
    const timer = window.setInterval(() => setAnalysisStage((current) => Math.min(current + 1, stages.length - 1)), 1900)
    return () => window.clearInterval(timer)
  }, [analyzing, item])

  useEffect(() => {
    if (!repairing) return
    const startedAt = Date.now()
    const thresholds = [0, 8_000, 20_000, 35_000, 52_000, 70_000]
    setRepairStage(0); setRepairElapsedMs(0)
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      setRepairElapsedMs(elapsed)
      let next = 0
      for (let index = 1; index < thresholds.length; index += 1) if (elapsed >= thresholds[index]) next = index
      setRepairStage(next)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [repairing])

  if (!open || !item) return null
  const activeItem = item
  const documentIncomplete = analysis?.isDocumentAnalysis && analysis.pipelineStatus !== "READY_FOR_REVIEW"

  async function analyze(force = false) {
    if (analyzing || repairing) return
    setAnalyzing(true); setAnalysisStage(0); setError("")
    try {
      const next = await analyzeMediaWithKleio(activeItem, { force })
      setAnalysis(next)
      setTab(next.isDocumentAnalysis && next.profileSynthesisReady ? "passport" : "overview")
      onAnalyzed?.(next)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Media Assist could not prepare suggestions from this private source.")
    } finally {
      setAnalyzing(false)
    }
  }

  async function retryPassport() {
    if (repairing || analyzing || activeItem.mimeType !== "application/pdf") return
    const previousGeneratedAt = analysis?.profileSynthesisReady ? analysis.analyzedAt : ""
    setRepairing(true); setRepairStage(0); setRepairElapsedMs(0); setError("")
    try {
      const next = await retryDocumentPassportSynthesis(activeItem)
      setAnalysis(next); setTab("passport"); onAnalyzed?.(next)
    } catch (reason) {
      let recovered: MediaIntelligence | null = null
      for (const delayMs of [0, 1_500, 3_000]) {
        if (delayMs) await new Promise((resolve) => window.setTimeout(resolve, delayMs))
        try {
          const candidate = activeItem.sourceId ? await loadMediaIntelligence(activeItem.sourceId) : null
          if (candidate?.profileSynthesisReady && candidate.pipelineStatus === "READY_FOR_REVIEW" && candidate.analyzedAt && candidate.analyzedAt !== previousGeneratedAt) {
            recovered = candidate
            break
          }
        } catch {
          // Preserve the original synthesis error if reconciliation itself cannot load.
        }
      }
      if (recovered) {
        setAnalysis(recovered); setTab("passport"); onAnalyzed?.(recovered)
      } else {
        setError(reason instanceof Error ? reason.message : "Media Assist could not rebuild these Passport suggestions. Your source notes are still available.")
      }
    } finally {
      setRepairing(false)
    }
  }

  async function copy(value: string, label: string) {
    if (!value) return
    await navigator.clipboard.writeText(value); setCopied(label); window.setTimeout(() => setCopied(""), 1600)
  }

  return <div className="fixed inset-0 z-[120] flex justify-end bg-[#21192D]/35 backdrop-blur-[2px]">
    <button type="button" className="absolute inset-0" aria-label="Close Media Assist" onClick={onClose} />
    <aside ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="media-assist-title" aria-busy={analyzing || repairing} tabIndex={-1} className="relative z-10 flex h-dvh w-full max-w-[620px] flex-col overflow-hidden border-l border-[#DDD5EE] bg-[#FCFBFE] text-[#292631] shadow-[-24px_0_70px_rgba(54,42,82,0.16)]">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E7E1F7] bg-white px-5 py-4"><div className="min-w-0"><p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Private artist tool</p><h2 id="media-assist-title" className="mt-1 font-serif text-2xl font-semibold">Media Assist</h2><p className="mt-1 truncate text-xs text-[#746E80]">{activeItem.title} · <span className="capitalize">{activeItem.mediaKind}</span></p></div><button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-xl border border-[#E2DCF1] bg-white" aria-label="Close"><X className="size-4" /></button></header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid min-h-[220px] place-items-center border-b border-[#E7E1F7] bg-[#F3F0F8]"><Preview item={activeItem} /></div>
        <div className="p-5">
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}{analysis && <p className="mt-1 text-xs leading-5 text-red-700/80">Your previous Media Assist result is still available below.</p>}</div>}
          {loading ? <div className="grid place-items-center py-12 text-sm text-[#746E80]"><Loader2 className="mb-2 size-5 animate-spin" />Loading Media Assist…</div> : !analysis ? <section className="rounded-[22px] border border-[#E2DCF1] bg-white p-5"><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#F0EAFB] text-[#5B4B8A]"><FileSearch className="size-5" /></span><div><h3 className="font-serif text-xl font-semibold">Prepare useful details from this source</h3><p className="mt-2 text-sm leading-6 text-[#625C70]">{mediaIntelligenceSupportText(activeItem)}</p></div></div><div className="mt-4 rounded-xl border border-[#E7E1F7] bg-[#FAF8FE] px-3 py-3 text-xs leading-5 text-[#746E80]"><ShieldCheck className="mr-1.5 inline size-3.5 text-[#5B4B8A]" />Media Assist stays private. Confidence is an analysis aid, not verification. It can organize observations and draft language, but it does not score the work, decide its meaning, or change your approved Passport without you.</div>{analyzing && <AnalysisProgress item={activeItem} stage={analysisStage} />}{canAnalyzeMediaItem(activeItem) && <button type="button" aria-label="Run Media Assist" className={`${primary} mt-4 w-full`} onClick={() => void analyze()} disabled={analyzing || repairing}>{analyzing ? <Loader2 className="size-4 animate-spin" /> : <FileSearch className="size-4" />}{analyzing ? "Media Assist is preparing suggestions…" : activeItem.mimeType === "application/pdf" ? "Run Media Assist + prepare Passport suggestions" : "Run Media Assist"}</button>}</section> : <>
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2">{analysis.isDocumentAnalysis ? analysis.pipelineStatus === "READY_FOR_REVIEW" ? <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"><Check className="size-3.5" />Passport suggestions ready</span> : <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">Source notes ready · Passport incomplete</span> : <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"><Check className="size-3.5" />Media Assist ready</span>}{analysis.isDocumentAnalysis && analysis.draftedFieldCount > 0 && <span className="rounded-full border border-[#CFC3EE] bg-[#F4F0FC] px-2.5 py-1 text-xs font-semibold text-[#5B4B8A]">{analysis.draftedFieldCount} Passport field{analysis.draftedFieldCount === 1 ? "" : "s"} drafted</span>}{analysis.isDocumentAnalysis && analysis.needsInputCount > 0 && <span className="rounded-full border border-[#E1DAF0] bg-white px-2.5 py-1 text-xs font-semibold text-[#625C70]">{analysis.needsInputCount} need your input</span>}{analysis.proposalCount > 0 && <span className="rounded-full border border-[#E1DAF0] bg-white px-2.5 py-1 text-xs font-semibold text-[#625C70]">{analysis.proposalCount} source fact{analysis.proposalCount === 1 ? "" : "s"}</span>}</div><button type="button" className={secondary} onClick={() => void analyze(true)} disabled={analyzing || repairing}>{analyzing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCcw className="size-3.5" />}{analyzing ? "Refreshing…" : analysis.isDocumentAnalysis ? "Refresh source + Passport" : "Refresh Media Assist"}</button></div>
            {analyzing && <AnalysisProgress item={activeItem} stage={analysisStage} />}
            <p className="mt-2 text-[0.68rem] leading-5 text-[#8A8296]">Refreshing keeps the previous successful result until a new one is ready. Every generated phrase remains editable and optional.</p>
            {analysis.isDocumentAnalysis && documentIncomplete && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"><strong>{analysis.profileSynthesisReady ? "Some Passport fields still need attention." : "The PDF source notes are ready, but Passport drafting did not finish."}</strong><p className="mt-1">{analysis.pipelineMessage || "Your source notes remain saved instead of being treated as a completed Passport."}</p>{repairing && <PassportRetryProgress stage={repairStage} elapsedMs={repairElapsedMs} />}<button type="button" className={`${secondary} mt-3 border-amber-300 bg-white text-amber-900`} onClick={() => void retryPassport()} disabled={repairing || analyzing}>{repairing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCcw className="size-3.5" />}{repairing ? "Passport drafting in progress…" : "Retry Passport drafting only"}</button></div>}
            {analysis.isDocumentAnalysis && analysis.profileSynthesisReady && <div className="mt-4 flex flex-col gap-2 rounded-xl border border-[#DCD4EE] bg-[#FAF8FE] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-[#4F407B]">Suggestions are ready to edit</p><p className="mt-0.5 text-xs leading-5 text-[#746E80]">Media Assist sent source-grounded proposals into your private review queue. Nothing changes your approved Passport until you confirm it.</p></div><Link href="/artist-dashboard/passport/review/" className={`${primary} shrink-0`}><FileSearch className="size-4" />Review & apply</Link></div>}
            <div className="mt-4 flex gap-1 rounded-xl bg-[#F1EEF6] p-1">{(["overview","passport","evidence"] as Tab[]).map((value) => <button key={value} type="button" onClick={() => setTab(value)} className={`min-h-9 flex-1 rounded-lg px-3 text-xs font-semibold capitalize ${tab === value ? "bg-white text-[#4F407B] shadow-sm" : "text-[#746E80]"}`}>{value === "passport" ? "Passport suggestions" : value === "evidence" ? "Source notes" : value}</button>)}</div>
            {tab === "overview" && <div className="mt-4 space-y-4"><section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><div className="flex items-center justify-between gap-2"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">{analysis.bioDraft ? "Bio draft" : "At a glance"}</h3>{analysis.bioDraft && <button type="button" className={secondary} onClick={() => void copy(analysis.bioDraft, "bio-overview")}><Clipboard className="size-3.5" />{copied === "bio-overview" ? "Copied" : "Copy"}</button>}</div><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#4E4954]">{analysis.summary || analysis.suggestedDescription || "No concise summary was supported."}</p></section><section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Possible themes and concepts</h3><div className="mt-3"><Chips values={analysis.themesConcepts} incomplete={Boolean(documentIncomplete)} /></div></section>{analysis.formalQualities.length > 0 && <section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Visible / formal language</h3><div className="mt-3"><Chips values={analysis.formalQualities} /></div></section>}</div>}
            {tab === "passport" && <div className="mt-4 space-y-4">{analysis.isDocumentAnalysis ? <><DraftCard title="Bio" text={analysis.bioDraft} copyLabel="bio" copied={copied} onCopy={copy} reviewable={analysis.profileSynthesisReady} /><DraftCard title="Artist statement" text={analysis.artistStatementDraft} copyLabel="artist-statement" copied={copied} onCopy={copy} reviewable={analysis.profileSynthesisReady} /><DraftCard title="Practice description" text={analysis.practiceDescriptionDraft} copyLabel="practice" copied={copied} onCopy={copy} reviewable={analysis.profileSynthesisReady} />{!analysis.bioDraft && !analysis.artistStatementDraft && !analysis.practiceDescriptionDraft && analysis.suggestedDescription && <DraftCard title="Suggested profile description" text={analysis.suggestedDescription} copyLabel="description" copied={copied} onCopy={copy} reviewable={analysis.profileSynthesisReady} />}</> : analysis.suggestedDescription && <DraftCard title="Suggested description" text={analysis.suggestedDescription} copyLabel="description" copied={copied} onCopy={copy} />}<section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Mediums and materials</h3><div className="mt-3"><Chips values={analysis.mediumsMaterials} incomplete={Boolean(documentIncomplete)} /></div></section><section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Disciplines</h3><div className="mt-3"><Chips values={analysis.disciplines} incomplete={Boolean(documentIncomplete)} /></div></section><section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Possible themes and concepts</h3><div className="mt-3"><Chips values={analysis.themesConcepts} incomplete={Boolean(documentIncomplete)} /></div></section><section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Visible / formal language</h3><div className="mt-3"><Chips values={analysis.formalQualities} incomplete={Boolean(documentIncomplete)} /></div></section><section className="rounded-2xl border border-[#E7E1F7] bg-white p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#75639E]">Application keywords</h3><div className="mt-3"><Chips values={analysis.applicationKeywords} incomplete={Boolean(documentIncomplete)} /></div></section></div>}
            {tab === "evidence" && <div className="mt-4 space-y-4"><List title="Source-supported profile and career details" values={analysis.factualObservations} /><List title={analysis.isDocumentAnalysis ? "Artist-authored and interpretive drafts" : "Possible interpretation — edit or ignore"} values={analysis.interpretiveObservations} /><List title="Additional supported details" values={analysis.technicalObservations} /><List title="Needs your confirmation" values={analysis.uncertainties} caution /><List title="Source limitations" values={analysis.limitations} caution />{analysis.isDocumentAnalysis && analysis.profileSynthesisReady && <Link href="/artist-dashboard/passport/review/" className={`${secondary} w-full`}><FileSearch className="size-4" />Open field-level source review</Link>}</div>}
          </>}
        </div>
      </div>
    </aside>
  </div>
}
