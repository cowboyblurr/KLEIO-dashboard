"use client"

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react"
import type {
  OpportunityResearchSession,
  OpportunityResearchStep,
} from "@/lib/kleio-opportunity-research"

const panel = "fixed bottom-4 right-4 z-50 w-[min(92vw,390px)] overflow-hidden rounded-[1.35rem] border border-[#DED6F3] bg-white shadow-[0_24px_70px_rgba(67,50,112,0.18)]"
const secondary = "inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3 text-xs font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F9F7FD] disabled:cursor-not-allowed disabled:opacity-50"

function stepIcon(step: OpportunityResearchStep) {
  if (step.status === "running") return <Loader2 className="size-3.5 animate-spin text-[#6E5AA6]" />
  if (step.status === "completed") return <CheckCircle2 className="size-3.5 text-emerald-600" />
  if (step.status === "failed" || step.status === "blocked") return <AlertTriangle className="size-3.5 text-amber-600" />
  return <Circle className="size-3.5 text-[#C8BDE9]" />
}

function statusCopy(session: OpportunityResearchSession | null, loading: boolean) {
  if (loading || !session) return "Starting source review"
  if (session.status === "running" || session.status === "queued") return "Researching public sources"
  if (session.status === "succeeded") return "Research complete"
  if (session.status === "partial") return "Research complete · review needed"
  if (session.status === "failed") return "Source review needs attention"
  return "Research paused"
}

function confidenceTone(value: string) {
  if (value === "verified" || value === "corroborated") return "bg-emerald-50 text-emerald-700"
  if (value === "likely") return "bg-amber-50 text-amber-700"
  return "bg-[#F4F0FF] text-[#6A579F]"
}

function safeUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : ""
  } catch {
    return ""
  }
}

