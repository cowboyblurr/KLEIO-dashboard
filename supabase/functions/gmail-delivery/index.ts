import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, type User } from "npm:@supabase/supabase-js@2.110.5"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_GMAIL_CLIENT_ID") ?? ""
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_GMAIL_CLIENT_SECRET") ?? ""
const PUBLIC_ORIGIN = (Deno.env.get("KLEIO_PUBLIC_ORIGIN") ?? "https://www.kleioarthouse.com").replace(/\/$/, "")
const OAUTH_REDIRECT_URI = `${SUPABASE_URL}/functions/v1/gmail-delivery`
const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send"
const REQUESTED_SCOPES = ["openid", "email", GMAIL_SEND_SCOPE]
const MAX_RAW_MESSAGE_BYTES = 24 * 1024 * 1024

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store",
}

type Json = Record<string, unknown>
type Attachment = { filename: string; mimeType: string; bytes: Uint8Array; path: string }

type SendClaim = {
  status: string
  delivery_id?: string
  claim_id?: string
  package_id?: string
  destination?: string
  provider_reference?: string
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  })
}

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "no-store" } })
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function object(value: unknown): Json {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Json : {}
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : []
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function validReturnPath(value: string) {
  return /^\/artist-dashboard\/(?:[a-z0-9/_-]*)(?:\?[a-z0-9%&=._~-]*)?$/i.test(value) && !value.includes("//")
}

function randomHex(bytes = 32) {
  const values = crypto.getRandomValues(new Uint8Array(bytes))
  return Array.from(values, (value) => value.toString(16).padStart(2, "0")).join("")
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function base64(bytes: Uint8Array) {
  let binary = ""
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)))
  }
  return btoa(binary)
}

function base64Url(bytes: Uint8Array) {
  return base64(bytes).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "")
}

function wrapBase64(value: string) {
  return value.match(/.{1,76}/g)?.join("\r\n") ?? value
}

function headerValue(value: string) {
  const clean = value.replace(/[\r\n]+/g, " ").trim()
  if (/^[\x20-\x7E]*$/.test(clean)) return clean
  return `=?UTF-8?B?${base64(new TextEncoder().encode(clean))}?=`
}

function safeFilename(value: string, fallback = "KLEIO-file") {
  const clean = value.trim().replace(/[\r\n"\\/]+/g, "-").replace(/[^\p{L}\p{N}._ -]+/gu, "").trim()
  return (clean || fallback).slice(0, 140)
}

function extension(path: string) {
  const match = path.split("?")[0]?.match(/\.([A-Za-z0-9]{1,8})$/)
  return match ? `.${match[1].toLowerCase()}` : ""
}

function mimeFromPath(path: string) {
  const ext = extension(path)
  return ({
    ".pdf": "application/pdf", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
    ".doc": "application/msword", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".ppt": "application/vnd.ms-powerpoint", ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".csv": "text/csv", ".txt": "text/plain", ".zip": "application/zip", ".mp4": "video/mp4", ".mov": "video/quicktime",
    ".mp3": "audio/mpeg", ".wav": "audio/wav", ".srt": "application/x-subrip", ".vtt": "text/vtt",
  } as Record<string, string>)[ext] ?? "application/octet-stream"
}

function oauthConfigured() {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && SUPABASE_URL && SERVICE_ROLE_KEY)
}

async function authenticatedUser(request: Request): Promise<User | null> {
  const authorization = request.headers.get("Authorization") ?? ""
  const bearer = authorization.replace(/^Bearer\s+/i, "").trim()
  if (!bearer) return null
  const { data, error } = await admin.auth.getUser(bearer)
  return error ? null : data.user
}

function authorizationHeader(request: Request) {
  return request.headers.get("Authorization") ?? ""
}

async function connectionStatus(userId: string) {
  const { data, error } = await admin
    .from("external_connections")
    .select("id,status,provider_account_email,scopes,connected_at,last_error_code,last_error_message,updated_at")
    .eq("artist_user_id", userId)
    .eq("provider", "gmail")
    .maybeSingle()
  if (error) throw error
  return {
    configured: oauthConfigured(),
    connected: data?.status === "connected",
    requires_reauth: data?.status === "needs_reauth",
    account_email: data?.provider_account_email ?? "",
    scopes: Array.isArray(data?.scopes) ? data.scopes : [],
    connected_at: data?.connected_at ?? null,
    last_error_code: data?.last_error_code ?? "",
    last_error_message: data?.last_error_message ?? "",
    updated_at: data?.updated_at ?? null,
  }
}

async function consumeOAuthState(rawState: string) {
  const stateHash = await sha256(rawState)
  const now = new Date().toISOString()
  const { data, error } = await admin
    .from("gmail_oauth_states")
    .update({ used_at: now })
    .eq("state_hash", stateHash)
    .is("used_at", null)
    .gt("expires_at", now)
    .select("id,artist_user_id,return_path,expires_at")
    .maybeSingle()
  if (error) throw error
  return data
}

function callbackDestination(returnPath: string, params: Record<string, string>) {
  const url = new URL(validReturnPath(returnPath) ? returnPath : "/artist-dashboard/applications/", PUBLIC_ORIGIN)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return url.toString()
}

async function exchangeAuthorizationCode(code: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: OAUTH_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  })
  const payload = await response.json().catch(() => ({})) as Json
  if (!response.ok) throw new Error(`google_token_exchange_failed:${text(payload.error) || response.status}`)
  return payload
}

