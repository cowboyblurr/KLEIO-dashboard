import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, type User } from "https://esm.sh/@supabase/supabase-js@2.110.5"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const INSTAGRAM_APP_ID = Deno.env.get("META_INSTAGRAM_APP_ID") ?? ""
const INSTAGRAM_APP_SECRET = Deno.env.get("META_INSTAGRAM_APP_SECRET") ?? ""
const TOKEN_KEY_MATERIAL = Deno.env.get("META_INSTAGRAM_TOKEN_ENCRYPTION_KEY") || INSTAGRAM_APP_SECRET
const API_VERSION = (Deno.env.get("META_INSTAGRAM_API_VERSION") || "v25.0").replace(/^\/+|\/+$/g, "")
const REDIRECT_URI = "https://trekynurdgxgtaaqqtyq.supabase.co/functions/v1/instagram-import"
const PUBLIC_ORIGIN = (Deno.env.get("KLEIO_PUBLIC_ORIGIN") || "https://kleioarthouse.com").replace(/\/+$/, "")
const MEDIA_BUCKET = "artist-assets"
const MAX_MEDIA_PAGE = 50
const MAX_IMPORT_ITEMS = 20
const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const OAUTH_WINDOW_MS = 15 * 60 * 1000
const OAUTH_PROCESSING_STALE_MS = 2 * 60 * 1000
const OAUTH_MAX_STARTS = 5
const TOKEN_REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const encoder = new TextEncoder()
const decoder = new TextDecoder()

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

type JsonRecord = Record<string, unknown>
type InstagramConnection = {
  artist_user_id: string
  instagram_user_id: string
  username: string
  account_type: string
  media_count: number | null
  access_token_ciphertext: string
  access_token_iv: string
  token_expires_at: string | null
  granted_scopes: string[]
  connected_at: string
  refreshed_at: string | null
  last_verified_at: string | null
  disconnected_at: string | null
  last_error_category: string
  metadata: JsonRecord
  updated_at: string
}
type InstagramMedia = {
  id: string
  caption?: string
  media_type?: string
  media_product_type?: string
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp?: string
  username?: string
  children?: { data?: InstagramMedia[] }
}
type PreparedField = {
  value: string
  status: "extracted" | "suggested" | "missing" | "edited" | "confirmed"
  source: string
  confidence: "strong_source_match" | "possible_suggestion" | "needs_artist_confirmation"
}

function allowedOrigins() {
  const configured = (Deno.env.get("KLEIO_ALLOWED_ORIGINS") || "")
    .split(",")
    .map((value) => value.trim().replace(/\/+$/, ""))
    .filter(Boolean)
  return new Set([
    PUBLIC_ORIGIN,
    "https://www.kleioarthouse.com",
    "https://cowboyblurr.github.io",
    ...configured,
  ])
}

function requestOrigin(req: Request) {
  return (req.headers.get("origin") || "").replace(/\/+$/, "")
}

function corsHeaders(req: Request) {
  const origin = requestOrigin(req)
  const allowed = allowedOrigins()
  return {
    "Access-Control-Allow-Origin": allowed.has(origin) ? origin : PUBLIC_ORIGIN,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  }
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  })
}

function htmlResponse(markup: string, status = 200) {
  return new Response(markup, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    },
  })
}

function errorCode(reason: unknown) {
  if (reason instanceof Error && reason.message) return reason.message
  return "instagram_request_failed"
}

function cleanText(value: unknown, max = 5_000) {
  return typeof value === "string" ? value.replace(/\0/g, "").trim().slice(0, max) : ""
}

function idText(value: unknown, max = 120) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim().slice(0, max) : ""
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {}
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ""
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + 0x8000, bytes.length)))
  }
  return btoa(binary)
}

function base64ToBytes(value: string) {
  const binary = atob(value)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function base64Url(bytes: Uint8Array) {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

async function sha256Text(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

async function sha256Bytes(value: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", value)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

async function tokenKey() {
  if (!TOKEN_KEY_MATERIAL) throw new Error("instagram_encryption_not_configured")
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`kleio-instagram-token-v1:${TOKEN_KEY_MATERIAL}`))
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"])
}

async function encryptToken(token: string, artistUserId: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encoder.encode(`artist:${artistUserId}`) },
    await tokenKey(),
    encoder.encode(token),
  )
  return { ciphertext: bytesToBase64(new Uint8Array(ciphertext)), iv: bytesToBase64(iv) }
}

async function decryptToken(connection: InstagramConnection) {
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToBytes(connection.access_token_iv),
      additionalData: encoder.encode(`artist:${connection.artist_user_id}`),
    },
    await tokenKey(),
    base64ToBytes(connection.access_token_ciphertext),
  )
  return decoder.decode(plaintext)
}

function isConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY && INSTAGRAM_APP_ID && INSTAGRAM_APP_SECRET && TOKEN_KEY_MATERIAL)
}

function assertAllowedOrigin(req: Request) {
  const origin = requestOrigin(req)
  if (origin && !allowedOrigins().has(origin)) throw new Error("request_origin_not_allowed")
}

async function requireArtist(req: Request): Promise<User> {
  const authorization = req.headers.get("authorization") || ""
  if (!authorization.toLowerCase().startsWith("bearer ")) throw new Error("authentication_required")
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await authClient.auth.getUser()
  if (error || !data.user) throw new Error("authentication_required")
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle()
  if (profileError || profile?.role !== "artist") throw new Error("artist_workspace_required")
  return data.user
}

function validateReturnUrl(value: unknown) {
  const fallback = `${PUBLIC_ORIGIN}/artist-dashboard/import/`
  const candidate = cleanText(value, 2_000) || fallback
  let parsed: URL
  try { parsed = new URL(candidate) } catch { return fallback }
  if (!allowedOrigins().has(parsed.origin) || !parsed.pathname.startsWith("/artist-dashboard/")) return fallback
  parsed.hash = ""
  return parsed.href
}

function graphUrls(path: string) {
  const normalized = path.replace(/^\/+/, "")
  return [
    `https://graph.instagram.com/${API_VERSION}/${normalized}`,
    `https://graph.instagram.com/${normalized}`,
  ]
}

async function metaJson(url: string, token: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      ...(init?.headers || {}),
    },
  })
  const data = await response.json().catch(() => ({})) as JsonRecord
  if (!response.ok || data.error) {
    const meta = asRecord(data.error)
    const category = idText(meta.code, 40) || `http_${response.status}`
    throw new Error(`instagram_api_${category}`)
  }
  return data
}

