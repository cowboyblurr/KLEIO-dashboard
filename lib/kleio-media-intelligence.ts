import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import { requestMediaExtraction } from "@/lib/kleio-upload-to-passport"
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
}

export type MediaIntelligenceStatus = "ready" | "available" | "unsupported" | "legacy"

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
function text(value: unknown) { return typeof value === "string" ? value.trim() : "" }
function strings(value: unknown) { return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim())).map((entry) => entry.trim()) : [] }
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
  }
}

function fromDocument(sourceId: string, mimeType: string, raw: Record<string, unknown>): MediaIntelligence {
  const summary = object(raw.analysis_summary)
  const assessment = object(raw.document_assessment)
  const grouped = object(raw.grouped_counts)
  const claims = Array.isArray(raw.representative_claims) ? raw.representative_claims.map(object) : []
  const needsReview = strings(summary.what_needs_review)
  return {
    sourceId,
    mediaKind: kind(mimeType),
    provider: text(raw.provider),
    model: text(raw.model),
    analyzedAt: text(raw.updated_at),
    summary: text(summary.document_synopsis) || text(raw.coverage_explanation) || strings(summary.what_was_found).join(" "),
    suggestedTitle: "",
    suggestedDescription: text(summary.document_synopsis),
    mediumsMaterials: [],
    disciplines: [],
    themesConcepts: [],
    formalQualities: [],
    technicalObservations: strings(summary.what_was_found),
    presentationNotes: strings(summary.recommended_use),
    accessibilityDescription: "",
    applicationKeywords: Object.keys(grouped).map((value) => value.replaceAll("_", " ")),
    factualObservations: claims.map((claim) => text(claim.display_value)).filter(Boolean),
    interpretiveObservations: [],
    uncertainties: needsReview,
    limitations: [...strings(assessment.analysis_limitations), ...needsReview],
    confidence: Number.isFinite(Number(raw.analysis_score)) ? Number(raw.analysis_score) : null,
    proposalCount: Number(raw.claim_count || 0),
    analysisQuality: text(raw.analysis_quality),
    isDocumentAnalysis: true,
  }
}

export function canAnalyzeMediaItem(item: ArtistMediaLibraryItem) {
  return Boolean(item.sourceId) && (KLEIO_ANALYZABLE_MEDIA_MIME_TYPES as readonly string[]).includes(item.mimeType)
}

export function mediaIntelligenceSupportText(item: ArtistMediaLibraryItem) {
  if (!item.sourceId) return "This older portfolio item needs to be re-added to the private Media Library before KLEIO can analyze it."
  if (canAnalyzeMediaItem(item)) return "KLEIO can privately analyze this source and keep the result available in both Media Library and Creative Passport."
  if (item.mediaKind === "document") return "This file can stay in KLEIO, but this document format is not yet supported by the analysis layer."
  return "This media format can stay in KLEIO, but it is not yet supported by the analysis layer."
}

async function requireArtist() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  if (account.profile.role !== "artist") throw new Error("Media Intelligence is available only in an artist workspace.")
  return account
}

async function consent(sourceId: string) {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("artist_import_sources").update({ analysis_consent_at: new Date().toISOString(), keep_without_analysis: false, updated_at: new Date().toISOString() }).eq("id", sourceId).eq("artist_user_id", account.user.id)
  if (error) throw error
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
  const { data, error } = await supabase.from("artist_import_sources").select("id,mime_type,review_summary").eq("artist_user_id", account.user.id).in("id", ids).is("deleted_at", null)
  if (error) throw error
  for (const row of data ?? []) {
    const summary = object(row.review_summary)
    if (Object.keys(object(summary.media_analysis)).length || (String(row.mime_type) === "application/pdf" && Boolean(summary.analysis_summary || summary.document_assessment))) statuses.set(String(row.id), "ready")
  }
  return statuses
}

export async function analyzeMediaWithKleio(item: ArtistMediaLibraryItem, options: { force?: boolean } = {}) {
  if (!item.sourceId) throw new Error("This older media item needs to be re-added to the private Media Library before analysis.")
  if (!canAnalyzeMediaItem(item)) throw new Error(mediaIntelligenceSupportText(item))
  await consent(item.sourceId)

  if (item.mimeType === "application/pdf") {
    await requestMediaExtraction(item)
    const refreshed = await loadMediaIntelligence(item.sourceId)
    if (!refreshed) throw new Error("KLEIO completed the document pass but did not produce a readable analysis yet. Try again before using it.")
    return refreshed
  }

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("analyze-artist-media", { body: { sourceId: item.sourceId, force: options.force === true } })
  if (error) throw new Error(error.message || "KLEIO could not analyze this private media source.")
  if (data?.error) throw new Error(String(data.message || data.error))
  const raw = object(data?.analysis)
  if (!Object.keys(raw).length) throw new Error("KLEIO finished without a readable media analysis. Try again before using the result.")
  return fromMedia(item.sourceId, item.mimeType, raw)
}
