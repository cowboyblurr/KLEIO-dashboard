"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, FileSearch, FileText, Loader2, LockKeyhole, ShieldCheck, UploadCloud } from "lucide-react"
import {
  ARTIST_DOCUMENT_TYPE_OPTIONS,
  loadArtistDocuments,
  uploadArtistDocument,
  type ArtistDocumentSource,
  type ArtistSelectedDocumentType,
  type DocumentUploadStage,
} from "@/lib/kleio-document-intelligence"

const panel = "rounded-[24px] border border-[#E2DCF1] bg-white shadow-[0_18px_52px_rgba(82,64,130,0.06)]"
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const field = "min-h-11 rounded-xl border border-[#DED7EF] bg-white px-3 py-2 text-sm text-[#292631] outline-none transition focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12"

const TYPE_LABELS: Record<ArtistSelectedDocumentType, string> = {
  artist_cv: "CV artístico",
  biography: "Biografía",
  artist_statement: "Declaración artística",
  practice_description: "Descripción de la práctica",
  portfolio_document: "Documento de portafolio",
  exhibition_history: "Historial de exposiciones",
  project_proposal: "Propuesta de proyecto",
  grant_application: "Solicitud de beca",
  budget: "Presupuesto",
  press_publication: "Prensa o publicación",
  work_sample_list: "Lista de muestras de obra",
  residency_material: "Material para residencia",
  reference_document: "Documento de referencia",
  general_artist_material: "Material artístico general",
  sensitive_eligibility_document: "Documento confidencial de elegibilidad",
  mixed_document: "Documento mixto",
  unknown: "Aún no estoy seguro",
}

const STAGE_LABELS: Record<DocumentUploadStage, string> = {
  validating: "Comprobando el archivo seleccionado",
  checking_availability: "Confirmando la ruta privada de carga",
  checking_duplicate: "Buscando una copia privada existente",
  uploading: "Subiendo el PDF de forma privada",
  creating_private_source: "Creando el registro privado del documento",
  server_validation: "Verificando seguridad, páginas e integridad",
  extracting: "Analizando la estructura y la información respaldada por el PDF",
  review_ready: "Preparando sugerencias para tu revisión",
}

function statusLabel(source: ArtistDocumentSource) {
  if (source.analysis_stage === "review_ready" || source.analysis_stage === "review_completed") return "Listo para revisión"
  if (source.analysis_stage === "failed" || source.extraction_status === "failed") return "El análisis necesita atención"
  if (source.keep_without_analysis) return "Guardado sin análisis"
  if (source.analysis_stage === "analyzing" || source.extraction_status === "processing") return "Analizando"
  return "Guardado de forma privada"
}

function statusTone(source: ArtistDocumentSource) {
  if (source.analysis_stage === "review_ready" || source.analysis_stage === "review_completed") return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (source.analysis_stage === "failed" || source.extraction_status === "failed") return "border-red-200 bg-red-50 text-red-800"
  return "border-[#D8D0F2] bg-[#F8F5FF] text-[#625C70]"
}