async function firstMetaJson(path: string, token: string) {
  let last: unknown = new Error("instagram_api_unavailable")
  for (const url of graphUrls(path)) {
    try { return await metaJson(url, token) } catch (reason) { last = reason }
  }
  throw last
}

class InstagramOAuthError extends Error {
  diagnostics: JsonRecord

  constructor(category: string, diagnostics: JsonRecord = {}) {
    super(category)
    this.name = "InstagramOAuthError"
    this.diagnostics = diagnostics
  }
}

function oauthDiagnostics(reason: unknown) {
  return reason instanceof InstagramOAuthError ? reason.diagnostics : {}
}

function normalizeCodeExchangeFailure(data: JsonRecord, status: number) {
  const nested = asRecord(data.error)
  const type = cleanText(nested.type || data.error_type, 100)
  const code = idText(nested.code ?? data.code, 40)
  const subcode = idText(nested.error_subcode ?? data.error_subcode, 40)
  const rawMessage = cleanText(nested.message || data.error_message || data.message, 500).toLowerCase()
  const category = rawMessage.includes("redirect_uri") || rawMessage.includes("redirect uri")
    ? "instagram_code_exchange_redirect_mismatch"
    : rawMessage.includes("verification code") || rawMessage.includes("invalid code") || rawMessage.includes("authorization code")
      ? "instagram_code_exchange_invalid_code"
      : rawMessage.includes("client") || code === "101"
        ? "instagram_code_exchange_invalid_client"
        : status === 429 || rawMessage.includes("rate")
          ? "instagram_code_exchange_rate_limited"
          : status >= 500
            ? "instagram_code_exchange_network_error"
            : "instagram_code_exchange_unknown"
  return {
    category,
    diagnostics: {
      http_status: status,
      error_type: type,
      error_code: code,
      error_subcode: subcode,
    },
  }
}

async function exchangeAuthorizationCode(code: string) {
  const body = new FormData()
  body.set("client_id", INSTAGRAM_APP_ID)
  body.set("client_secret", INSTAGRAM_APP_SECRET)
  body.set("grant_type", "authorization_code")
  body.set("redirect_uri", REDIRECT_URI)
  body.set("code", code.replace(/#_$/, ""))
  let response: Response
  try {
    response = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Accept": "application/json" },
      body,
    })
  } catch {
    throw new InstagramOAuthError("instagram_code_exchange_network_error")
  }
  const data = await response.json().catch(() => ({})) as JsonRecord
  if (!response.ok || !cleanText(data.access_token) || !idText(data.user_id, 120)) {
    const failure = normalizeCodeExchangeFailure(data, response.status)
    throw new InstagramOAuthError(failure.category, failure.diagnostics)
  }
  return {
    accessToken: cleanText(data.access_token, 5_000),
    userId: idText(data.user_id, 120),
    permissions: Array.isArray(data.permissions) ? data.permissions.map((value) => cleanText(value, 100)).filter(Boolean) : [],
    expiresIn: Number(data.expires_in) || 3_600,
  }
}

async function exchangeLongLivedToken(shortToken: string) {
  const url = new URL("https://graph.instagram.com/access_token")
  url.searchParams.set("grant_type", "ig_exchange_token")
  url.searchParams.set("client_secret", INSTAGRAM_APP_SECRET)
  url.searchParams.set("access_token", shortToken)
  const response = await fetch(url, { headers: { "Accept": "application/json" } })
  const data = await response.json().catch(() => ({})) as JsonRecord
  if (!response.ok || !cleanText(data.access_token)) return null
  return { accessToken: cleanText(data.access_token, 5_000), expiresIn: Number(data.expires_in) || 60 * 24 * 60 * 60 }
}

async function refreshLongLivedToken(token: string) {
  const url = new URL("https://graph.instagram.com/refresh_access_token")
  url.searchParams.set("grant_type", "ig_refresh_token")
  url.searchParams.set("access_token", token)
  const response = await fetch(url, { headers: { "Accept": "application/json" } })
  const data = await response.json().catch(() => ({})) as JsonRecord
  if (!response.ok || !cleanText(data.access_token)) throw new Error("instagram_token_refresh_failed")
  return { accessToken: cleanText(data.access_token, 5_000), expiresIn: Number(data.expires_in) || 60 * 24 * 60 * 60 }
}

async function profileFor(instagramUserId: string, token: string) {
  const fields = "id,username,account_type,media_count"
  const data = await firstMetaJson(`${encodeURIComponent(instagramUserId)}?fields=${encodeURIComponent(fields)}`, token)
  return {
    id: idText(data.id, 120) || instagramUserId,
    username: cleanText(data.username, 120),
    accountType: cleanText(data.account_type, 80),
    mediaCount: Number.isFinite(Number(data.media_count)) ? Number(data.media_count) : null,
  }
}

async function connectionFor(artistUserId: string) {
  const { data, error } = await admin
    .from("artist_instagram_connections")
    .select("*")
    .eq("artist_user_id", artistUserId)
    .is("disconnected_at", null)
    .maybeSingle()
  if (error) throw error
  return data as InstagramConnection | null
}

async function saveConnection(input: {
  artistUserId: string
  instagramUserId: string
  username: string
  accountType: string
  mediaCount: number | null
  accessToken: string
  expiresIn: number
  scopes: string[]
}) {
  const encrypted = await encryptToken(input.accessToken, input.artistUserId)
  const now = new Date()
  const tokenExpiresAt = new Date(now.getTime() + Math.max(input.expiresIn, 3_600) * 1_000).toISOString()
  const { error } = await admin.from("artist_instagram_connections").upsert({
    artist_user_id: input.artistUserId,
    instagram_user_id: input.instagramUserId,
    username: input.username,
    account_type: input.accountType,
    media_count: input.mediaCount,
    access_token_ciphertext: encrypted.ciphertext,
    access_token_iv: encrypted.iv,
    token_expires_at: tokenExpiresAt,
    granted_scopes: input.scopes.length ? input.scopes : ["instagram_business_basic"],
    connected_at: now.toISOString(),
    refreshed_at: now.toISOString(),
    last_verified_at: now.toISOString(),
    disconnected_at: null,
    last_error_category: "",
    metadata: { api_version: API_VERSION, login_type: "instagram_login" },
    updated_at: now.toISOString(),
  }, { onConflict: "artist_user_id" })
  if (error) throw error
  await logEvent(input.artistUserId, "connected", input.instagramUserId, 0, { account_type: input.accountType })
  return tokenExpiresAt
}

