"use client"

/* eslint-disable @next/next/no-img-element -- public website previews are reviewed before private import */

import { useMemo, useState } from "react"
import {
  Check,
  Eye,
  Globe2,
  ImagePlus,
  Loader2,
  PenLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import {
  analyzeArtistWebsite,
  analyzeVisualPractice,
  applyWebsiteProfileSuggestions,
  approveWebsiteArtworkImports,
  generateKleioAssistDraft,
  updateKleioAssistDraft,
  type KleioAssistDraftType,
  type KleioDraftResult,
  type VisualEvidenceObservation,
  type VisualPracticeAnalysis,
  type WebsiteArtworkDraft,
  type WebsiteField,
  type WebsiteImageCandidate,
  type WebsiteImportSession,
} from "@/lib/kleio-website-import"

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const input = "min-h-11 w-full rounded-xl border border-[#DED7EF] bg-white px-3 py-2 text-sm text-[#292631] outline-none transition focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12"
const textarea = `${input} min-h-24 resize-y leading-6`

const PROFILE_FIELDS = [
  ["professional_name", "Professional name"],
  ["location", "Location"],
  ["bio", "Biography"],
  ["artist_statement", "Artist statement"],
  ["practice_description", "Practice description"],
  ["website_url", "Website"],
  ["disciplines", "Disciplines"],
  ["mediums", "Mediums"],
] as const

const ANALYSIS_SECTIONS: Array<[keyof VisualPracticeAnalysis, string]> = [
  ["visual_language", "Visual language"],
  ["recurring_themes", "Recurring themes"],
  ["motifs", "Recurring motifs"],
  ["palette", "Palette"],
  ["composition", "Composition"],
  ["materials_and_techniques", "Materials and techniques"],
  ["mood_and_atmosphere", "Mood and atmosphere"],
  ["subject_matter", "Subject matter"],
  ["presentation_style", "Presentation style"],
  ["tensions_or_variations", "Tensions and variations"],
]

function message(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function fieldValue(field: WebsiteField) {
  return Array.isArray(field.value) ? field.value.join(", ") : field.value
}

function initialArtworkDraft(candidate: WebsiteImageCandidate): WebsiteArtworkDraft {
  return {
    title: candidate.proposed.title ?? "",
    year: candidate.proposed.year ?? "",
    medium: candidate.proposed.medium ?? "",
    dimensions: candidate.proposed.dimensions ?? "",
    description: candidate.proposed.description ?? "",
    tags: candidate.proposed.tags ?? [],
    altText: candidate.proposed.altText ?? "",
  }
}

function EvidenceBadge({ field }: { field: WebsiteField }) {
  const label = field.status === "extracted" ? "Found on website" : field.status === "suggested" ? "KLEIO suggestion" : "Needs artist input"
  return <span className="rounded-full border border-[#E3DDF2] bg-[#FAF9FD] px-2.5 py-1 text-[0.68rem] font-semibold text-[#6B6477]">{label}</span>
}

function ObservationCard({ item, imageById }: { item: VisualEvidenceObservation; imageById: Map<string, WebsiteImageCandidate> }) {
  return (
    <article className="rounded-2xl border border-[#E7E1F7] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-semibold text-[#292631]">{item.label}</h4>
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#81788E]">{item.confidence} confidence</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#514B5B]"><strong>Observed:</strong> {item.observation}</p>
      <p className="mt-2 text-sm leading-6 text-[#746E80]"><strong>Interpretation to review:</strong> {item.interpretation}</p>
      {item.evidence_image_ids.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {item.evidence_image_ids.flatMap((id) => {
            const image = imageById.get(id)
            return image ? [<img key={id} src={image.url} alt={image.alt || "Website evidence"} referrerPolicy="no-referrer" className="size-20 shrink-0 rounded-xl border border-[#E7E1F7] object-cover" />] : []
          })}
        </div>
      )}
    </article>
  )
}

export function WebsiteImportAssist() {
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false)
  const [session, setSession] = useState<WebsiteImportSession | null>(null)
  const [selectedProfileFields, setSelectedProfileFields] = useState<Set<string>>(new Set())
  const [profileEdits, setProfileEdits] = useState<Record<string, string>>({})
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [artworkDrafts, setArtworkDrafts] = useState<Record<string, WebsiteArtworkDraft>>({})
  const [analysis, setAnalysis] = useState<VisualPracticeAnalysis | null>(null)
  const [analysisDraftId, setAnalysisDraftId] = useState("")
  const [draftType, setDraftType] = useState<KleioAssistDraftType>("professional_bio")
  const [wordLimit, setWordLimit] = useState(200)
  const [artistContext, setArtistContext] = useState("")
  const [opportunityContext, setOpportunityContext] = useState("")
  const [draftResult, setDraftResult] = useState<KleioDraftResult | null>(null)
  const [draftId, setDraftId] = useState("")
  const [selectedDraftOption, setSelectedDraftOption] = useState(0)
  const [editedDraft, setEditedDraft] = useState("")
  const [working, setWorking] = useState("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")

  const imageById = useMemo(() => new Map((session?.image_candidates ?? []).map((item) => [item.id, item])), [session])

  async function analyze() {
    if (!websiteUrl.trim() || !ownershipConfirmed || working) return
    setWorking("website")
    setError("")
    setStatus("KLEIO is reviewing the public pages, text, metadata, captions, and portfolio images…")
    try {
      const next = await analyzeArtistWebsite(websiteUrl.trim(), ownershipConfirmed)
      setSession(next)
      const profileFields = PROFILE_FIELDS.filter(([key]) => next.profile_suggestions[key].status !== "missing").map(([key]) => key)
      setSelectedProfileFields(new Set(profileFields))
      setProfileEdits(Object.fromEntries(PROFILE_FIELDS.map(([key]) => [key, fieldValue(next.profile_suggestions[key])])))
      const candidates = next.image_candidates.slice(0, 12)
      setSelectedImages(new Set(candidates.map((item) => item.id)))
      setArtworkDrafts(Object.fromEntries(next.image_candidates.map((item) => [item.id, initialArtworkDraft(item)])))
      setAnalysis(null)
      setDraftResult(null)
      setStatus(`Analysis ready: ${next.pages.length} public page${next.pages.length === 1 ? "" : "s"} and ${next.image_candidates.length} image candidate${next.image_candidates.length === 1 ? "" : "s"} found. Nothing has been saved to the Passport.`)
    } catch (reason) {
      setError(message(reason, "KLEIO could not analyze this website."))
      setStatus("")
    } finally {
      setWorking("")
    }
  }

  function toggleProfileField(key: string) {
    setSelectedProfileFields((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleImage(id: string) {
    setSelectedImages((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function updateArtwork(id: string, key: keyof WebsiteArtworkDraft, value: string) {
    setArtworkDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? initialArtworkDraft(imageById.get(id)!)),
        [key]: key === "tags" ? value.split(/[,;\n]/).map((entry) => entry.trim()).filter(Boolean) : value,
      },
    }))
  }

  async function applyProfile() {
    if (!session || working) return
    setWorking("profile")
    setError("")
    try {
      await applyWebsiteProfileSuggestions({
        suggestions: session.profile_suggestions,
        selectedFields: Array.from(selectedProfileFields),
        editedValues: profileEdits,
      })
      setStatus("The selected, artist-reviewed profile fields were saved privately to your Creative Passport.")
    } catch (reason) {
      setError(message(reason, "The selected profile fields could not be saved."))
    } finally {
      setWorking("")
    }
  }

  async function runVisualAnalysis() {
    if (!session || !selectedImages.size || working) return
    setWorking("vision")
    setError("")
    setStatus("KLEIO Assist is examining the selected works together for recurring visual language, themes, motifs, palette, composition, and atmosphere…")
    try {
      const result = await analyzeVisualPractice(session.id, Array.from(selectedImages).slice(0, 12))
      setAnalysis(result.analysis)
      setAnalysisDraftId(result.draftId)
      setStatus("Visual-practice analysis is ready for artist review. Every interpretation remains editable and unconfirmed.")
    } catch (reason) {
      setError(message(reason, "KLEIO Assist could not analyze the selected body of work."))
      setStatus("")
    } finally {
      setWorking("")
    }
  }

  async function generateDraft() {
    if (!session || working) return
    setWorking("draft")
    setError("")
    setStatus("KLEIO Assist is preparing three evidence-grounded draft directions…")
    try {
      const result = await generateKleioAssistDraft({
        sessionId: session.id,
        analysisDraftId,
        draftType,
        wordLimit,
        artistContext,
        opportunityContext,
      })
      setDraftId(result.draftId)
      setDraftResult(result.result)
      setSelectedDraftOption(result.result.recommended_option)
      setEditedDraft(result.result.options[result.result.recommended_option]?.text ?? "")
      setStatus("Three draft directions are ready. Choose one, edit it, and approve only when it reflects the artist accurately.")
    } catch (reason) {
      setError(message(reason, "KLEIO Assist could not prepare this draft."))
      setStatus("")
    } finally {
      setWorking("")
    }
  }

  async function approveDraft() {
    if (!draftId || !editedDraft.trim() || working) return
    setWorking("approve-draft")
    setError("")
    try {
      await updateKleioAssistDraft({ draftId, artistEditedText: editedDraft.trim(), status: "approved" })
      setStatus("This version was marked artist-approved and remains private. It has not been submitted anywhere.")
    } catch (reason) {
      setError(message(reason, "The approved draft could not be saved."))
    } finally {
      setWorking("")
    }
  }

  async function approveWorks() {
    if (!session || !selectedImages.size || working) return
    setWorking("works")
    setError("")
    setStatus("KLEIO is copying and approving the selected website images one at a time…")
    const works = Array.from(selectedImages).flatMap((id) => {
      const candidate = imageById.get(id)
      const draft = artworkDrafts[id]
      return candidate && draft ? [{ candidate, draft }] : []
    })
    try {
      const results = await approveWebsiteArtworkImports({ sessionId: session.id, works })
      const failures = results.filter((result) => result.error)
      const successes = results.length - failures.length
      if (failures.length) setError(failures.map((failure) => failure.error).filter(Boolean).join(" "))
      setStatus(`${successes} artist-reviewed work${successes === 1 ? " was" : "s were"} added to the private Creative Passport portfolio.${failures.length ? ` ${failures.length} need attention.` : ""}`)
    } catch (reason) {
      setError(message(reason, "The selected works could not be approved."))
      setStatus("")
    } finally {
      setWorking("")
    }
  }

  return (
    <section className="rounded-[28px] border border-[#E2DCF1] bg-white p-5 shadow-[0_22px_70px_rgba(82,64,130,0.07)] sm:p-7" aria-labelledby="website-import-title">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Website Import Assist</p>
          <h2 id="website-import-title" className="mt-2 font-serif text-2xl font-semibold tracking-[-0.03em] text-[#292631] sm:text-3xl">Let KLEIO review your existing artist website</h2>
          <p className="mt-3 text-sm leading-7 text-[#746E80]">KLEIO collects public evidence first, then can examine selected works with a visual eye. Extracted facts, visual interpretations, and polished drafts stay clearly separated until you edit and approve them.</p>
        </div>
        <div className="grid gap-2 text-xs font-semibold text-[#625C70]">
          <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-[#6A5896]" />Nothing imports or publishes automatically</span>
          <span className="inline-flex items-center gap-2"><Eye className="size-4 text-[#6A5896]" />Interpretations always require artist review</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto]">
        <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]">Public artist website
          <input className={input} type="url" inputMode="url" placeholder="https://yourportfolio.com" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} />
        </label>
        <button type="button" className={`${primary} lg:self-end`} disabled={!websiteUrl.trim() || !ownershipConfirmed || Boolean(working)} onClick={() => void analyze()}>
          {working === "website" ? <Loader2 className="size-4 animate-spin" /> : <Globe2 className="size-4" />}Analyze website
        </button>
      </div>
      <label className="mt-3 flex items-start gap-3 rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] p-3 text-xs leading-5 text-[#625C70]">
        <input type="checkbox" className="mt-0.5 size-4 accent-[#5B4B8A]" checked={ownershipConfirmed} onChange={(event) => setOwnershipConfirmed(event.target.checked)} />
        <span>I own this website or have permission to import its public content and images into my private KLEIO workspace.</span>
      </label>

      {(status || error) && <div className={`mt-5 rounded-xl border p-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-[#E2DCF1] bg-[#F9F7FC] text-[#625C70]"}`} role={error ? "alert" : "status"}>{error || status}</div>}

      {session && (
        <div className="mt-7 space-y-8">
          <section aria-labelledby="website-profile-review">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Exact text and structured evidence</p><h3 id="website-profile-review" className="mt-1 font-serif text-2xl font-semibold">Review profile information</h3></div>
              <button type="button" className={secondary} disabled={!selectedProfileFields.size || Boolean(working)} onClick={() => void applyProfile()}>{working === "profile" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Save selected fields</button>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {PROFILE_FIELDS.map(([key, label]) => {
                const field = session.profile_suggestions[key]
                const multiline = ["bio", "artist_statement", "practice_description"].includes(key)
                return (
                  <article key={key} className={`rounded-2xl border p-4 ${selectedProfileFields.has(key) ? "border-[#B9A9DE] bg-[#FCFAFF]" : "border-[#E7E1F7] bg-white"}`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1 size-4 accent-[#5B4B8A]" checked={selectedProfileFields.has(key)} disabled={field.status === "missing"} onChange={() => toggleProfileField(key)} aria-label={`Use ${label}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2"><label htmlFor={`website-${key}`} className="text-sm font-semibold text-[#292631]">{label}</label><EvidenceBadge field={field} /></div>
                        {multiline ? <textarea id={`website-${key}`} className={`${textarea} mt-3`} value={profileEdits[key] ?? ""} onChange={(event) => setProfileEdits((current) => ({ ...current, [key]: event.target.value }))} /> : <input id={`website-${key}`} className={`${input} mt-3`} value={profileEdits[key] ?? ""} onChange={(event) => setProfileEdits((current) => ({ ...current, [key]: event.target.value }))} />}
                        <p className="mt-2 text-xs leading-5 text-[#81788E]">{field.source}</p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section aria-labelledby="website-image-review">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Visual portfolio evidence</p><h3 id="website-image-review" className="mt-1 font-serif text-2xl font-semibold">Choose and edit portfolio images</h3><p className="mt-2 text-sm text-[#746E80]">Select the works that represent the artist. Titles, dates, mediums, dimensions, descriptions, and alt text remain editable before approval.</p></div>
              <div className="flex flex-wrap gap-2"><button type="button" className={secondary} disabled={!selectedImages.size || Boolean(working)} onClick={() => void runVisualAnalysis()}>{working === "vision" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}Analyze selected works</button><button type="button" className={primary} disabled={!selectedImages.size || Boolean(working)} onClick={() => void approveWorks()}>{working === "works" ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}Approve and add works</button></div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {session.image_candidates.map((candidate) => {
                const draft = artworkDrafts[candidate.id] ?? initialArtworkDraft(candidate)
                const selected = selectedImages.has(candidate.id)
                return (
                  <article key={candidate.id} className={`overflow-hidden rounded-2xl border ${selected ? "border-[#A997E8] shadow-[0_12px_40px_rgba(82,64,130,0.10)]" : "border-[#E7E1F7]"}`}>
                    <button type="button" className="relative block aspect-[4/3] w-full overflow-hidden bg-[#F3F0F8] text-left" onClick={() => toggleImage(candidate.id)} aria-pressed={selected}>
                      <img src={candidate.url} alt={candidate.alt || candidate.proposed.altText || "Website portfolio candidate"} referrerPolicy="no-referrer" className="size-full object-cover" />
                      <span className={`absolute right-3 top-3 grid size-8 place-items-center rounded-full border ${selected ? "border-[#5B4B8A] bg-[#5B4B8A] text-white" : "border-white/80 bg-white/90 text-[#746E80]"}`}>{selected ? <Check className="size-4" /> : <span className="size-2 rounded-full bg-current" />}</span>
                    </button>
                    <div className="grid gap-3 p-4">
                      <label className="grid gap-1 text-xs font-semibold text-[#625C70]">Artist-confirmed title<input className={input} value={draft.title} onChange={(event) => updateArtwork(candidate.id, "title", event.target.value)} /></label>
                      <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-xs font-semibold text-[#625C70]">Year<input className={input} value={draft.year} onChange={(event) => updateArtwork(candidate.id, "year", event.target.value)} /></label><label className="grid gap-1 text-xs font-semibold text-[#625C70]">Medium<input className={input} value={draft.medium} onChange={(event) => updateArtwork(candidate.id, "medium", event.target.value)} /></label></div>
                      <label className="grid gap-1 text-xs font-semibold text-[#625C70]">Dimensions<input className={input} value={draft.dimensions} onChange={(event) => updateArtwork(candidate.id, "dimensions", event.target.value)} /></label>
                      <label className="grid gap-1 text-xs font-semibold text-[#625C70]">Description<textarea className={textarea} value={draft.description} onChange={(event) => updateArtwork(candidate.id, "description", event.target.value)} /></label>
                      <label className="grid gap-1 text-xs font-semibold text-[#625C70]">Accessible image description<textarea className={textarea} value={draft.altText} onChange={(event) => updateArtwork(candidate.id, "altText", event.target.value)} /></label>
                      <p className="text-[0.7rem] leading-5 text-[#8A8296]">Source: {candidate.sourcePage}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          {analysis && (
            <section aria-labelledby="visual-practice-review" className="rounded-[24px] border border-[#DCD4EF] bg-[#FAF8FE] p-5 sm:p-6">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">KLEIO interpretation — confirm or edit</p>
              <h3 id="visual-practice-review" className="mt-1 font-serif text-2xl font-semibold">Visual-practice reading</h3>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-[#625C70]">{analysis.summary}</p>
              <div className="mt-5 space-y-6">
                {ANALYSIS_SECTIONS.map(([key, label]) => {
                  const items = analysis[key]
                  if (!Array.isArray(items) || !items.length) return null
                  return <div key={key}><h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-[#625C70]">{label}</h4><div className="grid gap-3 lg:grid-cols-2">{(items as VisualEvidenceObservation[]).map((item, index) => <ObservationCard key={`${key}-${index}`} item={item} imageById={imageById} />)}</div></div>
                })}
              </div>
              {analysis.questions_for_artist.length > 0 && <div className="mt-6 rounded-2xl border border-[#E7E1F7] bg-white p-4"><h4 className="font-semibold">Questions that would make the writing more accurate</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[#746E80]">{analysis.questions_for_artist.map((question) => <li key={question}>{question}</li>)}</ul></div>}
            </section>
          )}

          <section aria-labelledby="kleio-drafting-studio" className="rounded-[24px] border border-[#DCD4EF] bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Evidence-grounded writing</p><h3 id="kleio-drafting-studio" className="mt-1 font-serif text-2xl font-semibold">KLEIO Assist Drafting Studio</h3><p className="mt-2 text-sm leading-6 text-[#746E80]">Create polished options from the collected facts and artist-reviewed visual analysis. Nothing is submitted automatically.</p></div><button type="button" className={primary} disabled={Boolean(working)} onClick={() => void generateDraft()}>{working === "draft" ? <Loader2 className="size-4 animate-spin" /> : <PenLine className="size-4" />}Generate three options</button></div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]">Draft type<select className={input} value={draftType} onChange={(event) => setDraftType(event.target.value as KleioAssistDraftType)}><option value="short_bio">Short bio</option><option value="professional_bio">Professional bio</option><option value="artist_statement">Artist statement</option><option value="practice_description">Practice description</option><option value="artwork_description">Artwork description</option><option value="submission_letter">Submission letter</option><option value="application_answer">Application answer</option></select></label>
              <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]">Maximum words<input className={input} type="number" min={40} max={1200} value={wordLimit} onChange={(event) => setWordLimit(Number(event.target.value))} /></label>
              <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]">Artist context<textarea className={textarea} placeholder="Add facts, intentions, preferred language, or corrections the website does not contain." value={artistContext} onChange={(event) => setArtistContext(event.target.value)} /></label>
            </div>
            {(draftType === "submission_letter" || draftType === "application_answer") && <label className="mt-4 grid gap-1.5 text-xs font-semibold text-[#625C70]">Opportunity prompt or context<textarea className={textarea} placeholder="Paste the verified opportunity prompt, question, or organization context." value={opportunityContext} onChange={(event) => setOpportunityContext(event.target.value)} /></label>}

            {draftResult && (
              <div className="mt-6 space-y-4">
                <div className="grid gap-3 lg:grid-cols-3">{draftResult.options.map((option, index) => <button key={`${option.label}-${index}`} type="button" onClick={() => { setSelectedDraftOption(index); setEditedDraft(option.text) }} className={`rounded-2xl border p-4 text-left ${selectedDraftOption === index ? "border-[#A997E8] bg-[#FAF8FE]" : "border-[#E7E1F7] bg-white"}`}><p className="font-semibold text-[#292631]">{option.label}</p><p className="mt-2 line-clamp-5 text-sm leading-6 text-[#746E80]">{option.text}</p><p className="mt-3 text-[0.7rem] font-semibold text-[#81788E]">{option.word_count} words</p></button>)}</div>
                <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]">Artist-edited final version<textarea className={`${textarea} min-h-56`} value={editedDraft} onChange={(event) => setEditedDraft(event.target.value)} /></label>
                <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs leading-5 text-[#81788E]">Saving approval keeps the draft private and records that the artist reviewed it. It does not send an application.</p><button type="button" className={secondary} disabled={!editedDraft.trim() || Boolean(working)} onClick={() => void approveDraft()}>{working === "approve-draft" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Mark artist-approved</button></div>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  )
}
