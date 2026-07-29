import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.110.5"

const URL = Deno.env.get("SUPABASE_URL") ?? ""
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
}

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  })
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405)
  if (!URL || !ANON_KEY || !SERVICE_KEY) return reply({ error: "KLEIO research configuration is incomplete." }, 500)

  const authorization = request.headers.get("authorization") ?? ""
  if (!authorization.toLowerCase().startsWith("bearer ")) return reply({ error: "Authentication is required." }, 401)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return reply({ error: "A JSON request body is required." }, 400)
  }

  const opportunityId = typeof body.opportunity_id === "string" ? body.opportunity_id : ""
  const forceNew = body.force_new === true
  if (!opportunityId) return reply({ error: "opportunity_id is required." }, 400)

  const userClient = createClient(URL, ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await userClient.rpc("create_or_resume_opportunity_research", {
    target_opportunity_id: opportunityId,
    force_new: forceNew,
  })
  if (error) return reply({ error: error.message }, error.code === "42501" ? 403 : 400)

  const row = Array.isArray(data) ? data[0] : data
  if (!row) return reply({ error: "The research job could not be created." }, 500)

  const service = createClient(URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: workerToken } = await service.rpc("get_opportunity_sync_token")
  if (workerToken) {
    EdgeRuntime.waitUntil(fetch(`${URL}/functions/v1/process-opportunity-research`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-kleio-sync-token": String(workerToken) },
      body: JSON.stringify({ trigger: "artist_enqueue" }),
    }).catch(() => undefined))
  }

  return reply({
    session_id: row.session_id,
    job_id: row.job_id,
    status: row.research_status,
    message: "KLEIO queued a public-source review. Nothing has been submitted or sent.",
  }, 202)
})
