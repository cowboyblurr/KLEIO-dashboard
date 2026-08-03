"use client"

/* eslint-disable @next/next/no-img-element -- external previews remain temporary and artist-reviewed */

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Check, Eye, FileText, Globe2, ImagePlus, Loader2, PenLine, RotateCcw, ShieldCheck, Sparkles, Trash2, X } from "lucide-react"
import {
  analyzeVisualPractice,
  applyWebsiteProfileSuggestions,
  approveWebsiteArtworkImports,
  buildApprovedProfileEvidence,
  deleteKleioAssistDraft,
  generateKleioAssistDraft,
  loadKleioAssistCapabilities,
  reviewVisualPracticeAnalysis,
  updateKleioAssistDraft,
  type KleioAssistCapabilities,
  type KleioAssistDraftType,
  type KleioDraftResult,
  type VisualEvidenceObservation,
  type VisualPracticeAnalysis,
  type VisualReviewDecision,
  type WebsiteArtworkDraft,
  type WebsiteField,
  type WebsiteImageCandidate,
} from "@/lib/kleio-website-import"
import {
  analyzeWebsiteScan,
  dismissWebsiteScan,
  scanAllowsTextOrganization,
  type WebsiteScanSession,
  type WebsiteScanSummary,
} from "@/lib/kleio-website-scan-api"

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:opacity-50"
const input = "min-h-11 w-full rounded-xl border border-[#DED7EF] bg-white px-3 py-2 text-sm text-[#292631] outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12"
const textarea = `${input} min-h-24 resize-y leading-6`
const profileFields = [
  ["professional_name", "Professional name"], ["location", "Location"], ["bio", "Biography"],
  ["artist_statement", "Artist statement"], ["practice_description", "Practice description"],
  ["website_url", "Website"], ["disciplines", "Disciplines"], ["mediums", "Mediums"],
] as const
const analysisSections: Array<[keyof VisualPracticeAnalysis, string]> = [
  ["visual_language", "Visual language"], ["recurring_themes", "Recurring themes"], ["motifs", "Motifs"],
  ["palette", "Palette"], ["composition", "Composition"], ["materials_and_techniques", "Materials and techniques"],
  ["mood_and_atmosphere", "Mood and atmosphere"], ["subject_matter", "Subject matter"],
  ["presentation_style", "Presentation style"], ["tensions_or_variations", "Tensions and variations"],
]
const unsupportedSocialHosts = ["instagram.com", "facebook.com", "threads.net", "tiktok.com", "x.com", "twitter.com", "pinterest.com", "linkedin.com"]
type Review = { decision: VisualReviewDecision | "pending"; observation: string; interpretation: string; useInDrafting: boolean }

function fieldValue(field: WebsiteField) { return Array.isArray(field.value) ? field.value.join(", ") : field.value }
function reviewId(section: string, index: number) { return `${section}:${index}` }
function errorText(error: unknown, fallback: string) { return error instanceof Error && error.message ? error.message : fallback }
function websiteInputError(value: string) {
  let parsed: URL
  try { parsed = new URL(value.trim()) } catch { return "Enter a complete public website address, such as https://yourportfolio.com." }
  if (parsed.protocol !== "https:") return "Use the secure HTTPS version of the artist website."
  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "")
  if (unsupportedSocialHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
    return "Social profiles cannot be analyzed through Website Import Assist. Use a public portfolio or personal website, or an approved connected import when available."
  }
  return ""
}
function initialArtwork(candidate: WebsiteImageCandidate): WebsiteArtworkDraft {
  return { title: candidate.proposed.title || "", year: candidate.proposed.year || "", medium: candidate.proposed.medium || "", dimensions: candidate.proposed.dimensions || "", description: candidate.proposed.description || "", tags: candidate.proposed.tags || [], altText: candidate.proposed.altText || "" }
}
function initialReviews(analysis: VisualPracticeAnalysis) {
  const result: Record<string, Review> = {}
  for (const [section] of analysisSections) {
    const values = analysis[section]
    if (!Array.isArray(values)) continue
    ;(values as VisualEvidenceObservation[]).forEach((item, index) => {
      result[reviewId(String(section), index)] = { decision: "pending", observation: item.observation, interpretation: item.interpretation, useInDrafting: false }
    })
  }
  return result
}
function summaryMetrics(summary?: WebsiteScanSummary) {
  if (!summary) return []
  return [
    ["Pages discovered", summary.pages_discovered || 0], ["Pages collected", summary.pages_collected || 0],
    ["Pages skipped", summary.pages_skipped || 0], ["Pages blocked", summary.pages_blocked || 0],
    ["Text sections", summary.text_sections_found || 0], ["Metadata entries", summary.metadata_found || 0],
    ["Structured data", summary.structured_data_found || 0], ["Valid images", summary.valid_images_found || 0],
    ["Weak candidates rejected", summary.weak_candidates_rejected || 0],
  ] as const
}
function outcomeLabel(status: WebsiteScanSession["status"]) {
  if (status === "review_ready") return "Review ready"
  if (status === "limited_review") return "Limited review"
  if (status === "image_only_review") return "Image-only review"
  if (status === "manual_input_recommended") return "Manual input recommended"
  if (status === "blocked") return "Automated review blocked"
  if (status === "failed") return "Scan failed"
  return status.replaceAll("_", " ")
}