async function activeToken(connection: InstagramConnection) {
  let token = await decryptToken(connection)
  const expiresAt = connection.token_expires_at ? Date.parse(connection.token_expires_at) : 0
  if (expiresAt && expiresAt - Date.now() <= TOKEN_REFRESH_WINDOW_MS) {
    const refreshed = await refreshLongLivedToken(token)
    token = refreshed.accessToken
    const encrypted = await encryptToken(token, connection.artist_user_id)
    const nextExpiry = new Date(Date.now() + refreshed.expiresIn * 1_000).toISOString()
    const { error } = await admin.from("artist_instagram_connections").update({
      access_token_ciphertext: encrypted.ciphertext,
      access_token_iv: encrypted.iv,
      token_expires_at: nextExpiry,
      refreshed_at: new Date().toISOString(),
      last_error_category: "",
      updated_at: new Date().toISOString(),
    }).eq("artist_user_id", connection.artist_user_id)
    if (error) throw error
  }
  return token
}

async function logEvent(artistUserId: string, eventType: string, instagramUserId: string | null, mediaCount = 0, metadata: JsonRecord = {}) {
  try {
    const { error } = await admin.from("artist_instagram_import_events").insert({
      artist_user_id: artistUserId,
      event_type: eventType,
      instagram_user_id: instagramUserId,
      media_count: mediaCount,
      metadata,
    })
    if (error) console.warn("instagram_event_log_failed", { code: error.code || "unknown" })
  } catch {
    console.warn("instagram_event_log_failed")
  }
}

type OAuthPopupKind = "success" | "expired" | "cancelled" | "invalid" | "consumed" | "in_progress" | "failed"

function popupCopy(kind: OAuthPopupKind) {
  if (kind === "success") return {
    title: "Instagram connected",
    body: "Your Instagram account is connected to KLEIO. This window can close.",
  }
  if (kind === "expired") return {
    title: "This connection attempt expired",
    body: "Return to KLEIO and start a fresh Instagram connection.",
  }
  if (kind === "cancelled") return {
    title: "Instagram authorization was cancelled",
    body: "Nothing was connected. Return to KLEIO whenever you are ready to try again.",
  }
  if (kind === "consumed") return {
    title: "This connection link was already used",
    body: "Return to KLEIO and start a fresh Instagram connection.",
  }
  if (kind === "in_progress") return {
    title: "Instagram connection is already processing",
    body: "Return to KLEIO and wait a moment before trying again.",
  }
  if (kind === "invalid") return {
    title: "Instagram connection could not be verified",
    body: "Return to KLEIO and start the connection again.",
  }
  return {
    title: "Instagram connection needs attention",
    body: "KLEIO could not complete this connection. Return to KLEIO and try again.",
  }
}

