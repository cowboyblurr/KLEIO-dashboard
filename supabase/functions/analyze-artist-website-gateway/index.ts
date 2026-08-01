import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const CORE_FUNCTION = "analyze-artist-website-core"
const UNSUPPORTED_IMPORT_HOSTS = [
  "instagram.com",
  "facebook.com",
  "threads.net",
  "tiktok.com",
  "x.com",
  "twitter.com",
  "pinterest.com",
  "linkedin.com",
  "behance.net",
  "artstation.com",
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
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  }
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json", "Cache-Control": "no-store" },
  })
}

function cleanText(value: unknown, max = 2_000) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
    : ""
}

function unsupportedImportHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/^www\./, "")
  return UNSUPPORTED_IMPORT_HOSTS.some((host) => normalized === host || normalized.endsWith(`.${host}`))
}

function restrictedSourceMessage(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/^www\./, "")
  if (normalized === "behance.net" || normalized.endsWith(".behance.net") || normalized === "artstation.com" || normalized.endsWith(".artstation.com")) {
    return "Behance and ArtStation may be saved as external portfolio links, but KLEIO does not analyze, copy, synchronize, embed, or AI-analyze their contents. Upload the original files directly or use a public personal portfolio website."
  }
  if (normalized === "pinterest.com" || normalized.endsWith(".pinterest.com")) {
    return "Pinterest cannot be analyzed through Website Import Assist. Use the official connected Pinterest import after it is configured and approved, or upload the original files directly."
  }
  return "Social profiles cannot be analyzed through Website Import Assist. Use the supported connected import for that platform, a public personal portfolio website, or upload the original files directly."
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
      if (unsupportedImportHostname(parsed.hostname)) {
        return json(request, {
          error: restrictedSourceMessage(parsed.hostname),
          code: "unsupported_import_source",
        })
      }
    } catch {
      // The existing collector returns the canonical invalid-URL response.
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  if (!supabaseUrl || !anonKey) return json(request, { error: "service_configuration_unavailable" }, 503)

  try {
    const upstream = await fetch(`${supabaseUrl}/functions/v1/${CORE_FUNCTION}`, {
      method: "POST",
      headers: {
        "Authorization": authorization,
        "apikey": anonKey,
        "Content-Type": "application/json",
        "x-client-info": request.headers.get("x-client-info") ?? "kleio-website-import-gateway/1.0",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    })
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { ...corsHeaders(request), "Content-Type": upstream.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" },
    })
  } catch {
    return json(request, { error: "website_import_service_unavailable" }, 503)
  }
})
