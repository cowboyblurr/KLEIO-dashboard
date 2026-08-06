"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  Check,
  FileCheck2,
  FileSearch,
  FileText,
  Loader2,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react"
import {
  ARTIST_DOCUMENT_TYPE_OPTIONS,
  createArtistDocumentPreview,
  decideArtistDocumentCorrelation,
  deleteArtistDocumentSource,
  documentStageLabel,
  keepDocumentWithoutAnalysis,
  loadArtistDocumentCorrelations,
  loadArtistDocuments,
  reanalyzeArtistDocument,
  refreshArtistDocumentCorrelations,
  uploadArtistDocument,
  validateArtistPdf,
  type ArtistDocumentCorrelation,
  type ArtistDocumentSource,
  type ArtistSelectedDocumentType,
  type DocumentUploadStage,
} from "@/lib/kleio-document-intelligence"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"

const panel = "rounded-[24px] border border-[#E2DCF1] bg-white shadow-[0_18px_52px_rgba(82,64,130,0.06)]"
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const subtle = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#746E80] transition hover:bg-[#F5F1FB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:opacity-50"
const field = "min-h-11 rounded-xl border border-[#DED7EF] bg-white px-3 py-2 text-sm text-[#292631] outline-none transition focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12"

const STAGE_LABELS: Record<DocumentUploadStage, string> = {
  validating: "Checking the selected file",
  checking_availability: "Confirming the private upload path",
  checking_duplicate: "Checking for an existing private copy",
  uploading: "Uploading your private PDF",
  creating_private_source: "Creating the private source record",
  server_validation: "Verifying file safety, pages and document integrity",
  extracting: "Gemini is perceiving the original PDF structure, pages and supported information",
  review_ready: "Validating evidence, coverage and Creative Passport proposals",
}

type RepresentativeClaim = {
  claim_type?: string
  target_section?: string
  display_value?: string
  page_number?: number | null
  evidence_excerpt?: string
  evidence_mode?: string
  confidence?: number
  relationship_status?: string
  status?: string
}

type AnalysisSummary = {
  provider?: string
  model?: string
  analysis_quality?: string
  analysis_score?: number
  coverage_explanation?: string
  document_assessment?: {
    document_type?: string
    languages?: string[]
    total_pages?: number
    pages_analyzed?: number[]
    unreadable_pages?: number[]
    text_quality?: string
    layout_complexity?: string
    column_structure?: string
    contains_tables?: boolean
    contains_artwork_images?: boolean
    contains_scanned_pages?: boolean
    analysis_limitations?: string[]
  }
  sections?: Array<{
    section_type?: string
    source_heading?: string
    start_page?: number
    end_page?: number
    confidence?: number
  }>
  analysis_summary?: {
    document_synopsis?: string
    relevance?: "highly_relevant" | "partially_relevant" | "not_relevant" | "requires_artist_review"
    relevance_explanation?: string
    extractable_information?: Array<{
      category?: string
      approximate_items?: number
      confidence?: number
      passport_or_application_use?: string
    }>
    recommended_use?: string[]
    what_was_found?: string[]
    what_was_not_found?: string[]
    what_needs_review?: string[]
    coverage_level?: string
    coverage_explanation?: string
  }
  claim_count?: number
  section_count?: number
  conflict_count?: number
  duplicate_count?: number
  unresolved_count?: number
  grouped_counts?: Record<string, number>
  representative_claims?: RepresentativeClaim[]
  gemini_visual_document_understanding?: boolean
}

type AnalysisResult = {
  sourceId: string
  filename: string
  summary: AnalysisSummary
  claims: RepresentativeClaim[]
}

function bytes(value: number | null) {
  if (!value) return "Size unavailable"
  return value < 1024 * 1024 ? `${Math.round(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`
}

