import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const CORE_FUNCTION = "analyze-artist-website-core"
const INTELLIGENCE_FUNCTION = "analyze-artist-website-intelligence"
const UNSUPPORTED_IMPORT_HOSTS = [
  "instagram.com", "facebook.com", "threads.net", "tiktok.com", "x.com", "twitter.com", "pinterest.com",
  "linkedin.com", "behance.net", "artstation.com",
]
const ALLOWED_ORIGINS = [
  /^https:\/\/([a-z0-9-]+\.)?kleioarthouse\.com$/i,
  /^https:\/\/cowboyblurr\.github\.io$/i,
  /^http:\/\/localhost(?::\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/i,
]
type JsonObject = Record<string, unknown>
function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? ""
  const allowed = ALLOWED_ORIGINS.some((pattern) => pattern.test(origin)) ? origin : "https://www.kleioarthouse.com"
  return { "Access-Control-Allow-Origin": allowed, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" }
}
function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(request), "Content-Type": "application/json", "Cache-Control": "no-store" } })
}
function cleanText(value: unknown, max = 2_000) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : ""
}
function unsupportedImportHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/^www\./, "")
  return UNSUPPORTED_IMPORT_HOSTS.some((host) => normalized === host || normalized.endsWith(`.${host}`))
}
function restrictedSourceMessage(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/^www\./, "")
  if (normalized === "behance.net" || normalized.endsWith(".behance.net") || normalized === "artstation.com" || normalized.endsWith(".artstation.com")) {
    return "Behance and ArtStation may be saved as external portfolio links, but KLEIO does not analyze or copy their contents. Upload original files or use a public personal portfolio website."
  }
  if (normalized === "pinterest.com" || normalized.endsWith(".pinterest.com")) {
    return "Pinterest cannot be analyzed through Website Import Assist. Use an approved connected import when available, or upload original files."
  }
  return "Social profiles cannot be analyzed through Website Import Assist. Use the supported connected import, a public personal portfolio website, or upload original files."
}
async function callFunction(baseUrl: string, anonKey: string, authorization: string, slug: string, body: JsonObject, clientInfo: string) {
  return fetch(`${baseUrl}/functions/v1/${slug}`, {
    method: "POST",
    headers: { "Authorization": authorization, "apikey": anonKey, "Content-Type": "application/json", "x-client-info": clientInfo },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(65_000),
  })
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) })
  if (request.method !== "POST") return json(request, { error: "method_not_allowed" }, 405)
  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return json(request, { error: "authentication_required" }, 401)
  let body: JsonObject
  try { body = await request.json() } catch { return json(request, { error: "invalid_json" }, 400) }
  const action = cleanText(body.action, 40) || "analyze"
  if (action === "analyze") {
    const websiteUrl = cleanText(body.websiteUrl)
    try {
      const parsed = new URL(websiteUrl)
      if (unsupportedImportHostname(parsed.hostname)) return json(request, { error: "unsupported_import_source", message: restrictedSourceMessage(parsed.hostname), outcome: "blocked" }, 400)
    } catch { /* the core returns the canonical invalid URL response */ }
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL"); const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  if (!supabaseUrl || !anonKey) return json(request, { error: "service_configuration_unavailable" }, 503)
  try {
    const clientInfo = request.headers.get("x-client-info") ?? "kleio-website-import-gateway/2.0"
    if (action === "dismiss") {
      const response = await callFunction(supabaseUrl, anonKey, authorization, INTELLIGENCE_FUNCTION, body, clientInfo)
      return new Response(await response.text(), { status: response.status, headers: { ...corsHeaders(request), "Content-Type": response.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" } })
    }
    const upstream = await callFunction(supabaseUrl, anonKey, authorization, CORE_FUNCTION, body, clientInfo)
    const upstreamText = await upstream.text()
    if (!upstream.ok || action !== "analyze") return new Response(upstreamText, { status: upstream.status, headers: { ...corsHeaders(request), "Content-Type": upstream.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" } })
    let upstreamBody: JsonObject
    try { upstreamBody = JSON.parse(upstreamText) as JsonObject } catch { return json(request, { error: "website_scan_validation_failed", outcome: "failed", retryable: true }, 502) }
    const session = upstreamBody.session
    const sessionId = session && typeof session === "object" && !Array.isArray(session) ? cleanText((session as JsonObject).id, 100) : ""
    if (!sessionId) return json(request, { error: "website_scan_validation_failed", outcome: "failed", retryable: true }, 502)
    const enhanced = await callFunction(supabaseUrl, anonKey, authorization, INTELLIGENCE_FUNCTION, { action: "enhance_scan", sessionId }, clientInfo)
    return new Response(await enhanced.text(), { status: enhanced.status, headers: { ...corsHeaders(request), "Content-Type": enhanced.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" } })
  } catch {
    return json(request, { error: "website_import_service_unavailable", outcome: "failed", retryable: true }, 503)
  }
})
