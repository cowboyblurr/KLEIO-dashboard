import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, type User } from "npm:@supabase/supabase-js@2.110.5"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const APP_ORIGIN = (Deno.env.get("KLEIO_APP_ORIGIN") ?? "https://www.kleioarthouse.com").replace(/\/$/, "")
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? ""
const EMAIL_FROM = Deno.env.get("KLEIO_EMAIL_FROM") ?? ""

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  })
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

async function authenticatedUser(request: Request): Promise<User | null> {
  const authorization = request.headers.get("Authorization") ?? ""
  const token = authorization.replace(/^Bearer\s+/i, "").trim()
  if (!token) return null
  const { data, error } = await admin.auth.getUser(token)
  return error ? null : data.user
}

async function recipientConversationForUser(conversationId: string, user: User) {
  const { data: conversation, error: conversationError } = await admin
    .from("application_recipient_conversations")
    .select("id, package_id, artist_user_id, recipient_identity_id, status, last_message_at, created_at")
    .eq("id", conversationId)
    .maybeSingle()
  if (conversationError) throw conversationError
  if (!conversation) return null

  const { data: identity, error: identityError } = await admin
    .from("application_recipient_identities")
    .select("id, email, display_name, organization_name, auth_user_id, verified_at")
    .eq("id", conversation.recipient_identity_id)
    .eq("auth_user_id", user.id)
    .maybeSingle()
  if (identityError) throw identityError
  if (!identity?.verified_at) return null
  return { conversation, identity }
}

async function activeSnapshot(packageId: string) {
  const { data, error } = await admin
    .from("application_recipient_access")
    .select("approved_snapshot, expires_at, revoked_at")
    .eq("package_id", packageId)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  const snapshot = data?.approved_snapshot && typeof data.approved_snapshot === "object"
    ? data.approved_snapshot as Record<string, unknown>
    : {}
  const artist = snapshot.artist && typeof snapshot.artist === "object" ? snapshot.artist as Record<string, unknown> : {}
  const opportunity = snapshot.opportunity && typeof snapshot.opportunity === "object" ? snapshot.opportunity as Record<string, unknown> : {}
  return {
    artistName: text(artist.professional_name) || "The artist",
    opportunityTitle: text(opportunity.title) || "this application",
  }
}