export function OpportunityResearchProgress({
  session,
  loading,
  error,
  minimized,
  onToggleMinimized,
  onResearchAgain,
}: {
  session: OpportunityResearchSession | null
  loading: boolean
  error: string
  minimized: boolean
  onToggleMinimized: () => void
  onResearchAgain: () => void
}) {
  const progress = session?.progress_percent ?? (loading ? 4 : 0)
  const isActive = loading || session?.status === "queued" || session?.status === "running"
  const canResearchAgain = Boolean(session && ["succeeded", "partial", "failed", "cancelled"].includes(session.status))
  const requirementFindings = [...(session?.findings ?? [])]
    .filter((finding) => finding.finding_type === "requirement")
    .sort((left, right) => Number(right.accepted) - Number(left.accepted) || Number(right.official_source) - Number(left.official_source))
    .filter((finding, index, findings) => findings.findIndex((candidate) => candidate.normalized_key === finding.normalized_key) === index)

  if (minimized) {
    return (
      <button
        type="button"
        className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-[#DED6F3] bg-white px-4 py-3 text-left shadow-[0_18px_50px_rgba(67,50,112,0.16)]"
        onClick={onToggleMinimized}
        aria-label="Open KLEIO opportunity research progress"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#F4F0FF] text-[#5B4B8A]">
          {isActive ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold text-[#292631]">{statusCopy(session, loading)}</span>
          <span className="block text-[0.68rem] text-muted-foreground">{progress}% complete</span>
        </span>
        <ChevronUp className="size-4 shrink-0 text-[#766B88]" />
      </button>
    )
  }

  return (
    <aside className={panel} aria-live="polite" aria-label="KLEIO opportunity research progress">
      <div className="border-b border-[#ECE7F7] bg-[linear-gradient(135deg,#FAF8FF_0%,#FFFFFF_72%)] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#EFE9FF] text-[#5B4B8A]">
              {isActive ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            </span>
            <div className="min-w-0">
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-[#9A87D8]">KLEIO research</p>
              <h2 className="mt-0.5 text-sm font-semibold text-[#292631]">{statusCopy(session, loading)}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Public sources only. Nothing is submitted or sent.
              </p>
            </div>
          </div>
          <button type="button" className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-white" onClick={onToggleMinimized} aria-label="Minimize research progress">
            <ChevronDown className="size-4" />
          </button>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#EAE4F8]">
          <div className="h-full rounded-full bg-[#7763B2] transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[0.65rem] font-medium text-muted-foreground">
          <span>{session?.current_stage ? session.current_stage.replaceAll("_", " ") : "Preparing"}</span>
          <span>{progress}%</span>
        </div>
      </div>

      <div className="max-h-[58vh] overflow-y-auto px-4 py-4">
        {error && (
          <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {(session?.steps ?? []).map((step) => (
            <div key={step.id} className="flex items-start gap-2.5 rounded-xl px-2 py-1.5">
              <span className="mt-0.5">{stepIcon(step)}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#383240]">{step.user_message || step.label}</p>
                {step.status === "blocked" && <p className="mt-0.5 text-[0.67rem] leading-relaxed text-amber-700">KLEIO did not bypass the source restriction.</p>}
              </div>
            </div>
          ))}
          {!session?.steps.length && !error && (
            <div className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Creating a source-backed research session…
            </div>
          )}
        </div>

        {session && !isActive && (
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#ECE7F7] pt-4 text-center">
            <div className="rounded-xl bg-[#F8F5FF] px-2 py-2.5"><p className="font-serif text-lg font-semibold text-[#4E426F]">{session.source_count}</p><p className="text-[0.62rem] text-muted-foreground">Sources</p></div>
            <div className="rounded-xl bg-[#F8F5FF] px-2 py-2.5"><p className="font-serif text-lg font-semibold text-[#4E426F]">{session.verified_requirement_count}</p><p className="text-[0.62rem] text-muted-foreground">Verified</p></div>
            <div className="rounded-xl bg-[#F8F5FF] px-2 py-2.5"><p className="font-serif text-lg font-semibold text-[#4E426F]">{session.unresolved_count}</p><p className="text-[0.62rem] text-muted-foreground">Review</p></div>
          </div>
        )}

        {requirementFindings.length ? (
          <details className="mt-4 border-t border-[#ECE7F7] pt-3" open={!isActive}>
            <summary className="cursor-pointer text-xs font-semibold text-[#5B4B8A]">Requirements found ({requirementFindings.length})</summary>
            <div className="mt-2 space-y-2">
              {requirementFindings.map((finding) => {
                const href = safeUrl(finding.source_url)
                return (
                  <div key={finding.id} className="rounded-xl border border-[#ECE7F7] px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#383240]">{finding.label}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[0.58rem] font-semibold uppercase ${confidenceTone(finding.confidence_status)}`}>{finding.confidence_status}</span>
                    </div>
                    <p className="mt-1 line-clamp-3 text-[0.65rem] leading-relaxed text-muted-foreground">{finding.original_text}</p>
                    {href && <a className="mt-1.5 inline-flex items-center gap-1 text-[0.66rem] font-semibold text-primary hover:underline" href={href} target="_blank" rel="noreferrer">Requirement source<ExternalLink className="size-3" /></a>}
                  </div>
                )
              })}
            </div>
          </details>
        ) : null}

        {session?.sources.length ? (
          <details className="mt-4 border-t border-[#ECE7F7] pt-3">
            <summary className="cursor-pointer text-xs font-semibold text-[#5B4B8A]">Sources reviewed ({session.sources.length})</summary>
            <div className="mt-2 space-y-2">
              {session.sources.slice(0, 5).map((source) => {
                const href = safeUrl(source.url)
                return (
                  <div key={source.id} className="rounded-xl border border-[#ECE7F7] px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-xs font-semibold text-[#383240]">{source.title || source.source_role.replaceAll("_", " ")}</p>
                      <span className="shrink-0 rounded-full bg-[#F4F0FF] px-2 py-0.5 text-[0.58rem] font-semibold uppercase text-[#6A579F]">{source.access_status}</span>
                    </div>
                    <p className="mt-1 text-[0.65rem] leading-relaxed text-muted-foreground">{source.notes || source.authority_status.replaceAll("_", " ")}</p>
                    {href && <a className="mt-1.5 inline-flex items-center gap-1 text-[0.66rem] font-semibold text-primary hover:underline" href={href} target="_blank" rel="noreferrer">Open source<ExternalLink className="size-3" /></a>}
                  </div>
                )
              })}
            </div>
          </details>
        ) : null}

        {canResearchAgain && (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#ECE7F7] pt-4">
            <p className="text-[0.67rem] leading-relaxed text-muted-foreground">Review every response and attachment before continuing.</p>
            <button type="button" className={secondary} onClick={onResearchAgain}><RefreshCw className="size-3.5" />Research again</button>
          </div>
        )}
      </div>
    </aside>
  )
}
