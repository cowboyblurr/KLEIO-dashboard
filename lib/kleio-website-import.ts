import { loadArtistPassport, saveArtistPassport } from "@/lib/kleio-live-data"
import {
  createPortfolioWorkFromMedia,
  loadArtistMediaLibrary,
  type ArtistMediaLibraryItem,
} from "@/lib/kleio-universal-media"
import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"

export type WebsiteFieldStatus = "extracted" | "suggested" | "missing"
export type WebsiteField = {
  value: string | string[]
  status: WebsiteFieldStatus
  source: string
  sourceUrl: string
  confidence: "strong_source_match" | "possible_suggestion" | "needs_artist_confirmation"
}

export type WebsiteProfileSuggestions = {
  professional_name: WebsiteField
  location: WebsiteField
  bio: WebsiteField
  artist_statement: WebsiteField
  practice_description: WebsiteField
  website_url: WebsiteField
  disciplines: WebsiteField
  mediums: WebsiteField
  social_links: string[]
}

export type WebsiteArtworkDraft = {
  title: string
  year: string
  medium: string
  dimensions: string
  description: string
  tags: string[]
  altText: string
}

export type WebsiteImageCandidate = {
  id: string
  url: string
  sourcePage: string
  alt: string
  caption: string
  width: number | null
  height: number | null
  score: number
  proposed: WebsiteArtworkDraft
}

export type WebsitePageEvidence = {
  url: string
  title: string
  description: string
  headings: string[]
  paragraphs: string[]
  socialLinks: string[]
}

export type WebsiteImportSession = {
  id: string
  artist_user_id: string
  website_url: string
  canonical_url: string
  status: "analyzing" | "review_ready" | "importing" | "completed" | "failed" | "expired"
  pages: WebsitePageEvidence[]
  profile_suggestions: WebsiteProfileSuggestions
  image_candidates: WebsiteImageCandidate[]
  imported_source_ids: string[]
  error_code: string
  extractor_version: string
  expires_at: string
  created_at: string
  updated_at: string
}

export type VisualEvidenceObservation = {
  label: string
  observation: string
  interpretation: string
  confidence: "high" | "medium" | "low"
  evidence_image_ids: string[]
  evidence_page_refs: string[]
}

export type VisualPracticeAnalysis = {
  summary: string
  visual_language: VisualEvidenceObservation[]
  recurring_themes: VisualEvidenceObservation[]
  motifs: VisualEvidenceObservation[]
  palette: VisualEvidenceObservation[]
  composition: VisualEvidenceObservation[]
  materials_and_techniques: VisualEvidenceObservation[]
  mood_and_atmosphere: VisualEvidenceObservation[]
  subject_matter: VisualEvidenceObservation[]
  presentation_style: VisualEvidenceObservation[]
  tensions_or_variations: VisualEvidenceObservation[]
  questions_for_artist: string[]
  drafting_ingredients: {
    confirmed_facts: string[]
    safe_interpretive_phrases: string[]
    terms_to_verify: string[]
    phrases_to_avoid: string[]
  }
  limitations: string[]
}

export type KleioAssistDraftType =
  | "short_bio"
  | "professional_bio"
  | "artist_statement"
  | "practice_description"
  | "artwork_description"
  | "submission_letter"
  | "application_answer"

export type KleioDraftOption = {
  label: string
  text: string
  facts_used: string[]
  interpretations_used: string[]
  word_count: number
}

export type KleioDraftResult = {
  recommended_option: number
  options: KleioDraftOption[]
  missing_facts: string[]
  safety_notes: string[]
}

export type KleioAssistStoredDraft = {
  id: string
  draft_type: KleioAssistDraftType | "practice_analysis"
  generated_output: Record<string, unknown>
  created_at: string
}

async function requireArtist() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  if (account.profile.role !== "artist") throw new Error("Website Import Assist is available only in an artist workspace.")
  return account
}

function functionError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback
  if (/kleio_assist_not_configured/i.test(error.message)) return "KLEIO Assist is ready in the product, but its private AI provider key has not been configured yet."
  if (/website_disallows_automated_access/i.test(error.message)) return "This website does not permit automated analysis. Upload the work directly or use another public portfolio page."
  if (/private_network_url_blocked|https_required|invalid_website_url/i.test(error.message)) return "Enter a public HTTPS artist website. Private, local, or internal addresses cannot be analyzed."
  return error.message || fallback
}

export async function analyzeArtistWebsite(websiteUrl: string, ownershipConfirmed: boolean) {
  await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("analyze-artist-website", {
    body: { action: "analyze", websiteUrl, ownershipConfirmed },
  })
  if (error) throw new Error(functionError(error, "KLEIO could not analyze this website."))
  if (data?.error) throw new Error(functionError(new Error(String(data.error)), "KLEIO could not analyze this website."))
  return data.session as WebsiteImportSession
}

export async function analyzeVisualPractice(sessionId: string, candidateIds: string[]) {
  await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("kleio-assist", {
    body: { action: "analyze_practice", sessionId, candidateIds },
  })
  if (error) throw new Error(functionError(error, "KLEIO Assist could not analyze this body of work."))
  if (data?.error) throw new Error(functionError(new Error(String(data.error)), "KLEIO Assist could not analyze this body of work."))
  return {
    draftId: String(data.draft?.id ?? ""),
    analysis: data.analysis as VisualPracticeAnalysis,
  }
}

