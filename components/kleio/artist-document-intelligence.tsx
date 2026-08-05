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
  const assessment = result.summary.document_assessment ?? {}
  const grouped = Object.entries(result.summary.grouped_counts ?? {}).sort((left, right) => right[1] - left[1])
  const limitations = assessment.analysis_limitations ?? []
  const pagesAnalyzed = assessment.pages_analyzed?.length ?? 0
  const pagesTotal = assessment.total_pages ?? source?.page_count ?? 0

  return (
    <section className={`${panel} overflow-hidden`} aria-labelledby="latest-document-analysis-title">
      <div className="border-b border-[#E7E1F7] bg-[linear-gradient(135deg,#F8F5FF,#FFFFFF)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Document understanding result</p>
            <h2 id="latest-document-analysis-title" className="mt-1 break-all font-serif text-2xl font-semibold text-[#292631]">{result.filename}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#746E80]">
              KLEIO used Gemini to perceive the original PDF, then validated page evidence, coverage, conflicts and uncertainty before preparing any reviewable update.
            </p>
          </div>
          <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${qualityTone(result.summary.analysis_quality)}`}>
            {result.summary.analysis_quality === "complete_review_ready" || result.summary.analysis_quality === "substantial_review_ready"
              ? <ShieldCheck className="size-3.5" />
              : <AlertTriangle className="size-3.5" />}
            {qualityLabel(result.summary.analysis_quality)}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["Document type", assessment.document_type ? titleCase(assessment.document_type) : "Needs review"],
            ["Pages perceived", pagesTotal ? `${pagesAnalyzed}/${pagesTotal}` : "Unavailable"],
            ["Text quality", assessment.text_quality ? titleCase(assessment.text_quality) : "Unknown"],
            ["Layout", assessment.layout_complexity ? titleCase(assessment.layout_complexity) : "Unknown"],
            ["Supported updates", String(result.summary.claim_count ?? result.claims.length ?? 0)],
            ["Needs resolution", String((result.summary.conflict_count ?? 0) + (result.summary.unresolved_count ?? 0))],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[#E7E1F7] bg-white/90 p-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#8A8296]">{label}</p>
              <p className="mt-1 text-sm font-semibold text-[#292631]">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className={`rounded-2xl border p-4 text-sm leading-6 ${qualityTone(result.summary.analysis_quality)}`}>
          <p className="font-semibold">{result.summary.coverage_explanation || result.summary.analysis_summary?.coverage_explanation || "Review the supported findings and limitations below."}</p>
          {result.summary.analysis_quality === "limited_analysis" && (
            <p className="mt-1">KLEIO is intentionally not presenting a thin result as a complete reading.</p>
          )}
        </div>

        {grouped.length > 0 && (
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#292631]">What KLEIO organized</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {grouped.slice(0, 9).map(([section, count]) => (
                <div key={section} className="rounded-xl border border-[#E7E1F7] bg-[#FCFBFE] px-4 py-3">
                  <p className="text-sm font-semibold text-[#292631]">{titleCase(section)}</p>
                  <p className="mt-1 text-xs text-[#746E80]">{count} reviewable item{count === 1 ? "" : "s"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.claims.length > 0 && (
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#292631]">Representative findings</h3>
            <p className="mt-1 text-sm leading-6 text-[#746E80]">These remain private proposals. Page evidence and confidence stay visible during review.</p>
            <div className="mt-3 space-y-3">
              {result.claims.slice(0, 5).map((claim, index) => (
                <article key={`${claim.claim_type}-${index}`} className="rounded-2xl border border-[#E7E1F7] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#75639E]">
                      {titleCase(claim.target_section || claim.claim_type || "Document finding")}
                    </p>
                    <p className="text-xs text-[#8A8296]">
                      {claim.page_number ? `Page ${claim.page_number} · ` : ""}
                      {typeof claim.confidence === "number" ? `${Math.round(claim.confidence * 100)}% confidence` : "Artist review required"}
                    </p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#292631]">{claim.display_value}</p>
                  {claim.evidence_excerpt && (
                    <details className="mt-3 rounded-xl border border-[#E7E1F7] bg-[#FCFBFE] px-3 py-3">
                      <summary className="cursor-pointer text-xs font-semibold text-[#5B4B8A]">Review supporting evidence</summary>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#746E80]">{claim.evidence_excerpt}</p>
                    </details>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}

        {limitations.length > 0 && (
          <details className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
            <summary className="cursor-pointer text-sm font-semibold text-amber-900">What Gemini could not confirm</summary>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-amber-950">
              {limitations.map((limitation, index) => <li key={index}>• {limitation}</li>)}
            </ul>
          </details>
        )}

        <div className="flex flex-wrap gap-2">
          <Link className={primary} href="/artist-dashboard/passport/review/"><FileCheck2 className="size-4" />Review all extracted information</Link>
          <button type="button" className={secondary} onClick={onPreview} disabled={!source || working}><FileSearch className="size-4" />Open private PDF</button>
          <button type="button" className={secondary} onClick={onReanalyze} disabled={!source || working}>{working ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}Analyze again</button>
        </div>
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
            ? "The private PDF is safe, but Gemini document understanding is not configured. KLEIO did not claim a completed analysis."
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
