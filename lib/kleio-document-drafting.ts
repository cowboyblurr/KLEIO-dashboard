import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import { loadArtistPassport, saveArtistPassport } from "@/lib/kleio-live-data"

export type DocumentDraftKind =
  | "short_bio"
  | "standard_bio"
  | "extended_bio"
  | "practice_description"
  | "first_person_practice"

export type DocumentDraftOption = {
  label: string
  text: string
  evidence_refs: string[]
  correlation_refs: string[]
  word_count: number
}

export type DocumentAssistDraft = {
  id: string
  draft_type: string
  status: "generated" | "edited" | "approved" | "rejected"
  provider: string
  model: string
  prompt_version: string
  evidence: Array<Record<string, unknown>>
  request_context: Record<string, unknown>
  generated_output: {
    options?: DocumentDraftOption[]
    missing_context?: string[]
    safety_notes?: string[]
  }
  artist_edited_text: string
  artist_review: Record<string, unknown>
  approved_at: string | null
  created_at: string
  updated_at: string
}

async function requireArtist() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in before using KLEIO Assist.")
  if (account.profile.role !== "artist") throw new Error("Document drafting is available only in an artist workspace.")
  return account
}

export async function loadDocumentDraftCapabilities() {
  await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("generate-artist-document-draft", {
    body: { action: "capabilities" },
  })
  if (error) throw new Error("KLEIO could not check document drafting availability.")
  return data as {
    configured: boolean
    provider: string
    primaryModel: string
    fallbackModel: string
    promptVersion: string
    artistConfirmationRequired: boolean
    confirmedFactsOnly: boolean
  }
}

export async function requestDocumentDraft(kind: DocumentDraftKind) {
  await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("generate-artist-document-draft", {
    body: { action: "generate_draft", kind },
  })
  if (error) throw new Error("KLEIO Assist could not prepare this draft.")
  if (data?.error === "confirmed_facts_required") throw new Error("Review and confirm source-backed Passport facts before requesting a draft.")
  if (data?.error === "document_drafting_not_configured") throw new Error("KLEIO Assist drafting is not configured in this environment.")
  if (data?.error) throw new Error("KLEIO Assist could not prepare this draft.")
  return data as {
    draft: DocumentAssistDraft
    options: { options: DocumentDraftOption[]; missing_context: string[]; safety_notes: string[] }
    label: string
    confirmedFactsOnly: boolean
    artistConfirmationRequired: boolean
  }
}

export async function loadDocumentDrafts(): Promise<DocumentAssistDraft[]> {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("artist_ai_drafts")
    .select("*")
    .eq("artist_user_id", account.user.id)
    .in("prompt_version", ["document_passport_drafting_v1"])
    .order("updated_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as DocumentAssistDraft[]
}

export async function saveDocumentDraftReview(input: {
  draft: DocumentAssistDraft
  text: string
  optionIndex: number
  approve: boolean
}) {
  const account = await requireArtist()
  const value = input.text.trim()
  if (!value) throw new Error("The reviewed draft cannot be empty.")
  const supabase = getSupabaseBrowserClient()
  const now = new Date().toISOString()
  const status = input.approve ? "approved" : "edited"
  const { error } = await supabase
    .from("artist_ai_drafts")
    .update({
      status,
      artist_edited_text: value,
      artist_review: {
        selected_option_index: input.optionIndex,
        artist_edited: value !== (input.draft.generated_output.options?.[input.optionIndex]?.text ?? ""),
        private_until_saved: true,
        confirmed_facts_only: true,
      },
      approved_at: input.approve ? now : null,
      updated_at: now,
    })
    .eq("id", input.draft.id)
    .eq("artist_user_id", account.user.id)
  if (error) throw error

  if (!input.approve) return
  const passport = await loadArtistPassport()
  if (!passport) throw new Error("Open your Creative Passport once before saving a reviewed draft.")
  const requestedKind = String(input.draft.request_context.requested_kind || "")
  const isPractice = requestedKind === "practice_description" || requestedKind === "first_person_practice"
  await saveArtistPassport({
    ...passport,
    ...(isPractice ? { practice_description: value } : { bio: value }),
    disciplines_text: passport.disciplines.join(", "),
    mediums_text: passport.mediums.join(", "),
    languages_text: passport.languages.join(", "),
  })
}

export async function rejectDocumentDraft(draftId: string) {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("artist_ai_drafts")
    .update({
      status: "rejected",
      artist_review: { rejected_by_artist: true },
      approved_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId)
    .eq("artist_user_id", account.user.id)
  if (error) throw error
}
