import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"

export type ApplicationAnswerOption = {
  label: string
  text: string
  evidence_refs: string[]
  correlation_refs: string[]
  factual_claim_refs?: string[]
  word_count: number
}

export type ApplicationAnswerAssistResult = {
  draft: {
    id: string
    provider: string
    model: string
    prompt_version: string
    request_context: Record<string, unknown>
  }
  options: {
    options?: ApplicationAnswerOption[]
    missing_context?: string[]
    excluded_information?: string[]
    safety_notes?: string[]
    warnings?: string[]
    confidence?: string
  }
  label: string
  confirmedFactsOnly: boolean
  artistConfirmationRequired: boolean
}

function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

async function functionErrorPayload(error: unknown) {
  const context = object(error) ? error.context : null
  if (!context || typeof (context as { clone?: unknown }).clone !== "function") return null
  try {
    const response = (context as Response).clone()
    const payload = await response.json()
    return object(payload) ? payload : null
  } catch {
    return null
  }
}

function messageForCode(code: string, fallback = "") {
  switch (code) {
    case "confirmed_facts_required":
    case "artist_context_required":
      return "KLEIO needs artist-authored Creative Passport material or confirmed source-backed facts before it can prepare a trustworthy draft."
    case "requirement_confirmation_required":
      return "This application question needs to be confirmed against the opportunity source before KLEIO can draft against it."
    case "requirement_not_found":
      return "KLEIO could not match this application question to the verified opportunity requirements. Refresh the opportunity before drafting."
    case "gemini_not_configured":
      return "KLEIO Assist drafting is not configured in this environment."
    case "gemini_rate_limited":
      return "KLEIO Assist is temporarily busy. Your application was not changed; try this draft again shortly."
    case "gemini_timeout":
    case "gemini_provider_unavailable":
      return "KLEIO Assist could not finish this draft right now. Your application was not changed; try again."
    case "unsupported_claim_detected":
      return "KLEIO rejected the draft because it introduced unsupported factual information. Nothing was inserted into your application."
    default:
      return fallback || "KLEIO Assist could not prepare this application answer."
  }
}

async function requireArtist() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in before using KLEIO Assist.")
  if (account.profile.role !== "artist") throw new Error("Application drafting is available only in an artist workspace.")
  return account
}

export async function requestApplicationAnswer(input: {
  opportunityId: string
  requirementId?: string
  question: string
  maximumWords?: number | null
}): Promise<ApplicationAnswerAssistResult> {
  await requireArtist()
  const question = input.question.trim()
  if (!input.opportunityId.trim()) throw new Error("Choose an opportunity before requesting a draft.")
  if (!question) throw new Error("KLEIO needs the exact application question before it can draft an answer.")

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("generate-application-answer", {
    body: {
      opportunity_id: input.opportunityId,
      requirement_id: input.requirementId || undefined,
      question_text: question,
      maximum_words: input.maximumWords || undefined,
    },
  })

  if (error) {
    const payload = await functionErrorPayload(error)
    const code = String(payload?.error || "")
    const serverMessage = typeof payload?.message === "string" ? payload.message : ""
    throw new Error(messageForCode(code, serverMessage || (error instanceof Error ? error.message : "")))
  }
  if (data?.error) throw new Error(messageForCode(String(data.error), String(data.message || "")))
  if (!data?.draft || !data?.options) throw new Error("KLEIO finished without a reviewable draft. Your application was not changed; try again.")
  return data as ApplicationAnswerAssistResult
}
