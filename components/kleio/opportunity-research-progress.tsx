"use client"

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ExternalLink,
  FileSearch,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Square,
} from "lucide-react"
import {
  assessCandidateRequirement,
  isOpportunityResearchActive,
  type CandidateMatch,
  type OpportunityResearchSession,
  type OpportunityResearchStep,
} from "@/lib/kleio-opportunity-research"
import type { ArtistPassportRecord, PortfolioWorkRecord } from "@/lib/kleio-live-data"

const panel = "fixed bottom-4 right-4 z-50 w-[min(94vw,430px)] overflow-hidden rounded-[1.35rem] border border-[#DED6F3] bg-white shadow-[0_24px_70px_rgba(67,50,112,0.18)]"
const secondary = "inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3 text-xs font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F9F7FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"

function displayLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function safePublicUrl(value: string) {
  try {
    const url = new URL(value)
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : ""
  } catch {
    return ""
  }
}

function statusCopy(session: OpportunityResearchSession | null, loading: boolean) {
  if (loading || !session) return "Preparing source review"
  if (session.status === "queued") return "Research queued"
  if (isOpportunityResearchActive(session.status)) return "Reviewing public sources"
  if (["complete", "succeeded"].includes(session.status)) return "Research complete"
  if (["artist_review_required", "partial"].includes(session.status)) return "Artist review required"
  if (session.status === "blocked") return "Research blocked by source access"
  if (session.status === "failed") return "Research needs attention"
  if (session.status === "cancelled") return "Research cancelled"
  if (session.status === "stale") return "Research is stale"
  return displayLabel(session.status)
}

