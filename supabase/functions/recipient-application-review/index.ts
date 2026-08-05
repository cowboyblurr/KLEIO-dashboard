import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, type User } from "npm:@supabase/supabase-js@2.110.5"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
}

const publicEventTypes = new Set([
  "secure_link_opened",
  "application_page_viewed",
  "artwork_detail_opened",
  "cv_viewed",
  "individual_file_downloaded",
  "full_package_downloaded",
  "receipt_confirmed",
  "question_drafted",
  "extended_profile_requested",
  "institution_signup_started",
])

const safeMetadataKeys = new Set([
  "artwork_id",
  "document_kind",
  "file_label",
  "surface",
  "source",
  "reason",
  "section",
  "viewport",
])

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  })
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeEmail(value: unknown) {
  return text(value).toLowerCase()
}

function validEmail(value: string) {
  return value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function randomToken(bytes = 32) {
  const values = crypto.getRandomValues(new Uint8Array(bytes))
  return Array.from(values, (value) => value.toString(16).padStart(2, "0")).join("")
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function cleanMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  const output: Record<string, string | number | boolean | null> = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!safeMetadataKeys.has(key)) continue
    if (typeof raw === "string") output[key] = raw.slice(0, 180)
    else if (typeof raw === "number" && Number.isFinite(raw)) output[key] = raw
    else if (typeof raw === "boolean" || raw === null) output[key] = raw
  }
  return output
}

async function authenticatedUser(request: Request): Promise<User | null> {
  const authorization = request.headers.get("Authorization") ?? ""
  const token = authorization.replace(/^Bearer\s+/i, "").trim()
  if (!token) return null
  const { data, error } = await admin.auth.getUser(token)
  return error ? null : data.user
}

async function recordEvent(input: {
  accessId: string
  packageId: string
  artistUserId: string
  eventType: string
  actorKind: "guest" | "recipient" | "artist" | "system"
  evidenceLevel: "self_reported" | "system_observed" | "recipient_confirmed" | "provider_confirmed"
  idempotencyKey: string
  metadata?: unknown
}) {
  const { error } = await admin.from("application_recipient_events").upsert({
    access_id: input.accessId,
    package_id: input.packageId,
    artist_user_id: input.artistUserId,
    event_type: input.eventType,
    actor_kind: input.actorKind,
    evidence_level: input.evidenceLevel,
    idempotency_key: input.idempotencyKey.slice(0, 180),
    metadata: cleanMetadata(input.metadata),
  }, { onConflict: "idempotency_key", ignoreDuplicates: true })
  if (error) throw error
}

