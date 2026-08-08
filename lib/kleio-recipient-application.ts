import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

const issuedApplicationReferences = new Map<string, string>()
const applicationReferencePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type RecipientReviewArtwork = {
  id: string
  title: string
  year: string
  medium: string
  dimensions: string
  description: string
  image_url: string | null
}

export type RecipientApplicationResponse = {
  id: string
  label: string
  material_key: string
  category: string
  answer: string
}

export type RecipientReviewSnapshot = {
  reference: string
  approved_at: string
  data_scope: "real" | "guided_demo" | "synthetic_test"
  synthetic_notice: string
  opportunity: {
    id: string
    title: string
    provider_name: string
    summary: string
    disciplines: string[]
    award_min: number | null
    award_max: number | null
    currency: string
    deadline_at: string
    required_materials: string[]
    locations: string[]
    submission_method: string
  }
  artist: {
    professional_name: string
    location: string
    bio: string
    artist_statement: string
    practice_description: string
    disciplines: string[]
    mediums: string[]
    education: string
    exhibition_history: string
    awards: string
    website_url: string
  }
  introduction: string
  opportunity_response: string
  application_responses: RecipientApplicationResponse[]
  alignment_map: Array<{
    theme?: string
    opportunitySource?: string
    artistSourceLabel?: string
    artistEvidence?: string
    confidence?: string
    supported?: boolean
  }>
  portfolio: RecipientReviewArtwork[]
  documents: {
    cv_file_path?: string
    cv_url?: string | null
    attachment_labels?: string[]
  }
}

export type RecipientReviewResponse = {
  access: {
    id: string
    expires_at: string
    data_scope: "real" | "guided_demo" | "synthetic_test"
    activity_disclosure_version: string
  }
  snapshot: RecipientReviewSnapshot
  recipient: { email: string; verified: boolean } | null
  conversation_id: string | null
}

export type RecipientEvent = {
  id: string
  event_type: string
  actor_kind: string
  evidence_level: "self_reported" | "system_observed" | "recipient_confirmed" | "provider_confirmed"
  metadata: Record<string, unknown>
  created_at: string
}

export type RecipientConversationMessage = {
  id: string
  sender_kind: "artist" | "recipient"
  body: string
  created_at: string
}

function namedError(name: string, message: string) {
  const error = new Error(message)
  error.name = name
  return error
}

function currentApplicationReference() {
  if (typeof window === "undefined") return ""
  return new URLSearchParams(window.location.search).get("application")?.trim() ?? ""
}

export function isValidRecipientApplicationReference(value: string) {
  return applicationReferencePattern.test(value.trim())
}

export function assertRecipientApplicationReference(snapshotReference: string, requestedReference: string) {
  if (!isValidRecipientApplicationReference(requestedReference)) {
    throw namedError("application_reference_required", "This application link is incomplete. Ask the artist to send a fresh KLEIO review link.")
  }
  if (snapshotReference.trim().toLowerCase() !== requestedReference.trim().toLowerCase()) {
    throw namedError("application_reference_mismatch", "This application reference does not match the secure access token. Ask the artist to send a fresh KLEIO review link.")
  }
}

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("recipient-application-review", { body })
  if (error) throw error
  if (data?.error) {
    const requestError = new Error(data.message || data.error)
    requestError.name = data.error
    throw requestError
  }
  return data as T
}

export async function createRecipientReviewAccess(packageId: string) {
  const access = await invoke<{ token: string; access_id: string; expires_at: string; data_scope: string }>({
    action: "create_access",
    package_id: packageId,
  })
  issuedApplicationReferences.set(access.token, packageId)
  return { ...access, application_reference: packageId }
}

export async function revokeRecipientReviewAccess(packageId: string) {
  return invoke<{ revoked: number }>({ action: "revoke_access", package_id: packageId })
}

export async function loadRecipientEvents(packageId: string) {
  const response = await invoke<{ events: RecipientEvent[] }>({ action: "list_events", package_id: packageId })
  return response.events
}

