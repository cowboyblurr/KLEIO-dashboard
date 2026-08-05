"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
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
  checking_availability: "Confirming the beta upload path",
  checking_duplicate: "Checking for an existing private copy",
  uploading: "Uploading your document",
  creating_private_source: "Creating the private source record",
  server_validation: "Checking the file on KLEIO’s server",
  extracting: "Reading the document structure and identifying career and practice information",
  review_ready: "Preparing updates for your review",
}

function bytes(value: number | null) {
  if (!value) return "Size unavailable"
  return value < 1024 * 1024 ? `${Math.round(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`
}

function typeLabel(value: ArtistSelectedDocumentType) {
  return ARTIST_DOCUMENT_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? "Artist document"
}

function statusTone(source: ArtistDocumentSource) {
  if (source.analysis_stage === "failed" || source.ocr_status === "failed") return "border-red-200 bg-red-50 text-red-800"
  if (source.ocr_status === "not_configured" || source.text_layer_status === "unavailable") return "border-amber-200 bg-amber-50 text-amber-900"
  if (source.analysis_stage === "review_ready" || source.analysis_stage === "review_completed") return "border-emerald-200 bg-emerald-50 text-emerald-800"
  return "border-[#D8D0F2] bg-[#F8F5FF] text-[#625C70]"
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

  async function choose(next: File | null) {
    setError("")
    setMessage("")
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
    try {
      const result = await uploadArtistDocument({
        file,
        selectedType,
        analyze,
        onStage: setStage,
      })
      const count = result.extraction?.proposalCount ?? 0
      const warning = result.extraction?.warnings.includes("ocr_required")
      setMessage(
        warning
          ? "The PDF is stored privately, but it does not contain an accessible text layer. OCR is not configured for this beta, so KLEIO did not invent extracted content."
          : analyze
            ? `${result.duplicate ? "The existing private document was reused." : "The document was uploaded privately."} ${count} reviewable update${count === 1 ? "" : "s"} prepared.`
            : "The PDF was stored privately without analysis.",
      )
      void trackKleioProductEvent(analyze ? "document_analysis_completed" : "document_upload_completed", {
        surface: "document_intelligence",
        metadata: {
          source: "device_document",
          status: warning ? "ocr_required" : analyze ? "review_ready" : "stored_only",
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
      setMessage(
        result.warnings.includes("ocr_required")
          ? "This source still requires OCR. The private PDF remains available, but KLEIO did not create unsupported text."
          : `${result.proposalCount} reviewable update${result.proposalCount === 1 ? "" : "s"} prepared.`,
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

  return (
    <div className="space-y-5">
      <section className={`${panel} overflow-hidden bg-[linear-gradient(135deg,#F8F5FF,#FFFFFF)] p-5 sm:p-7`} aria-labelledby="document-intelligence-title">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Creative Passport document intelligence</p>
            <h1 id="document-intelligence-title" className="mt-2 max-w-3xl font-serif text-3xl font-semibold tracking-[-0.04em] text-[#292631] sm:text-4xl">Upload CV or artist document</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#746E80]">KLEIO reads private PDF documents to prepare evidence-backed Passport suggestions. Nothing is published, shared with an institution, or added to an application automatically. You remain the final authority on your history, language, and work.</p>
          </div>
          <div className="rounded-2xl border border-[#D8D0F2] bg-white/85 p-4 text-xs leading-5 text-[#625C70]">
            <p className="flex items-center gap-2 font-semibold text-[#5B4B8A]"><LockKeyhole className="size-4" />Private by default</p>
            <p className="mt-2">PDF only · 15 MB maximum · 100 pages maximum.</p>
            <p className="mt-2">Native-text PDFs are analyzed. Image-only PDFs are preserved and marked OCR required; OCR is not configured in this beta.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
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
              <span><strong className="block text-[#292631]">Analyze after upload</strong>Prepare private Passport suggestions. Turn this off to store the source without analysis.</span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-[#E7E1F7] p-3 text-xs leading-5 text-[#625C70]">
              <input className="mt-1" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={Boolean(workingId)} />
              <span>I understand that KLEIO will keep this PDF private, prepare editable suggestions, and wait for my approval. Interpretations are not verified facts.</span>
            </label>
            <button type="button" className={`${primary} w-full`} disabled={!file || !consent || Boolean(workingId)} onClick={() => void submit()}>
              {workingId === "upload" ? <Loader2 className="size-4 animate-spin" /> : <FileSearch className="size-4" />}
              {analyze ? "Upload and analyze" : "Store privately"}
            </button>
          </div>
        </div>

        {stage && <div role="status" aria-live="polite" className="mt-4 flex items-center gap-3 rounded-xl border border-[#D8D0F2] bg-white px-4 py-3 text-sm font-semibold text-[#625C70]"><Loader2 className="size-4 animate-spin text-[#75639E]" />{STAGE_LABELS[stage]}</div>}
      </section>

      {(error || message) && <div role={error ? "alert" : "status"} aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || message}</div>}

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
          {documents.map((source) => (
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
                    {source.ocr_status === "not_configured" ? <AlertTriangle className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
                    {documentStageLabel(source)}
                  </span>
                  {source.ocr_status === "not_configured" && <p className="mt-3 max-w-2xl text-xs leading-5 text-amber-900">No accessible text layer was found. OCR is not configured, so KLEIO preserved the file and did not fabricate document content.</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={secondary} disabled={Boolean(workingId)} onClick={() => void preview(source)}><FileSearch className="size-4" />Private preview</button>
                  <button type="button" className={secondary} disabled={Boolean(workingId)} onClick={() => void reanalyze(source)}>{workingId === source.id ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}Analyze again</button>
                  {!source.keep_without_analysis && <button type="button" className={subtle} disabled={Boolean(workingId)} onClick={() => void stopAnalysis(source)}>Remove analysis</button>}
                  <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50" disabled={Boolean(workingId)} onClick={() => void removeSource(source)}><Trash2 className="size-4" />Delete source</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`${panel} p-5 sm:p-6`} aria-labelledby="patterns-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#75639E]">Cross-document correlation · Layer 3</p>
            <h2 id="patterns-title" className="mt-1 font-serif text-2xl font-semibold text-[#292631]">Patterns KLEIO noticed</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#746E80]">KLEIO compares source-backed proposals across your private documents. Repeated copied language is flagged as inheritance risk and never treated as independent proof.</p>
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