function readableDate(value: string) {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export function ArtistDocumentIntelligenceSpanish() {
  const [documents, setDocuments] = useState<ArtistDocumentSource[]>([])
  const [selectedType, setSelectedType] = useState<ArtistSelectedDocumentType>("artist_cv")
  const [file, setFile] = useState<File | null>(null)
  const [stage, setStage] = useState<DocumentUploadStage | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  async function refresh() {
    setLoading(true)
    try {
      setDocuments(await loadArtistDocuments())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible cargar tus documentos.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  const recentDocuments = useMemo(() => documents.slice(0, 6), [documents])

  async function analyze() {
    if (!file) {
      setError("Selecciona un PDF antes de continuar.")
      return
    }
    setWorking(true)
    setError("")
    setNotice("")
    try {
      const result = await uploadArtistDocument({
        file,
        selectedType,
        analyze: true,
        onStage: setStage,
      })
      setNotice(result.duplicate
        ? "KLEIO encontró la copia privada existente y actualizó su análisis sin duplicar el archivo."
        : "El documento quedó guardado de forma privada. Las sugerencias están listas para que las revises.")
      setFile(null)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible analizar este documento.")
    } finally {
      setWorking(false)
      setStage(null)
    }
  }

  return (
    <div className="space-y-5" lang="es">
      <section className={`${panel} p-5 sm:p-6`} aria-labelledby="spanish-document-upload-title">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Análisis privado de documentos</p>
            <h2 id="spanish-document-upload-title" className="mt-2 font-serif text-2xl font-semibold tracking-[-0.03em] text-[#292631]">Analiza tu CV sin perder el control de tu perfil</h2>
            <p className="mt-2 text-sm leading-6 text-[#746E80]">KLEIO busca información respaldada por el documento y la convierte en sugerencias editables. Nada se añade al Pasaporte Creativo hasta que tú lo apruebes.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#F7F4FF] px-3 py-1.5 text-xs font-semibold text-[#625C70]"><LockKeyhole className="size-3.5 text-[#6A5896]" />Documento privado</span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]">
            <span>Tipo de documento</span>
            <select className={field} value={selectedType} disabled={working} onChange={(event) => setSelectedType(event.target.value as ArtistSelectedDocumentType)}>
              {ARTIST_DOCUMENT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{TYPE_LABELS[option.value]}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]">
            <span>Archivo PDF</span>
            <input
              className={`${field} file:mr-3 file:rounded-lg file:border-0 file:bg-[#F0EAFB] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#5B4B8A]`}
              type="file"
              accept="application/pdf"
              disabled={working}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className={primary} disabled={working || !file} onClick={() => void analyze()}>
            {working ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
            {working ? "Analizando…" : "Analizar y preparar sugerencias"}
          </button>
          <p className="text-xs leading-5 text-[#8A8296]">PDF de hasta 15 MB y 100 páginas. El original permanece privado.</p>
        </div>

        {working && stage && <div role="status" aria-live="polite" className="mt-4 flex items-center gap-3 rounded-2xl border border-[#D8D0F2] bg-[#F8F5FF] p-4 text-sm font-semibold text-[#625C70]"><Loader2 className="size-4 animate-spin text-[#5B4B8A]" />{STAGE_LABELS[stage]}</div>}
        {notice && <div role="status" className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />{notice}</div>}
        {error && <div role="alert" className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}</div>}
      </section>

      <section className={`${panel} p-5 sm:p-6`} aria-labelledby="confidence-explanation-title">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F0EAFB] text-[#5B4B8A]"><ShieldCheck className="size-4" /></span>
          <div>
            <h2 id="confidence-explanation-title" className="font-serif text-xl font-semibold text-[#292631]">Cómo decide KLEIO qué sugerir</h2>
            <p className="mt-1 text-sm leading-6 text-[#746E80]">La confianza no significa que KLEIO tenga la última palabra. Indica cuánta evidencia clara encontró en el PDF.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-semibold text-emerald-900">Claramente respaldado</p><p className="mt-1 text-xs leading-5 text-emerald-800">La información aparece de forma explícita, con una página o fragmento identificable y sin conflicto con el perfil.</p></article>
          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">Necesita revisión</p><p className="mt-1 text-xs leading-5 text-amber-800">La información puede ser correcta, pero está incompleta, es ambigua o necesita contexto del artista.</p></article>
          <article className="rounded-2xl border border-[#D8D0F2] bg-[#F8F5FF] p-4"><p className="text-sm font-semibold text-[#4F407B]">Coincidencia o duplicado</p><p className="mt-1 text-xs leading-5 text-[#625C70]">KLEIO compara la sugerencia con el perfil existente y no debe añadirla otra vez sin que el artista elija cómo resolverla.</p></article>
        </div>
        <p className="mt-4 rounded-2xl border border-[#E7E1F7] bg-white p-4 text-xs leading-5 text-[#746E80]"><strong className="text-[#292631]">Idioma del perfil:</strong> los botones e instrucciones siguen el idioma del espacio de trabajo. El texto escrito por el artista permanece en su idioma original. KLEIO no lo traduce ni reemplaza automáticamente.</p>
      </section>

      <section className={`${panel} p-5 sm:p-6`} aria-labelledby="recent-documents-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Biblioteca privada</p><h2 id="recent-documents-title" className="mt-1 font-serif text-xl font-semibold text-[#292631]">Documentos recientes</h2></div>
          <Link href="/artist-dashboard/passport/review/" className={secondary}><FileSearch className="size-4" />Revisar sugerencias</Link>
        </div>

        {loading && <div role="status" className="mt-4 flex items-center gap-2 text-sm text-[#746E80]"><Loader2 className="size-4 animate-spin" />Cargando documentos…</div>}
        {!loading && recentDocuments.length === 0 && <div className="mt-4 rounded-2xl border border-dashed border-[#D8D0F2] bg-[#FCFBFE] p-6 text-center"><FileText className="mx-auto size-6 text-[#75639E]" /><p className="mt-2 text-sm font-semibold text-[#292631]">Aún no hay documentos</p><p className="mt-1 text-xs leading-5 text-[#746E80]">Sube un CV arriba para comenzar.</p></div>}

        {!loading && recentDocuments.length > 0 && <div className="mt-4 grid gap-3 md:grid-cols-2">
          {recentDocuments.map((source) => {
            const summary = source.review_summary ?? {}
            const supported = Number(summary.claim_count ?? 0)
            const duplicates = Number(summary.duplicate_count ?? 0)
            const conflicts = Number(summary.conflict_count ?? 0)
            return <article key={source.id} className="rounded-2xl border border-[#E7E1F7] bg-[#FCFBFE] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-[#292631]">{source.original_filename || source.label}</p><p className="mt-1 text-xs text-[#8A8296]">{TYPE_LABELS[source.artist_selected_document_type] ?? "Documento artístico"} · {readableDate(source.updated_at)}</p></div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.64rem] font-semibold ${statusTone(source)}`}>{statusLabel(source)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#625C70]"><span className="rounded-full bg-white px-2.5 py-1">{supported} sugerencias</span>{duplicates > 0 && <span className="rounded-full bg-white px-2.5 py-1">{duplicates} coincidencias</span>}{conflicts > 0 && <span className="rounded-full bg-white px-2.5 py-1">{conflicts} por resolver</span>}</div>
            </article>
          })}
        </div>}
      </section>
    </div>
  )
}
