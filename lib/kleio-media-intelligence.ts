import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import { requestMediaExtraction } from "@/lib/kleio-upload-to-passport"
import type { ArtistMediaLibraryItem, MediaKind } from "@/lib/kleio-universal-media"

export const KLEIO_ANALYZABLE_MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-ms-wmv",
  "video/x-ms-asf",
  "application/vnd.ms-asf",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
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

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim())).map((entry) => entry.trim()) : []
}

function mediaKindFromMime(mimeType: string): MediaKind {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/") || mimeType === "application/vnd.ms-asf") return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  return "document"
}

function fromMediaAnalysis(sourceId: string, mimeType: string, raw: Record<string, unknown>): MediaIntelligence {
  return {
    sourceId,
    mediaKind: mediaKindFromMime(mimeType),
    provider: stringValue(raw.provider),
    model: stringValue(raw.model),
    analyzedAt: stringValue(raw.analyzed_at),
    summary: stringValue(raw.summary),
    suggestedTitle: stringValue(raw.suggested_title),
    suggestedDescription: stringValue(raw.suggested_description),
    mediumsMaterials: stringArray(raw.mediums_materials),
    disciplines: stringArray(raw.disciplines),
    themesConcepts: stringArray(raw.themes_concepts),
    formalQualities: stringArray(raw.formal_qualities),
    technicalObservations: stringArray(raw.technical_observations),
    presentationNotes: stringArray(raw.presentation_notes),
    accessibilityDescription: stringValue(raw.accessibility_description),
    applicationKeywords: stringArray(raw.application_keywords),
    factualObservations: stringArray(raw.factual_observations),
    interpretiveObservations: stringArray(raw.interpretive_observations),
    uncertainties: stringArray(raw.uncertainties),
    limitations: stringArray(raw.limitations),
    confidence: Number.isFinite(Number(raw.confidence)) ? Number(raw.confidence) : null,
    proposalCount: 0,
    analysisQuality: "review_ready",
    isDocumentAnalysis: false,
  }
}

function fromDocumentAnalysis(sourceId: string, mimeType: string, raw: Record<string, unknown>): MediaIntelligence {
  const analysisSummary = object(raw.analysis_summary)
  const representativeClaims = Array.isArray(raw.representative_claims) ? raw.representative_claims.map(object) : []
  const groupedCounts = object(raw.grouped_counts)
  const findings = stringArray(analysisSummary.what_was_found)
  const needsReview = stringArray(analysisSummary.what_needs_review)
  const limitations = [
    ...stringArray(object(raw.document_assessment).analysis_limitations),
    ...needsReview,
  ]
  const factual = representativeClaims
    .map((claim) => stringValue(claim.display_value))
    .filter(Boolean)
  return {
    sourceId,
    mediaKind: mediaKindFromMime(mimeType),
    provider: stringValue(raw.provider),
    model: stringValue(raw.model),
    analyzedAt: stringValue(raw.analyzed_at) || stringValue(raw.updated_at),
    summary: stringValue(analysisSummary.document_synopsis) || stringValue(raw.coverage_explanation) || findings.join(" "),
    suggestedTitle: "",
    suggestedDescription: stringValue(analysisSummary.document_synopsis),
    mediumsMaterials: [],
    disciplines: [],
    themesConcepts: [],
    formalQualities: [],
    technicalObservations: findings,
    presentationNotes: stringArray(analysisSummary.recommended_use),
    accessibilityDescription: "",
    applicationKeywords: Object.keys(groupedCounts).map((value) => value.replaceAll("_", " ")),
    factualObservations: factual,
    interpretiveObservations: [],
    uncertainties: needsReview,
    limitations,
    confidence: Number.isFinite(Number(raw.analysis_score)) ? Number(raw.analysis_score) : null,
    proposalCount: Number(raw.claim_count || 0),
    analysisQuality: stringValue(raw.analysis_quality),
    isDocumentAnalysis: true,
  }
}

export function canAnalyzeMediaItem(item: ArtistMediaLibraryItem) {
  return Boolean(item.sourceId) && (KLEIO_ANALYZABLE_MEDIA_MIME_TYPES as readonly string[]).includes(item.mimeType)
}