export async function generateKleioAssistDraft(input: {
  sessionId: string
  analysisDraftId?: string
  draftType: KleioAssistDraftType
  wordLimit: number
  tone?: string
  artistContext?: string
  opportunityContext?: string
}) {
  await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("kleio-assist", {
    body: { action: "generate_draft", ...input },
  })
  if (error) throw new Error(functionError(error, "KLEIO Assist could not prepare this draft."))
  if (data?.error) throw new Error(functionError(new Error(String(data.error)), "KLEIO Assist could not prepare this draft."))
  return {
    draftId: String(data.draft?.id ?? ""),
    result: data.options as KleioDraftResult,
  }
}

function fieldString(field: WebsiteField | undefined) {
  return typeof field?.value === "string" ? field.value.trim() : ""
}

function fieldList(field: WebsiteField | undefined) {
  return Array.isArray(field?.value) ? field.value.filter((value): value is string => typeof value === "string").map((value) => value.trim()).filter(Boolean) : []
}

export async function applyWebsiteProfileSuggestions(input: {
  suggestions: WebsiteProfileSuggestions
  selectedFields: string[]
  editedValues: Record<string, string>
}) {
  await requireArtist()
  const current = await loadArtistPassport()
  if (!current) throw new Error("Your Creative Passport profile could not be found.")
  const selected = new Set(input.selectedFields)
  const value = (key: keyof WebsiteProfileSuggestions, fallback: string) => {
    if (!selected.has(key)) return fallback
    return input.editedValues[key] ?? fieldString(input.suggestions[key])
  }
  const list = (key: "disciplines" | "mediums", fallback: string[]) => {
    if (!selected.has(key)) return fallback
    const edited = input.editedValues[key]
    return edited !== undefined ? edited.split(/[,;\n]/).map((entry) => entry.trim()).filter(Boolean) : fieldList(input.suggestions[key])
  }
  return saveArtistPassport({
    professional_name: value("professional_name", current.professional_name),
    location: value("location", current.location),
    bio: value("bio", current.bio),
    artist_statement: value("artist_statement", current.artist_statement),
    practice_description: value("practice_description", current.practice_description),
    website_url: value("website_url", current.website_url),
    instagram_url: current.instagram_url,
    disciplines: list("disciplines", current.disciplines),
    mediums: list("mediums", current.mediums),
    languages: current.languages,
    education: current.education,
    exhibition_history: current.exhibition_history,
    awards: current.awards,
    cv_file_path: current.cv_file_path,
    disciplines_text: list("disciplines", current.disciplines).join(", "),
    mediums_text: list("mediums", current.mediums).join(", "),
    languages_text: current.languages.join(", "),
  })
}

async function importOneWebsiteImage(sessionId: string, candidateId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("analyze-artist-website", {
    body: { action: "import_images", sessionId, candidateIds: [candidateId] },
  })
  if (error) throw new Error(functionError(error, "The selected website image could not be copied into KLEIO."))
  if (data?.error) throw new Error(functionError(new Error(String(data.error)), "The selected website image could not be copied into KLEIO."))
  const sourceId = Array.isArray(data.sourceIds) ? String(data.sourceIds[0] ?? "") : ""
  if (!sourceId) throw new Error("The selected website image was not imported.")
  return sourceId
}

export async function approveWebsiteArtworkImports(input: {
  sessionId: string
  works: Array<{ candidate: WebsiteImageCandidate; draft: WebsiteArtworkDraft }>
}) {
  await requireArtist()
  const results: Array<{ candidateId: string; portfolioWorkId?: string; error?: string }> = []
  for (const work of input.works) {
    try {
      if (!work.draft.title.trim()) throw new Error("Add an artist-confirmed title before approving this work.")
      const sourceId = await importOneWebsiteImage(input.sessionId, work.candidate.id)
      const library = await loadArtistMediaLibrary({ kinds: ["image"], limit: 150 })
      const item = library.find((entry) => entry.sourceId === sourceId) as ArtistMediaLibraryItem | undefined
      if (!item) throw new Error("The imported image could not be opened in the private KLEIO Library.")
      const portfolioWorkId = await createPortfolioWorkFromMedia({
        item,
        title: work.draft.title,
        year: work.draft.year,
        medium: work.draft.medium,
        dimensions: work.draft.dimensions,
        description: work.draft.description,
        tags: work.draft.tags,
        accessibilityAltText: work.draft.altText,
      })
      results.push({ candidateId: work.candidate.id, portfolioWorkId })
    } catch (reason) {
      results.push({ candidateId: work.candidate.id, error: reason instanceof Error ? reason.message : "Artwork import failed." })
    }
  }
  return results
}

export async function updateKleioAssistDraft(input: {
  draftId: string
  artistEditedText: string
  status: "edited" | "approved" | "rejected"
}) {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("artist_ai_drafts").update({
    artist_edited_text: input.artistEditedText,
    status: input.status,
    approved_at: input.status === "approved" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", input.draftId).eq("artist_user_id", account.user.id).select("*").single()
  if (error) throw error
  return data as KleioAssistStoredDraft
}