async function googleUserInfo(accessToken: string) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const payload = await response.json().catch(() => ({})) as Json
  if (!response.ok) throw new Error(`google_userinfo_failed:${response.status}`)
  return payload
}

async function refreshGoogleAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })
  const payload = await response.json().catch(() => ({})) as Json
  if (!response.ok) {
    const error = new Error(text(payload.error) || `google_refresh_failed_${response.status}`)
    error.name = text(payload.error) || "google_refresh_failed"
    throw error
  }
  const accessToken = text(payload.access_token)
  if (!accessToken) throw new Error("google_access_token_missing")
  return accessToken
}

async function createRecipientAccessThroughBoundary(request: Request, packageId: string, submissionVersionId: string) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/recipient-application-review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorizationHeader(request),
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action: "create_access", package_id: packageId, submission_version_id: submissionVersionId }),
  })
  const payload = await response.json().catch(() => ({})) as Json
  if (!response.ok) {
    const error = new Error(text(payload.message) || text(payload.error) || "recipient_access_failed")
    error.name = text(payload.error) || "recipient_access_failed"
    throw error
  }
  return {
    token: text(payload.token),
    accessId: text(payload.access_id),
    submissionVersionId: text(payload.submission_version_id),
    expiresAt: text(payload.expires_at),
  }
}

