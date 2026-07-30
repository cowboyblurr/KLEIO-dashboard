"use client"

import { useEffect, useState } from "react"
import { Check, FileSearch, FileUp, Loader2, RotateCcw, X } from "lucide-react"
import {
  approveArtistImportProposal,
  extractArtistPdf,
  extractArtistText,
  loadArtistImportProposals,
  setArtistImportProposalStatus,
  type ArtistImportProposal,
} from "@/lib/kleio-artist-import"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"

const input = "h-11 w-full rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/10"
const textarea = "w-full rounded-xl border border-[#E7E1F7] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/10"
const primary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] disabled:cursor-not-allowed disabled:opacity-50"

function fieldLabel(value: string) {
  const labels: Record<string, string> = {
    professional_name: "Professional name",
    location: "Location",
    bio: "Biography",
    artist_statement: "Artist statement",
    practice_description: "Practice description",
    website_url: "Website",
    disciplines: "Disciplines",
    mediums: "Mediums and materials",
    languages: "Languages",
    education: "Education",
    exhibition_history: "Exhibition history",
    awards: "Awards and grants",
    reusable_answer: "Reusable application answer",
  }
  return labels[value] ?? value.replaceAll("_", " ")
}

function statusLabel(value: ArtistImportProposal["status"]) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function ArtistImportReview({ onPassportChanged }: { onPassportChanged?: () => void }) {
  const [label, setLabel] = useState("Existing artist material")
  const [text, setText] = useState("")
  const [proposals, setProposals] = useState<ArtistImportProposal[]>([])
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [activeId, setActiveId] = useState("")
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")

  async function refresh() {
    setLoading(true)
    try {
      const next = await loadArtistImportProposals()
      setProposals(next)
      setEdits((current) => {
        const updated = { ...current }
        for (const item of next) if (!(item.id in updated)) updated[item.id] = item.artist_edited_value || item.proposed_value
        return updated
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load import proposals.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function processText() {
    if (!text.trim() || processing) return
    setProcessing(true)
    setError("")
    setStatus("")
    void trackKleioProductEvent("import_started", { surface: "creative_passport", metadata: { source: "pasted_text" } })
    try {
      const result = await extractArtistText({ label, text })
      setStatus(result.proposalCount ? `${result.proposalCount} reviewable proposal${result.proposalCount === 1 ? "" : "s"} created.` : "The material was processed, but no confident field proposal was found.")
      setText("")
      await refresh()
      void trackKleioProductEvent("import_completed", { surface: "creative_passport", metadata: { source: "pasted_text", result_count: result.proposalCount } })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to process this material.")
    } finally {
      setProcessing(false)
    }
  }

  async function processPdf(file: File | null) {
    if (!file || processing) return
    setProcessing(true)
    setError("")
    setStatus("")
    void trackKleioProductEvent("import_started", { surface: "creative_passport", metadata: { source: "pdf" } })
    try {
      const result = await extractArtistPdf(file)
      setStatus(result.proposalCount ? `${result.proposalCount} proposal${result.proposalCount === 1 ? "" : "s"} extracted from ${file.name}.` : `${file.name} was processed. Review the source status below.`)
      await refresh()
      void trackKleioProductEvent("import_completed", { surface: "creative_passport", metadata: { source: "pdf", result_count: result.proposalCount } })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to process this PDF.")
    } finally {
      setProcessing(false)
    }
  }

  async function approve(item: ArtistImportProposal) {
    setActiveId(item.id)
    setError("")
    try {
      await approveArtistImportProposal(item, edits[item.id])
      await refresh()
      onPassportChanged?.()
      setStatus(`${fieldLabel(item.target_field)} approved and saved to your Creative Passport.`)
      void trackKleioProductEvent("proposal_approved", { surface: "creative_passport", metadata: { status: edits[item.id] === item.proposed_value ? "approved" : "edited_approved" } })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to approve this proposal.")
    } finally {
      setActiveId("")
    }
  }

  async function decide(item: ArtistImportProposal, decision: "rejected" | "deferred") {
    setActiveId(item.id)
    setError("")
    try {
      await setArtistImportProposalStatus(item.id, decision)
      await refresh()
      setStatus(decision === "deferred" ? "Proposal postponed. You can return to it later." : "Proposal rejected. It was not added to your Passport.")
      if (decision === "rejected") void trackKleioProductEvent("proposal_rejected", { surface: "creative_passport", metadata: { status: "rejected" } })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update this proposal.")
    } finally {
      setActiveId("")
    }
  }

  const pending = proposals.filter((item) => item.status === "proposed" || item.status === "needs_clarification" || item.status === "conflicting")
  const reviewed = proposals.filter((item) => !pending.includes(item))

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.05)]">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7F6EB4]">Import existing materials</p>
        <h1 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.02em]">Extract first. Approve every field yourself.</h1>
        <p className="mt-2 text-sm leading-6 text-[#746E80]">KLEIO treats every document as untrusted source material. It uses deterministic section and term extraction, shows evidence, and never applies a proposal automatically.</p>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>Source label</span><input className={input} value={label} onChange={(event) => setLabel(event.target.value)} placeholder="CV, artist statement, 2025 application…" /></label>
          <label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>Paste biography, statement, CV text, exhibition history, or application answers</span><textarea className={textarea} rows={9} value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste the original text here. Headings such as Education, Exhibitions, Awards, Biography, and Artist Statement improve classification." /></label>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={primary} disabled={processing || !text.trim()} onClick={() => void processText()}>{processing ? <Loader2 className="size-4 animate-spin" /> : <FileSearch className="size-4" />}Create review proposals</button>
            <label className={`${secondary} cursor-pointer`}><FileUp className="size-4" />Upload CV or résumé PDF<input type="file" accept="application/pdf" className="sr-only" disabled={processing} onChange={(event) => void processPdf(event.target.files?.[0] ?? null)} /></label>
          </div>
          <p className="text-xs leading-5 text-[#8A8296]">PDF only, up to 15 MB. Files are uploaded to private owner-scoped storage. Extracted proposals are retained with their source and confidence for review.</p>
        </div>
      </section>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {status && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{status}</p>}

      <section className="rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.05)]" aria-labelledby="import-review-title">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="import-review-title" className="font-serif text-2xl font-semibold">Review proposals</h2><p className="mt-1 text-sm text-[#746E80]">Approve, edit, reject, or postpone each suggestion independently.</p></div><button type="button" className={secondary} onClick={() => void refresh()} disabled={loading}><RotateCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />Refresh</button></div>

        {loading && <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading proposals…</p>}
        {!loading && pending.length === 0 && <div className="mt-5 rounded-xl border border-dashed border-[#D8D0F2] bg-[#FBFAFE] p-5 text-sm leading-6 text-[#746E80]">No proposals are waiting for review. Import a document or paste existing text above.</div>}

        <div className="mt-5 space-y-4">
          {pending.map((item) => (
            <article key={item.id} className="rounded-xl border border-[#E7E1F7] bg-[#FCFBFE] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#7F6EB4]">{fieldLabel(item.target_field)}</p><p className="mt-1 text-xs text-[#8A8296]">{item.source?.label || "Imported source"} · {statusLabel(item.status)}{item.confidence !== null ? ` · ${Math.round(item.confidence * 100)}% extraction confidence` : ""}</p></div><span className="rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-semibold text-[#625C70]">{item.extraction_method.replaceAll("_", " ")}</span></div>
              <label className="mt-4 grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>Proposed value — edit before approval when needed</span><textarea className={textarea} rows={Math.min(10, Math.max(4, Math.ceil((edits[item.id]?.length ?? 0) / 90)))} value={edits[item.id] ?? item.proposed_value} onChange={(event) => setEdits((current) => ({ ...current, [item.id]: event.target.value }))} /></label>
              {item.evidence_excerpt && <details className="mt-3 rounded-lg border border-[#E7E1F7] bg-white px-3 py-2"><summary className="cursor-pointer text-xs font-semibold text-[#5B4B8A]">View source evidence</summary><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#746E80]">{item.evidence_excerpt}</p></details>}
              <div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" className="inline-flex min-h-10 items-center gap-2 px-3 text-sm font-semibold text-[#746E80]" disabled={activeId === item.id} onClick={() => void decide(item, "deferred")}>Decide later</button><button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-sm font-semibold text-red-700" disabled={activeId === item.id} onClick={() => void decide(item, "rejected")}><X className="size-4" />Reject</button><button type="button" className={primary} disabled={activeId === item.id || !(edits[item.id] ?? item.proposed_value).trim()} onClick={() => void approve(item)}>{activeId === item.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Approve and save</button></div>
            </article>
          ))}
        </div>

        {reviewed.length > 0 && <details className="mt-5 border-t border-[#E7E1F7] pt-4"><summary className="cursor-pointer text-sm font-semibold text-[#5B4B8A]">Reviewed proposals ({reviewed.length})</summary><div className="mt-3 space-y-2">{reviewed.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#F8F6FC] px-3 py-2 text-xs"><span>{fieldLabel(item.target_field)} · {item.source?.label || "Imported source"}</span><span className="font-semibold text-[#625C70]">{statusLabel(item.status)}</span></div>)}</div></details>}
      </section>
    </div>
  )
}
