import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.110.5"
import {
  DEFAULT_DRAFT_MODEL,
  DRAFT_PROMPT_VERSION,
  GEMINI_PROVIDER,
  cleanText,
  draftSchema,
  runGeminiStructured,
  safeModel,
  validateDraftOutput,
  type JsonObject,
} from "../_shared/gemini-document-intelligence.ts"

const ALLOWED_ORIGINS = [
  /^https:\/\/([a-z0-9-]+\.)?kleioarthouse\.com$/i,
  /^https:\/\/cowboyblurr\.github\.io$/i,
  /^http:\/\/localhost(?::\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/i,
]

function object(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

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

function systemInstruction() {
  return `You are KLEIO Assist, an evidence-grounded application writing partner for visual artists. Answer the exact opportunity question supplied. Use only artist-confirmed private records and the verified opportunity requirement supplied in this request. Never invent exhibitions, education, awards, grants, residencies, publications, institutions, dates, locations, collaborators, identities, budgets, project timelines, community relationships, motives, intent, impact, recognition, prestige, innovation, or importance. If the question requires motivation, future intent, a budget, a date, a plan, or any other fact that the supplied evidence does not establish, state that missing context instead of manufacturing it. Preserve the artist's existing language where useful. Avoid generic grant filler, exaggerated fit, and repeated biography language. Every factual claim must cite one or more supplied evidence refs. Return only JSON matching the provided schema.`
}

function stableError(reason: unknown) {
  const code = reason instanceof Error ? reason.message.split(":")[0] : ""
  return [
    "gemini_not_configured",
    "gemini_timeout",
    "gemini_rate_limited",
    "gemini_provider_unavailable",
    "gemini_authentication_failed",
    "gemini_model_unavailable",
    "gemini_schema_rejected",
    "gemini_invalid_structured_output",
    "gemini_invalid_draft_schema",
    "draft_length_out_of_bounds",
    "draft_missing_evidence",
    "draft_claim_missing_evidence",
    "draft_contains_unsupported_tokens",
  ].includes(code) ? code : "application_answer_failed"
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) })
  if (request.method !== "POST") return json(request, { error: "method_not_allowed" }, 405)

  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return json(request, { error: "authentication_required" }, 401)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json(request, { error: "service_configuration_unavailable" }, 503)

  const auth = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: userData } = await auth.auth.getUser(authorization.slice("Bearer ".length))
  if (!userData.user) return json(request, { error: "authentication_required" }, 401)

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: role } = await admin.from("profiles").select("role").eq("id", userData.user.id).single()
  if (role?.role !== "artist") return json(request, { error: "artist_account_required" }, 403)

  let body: JsonObject
  try {
    const parsed = await request.json()
    if (!object(parsed)) return json(request, { error: "invalid_json" }, 400)
    body = parsed
  } catch {
    return json(request, { error: "invalid_json" }, 400)
  }

  const opportunityId = cleanText(body.opportunity_id, 100)
  const requirementId = cleanText(body.requirement_id, 100)
  const suppliedQuestion = cleanText(body.question_text, 8_000)
  if (!opportunityId) return json(request, { error: "opportunity_required" }, 400)

  const apiKey = cleanText(Deno.env.get("GEMINI_API_KEY"), 4_000)
  const model = safeModel(Deno.env.get("GEMINI_DRAFT_MODEL"), DEFAULT_DRAFT_MODEL)
  if (!apiKey) return json(request, { error: "gemini_not_configured" }, 503)

  const [{ data: opportunity }, { data: requirement }, { data: records, error: recordError }] = await Promise.all([
    admin.from("opportunities").select("id,title,provider_name,summary,description,disciplines,required_materials,deadline_at,deadline_timezone,submission_method,submission_instructions,canonical_url,application_url").eq("id", opportunityId).maybeSingle(),
    requirementId
      ? admin.from("opportunity_requirements").select("id,opportunity_id,material_key,label,description,source_text,source_url,verification_status,maximum_word_count,minimum_word_count,requires_artist_confirmation,confidence_score").eq("id", requirementId).eq("opportunity_id", opportunityId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    admin.from("artist_passport_records").select("id,record_type,section,display_value,source_id,source_page,evidence_excerpt,provenance_status,confirmed_at").eq("artist_user_id", userData.user.id).eq("status", "active").eq("is_sensitive", false).not("confirmed_at", "is", null).order("confirmed_at", { ascending: false }).limit(180),
  ])

  if (!opportunity) return json(request, { error: "opportunity_not_found" }, 404)
  if (recordError) return json(request, { error: "confirmed_records_unavailable" }, 500)
  if (!records?.length) return json(request, { error: "confirmed_facts_required" }, 422)

  const question = suppliedQuestion || cleanText(requirement?.source_text || requirement?.label, 8_000)
  if (!question) return json(request, { error: "question_required" }, 400)

  const sourceIds = Array.from(new Set(records.map((record) => record.source_id).filter(Boolean)))
  const { data: sourceRows } = sourceIds.length
    ? await admin.from("artist_import_sources").select("id,label,original_filename").eq("artist_user_id", userData.user.id).in("id", sourceIds)
    : { data: [] }
  const sourceMap = new Map((sourceRows ?? []).map((source) => [source.id, source.original_filename || source.label || "Private artist source"]))

  const evidence = records.map((record) => ({
    ref: `record_${record.id}`,
    record_type: record.record_type,
    section: record.section,
    value: cleanText(record.display_value, 3_000),
    source_ref: record.source_id ? `source_${record.source_id}` : null,
    source_label: record.source_id ? sourceMap.get(record.source_id) || "Private artist source" : "Artist-confirmed Passport record",
    source_page: record.source_page,
    evidence_excerpt: cleanText(record.evidence_excerpt, 1_200),
    provenance_status: record.provenance_status,
  }))
  const evidenceRefs = new Set(evidence.map((item) => item.ref))

  const requestedMaximum = Number(body.maximum_words)
  const requirementMaximum = Number(requirement?.maximum_word_count)
  const maximumWords = Number.isInteger(requestedMaximum) && requestedMaximum > 0
    ? Math.min(requestedMaximum, 1_000)
    : Number.isInteger(requirementMaximum) && requirementMaximum > 0
      ? Math.min(requirementMaximum, 1_000)
      : 450
  const minimumWords = 25
  const evidenceCorpus = [
    evidence.map((item) => item.value).join("\n"),
    question,
    opportunity.summary,
    opportunity.description,
  ].join("\n").slice(0, 100_000)

  const opportunityContext = {
    id: opportunity.id,
    title: cleanText(opportunity.title, 300),
    provider: cleanText(opportunity.provider_name, 300),
    summary: cleanText(opportunity.summary, 4_000),
    description: cleanText(opportunity.description, 8_000),
    disciplines: opportunity.disciplines,
    required_materials: opportunity.required_materials,
    deadline_at: opportunity.deadline_at,
    deadline_timezone: opportunity.deadline_timezone,
    submission_method: opportunity.submission_method,
    submission_instructions: cleanText(opportunity.submission_instructions, 4_000),
    canonical_url: opportunity.canonical_url,
    application_url: opportunity.application_url,
  }

  try {
    const provider = await runGeminiStructured<JsonObject>({
      apiKey,
      model,
      systemInstruction: systemInstruction(),
      prompt: `Prepare two materially different answer options for this exact application question.\n\nQUESTION:\n${question}\n\nOPPORTUNITY CONTEXT:\n${JSON.stringify(opportunityContext)}\n\nVERIFIED REQUIREMENT:\n${JSON.stringify(requirement)}\n\nARTIST-CONFIRMED EVIDENCE:\n${JSON.stringify(evidence)}\n\nRULES:\n- Answer the exact question, not the artist biography in general.\n- Keep each option at or below ${maximumWords} words.\n- Do not infer motivation or future intent unless the evidence establishes it.\n- If a useful answer cannot be completed without artist input, put the missing facts in missing_context and keep the draft conservative.\n- Every factual claim must cite supplied record refs.\n- Do not copy the opportunity language mechanically.\n- Do not create accomplishments, dates, budgets, collaborators, project promises, or outcomes.`,
      responseSchema: draftSchema(),
      timeoutMs: 72_000,
      maxOutputTokens: 12_000,
    })

    const output = validateDraftOutput(provider.output, {
      evidenceRefs,
      correlationRefs: new Set<string>(),
      evidenceCorpus,
      minWords: minimumWords,
      maxWords: maximumWords,
    })

    const now = new Date().toISOString()
    const { data: draft, error: insertError } = await admin.from("artist_ai_drafts").insert({
      artist_user_id: userData.user.id,
      draft_type: "application_answer",
      status: "generated",
      provider: GEMINI_PROVIDER,
      model: provider.model,
      prompt_version: `${DRAFT_PROMPT_VERSION}_application_question_v1`,
      evidence,
      request_context: {
        requested_kind: "application_answer",
        opportunity_id: opportunityId,
        requirement_id: requirement?.id ?? null,
        question,
        maximum_words: maximumWords,
        generated_at: now,
      },
      generated_output: output,
      artist_edited_text: "",
      artist_review: {
        artist_confirmation_required: true,
        private_until_approved: true,
        confirmed_facts_only: true,
        exact_question_grounding: true,
      },
      approved_at: null,
      provider_request_id: provider.requestId,
      usage: provider.usage,
      last_error_code: "",
    }).select("*").single()

    if (insertError || !draft) return json(request, { error: "draft_record_failed" }, 500)

    await admin.from("artist_ai_usage_events").insert({
      artist_user_id: userData.user.id,
      action: "generate_application_answer",
      provider: GEMINI_PROVIDER,
      model: provider.model,
      status: "succeeded",
      input_units: provider.usage.input_tokens,
      output_units: provider.usage.output_tokens,
      total_units: provider.usage.total_tokens,
      latency_ms: provider.latencyMs,
      provider_request_id: provider.requestId,
      error_code: "",
      metadata: {
        opportunity_id: opportunityId,
        requirement_id: requirement?.id ?? null,
        evidence_count: evidence.length,
        maximum_words: maximumWords,
      },
    })

    return json(request, {
      draft,
      options: output,
      label: "Suggested draft · prepared from artist-confirmed Creative Passport records and the exact opportunity question.",
      confirmedFactsOnly: true,
      artistConfirmationRequired: true,
    })
  } catch (reason) {
    const code = stableError(reason)
    await admin.from("artist_ai_usage_events").insert({
      artist_user_id: userData.user.id,
      action: "generate_application_answer",
      provider: GEMINI_PROVIDER,
      model,
      status: "failed",
      input_units: 0,
      output_units: 0,
      total_units: 0,
      latency_ms: null,
      provider_request_id: "",
      error_code: code,
      metadata: { opportunity_id: opportunityId, requirement_id: requirement?.id ?? null },
    })
    return json(request, {
      error: code === "draft_contains_unsupported_tokens" ? "unsupported_claim_detected" : code,
      message: code === "draft_contains_unsupported_tokens"
        ? "KLEIO rejected this draft because it introduced unsupported factual information."
        : "KLEIO could not prepare an evidence-grounded answer for this question.",
    }, code === "gemini_rate_limited" ? 429 : code === "gemini_not_configured" || code === "gemini_provider_unavailable" ? 503 : 422)
  }
})