export function WebsiteImportAssist() {
  const [capabilities, setCapabilities] = useState<KleioAssistCapabilities | null>(null)
  const [url, setUrl] = useState("")
  const [permission, setPermission] = useState(false)
  const [rights, setRights] = useState(false)
  const [session, setSession] = useState<WebsiteScanSession | null>(null)
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())
  const [profileEdits, setProfileEdits] = useState<Record<string, string>>({})
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [artworks, setArtworks] = useState<Record<string, WebsiteArtworkDraft>>({})
  const [analysis, setAnalysis] = useState<VisualPracticeAnalysis | null>(null)
  const [analysisId, setAnalysisId] = useState("")
  const [analysisSummary, setAnalysisSummary] = useState("")
  const [reviews, setReviews] = useState<Record<string, Review>>({})
  const [reviewSaved, setReviewSaved] = useState(false)
  const [draftType, setDraftType] = useState<KleioAssistDraftType>("professional_bio")
  const [artistContext, setArtistContext] = useState("")
  const [opportunityContext, setOpportunityContext] = useState("")
  const [wordLimit, setWordLimit] = useState(200)
  const [draft, setDraft] = useState<KleioDraftResult | null>(null)
  const [draftId, setDraftId] = useState("")
  const [editedDraft, setEditedDraft] = useState("")
  const [working, setWorking] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  const imageById = useMemo(() => new Map((session?.image_candidates || []).map((image) => [image.id, image])), [session])
  const maxImages = capabilities?.max_images_per_analysis || 8
  const reviewEntries = Object.entries(reviews)
  const reviewComplete = reviewEntries.length > 0 && reviewEntries.every(([, item]) => item.decision !== "pending")
  const providerReady = capabilities?.configured === true
  const canOrganizeText = Boolean(session && scanAllowsTextOrganization(session))
  const scanMetrics = summaryMetrics(session?.scan_summary)
  const hasUnsavedReview = Boolean(selectedFields.size || selectedImages.size || analysisId || draftId || draft)

  useEffect(() => { void loadKleioAssistCapabilities().then(setCapabilities).catch(() => setCapabilities(null)) }, [])

  function resetLocalScan() {
    setUrl("")
    setPermission(false)
    setRights(false)
    setSession(null)
    setSelectedFields(new Set())
    setProfileEdits({})
    setSelectedImages(new Set())
    setArtworks({})
    setAnalysis(null)
    setAnalysisId("")
    setAnalysisSummary("")
    setReviews({})
    setReviewSaved(false)
    setDraft(null)
    setDraftId("")
    setEditedDraft("")
    setArtistContext("")
    setOpportunityContext("")
  }

  async function analyze() {
    if (!url.trim() || !permission || working) return
    const inputError = websiteInputError(url)
    if (inputError) { setError(inputError); setNotice(""); return }
    setWorking("website")
    setError("")
    setNotice("Connecting securely and reviewing public pages, metadata, structured data, and image candidates…")
    try {
      const next = await analyzeWebsiteScan(url.trim(), true)
      setSession(next)
      const available = profileFields.filter(([key]) => next.profile_suggestions[key].status !== "missing").map(([key]) => key)
      setSelectedFields(new Set(available))
      setProfileEdits(Object.fromEntries(profileFields.map(([key]) => [key, fieldValue(next.profile_suggestions[key])])))
      setSelectedImages(new Set())
      setArtworks(Object.fromEntries(next.image_candidates.map((item) => [item.id, initialArtwork(item)])))
      setAnalysis(null); setAnalysisId(""); setReviews({}); setReviewSaved(false); setDraft(null); setDraftId(""); setEditedDraft("")
      setNotice(`${outcomeLabel(next.status)}: ${next.pages.length} public page${next.pages.length === 1 ? "" : "s"} and ${next.image_candidates.length} validated image candidate${next.image_candidates.length === 1 ? "" : "s"}. Nothing has been saved or published.`)
      window.dispatchEvent(new CustomEvent("kleio:website-scan-changed", { detail: { id: next.id, status: next.status } }))
    } catch (reason) {
      setError(errorText(reason, "KLEIO could not analyze this website."))
      setNotice("")
    } finally {
      setWorking("")
    }
  }

  function clearTypedUrl() {
    setUrl("")
    setError("")
  }

  async function clearScan() {
    if (!session || working) return
    if (hasUnsavedReview && !window.confirm("Clear this active scan and discard its unsaved review selections? Previously approved Media Library or Creative Passport information will remain unchanged.")) return
    setWorking("clear-scan")
    setError("")
    try {
      await dismissWebsiteScan(session.id)
      resetLocalScan()
      setNotice("The active website scan was cleared from review. Its audit history was preserved, and previously approved KLEIO data was not changed.")
      window.dispatchEvent(new CustomEvent("kleio:website-scan-changed", { detail: { id: session.id, status: "dismissed" } }))
    } catch (reason) {
      setError(errorText(reason, "The active website scan could not be cleared."))
    } finally {
      setWorking("")
    }
  }

  async function saveProfile() {
    if (!session || working) return
    setWorking("profile"); setError("")
    try {
      await applyWebsiteProfileSuggestions({ suggestions: session.profile_suggestions, selectedFields: [...selectedFields], editedValues: profileEdits })
      setNotice("The selected, artist-reviewed profile fields were saved privately.")
    } catch (reason) { setError(errorText(reason, "Profile fields could not be saved.")) }
    finally { setWorking("") }
  }

  async function runVision() {
    if (!session || !selectedImages.size || !providerReady || working) return
    setWorking("vision"); setError(""); setNotice("Examining only the selected works for recurring visual language, motifs, palette, composition, and atmosphere…")
    try {
      const result = await analyzeVisualPractice(session.id, [...selectedImages].slice(0, maxImages))
      setAnalysis(result.analysis); setAnalysisId(result.draftId); setAnalysisSummary(result.analysis.summary)
      setReviews(initialReviews(result.analysis)); setReviewSaved(false)
      setNotice("Visual analysis is ready. Confirm, edit, or reject every item before it may influence writing.")
    } catch (reason) { setError(errorText(reason, "The visual analysis could not be completed.")); setNotice("") }
    finally { setWorking("") }
  }

  async function saveReview() {
    if (!analysisId || !reviewComplete || working) return
    setWorking("review"); setError("")
    try {
      const result = await reviewVisualPracticeAnalysis({
        draftId: analysisId,
        summary: analysisSummary,
        items: reviewEntries.map(([id, item]) => ({ id, decision: item.decision as VisualReviewDecision, observation: item.observation, interpretation: item.interpretation, use_in_drafting: item.useInDrafting })),
      })
      setAnalysis(result.approvedAnalysis); setReviewSaved(true)
      setNotice("Your review was saved. Only the observations you allowed may influence drafts.")
    } catch (reason) { setError(errorText(reason, "The visual review could not be saved.")) }
    finally { setWorking("") }
  }

  async function generateDraft() {
    if (!session || !providerReady || working || (analysisId && !reviewSaved)) return
    setWorking("draft"); setError(""); setNotice("Preparing two evidence-grounded writing directions…")
    try {
      const result = await generateKleioAssistDraft({
        sessionId: session.id, analysisDraftId: reviewSaved ? analysisId : undefined, draftType, wordLimit,
        artistContext, opportunityContext,
        approvedProfileEvidence: buildApprovedProfileEvidence({ suggestions: session.profile_suggestions, selectedFields: [...selectedFields], editedValues: profileEdits }),
      })
      setDraftId(result.draftId); setDraft(result.result)
      setEditedDraft(result.result.options[result.result.recommended_option]?.text || "")
      setNotice("Two distinct drafts are ready. Edit and approve only the version that represents the artist accurately.")
    } catch (reason) { setError(errorText(reason, "A draft could not be prepared.")); setNotice("") }
    finally { setWorking("") }
  }

  async function saveDraft() {
    if (!draftId || !editedDraft.trim() || working) return
    setWorking("approve-draft"); setError("")
    try { await updateKleioAssistDraft({ draftId, artistEditedText: editedDraft.trim(), status: "approved" }); setNotice("The artist-approved draft remains private and was not submitted anywhere.") }
    catch (reason) { setError(errorText(reason, "The draft could not be approved.")) }
    finally { setWorking("") }
  }

  async function removeDraft() {
    if (!draftId || working || !window.confirm("Delete this private generated draft?")) return
    setWorking("delete-draft")
    try { await deleteKleioAssistDraft(draftId); setDraftId(""); setDraft(null); setEditedDraft(""); setNotice("The generated draft was deleted.") }
    catch (reason) { setError(errorText(reason, "The draft could not be deleted.")) }
    finally { setWorking("") }
  }

  async function saveWorks() {
    if (!session || !rights || !selectedImages.size || working) return
    setWorking("works"); setError("")
    try {
      const works = [...selectedImages].flatMap((id) => { const candidate = imageById.get(id); const record = artworks[id]; return candidate && record ? [{ candidate, draft: record }] : [] })
      const results = await approveWebsiteArtworkImports({ sessionId: session.id, works })
      const failed = results.filter((item) => item.error)
      if (failed.length) setError(failed.map((item) => item.error).filter(Boolean).join(" "))
      setNotice(`${results.length - failed.length} artist-reviewed work${results.length - failed.length === 1 ? " was" : "s were"} added privately.${failed.length ? ` ${failed.length} need attention.` : ""}`)
    } catch (reason) { setError(errorText(reason, "The selected works could not be approved.")) }
    finally { setWorking("") }
  }

  return <section className="rounded-[28px] border border-[#E2DCF1] bg-white p-5 shadow-[0_22px_70px_rgba(82,64,130,0.07)] sm:p-7" aria-labelledby="website-import-title">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Website Import Assist</p><h2 id="website-import-title" className="mt-2 font-serif text-3xl font-semibold">Let KLEIO review your artist website</h2><p className="mt-3 text-sm leading-7 text-[#746E80]">KLEIO separates exact source evidence, cleaned organization, possible interpretation, and missing information. You decide what is accurate and what may be used.</p></div><div className="grid gap-2 text-xs font-semibold text-[#625C70]"><span className="inline-flex items-center gap-2"><ShieldCheck className="size-4" />Nothing imports or publishes automatically</span><span className="inline-flex items-center gap-2"><Eye className="size-4" />Interpretations require artist review</span></div></div>

    <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]"><label className="grid gap-1.5 text-xs font-semibold">Public artist website<div className="relative"><input className={`${input} pr-12`} type="url" autoComplete="url" placeholder="https://yourportfolio.com" value={url} onChange={(event) => { setUrl(event.target.value); if (error) setError("") }} />{url && <button type="button" className="absolute right-1 top-1 grid size-9 place-items-center rounded-lg text-[#81788E] hover:bg-[#F7F4FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20" onClick={clearTypedUrl} aria-label="Clear typed website URL"><X className="size-4" /></button>}</div><span className="font-normal leading-5 text-[#81788E]">Use a portfolio or personal website. Automated review may remain limited on JavaScript-only or blocked sites.</span></label><button className={`${primary} lg:self-end`} disabled={!url.trim() || !permission || Boolean(working)} onClick={() => void analyze()}>{working === "website" ? <Loader2 className="size-4 animate-spin" /> : <Globe2 className="size-4" />}Analyze website</button></div>
    <label className="mt-3 flex items-start gap-3 rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] p-3 text-xs leading-5"><input type="checkbox" className="mt-0.5 size-4 accent-[#5B4B8A]" checked={permission} onChange={(event) => setPermission(event.target.checked)} /><span>I own this website or have permission to analyze its public content inside my private KLEIO workspace.</span></label>
    {(notice || error) && <div className={`mt-4 rounded-xl border p-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-[#E2DCF1] bg-[#F9F7FC] text-[#625C70]"}`} role={error ? "alert" : "status"} aria-live="polite">{error || notice}</div>}

    {session && <div className="mt-8 space-y-8">
      <section className="rounded-[24px] border border-[#DCD4EF] bg-[#FAF8FE] p-5" aria-labelledby="website-scan-summary"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#75639E]">What KLEIO reviewed</p><h3 id="website-scan-summary" className="mt-1 font-serif text-2xl font-semibold">{outcomeLabel(session.status)}</h3><p className="mt-2 break-all text-xs text-[#746E80]">Submitted: {session.website_url}<br />Canonical: {session.canonical_url || session.website_url}</p></div><button type="button" className={secondary} disabled={Boolean(working)} onClick={() => void clearScan()}>{working === "clear-scan" ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}Clear scan</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{scanMetrics.map(([label, value]) => <div key={label} className="rounded-xl border border-[#E7E1F7] bg-white p-3"><p className="text-xl font-semibold">{value}</p><p className="mt-1 text-xs text-[#746E80]">{label}</p></div>)}</div><details className="mt-4 rounded-xl border border-[#E7E1F7] bg-white p-3"><summary className="cursor-pointer text-xs font-semibold text-[#5B4B8A]">Collection details and limitations</summary><div className="mt-3 grid gap-2 text-xs leading-5 text-[#746E80]"><p><strong className="text-[#292631]">Extraction methods:</strong> {(session.scan_summary?.extraction_methods || []).join(", ") || "Public HTML"}</p><p><strong className="text-[#292631]">JavaScript rendering:</strong> {(session.scan_summary?.javascript_rendering || "not_required").replaceAll("_", " ")}</p><p><strong className="text-[#292631]">Gemini called:</strong> {session.scan_summary?.gemini_called ? "Yes" : "No"}</p>{(session.scan_summary?.limitations || []).map((item, index) => <p key={`${item}-${index}`}>• {item}</p>)}</div></details><p className="mt-3 text-xs font-semibold text-[#6A5896]">Nothing has been saved to the Creative Passport or published.</p></section>

      {!canOrganizeText && <section className="rounded-[22px] border border-amber-200 bg-amber-50 p-5 text-amber-950"><h3 className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="size-4" />Not enough public text for organization</h3><p className="mt-2 text-sm leading-6">Try a direct About, Portfolio, Work, or CV page; paste public biography or statement text; upload a CV or statement; use Google Drive; or continue manually. KLEIO does not imply that every website can be fully analyzed.</p></section>}

      <section><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#75639E]">1 · Copied and prepared source evidence</p><h3 className="mt-1 font-serif text-2xl font-semibold">Review profile information</h3></div><button className={secondary} disabled={!selectedFields.size || Boolean(working)} onClick={() => void saveProfile()}>{working === "profile" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Save selected fields</button></div><div className="mt-4 grid gap-4 lg:grid-cols-2">{profileFields.map(([key, label]) => { const field = session.profile_suggestions[key]; const multiline = ["bio", "artist_statement", "practice_description"].includes(key); return <article key={key} className="rounded-2xl border border-[#E7E1F7] p-4"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={selectedFields.has(key)} disabled={field.status === "missing"} onChange={() => setSelectedFields((current) => { const next = new Set(current); next.has(key) ? next.delete(key) : next.add(key); return next })} />{label}<span className="ml-auto text-[0.65rem] text-[#81788E]">{field.status === "extracted" ? "Copied from website" : field.status === "suggested" ? "Cleaned or suggested" : "Missing"}</span></label>{multiline ? <textarea className={`${textarea} mt-3`} value={profileEdits[key] || ""} onChange={(event) => setProfileEdits((current) => ({ ...current, [key]: event.target.value }))} /> : <input className={`${input} mt-3`} value={profileEdits[key] || ""} onChange={(event) => setProfileEdits((current) => ({ ...current, [key]: event.target.value }))} />}p className="mt-2 text-xs text-[#81788E]">{field.source}</p></article> })}</div></section>

      <section><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#75639E]">2 · Validated image evidence</p><h3 className="mt-1 font-serif text-2xl font-semibold">Choose representative works</h3><p className="mt-2 text-sm text-[#746E80]">No image is selected automatically. Choose up to {maxImages}, then confirm titles and rights.</p></div><div className="flex flex-wrap gap-2"><button className={secondary} disabled={!providerReady || !selectedImages.size || Boolean(working)} onClick={() => void runVision()}>{working === "vision" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}Analyze selected works</button><button className={primary} disabled={!rights || !selectedImages.size || Boolean(working)} onClick={() => void saveWorks()}>{working === "works" ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}Approve and add works</button></div></div>{session.image_candidates.length ? <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{session.image_candidates.map((candidate) => { const selected = selectedImages.has(candidate.id); const record = artworks[candidate.id] || initialArtwork(candidate); return <article key={candidate.id} className={`overflow-hidden rounded-2xl border ${selected ? "border-[#A997E8]" : "border-[#E7E1F7]"}`}><button type="button" className="relative aspect-[4/3] w-full bg-[#F3F0F8]" aria-pressed={selected} onClick={() => setSelectedImages((current) => { const next = new Set(current); next.has(candidate.id) ? next.delete(candidate.id) : next.size < maxImages && next.add(candidate.id); return next })}><img src={candidate.url} alt={candidate.alt || "Website artwork candidate"} referrerPolicy="no-referrer" className="size-full object-cover" /><span className="absolute right-3 top-3 rounded-full bg-white p-2">{selected ? <Check className="size-4" /> : <span className="block size-2 rounded-full bg-[#746E80]" />}</span></button><div className="grid gap-3 p-4"><label className="grid gap-1 text-xs font-semibold">Artist-confirmed title<input className={input} value={record.title} onChange={(event) => setArtworks((current) => ({ ...current, [candidate.id]: { ...record, title: event.target.value } }))} /></label><label className="grid gap-1 text-xs font-semibold">Year and medium<div className="grid grid-cols-2 gap-2"><input className={input} value={record.year} onChange={(event) => setArtworks((current) => ({ ...current, [candidate.id]: { ...record, year: event.target.value } }))} /><input className={input} value={record.medium} onChange={(event) => setArtworks((current) => ({ ...current, [candidate.id]: { ...record, medium: event.target.value } }))} /></div></label><p className="break-all text-[0.7rem] text-[#81788E]">{candidate.sourcePage}</p></div></article> })}</div> : <div className="mt-4 rounded-xl border border-dashed border-[#D8D0F2] bg-[#FAF9FD] p-6 text-center"><FileText className="mx-auto size-6 text-[#75639E]" /><p className="mt-2 text-sm font-semibold">No valid image candidate passed KLEIO’s URL, content-type, file-signature, size, and noise checks.</p></div>}<label className="mt-4 flex items-start gap-3 rounded-xl border border-[#E7E1F7] bg-[#FAF9FD] p-3 text-xs leading-5"><input type="checkbox" className="mt-0.5 size-4 accent-[#5B4B8A]" checked={rights} onChange={(event) => setRights(event.target.checked)} /><span>I confirm that I own or have permission to use the selected images and information in my KLEIO profile and applications.</span></label></section>

      {analysis && <section className="rounded-[24px] border border-[#DCD4EF] bg-[#FAF8FE] p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#75639E]">3 · Possible interpretation</p><h3 className="mt-1 font-serif text-2xl font-semibold">Confirm, edit, or reject KLEIO’s reading</h3></div><button className={primary} disabled={!reviewComplete || Boolean(working)} onClick={() => void saveReview()}>{working === "review" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Save completed review</button></div><label className="mt-4 grid gap-1 text-xs font-semibold">Artist-reviewed summary<textarea className={textarea} value={analysisSummary} onChange={(event) => { setAnalysisSummary(event.target.value); setReviewSaved(false) }} /></label><p className="mt-2 text-xs text-[#81788E]">{reviewEntries.filter(([, item]) => item.decision !== "pending").length} of {reviewEntries.length} observations reviewed</p><div className="mt-5 space-y-5">{analysisSections.map(([section, label]) => { const items = analysis[section]; if (!Array.isArray(items) || !items.length) return null; return <div key={section}><h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em]">{label}</h4><div className="grid gap-3 lg:grid-cols-2">{(items as VisualEvidenceObservation[]).map((item, index) => { const id = reviewId(String(section), index); const review = reviews[id]; if (!review) return null; const set = (next: Partial<Review>) => { setReviews((current) => ({ ...current, [id]: { ...review, ...next } })); setReviewSaved(false) }; return <article key={id} className={`rounded-2xl border bg-white p-4 ${review.decision === "pending" ? "border-amber-300" : "border-[#B9A9DE]"}`}><div className="flex justify-between gap-2"><strong>{item.label}</strong><span className="text-xs">{review.decision === "pending" ? "Review required" : review.decision}</span></div><label className="mt-3 grid gap-1 text-xs font-semibold">Direct observation<textarea className={textarea} value={review.observation} onChange={(event) => set({ observation: event.target.value, decision: "edited" })} /></label><label className="mt-3 grid gap-1 text-xs font-semibold">KLEIO interpretation — confirm, edit, or reject<textarea className={textarea} value={review.interpretation} onChange={(event) => set({ interpretation: event.target.value, decision: "edited" })} /></label><div className="mt-3 flex flex-wrap gap-2"><button className={review.decision === "confirmed" ? primary : secondary} onClick={() => set({ decision: "confirmed" })}><Check className="size-4" />Confirm</button><button className={review.decision === "edited" ? primary : secondary} onClick={() => set({ decision: "edited" })}><PenLine className="size-4" />Use edits</button><button className={review.decision === "rejected" ? primary : secondary} onClick={() => set({ decision: "rejected", useInDrafting: false })}><X className="size-4" />Reject</button></div><label className="mt-3 flex gap-2 text-xs"><input type="checkbox" disabled={review.decision === "pending" || review.decision === "rejected"} checked={review.useInDrafting} onChange={(event) => set({ useInDrafting: event.target.checked })} />Allow this reviewed item to influence writing drafts.</label></article> })}</div></div> })}</div></section>}

      <section className="rounded-[24px] border border-[#DCD4EF] p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#75639E]">4 · Evidence-grounded writing</p><h3 className="mt-1 font-serif text-2xl font-semibold">KLEIO Assist Drafting Studio</h3></div><button className={primary} disabled={!providerReady || Boolean(working) || Boolean(analysisId && !reviewSaved)} onClick={() => void generateDraft()}>{working === "draft" ? <Loader2 className="size-4 animate-spin" /> : <PenLine className="size-4" />}Generate two options</button></div>{analysisId && !reviewSaved && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs">Complete the visual review before its interpretations can influence writing.</p>}<div className="mt-4 grid gap-3 md:grid-cols-3"><label className="grid gap-1 text-xs font-semibold">Draft type<select className={input} value={draftType} onChange={(event) => setDraftType(event.target.value as KleioAssistDraftType)}><option value="short_bio">Short bio</option><option value="professional_bio">Professional bio</option><option value="artist_statement">Artist statement</option><option value="practice_description">Practice description</option><option value="artwork_description">Artwork description</option><option value="series_description">Series description</option><option value="project_description">Project description</option><option value="submission_letter">Submission letter</option><option value="letter_of_interest">Letter of interest</option><option value="application_answer">Application answer</option><option value="exhibition_proposal_summary">Exhibition proposal summary</option><option value="grant_residency_response">Grant or residency response</option></select></label><label className="grid gap-1 text-xs font-semibold">Maximum words<input className={input} type="number" min={40} max={1200} value={wordLimit} onChange={(event) => setWordLimit(Number(event.target.value))} /></label><label className="grid gap-1 text-xs font-semibold">Artist context<textarea className={textarea} value={artistContext} onChange={(event) => setArtistContext(event.target.value)} placeholder="Add confirmed facts, intent, voice preferences, or corrections." /></label></div>{["submission_letter", "letter_of_interest", "application_answer", "exhibition_proposal_summary", "grant_residency_response"].includes(draftType) && <label className="mt-3 grid gap-1 text-xs font-semibold">Opportunity prompt or context<textarea className={textarea} value={opportunityContext} onChange={(event) => setOpportunityContext(event.target.value)} /></label>}{draft && <div className="mt-5 space-y-4"><div className="grid gap-3 lg:grid-cols-2">{draft.options.map((option, index) => <button key={`${option.label}-${index}`} className="rounded-2xl border border-[#E7E1F7] p-4 text-left" onClick={() => setEditedDraft(option.text)}><strong>{option.label}</strong><p className="mt-2 line-clamp-6 text-sm leading-6 text-[#746E80]">{option.text}</p><p className="mt-2 text-xs text-[#81788E]">{option.word_count} words · {option.evidence_refs.length} evidence references</p></button>)}</div><label className="grid gap-1 text-xs font-semibold">Artist-edited final version<textarea className={`${textarea} min-h-56`} value={editedDraft} onChange={(event) => setEditedDraft(event.target.value)} /></label><div className="flex flex-wrap justify-end gap-2"><button className={secondary} onClick={() => void removeDraft()}>{working === "delete-draft" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}Delete draft</button><button className={primary} disabled={!editedDraft.trim()} onClick={() => void saveDraft()}>{working === "approve-draft" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Mark artist-approved</button></div></div>}</section>
    </div>}
  </section>
}
