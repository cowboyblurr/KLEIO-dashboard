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

  if (error) throw new Error("KLEIO Assist could not prepare this application answer.")
  if (data?.error === "confirmed_facts_required") throw new Error("Confirm source-backed Creative Passport facts before requesting an application draft.")
  if (data?.error === "gemini_not_configured") throw new Error("KLEIO Assist drafting is not configured in this environment.")
  if (data?.error === "unsupported_claim_detected") throw new Error("KLEIO rejected the draft because it introduced unsupported factual information.")
  if (data?.error) throw new Error(data?.message || "KLEIO Assist could not prepare this application answer.")
  return data as ApplicationAnswerAssistResult
}