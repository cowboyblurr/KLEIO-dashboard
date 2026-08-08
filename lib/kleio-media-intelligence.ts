import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import { requestMediaExtraction } from "@/lib/kleio-upload-to-passport"
import { parseDocumentProfileSynthesis, retryDocumentProfileSynthesis, synthesizeDocumentProfile } from "@/lib/kleio-document-profile-synthesis"
import type { ArtistMediaLibraryItem, MediaKind } from "@/lib/kleio-universal-media"

export const KLEIO_ANALYZABLE_MEDIA_MIME_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif",
  "video/mp4", "video/quicktime", "video/webm", "video/x-ms-wmv", "video/x-ms-asf", "application/vnd.ms-asf",
  "audio/mpeg", "audio/mp3", "audio/mp4", "audio/wav", "audio/x-wav", "audio/ogg",
  "application/pdf",
] as const

export type MediaIntelligence = {
  sourceId: string
  mediaKind: MediaKind
  provider: string
  model: string
  analyzedAt: string
  summary: string
  suggestedTitle: string
  suggestedDescription: string
  bioDraft: string
  artistStatementDraft: string
  practiceDescriptionDraft: string
  mediumsMaterials: string[]
  disciplines: string[]
  themesConcepts: string[]
  formalQualities: string[]
  technicalObservations: string[]
  presentationNotes: string[]
  accessibilityDescription: string
  applicationKeywords: string[]
  factualObservations: string[]
  interpretiveObservations: string[]
  uncertainties: string[]
  limitations: string[]
  confidence: number | null
  proposalCount: number
  analysisQuality: string
  isDocumentAnalysis: boolean
  profileSynthesisReady: boolean
  pipelineStatus: "READY_FOR_REVIEW" | "PARTIALLY_READY" | "SOURCE_ONLY" | "REVIEW_READY"
  pipelineMessage: string
  draftedFieldCount: number
  needsInputCount: number
  repairedFieldCount: number
  retryFieldsRemaining: string[]
}

export type MediaIntelligenceStatus = "ready" | "available" | "failed" | "unsupported" | "legacy"

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
function text(value: unknown) { return typeof value === "string" ? value.trim() : "" }
function strings(value: unknown) { return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim())).map((entry) => entry.trim()) : [] }
function unique(values: string[]) { return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))) }
function kind(mimeType: string): MediaKind {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/") || mimeType === "application/vnd.ms-asf") return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  return "document"
}

function fromMedia(sourceId: string, mimeType: string, raw: Record<string, unknown>): MediaIntelligence {
  return {
    sourceId,
    mediaKind: kind(mimeType),
    provider: text(raw.provider),
    model: text(raw.model),
    analyzedAt: text(raw.analyzed_at),
    summary: text(raw.summary),
    suggestedTitle: text(raw.suggested_title),
    suggestedDescription: text(raw.suggested_description),
    bioDraft: "",
    artistStatementDraft: "",
    practiceDescriptionDraft: "",
    mediumsMaterials: strings(raw.mediums_materials),
    disciplines: strings(raw.disciplines),
    themesConcepts: strings(raw.themes_concepts),
    formalQualities: strings(raw.formal_qualities),
    technicalObservations: strings(raw.technical_observations),
    presentationNotes: strings(raw.presentation_notes),
    accessibilityDescription: text(raw.accessibility_description),
    applicationKeywords: strings(raw.application_keywords),
    factualObservations: strings(raw.factual_observations),
    interpretiveObservations: strings(raw.interpretive_observations),
    uncertainties: strings(raw.uncertainties),
    limitations: strings(raw.limitations),
    confidence: Number.isFinite(Number(raw.confidence)) ? Number(raw.confidence) : null,
    proposalCount: 0,
    analysisQuality: "review_ready",
    isDocumentAnalysis: false,
    profileSynthesisReady: false,
    pipelineStatus: "REVIEW_READY",
    pipelineMessage: "",
    draftedFieldCount: 0,
    needsInputCount: 0,
    repairedFieldCount: 0,
    retryFieldsRemaining: [],
  }
}

