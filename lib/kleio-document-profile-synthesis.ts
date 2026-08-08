import { normalizeKleioEdgeFunctionError } from "@/lib/kleio-edge-function-error"
import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"

export type SynthesisClassification = "EXTRACTED_FACT" | "SUPPORTED_SYNTHESIS" | "INTERPRETIVE_DRAFT"

export type SourceEvidence = {
  ref: string
  page_number: number
  evidence_excerpt: string
  information_layer: "factual" | "artist_authored" | "interpretive"
  classification?: "EXTRACTED_FACT" | "VISUAL_OBSERVATION" | "SUPPORTED_SYNTHESIS" | "INTERPRETIVE_EVIDENCE"
  supports_fields?: string[]
  source?: "extraction" | "pdf_visual"
}

export type SourceSuggestion = {
  value: string
  evidence_refs: string[]
  confidence: number
  classification: SynthesisClassification
}

export type SourceDraft = {
  text: string
  evidence_refs: string[]
  classification: SynthesisClassification
}

export type SynthesisQA = {
  status: "READY_FOR_REVIEW" | "PARTIALLY_READY" | string
  drafted_fields: string[]
  needs_input_fields: string[]
  retry_fields_remaining: string[]
  repaired_fields: string[]
  repair_error: string
  deterministic_coverage_checked: boolean
}

export type DocumentProfileSynthesis = {
  version: string
  schema_version: string
  prompt_version: string
  source_id: string
  source_fingerprint: string
  generated_at: string
  provider: string
  model: string
  professional_name: SourceSuggestion | null
  bio: SourceDraft
  artist_statement: SourceDraft
  practice_description: SourceDraft
  disciplines: SourceSuggestion[]
  mediums: SourceSuggestion[]
  themes: SourceSuggestion[]
  visual_language: SourceSuggestion[]
  application_keywords: SourceSuggestion[]
  skills: SourceSuggestion[]
  career_highlights: SourceSuggestion[]
  education: SourceSuggestion[]
  exhibitions: SourceSuggestion[]
  awards: SourceSuggestion[]
  residencies: SourceSuggestion[]
  representation: SourceSuggestion[]
  portfolio_projects: SourceSuggestion[]
  artworks: SourceSuggestion[]
  portfolio_links: SourceSuggestion[]
  missing_context: string[]
  evidence: SourceEvidence[]
  qa: SynthesisQA
  artist_confirmation_required: boolean
  private_until_approved: boolean
  source_grounded: boolean
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim())).map((entry) => entry.trim()) : []
}

function classification(value: unknown): SynthesisClassification {
  const next = text(value)
  return ["EXTRACTED_FACT", "SUPPORTED_SYNTHESIS", "INTERPRETIVE_DRAFT"].includes(next)
    ? next as SynthesisClassification
    : "SUPPORTED_SYNTHESIS"
}

function suggestion(value: unknown): SourceSuggestion | null {
  const raw = object(value)
  const label = text(raw.value)
  const refs = strings(raw.evidence_refs)
  const confidence = Number(raw.confidence)
  if (!label || !refs.length) return null
  return {
    value: label,
    evidence_refs: refs,
    confidence: Number.isFinite(confidence) ? confidence : 0.5,
    classification: classification(raw.classification),
  }
}

function suggestions(value: unknown) {
  return Array.isArray(value) ? value.map(suggestion).filter((entry): entry is SourceSuggestion => Boolean(entry)) : []
}

function draft(value: unknown): SourceDraft {
  const raw = object(value)
  return { text: text(raw.text), evidence_refs: strings(raw.evidence_refs), classification: classification(raw.classification) }
}

function qa(value: unknown): SynthesisQA {
  const raw = object(value)
  return {
    status: text(raw.status) || "READY_FOR_REVIEW",
    drafted_fields: strings(raw.drafted_fields),
    needs_input_fields: strings(raw.needs_input_fields),
    retry_fields_remaining: strings(raw.retry_fields_remaining),
    repaired_fields: strings(raw.repaired_fields),
    repair_error: text(raw.repair_error),
    deterministic_coverage_checked: raw.deterministic_coverage_checked === true,
  }
}