function stepIcon(step: OpportunityResearchStep) {
  if (step.status === "running") return <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none text-[#6E5AA6]" />
  if (step.status === "completed") return <CheckCircle2 className="size-3.5 text-emerald-600" />
  if (["failed", "blocked"].includes(step.status)) return <AlertTriangle className="size-3.5 text-amber-600" />
  if (step.status === "cancelled") return <Square className="size-3.5 text-[#8A8194]" />
  return <Circle className="size-3.5 text-[#C8BDE9]" />
}

function confidenceTone(value: string) {
  if (["verified", "corroborated", "institution-confirmed"].includes(value)) return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (["likely", "artist-confirmed"].includes(value)) return "border-amber-200 bg-amber-50 text-amber-800"
  return "border-[#DDD4F2] bg-[#F6F2FF] text-[#655295]"
}

function matchTone(match: CandidateMatch) {
  if (match.status === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (match.status === "ready_requires_selection" || match.status === "artist_confirmation_required") return "border-blue-200 bg-blue-50 text-blue-800"
  if (["missing", "below_minimum", "exceeds_limit", "blocked"].includes(match.status)) return "border-red-200 bg-red-50 text-red-800"
  return "border-amber-200 bg-amber-50 text-amber-800"
}

function formatDate(value: string | null) {
  if (!value) return "Not available"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Not available"
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(parsed)
}

export function OpportunityResearchProgress({
  session,
  passport,
  portfolioWorks,
  loading,
  error,
  minimized,
  onToggleMinimized,
  onResearchAgain,
  onCancel,
}: {
  session: OpportunityResearchSession | null
  passport: ArtistPassportRecord | null
  portfolioWorks: PortfolioWorkRecord[]
  loading: boolean
  error: string
  minimized: boolean
  onToggleMinimized: () => void
  onResearchAgain: () => void
  onCancel: () => void
}) {
  const progress = session?.progress_percent ?? (loading ? 3 : 0)
  const active = loading || Boolean(session && isOpportunityResearchActive(session.status))
  const canRetry = Boolean(session && ["artist_review_required", "complete", "succeeded", "partial", "blocked", "failed", "cancelled", "stale"].includes(session.status))
  const latestJob = session?.jobs[0] ?? null
  const pdfDocuments = session?.documents.filter((document) => document.document_kind === "pdf") ?? []

  if (minimized) {
    return (
      <button
        type="button"
        className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-[#DED6F3] bg-white px-4 py-3 text-left shadow-[0_18px_50px_rgba(67,50,112,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        onClick={onToggleMinimized}
        aria-label="Open KLEIO opportunity research"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#F4F0FF] text-[#5B4B8A]">
          {active ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <FileSearch className="size-4" />}
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
    <aside className={panel} aria-live="polite" aria-label="KLEIO opportunity research">
      <header className="border-b border-[#ECE7F7] bg-[linear-gradient(135deg,#FAF8FF_0%,#FFFFFF_72%)] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#EFE9FF] text-[#5B4B8A]">
              {active ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <ShieldCheck className="size-4" />}
            </span>
            <div className="min-w-0">
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-[#9A87D8]">KLEIO source review</p>
              <h2 className="mt-0.5 text-sm font-semibold text-[#292631]">{statusCopy(session, loading)}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Public sources only. Research findings remain session-specific until formally reviewed. Nothing is sent or submitted.</p>
            </div>
          </div>
          <button type="button" className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" onClick={onToggleMinimized} aria-label="Minimize research panel">
            <ChevronDown className="size-4" />
          </button>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#EAE4F8]" aria-hidden="true">
          <div className="h-full rounded-full bg-[#7763B2] transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[0.65rem] font-medium text-muted-foreground">
          <span>{session?.current_stage ? displayLabel(session.current_stage) : "Preparing"}</span>
          <span>{progress}%</span>
        </div>
      </header>

      <div className="max-h-[66vh] overflow-y-auto px-4 py-4">
        {error && <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-800">{error}</div>}
        {session?.error_message && <div role="alert" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">{session.error_message}</div>}

        <section aria-labelledby="research-steps-title">
          <h3 id="research-steps-title" className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#80748C]">Research progress</h3>
          <div className="mt-2 space-y-1.5">
            {(session?.steps ?? []).map((step) => (
              <div key={step.id} className="flex items-start gap-2.5 rounded-xl px-2 py-1.5">
                <span className="mt-0.5">{stepIcon(step)}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#383240]">{step.user_message || step.label}</p>
                  {step.status === "blocked" && <p className="mt-0.5 text-[0.67rem] leading-relaxed text-amber-700">KLEIO did not bypass the source restriction.</p>}
                </div>
              </div>
            ))}
            {!session?.steps.length && !error && <div className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />Creating a durable research job…</div>}
          </div>
        </section>

        {session && !active && (
          <section className="mt-4 grid grid-cols-3 gap-2 border-t border-[#ECE7F7] pt-4" aria-label="Research summary">
            <div className="rounded-xl bg-[#F8F5FF] px-2 py-2.5 text-center"><p className="font-serif text-lg font-semibold text-[#4E426F]">{session.source_count}</p><p className="text-[0.62rem] text-muted-foreground">Sources</p></div>
            <div className="rounded-xl bg-[#F8F5FF] px-2 py-2.5 text-center"><p className="font-serif text-lg font-semibold text-[#4E426F]">{session.candidate_requirements.length}</p><p className="text-[0.62rem] text-muted-foreground">Candidates</p></div>
            <div className="rounded-xl bg-[#F8F5FF] px-2 py-2.5 text-center"><p className="font-serif text-lg font-semibold text-[#4E426F]">{session.unresolved_count}</p><p className="text-[0.62rem] text-muted-foreground">Review</p></div>
          </section>
        )}

        {session?.candidate_requirements.length ? (
          <details open={!active} className="mt-4 border-t border-[#ECE7F7] pt-3">
            <summary className="cursor-pointer text-xs font-semibold text-[#5B4B8A]">Newly researched requirements ({session.candidate_requirements.length})</summary>
            <div className="mt-2 space-y-2.5">
              {session.candidate_requirements.map((requirement) => {
                const match = assessCandidateRequirement(requirement, passport, portfolioWorks)
                const href = safePublicUrl(requirement.source_url)
                return (
                  <article key={requirement.id} className="rounded-xl border border-[#EAE5F4] p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-[#383240]">{requirement.label}</h4>
                        <p className="mt-0.5 text-[0.65rem] text-muted-foreground">Session candidate · not a shared canonical requirement</p>
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wide ${confidenceTone(requirement.confidence_status)}`}>{displayLabel(requirement.confidence_status)}</span>
                    </div>
                    <p className="mt-2 text-[0.69rem] leading-relaxed text-[#625C70]">{requirement.source_text || requirement.description}</p>
                    <div className={`mt-2 rounded-lg border px-2.5 py-2 text-[0.67rem] leading-relaxed ${matchTone(match)}`}>
                      <strong>{displayLabel(match.status)}:</strong> {match.explanation}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.64rem] text-muted-foreground">
                      <span>{requirement.evidence_location || "Source section"}</span>
                      <span>{requirement.extraction_method === "manual_review" ? "Manual review required" : `Extracted by ${displayLabel(requirement.extraction_method)}`}</span>
                      {href && <a className="inline-flex items-center gap-1 font-semibold text-primary hover:underline" href={href} target="_blank" rel="noreferrer">Open evidence<ExternalLink className="size-3" /></a>}
                    </div>
                  </article>
                )
              })}
            </div>
          </details>
        ) : null}

        {pdfDocuments.length ? (
          <details className="mt-4 border-t border-[#ECE7F7] pt-3">
            <summary className="cursor-pointer text-xs font-semibold text-[#5B4B8A]">Documents found ({pdfDocuments.length})</summary>
            <div className="mt-2 space-y-2">
              {pdfDocuments.map((document) => (
                <div key={document.id} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                  <p className="font-semibold">{document.extraction_status === "text_extracted" ? `${document.page_count ?? 0} pages extracted` : "PDF preserved for review"}</p>
                  <p className="mt-1 text-[0.67rem] leading-relaxed">{document.extraction_status === "text_extracted" ? "Page-level evidence is available below the associated requirements." : "The public PDF is stored privately, but page-level parsing is feature-gated until the dedicated parser passes runtime validation. KLEIO does not claim the document was read."}</p>
                </div>
              ))}
            </div>
          </details>
        ) : null}

        {session?.conflicts.length ? (
          <details open className="mt-4 border-t border-[#ECE7F7] pt-3">
            <summary className="cursor-pointer text-xs font-semibold text-red-700">Blocking source conflicts ({session.conflicts.length})</summary>
            <div className="mt-2 space-y-2">
              {session.conflicts.map((conflict) => <div key={conflict.id} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"><p className="font-semibold">{displayLabel(conflict.normalized_key)}</p><p className="mt-1 text-[0.67rem] leading-relaxed">KLEIO preserved conflicting source values and will not treat this fact as settled until reviewed.</p></div>)}
            </div>
          </details>
        ) : null}

        {session?.sources.length ? (
          <details className="mt-4 border-t border-[#ECE7F7] pt-3">
            <summary className="cursor-pointer text-xs font-semibold text-[#5B4B8A]">Sources reviewed ({session.sources.length})</summary>
            <div className="mt-2 space-y-2">
              {session.sources.map((source) => {
                const href = safePublicUrl(source.final_url || source.url)
                return (
                  <div key={source.id} className="rounded-xl border border-[#ECE7F7] px-3 py-2">
                    <div className="flex items-start justify-between gap-2"><p className="line-clamp-2 text-xs font-semibold text-[#383240]">{source.title || displayLabel(source.source_role)}</p><span className="shrink-0 rounded-full bg-[#F4F0FF] px-2 py-0.5 text-[0.58rem] font-semibold uppercase text-[#6A579F]">{displayLabel(source.access_status)}</span></div>
                    <p className="mt-1 text-[0.65rem] leading-relaxed text-muted-foreground">{displayLabel(source.authority_status)} · checked {formatDate(source.checked_at)}</p>
                    {source.notes && <p className="mt-1 text-[0.65rem] leading-relaxed text-muted-foreground">{source.notes}</p>}
                    {href && <a className="mt-1.5 inline-flex items-center gap-1 text-[0.66rem] font-semibold text-primary hover:underline" href={href} target="_blank" rel="noreferrer">Open source<ExternalLink className="size-3" /></a>}
                  </div>
                )
              })}
            </div>
          </details>
        ) : null}

        {session && (
          <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#ECE7F7] pt-4">
            <div className="text-[0.65rem] leading-relaxed text-muted-foreground">
              <p>{latestJob ? `Attempt ${latestJob.attempt_count} of ${latestJob.max_attempts}` : "Durable job state unavailable"}</p>
              <p>Last updated {formatDate(session.updated_at)}</p>
            </div>
            <div className="flex gap-2">
              {active && <button type="button" className={secondary} onClick={onCancel}><Square className="size-3.5" />Cancel</button>}
              {canRetry && <button type="button" className={secondary} onClick={onResearchAgain}><RefreshCw className="size-3.5" />Research again</button>}
            </div>
          </footer>
        )}
      </div>
    </aside>
  )
}
