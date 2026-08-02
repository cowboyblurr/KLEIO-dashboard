import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.110.5"
import { runGemini } from "./gemini.ts"
import {
  ACTION,
  boundEvidence,
  buildEvidencePackage,
  CATEGORIES,
  DEFAULT_MODEL,
  fail,
  MAX_EVIDENCE_CHARS,
  MAX_IMAGES,
  MAX_PAGES,
  object,
  PROMPT_VERSION,
  PROVIDER,
  safeModel,
  SCHEMA_VERSION,
  sha256,
  text,
  validateOutput,
  type EvidencePackage,
  type Failure,
  type Json,
  type OrganizedOutput,
} from "./shared.ts"

export {
  buildEvidencePackage,
  responseSchema,
  safeModel,
  sha256,
  SYSTEM_INSTRUCTION,
  validateOutput,
} from "./shared.ts"
export { runGemini } from "./gemini.ts"

const ALLOWED_ORIGINS = [
  /^https:\/\/([a-z0-9-]+\.)?kleioarthouse\.com$/i,
  /^https:\/\/cowboyblurr\.github\.io$/i,
  /^http:\/\/localhost(?::\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/i,
]

type AdminClient = ReturnType<typeof createClient>
type Context = {
  request: Request
  userId: string
  admin: AdminClient
  apiKey: string
  model: string
  dailyLimit: number
  sessionLimit: number
}

function cors(request: Request) {
  const origin = request.headers.get("origin") || ""
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.some((rule) => rule.test(origin)) ? origin : "https://www.kleioarthouse.com",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  }
}
function reply(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(request), "Content-Type": "application/json", "Cache-Control": "no-store" },
  })
}
function envInt(name: string, fallback: number, maximum: number) {
  const value = Number(Deno.env.get(name))
  return Number.isFinite(value) && value >= 0 ? Math.min(Math.floor(value), maximum) : fallback
}
function dayStart() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
}
function safeError(reason: unknown) {
  const code = (reason as Failure)?.code || (reason instanceof Error ? reason.message : "website_organization_failed")
  return new Set([
    "gemini_not_configured", "gemini_model_not_configured", "gemini_authentication_failed", "gemini_rate_limited",
    "gemini_provider_unavailable", "gemini_timeout", "gemini_invalid_structured_output", "ai_output_failed_validation",
    "website_import_session_not_found", "website_scan_has_insufficient_evidence", "website_ai_daily_limit_reached",
    "website_ai_session_limit_reached", "website_ai_organization_in_progress", "authentication_required",
    "artist_account_required", "service_configuration_unavailable",
  ]).has(code) ? code : "website_organization_failed"
}
function confidence(value: string) {
  return value === "high" ? 0.9 : value === "medium" ? 0.65 : 0.35
}