async function sendReplyNotification(input: {
  recipientEmail: string
  conversationId: string
  artistName: string
  opportunityTitle: string
}) {
  if (!RESEND_API_KEY || !EMAIL_FROM) return { status: "unconfigured" as const }

  const redirectTo = `${APP_ORIGIN}/application-review/conversation/?conversation=${encodeURIComponent(input.conversationId)}`
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: input.recipientEmail,
    options: { redirectTo },
  })
  if (linkError || !linkData?.properties?.action_link) return { status: "failed" as const }

  const artistName = escapeHtml(input.artistName)
  const opportunityTitle = escapeHtml(input.opportunityTitle)
  const actionLink = escapeHtml(linkData.properties.action_link)
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [input.recipientEmail],
      subject: `${input.artistName} replied to your KLEIO application conversation`,
      html: `<div style="font-family:Arial,sans-serif;color:#2d2931;line-height:1.6;max-width:560px;margin:auto;padding:32px 20px"><p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#77658d;font-weight:700">KLEIO application conversation</p><h1 style="font-family:Georgia,serif;font-size:28px;line-height:1.15;margin:12px 0">${artistName} replied.</h1><p>Your conversation about <strong>${opportunityTitle}</strong> is preserved with the application in KLEIO.</p><p style="margin:28px 0"><a href="${actionLink}" style="display:inline-block;background:#403653;color:white;text-decoration:none;border-radius:999px;padding:11px 18px;font-weight:700">Open conversation</a></p><p style="font-size:12px;color:#7b737e">This secure link verifies the same email identity you used when starting the conversation. Creating a full institution workspace remains optional.</p></div>`,
    }),
  })

  return response.ok ? { status: "sent" as const } : { status: "failed" as const }
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405)

  try {
    const user = await authenticatedUser(request)
    if (!user) return json({ error: "authentication_required" }, 401)

    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const action = text(body.action)
    const conversationId = text(body.conversation_id)
    if (!validUuid(conversationId)) return json({ error: "valid_conversation_required" }, 400)

    if (action === "send_artist_reply") {
      const messageBody = text(body.body)
      if (!messageBody || messageBody.length > 4000) return json({ error: "message_length_invalid" }, 400)

      const { data: conversation, error: conversationError } = await admin
        .from("application_recipient_conversations")
        .select("id, package_id, artist_user_id, recipient_identity_id, status")
        .eq("id", conversationId)
        .eq("artist_user_id", user.id)
        .maybeSingle()
      if (conversationError) throw conversationError
      if (!conversation || conversation.status !== "active") return json({ error: "active_conversation_required" }, 403)

      const { data: identity, error: identityError } = await admin
        .from("application_recipient_identities")
        .select("id, email, verified_at")
        .eq("id", conversation.recipient_identity_id)
        .maybeSingle()
      if (identityError) throw identityError
      if (!identity?.verified_at || !identity.email) return json({ error: "verified_recipient_required" }, 409)

      const nonce = crypto.randomUUID()
      const { data: message, error: messageError } = await admin
        .from("application_recipient_messages")
        .insert({
          conversation_id: conversation.id,
          sender_kind: "artist",
          sender_user_id: user.id,
          sender_recipient_identity_id: null,
          body: messageBody,
          client_nonce: nonce,
        })
        .select("id, conversation_id, sender_kind, body, created_at")
        .single()
      if (messageError) throw messageError

      const { error: updateError } = await admin
        .from("application_recipient_conversations")
        .update({ last_message_at: message.created_at, updated_at: message.created_at })
        .eq("id", conversation.id)
        .eq("artist_user_id", user.id)
      if (updateError) throw updateError

      const context = await activeSnapshot(conversation.package_id)
      const notification = await sendReplyNotification({
        recipientEmail: identity.email,
        conversationId: conversation.id,
        artistName: context.artistName,
        opportunityTitle: context.opportunityTitle,
      }).catch(() => ({ status: "failed" as const }))

      return json({ message, notification_status: notification.status })
    }

    if (action === "resume_recipient_conversation") {
      const resolved = await recipientConversationForUser(conversationId, user)
      if (!resolved) return json({ error: "conversation_not_available" }, 403)
      const context = await activeSnapshot(resolved.conversation.package_id)
      const { data: messages, error: messagesError } = await admin
        .from("application_recipient_messages")
        .select("id, sender_kind, body, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
      if (messagesError) throw messagesError
      return json({
        conversation: resolved.conversation,
        recipient: {
          email: resolved.identity.email,
          display_name: resolved.identity.display_name,
          organization_name: resolved.identity.organization_name,
        },
        context,
        messages: messages ?? [],
      })
    }

    if (action === "send_recipient_reply") {
      const resolved = await recipientConversationForUser(conversationId, user)
      if (!resolved || resolved.conversation.status !== "active") return json({ error: "active_conversation_required" }, 403)
      const messageBody = text(body.body)
      if (!messageBody || messageBody.length > 4000) return json({ error: "message_length_invalid" }, 400)

      const { data: message, error: messageError } = await admin
        .from("application_recipient_messages")
        .insert({
          conversation_id: conversationId,
          sender_kind: "recipient",
          sender_user_id: null,
          sender_recipient_identity_id: resolved.identity.id,
          body: messageBody,
          client_nonce: crypto.randomUUID(),
        })
        .select("id, sender_kind, body, created_at")
        .single()
      if (messageError) throw messageError

      const { error: updateError } = await admin
        .from("application_recipient_conversations")
        .update({ last_message_at: message.created_at, updated_at: message.created_at })
        .eq("id", conversationId)
      if (updateError) throw updateError
      return json({ message })
    }

    return json({ error: "unsupported_action" }, 400)
  } catch (error) {
    return json({ error: "request_failed", message: error instanceof Error ? error.message : "The request could not be completed." }, 500)
  }
})