function fromDocument(sourceId: string, mimeType: string, raw: Record<string, unknown>): MediaIntelligence {
  const summary = object(raw.analysis_summary)
  const assessment = object(raw.document_assessment)
  const grouped = object(raw.grouped_counts)
  const claims = Array.isArray(raw.representative_claims) ? raw.representative_claims.map(object) : []
  const needsReview = strings(summary.what_needs_review)
  const synthesis = parseDocumentProfileSynthesis(raw.profile_synthesis)
  const values = (items: { value: string }[] | undefined) => (items ?? []).map((item) => item.value)
  const career = unique([
    ...values(synthesis?.career_highlights),
    ...values(synthesis?.education),
    ...values(synthesis?.exhibitions),
    ...values(synthesis?.awards),
    ...values(synthesis?.residencies),
    ...values(synthesis?.representation),
    ...values(synthesis?.portfolio_projects),
    ...values(synthesis?.artworks),
  ])
  const keywords = unique([
    ...values(synthesis?.application_keywords),
    ...values(synthesis?.disciplines),
    ...values(synthesis?.mediums),
    ...values(synthesis?.themes),
    ...values(synthesis?.skills),
    ...Object.keys(grouped).map((value) => value.replaceAll("_", " ")),
  ])
  const synopsis = text(summary.document_synopsis) || text(raw.coverage_explanation) || strings(summary.what_was_found).join(" ")
  const bioDraft = synthesis?.bio.text || ""
  const artistStatementDraft = synthesis?.artist_statement.text || ""
  const practiceDescriptionDraft = synthesis?.practice_description.text || ""
  const qa = synthesis?.qa
  const pipelineStatus = synthesis ? (qa?.status === "PARTIALLY_READY" ? "PARTIALLY_READY" : "READY_FOR_REVIEW") : "SOURCE_ONLY"
  const pipelineMessage = pipelineStatus === "PARTIALLY_READY"
    ? "Media Assist prepared usable Passport suggestions, but some supported fields still need another pass or your input."
    : pipelineStatus === "SOURCE_ONLY"
      ? "The source notes are ready, but Passport drafting did not complete. Your source notes remain saved."
      : ""
  return {
    sourceId,
    mediaKind: kind(mimeType),
    provider: synthesis?.provider || text(raw.provider),
    model: synthesis?.model || text(raw.model),
    analyzedAt: synthesis?.generated_at || text(raw.updated_at),
    summary: bioDraft || synopsis,
    suggestedTitle: synthesis?.professional_name?.value || "",
    suggestedDescription: practiceDescriptionDraft || synopsis,
    bioDraft,
    artistStatementDraft,
    practiceDescriptionDraft,
    mediumsMaterials: values(synthesis?.mediums),
    disciplines: values(synthesis?.disciplines),
    themesConcepts: values(synthesis?.themes),
    formalQualities: values(synthesis?.visual_language),
    technicalObservations: unique([...values(synthesis?.skills), ...career, ...strings(summary.what_was_found)]),
    presentationNotes: unique([...values(synthesis?.education), ...values(synthesis?.exhibitions), ...values(synthesis?.awards), ...values(synthesis?.residencies), ...strings(summary.recommended_use)]),
    accessibilityDescription: "",
    applicationKeywords: keywords,
    factualObservations: career.length ? career : claims.map((claim) => text(claim.display_value)).filter(Boolean),
    interpretiveObservations: unique([artistStatementDraft, ...values(synthesis?.themes), ...values(synthesis?.visual_language)]),
    uncertainties: unique([...(synthesis?.missing_context ?? []), ...(qa?.needs_input_fields ?? []).map((field) => `${field.replaceAll("_", " ")}: needs your input`), ...needsReview]),
    limitations: unique([...strings(assessment.analysis_limitations), ...(qa?.retry_fields_remaining ?? []).map((field) => `${field.replaceAll("_", " ")}: supported detail found but drafting is still incomplete`), ...needsReview]),
    confidence: Number.isFinite(Number(raw.analysis_score)) ? Number(raw.analysis_score) : null,
    proposalCount: Number(raw.claim_count || 0),
    analysisQuality: text(raw.analysis_quality),
    isDocumentAnalysis: true,
    profileSynthesisReady: Boolean(synthesis),
    pipelineStatus,
    pipelineMessage,
    draftedFieldCount: qa?.drafted_fields.length ?? 0,
    needsInputCount: qa?.needs_input_fields.length ?? 0,
    repairedFieldCount: qa?.repaired_fields.length ?? 0,
    retryFieldsRemaining: qa?.retry_fields_remaining ?? [],
  }
}

export function canAnalyzeMediaItem(item: ArtistMediaLibraryItem) {
  return Boolean(item.sourceId) && (KLEIO_ANALYZABLE_MEDIA_MIME_TYPES as readonly string[]).includes(item.mimeType)
}

export function mediaIntelligenceSupportText(item: ArtistMediaLibraryItem) {
  if (!item.sourceId) return "This older portfolio item needs to be re-added to the private Media Library before Media Assist can use it."
  if (canAnalyzeMediaItem(item)) return item.mimeType === "application/pdf"
    ? "Media Assist can privately read this PDF, organize source-supported Creative Passport drafts, check for useful details that may have been missed, and send editable suggestions into your review queue without changing your approved Passport."
    : "Media Assist can privately organize visible/source details, possible metadata, and editable language from this media. It does not score the work or decide what it means."
  if (item.mediaKind === "document") return "This file can stay in KLEIO, but Media Assist is unavailable for this document format."
  return "This media can stay in KLEIO, but Media Assist is unavailable for this format."
}

async function requireArtist() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  if (account.profile.role !== "artist") throw new Error("Media Assist is available only in an artist workspace.")
  return account
}

