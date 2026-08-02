import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.5"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const INSTAGRAM_APP_ID = Deno.env.get("META_INSTAGRAM_APP_ID") ?? ""
const INSTAGRAM_APP_SECRET = Deno.env.get("META_INSTAGRAM_APP_SECRET") ?? ""
const TOKEN_KEY_MATERIAL = Deno.env.get("META_INSTAGRAM_TOKEN_ENCRYPTION_KEY") || INSTAGRAM_APP_SECRET
const API_VERSION = (Deno.env.get("META_INSTAGRAM_API_VERSION") || "v25.0").replace(/^\/+|\/+$/g, "")
const REDIRECT_URI = "https://trekynurdgxgtaaqqtyq.supabase.co/functions/v1/instagram-import"
const PUBLIC_ORIGIN = (Deno.env.get("KLEIO_PUBLIC_ORIGIN") || "https://www.kleioarthouse.com").replace(/\/+$/, "")
const CORE_URL = "https://trekynurdgxgtaaqqtyq.supabase.co/functions/v1/instagram-import-core"
const encoder = new TextEncoder()

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

type JsonRecord = Record<string, unknown>
type ClaimedOAuthState = {
  status: "claimed" | "not_found" | "expired" | "consumed" | "in_progress"
  state_id: string | null
  artist_user_id: string | null
  return_url: string | null
  state_age_seconds: number | null
}
type OAuthResult = "success" | "expired" | "cancelled" | "invalid" | "consumed" | "in_progress" | "failed"

function cleanText(value: unknown, max = 5_000) {
  return typeof value === "string" ? value.replace(/\0/g, "").trim().slice(0, max) : ""
}

function idText(value: unknown, max = 120) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim().slice(0, max) : ""
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {}
}

function validateReturnUrl(value: unknown) {
  const fallback = `${PUBLIC_ORIGIN}/artist-dashboard/import/`
  const candidate = cleanText(value, 2_000) || fallback
  try {
    const parsed = new URL(candidate)
    const allowed = new Set([
      PUBLIC_ORIGIN,
      "https://www.kleioarthouse.com",
      "https://cowboyblurr.github.io",
    ])
    if (!allowed.has(parsed.origin) || !parsed.pathname.startsWith("/artist-dashboard/")) return fallback
    parsed.hash = ""
    return parsed.href
  } catch {
    return fallback
  }
}

function redirectToCompletion(returnUrl: string, result: OAuthResult, username = "") {
  const source = new URL(validateReturnUrl(returnUrl))
  const target = new URL("/instagram-complete.html", source.origin)
  target.searchParams.set("instagram", result === "success" ? "connected" : "error")
  target.searchParams.set("instagram_result", `instagram_oauth_${result}`)
  if (username) target.searchParams.set("instagram_username", username)
  return new Response(null, {
    status: 303,
    headers: {
      "Location": target.href,
      "Cache-Control": "no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  })
}

async function sha256Text(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ""
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + 0x8000, bytes.length)))
  }
  return btoa(binary)
}

async function tokenKey() {
  if (!TOKEN_KEY_MATERIAL) throw new Error("instagram_encryption_not_configured")
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`kleio-instagram-token-v1:${TOKEN_KEY_MATERIAL}`))
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt"])
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

async function logEvent(artistUserId: string, eventType: string, instagramUserId: string | null, metadata: JsonRecord = {}) {
  try {
    await admin.from("artist_instagram_import_events").insert({
      artist_user_id: artistUserId,
      event_type: eventType,
      instagram_user_id: instagramUserId,
      media_count: 0,
      metadata,
    })
  } catch {
    console.warn("instagram_event_log_failed")
  }
}

async function finishState(stateId: string, category = "") {
  const { error } = await admin.from("artist_instagram_oauth_states").update({
    used_at: new Date().toISOString(),
    processing_at: null,
    last_failure_category: category,
  }).eq("id", stateId).is("used_at", null)
  if (error) throw error
}

