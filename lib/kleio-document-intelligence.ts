import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import {
  requestSourceExtraction,
  updateSourceClassification,
  type SourceClassification,
} from "@/lib/kleio-upload-to-passport"
import { loadBetaImportAvailability } from "@/lib/kleio-import-source-availability"

export const ARTIST_DOCUMENT_TYPE_OPTIONS = [
  { value: "artist_cv", label: "Artist CV", canonical: "artist_cv" },
  { value: "biography", label: "Biography", canonical: "artist_biography" },
  { value: "artist_statement", label: "Artist statement", canonical: "artist_statement" },
  { value: "practice_description", label: "Practice description", canonical: "other_artist_material" },
  { value: "portfolio_document", label: "Portfolio document", canonical: "work_sample_list" },
  { value: "exhibition_history", label: "Exhibition history", canonical: "exhibition_documentation" },
  { value: "project_proposal", label: "Project proposal", canonical: "project_proposal" },
  { value: "grant_application", label: "Grant application", canonical: "project_proposal" },
  { value: "budget", label: "Budget", canonical: "project_budget" },
  { value: "press_publication", label: "Press or publication", canonical: "press_publication" },
  { value: "work_sample_list", label: "Work-sample list", canonical: "work_sample_list" },
  { value: "residency_material", label: "Residency material", canonical: "application_requirement_file" },
  { value: "reference_document", label: "Reference document", canonical: "reference_letter", sensitive: true },
  { value: "general_artist_material", label: "General artist material", canonical: "other_artist_material" },
  { value: "sensitive_eligibility_document", label: "Sensitive eligibility document", canonical: "proof_of_residency", sensitive: true },
  { value: "mixed_document", label: "Mixed document", canonical: "other_artist_material" },
  { value: "unknown", label: "Not sure yet", canonical: "needs_artist_classification" },
] as const

export type ArtistSelectedDocumentType = (typeof ARTIST_DOCUMENT_TYPE_OPTIONS)[number]["value"]

export type ArtistDocumentSource = {
  id: string
  artist_user_id: string
  source_type: string
  label: string
  storage_path: string
  mime_type: string
  byte_size: number | null
  checksum: string
  extraction_status: string
  classification: SourceClassification
  classification_confidence: number | null
  classification_reason: string
  privacy_level: "private" | "application_only" | "restricted"
  sensitivity: "standard" | "sensitive" | "highly_sensitive"
  document_version: number
  is_current_version: boolean
  artist_selected_document_type: ArtistSelectedDocumentType
  analysis_stage: string
  text_layer_status: "unknown" | "available" | "partial" | "unavailable"
  ocr_status: "not_required" | "required" | "not_configured" | "processing" | "completed" | "failed"
  page_count: number | null
  analysis_consent_at: string | null
  analysis_deleted_at: string | null
  keep_without_analysis: boolean
  original_filename: string | null
  source_metadata: Record<string, unknown>
  review_summary: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ArtistDocumentCorrelation = {
  id: string
  correlation_type: string
  analysis_layer: 3 | 4 | 5
  title: string
  summary: string
  related_passport_field: string
  supporting_evidence: Array<Record<string, unknown>>
  supporting_source_count: number
  confidence_state: string
  inheritance_risk: boolean
  status: "proposed" | "confirmed_useful_language" | "dismissed" | "inaccurate" | "deferred"
  artist_edited_text: string
  artist_feedback: string
  model_provider: string
  model_name: string
  analysis_version: string
  decided_at: string | null
  created_at: string
  updated_at: string
}

export type DocumentUploadResult = {
  source: ArtistDocumentSource
  duplicate: boolean
  extraction: {
    sourceId: string
    jobId: string
    proposalCount: number
    extractionStatus: string
    classification: SourceClassification
    classificationConfidence: number
    documentVersion: number
    warnings: string[]
  } | null
}

export type DocumentUploadStage =
  | "validating"
  | "checking_availability"
  | "checking_duplicate"
  | "uploading"
  | "creating_private_source"
  | "server_validation"
  | "extracting"
  | "review_ready"

const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024

function selectedTypeOption(value: ArtistSelectedDocumentType) {
  return ARTIST_DOCUMENT_TYPE_OPTIONS.find((option) => option.value === value)
    ?? ARTIST_DOCUMENT_TYPE_OPTIONS.at(-1)!
}

export function canonicalClassificationFor(value: ArtistSelectedDocumentType): SourceClassification {
  return selectedTypeOption(value).canonical
}

function safeFilename(value: string) {
  const normalized = value.normalize("NFKD").replace(/[^\w.\- ]+/g, "").trim()
  return normalized.replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 110) || `artist-document-${crypto.randomUUID()}.pdf`
}