async function consent(sourceId: string) {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("artist_import_sources").update({ analysis_consent_at: new Date().toISOString(), keep_without_analysis: false, updated_at: new Date().toISOString() }).eq("id", sourceId).eq("artist_user_id", account.user.id)
  if (error) throw error
}

async function claimMediaAnalysis(sourceId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("claim_my_media_analysis", { target_source_id: sourceId })
  if (error) throw error
  if (data !== true) throw new Error("Media Assist is already preparing this source. Reopen it in a moment instead of starting a duplicate pass.")
}

async function releaseMediaAnalysis(sourceId: string) {
  const supabase = getSupabaseBrowserClient()
  await supabase.rpc("release_my_media_analysis", { target_source_id: sourceId })
}

export async function loadMediaIntelligence(sourceId: string): Promise<MediaIntelligence | null> {
  if (!sourceId) return null
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("artist_import_sources").select("id,mime_type,review_summary,updated_at").eq("id", sourceId).eq("artist_user_id", account.user.id).is("deleted_at", null).maybeSingle()
  if (error) throw error
  if (!data) return null
  const summary = object(data.review_summary)
  const media = object(summary.media_analysis)
  if (Object.keys(media).length) return fromMedia(String(data.id), String(data.mime_type || ""), media)
  if (String(data.mime_type) === "application/pdf" && (summary.analysis_summary || summary.document_assessment)) return fromDocument(String(data.id), String(data.mime_type || ""), { ...summary, updated_at: data.updated_at })
  return null
}

export async function loadMediaIntelligenceStatuses(items: ArtistMediaLibraryItem[]) {
  const statuses = new Map<string, MediaIntelligenceStatus>()
  const ids = items.flatMap((item) => item.sourceId ? [item.sourceId] : [])
  for (const item of items) statuses.set(item.id, !item.sourceId ? "legacy" : canAnalyzeMediaItem(item) ? "available" : "unsupported")
  if (!ids.length) return statuses
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("artist_import_sources").select("id,mime_type,review_summary,last_error_category").eq("artist_user_id", account.user.id).in("id", ids).is("deleted_at", null)
  if (error) throw error
  for (const row of data ?? []) {
    const summary = object(row.review_summary)
    if (Object.keys(object(summary.media_analysis)).length || (String(row.mime_type) === "application/pdf" && Boolean(summary.analysis_summary || summary.document_assessment))) {
      statuses.set(String(row.id), "ready")
    } else if (text(row.last_error_category)) {
      statuses.set(String(row.id), "failed")
    }
  }
  return statuses
}

export async function retryDocumentPassportSynthesis(item: ArtistMediaLibraryItem) {
  if (!item.sourceId || item.mimeType !== "application/pdf") throw new Error("A private PDF source is required for Passport drafting.")
  await consent(item.sourceId)
  await retryDocumentProfileSynthesis(item.sourceId)
  const refreshed = await loadMediaIntelligence(item.sourceId)
  if (!refreshed) throw new Error("Media Assist could not reload the repaired Passport suggestions.")
  return refreshed
}

export async function analyzeMediaWithKleio(item: ArtistMediaLibraryItem, options: { force?: boolean } = {}) {
  if (!item.sourceId) throw new Error("This older media item needs to be re-added to the private Media Library before Media Assist can use it.")
  if (!canAnalyzeMediaItem(item)) throw new Error(mediaIntelligenceSupportText(item))
  await consent(item.sourceId)

  if (item.mimeType === "application/pdf") {
    await requestMediaExtraction(item)
    let synthesisError = ""
    try {
      await synthesizeDocumentProfile(item.sourceId, { force: options.force === true })
    } catch (reason) {
      synthesisError = reason instanceof Error ? reason.message : "Media Assist could not finish the Passport drafting pass."
    }
    const refreshed = await loadMediaIntelligence(item.sourceId)
    if (!refreshed) throw new Error("Media Assist completed the document pass but did not produce readable source notes yet. Try again before using the result.")
    if (synthesisError) return { ...refreshed, pipelineStatus: "SOURCE_ONLY" as const, pipelineMessage: synthesisError }
    return refreshed
  }

  await claimMediaAnalysis(item.sourceId)
  try {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.functions.invoke("analyze-artist-media", { body: { sourceId: item.sourceId, force: options.force === true } })
    if (error) throw new Error(error.message || "Media Assist could not prepare suggestions from this private source.")
    if (data?.error === "unsupported_media_format") throw new Error(mediaIntelligenceSupportText(item))
    if (data?.error) throw new Error(String(data.message || data.error))
    const raw = object(data?.analysis)
    if (!Object.keys(raw).length) throw new Error("Media Assist finished without a readable result. Try again before using it.")
    return fromMedia(item.sourceId, item.mimeType, raw)
  } finally {
    await releaseMediaAnalysis(item.sourceId)
  }
}