export function mediaIntelligenceSupportText(item: ArtistMediaLibraryItem) {
  if (!item.sourceId) return "This older portfolio item needs to be re-added to the private Media Library before KLEIO can analyze it."
  if (canAnalyzeMediaItem(item)) return "KLEIO can privately analyze this source and keep the result available in both Media Library and Creative Passport."
  if (item.mediaKind === "document") return "This file can stay in KLEIO, but this document format is not yet supported by the analysis layer. PDF document analysis remains available."
  return "This media format can stay in KLEIO, but it is not yet supported by the analysis layer."
}

async function requireArtist() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  if (account.profile.role !== "artist") throw new Error("Media Intelligence is available only in an artist workspace.")
  return account
}

async function consentToAnalysis(sourceId: string) {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("artist_import_sources").update({
    analysis_consent_at: new Date().toISOString(),
    keep_without_analysis: false,
    updated_at: new Date().toISOString(),
  }).eq("id", sourceId).eq("artist_user_id", account.user.id)
  if (error) throw error
}

export async function loadMediaIntelligence(sourceId: string): Promise<MediaIntelligence | null> {
  if (!sourceId) return null
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("artist_import_sources")
    .select("id,mime_type,review_summary,updated_at")
    .eq("id", sourceId)
    .eq("artist_user_id", account.user.id)
    .is("deleted_at", null)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const summary = object(data.review_summary)
  const mediaAnalysis = object(summary.media_analysis)
  if (Object.keys(mediaAnalysis).length) return fromMediaAnalysis(String(data.id), String(data.mime_type || ""), mediaAnalysis)
  if (String(data.mime_type) === "application/pdf" && Object.keys(summary).length && (summary.analysis_summary || summary.document_assessment)) {
    return fromDocumentAnalysis(String(data.id), String(data.mime_type || ""), { ...summary, updated_at: data.updated_at })
  }
  return null
}

export async function loadMediaIntelligenceStatuses(items: ArtistMediaLibraryItem[]) {
  const ids = items.flatMap((item) => item.sourceId ? [item.sourceId] : [])
  const statuses = new Map<string, MediaIntelligenceStatus>()
  for (const item of items) statuses.set(item.id, !item.sourceId ? "legacy" : canAnalyzeMediaItem(item) ? "available" : "unsupported")
  if (!ids.length) return statuses
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("artist_import_sources")
    .select("id,mime_type,review_summary")
    .eq("artist_user_id", account.user.id)
    .in("id", ids)
    .is("deleted_at", null)
  if (error) throw error
  for (const row of data ?? []) {
    const summary = object(row.review_summary)
    const hasMedia = Object.keys(object(summary.media_analysis)).length > 0
    const hasDocument = String(row.mime_type) === "application/pdf" && Boolean(summary.analysis_summary || summary.document_assessment)
    if (hasMedia || hasDocument) statuses.set(String(row.id), "ready")
  }
  return statuses
}

export async function analyzeMediaWithKleio(item: ArtistMediaLibraryItem, options: { force?: boolean } = {}) {
  if (!item.sourceId) throw new Error("This older media item needs to be re-added to the private Media Library before analysis.")
  if (!canAnalyzeMediaItem(item)) throw new Error(mediaIntelligenceSupportText(item))
  await consentToAnalysis(item.sourceId)

  if (item.mimeType === "application/pdf") {
    const result = await requestMediaExtraction(item)
    const summary = object(result.analysisSummary)
    return fromDocumentAnalysis(item.sourceId, item.mimeType, summary)
  }

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("analyze-artist-media", {
    body: { sourceId: item.sourceId, force: options.force === true },
  })
  if (error) throw new Error(error.message || "KLEIO could not analyze this private media source.")
  if (data?.error) throw new Error(String(data.message || data.error))
  const analysis = object(data?.analysis)
  if (!Object.keys(analysis).length) throw new Error("KLEIO finished without a readable media analysis. Try again before using the result.")
  return fromMediaAnalysis(item.sourceId, item.mimeType, analysis)
}