async function requireArtist() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in before uploading an artist document.")
  if (account.profile.role !== "artist") throw new Error("Document intelligence is available only in an artist workspace.")
  return account
}

async function checksum(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer())
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("")
}

export async function validateArtistPdf(file: File) {
  if (file.type !== "application/pdf") throw new Error("Choose a PDF document.")
  if (file.size <= 0) throw new Error("The selected PDF is empty or unavailable.")
  if (file.size > MAX_DOCUMENT_BYTES) throw new Error("PDF documents must be 15 MB or smaller.")
  const signature = new TextDecoder().decode(new Uint8Array(await file.slice(0, 5).arrayBuffer()))
  if (signature !== "%PDF-") throw new Error("The selected file does not have a valid PDF signature.")
}

async function validateStoredArtistDocument(sourceId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("validate-artist-document", {
    body: { sourceId },
  })
  if (error) throw new Error("KLEIO could not complete the server-side document safety check.")
  if (data?.error) {
    const code = String(data.error)
    if (code === "password_protected_pdf") throw new Error("This PDF appears to be password protected. Upload an unlocked copy.")
    if (code === "too_many_pages") throw new Error("This beta accepts PDF documents with 100 pages or fewer.")
    if (code === "invalid_pdf_signature") throw new Error("The stored file does not have a valid PDF signature.")
    if (code === "corrupt_or_unsupported_pdf") throw new Error("This PDF appears corrupt or unsupported.")
    if (code === "file_too_large") throw new Error("PDF documents must be 15 MB or smaller.")
    throw new Error("The document did not pass KLEIO’s server-side file check.")
  }
  return data as {
    sourceId: string
    pageCount: number
    checksum: string
    textLayerStatus: "available" | "partial" | "unavailable"
    ocrRequired: boolean
    malwareScannerConfigured: boolean
  }
}

function normalizeSource(row: Record<string, unknown>) {
  return {
    ...row,
    source_metadata: row.source_metadata && typeof row.source_metadata === "object" && !Array.isArray(row.source_metadata) ? row.source_metadata : {},
    review_summary: row.review_summary && typeof row.review_summary === "object" && !Array.isArray(row.review_summary) ? row.review_summary : {},
  } as ArtistDocumentSource
}