function typeLabel(value: ArtistSelectedDocumentType) {
  return ARTIST_DOCUMENT_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? "Artist document"
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function readSummary(source: ArtistDocumentSource): AnalysisSummary {
  return source.review_summary && typeof source.review_summary === "object" && !Array.isArray(source.review_summary)
    ? source.review_summary as AnalysisSummary
    : {}
}

function qualityLabel(value?: string) {
  if (value === "complete_review_ready") return "Complete analysis ready"
  if (value === "substantial_review_ready") return "Substantial analysis ready"
  if (value === "limited_analysis") return "Limited analysis"
  if (value === "visual_reading_limited") return "Visual reading limited"
  if (value === "classification_required") return "Document type needs confirmation"
  if (value === "provider_unavailable") return "Gemini temporarily unavailable"
  if (value === "failed") return "Analysis failed"
  return value ? titleCase(value) : "Analysis pending"
}

function qualityTone(value?: string) {
  if (value === "complete_review_ready" || value === "substantial_review_ready") return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (value === "limited_analysis" || value === "visual_reading_limited" || value === "classification_required") return "border-amber-200 bg-amber-50 text-amber-900"
  if (value === "failed") return "border-red-200 bg-red-50 text-red-800"
  return "border-[#D8D0F2] bg-[#F8F5FF] text-[#625C70]"
}

function statusTone(source: ArtistDocumentSource) {
  const quality = readSummary(source).analysis_quality
  if (quality) return qualityTone(quality)
  if (source.analysis_stage === "failed" || source.ocr_status === "failed") return "border-red-200 bg-red-50 text-red-800"
  if (source.ocr_status === "not_configured" || source.text_layer_status === "unavailable") return "border-amber-200 bg-amber-50 text-amber-900"
  if (source.analysis_stage === "review_ready" || source.analysis_stage === "review_completed") return "border-emerald-200 bg-emerald-50 text-emerald-800"
  return "border-[#D8D0F2] bg-[#F8F5FF] text-[#625C70]"
}

function resultFromResponse(
  source: ArtistDocumentSource,
  extraction: unknown,
): AnalysisResult | null {
  if (!extraction || typeof extraction !== "object" || Array.isArray(extraction)) return null
  const value = extraction as { analysisSummary?: AnalysisSummary; representativeClaims?: RepresentativeClaim[] }
  if (!value.analysisSummary) return null
  return {
    sourceId: source.id,
    filename: source.original_filename || source.label,
    summary: value.analysisSummary,
    claims: value.representativeClaims ?? value.analysisSummary.representative_claims ?? [],
  }
}

type AnalysisView = "overview" | "suggestions" | "details"

function AnalysisResultPanel({
  result,
  source,
  onPreview,
  onReanalyze,
  working,
}: {
  result: AnalysisResult
  source?: ArtistDocumentSource
  onPreview: () => void
  onReanalyze: () => void
  working: boolean
}) {
  const [view, setView] = useState<AnalysisView>("overview")
  const assessment = result.summary.document_assessment ?? {}
  const insight = result.summary.analysis_summary ?? {}
  const limitations = assessment.analysis_limitations ?? []
  const pagesAnalyzed = assessment.pages_analyzed?.length ?? 0
  const pagesTotal = assessment.total_pages ?? source?.page_count ?? 0
  const supportedCount = Number(result.summary.claim_count ?? result.claims.length ?? 0)
  const resolutionCount = Number(result.summary.conflict_count ?? 0) + Number(result.summary.unresolved_count ?? 0)
  const groupedCounts = Object.entries(result.summary.grouped_counts ?? {}).sort((left, right) => right[1] - left[1])
  const claimGroups = result.claims.reduce<Record<string, RepresentativeClaim[]>>((groups, claim) => {
    const key = claim.target_section || claim.claim_type || "document_finding"
    groups[key] = [...(groups[key] ?? []), claim]
    return groups
  }, {})
  const summaryItems = [
    [assessment.document_type ? titleCase(assessment.document_type) : "Document needs review", "Document"],
    [pagesTotal ? `${pagesAnalyzed}/${pagesTotal}` : "—", "Pages"],
    [String(supportedCount), "Suggestions"],
    [String(resolutionCount), "Needs attention"],
  ]
  const views: Array<{ id: AnalysisView; label: string; count?: number }> = [
    { id: "overview", label: "Overview" },
    { id: "suggestions", label: "Suggestions", count: supportedCount },
    { id: "details", label: "Details & evidence", count: resolutionCount || undefined },
  ]

  return (
    <section className={`${panel} overflow-hidden`} aria-labelledby="latest-document-analysis-title">
      <header className="border-b border-[#E7E1F7] bg-[#FCFBFE] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Document analysis</p>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold ${qualityTone(result.summary.analysis_quality)}`}>
                {result.summary.analysis_quality === "complete_review_ready" || result.summary.analysis_quality === "substantial_review_ready"
                  ? <ShieldCheck className="size-3.5" />
                  : <AlertTriangle className="size-3.5" />}
                {qualityLabel(result.summary.analysis_quality)}
              </span>
            </div>
            <h2 id="latest-document-analysis-title" className="mt-2 truncate font-serif text-2xl font-semibold text-[#292631]">{result.filename}</h2>
            <p className="mt-1 text-sm text-[#746E80]">Private source · Gemini analysis · Artist approval required</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={secondary} onClick={onPreview} disabled={!source || working}><FileSearch className="size-4" />Open PDF</button>
            <button type="button" className={subtle} onClick={onReanalyze} disabled={!source || working}>{working ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}Analyze again</button>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#E7E1F7] bg-white sm:grid-cols-4">
          {summaryItems.map(([value, label], index) => (
            <div key={label} className={`px-4 py-3 ${index % 2 ? "border-l border-[#E7E1F7]" : ""} ${index > 1 ? "border-t border-[#E7E1F7] sm:border-t-0 sm:border-l" : ""}`}>
              <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#8A8296]">{label}</dt>
              <dd className="mt-1 truncate text-sm font-semibold text-[#292631]">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="px-5 pt-4 sm:px-6">
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-[#F5F2FA] p-1" role="tablist" aria-label="Document analysis views">
          {views.map((item) => (
            <button
              key={item.id}
              id={`analysis-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={view === item.id}
              aria-controls={`analysis-panel-${item.id}`}
              onClick={() => setView(item.id)}
              className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 ${view === item.id ? "bg-white text-[#4F407B] shadow-sm" : "text-[#746E80] hover:text-[#4F407B]"}`}
            >
              {item.label}
              {typeof item.count === "number" && <span className="rounded-full bg-[#EEE9F8] px-2 py-0.5 text-[0.67rem] text-[#5B4B8A]">{item.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {view === "overview" && (
          <div id="analysis-panel-overview" role="tabpanel" aria-labelledby="analysis-tab-overview" className="mx-auto max-w-4xl space-y-5">
            <section aria-labelledby="document-synopsis-title">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id="document-synopsis-title" className="font-serif text-xl font-semibold text-[#292631]">What KLEIO understood</h3>
                {insight.relevance && <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${insight.relevance === "not_relevant" ? "border-amber-200 bg-amber-50 text-amber-900" : insight.relevance === "highly_relevant" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-[#D8D0F2] bg-[#FCFBFE] text-[#625C70]"}`}>{titleCase(insight.relevance)}</span>}
              </div>
              <p className="mt-3 text-sm leading-7 text-[#4B4654]">{insight.document_synopsis || "KLEIO identified the document structure and prepared its supported information for review."}</p>
              {insight.relevance_explanation && <p className="mt-2 text-sm leading-6 text-[#746E80]">{insight.relevance_explanation}</p>}
            </section>

            {(insight.recommended_use?.length ?? 0) > 0 && (
              <section className="border-t border-[#EEEAF6] pt-4">
                <h3 className="text-sm font-semibold text-[#292631]">Recommended next use</h3>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-[#746E80]">{insight.recommended_use?.slice(0, 3).map((item, index) => <li key={index} className="flex gap-2"><span aria-hidden="true" className="text-[#75639E]">•</span><span>{item}</span></li>)}</ul>
              </section>
            )}

            <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${qualityTone(result.summary.analysis_quality)}`}>
              {result.summary.coverage_explanation || insight.coverage_explanation || "Review the supported findings before changing your Passport."}
            </div>

            <div className="flex flex-col gap-2 border-t border-[#EEEAF6] pt-5 sm:flex-row sm:items-center">
              <Link className={`${primary} sm:min-w-64`} href="/artist-dashboard/passport/review/"><FileCheck2 className="size-4" />Review suggested Passport updates</Link>
              <button type="button" className={secondary} onClick={() => setView("suggestions")}>Preview suggestions here</button>
            </div>
          </div>
        )}

        {view === "suggestions" && (
          <div id="analysis-panel-suggestions" role="tabpanel" aria-labelledby="analysis-tab-suggestions" className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-2 border-b border-[#EEEAF6] pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="font-serif text-xl font-semibold text-[#292631]">Suggested Passport updates</h3>
                <p className="mt-1 text-sm leading-6 text-[#746E80]">Grouped by where the information may belong. Open only the sections you want to inspect.</p>
              </div>
              <Link className={secondary} href="/artist-dashboard/passport/review/">Open full review</Link>
            </div>

            {Object.keys(claimGroups).length > 0 ? (
              <div className="divide-y divide-[#EEEAF6]">
                {Object.entries(claimGroups).map(([group, claims], groupIndex) => (
                  <details key={group} className="group py-1" open={groupIndex === 0}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-2 py-4 transition hover:bg-[#FCFBFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20">
                      <div>
                        <p className="text-sm font-semibold text-[#292631]">{titleCase(group)}</p>
                        <p className="mt-0.5 text-xs text-[#81788E]">{claims.length} visible suggestion{claims.length === 1 ? "" : "s"}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#75639E] group-open:hidden">View</span>
                      <span className="hidden text-xs font-semibold text-[#75639E] group-open:inline">Hide</span>
                    </summary>
                    <div className="space-y-2 pb-4 pl-2 pr-2">
                      {claims.map((claim, index) => (
                        <article key={`${claim.claim_type}-${index}`} className="rounded-xl border border-[#E7E1F7] bg-[#FCFBFE] px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold leading-6 text-[#292631]">{claim.display_value}</p>
                            <p className="text-xs text-[#8A8296]">{claim.page_number ? `Page ${claim.page_number}` : "Page review required"}{typeof claim.confidence === "number" ? ` · ${Math.round(claim.confidence * 100)}%` : ""}</p>
                          </div>
                          {claim.evidence_excerpt && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs font-semibold text-[#5B4B8A]">View source evidence</summary>
                              <p className="mt-2 border-l-2 border-[#D8D0F2] pl-3 text-xs leading-5 text-[#746E80]">{claim.evidence_excerpt}</p>
                            </details>
                          )}
                        </article>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-[#D8D0F2] bg-[#FCFBFE] p-5 text-sm leading-6 text-[#746E80]">
                No representative suggestions are available in this preview. Open the full review to inspect all source-backed proposals.
              </div>
            )}

            {groupedCounts.length > Object.keys(claimGroups).length && (
              <p className="mt-4 text-xs leading-5 text-[#81788E]">The full review contains additional grouped findings that are intentionally not expanded here.</p>
            )}
          </div>
        )}

        {view === "details" && (
          <div id="analysis-panel-details" role="tabpanel" aria-labelledby="analysis-tab-details" className="mx-auto max-w-4xl space-y-5">
            <section>
              <h3 className="font-serif text-xl font-semibold text-[#292631]">Document details</h3>
              <dl className="mt-3 divide-y divide-[#EEEAF6] rounded-xl border border-[#E7E1F7] bg-[#FCFBFE] px-4">
                {[
                  ["Detected type", assessment.document_type ? titleCase(assessment.document_type) : "Needs review"],
                  ["Relevance", insight.relevance ? titleCase(insight.relevance) : "Needs review"],
                  ["Page coverage", pagesTotal ? `${pagesAnalyzed} of ${pagesTotal} pages` : "Unavailable"],
                  ["Text quality", assessment.text_quality ? titleCase(assessment.text_quality) : "Unknown"],
                  ["Layout", assessment.layout_complexity ? titleCase(assessment.layout_complexity) : "Unknown"],
                  ["Sections mapped", String(result.summary.section_count ?? result.summary.sections?.length ?? 0)],
                ].map(([label, value]) => (
                  <div key={label} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:items-center">
                    <dt className="text-xs font-semibold text-[#81788E]">{label}</dt>
                    <dd className="text-sm font-medium text-[#292631]">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {(insight.extractable_information?.length ?? 0) > 0 && (
              <details className="rounded-xl border border-[#E7E1F7] bg-white px-4 py-4">
                <summary className="cursor-pointer text-sm font-semibold text-[#292631]">Information categories KLEIO can audit</summary>
                <div className="mt-3 divide-y divide-[#EEEAF6]">
                  {insight.extractable_information?.map((item, index) => (
                    <div key={`${item.category}-${index}`} className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#292631]">{item.category || "Document information"}</p>
                        {typeof item.confidence === "number" && <span className="text-xs font-semibold text-[#75639E]">{Math.round(item.confidence * 100)}%</span>}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[#746E80]">{item.passport_or_application_use || "Artist review required before use."}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {limitations.length > 0 ? (
              <details className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4" open={resolutionCount > 0}>
                <summary className="cursor-pointer text-sm font-semibold text-amber-900">What needs attention ({limitations.length})</summary>
                <ul className="mt-3 space-y-2 text-xs leading-5 text-amber-950">{limitations.map((limitation, index) => <li key={index}>• {limitation}</li>)}</ul>
              </details>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">No document-level limitations were reported.</div>
            )}

            <p className="text-xs leading-5 text-[#81788E]">Evidence remains private. Nothing enters the Creative Passport until the artist confirms it in the full review.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export function ArtistDocumentIntelligence() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [selectedType, setSelectedType] = useState<ArtistSelectedDocumentType>("artist_cv")
  const [consent, setConsent] = useState(false)
  const [analyze, setAnalyze] = useState(true)
  const [dragging, setDragging] = useState(false)
  const [stage, setStage] = useState<DocumentUploadStage | null>(null)
  const [documents, setDocuments] = useState<ArtistDocumentSource[]>([])
  const [correlations, setCorrelations] = useState<ArtistDocumentCorrelation[]>([])
  const [workingId, setWorkingId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [nextDocuments, nextCorrelations] = await Promise.all([
        loadArtistDocuments(),
        loadArtistDocumentCorrelations(),
      ])
      setDocuments(nextDocuments)
      setCorrelations(nextCorrelations)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not load your private documents.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const displayedResult = useMemo(() => {
    if (analysisResult) return analysisResult
    const source = documents.find((item) => Boolean(readSummary(item).analysis_quality))
    if (!source) return null
    const summary = readSummary(source)
    return {
      sourceId: source.id,
      filename: source.original_filename || source.label,
      summary,
      claims: summary.representative_claims ?? [],
    }
  }, [analysisResult, documents])

  async function choose(next: File | null) {
    setError("")
    setMessage("")
    setAnalysisResult(null)
    if (!next) return setFile(null)
    try {
      await validateArtistPdf(next)
      setFile(next)
      void trackKleioProductEvent("document_upload_started", {
        surface: "document_intelligence",
        metadata: { source: "device_document", mode: "selected" },
      })
    } catch (reason) {
      setFile(null)
      setError(reason instanceof Error ? reason.message : "Choose a valid PDF document.")
    }
  }

  async function submit() {
    if (!file || !consent || workingId) return
    setWorkingId("upload")
    setError("")
    setMessage("")
    setAnalysisResult(null)
    try {
      const result = await uploadArtistDocument({
        file,
        selectedType,
        analyze,
        onStage: setStage,
      })
      const extracted = resultFromResponse(result.source, result.extraction)
      if (extracted) setAnalysisResult(extracted)
      const summary = extracted?.summary
      const count = Number(summary?.claim_count ?? result.extraction?.proposalCount ?? 0)
      const quality = summary?.analysis_quality
      const warning = result.extraction?.warnings.includes("ocr_required")
        || result.extraction?.warnings.includes("limited_analysis")
        || result.extraction?.warnings.includes("visual_reading_limited")
      setMessage(
        analyze
          ? quality === "provider_unavailable"
            ? "The private PDF is safe, but Gemini could not complete this analysis. Try Analyze again; KLEIO did not claim a completed result."
            : warning
              ? `KLEIO completed a limited analysis and prepared ${count} supported update${count === 1 ? "" : "s"}. Review the coverage explanation below.`
              : `${result.duplicate ? "The existing private document was reused." : "The document was uploaded privately."} ${count} supported update${count === 1 ? "" : "s"} prepared for review.`
          : "The PDF was stored privately without analysis.",
      )
      void trackKleioProductEvent(analyze ? "document_analysis_completed" : "document_upload_completed", {
        surface: "document_intelligence",
        metadata: {
          source: "device_document",
          status: quality || (warning ? "limited_analysis" : analyze ? "review_ready" : "stored_only"),
          result_count: count,
        },
      })
      setFile(null)
      setConsent(false)
      setStage(null)
      if (inputRef.current) inputRef.current.value = ""
      await refresh()
    } catch (reason) {
      const nextError = reason instanceof Error ? reason.message : "The document workflow could not be completed."
      setError(nextError)
      void trackKleioProductEvent("document_analysis_failed", {
        surface: "document_intelligence",
        metadata: { source: "device_document", error_code: "document_workflow_failed", step: stage ?? "unknown" },
      })
    } finally {
      setWorkingId("")
      setStage(null)
    }
  }

  async function preview(source: ArtistDocumentSource) {
    setWorkingId(source.id)
    setError("")
    try {
      const result = await createArtistDocumentPreview(source)
      window.open(result.url, "_blank", "noopener,noreferrer")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The private preview could not be opened.")
    } finally {
      setWorkingId("")
    }
  }

  async function reanalyze(source: ArtistDocumentSource) {
    setWorkingId(source.id)
    setError("")
    setMessage("")
    try {
      const result = await reanalyzeArtistDocument(source.id, source.artist_selected_document_type)
      const extracted = resultFromResponse(source, result)
      if (extracted) setAnalysisResult(extracted)
      const summary = extracted?.summary
      const count = Number(summary?.claim_count ?? result.proposalCount ?? 0)
      setMessage(
        summary?.analysis_quality === "limited_analysis" || summary?.analysis_quality === "visual_reading_limited"
          ? `KLEIO completed a limited reanalysis and prepared ${count} supported update${count === 1 ? "" : "s"}.`
          : `${count} supported update${count === 1 ? "" : "s"} prepared for review.`,
      )
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not analyze this document again.")
    } finally {
      setWorkingId("")
    }
  }

  async function stopAnalysis(source: ArtistDocumentSource) {
    setWorkingId(source.id)
    setError("")
    setMessage("")
    try {
      await keepDocumentWithoutAnalysis(source.id)
      if (analysisResult?.sourceId === source.id) setAnalysisResult(null)
      setMessage("The analysis and unconfirmed suggestions were removed. The original PDF remains private.")
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not remove this analysis.")
    } finally {
      setWorkingId("")
    }
  }

  async function removeSource(source: ArtistDocumentSource) {
    setWorkingId(source.id)
    setError("")
    setMessage("")
    try {
      await deleteArtistDocumentSource(source)
      if (analysisResult?.sourceId === source.id) setAnalysisResult(null)
      setMessage("The private source file was deleted.")
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not delete this document.")
    } finally {
      setWorkingId("")
    }
  }

  async function buildCorrelations() {
    setWorkingId("correlations")
    setError("")
    setMessage("")
    try {
      const result = await refreshArtistDocumentCorrelations()
      setMessage(`${result.correlations_created} cross-document pattern${result.correlations_created === 1 ? "" : "s"} prepared for review. Repetition remains a correlation, not a verified fact.`)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not compare your documents.")
    } finally {
      setWorkingId("")
    }
  }

  async function decideCorrelation(item: ArtistDocumentCorrelation, status: ArtistDocumentCorrelation["status"]) {
    setWorkingId(item.id)
    setError("")
    setMessage("")
    try {
      await decideArtistDocumentCorrelation({ id: item.id, status })
      setMessage(status === "confirmed_useful_language" ? "The pattern was marked as useful language. It was not added as a verified fact." : "Your feedback was saved.")
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not save this pattern decision.")
    } finally {
      setWorkingId("")
    }
  }

  const resultSource = displayedResult ? documents.find((source) => source.id === displayedResult.sourceId) : undefined

  return (
    <div className="space-y-5">
      <section className={`${panel} overflow-hidden bg-[linear-gradient(135deg,#F8F5FF,#FFFFFF)] p-5 sm:p-7`} aria-labelledby="document-intelligence-title">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Creative Passport document intelligence</p>
            <h1 id="document-intelligence-title" className="mt-2 max-w-3xl font-serif text-3xl font-semibold tracking-[-0.04em] text-[#292631] sm:text-4xl">Upload CV or artist document</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#746E80]">
              KLEIO uses Gemini to perceive the original PDF’s pages, layout, columns, tables, images and artist-authored language. KLEIO then validates evidence before preparing private Creative Passport suggestions. Nothing is published or shared automatically.
            </p>
          </div>
          <div className="rounded-2xl border border-[#D8D0F2] bg-white/85 p-4 text-xs leading-5 text-[#625C70]">
            <p className="flex items-center gap-2 font-semibold text-[#5B4B8A]"><LockKeyhole className="size-4" />Private and artist-controlled</p>
            <p className="mt-2">PDF only · 15 MB maximum · 100 pages maximum.</p>
            <p className="mt-2">Gemini is used server-side for visual and semantic document understanding. Every proposed fact keeps page evidence and requires your review.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div
            className={`grid min-h-48 place-items-center rounded-[22px] border-2 border-dashed p-6 text-center transition ${dragging ? "border-[#75639E] bg-[#F5F1FB]" : "border-[#D8D0F2] bg-white/75"}`}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              void choose(event.dataTransfer.files?.[0] ?? null)
            }}
          >
            <div>
              <UploadCloud className="mx-auto size-8 text-[#75639E]" />
              <p className="mt-3 text-sm font-semibold text-[#292631]">{file ? file.name : "Drop a PDF here"}</p>
              <p className="mt-1 text-xs leading-5 text-[#81788E]">{file ? `${bytes(file.size)} · ready for your decision` : "Or choose a file from this device. Keyboard and mobile selection are supported."}</p>
              <button type="button" className={`${secondary} mt-4`} onClick={() => inputRef.current?.click()} disabled={Boolean(workingId)}>
                <FileText className="size-4" />Choose PDF
              </button>
              <input ref={inputRef} className="sr-only" type="file" accept="application/pdf,.pdf" onChange={(event) => void choose(event.target.files?.[0] ?? null)} />
              {file && <button type="button" className={`${subtle} mt-2`} onClick={() => void choose(null)} disabled={Boolean(workingId)}><X className="size-4" />Clear selection</button>}
            </div>
          </div>

          <div className="space-y-4 rounded-[22px] border border-[#E7E1F7] bg-white p-4">
            <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]">
              <span>Document type</span>
              <select className={field} value={selectedType} onChange={(event) => setSelectedType(event.target.value as ArtistSelectedDocumentType)} disabled={Boolean(workingId)}>
                {ARTIST_DOCUMENT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}{option.sensitive ? " — restricted" : ""}</option>)}
              </select>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-[#E7E1F7] p-3 text-xs leading-5 text-[#625C70]">
              <input className="mt-1" type="checkbox" checked={analyze} onChange={(event) => setAnalyze(event.target.checked)} disabled={Boolean(workingId)} />
              <span><strong className="block text-[#292631]">Understand this document with Gemini</strong>Perceive the original PDF and prepare private, page-supported proposals. Turn this off to store the source without analysis.</span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-[#E7E1F7] p-3 text-xs leading-5 text-[#625C70]">
              <input className="mt-1" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={Boolean(workingId)} />
              <span>I understand that KLEIO will process this private PDF server-side with Gemini, preserve evidence and uncertainty, and wait for my approval before changing my Passport.</span>
            </label>
            <button type="button" className={`${primary} w-full`} disabled={!file || !consent || Boolean(workingId)} onClick={() => void submit()}>
              {workingId === "upload" ? <Loader2 className="size-4 animate-spin" /> : <FileSearch className="size-4" />}
              {analyze ? "Upload and understand document" : "Store privately"}
            </button>
          </div>
        </div>

        {stage && (
          <div role="status" aria-live="polite" className="mt-4 rounded-2xl border border-[#D8D0F2] bg-white px-4 py-4">
            <p className="flex items-center gap-3 text-sm font-semibold text-[#625C70]"><Loader2 className="size-4 animate-spin text-[#75639E]" />{STAGE_LABELS[stage]}</p>
            {stage === "extracting" && (
              <p className="mt-2 text-xs leading-5 text-[#81788E]">KLEIO is not merely scanning for keywords. Gemini is reading the document as a visual object and KLEIO will reject findings that lack page evidence.</p>
            )}
          </div>
        )}
      </section>

      {(error || message) && <div role={error ? "alert" : "status"} aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || message}</div>}

      {displayedResult && (
        <AnalysisResultPanel
          result={displayedResult}
          source={resultSource}
          onPreview={() => resultSource && void preview(resultSource)}
          onReanalyze={() => resultSource && void reanalyze(resultSource)}
          working={Boolean(resultSource && workingId === resultSource.id)}
        />
      )}

      <section className={`${panel} p-5 sm:p-6`} aria-labelledby="private-document-library-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#75639E]">Private source library</p>
            <h2 id="private-document-library-title" className="mt-1 font-serif text-2xl font-semibold text-[#292631]">Your artist documents</h2>
            <p className="mt-1 text-sm leading-6 text-[#746E80]">Originals and versions remain distinct. Confirmed Passport records and application packages keep their source relationships.</p>
          </div>
          <Link className={primary} href="/artist-dashboard/passport/review/"><FileCheck2 className="size-4" />Review Passport updates</Link>
        </div>

        {loading && <p className="mt-5 flex items-center gap-2 text-sm text-[#746E80]"><Loader2 className="size-4 animate-spin" />Loading private documents…</p>}
        {!loading && documents.length === 0 && <div className="mt-5 rounded-xl border border-dashed border-[#D8D0F2] bg-[#FBFAFE] p-6 text-center text-sm text-[#746E80]">No private artist documents are stored yet.</div>}

        <div className="mt-5 space-y-3">
          {documents.map((source) => {
            const summary = readSummary(source)
            return (
              <article key={source.id} className="rounded-2xl border border-[#E7E1F7] bg-[#FCFBFE] p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <FileText className="size-4 shrink-0 text-[#75639E]" />
                      <h3 className="break-all font-serif text-lg font-semibold text-[#292631]">{source.original_filename || source.label}</h3>
                      <span className="rounded-full border border-[#D8D0F2] bg-white px-2.5 py-1 text-[0.67rem] font-semibold text-[#625C70]">Version {source.document_version}</span>
                      {!source.is_current_version && <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[0.67rem] font-semibold text-amber-800">Older version</span>}
                    </div>
                    <p className="mt-2 text-xs text-[#746E80]">{typeLabel(source.artist_selected_document_type)} · {bytes(source.byte_size)}{source.page_count ? ` · ${source.page_count} pages` : ""}</p>
                    <span className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusTone(source)}`}>
                      {summary.analysis_quality === "complete_review_ready" || summary.analysis_quality === "substantial_review_ready" ? <ShieldCheck className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
                      {summary.analysis_quality ? qualityLabel(summary.analysis_quality) : documentStageLabel(source)}
                    </span>
                    {summary.coverage_explanation && <p className="mt-3 max-w-3xl text-xs leading-5 text-[#746E80]">{summary.coverage_explanation}</p>}
                    {summary.provider === "gemini" && <p className="mt-2 text-[0.67rem] font-semibold text-[#8A8296]">Gemini visual document understanding · page evidence retained · artist approval required</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={secondary} disabled={Boolean(workingId)} onClick={() => void preview(source)}><FileSearch className="size-4" />Private preview</button>
                    <button type="button" className={secondary} disabled={Boolean(workingId)} onClick={() => void reanalyze(source)}>{workingId === source.id ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}Analyze again</button>
                    {!source.keep_without_analysis && <button type="button" className={subtle} disabled={Boolean(workingId)} onClick={() => void stopAnalysis(source)}>Remove analysis</button>}
                    <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50" disabled={Boolean(workingId)} onClick={() => void removeSource(source)}><Trash2 className="size-4" />Delete source</button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className={`${panel} p-5 sm:p-6`} aria-labelledby="patterns-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#75639E]">Cross-document correlation · Layer 3</p>
            <h2 id="patterns-title" className="mt-1 font-serif text-2xl font-semibold text-[#292631]">Patterns KLEIO noticed</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#746E80]">KLEIO compares source-backed proposals across private documents. Repeated copied language is flagged as inheritance risk and never treated as independent proof.</p>
          </div>
          <button type="button" className={secondary} disabled={Boolean(workingId)} onClick={() => void buildCorrelations()}>{workingId === "correlations" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}Compare documents</button>
        </div>

        {!correlations.length && <div className="mt-5 rounded-xl border border-dashed border-[#D8D0F2] bg-[#FBFAFE] p-6 text-center text-sm leading-6 text-[#746E80]">Patterns appear after at least two private documents contain related source-backed evidence.</div>}
        <div className="mt-5 space-y-3">
          {correlations.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[#E7E1F7] bg-[#FCFBFE] p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#75639E]">Correlation · {item.supporting_source_count} sources · {item.confidence_state.replaceAll("_", " ")}</p>
                  <h3 className="mt-1 font-serif text-xl font-semibold text-[#292631]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#625C70]">{item.artist_edited_text || item.summary}</p>
                  {item.inheritance_risk && <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><AlertTriangle className="mt-0.5 size-4 shrink-0" />The same wording may have been copied between document versions. Treat this as repeated artist-authored language, not multiple independent confirmations.</p>}
                  <details className="mt-3 rounded-xl border border-[#E7E1F7] bg-white px-3 py-3">
                    <summary className="cursor-pointer text-xs font-semibold text-[#5B4B8A]">Review supporting evidence</summary>
                    <div className="mt-2 space-y-2">{item.supporting_evidence.map((evidence, index) => <p key={index} className="text-xs leading-5 text-[#746E80]">Source {index + 1}{evidence.page ? ` · page ${String(evidence.page)}` : ""}{evidence.excerpt ? ` — ${String(evidence.excerpt)}` : ""}</p>)}</div>
                  </details>
                </div>
                {item.status === "proposed" ? <div className="flex flex-wrap gap-2">
                  <button type="button" className={primary} disabled={Boolean(workingId)} onClick={() => void decideCorrelation(item, "confirmed_useful_language")}><Check className="size-4" />Useful language</button>
                  <button type="button" className={secondary} disabled={Boolean(workingId)} onClick={() => void decideCorrelation(item, "deferred")}>Review later</button>
                  <button type="button" className={subtle} disabled={Boolean(workingId)} onClick={() => void decideCorrelation(item, "inaccurate")}>Not accurate</button>
                  <button type="button" className={subtle} disabled={Boolean(workingId)} onClick={() => void decideCorrelation(item, "dismissed")}>Dismiss</button>
                </div> : <span className="w-fit rounded-full bg-[#F2EFF7] px-3 py-1.5 text-xs font-semibold text-[#625C70]">{item.status.replaceAll("_", " ")}</span>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
