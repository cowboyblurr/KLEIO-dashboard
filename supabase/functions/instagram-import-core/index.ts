import "jsr:@supabase/functions-js/edge-runtime.d.ts"

Deno.serve((request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "https://www.kleioarthouse.com",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Vary": "Origin",
      },
    })
  }

  return new Response(JSON.stringify({
    error: "instagram_import_beta_disabled",
    status: "coming_soon",
    message: "Instagram import is not available during the initial KLEIO artist beta.",
  }), {
    status: 403,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  })
})