export async function uploadArtistDocument(input: {
  file: File
  selectedType: ArtistSelectedDocumentType
  analyze?: boolean
  onStage?: (stage: DocumentUploadStage) => void
}): Promise<DocumentUploadResult> {
  input.onStage?.("validating")
  await validateArtistPdf(input.file)
  input.onStage?.("checking_availability")
  const [account, availability] = await Promise.all([requireArtist(), loadBetaImportAvailability()])
  if (!availability.device_document || !availability.pdf) {
    throw new Error("Direct PDF analysis is not enabled for this beta workspace.")
  }

  const supabase = getSupabaseBrowserClient()
  input.onStage?.("checking_duplicate")
  const fileChecksum = await checksum(input.file)
  const { data: existing, error: existingError } = await supabase
    .from("artist_import_sources")
    .select("*")
    .eq("artist_user_id", account.user.id)
    .eq("checksum", fileChecksum)
    .is("deleted_at", null)
    .maybeSingle()
  if (existingError) throw existingError

  const canonical = canonicalClassificationFor(input.selectedType)
  if (existing?.id) {
    const { data: updated, error: updateError } = await supabase
      .from("artist_import_sources")
      .update({
        artist_selected_document_type: input.selectedType,
        analysis_consent_at: input.analyze === false ? null : new Date().toISOString(),
        keep_without_analysis: input.analyze === false,
        classification: canonical,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("artist_user_id", account.user.id)
      .select("*")
      .single()
    if (updateError) throw updateError

    if (input.analyze !== false) {
      input.onStage?.("server_validation")
      await validateStoredArtistDocument(String(existing.id))
      input.onStage?.("extracting")
    }
    const extraction = input.analyze === false ? null : await requestSourceExtraction(String(existing.id), canonical)
    input.onStage?.("review_ready")
    return { source: normalizeSource(updated as Record<string, unknown>), duplicate: true, extraction }
  }

  input.onStage?.("uploading")
  const storagePath = `${account.user.id}/documents/${crypto.randomUUID()}-${safeFilename(input.file.name)}`
  const { error: uploadError } = await supabase.storage.from("artist-documents").upload(storagePath, input.file, {
    cacheControl: "3600",
    contentType: "application/pdf",
    upsert: false,
  })
  if (uploadError) throw new Error("KLEIO could not store this document privately. Please try again.")

  input.onStage?.("creating_private_source")
  const now = new Date().toISOString()
  const selected = selectedTypeOption(input.selectedType)
  const sensitivity = selected.sensitive ? "sensitive" : "standard"
  const { data: inserted, error: insertError } = await supabase
    .from("artist_import_sources")
    .insert({
      artist_user_id: account.user.id,
      source_type: "device_document",
      label: input.file.name,
      storage_path: storagePath,
      mime_type: "application/pdf",
      byte_size: input.file.size,
      checksum: fileChecksum,
      extraction_status: input.analyze === false ? "pending" : "queued",
      extraction_method: "direct_pdf_beta_v1",
      original_filename: input.file.name,
      source_metadata: {
        storage_bucket: "artist-documents",
        import_context: "creative_passport",
        destination_type: "creative_passport",
        artist_selected_document_type: input.selectedType,
        upload_signature_checked: true,
        server_revalidation_required: true,
      },
      media_kind: "document",
      library_status: "available",
      classification: canonical,
      classification_confidence: 1,
      classification_reason: "Artist selected this document category before analysis.",
      privacy_level: selected.sensitive ? "restricted" : "private",
      sensitivity,
      artist_selected_document_type: input.selectedType,
      analysis_stage: input.analyze === false ? "stopped" : "checking_file",
      analysis_consent_at: input.analyze === false ? null : now,
      keep_without_analysis: input.analyze === false,
    })
    .select("*")
    .single()

  if (insertError || !inserted) {
    await supabase.storage.from("artist-documents").remove([storagePath])
    throw new Error("The document was uploaded but its private source record could not be created.")
  }

  try {
    if (input.analyze !== false) {
      input.onStage?.("server_validation")
      await validateStoredArtistDocument(String(inserted.id))
      input.onStage?.("extracting")
    }
    const extraction = input.analyze === false ? null : await requestSourceExtraction(String(inserted.id), canonical)
    input.onStage?.("review_ready")
    const { data: refreshed } = await supabase
      .from("artist_import_sources")
      .select("*")
      .eq("id", inserted.id)
      .eq("artist_user_id", account.user.id)
      .single()
    return {
      source: normalizeSource((refreshed ?? inserted) as Record<string, unknown>),
      duplicate: false,
      extraction,
    }
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "KLEIO could not analyze this document."
    throw new Error(`${message} The original PDF remains private in your KLEIO Library.`)
  }
}

export async function loadArtistDocuments(): Promise<ArtistDocumentSource[]> {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("artist_import_sources")
    .select("*")
    .eq("artist_user_id", account.user.id)
    .eq("media_kind", "document")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => normalizeSource(row as Record<string, unknown>))
}

export async function createArtistDocumentPreview(source: ArtistDocumentSource) {
  const account = await requireArtist()
  if (source.artist_user_id !== account.user.id) throw new Error("This document does not belong to the active artist.")
  const bucket = source.source_metadata.storage_bucket === "artist-documents" || source.source_type === "device_document"
    ? "artist-documents"
    : "artist-assets"
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(source.storage_path, 600)
  if (error || !data?.signedUrl) throw new Error("A private preview could not be created.")
  return { url: data.signedUrl, expiresInSeconds: 600 }
}

export async function correctArtistDocumentType(sourceId: string, selectedType: ArtistSelectedDocumentType) {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const canonical = canonicalClassificationFor(selectedType)
  const option = selectedTypeOption(selectedType)
  const { error } = await supabase
    .from("artist_import_sources")
    .update({
      artist_selected_document_type: selectedType,
      sensitivity: option.sensitive ? "sensitive" : "standard",
      privacy_level: option.sensitive ? "restricted" : "private",
      keep_without_analysis: false,
      analysis_consent_at: new Date().toISOString(),
      analysis_deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sourceId)
    .eq("artist_user_id", account.user.id)
  if (error) throw error
  return updateSourceClassification(sourceId, canonical)
}

export async function reanalyzeArtistDocument(sourceId: string, selectedType: ArtistSelectedDocumentType) {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const canonical = canonicalClassificationFor(selectedType)
  const { error } = await supabase
    .from("artist_import_sources")
    .update({
      artist_selected_document_type: selectedType,
      keep_without_analysis: false,
      analysis_consent_at: new Date().toISOString(),
      analysis_deleted_at: null,
      extraction_status: "queued",
      analysis_stage: "checking_file",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sourceId)
    .eq("artist_user_id", account.user.id)
  if (error) throw error
  await validateStoredArtistDocument(sourceId)
  return requestSourceExtraction(sourceId, canonical)
}

export async function keepDocumentWithoutAnalysis(sourceId: string) {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const now = new Date().toISOString()
  const [{ error: proposalError }, { error: jobError }] = await Promise.all([
    supabase
      .from("artist_import_proposals")
      .delete()
      .eq("source_id", sourceId)
      .eq("artist_user_id", account.user.id)
      .in("status", ["proposed", "needs_clarification", "conflicting", "deferred", "source_unavailable", "extraction_failed"]),
    supabase
      .from("artist_extraction_jobs")
      .update({ status: "dismissed", updated_at: now })
      .eq("source_id", sourceId)
      .eq("artist_user_id", account.user.id)
      .in("status", ["queued", "processing", "ready_for_review", "partially_extracted", "failed", "needs_artist_classification"]),
  ])
  if (proposalError) throw proposalError
  if (jobError) throw jobError
  const { error } = await supabase
    .from("artist_import_sources")
    .update({
      keep_without_analysis: true,
      analysis_stage: "stopped",
      analysis_deleted_at: now,
      review_summary: {
        analysis_removed_by_artist: true,
        original_source_preserved: true,
      },
      updated_at: now,
    })
    .eq("id", sourceId)
    .eq("artist_user_id", account.user.id)
  if (error) throw error
}

export async function inspectArtistDocumentDependencies(sourceId: string) {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const [records, attachments, usages] = await Promise.all([
    supabase
      .from("artist_passport_records")
      .select("id", { count: "exact", head: true })
      .eq("artist_user_id", account.user.id)
      .eq("source_id", sourceId)
      .neq("status", "removed"),
    supabase
      .from("application_requirement_attachments")
      .select("id", { count: "exact", head: true })
      .eq("artist_user_id", account.user.id)
      .eq("source_id", sourceId),
    supabase
      .from("artist_media_usages")
      .select("id", { count: "exact", head: true })
      .eq("artist_user_id", account.user.id)
      .eq("source_id", sourceId),
  ])
  if (records.error) throw records.error
  if (attachments.error) throw attachments.error
  if (usages.error) throw usages.error
  return {
    confirmedPassportRecords: records.count ?? 0,
    applicationAttachments: attachments.count ?? 0,
    recordedUsages: usages.count ?? 0,
  }
}

export async function deleteArtistDocumentSource(source: ArtistDocumentSource) {
  const account = await requireArtist()
  const dependencies = await inspectArtistDocumentDependencies(source.id)
  if (dependencies.applicationAttachments > 0) {
    throw new Error("This document is preserved in an application record and cannot be deleted. Remove it from the application workflow first.")
  }
  if (dependencies.confirmedPassportRecords > 0) {
    throw new Error("Confirmed Passport records still reference this document. Remove or replace those records before deleting the source.")
  }

  const supabase = getSupabaseBrowserClient()
  const bucket = source.source_metadata.storage_bucket === "artist-documents" || source.source_type === "device_document"
    ? "artist-documents"
    : "artist-assets"
  const { error: removeError } = await supabase.storage.from(bucket).remove([source.storage_path])
  if (removeError) throw new Error("The private file could not be deleted.")

  const { error } = await supabase
    .from("artist_import_sources")
    .update({
      deleted_at: new Date().toISOString(),
      library_status: "archived",
      analysis_stage: "stopped",
      updated_at: new Date().toISOString(),
    })
    .eq("id", source.id)
    .eq("artist_user_id", account.user.id)
  if (error) throw error
}

export async function refreshArtistDocumentCorrelations() {
  await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("refresh_my_document_correlations")
  if (error) throw error
  return data as {
    correlations_created: number
    artist_confirmation_required: boolean
    interpretations_are_not_facts: boolean
  }
}

export async function loadArtistDocumentCorrelations(): Promise<ArtistDocumentCorrelation[]> {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("artist_document_correlations")
    .select("*")
    .eq("artist_user_id", account.user.id)
    .order("updated_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as ArtistDocumentCorrelation[]
}

export async function decideArtistDocumentCorrelation(input: {
  id: string
  status: ArtistDocumentCorrelation["status"]
  editedText?: string
  feedback?: string
}) {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("artist_document_correlations")
    .update({
      status: input.status,
      artist_edited_text: input.editedText?.trim() || "",
      artist_feedback: input.feedback?.trim() || "",
      decided_at: input.status === "deferred" ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("artist_user_id", account.user.id)
  if (error) throw error
}

export function documentStageLabel(source: ArtistDocumentSource) {
  if (source.keep_without_analysis) return "Stored privately without analysis"
  if (source.ocr_status === "not_configured" || source.text_layer_status === "unavailable") return "OCR required"
  if (source.analysis_stage === "checking_file") return "Checking the file"
  if (source.analysis_stage === "reading_structure") return "Reading the document structure"
  if (source.analysis_stage === "identifying_information") return "Identifying career and practice information"
  if (source.analysis_stage === "comparing_passport") return "Comparing findings with your Creative Passport"
  if (source.analysis_stage === "preparing_review") return "Preparing updates for your review"
  if (source.analysis_stage === "review_ready") return "Updates ready for review"
  if (source.analysis_stage === "review_completed") return "Artist review completed"
  if (source.analysis_stage === "failed") return "Analysis needs attention"
  return "Private document stored"
}

export function confidenceStateLabel(value: string) {
  if (value === "high") return "High confidence"
  if (value === "moderate") return "Moderate confidence"
  if (value === "low") return "Low confidence"
  if (value === "conflicting_evidence") return "Conflicting evidence"
  if (value === "insufficient_evidence") return "Insufficient evidence"
  return "Artist confirmation required"
}
