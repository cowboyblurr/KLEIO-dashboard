import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"

export type SourceEvidence = {
  ref: string
  page_number: number
  evidence_excerpt: string
  information_layer: "factual" | "artist_authored" | "interpretive"
}

export type SourceSuggestion = {
  value: string
  evidence_refs: string[]
  confidence: number
}

export type SourceDraft = {
  text: string
  evidence_refs: string[]
}

export type DocumentProfileSynthesis = {
  version: string
  source_id: string
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

function suggestion(value: unknown): SourceSuggestion | null {
  const raw = object(value)
  const label = text(raw.value)
  const refs = strings(raw.evidence_refs)
  const confidence = Number(raw.confidence)
  if (!label || !refs.length) return null
  return { value: label, evidence_refs: refs, confidence: Number.isFinite(confidence) ? confidence : 0.5 }
}

function suggestions(value: unknown) {
  return Array.isArray(value) ? value.map(suggestion).filter((entry): entry is SourceSuggestion => Boolean(entry)) : []
}

function draft(value: unknown): SourceDraft {
  const raw = object(value)
  return { text: text(raw.text), evidence_refs: strings(raw.evidence_refs) }
}

export function parseDocumentProfileSynthesis(value: unknown): DocumentProfileSynthesis | null {
  const raw = object(value)
  const sourceId = text(raw.source_id)
  if (!sourceId) return null
  const evidence = Array.isArray(raw.evidence) ? raw.evidence.map((entry) => {
    const item = object(entry)
    const layer = ["factual", "artist_authored", "interpretive"].includes(text(item.information_layer)) ? text(item.information_layer) as SourceEvidence["information_layer"] : "factual"
    return { ref: text(item.ref), page_number: Number(item.page_number || 0), evidence_excerpt: text(item.evidence_excerpt), information_layer: layer }
  }).filter((entry) => entry.ref && entry.page_number > 0 && entry.evidence_excerpt) : []
  return {
    version: text(raw.version),
    source_id: sourceId,
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
  const { data, error } = await supabase.functions.invoke("synthesize-artist-source-profile", { body: { sourceId, force: options.force === true } })
  if (error) throw new Error(error.message || "KLEIO could not build Passport suggestions from this PDF.")
  if (data?.error) throw new Error(String(data.message || data.error))
  const parsed = parseDocumentProfileSynthesis(data?.synthesis)
  if (!parsed) throw new Error("KLEIO completed the profile pass but did not return usable Passport suggestions.")
  return parsed
}

export function evidenceByRef(synthesis: DocumentProfileSynthesis | null) {
  return new Map((synthesis?.evidence ?? []).map((entry) => [entry.ref, entry]))
}