function normalizeOAuthFailure(data: JsonRecord, status: number) {
  const nested = asRecord(data.error)
  const message = cleanText(nested.message || data.error_message || data.message, 500).toLowerCase()
  if (message.includes("redirect_uri") || message.includes("redirect uri")) return "instagram_code_exchange_redirect_mismatch"
  if (message.includes("invalid code") || message.includes("authorization code") || message.includes("verification code")) return "instagram_code_exchange_invalid_code"
  if (message.includes("client") || idText(nested.code ?? data.code) === "101") return "instagram_code_exchange_invalid_client"
  if (status === 429 || message.includes("rate")) return "instagram_code_exchange_rate_limited"
  if (status >= 500) return "instagram_code_exchange_network_error"
  return "instagram_code_exchange_unknown"
}

async function exchangeAuthorizationCode(code: string) {
  const body = new FormData()
  body.set("client_id", INSTAGRAM_APP_ID)
  body.set("client_secret", INSTAGRAM_APP_SECRET)
  body.set("grant_type", "authorization_code")
  body.set("redirect_uri", REDIRECT_URI)
  body.set("code", code.replace(/#_$/, ""))
  const response = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Accept": "application/json" },
    body,
  })
  const data = await response.json().catch(() => ({})) as JsonRecord
  const accessToken = cleanText(data.access_token, 5_000)
  const userId = idText(data.user_id, 120)
  if (!response.ok || !accessToken || !userId) throw new Error(normalizeOAuthFailure(data, response.status))
  return {
    accessToken,
    userId,
    permissions: Array.isArray(data.permissions) ? data.permissions.map((item) => cleanText(item, 100)).filter(Boolean) : [],
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
  const accessToken = cleanText(data.access_token, 5_000)
  if (!response.ok || !accessToken) return null
  return { accessToken, expiresIn: Number(data.expires_in) || 60 * 24 * 60 * 60 }
}

async function graphRequest(path: string, token: string) {
  const response = await fetch(`https://graph.instagram.com/${path.replace(/^\/+/, "")}`, {
    headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
  })
  const data = await response.json().catch(() => ({})) as JsonRecord
  if (!response.ok || data.error) {
    const error = asRecord(data.error)
    throw new Error(`instagram_api_${idText(error.code, 40) || response.status}`)
  }
  return data
}

async function currentProfile(token: string, fallbackUserId: string) {
  const candidates = [
    `${API_VERSION}/me?fields=${encodeURIComponent("user_id,username,account_type,media_count")}`,
    `me?fields=${encodeURIComponent("user_id,username,account_type,media_count")}`,
    `${API_VERSION}/me?fields=${encodeURIComponent("user_id,username")}`,
    `me?fields=${encodeURIComponent("user_id,username")}`,
    `me?fields=${encodeURIComponent("id,username")}`,
  ]
  let lastError: unknown = new Error("instagram_profile_unavailable")
  for (const path of candidates) {
    try {
      const data = await graphRequest(path, token)
      const id = idText(data.id ?? data.user_id, 120) || fallbackUserId
      const username = cleanText(data.username, 120)
      if (!id || !username) continue
      return {
        id,
        username,
        accountType: cleanText(data.account_type, 80),
        mediaCount: Number.isFinite(Number(data.media_count)) ? Number(data.media_count) : null,
      }
    } catch (reason) {
      lastError = reason
    }
  }
  throw lastError
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
  const expiresAt = new Date(now.getTime() + Math.max(input.expiresIn, 3_600) * 1_000).toISOString()
  const { error } = await admin.from("artist_instagram_connections").upsert({
    artist_user_id: input.artistUserId,
    instagram_user_id: input.instagramUserId,
    username: input.username,
    account_type: input.accountType,
    media_count: input.mediaCount,
    access_token_ciphertext: encrypted.ciphertext,
    access_token_iv: encrypted.iv,
    token_expires_at: expiresAt,
    granted_scopes: input.scopes.length ? input.scopes : ["instagram_business_basic"],
    connected_at: now.toISOString(),
    refreshed_at: now.toISOString(),
    last_verified_at: now.toISOString(),
    disconnected_at: null,
    last_error_category: "",
    metadata: { api_version: API_VERSION, login_type: "instagram_login", callback_gateway: "v5-static-relay" },
    updated_at: now.toISOString(),
  }, { onConflict: "artist_user_id" })
  if (error) throw error
}

async function handleCallback(url: URL) {
  const fallbackUrl = `${PUBLIC_ORIGIN}/artist-dashboard/import/`
  const state = cleanText(url.searchParams.get("state"), 500)
  const code = cleanText(url.searchParams.get("code"), 5_000)
  const oauthError = cleanText(url.searchParams.get("error") || url.searchParams.get("error_reason"), 200)
  if (!state) return redirectToCompletion(fallbackUrl, "invalid")

  const stateHash = await sha256Text(state)
  const { data: claimedRows, error: claimError } = await admin.rpc("claim_instagram_oauth_state", { p_state_hash: stateHash })
  if (claimError) return redirectToCompletion(fallbackUrl, "failed")
  const claimed = (Array.isArray(claimedRows) ? claimedRows[0] : claimedRows) as ClaimedOAuthState | null
  const returnUrl = validateReturnUrl(claimed?.return_url || fallbackUrl)
  if (!claimed || claimed.status !== "claimed" || !claimed.state_id || !claimed.artist_user_id) {
    const result: OAuthResult = claimed?.status === "expired"
      ? "expired"
      : claimed?.status === "consumed"
        ? "consumed"
        : claimed?.status === "in_progress"
          ? "in_progress"
          : "invalid"
    return redirectToCompletion(returnUrl, result)
  }

  const artistUserId = claimed.artist_user_id
  const stateId = claimed.state_id
  await logEvent(artistUserId, "callback_received", null, {
    state_age_seconds: Math.max(0, Number(claimed.state_age_seconds) || 0),
  })

  if (oauthError || !code) {
    await finishState(stateId, "authorization_cancelled")
    await logEvent(artistUserId, "connection_cancelled", null, { category: oauthError || "missing_code" })
    return redirectToCompletion(returnUrl, "cancelled")
  }

  try {
    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET || !TOKEN_KEY_MATERIAL) throw new Error("instagram_not_configured")
    const short = await exchangeAuthorizationCode(code)
    await logEvent(artistUserId, "token_received", short.userId)
    const profile = await currentProfile(short.accessToken, short.userId)
    await logEvent(artistUserId, "profile_verified", profile.id, { account_type: profile.accountType })
    const long = await exchangeLongLivedToken(short.accessToken)
    await saveConnection({
      artistUserId,
      instagramUserId: profile.id,
      username: profile.username,
      accountType: profile.accountType,
      mediaCount: profile.mediaCount,
      accessToken: long?.accessToken || short.accessToken,
      expiresIn: long?.expiresIn || short.expiresIn,
      scopes: short.permissions,
    })
    await logEvent(artistUserId, "connected", profile.id, { account_type: profile.accountType })
    await finishState(stateId)
    return redirectToCompletion(returnUrl, "success", profile.username)
  } catch (reason) {
    const category = reason instanceof Error && reason.message ? reason.message : "instagram_connection_failed"
    try { await finishState(stateId, category) } catch { console.warn("instagram_state_finish_failed") }
    await logEvent(artistUserId, category.startsWith("instagram_code_exchange_") ? "code_exchange_failed" : "connection_failed", null, { category })
    return redirectToCompletion(returnUrl, "failed")
  }
}

async function proxyToCore(req: Request) {
  const headers = new Headers(req.headers)
  headers.delete("host")
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer()
  const response = await fetch(CORE_URL, {
    method: req.method,
    headers,
    body,
    redirect: "manual",
  })
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "GET") return await handleCallback(new URL(req.url))
    return await proxyToCore(req)
  } catch {
    if (req.method === "GET") return redirectToCompletion(`${PUBLIC_ORIGIN}/artist-dashboard/import/`, "failed")
    return new Response(JSON.stringify({ error: "instagram_gateway_failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    })
  }
})