async function revokeRecipientAccessThroughBoundary(request: Request, packageId: string) {
  await fetch(`${SUPABASE_URL}/functions/v1/recipient-application-review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorizationHeader(request),
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action: "revoke_access", package_id: packageId }),
  }).catch(() => undefined)
}

async function loadImmutableSubmission(userId: string, submissionVersionId: string) {
  const { data, error } = await admin
    .from("application_submission_versions")
    .select("id,package_id,artist_user_id,opportunity_id,version_number,submission_method,destination,snapshot,data_scope,finalized_at")
    .eq("id", submissionVersionId)
    .eq("artist_user_id", userId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error("submission_version_not_found")
  if (data.submission_method !== "email") throw new Error("gmail_delivery_requires_email_submission")
  return data
}

async function loadGmailSecret(userId: string) {
  const { data, error } = await admin.rpc("get_gmail_connection_secret_service", { target_artist_user_id: userId })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  if (!row || row.status !== "connected" || !row.refresh_token) throw new Error("gmail_connection_required")
  return {
    connectionId: String(row.connection_id),
    accountEmail: String(row.account_email || ""),
    scopes: Array.isArray(row.scopes) ? row.scopes.map(String) : [],
    refreshToken: String(row.refresh_token),
  }
}

async function downloadPrivateAsset(userId: string, path: string, preferredFilename: string, preferredMime = "") {
  if (!path || path.includes("..") || !path.startsWith(`${userId}/`)) throw new Error("gmail_attachment_ownership_unverified")
  const { data, error } = await admin.storage.from("artist-assets").download(path)
  if (error || !data) throw new Error("gmail_attachment_unavailable")
  const bytes = new Uint8Array(await data.arrayBuffer())
  return {
    filename: safeFilename(preferredFilename || path.split("/").at(-1) || "KLEIO-file"),
    mimeType: preferredMime || data.type || mimeFromPath(path),
    bytes,
    path,
  } satisfies Attachment
}

async function buildAttachments(userId: string, snapshot: Json) {
  const attachments: Attachment[] = []
  const seenPaths = new Set<string>()
  const packageItems = Array.isArray(snapshot.package_items) ? snapshot.package_items : []
  const sourceIds = Array.from(new Set(packageItems.flatMap((raw) => {
    const item = object(raw)
    const sourceId = text(item.source_id)
    return item.included_in_package === true && validUuid(sourceId) ? [sourceId] : []
  })))

  if (sourceIds.length) {
    const { data, error } = await admin
      .from("artist_import_sources")
      .select("id,storage_path,original_filename,media_type")
      .eq("artist_user_id", userId)
      .in("id", sourceIds)
    if (error) throw error
    if ((data ?? []).length !== sourceIds.length) throw new Error("gmail_required_attachment_source_missing")
    for (const source of data ?? []) {
      const path = text(source.storage_path)
      if (!path || seenPaths.has(path)) continue
      attachments.push(await downloadPrivateAsset(userId, path, text(source.original_filename) || `KLEIO-source${extension(path)}`, text(source.media_type)))
      seenPaths.add(path)
    }
  }

  const passport = object(snapshot.passport)
  const cvPath = text(passport.cv_file_path)
  if (cvPath && !seenPaths.has(cvPath)) {
    attachments.push(await downloadPrivateAsset(userId, cvPath, `CV${extension(cvPath) || ".pdf"}`))
    seenPaths.add(cvPath)
  }

  const portfolio = Array.isArray(snapshot.portfolio) ? snapshot.portfolio : []
  for (const raw of portfolio) {
    const work = object(raw)
    const imagePath = text(work.image_path)
    if (!imagePath || seenPaths.has(imagePath)) continue
    const title = text(work.title) || "Artwork"
    attachments.push(await downloadPrivateAsset(userId, imagePath, `${title}${extension(imagePath) || ".jpg"}`))
    seenPaths.add(imagePath)
  }

  return attachments
}

function buildReviewUrl(token: string) {
  const url = new URL("/application-review/", PUBLIC_ORIGIN)
  url.searchParams.set("token", token)
  return url.toString()
}

function buildRawMessage(input: {
  from: string
  to: string
  subject: string
  body: string
  reviewUrl: string
  submissionVersionId: string
  attachments: Attachment[]
}) {
  const boundary = `kleio-${crypto.randomUUID()}`
  const messageId = `<kleio-${input.submissionVersionId}@kleioarthouse.com>`
  const body = [input.body.trim(), "", "View the complete application in KLEIO:", input.reviewUrl].join("\r\n")
  const lines = [
    `From: ${headerValue(input.from)}`,
    `To: ${headerValue(input.to)}`,
    `Subject: ${headerValue(input.subject)}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
  ]

  if (!input.attachments.length) {
    lines.push("Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: 8bit", "", body)
  } else {
    lines.push(`Content-Type: multipart/mixed; boundary=\"${boundary}\"`, "", `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: 8bit", "", body)
    for (const attachment of input.attachments) {
      lines.push(
        `--${boundary}`,
        `Content-Type: ${attachment.mimeType}; name=\"${attachment.filename}\"`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename=\"${attachment.filename}\"`,
        "",
        wrapBase64(base64(attachment.bytes)),
      )
    }
    lines.push(`--${boundary}--`)
  }

  const rawBytes = new TextEncoder().encode(lines.join("\r\n"))
  if (rawBytes.byteLength > MAX_RAW_MESSAGE_BYTES) throw new Error("gmail_message_too_large")
  return { raw: base64Url(rawBytes), byteLength: rawBytes.byteLength }
}

async function markConnectionNeedsReauth(userId: string, code: string, message: string) {
  await admin.from("external_connections").update({
    status: "needs_reauth",
    last_error_code: code.slice(0, 120),
    last_error_message: message.slice(0, 500),
    updated_at: new Date().toISOString(),
  }).eq("artist_user_id", userId).eq("provider", "gmail")
}