export function parseDocumentProfileSynthesis(value: unknown): DocumentProfileSynthesis | null {
  const raw = object(value)
  const sourceId = text(raw.source_id)
  if (!sourceId) return null
  const evidence = Array.isArray(raw.evidence) ? raw.evidence.map((entry) => {
    const item = object(entry)
    const layer = ["factual", "artist_authored", "interpretive"].includes(text(item.information_layer)) ? text(item.information_layer) as SourceEvidence["information_layer"] : "factual"
    const evidenceClassification = text(item.classification)
    const source = text(item.source)
    return {
      ref: text(item.ref),
      page_number: Number(item.page_number || 0),
      evidence_excerpt: text(item.evidence_excerpt),
      information_layer: layer,
      classification: ["EXTRACTED_FACT", "VISUAL_OBSERVATION", "SUPPORTED_SYNTHESIS", "INTERPRETIVE_EVIDENCE"].includes(evidenceClassification) ? evidenceClassification as SourceEvidence["classification"] : undefined,
      supports_fields: strings(item.supports_fields),
      source: ["extraction", "pdf_visual"].includes(source) ? source as SourceEvidence["source"] : undefined,
    }
  }).filter((entry) => entry.ref && entry.page_number > 0 && entry.evidence_excerpt) : []
  return {
    version: text(raw.version),
    schema_version: text(raw.schema_version),
    prompt_version: text(raw.prompt_version),
    source_id: sourceId,
    source_fingerprint: text(raw.source_fingerprint),
    generated_at: text(raw.generated_at),
    provider: text(raw.provider),
    model: text(raw.model),
    professional_name: suggestion(raw.professional_name),
    bio: draft(raw.bio),
    artist_statement: draft(raw.artist_statement),
    practice_description: draft(raw.practice_description),
    disciplines: suggestions(raw.disciplines),
    mediums: suggestions(raw.mediums),
    themes: suggestions(raw.themes),
    visual_language: suggestions(raw.visual_language),
    application_keywords: suggestions(raw.application_keywords),
    skills: suggestions(raw.skills),
    career_highlights: suggestions(raw.career_highlights),
    education: suggestions(raw.education),
    exhibitions: suggestions(raw.exhibitions),
    awards: suggestions(raw.awards),
    residencies: suggestions(raw.residencies),
    representation: suggestions(raw.representation),
    portfolio_projects: suggestions(raw.portfolio_projects),
    artworks: suggestions(raw.artworks),
    portfolio_links: suggestions(raw.portfolio_links),
    missing_context: strings(raw.missing_context),
    evidence,
    qa: qa(raw.qa),
    artist_confirmation_required: raw.artist_confirmation_required !== false,
    private_until_approved: raw.private_until_approved !== false,
    source_grounded: raw.source_grounded !== false,
  }
}

async function requireArtist() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  if (account.profile.role !== "artist") throw new Error("Document profile synthesis is available only in an artist workspace.")
  return account
}

export async function loadDocumentProfileSynthesis(sourceId: string) {
  if (!sourceId) return null
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("artist_import_sources").select("id,review_summary").eq("id", sourceId).eq("artist_user_id", account.user.id).is("deleted_at", null).maybeSingle()
  if (error) throw error
  if (!data) return null
  return parseDocumentProfileSynthesis(object(data.review_summary).profile_synthesis)
}

export async function synthesizeDocumentProfile(sourceId: string, options: { force?: boolean } = {}) {
  if (!sourceId) throw new Error("This document is missing its private source reference.")
  await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("synthesize-artist-source-profile-v2", { body: { sourceId, force: options.force === true } })
  if (error) throw await normalizeKleioEdgeFunctionError(error, "Media Assist could not build Passport suggestions from this PDF. Your source notes are still available.")
  if (data?.error) {
    const requestError = new Error(String(data.message || "Media Assist could not build Passport suggestions from this PDF. Your source notes are still available."))
    requestError.name = String(data.error)
    throw requestError
  }
  const parsed = parseDocumentProfileSynthesis(data?.synthesis)
  if (!parsed) throw new Error("Media Assist completed the profile pass but did not return usable Passport suggestions. Your source notes are still available.")
  return parsed
}

export async function retryDocumentProfileSynthesis(sourceId: string) {
  return synthesizeDocumentProfile(sourceId, { force: true })
}

export function evidenceByRef(synthesis: DocumentProfileSynthesis | null) {
  return new Map((synthesis?.evidence ?? []).map((entry) => [entry.ref, entry]))
}
