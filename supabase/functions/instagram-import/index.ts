import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const ALLOWED_ORIGINS = [
  /^https:\/\/([a-z0-9-]+\.)?kleioarthouse\.com$/i,
  /^https:\/\/cowboyblurr\.github\.io$/i,
  /^http:\/\/localhost(?::\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/i,
]

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? ""
  const allowed = ALLOWED_ORIGINS.some((pattern) => pattern.test(origin)) ? origin : "https://www.kleioarthouse.com"
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  }
}

function response(request: Request) {
  return new Response(JSON.stringify({
    error: "instagram_import_beta_disabled",
    status: "coming_soon",
    message: "Instagram import is not available during the initial KLEIO artist beta.",
  }), {
    status: 403,
    headers: { ...corsHeaders(request), "Content-Type": "application/json", "Cache-Control": "no-store" },
  })
}

Deno.serve((request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) })
  return response(request)
})