async function recordUsage(context: Context, status: "succeeded" | "failed" | "cached", input: Json = {}) {
  await context.admin.from("artist_ai_usage_events").insert({
    artist_user_id: context.userId,
    action: ACTION,
    status,
    provider: PROVIDER,
    model: context.model,
    provider_request_id: text(input.requestId, 300),
    input_units: Number(input.inputTokens || 0),
    output_units: Number(input.outputTokens || 0),
    total_units: Number(input.totalTokens || 0),
    latency_ms: input.latencyMs ?? null,
    error_code: text(input.errorCode, 100),
    metadata: object(input.metadata) ? input.metadata : {},
  })
}
async function loadSession(context: Context, id: string) {
  const { data, error } = await context.admin.from("artist_website_import_sessions")
    .select("id,website_url,canonical_url,status,pages,image_candidates,created_at")
    .eq("id", id)
    .eq("artist_user_id", context.userId)
    .single()
  if (error || !data) throw fail("website_import_session_not_found", 404)
  return data as Json
}
async function enforceLimits(context: Context, sessionId: string) {
  if (context.dailyLimit > 0) {
    const { count } = await context.admin.from("artist_ai_usage_events")
      .select("id", { count: "exact", head: true })
      .eq("artist_user_id", context.userId)
      .eq("action", ACTION)
      .eq("status", "succeeded")
      .gte("created_at", dayStart())
    if ((count || 0) >= context.dailyLimit) throw fail("website_ai_daily_limit_reached", 429)
  }
  if (context.sessionLimit > 0) {
    const { count } = await context.admin.from("artist_extraction_jobs")
      .select("id", { count: "exact", head: true })
      .eq("artist_user_id", context.userId)
      .eq("action", ACTION)
      .eq("website_import_session_id", sessionId)
      .eq("status", "ready_for_review")
    if ((count || 0) >= context.sessionLimit) throw fail("website_ai_session_limit_reached", 429)
  }
}
async function ensureSource(context: Context, session: Json, evidenceHash: string, coverage: EvidencePackage["scan_summary"]) {
  const { data: existing } = await context.admin.from("artist_import_sources")
    .select("*")
    .eq("artist_user_id", context.userId)
    .eq("checksum", evidenceHash)
    .maybeSingle()
  if (existing) return existing as Json
  const { data, error } = await context.admin.from("artist_import_sources").insert({
    artist_user_id: context.userId,
    source_type: "website",
    label: `Website evidence · ${text(session.canonical_url || session.website_url, 500)}`,
    storage_path: "",
    external_url: text(session.canonical_url || session.website_url, 2_000),
    mime_type: "text/html",
    checksum: evidenceHash,
    extraction_status: "processing",
    extraction_method: PROMPT_VERSION,
    extracted_at: new Date().toISOString(),
    media_kind: "document",
    library_status: "draft",
    classification: "other_artist_material",
    classification_confidence: 1,
    classification_reason: "Deterministically collected public website evidence awaiting artist review.",
    extraction_version: PROMPT_VERSION,
    sensitivity: "standard",
    privacy_level: "private",
    source_metadata: {
      import_context: "website_evidence_organization",
      website_import_session_id: text(session.id, 100),
      public_content_only: true,
      privacy_boundary: "AI organization currently processes public website material only.",
      coverage,
    },
  }).select("*").single()
  if (error || !data) throw error || fail("website_organization_failed")
  return data as Json
}
async function loadProposals(context: Context, jobId: string) {
  const { data, error } = await context.admin.from("artist_import_proposals")
    .select("*")
    .eq("artist_user_id", context.userId)
    .eq("extraction_job_id", jobId)
    .order("created_at", { ascending: true })
  if (error) throw error
  return data || []
}
async function cachedRun(context: Context, inputHash: string) {
  const { data } = await context.admin.from("artist_extraction_jobs")
    .select("*")
    .eq("artist_user_id", context.userId)
    .eq("action", ACTION)
    .eq("input_hash", inputHash)
    .eq("status", "ready_for_review")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  return data as Json | null
}
async function createRun(context: Context, input: {
  sourceId: string
  sessionId: string
  evidenceHash: string
  inputHash: string
  force: boolean
}) {
  const baseVersion = `${PROMPT_VERSION}:${SCHEMA_VERSION}:${context.model}`
  let extractorVersion = baseVersion
  if (input.force) {
    const { count } = await context.admin.from("artist_extraction_jobs")
      .select("id", { count: "exact", head: true })
      .eq("artist_user_id", context.userId)
      .eq("source_id", input.sourceId)
      .eq("action", ACTION)
    extractorVersion = `${baseVersion}:r${(count || 0) + 1}`
  } else {
    const { data: existing } = await context.admin.from("artist_extraction_jobs")
      .select("*")
      .eq("artist_user_id", context.userId)
      .eq("source_id", input.sourceId)
      .eq("extractor_version", baseVersion)
      .maybeSingle()
    if (existing?.status === "processing") throw fail("website_ai_organization_in_progress", 409)
    if (existing) {
      await context.admin.from("artist_import_proposals")
        .delete()
        .eq("artist_user_id", context.userId)
        .eq("extraction_job_id", existing.id)
      const { data, error } = await context.admin.from("artist_extraction_jobs").update({
        status: "processing",
        attempt: Number(existing.attempt || 1) + 1,
        summary: {},
        input_hash: input.inputHash,
        extracted_text_checksum: input.evidenceHash,
        error_category: "",
        started_at: new Date().toISOString(),
        completed_at: null,
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id).eq("artist_user_id", context.userId).select("*").single()
      if (error || !data) throw error || fail("website_organization_failed")
      return data as Json
    }
  }
  const { data, error } = await context.admin.from("artist_extraction_jobs").insert({
    artist_user_id: context.userId,
    source_id: input.sourceId,
    classification: "other_artist_material",
    status: "processing",
    extractor_version: extractorVersion,
    attempt: 1,
    extracted_text_checksum: input.evidenceHash,
    summary: {},
    action: ACTION,
    provider: PROVIDER,
    model: context.model,
    prompt_version: PROMPT_VERSION,
    schema_version: SCHEMA_VERSION,
    input_hash: input.inputHash,
    website_import_session_id: input.sessionId,
    started_at: new Date().toISOString(),
  }).select("*").single()
  if (error || !data) throw error || fail("website_organization_failed")
  return data as Json
}
async function saveProposals(context: Context, sourceId: string, jobId: string, output: OrganizedOutput) {
  const rows: Json[] = []
  for (const category of CATEGORIES) {
    for (const item of output[category]) {
      rows.push({
        artist_user_id: context.userId,
        source_id: sourceId,
        extraction_job_id: jobId,
        target_field: category,
        target_section: category,
        proposed_value: item.display_value,
        normalized_value: { category, ...item },
        evidence_excerpt: item.source_excerpt,
        evidence_location: {
          source_page_ref: item.source_page_ref,
          source_url: item.source_url,
          evidence_image_refs: item.evidence_image_refs,
        },
        extraction_method: `${PROVIDER}:${PROMPT_VERSION}`,
        confidence: confidence(item.confidence),
        status: item.classification === "conflicting"
          ? "conflicting"
          : item.classification === "uncertain"
            ? "needs_clarification"
            : "proposed",
        claim_type: item.classification,
        sensitivity: "standard",
        fingerprint: await sha256(JSON.stringify({
          category,
          display: item.display_value,
          page: item.source_page_ref,
          excerpt: item.source_excerpt,
        })),
        relationship_status: item.classification === "conflicting" ? "conflict" : "new",
        decision_reason: item.reason,
      })
    }
  }
  if (!rows.length) return []
  const { data, error } = await context.admin.from("artist_import_proposals").insert(rows).select("*")
  if (error) throw error
  return data || []
}

async function organize(context: Context, body: Json) {
  const sessionId = text(body.website_import_session_id, 100)
  if (!sessionId) throw fail("website_import_session_not_found", 400)
  const force = body.force_reanalysis === true
  const session = await loadSession(context, sessionId)
  const evidence = boundEvidence(buildEvidencePackage(session))
  if (!evidence.pages.length || !evidence.pages.some((page) => page.paragraphs.length || page.description || page.headings.length)) {
    throw fail("website_scan_has_insufficient_evidence", 422)
  }
  const evidenceHash = await sha256(JSON.stringify(evidence))
  const inputHash = await sha256(JSON.stringify({
    artist: context.userId,
    session: sessionId,
    evidenceHash,
    prompt: PROMPT_VERSION,
    schema: SCHEMA_VERSION,
    model: context.model,
    action: ACTION,
  }))
  if (!force) {
    const cached = await cachedRun(context, inputHash)
    if (cached) {
      const summary = object(cached.summary) ? cached.summary : {}
      const proposals = await loadProposals(context, text(cached.id, 100))
      await recordUsage(context, "cached", { metadata: { website_import_session_id: sessionId, input_hash: inputHash } })
      return {
        run: cached,
        proposals,
        result: summary.organized_output || {},
        coverage: summary.coverage || evidence.scan_summary,
        cached: true,
        artist_confirmation_required: true,
      }
    }
  }
  await enforceLimits(context, sessionId)
  const source = await ensureSource(context, session, evidenceHash, evidence.scan_summary)
  const run = await createRun(context, {
    sourceId: text(source.id, 100),
    sessionId,
    evidenceHash,
    inputHash,
    force,
  })
  let provider: Awaited<ReturnType<typeof runGemini>> | undefined
  try {
    provider = await runGemini(context, evidence)
    const output = validateOutput(provider.output, evidence)
    const proposals = await saveProposals(context, text(source.id, 100), text(run.id, 100), output)
    const completedAt = new Date().toISOString()
    const summary = {
      provider: PROVIDER,
      model: context.model,
      prompt_version: PROMPT_VERSION,
      schema_version: SCHEMA_VERSION,
      evidence_hash: evidenceHash,
      input_hash: inputHash,
      public_content_only: true,
      coverage: evidence.scan_summary,
      proposal_count: proposals.length,
      professional_history_count: CATEGORIES
        .filter((category) => !["identity", "biography", "artist_statement", "practice_description", "disciplines", "mediums", "artworks"].includes(category))
        .reduce((sum, category) => sum + output[category].length, 0),
      likely_artwork_count: output.artworks.length,
      conflict_count: output.conflicts.length,
      uncertain_count: CATEGORIES.reduce((sum, category) => sum + output[category].filter((item) => item.classification === "uncertain").length, 0),
      organized_output: output,
    }
    const { data: updated, error } = await context.admin.from("artist_extraction_jobs").update({
      status: "ready_for_review",
      summary,
      completed_at: completedAt,
      provider_request_id: provider.requestId,
      usage: provider.usage,
      latency_ms: provider.latencyMs,
      error_category: "",
    }).eq("id", run.id).eq("artist_user_id", context.userId).select("*").single()
    if (error) throw error
    await context.admin.from("artist_import_sources").update({
      extraction_status: "review_ready",
      review_summary: { website_organization_run_id: run.id, proposal_count: proposals.length },
      updated_at: completedAt,
    }).eq("id", source.id).eq("artist_user_id", context.userId)
    await recordUsage(context, "succeeded", {
      requestId: provider.requestId,
      inputTokens: provider.usage.input_tokens,
      outputTokens: provider.usage.output_tokens,
      totalTokens: provider.usage.total_tokens,
      latencyMs: provider.latencyMs,
      metadata: {
        website_import_session_id: sessionId,
        evidence_hash: evidenceHash,
        input_hash: inputHash,
        proposal_count: proposals.length,
      },
    })
    return {
      run: updated,
      proposals,
      result: output,
      coverage: evidence.scan_summary,
      cached: false,
      artist_confirmation_required: true,
    }
  } catch (reason) {
    const code = safeError(reason)
    await context.admin.from("artist_extraction_jobs").update({
      status: "failed",
      error_category: code,
      completed_at: new Date().toISOString(),
    }).eq("id", run.id).eq("artist_user_id", context.userId)
    await recordUsage(context, "failed", {
      requestId: provider?.requestId,
      inputTokens: provider?.usage.input_tokens,
      outputTokens: provider?.usage.output_tokens,
      totalTokens: provider?.usage.total_tokens,
      latencyMs: provider?.latencyMs,
      errorCode: code,
      metadata: {
        website_import_session_id: sessionId,
        evidence_hash: evidenceHash,
        input_hash: inputHash,
      },
    })
    throw reason
  }
}
function capabilities(context: Context) {
  return {
    configured: Boolean(context.apiKey && context.model),
    provider: PROVIDER,
    model: context.model || DEFAULT_MODEL,
    action: ACTION,
    prompt_version: PROMPT_VERSION,
    schema_version: SCHEMA_VERSION,
    public_content_only: true,
    privacy_boundary: "AI organization currently processes public website material only. Private KLEIO materials remain outside this workflow.",
    daily_limit: context.dailyLimit,
    per_session_limit: context.sessionLimit,
    max_evidence_characters: MAX_EVIDENCE_CHARS,
    max_pages: MAX_PAGES,
    max_images: MAX_IMAGES,
    requires_artist_review: true,
  }
}

if (import.meta.main) Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors(request) })
  if (request.method !== "POST") return reply(request, { error: "method_not_allowed" }, 405)
  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return reply(request, { error: "authentication_required" }, 401)
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceKey) return reply(request, { error: "service_configuration_unavailable" }, 503)
  const auth = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })
  const { data: userData } = await auth.auth.getUser(authorization.slice(7))
  if (!userData.user) return reply(request, { error: "authentication_required" }, 401)
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: profile } = await admin.from("profiles").select("role").eq("id", userData.user.id).single()
  if (profile?.role !== "artist") return reply(request, { error: "artist_account_required" }, 403)
  let body: Json
  try { body = await request.json() } catch { return reply(request, { error: "invalid_json" }, 400) }
  const context: Context = {
    request,
    userId: userData.user.id,
    admin,
    apiKey: text(Deno.env.get("GEMINI_API_KEY"), 4_000),
    model: safeModel(text(Deno.env.get("GEMINI_MODEL"), 100)),
    dailyLimit: envInt("KLEIO_WEBSITE_AI_DAILY_LIMIT", 3, 100),
    sessionLimit: envInt("KLEIO_WEBSITE_AI_SESSION_LIMIT", 2, 20),
  }
  const action = text(body.action, 80)
  if (action === "capabilities") return reply(request, capabilities(context))
  if (action !== ACTION) return reply(request, { error: "unsupported_action" }, 400)
  if (!context.apiKey) return reply(request, { error: "gemini_not_configured", ...capabilities(context) }, 503)
  if (!context.model) return reply(request, { error: "gemini_model_not_configured", ...capabilities(context) }, 503)
  try {
    return reply(request, await organize(context, body))
  } catch (reason) {
    const error = reason as Failure
    return reply(request, {
      error: safeError(reason),
      message: "AI organization is temporarily unavailable. The completed website scan remains available for manual review.",
    }, error.status || 422)
  }
})