async function loadAccess(plainToken: string) {
  if (!/^[a-f0-9]{64}$/.test(plainToken)) return { error: "invalid_token" as const }
  const tokenHash = await sha256(plainToken)
  const { data, error } = await admin
    .from("application_recipient_access")
    .select("id, package_id, artist_user_id, approved_snapshot, visible_sections, activity_disclosure_version, data_scope, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle()
  if (error) throw error
  if (!data) return { error: "invalid_token" as const }
  if (data.revoked_at) return { error: "revoked" as const, access: data }
  if (new Date(data.expires_at).getTime() <= Date.now()) return { error: "expired" as const, access: data }
  return { access: data }
}

async function signedAsset(path: unknown, expiresIn = 900) {
  const normalized = text(path)
  if (!normalized) return null
  const { data, error } = await admin.storage.from("artist-assets").createSignedUrl(normalized, expiresIn)
  return error ? null : data.signedUrl
}

async function hydrateSnapshot(snapshot: Record<string, unknown>) {
  const portfolio = Array.isArray(snapshot.portfolio)
    ? await Promise.all(snapshot.portfolio.map(async (raw) => {
        const work = raw && typeof raw === "object" ? raw as Record<string, unknown> : {}
        return {
          id: text(work.id),
          title: text(work.title),
          year: text(work.year),
          medium: text(work.medium),
          dimensions: text(work.dimensions),
          description: text(work.description),
          image_url: await signedAsset(work.image_path),
        }
      }))
    : []
  const documents = snapshot.documents && typeof snapshot.documents === "object"
    ? snapshot.documents as Record<string, unknown>
    : {}
  return {
    ...snapshot,
    portfolio,
    documents: { ...documents, cv_url: await signedAsset(documents.cv_file_path) },
  }
}

async function resolveConversationForUser(accessId: string, user: User) {
  const email = normalizeEmail(user.email)
  if (!email) return null
  const { data: identity, error: identityError } = await admin
    .from("application_recipient_identities")
    .select("id, package_id, email, identity_state, verified_at")
    .eq("access_id", accessId)
    .eq("auth_user_id", user.id)
    .eq("email", email)
    .maybeSingle()
  if (identityError) throw identityError
  if (!identity?.verified_at) return null
  const { data: conversation, error } = await admin
    .from("application_recipient_conversations")
    .select("id, package_id, artist_user_id, recipient_identity_id, status, last_message_at, created_at")
    .eq("package_id", identity.package_id)
    .eq("recipient_identity_id", identity.id)
    .maybeSingle()
  if (error) throw error
  return conversation ? { identity, conversation } : null
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405)

  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const action = text(body.action)

    if (action === "create_access") {
      const user = await authenticatedUser(request)
      if (!user) return json({ error: "authentication_required" }, 401)
      const packageId = text(body.package_id)
      if (!validUuid(packageId)) return json({ error: "invalid_package" }, 400)

      const { data: packageRow, error } = await admin
        .from("application_packages")
        .select("id, artist_user_id, opportunity_id, state, readiness, requirement_snapshot, passport_snapshot, portfolio_snapshot, written_content, email_preview, external_destination, approval_confirmations, artist_approved_at, data_scope, opportunities(title, provider_name, submission_method, submission_email, submission_instructions, data_scope)")
        .eq("id", packageId)
        .eq("artist_user_id", user.id)
        .maybeSingle()
      if (error) throw error
      if (!packageRow) return json({ error: "package_not_found" }, 404)

      const confirmations = packageRow.approval_confirmations && typeof packageRow.approval_confirmations === "object"
        ? Object.values(packageRow.approval_confirmations as Record<string, unknown>)
        : []
      if (!packageRow.artist_approved_at || confirmations.length < 4 || !confirmations.every(Boolean)) {
        return json({ error: "artist_approval_required" }, 409)
      }

      const opportunity = Array.isArray(packageRow.opportunities) ? packageRow.opportunities[0] : packageRow.opportunities
      const token = randomToken()
      const tokenHash = await sha256(token)
      const now = new Date().toISOString()
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const emailPreview = packageRow.email_preview && typeof packageRow.email_preview === "object"
        ? packageRow.email_preview as Record<string, unknown>
        : {}
      const written = packageRow.written_content && typeof packageRow.written_content === "object"
        ? packageRow.written_content as Record<string, unknown>
        : {}
      const passport = packageRow.passport_snapshot && typeof packageRow.passport_snapshot === "object"
        ? packageRow.passport_snapshot as Record<string, unknown>
        : {}

      const approvedSnapshot = {
        reference: packageRow.id,
        approved_at: packageRow.artist_approved_at,
        data_scope: packageRow.data_scope,
        synthetic_notice: packageRow.data_scope === "synthetic_test"
          ? "Internal workflow test. This is not a real grant, residency, exhibition, institution, or funding opportunity."
          : "",
        opportunity: {
          id: packageRow.opportunity_id,
          title: opportunity?.title ?? "Application",
          provider_name: opportunity?.provider_name ?? "",
          submission_method: opportunity?.submission_method ?? "unknown",
        },
        artist: {
          professional_name: text(passport.professional_name) || "Artist",
          location: text(passport.location),
          bio: text(passport.bio),
          artist_statement: text(passport.artist_statement),
          website_url: text(passport.website_url),
        },
        introduction: text(written.email_introduction) || text(emailPreview.body),
        opportunity_response: text(written.project_proposal),
        alignment_map: Array.isArray(written.alignment_map) ? written.alignment_map : [],
        portfolio: Array.isArray(packageRow.portfolio_snapshot) ? packageRow.portfolio_snapshot : [],
        documents: {
          cv_file_path: text(passport.cv_file_path),
          attachment_labels: Array.isArray(emailPreview.attachments) ? emailPreview.attachments : [],
        },
      }

      await admin
        .from("application_recipient_access")
        .update({ revoked_at: now, updated_at: now })
        .eq("package_id", packageId)
        .is("revoked_at", null)

      const { data: access, error: insertError } = await admin
        .from("application_recipient_access")
        .insert({
          package_id: packageId,
          artist_user_id: user.id,
          token_hash: tokenHash,
          token_hint: token.slice(-8),
          approved_snapshot: approvedSnapshot,
          visible_sections: {
            artist: true,
            introduction: true,
            opportunity_response: true,
            portfolio: true,
            documents: true,
            extended_profile: false,
          },
          data_scope: packageRow.data_scope,
          expires_at: expiresAt,
        })
        .select("id, expires_at, data_scope")
        .single()
      if (insertError) throw insertError
      return json({ token, access_id: access.id, expires_at: access.expires_at, data_scope: access.data_scope })
    }

    if (action === "revoke_access") {
      const user = await authenticatedUser(request)
      if (!user) return json({ error: "authentication_required" }, 401)
      const packageId = text(body.package_id)
      const { data, error } = await admin
        .from("application_recipient_access")
        .update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("package_id", packageId)
        .eq("artist_user_id", user.id)
        .is("revoked_at", null)
        .select("id, package_id, artist_user_id")
      if (error) throw error
      for (const access of data ?? []) {
        await recordEvent({ accessId: access.id, packageId: access.package_id, artistUserId: access.artist_user_id, eventType: "access_revoked", actorKind: "artist", evidenceLevel: "system_observed", idempotencyKey: `access-revoked:${access.id}` })
      }
      return json({ revoked: (data ?? []).length })
    }

    if (action === "list_events") {
      const user = await authenticatedUser(request)
      if (!user) return json({ error: "authentication_required" }, 401)
      const packageId = text(body.package_id)
      const { data, error } = await admin
        .from("application_recipient_events")
        .select("id, event_type, actor_kind, evidence_level, metadata, created_at")
        .eq("package_id", packageId)
        .eq("artist_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100)
      if (error) throw error
      return json({ events: data ?? [] })
    }

    const token = text(body.token)
    const resolved = await loadAccess(token)
    if (resolved.error) {
      if (resolved.access) {
        await recordEvent({
          accessId: resolved.access.id,
          packageId: resolved.access.package_id,
          artistUserId: resolved.access.artist_user_id,
          eventType: resolved.error === "expired" ? "access_expired" : "access_revoked",
          actorKind: "system",
          evidenceLevel: "system_observed",
          idempotencyKey: `${resolved.error}:${resolved.access.id}`,
        })
      }
      return json({ error: resolved.error }, resolved.error === "invalid_token" ? 404 : 410)
    }
    const access = resolved.access!

    if (action === "view") {
      const idempotencyKey = text(body.idempotency_key) || `view:${access.id}:${new Date().toISOString().slice(0, 13)}`
      await recordEvent({ accessId: access.id, packageId: access.package_id, artistUserId: access.artist_user_id, eventType: "application_page_viewed", actorKind: "guest", evidenceLevel: "system_observed", idempotencyKey, metadata: body.metadata })
      const snapshot = await hydrateSnapshot(access.approved_snapshot as Record<string, unknown>)
      const user = await authenticatedUser(request)
      const conversation = user ? await resolveConversationForUser(access.id, user) : null
      return json({
        access: { id: access.id, expires_at: access.expires_at, data_scope: access.data_scope, activity_disclosure_version: access.activity_disclosure_version },
        snapshot,
        recipient: user ? { email: user.email ?? "", verified: Boolean(conversation) } : null,
        conversation_id: conversation?.conversation.id ?? null,
      })
    }

    if (action === "record_event") {
      const eventType = text(body.event_type)
      if (!publicEventTypes.has(eventType)) return json({ error: "unsupported_event" }, 400)
      const idempotencyKey = text(body.idempotency_key)
      if (!idempotencyKey) return json({ error: "idempotency_key_required" }, 400)
      await recordEvent({
        accessId: access.id,
        packageId: access.package_id,
        artistUserId: access.artist_user_id,
        eventType,
        actorKind: "guest",
        evidenceLevel: eventType === "receipt_confirmed" ? "recipient_confirmed" : "system_observed",
        idempotencyKey,
        metadata: body.metadata,
      })
      return json({ recorded: true })
    }

    if (action === "prepare_question") {
      const recipientEmail = normalizeEmail(body.email)
      const messageBody = text(body.body)
      if (!validEmail(recipientEmail)) return json({ error: "valid_email_required" }, 400)
      if (!messageBody || messageBody.length > 4000) return json({ error: "question_length_invalid" }, 400)

      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { count, error: rateError } = await admin
        .from("application_recipient_message_drafts")
        .select("id", { count: "exact", head: true })
        .eq("access_id", access.id)
        .gte("created_at", since)
      if (rateError) throw rateError
      if ((count ?? 0) >= 8) return json({ error: "too_many_requests" }, 429)

      const draftToken = randomToken()
      const draftTokenHash = await sha256(draftToken)
      const { data: draft, error } = await admin
        .from("application_recipient_message_drafts")
        .insert({ access_id: access.id, package_id: access.package_id, recipient_email: recipientEmail, body: messageBody, draft_token_hash: draftTokenHash, status: "verification_requested" })
        .select("id, expires_at")
        .single()
      if (error) throw error
      await recordEvent({ accessId: access.id, packageId: access.package_id, artistUserId: access.artist_user_id, eventType: "question_drafted", actorKind: "guest", evidenceLevel: "system_observed", idempotencyKey: `question-drafted:${draft.id}` })
      return json({ draft_token: draftToken, expires_at: draft.expires_at, email: recipientEmail })
    }

    if (action === "verify_and_send") {
      const user = await authenticatedUser(request)
      if (!user) return json({ error: "authentication_required" }, 401)
      const userEmail = normalizeEmail(user.email)
      const draftToken = text(body.draft_token)
      if (!userEmail || !draftToken) return json({ error: "verified_email_and_draft_required" }, 400)
      const draftTokenHash = await sha256(draftToken)
      const { data: draft, error: draftError } = await admin
        .from("application_recipient_message_drafts")
        .select("id, access_id, package_id, recipient_email, body, status, expires_at")
        .eq("access_id", access.id)
        .eq("draft_token_hash", draftTokenHash)
        .maybeSingle()
      if (draftError) throw draftError
      if (!draft) return json({ error: "draft_not_found" }, 404)
      if (draft.status === "sent") return json({ error: "draft_already_sent" }, 409)
      if (new Date(draft.expires_at).getTime() <= Date.now()) return json({ error: "draft_expired" }, 410)
      if (draft.recipient_email !== userEmail) return json({ error: "verified_email_mismatch" }, 403)

      const now = new Date().toISOString()
      const { data: identity, error: identityError } = await admin
        .from("application_recipient_identities")
        .upsert({ access_id: access.id, package_id: access.package_id, auth_user_id: user.id, email: userEmail, identity_state: "email_verified", verified_at: now, updated_at: now }, { onConflict: "access_id,email" })
        .select("id, email, identity_state, verified_at")
        .single()
      if (identityError) throw identityError

      const { data: conversation, error: conversationError } = await admin
        .from("application_recipient_conversations")
        .upsert({ package_id: access.package_id, artist_user_id: access.artist_user_id, recipient_identity_id: identity.id, status: "active", last_message_at: now, updated_at: now }, { onConflict: "package_id,recipient_identity_id" })
        .select("id, status, last_message_at")
        .single()
      if (conversationError) throw conversationError

      const clientNonce = text(body.client_nonce)
      const nonce = validUuid(clientNonce) ? clientNonce : crypto.randomUUID()
      const { data: message, error: messageError } = await admin
        .from("application_recipient_messages")
        .upsert({ conversation_id: conversation.id, sender_kind: "recipient", sender_user_id: null, sender_recipient_identity_id: identity.id, body: draft.body, client_nonce: nonce }, { onConflict: "conversation_id,client_nonce" })
        .select("id, created_at")
        .single()
      if (messageError) throw messageError

      await admin.from("application_recipient_message_drafts").update({ status: "sent", sent_at: now, updated_at: now }).eq("id", draft.id)
      await recordEvent({ accessId: access.id, packageId: access.package_id, artistUserId: access.artist_user_id, eventType: "recipient_email_verified", actorKind: "recipient", evidenceLevel: "provider_confirmed", idempotencyKey: `recipient-email-verified:${access.id}:${user.id}` })
      await recordEvent({ accessId: access.id, packageId: access.package_id, artistUserId: access.artist_user_id, eventType: "conversation_started", actorKind: "recipient", evidenceLevel: "recipient_confirmed", idempotencyKey: `conversation-started:${conversation.id}` })
      return json({ conversation_id: conversation.id, message_id: message.id, sent_at: message.created_at })
    }

    if (action === "load_conversation") {
      const user = await authenticatedUser(request)
      if (!user) return json({ error: "authentication_required" }, 401)
      const resolvedConversation = await resolveConversationForUser(access.id, user)
      if (!resolvedConversation) return json({ conversation: null, messages: [] })
      const { data: messages, error } = await admin
        .from("application_recipient_messages")
        .select("id, sender_kind, body, created_at")
        .eq("conversation_id", resolvedConversation.conversation.id)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
      if (error) throw error
      return json({ conversation: resolvedConversation.conversation, messages: messages ?? [] })
    }

    if (action === "send_recipient_message") {
      const user = await authenticatedUser(request)
      if (!user) return json({ error: "authentication_required" }, 401)
      const resolvedConversation = await resolveConversationForUser(access.id, user)
      if (!resolvedConversation || resolvedConversation.conversation.status !== "active") return json({ error: "active_conversation_required" }, 403)
      const messageBody = text(body.body)
      if (!messageBody || messageBody.length > 4000) return json({ error: "message_length_invalid" }, 400)
      const clientNonce = text(body.client_nonce)
      const nonce = validUuid(clientNonce) ? clientNonce : crypto.randomUUID()
      const { data: message, error } = await admin
        .from("application_recipient_messages")
        .upsert({ conversation_id: resolvedConversation.conversation.id, sender_kind: "recipient", sender_user_id: null, sender_recipient_identity_id: resolvedConversation.identity.id, body: messageBody, client_nonce: nonce }, { onConflict: "conversation_id,client_nonce" })
        .select("id, created_at")
        .single()
      if (error) throw error
      await admin.from("application_recipient_conversations").update({ last_message_at: message.created_at, updated_at: message.created_at }).eq("id", resolvedConversation.conversation.id)
      return json({ message_id: message.id, sent_at: message.created_at })
    }

    if (action === "request_extended_profile") {
      const user = await authenticatedUser(request)
      if (!user) return json({ error: "authentication_required" }, 401)
      const resolvedConversation = await resolveConversationForUser(access.id, user)
      if (!resolvedConversation) return json({ error: "verified_recipient_required" }, 403)
      const sections = Array.isArray(body.sections)
        ? body.sections.map(text).filter((value) => ["expanded_portfolio", "exhibition_history", "professional_bio", "collaboration_availability"].includes(value)).slice(0, 4)
        : []
      const { data: requestRow, error } = await admin
        .from("application_extended_profile_requests")
        .insert({ access_id: access.id, package_id: access.package_id, artist_user_id: access.artist_user_id, recipient_identity_id: resolvedConversation.identity.id, status: "requested", requested_sections: sections })
        .select("id, status, created_at")
        .single()
      if (error) {
        if (error.code === "23505") return json({ error: "request_already_pending" }, 409)
        throw error
      }
      await recordEvent({ accessId: access.id, packageId: access.package_id, artistUserId: access.artist_user_id, eventType: "extended_profile_requested", actorKind: "recipient", evidenceLevel: "recipient_confirmed", idempotencyKey: `extended-profile-requested:${requestRow.id}` })
      return json({ request: requestRow })
    }

    return json({ error: "unsupported_action" }, 400)
  } catch (error) {
    console.error("recipient-application-review", error)
    return json({ error: "request_failed", message: error instanceof Error ? error.message : "The request could not be completed." }, 500)
  }
})