export async function loadRecipientReview(token: string) {
  const applicationReference = currentApplicationReference()
  if (!isValidRecipientApplicationReference(applicationReference)) {
    throw namedError("application_reference_required", "This application link is incomplete. Ask the artist to send a fresh KLEIO review link.")
  }
  const idempotencyKey = `application-page-viewed:${token.slice(-12)}:${new Date().toISOString().slice(0, 13)}`
  const review = await invoke<RecipientReviewResponse>({
    action: "view",
    token,
    application_reference: applicationReference,
    idempotency_key: idempotencyKey,
    metadata: { surface: "recipient_application_review", viewport: typeof window === "undefined" ? "unknown" : `${window.innerWidth}x${window.innerHeight}` },
  })
  assertRecipientApplicationReference(review.snapshot.reference, applicationReference)
  return review
}

export async function recordRecipientEvent(
  token: string,
  eventType: string,
  metadata: Record<string, unknown> = {},
) {
  const idempotencyKey = `${eventType}:${token.slice(-12)}:${crypto.randomUUID()}`
  return invoke<{ recorded: true }>({
    action: "record_event",
    token,
    event_type: eventType,
    idempotency_key: idempotencyKey,
    metadata,
  })
}

export async function prepareRecipientQuestion(
  token: string,
  email: string,
  body: string,
  identity: { displayName?: string; organizationName?: string } = {},
) {
  return invoke<{ draft_token: string; expires_at: string; email: string }>({
    action: "prepare_question",
    token,
    email,
    body,
    display_name: identity.displayName ?? "",
    organization_name: identity.organizationName ?? "",
  })
}

export async function requestRecipientEmailVerification(input: {
  email: string
  reviewToken: string
  draftToken: string
}) {
  const supabase = getSupabaseBrowserClient()
  const applicationReference = currentApplicationReference()
  if (!isValidRecipientApplicationReference(applicationReference)) {
    throw namedError("application_reference_required", "This application link is incomplete. Ask the artist to send a fresh KLEIO review link.")
  }
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim().replace(/^\/+|\/+$/g, "")
  const path = `${basePath ? `/${basePath}` : ""}/application-review/`
  const redirect = new URL(path, window.location.origin)
  redirect.searchParams.set("application", applicationReference)
  redirect.searchParams.set("token", input.reviewToken)
  redirect.searchParams.set("draft", input.draftToken)
  const { error } = await supabase.auth.signInWithOtp({
    email: input.email.trim().toLowerCase(),
    options: {
      emailRedirectTo: redirect.toString(),
      shouldCreateUser: true,
    },
  })
  if (error) throw error
  return redirect.toString()
}

export async function completeRecipientQuestion(reviewToken: string, draftToken: string) {
  return invoke<{ conversation_id: string; message_id: string; sent_at: string }>({
    action: "verify_and_send",
    token: reviewToken,
    draft_token: draftToken,
    client_nonce: crypto.randomUUID(),
  })
}

export async function loadRecipientConversation(token: string) {
  return invoke<{
    conversation: { id: string; status: string; last_message_at: string | null } | null
    messages: RecipientConversationMessage[]
  }>({ action: "load_conversation", token })
}

export async function sendRecipientMessage(token: string, body: string) {
  return invoke<{ message_id: string; sent_at: string }>({
    action: "send_recipient_message",
    token,
    body,
    client_nonce: crypto.randomUUID(),
  })
}

export async function requestExtendedProfile(token: string, sections: string[]) {
  return invoke<{ request: { id: string; status: string; created_at: string } }>({
    action: "request_extended_profile",
    token,
    sections,
  })
}

export function recipientReviewUrl(token: string, applicationReference = issuedApplicationReferences.get(token) ?? "") {
  if (!isValidRecipientApplicationReference(applicationReference)) {
    throw namedError("application_reference_required", "A stable application reference is required before KLEIO can create a recipient review URL.")
  }
  if (typeof window === "undefined") {
    const params = new URLSearchParams({ application: applicationReference, token })
    return `/application-review/?${params.toString()}`
  }
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim().replace(/^\/+|\/+$/g, "")
  const url = new URL(`${basePath ? `/${basePath}` : ""}/application-review/`, window.location.origin)
  url.searchParams.set("application", applicationReference)
  url.searchParams.set("token", token)
  return url.toString()
}

export function buildMailtoHref(input: { recipient: string; subject: string; body: string; reviewUrl?: string }) {
  const body = [
    input.body.trim(),
    input.reviewUrl ? `View the complete application in KLEIO:\n${input.reviewUrl}` : "",
  ].filter(Boolean).join("\n\n")
  const params = new URLSearchParams({ subject: input.subject, body })
  return `mailto:${encodeURIComponent(input.recipient)}?${params.toString()}`
}