function popupHtml(input: { kind: OAuthPopupKind; returnUrl: string; username?: string }) {
  const copy = popupCopy(input.kind)
  const payload = JSON.stringify({
    type: "kleio-instagram-oauth",
    success: input.kind === "success",
    message: `instagram_oauth_${input.kind}`,
    username: input.username || "",
  }).replace(/</g, "\u003c")
  const target = JSON.stringify(new URL(input.returnUrl).origin)
  const returnUrl = JSON.stringify(input.returnUrl)
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${copy.title}</title><style>body{font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:#fcfbfe;color:#292631}.card{max-width:34rem;margin:2rem;padding:2rem;border:1px solid #e2dcf1;border-radius:24px;background:white;box-shadow:0 24px 70px rgba(82,64,130,.12)}h1{font-family:Georgia,serif;margin:0 0 .75rem;font-size:1.75rem}p{line-height:1.65;color:#6f6879}a{color:#5b4b8a;font-weight:700}</style></head>
<body><main class="card"><h1>${copy.title}</h1><p>${copy.body}</p><p><a href=${returnUrl}>Return to KLEIO</a></p></main>
<script>
const payload=${payload};const target=${target};const returnUrl=${returnUrl};
try{if(window.opener&&!window.opener.closed){window.opener.postMessage(payload,target);setTimeout(()=>window.close(),250)}else{window.location.replace(returnUrl+(returnUrl.includes("?")?"&":"?")+"instagram="+(payload.success?"connected":"error"))}}catch{window.location.replace(returnUrl)}
</script></body></html>`
}

async function handleOAuthCallback(_req: Request, url: URL) {
  const state = cleanText(url.searchParams.get("state"), 500)
  const code = cleanText(url.searchParams.get("code"), 5_000)
  const oauthError = cleanText(url.searchParams.get("error") || url.searchParams.get("error_reason"), 200)
  const fallbackUrl = `${PUBLIC_ORIGIN}/artist-dashboard/import/`
  if (!state) return htmlResponse(popupHtml({ kind: "invalid", returnUrl: fallbackUrl }), 400)

  const stateHash = await sha256Text(state)
  const claimStartedAt = new Date().toISOString()
  const staleBefore = new Date(Date.now() - OAUTH_PROCESSING_STALE_MS).toISOString()
  const { data: stored, error: claimError } = await admin
    .from("artist_instagram_oauth_states")
    .update({ processing_at: claimStartedAt })
    .eq("state_hash", stateHash)
    .is("used_at", null)
    .gt("expires_at", claimStartedAt)
    .or(`processing_at.is.null,processing_at.lt.${staleBefore}`)
    .select("id,artist_user_id,return_url,created_at,expires_at,used_at,processing_at")
    .maybeSingle()

  if (claimError) return htmlResponse(popupHtml({ kind: "failed", returnUrl: fallbackUrl }), 500)
  if (!stored) {
    const { data: existing } = await admin
      .from("artist_instagram_oauth_states")
      .select("id,artist_user_id,return_url,created_at,expires_at,used_at,processing_at")
      .eq("state_hash", stateHash)
      .maybeSingle()
    const returnUrl = existing?.return_url ? validateReturnUrl(existing.return_url) : fallbackUrl
    const kind: OAuthPopupKind = !existing
      ? "invalid"
      : existing.used_at
        ? "consumed"
        : Date.parse(existing.expires_at) <= Date.now()
          ? "expired"
          : "in_progress"
    if (existing?.artist_user_id) {
      const event = kind === "expired" ? "state_expired" : kind === "consumed" ? "state_already_consumed" : "state_in_progress"
      await logEvent(existing.artist_user_id, event, null)
    }
    return htmlResponse(popupHtml({ kind, returnUrl }), kind === "in_progress" ? 409 : 400)
  }

  const returnUrl = validateReturnUrl(stored.return_url)
  const stateAgeSeconds = Math.max(0, Math.round((Date.now() - Date.parse(stored.created_at)) / 1_000))
  await logEvent(stored.artist_user_id, "callback_received", null, 0, { state_age_seconds: stateAgeSeconds })

  if (oauthError || !code) {
    await admin.from("artist_instagram_oauth_states").update({
      used_at: new Date().toISOString(),
      processing_at: null,
      last_failure_category: "authorization_cancelled",
    }).eq("id", stored.id).is("used_at", null)
    await logEvent(stored.artist_user_id, "connection_cancelled", null, 0, { category: oauthError || "missing_code" })
    return htmlResponse(popupHtml({ kind: "cancelled", returnUrl }), 400)
  }

  try {
    if (!isConfigured()) throw new Error("instagram_not_configured")
    const short = await exchangeAuthorizationCode(code)
    await logEvent(stored.artist_user_id, "token_received", short.userId)
    if (short.permissions.length && !short.permissions.includes("instagram_business_basic")) throw new Error("instagram_basic_permission_missing")
    const long = await exchangeLongLivedToken(short.accessToken)
    const accessToken = long?.accessToken || short.accessToken
    const expiresIn = long?.expiresIn || short.expiresIn
    const profile = await profileFor(short.userId, accessToken)
    await logEvent(stored.artist_user_id, "profile_verified", profile.id || short.userId, 0, { account_type: profile.accountType })
    await saveConnection({
      artistUserId: stored.artist_user_id,
      instagramUserId: profile.id || short.userId,
      username: profile.username,
      accountType: profile.accountType,
      mediaCount: profile.mediaCount,
      accessToken,
      expiresIn,
      scopes: short.permissions,
    })
    const { error: consumeError } = await admin.from("artist_instagram_oauth_states").update({
      used_at: new Date().toISOString(),
      processing_at: null,
      last_failure_category: "",
    }).eq("id", stored.id).is("used_at", null)
    if (consumeError) throw new Error("instagram_state_consume_failed")
    return htmlResponse(popupHtml({ kind: "success", returnUrl, username: profile.username }))
  } catch (reason) {
    const category = errorCode(reason)
    await admin.from("artist_instagram_oauth_states").update({
      processing_at: null,
      last_failure_category: category,
    }).eq("id", stored.id).is("used_at", null)
    await admin.from("artist_instagram_connections").update({
      last_error_category: category,
      updated_at: new Date().toISOString(),
    }).eq("artist_user_id", stored.artist_user_id)
    const event = category.startsWith("instagram_code_exchange_") ? "code_exchange_failed" : "connection_failed"
    await logEvent(stored.artist_user_id, event, null, 0, { category, ...oauthDiagnostics(reason) })
    return htmlResponse(popupHtml({ kind: "failed", returnUrl }), 502)
  }
}

function normalizeCursor(value: unknown) {
  const cursor = cleanText(value, 600)
  return /^[A-Za-z0-9_\-=:.]+$/.test(cursor) ? cursor : ""
}

function normalizeMedia(value: unknown): InstagramMedia | null {
  const record = asRecord(value)
  const id = idText(record.id, 120)
  if (!id) return null
  const childrenData = asRecord(record.children).data
  return {
    id,
    caption: cleanText(record.caption, 10_000),
    media_type: cleanText(record.media_type, 40),
    media_product_type: cleanText(record.media_product_type, 40),
    media_url: safeDisplayUrl(record.media_url),
    thumbnail_url: safeDisplayUrl(record.thumbnail_url),
    permalink: safePermalink(record.permalink),
    timestamp: cleanText(record.timestamp, 80),
    username: cleanText(record.username, 120),
    children: Array.isArray(childrenData)
      ? { data: childrenData.map(normalizeMedia).filter((item): item is InstagramMedia => Boolean(item)) }
      : undefined,
  }
}

function safePermalink(value: unknown) {
  const text = cleanText(value, 2_000)
  if (!text) return ""
  try {
    const url = new URL(text)
    return url.protocol === "https:" && (url.hostname === "instagram.com" || url.hostname.endsWith(".instagram.com")) ? url.href : ""
  } catch { return "" }
}

function isTrustedMediaHost(hostname: string) {
  const host = hostname.toLowerCase()
  return host === "instagram.com" || host.endsWith(".instagram.com") || host.endsWith(".cdninstagram.com") || host.endsWith(".fbcdn.net")
}

function safeDisplayUrl(value: unknown) {
  const text = cleanText(value, 4_000)
  if (!text) return ""
  try {
    const url = new URL(text)
    return url.protocol === "https:" && isTrustedMediaHost(url.hostname) ? url.href : ""
  } catch { return "" }
}

async function listMedia(connection: InstagramConnection, token: string, cursor: string) {
  const fields = "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,username,children{id,media_type,media_url,thumbnail_url}"
  const params = new URLSearchParams({ fields, limit: String(MAX_MEDIA_PAGE) })
  if (cursor) params.set("after", cursor)
  const data = await firstMetaJson(`${encodeURIComponent(connection.instagram_user_id)}/media?${params.toString()}`, token)
  const raw = Array.isArray(data.data) ? data.data : []
  const paging = asRecord(data.paging)
  const cursors = asRecord(paging.cursors)
  return {
    items: raw.map(normalizeMedia).filter((item): item is InstagramMedia => Boolean(item)),
    nextCursor: cleanText(cursors.after, 600),
  }
}

async function mediaById(mediaId: string, token: string) {
  const fields = "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,username"
  return normalizeMedia(await firstMetaJson(`${encodeURIComponent(mediaId)}?fields=${encodeURIComponent(fields)}`, token))
}

async function readLimited(response: Response, maxBytes: number) {
  const declared = Number(response.headers.get("content-length") || 0)
  if (declared > maxBytes) throw new Error("instagram_image_too_large")
  if (!response.body) throw new Error("instagram_image_unavailable")
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new Error("instagram_image_too_large")
    }
    chunks.push(value)
  }
  const output = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.byteLength }
  return output
}

function signatureMatches(bytes: Uint8Array, mime: string) {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (mime === "image/png") return bytes.length >= 8 && [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((value, index) => bytes[index] === value)
  if (mime === "image/webp") return decoder.decode(bytes.subarray(0, 4)) === "RIFF" && decoder.decode(bytes.subarray(8, 12)) === "WEBP"
  return false
}

function imageDimensions(bytes: Uint8Array, mime: string) {
  if (mime === "image/png" && bytes.length >= 24) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    return { width: view.getUint32(16), height: view.getUint32(20) }
  }
  if (mime === "image/jpeg") {
    let offset = 2
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue }
      const marker = bytes[offset + 1]
      const length = (bytes[offset + 2] << 8) + bytes[offset + 3]
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        return { height: (bytes[offset + 5] << 8) + bytes[offset + 6], width: (bytes[offset + 7] << 8) + bytes[offset + 8] }
      }
      if (!length || length < 2) break
      offset += 2 + length
    }
  }
  return { width: null, height: null }
}

async function fetchInstagramImage(input: string) {
  let url = new URL(input)
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (url.protocol !== "https:" || !isTrustedMediaHost(url.hostname)) throw new Error("instagram_media_host_not_allowed")
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)
    let response: Response
    try {
      response = await fetch(url, { redirect: "manual", signal: controller.signal, headers: { "User-Agent": "KLEIO-Instagram-Import/1.0" } })
    } finally { clearTimeout(timeout) }
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get("location")
      if (!location) throw new Error("instagram_media_redirect_invalid")
      url = new URL(location, url)
      continue
    }
    if (!response.ok) throw new Error("instagram_image_unavailable")
    const mime = (response.headers.get("content-type") || "").split(";")[0].toLowerCase()
    if (!["image/jpeg","image/png","image/webp"].includes(mime)) throw new Error("instagram_media_not_supported")
    const bytes = await readLimited(response, MAX_IMAGE_BYTES)
    if (!signatureMatches(bytes, mime)) throw new Error("instagram_image_signature_invalid")
    return { bytes, mime, finalUrl: url.href, ...imageDimensions(bytes, mime) }
  }
  throw new Error("instagram_media_redirect_limit")
}

function fileExtension(mime: string) {
  return mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg"
}

function captionTitle(caption: string) {
  const first = caption.split(/\n+/).map((line) => line.replace(/#[\p{L}\p{N}_]+/gu, "").trim()).find(Boolean) || ""
  if (!first || first.length > 120) return ""
  return first.replace(/[.!?]+$/, "").trim()
}

function captionTags(caption: string) {
  const tags = Array.from(caption.matchAll(/#([\p{L}\p{N}_]+)/gu)).map((match) => match[1].replace(/_/g, " ").trim()).filter(Boolean)
  return Array.from(new Set(tags)).slice(0, 20).join(", ")
}

function field(value: string, status: PreparedField["status"], source: string, confidence: PreparedField["confidence"]): PreparedField {
  return { value, status, source, confidence }
}

function preparedFields(media: InstagramMedia) {
  const caption = cleanText(media.caption, 10_000)
  const title = captionTitle(caption)
  const year = cleanText(media.timestamp, 80).match(/\b(19|20)\d{2}\b/)?.[0] || ""
  const tags = captionTags(caption)
  return {
    title: title
      ? field(title, "suggested", "Suggested from the first line of the Instagram caption; confirm the artwork title", "needs_artist_confirmation")
      : field("", "missing", "Artwork title was not stated clearly in the post", "needs_artist_confirmation"),
    year: year
      ? field(year, "suggested", "Based on the Instagram posting date; confirm the artwork year", "needs_artist_confirmation")
      : field("", "missing", "Artwork year was not available", "needs_artist_confirmation"),
    medium: field("", "missing", "Medium requires artist input", "needs_artist_confirmation"),
    dimensions: field("", "missing", "Physical dimensions cannot be determined from an Instagram image", "needs_artist_confirmation"),
    series: field("", "missing", "Series was not confirmed", "needs_artist_confirmation"),
    description: caption
      ? field(caption, "extracted", "Copied from the artist account's Instagram caption", "strong_source_match")
      : field("", "missing", "No caption was available", "needs_artist_confirmation"),
    tags: tags
      ? field(tags, "extracted", "Copied from hashtags in the artist account's caption", "strong_source_match")
      : field("", "missing", "No hashtags were available", "needs_artist_confirmation"),
    altText: field("", "missing", "Add an accessibility description before approval", "needs_artist_confirmation"),
  }
}

async function ensureInstagramDraft(input: {
  artistUserId: string
  sourceId: string
  providerMediaId: string
  fields: Record<string, PreparedField>
  providerMetadata: JsonRecord
  reusedExistingSource: boolean
  approved: boolean
}) {
  const status = input.approved ? "approved" : "review_ready"
  const { data, error } = await admin.from("artist_instagram_import_drafts").upsert({
    artist_user_id: input.artistUserId,
    source_id: input.sourceId,
    provider_media_id: input.providerMediaId,
    draft_fields: input.fields,
    provider_metadata: input.providerMetadata,
    reused_existing_source: input.reusedExistingSource,
    status,
    updated_at: new Date().toISOString(),
  }, { onConflict: "source_id" }).select("id,draft_fields,provider_metadata,reused_existing_source,status").single()
  if (error) throw error
  return data
}

function normalizePreparedField(value: unknown, fallback: PreparedField): PreparedField {
  const record = asRecord(value)
  const statusValue = cleanText(record.status, 40)
  const confidenceValue = cleanText(record.confidence, 80)
  return {
    value: cleanText(record.value, 10_000),
    status: (["extracted", "suggested", "missing", "edited", "confirmed"].includes(statusValue) ? statusValue : fallback.status) as PreparedField["status"],
    source: cleanText(record.source, 500) || fallback.source,
    confidence: (["strong_source_match", "possible_suggestion", "needs_artist_confirmation"].includes(confidenceValue) ? confidenceValue : fallback.confidence) as PreparedField["confidence"],
  }
}

function normalizePreparedFields(value: unknown, fallback: Record<string, PreparedField>) {
  const record = asRecord(value)
  return Object.fromEntries(Object.entries(fallback).map(([name, fieldValue]) => [name, normalizePreparedField(record[name], fieldValue)])) as Record<string, PreparedField>
}

async function preparedResponse(input: {
  source: JsonRecord
  draft: JsonRecord
  fallbackFields: Record<string, PreparedField>
}) {
  const storagePath = cleanText(input.source.storage_path, 1_000)
  if (!storagePath) throw new Error("instagram_import_not_found")
  const { data: signed, error: signedError } = await admin.storage.from(MEDIA_BUCKET).createSignedUrl(storagePath, 60 * 60)
  if (signedError) throw signedError
  const provider = asRecord(input.draft.provider_metadata)
  return {
    sourceId: idText(input.source.id, 120),
    providerMediaId: cleanText(input.draft.provider_media_id, 120),
    storagePath,
    previewUrl: signed.signedUrl,
    mimeType: cleanText(input.source.mime_type, 120),
    byteSize: Number(input.source.byte_size) || 0,
    checksum: cleanText(input.source.checksum, 128),
    width: Number(input.source.width) || null,
    height: Number(input.source.height) || null,
    permalink: cleanText(provider.permalink, 2_000),
    caption: cleanText(provider.caption, 10_000),
    timestamp: cleanText(provider.timestamp, 80),
    fields: normalizePreparedFields(input.draft.draft_fields, input.fallbackFields),
    alreadyPrepared: true,
    reusedExistingSource: input.draft.reused_existing_source === true,
    approved: input.draft.status === "approved" || input.source.extraction_status === "approved",
  }
}

async function prepareOne(input: {
  artistUserId: string
  connection: InstagramConnection
  token: string
  mediaId: string
  sessionId: string
  rightsConfirmedAt: string
}) {
  const media = await mediaById(input.mediaId, input.token)
  if (!media || media.media_type !== "IMAGE" || !media.media_url) throw new Error("instagram_image_selection_required")
  const fallbackFields = preparedFields(media)
  const providerMetadata = {
    permalink: media.permalink || "",
    caption: media.caption || "",
    timestamp: media.timestamp || "",
    media_product_type: media.media_product_type || "",
    instagram_username: input.connection.username,
  }
  const { data: existingByProvider, error: existingProviderError } = await admin
    .from("artist_import_sources")
    .select("id,storage_path,mime_type,byte_size,checksum,width,height,extraction_status,source_metadata")
    .eq("artist_user_id", input.artistUserId)
    .eq("source_type", "instagram_image")
    .eq("provider_file_id", media.id)
    .maybeSingle()
  if (existingProviderError) throw existingProviderError
  if (existingByProvider?.id && existingByProvider.storage_path) {
    const draft = await ensureInstagramDraft({
      artistUserId: input.artistUserId,
      sourceId: String(existingByProvider.id),
      providerMediaId: media.id,
      fields: fallbackFields,
      providerMetadata,
      reusedExistingSource: false,
      approved: existingByProvider.extraction_status === "approved",
    })
    return preparedResponse({ source: existingByProvider, draft, fallbackFields })
  }

  const image = await fetchInstagramImage(media.media_url)
  const checksum = await sha256Bytes(image.bytes)
  const { data: duplicate, error: duplicateError } = await admin
    .from("artist_import_sources")
    .select("id,storage_path,mime_type,byte_size,checksum,width,height,extraction_status,source_type")
    .eq("artist_user_id", input.artistUserId)
    .eq("checksum", checksum)
    .maybeSingle()
  if (duplicateError) throw duplicateError
  if (duplicate?.id && duplicate.storage_path) {
    const draft = await ensureInstagramDraft({
      artistUserId: input.artistUserId,
      sourceId: String(duplicate.id),
      providerMediaId: media.id,
      fields: fallbackFields,
      providerMetadata,
      reusedExistingSource: duplicate.source_type !== "instagram_image",
      approved: duplicate.extraction_status === "approved",
    })
    return preparedResponse({ source: duplicate, draft, fallbackFields })
  }

  const path = `${input.artistUserId}/imports/${input.sessionId}/instagram-${media.id}.${fileExtension(image.mime)}`
  const { error: uploadError } = await admin.storage.from(MEDIA_BUCKET).upload(path, image.bytes, {
    contentType: image.mime,
    cacheControl: "3600",
    upsert: false,
  })
  if (uploadError) throw uploadError

  const metadata = {
    instagram_media_id: media.id,
    instagram_user_id: input.connection.instagram_user_id,
    instagram_username: input.connection.username,
    media_product_type: media.media_product_type || "",
    caption: media.caption || "",
    post_timestamp: media.timestamp || "",
    permalink: media.permalink || "",
    rights_confirmed_at: input.rightsConfirmedAt,
    source_api: "instagram_api_with_instagram_login",
  }
  const { data: source, error: sourceError } = await admin.from("artist_import_sources").insert({
    artist_user_id: input.artistUserId,
    source_type: "instagram_image",
    label: `Instagram work ${media.timestamp ? media.timestamp.slice(0, 10) : media.id}`,
    storage_path: path,
    external_url: media.permalink || "",
    mime_type: image.mime,
    byte_size: image.bytes.byteLength,
    checksum,
    extraction_status: "review_ready",
    extraction_method: "instagram_caption_metadata_v1",
    extraction_version: "instagram_import_v1",
    extracted_at: new Date().toISOString(),
    retention_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1_000).toISOString(),
    provider_file_id: media.id,
    original_filename: `instagram-${media.id}.${fileExtension(image.mime)}`,
    source_metadata: metadata,
    media_kind: "image",
    library_status: "draft",
    width: image.width,
    height: image.height,
    classification: "artwork_image",
    classification_confidence: 0.5,
    classification_reason: "Selected by the connected artist from their own Instagram professional account",
    privacy_level: "private",
    review_summary: { requires_artist_approval: true, title_confirmation_required: true },
  }).select("id,storage_path,mime_type,byte_size,checksum,width,height,extraction_status,source_type").single()
  if (sourceError) {
    await admin.storage.from(MEDIA_BUCKET).remove([path])
    throw sourceError
  }
  const draft = await ensureInstagramDraft({
    artistUserId: input.artistUserId,
    sourceId: String(source.id),
    providerMediaId: media.id,
    fields: fallbackFields,
    providerMetadata,
    reusedExistingSource: false,
    approved: false,
  })
  const response = await preparedResponse({ source, draft, fallbackFields })
  return { ...response, alreadyPrepared: false }
}

function normalizeDraftFields(value: unknown) {
  const record = asRecord(value)
  const text = (name: string, max = 5_000) => cleanText(record[name], max)
  return {
    title: text("title", 240),
    year: text("year", 40),
    medium: text("medium", 240),
    dimensions: text("dimensions", 240),
    series: text("series", 240),
    description: text("description", 10_000),
    tags: Array.from(new Set(text("tags", 2_000).split(/[,;\n]/).map((entry) => entry.trim()).filter(Boolean))).slice(0, 20),
    altText: text("altText", 1_500),
  }
}

async function handlePost(req: Request) {
  assertAllowedOrigin(req)
  const user = await requireArtist(req)
  const body = asRecord(await req.json().catch(() => ({})))
  const action = cleanText(body.action, 80)

  if (action === "status") {
    const connection = await connectionFor(user.id)
    return json(req, {
      configured: isConfigured(),
      connected: Boolean(connection),
      username: connection?.username || "",
      accountType: connection?.account_type || "",
      mediaCount: connection?.media_count ?? null,
      expiresAt: connection?.token_expires_at || null,
      needsReconnect: Boolean(connection?.token_expires_at && Date.parse(connection.token_expires_at) <= Date.now()),
    })
  }

  if (action === "start_oauth") {
    if (!isConfigured()) throw new Error("instagram_connection_unavailable")
    const since = new Date(Date.now() - OAUTH_WINDOW_MS).toISOString()
    const { count, error: countError } = await admin
      .from("artist_instagram_oauth_states")
      .select("id", { count: "exact", head: true })
      .eq("artist_user_id", user.id)
      .gte("created_at", since)
    if (countError) throw countError
    if ((count || 0) >= OAUTH_MAX_STARTS) throw new Error("instagram_connection_rate_limited")
    await admin.from("artist_instagram_oauth_states").delete().eq("artist_user_id", user.id).or(`expires_at.lt.${new Date().toISOString()},used_at.not.is.null`)
    const stateBytes = crypto.getRandomValues(new Uint8Array(32))
    const state = base64Url(stateBytes)
    const stateHash = await sha256Text(state)
    const returnUrl = validateReturnUrl(body.returnUrl)
    const { error } = await admin.from("artist_instagram_oauth_states").insert({
      state_hash: stateHash,
      artist_user_id: user.id,
      return_url: returnUrl,
      requested_scopes: ["instagram_business_basic"],
      expires_at: new Date(Date.now() + OAUTH_WINDOW_MS).toISOString(),
      processing_at: null,
      last_failure_category: "",
    })
    if (error) throw error
    const authorize = new URL("https://www.instagram.com/oauth/authorize")
    authorize.searchParams.set("enable_fb_login", "0")
    authorize.searchParams.set("force_authentication", "1")
    authorize.searchParams.set("client_id", INSTAGRAM_APP_ID)
    authorize.searchParams.set("redirect_uri", REDIRECT_URI)
    authorize.searchParams.set("response_type", "code")
    authorize.searchParams.set("scope", "instagram_business_basic")
    authorize.searchParams.set("state", state)
    await logEvent(user.id, "connection_started", null)
    return json(req, { authorizeUrl: authorize.href })
  }

  if (action === "list_prepared") {
    const { data: drafts, error: draftError } = await admin
      .from("artist_instagram_import_drafts")
      .select("source_id,provider_media_id,draft_fields,provider_metadata,reused_existing_source,status,updated_at")
      .eq("artist_user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100)
    if (draftError) throw draftError
    const sourceIds = (drafts || []).map((draft) => String(draft.source_id))
    if (!sourceIds.length) return json(req, { items: [] })
    const { data: sources, error: sourceError } = await admin
      .from("artist_import_sources")
      .select("id,storage_path,mime_type,byte_size,checksum,width,height,extraction_status,source_type")
      .eq("artist_user_id", user.id)
      .in("id", sourceIds)
    if (sourceError) throw sourceError
    const sourceById = new Map((sources || []).map((source) => [String(source.id), source]))
    const fallback = preparedFields({ id: "fallback" })
    const items = []
    for (const draft of drafts || []) {
      const source = sourceById.get(String(draft.source_id))
      if (!source) continue
      try { items.push(await preparedResponse({ source: source as JsonRecord, draft: draft as JsonRecord, fallbackFields: fallback })) } catch { /* a deleted file should not block other drafts */ }
    }
    return json(req, { items })
  }

  if (action === "save_drafts") {
    const raw = Array.isArray(body.items) ? body.items.slice(0, MAX_IMPORT_ITEMS) : []
    let saved = 0
    for (const value of raw) {
      const record = asRecord(value)
      const sourceId = cleanText(record.sourceId, 120)
      if (!/^[0-9a-f-]{36}$/i.test(sourceId)) continue
      const { data: current, error: currentError } = await admin
        .from("artist_instagram_import_drafts")
        .select("draft_fields")
        .eq("source_id", sourceId)
        .eq("artist_user_id", user.id)
        .maybeSingle()
      if (currentError || !current) continue
      const fallback = normalizePreparedFields(current.draft_fields, preparedFields({ id: "fallback" }))
      const nextFields = normalizePreparedFields(record.fields, fallback)
      const { error } = await admin.from("artist_instagram_import_drafts").update({
        draft_fields: nextFields,
        updated_at: new Date().toISOString(),
      }).eq("source_id", sourceId).eq("artist_user_id", user.id).eq("status", "review_ready")
      if (!error) saved += 1
    }
    return json(req, { saved })
  }

  if (action === "approve_import") {
    const sourceId = cleanText(body.sourceId, 120)
    if (!/^[0-9a-f-]{36}$/i.test(sourceId)) throw new Error("instagram_import_source_required")
    const fields = normalizeDraftFields(body.fields)
    if (!fields.title) throw new Error("artwork_title_required")
    const { data: draft, error: draftError } = await admin
      .from("artist_instagram_import_drafts")
      .select("source_id,provider_media_id,status")
      .eq("source_id", sourceId)
      .eq("artist_user_id", user.id)
      .maybeSingle()
    if (draftError || !draft) throw draftError || new Error("instagram_import_not_found")
    const { data: source, error: sourceError } = await admin
      .from("artist_import_sources")
      .select("id,artist_user_id,source_type,storage_path,extraction_status")
      .eq("id", sourceId)
      .eq("artist_user_id", user.id)
      .maybeSingle()
    if (sourceError || !source) throw sourceError || new Error("instagram_import_not_found")
    const { data: existing, error: existingError } = await admin
      .from("portfolio_works")
      .select("id")
      .eq("artist_user_id", user.id)
      .eq("import_source_id", sourceId)
      .maybeSingle()
    if (existingError) throw existingError
    if (existing?.id) {
      await admin.from("artist_instagram_import_drafts").update({ status: "approved", updated_at: new Date().toISOString() }).eq("source_id", sourceId).eq("artist_user_id", user.id)
      return json(req, { portfolioWorkId: String(existing.id), alreadyApproved: true })
    }
    const provenance = Object.fromEntries(Object.keys(fields).filter((key) => key !== "tags").map((key) => [key, {
      status: "confirmed",
      source: "Reviewed and confirmed by artist after Instagram import",
      confidence: "strong_source_match",
    }]))
    const { data: work, error: workError } = await admin.from("portfolio_works").insert({
      artist_user_id: user.id,
      title: fields.title,
      year: fields.year,
      medium: fields.medium,
      dimensions: fields.dimensions,
      description: fields.description,
      series: fields.series,
      tags: fields.tags,
      image_path: source.storage_path,
      import_source_id: sourceId,
      accessibility_alt_text: fields.altText,
      field_provenance: provenance,
      approval_status: "approved",
    }).select("id").single()
    if (workError) throw workError
    const confirmedFields = Object.fromEntries(Object.entries(fields).map(([name, value]) => [name, {
      value: Array.isArray(value) ? value.join(", ") : value,
      status: "confirmed",
      source: "Reviewed and confirmed by artist after Instagram import",
      confidence: "strong_source_match",
    }]))
    const now = new Date().toISOString()
    const { error: updateError } = await admin.from("artist_import_sources").update({
      extraction_status: "approved",
      library_status: "available",
      review_summary: { artist_approved_at: now, fields_confirmed: true },
      updated_at: now,
    }).eq("id", sourceId).eq("artist_user_id", user.id)
    if (updateError) throw updateError
    await admin.from("artist_instagram_import_drafts").update({
      draft_fields: confirmedFields,
      status: "approved",
      updated_at: now,
    }).eq("source_id", sourceId).eq("artist_user_id", user.id)
    const currentConnection = await connectionFor(user.id)
    await logEvent(user.id, "media_approved", currentConnection?.instagram_user_id || null, 1, { source_id: sourceId })
    return json(req, { portfolioWorkId: String(work.id), alreadyApproved: false })
  }

  if (action === "delete_import") {
    const sourceId = cleanText(body.sourceId, 120)
    const { data: draft, error: draftError } = await admin
      .from("artist_instagram_import_drafts")
      .select("source_id,status,reused_existing_source")
      .eq("source_id", sourceId)
      .eq("artist_user_id", user.id)
      .maybeSingle()
    if (draftError || !draft) throw draftError || new Error("instagram_import_not_found")
    if (draft.status === "approved") throw new Error("approved_artwork_remove_from_portfolio")
    const { data: source, error: sourceError } = await admin
      .from("artist_import_sources")
      .select("id,storage_path,extraction_status,source_type")
      .eq("id", sourceId)
      .eq("artist_user_id", user.id)
      .maybeSingle()
    if (sourceError || !source) throw sourceError || new Error("instagram_import_not_found")
    if (source.extraction_status === "approved") throw new Error("approved_artwork_remove_from_portfolio")
    const { error: deleteDraftError } = await admin.from("artist_instagram_import_drafts").delete().eq("source_id", sourceId).eq("artist_user_id", user.id)
    if (deleteDraftError) throw deleteDraftError
    if (source.source_type === "instagram_image" && draft.reused_existing_source !== true) {
      const { error: deleteSourceError } = await admin.from("artist_import_sources").delete().eq("id", sourceId).eq("artist_user_id", user.id)
      if (deleteSourceError) throw deleteSourceError
      if (source.storage_path) await admin.storage.from(MEDIA_BUCKET).remove([source.storage_path])
    }
    const currentConnection = await connectionFor(user.id)
    await logEvent(user.id, "prepared_media_deleted", currentConnection?.instagram_user_id || null, 1)
    return json(req, { deleted: true })
  }

  if (action === "disconnect") {
    const currentConnection = await connectionFor(user.id)
    await admin.from("artist_instagram_connections").delete().eq("artist_user_id", user.id)
    await admin.from("artist_instagram_oauth_states").delete().eq("artist_user_id", user.id)
    await logEvent(user.id, "disconnected", currentConnection?.instagram_user_id || null)
    return json(req, { disconnected: true })
  }

  const connection = await connectionFor(user.id)
  if (!connection) throw new Error("instagram_connection_required")

  if (action === "list_media") {
    const token = await activeToken(connection)
    const result = await listMedia(connection, token, normalizeCursor(body.after))
    await admin.from("artist_instagram_connections").update({
      last_verified_at: new Date().toISOString(),
      last_error_category: "",
      updated_at: new Date().toISOString(),
    }).eq("artist_user_id", user.id)
    return json(req, result)
  }

  if (action === "prepare_import") {
    if (body.rightsConfirmed !== true) throw new Error("instagram_import_rights_confirmation_required")
    const mediaIds = Array.isArray(body.mediaIds)
      ? Array.from(new Set(body.mediaIds.map((value) => cleanText(value, 120)).filter((value) => /^\d+$/.test(value)))).slice(0, MAX_IMPORT_ITEMS)
      : []
    const sessionId = cleanText(body.sessionId, 120)
    if (!mediaIds.length || !sessionId || !/^[A-Za-z0-9-]{8,120}$/.test(sessionId)) throw new Error("instagram_selection_required")
    const token = await activeToken(connection)
    const rightsConfirmedAt = new Date().toISOString()
    const results = []
    for (const mediaId of mediaIds) {
      try {
        const item = await prepareOne({ artistUserId: user.id, connection, token, mediaId, sessionId, rightsConfirmedAt })
        results.push({ ok: true, item })
      } catch (reason) {
        results.push({ ok: false, mediaId, error: errorCode(reason) })
      }
    }
    const completed = results.filter((result) => result.ok).length
    await logEvent(user.id, "media_prepared", connection.instagram_user_id, completed, { requested: mediaIds.length })
    return json(req, { results, completed, failed: results.length - completed })
  }

  throw new Error("unsupported_action")
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) })
  const url = new URL(req.url)
  if (req.method === "GET") return handleOAuthCallback(req, url)
  if (req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405)
  try {
    return await handlePost(req)
  } catch (reason) {
    const code = errorCode(reason)
    const status = code === "authentication_required" ? 401
      : code === "artist_workspace_required" || code === "request_origin_not_allowed" ? 403
      : code === "instagram_connection_rate_limited" ? 429
      : code.includes("required") || code.includes("selection") || code.includes("title") ? 400
      : 502
    return json(req, { error: code }, status)
  }
})