async function markDeliveryResult(input: {
  userId: string
  deliveryId: string
  claimId: string
  result: "accepted" | "failed" | "unknown"
  providerReference?: string
  errorCode?: string
  errorMessage?: string
}) {
  const { data, error } = await admin.rpc("mark_gmail_delivery_result_service", {
    target_artist_user_id: input.userId,
    target_delivery_id: input.deliveryId,
    target_claim_id: input.claimId,
    target_result: input.result,
    target_provider_reference: input.providerReference ?? "",
    target_error_code: input.errorCode ?? "",
    target_error_message: input.errorMessage ?? "",
  })
  if (error) throw error
  return data
}

async function handleCallback(request: Request) {
  const url = new URL(request.url)
  const rawState = url.searchParams.get("state")?.trim() ?? ""
  if (!rawState) return redirect(callbackDestination("/artist-dashboard/applications/", { gmail: "error", code: "oauth_state_missing" }))

  const stateRow = await consumeOAuthState(rawState)
  if (!stateRow) return redirect(callbackDestination("/artist-dashboard/applications/", { gmail: "error", code: "oauth_state_invalid" }))
  const returnPath = String(stateRow.return_path || "/artist-dashboard/applications/")

  const oauthError = url.searchParams.get("error")?.trim() ?? ""
  if (oauthError) return redirect(callbackDestination(returnPath, { gmail: "error", code: oauthError }))
  const code = url.searchParams.get("code")?.trim() ?? ""
  if (!code || !oauthConfigured()) return redirect(callbackDestination(returnPath, { gmail: "error", code: oauthConfigured() ? "oauth_code_missing" : "gmail_not_configured" }))

  try {
    const tokenPayload = await exchangeAuthorizationCode(code)
    const accessToken = text(tokenPayload.access_token)
    const refreshToken = text(tokenPayload.refresh_token)
    const grantedScopes = text(tokenPayload.scope).split(/\s+/).filter(Boolean)
    if (!accessToken) throw new Error("google_access_token_missing")
    if (!refreshToken) throw new Error("google_refresh_token_missing")
    if (!grantedScopes.includes(GMAIL_SEND_SCOPE)) throw new Error("gmail_send_scope_missing")

    const profile = await googleUserInfo(accessToken)
    const accountId = text(profile.sub)
    const accountEmail = text(profile.email).toLowerCase()
    if (!accountId || !accountEmail || profile.email_verified === false) throw new Error("google_verified_email_missing")

    const { error } = await admin.rpc("store_gmail_connection_secret_service", {
      target_artist_user_id: stateRow.artist_user_id,
      target_refresh_token: refreshToken,
      target_account_id: accountId,
      target_account_email: accountEmail,
      target_scopes: grantedScopes,
    })
    if (error) throw error

    return redirect(callbackDestination(returnPath, { gmail: "connected" }))
  } catch (reason) {
    console.error("gmail-delivery oauth callback", reason instanceof Error ? reason.name : "error")
    return redirect(callbackDestination(returnPath, { gmail: "error", code: reason instanceof Error ? reason.message.split(":")[0].slice(0, 100) : "oauth_callback_failed" }))
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (request.method === "GET") return handleCallback(request)
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405)

  try {
    const user = await authenticatedUser(request)
    if (!user) return json({ error: "authentication_required" }, 401)
    const body = await request.json().catch(() => ({})) as Json
    const action = text(body.action)

    if (action === "status") return json(await connectionStatus(user.id))

    if (action === "connect") {
      if (!oauthConfigured()) return json({ error: "gmail_not_configured", message: "Gmail one-click sending is not configured yet. The normal email fallback remains available." }, 503)
      const returnPath = text(body.return_path)
      const safeReturnPath = validReturnPath(returnPath) ? returnPath : "/artist-dashboard/applications/"
      const rawState = randomHex()
      const { error } = await admin.from("gmail_oauth_states").insert({
        artist_user_id: user.id,
        state_hash: await sha256(rawState),
        return_path: safeReturnPath,
      })
      if (error) throw error

      const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
      authorizationUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID)
      authorizationUrl.searchParams.set("redirect_uri", OAUTH_REDIRECT_URI)
      authorizationUrl.searchParams.set("response_type", "code")
      authorizationUrl.searchParams.set("scope", REQUESTED_SCOPES.join(" "))
      authorizationUrl.searchParams.set("access_type", "offline")
      authorizationUrl.searchParams.set("include_granted_scopes", "true")
      authorizationUrl.searchParams.set("prompt", "consent")
      authorizationUrl.searchParams.set("state", rawState)
      return json({ authorization_url: authorizationUrl.toString(), redirect_uri: OAUTH_REDIRECT_URI, scopes: REQUESTED_SCOPES })
    }

    if (action === "disconnect") {
      const { data } = await admin.rpc("get_gmail_connection_secret_service", { target_artist_user_id: user.id })
      const row = Array.isArray(data) ? data[0] : data
      const refreshToken = row?.refresh_token ? String(row.refresh_token) : ""
      if (refreshToken) {
        await fetch("https://oauth2.googleapis.com/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token: refreshToken }),
        }).catch(() => undefined)
      }
      const { data: disconnected, error } = await admin.rpc("disconnect_gmail_connection_service", { target_artist_user_id: user.id })
      if (error) throw error
      return json({ disconnected: Boolean(disconnected) })
    }

    if (action === "send") {
      if (!oauthConfigured()) return json({ error: "gmail_not_configured" }, 503)
      const submissionVersionId = text(body.submission_version_id)
      if (!validUuid(submissionVersionId)) return json({ error: "invalid_submission_version" }, 400)

      const version = await loadImmutableSubmission(user.id, submissionVersionId)
      const { data: claimData, error: claimError } = await admin.rpc("claim_gmail_delivery_send_service", {
        target_artist_user_id: user.id,
        target_submission_version_id: submissionVersionId,
      })
      if (claimError) throw claimError
      const claim = object(claimData) as SendClaim
      if (claim.status === "already_sent") return json({ status: "already_sent", provider_reference: claim.provider_reference ?? "", message: "This preserved version was already accepted by connected Gmail." })
      if (claim.status === "send_in_progress") return json({ error: "gmail_send_in_progress", message: "This application is already being sent from another tab or request." }, 409)
      if (claim.status === "provider_status_unknown") return json({ error: "gmail_provider_status_unknown", message: "KLEIO could not confirm the previous Gmail attempt. Check Gmail Sent before attempting another delivery path." }, 409)
      if (claim.status === "cancelled") return json({ error: "gmail_delivery_cancelled" }, 409)
      if (claim.status !== "claimed" || !validUuid(claim.delivery_id ?? "") || !validUuid(claim.claim_id ?? "")) throw new Error("gmail_send_claim_failed")
      const deliveryId = claim.delivery_id!
      const claimId = claim.claim_id!
      const packageId = String(version.package_id)

      let access: { token: string; accessId: string; submissionVersionId: string; expiresAt: string } | null = null
      let providerCallStarted = false
      try {
        access = await createRecipientAccessThroughBoundary(request, packageId, submissionVersionId)
        if (!access.token || access.submissionVersionId !== submissionVersionId) throw new Error("gmail_recipient_access_version_mismatch")
        const { error: attachError } = await admin.rpc("attach_gmail_delivery_access_service", {
          target_artist_user_id: user.id,
          target_delivery_id: deliveryId,
          target_claim_id: claimId,
          target_recipient_access_id: access.accessId,
        })
        if (attachError) throw attachError

        const gmail = await loadGmailSecret(user.id)
        if (!gmail.scopes.includes(GMAIL_SEND_SCOPE)) throw new Error("gmail_send_scope_missing")
        let accessToken = ""
        try {
          accessToken = await refreshGoogleAccessToken(gmail.refreshToken)
        } catch (reason) {
          if (reason instanceof Error && reason.name === "invalid_grant") {
            await markConnectionNeedsReauth(user.id, "invalid_grant", "Google revoked or expired the Gmail authorization. Reconnect Gmail before sending again.")
            throw Object.assign(new Error("gmail_reauthorization_required"), { name: "gmail_reauthorization_required" })
          }
          throw reason
        }

        const snapshot = object(version.snapshot)
        const emailPreview = object(snapshot.email_preview)
        const recipient = text(emailPreview.to) || text(version.destination)
        const subject = text(emailPreview.subject) || `Application — ${text(object(snapshot.opportunity).title) || "KLEIO"}`
        const emailBody = text(emailPreview.body)
        if (!recipient) throw new Error("gmail_delivery_destination_missing")
        if (recipient !== text(version.destination)) throw new Error("gmail_destination_version_mismatch")

        const attachments = await buildAttachments(user.id, snapshot)
        const rawMessage = buildRawMessage({
          from: gmail.accountEmail,
          to: recipient,
          subject,
          body: emailBody,
          reviewUrl: buildReviewUrl(access.token),
          submissionVersionId,
          attachments,
        })

        providerCallStarted = true
        let sendResponse: Response
        try {
          sendResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ raw: rawMessage.raw }),
          })
        } catch (reason) {
          await markDeliveryResult({ userId: user.id, deliveryId, claimId, result: "unknown", errorCode: "gmail_network_unknown", errorMessage: reason instanceof Error ? reason.message : "Network status unknown" })
          return json({ error: "gmail_provider_status_unknown", message: "KLEIO lost the provider response after starting the Gmail send. Check Gmail Sent before using another delivery path." }, 502)
        }

        const providerPayload = await sendResponse.json().catch(() => ({})) as Json
        if (!sendResponse.ok) {
          const providerCode = text(object(providerPayload.error).status) || text(object(providerPayload.error).message) || `gmail_http_${sendResponse.status}`
          if (sendResponse.status >= 500) {
            await markDeliveryResult({ userId: user.id, deliveryId, claimId, result: "unknown", errorCode: providerCode, errorMessage: "Gmail returned an ambiguous server error after the send request started." })
            return json({ error: "gmail_provider_status_unknown", message: "Gmail returned an ambiguous server response. Check Gmail Sent before using another delivery path." }, 502)
          }
          await markDeliveryResult({ userId: user.id, deliveryId, claimId, result: "failed", errorCode: providerCode, errorMessage: text(object(providerPayload.error).message) || `Gmail rejected the send with HTTP ${sendResponse.status}.` })
          await revokeRecipientAccessThroughBoundary(request, packageId)
          return json({ error: "gmail_send_rejected", message: "Gmail did not accept the application send. Nothing is marked sent; the normal email fallback remains available." }, 502)
        }

        const messageId = text(providerPayload.id)
        if (!messageId) {
          await markDeliveryResult({ userId: user.id, deliveryId, claimId, result: "unknown", errorCode: "gmail_message_id_missing", errorMessage: "Gmail returned success without a message identifier." })
          return json({ error: "gmail_provider_status_unknown", message: "Gmail returned an incomplete success response. Check Gmail Sent before using another delivery path." }, 502)
        }

        const delivery = await markDeliveryResult({ userId: user.id, deliveryId, claimId, result: "accepted", providerReference: messageId })
        return json({
          status: "provider_accepted",
          provider: "google_gmail",
          provider_reference: messageId,
          recipient,
          attachment_count: attachments.length,
          raw_message_bytes: rawMessage.byteLength,
          review_access_expires_at: access.expiresAt,
          delivery,
          message: "Connected Gmail accepted the outgoing application message. This is not proof the institution received or read it.",
        })
      } catch (reason) {
        const code = reason instanceof Error ? (reason.name && reason.name !== "Error" ? reason.name : reason.message) : "gmail_send_failed"
        if (!providerCallStarted) {
          await markDeliveryResult({ userId: user.id, deliveryId, claimId, result: "failed", errorCode: code.slice(0, 120), errorMessage: reason instanceof Error ? reason.message : "Gmail send preparation failed." }).catch(() => undefined)
          if (access) await revokeRecipientAccessThroughBoundary(request, packageId)
        }
        if (code === "gmail_message_too_large") return json({ error: code, message: "This finalized application is too large for safe one-click Gmail delivery. Nothing was sent; use the normal email fallback or reduce the attachment package." }, 413)
        if (code === "active_access_exists") return json({ error: code, message: "A tracked recipient handoff is already active. Revoke it intentionally before switching delivery channels." }, 409)
        if (code === "gmail_reauthorization_required") return json({ error: code, message: "Reconnect Gmail before sending. The finalized application and Review Room remain intact." }, 409)
        throw reason
      }
    }

    return json({ error: "unsupported_action" }, 400)
  } catch (reason) {
    console.error("gmail-delivery", reason instanceof Error ? reason.name : "error")
    return json({ error: "request_failed", message: reason instanceof Error ? reason.message : "The Gmail delivery request could not be completed." }, 500)
  }
})
