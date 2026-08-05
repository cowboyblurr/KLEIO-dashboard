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

const ALLOWED_ORIGINS = [/^https:\/\/([a-z0-9-]+\.)?kleioarthouse\.com$/i, /^https:\/\/cowboyblurr\.github\.io$/i, /^http:\/\/localhost(?::\d+)?$/i, /^http:\/\/127\.0\.0\.1(?::\d+)?$/i]
const DRAFT_KINDS = {
  short_bio: { draftType: "biography", minWords: 50, maxWords: 75, voice: "concise third-person biography" },
  standard_bio: { draftType: "biography", minWords: 120, maxWords: 160, voice: "standard third-person biography" },
  extended_bio: { draftType: "biography", minWords: 220, maxWords: 300, voice: "extended third-person biography" },
  first_person_bio: { draftType: "biography", minWords: 100, maxWords: 180, voice: "grounded first-person biography" },
  third_person_bio: { draftType: "biography", minWords: 100, maxWords: 180, voice: "grounded third-person biography" },
  practice_description: { draftType: "practice_description", minWords: 90, maxWords: 160, voice: "clear third-person practice description" },
  first_person_practice: { draftType: "practice_description", minWords: 90, maxWords: 160, voice: "direct first-person practice introduction" },
  artist_statement_support: { draftType: "artist_statement", minWords: 180, maxWords: 350, voice: "artist-statement support preserving approved artist language" },
  project_description: { draftType: "project_description", minWords: 120, maxWords: 350, voice: "clear project description" },
  artwork_description: { draftType: "artwork_description", minWords: 60, maxWords: 180, voice: "specific artwork description" },
  application_introduction: { draftType: "submission_letter", minWords: 90, maxWords: 170, voice: "grounded opportunity-specific application introduction" },
  application_answer: { draftType: "application_answer", minWords: 100, maxWords: 450, voice: "direct application answer matching approved opportunity context" },
} as const

type DraftKind = keyof typeof DRAFT_KINDS

function object(value: unknown): value is JsonObject { return Boolean(value) && typeof value === "object" && !Array.isArray(value) }
function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? ""
  const allowed = ALLOWED_ORIGINS.some((pattern) => pattern.test(origin)) ? origin : "https://www.kleioarthouse.com"
  return { "Access-Control-Allow-Origin": allowed, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" }
}
function json(request: Request, body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(request), "Content-Type": "application/json", "Cache-Control": "no-store" } }) }
function systemInstruction() {
  return `You are KLEIO Assist, an evidence-grounded writing partner for artists. Write only from the artist-approved private records and optional artist-approved opportunity context supplied in the request. Never invent exhibitions, education, awards, grants, residencies, publications, institutions, dates, locations, collaborators, identities, community relationships, motives, intent, recognition, prestige, impact, innovation, or importance. Artist-approved correlations may shape language but are not verified facts. Distinguish biography from artist statement. Preserve meaningful artist-authored language. Avoid generic curatorial, academic, startup, or grant filler. Do not keyword-stuff or copy opportunity language excessively. When context is missing, identify the gap rather than filling it imaginatively. Produce two meaningfully different options. Every factual claim must cite one or more supplied evidence refs. Use only supplied refs. Return only JSON matching the provided schema.`
}
function evidenceCorpus(records: JsonObject[], correlations: JsonObject[], opportunity: JsonObject | null) { return [records.map((item) => String(item.value || "")).join("\n"), correlations.map((item) => String(item.language || "")).join("\n"), opportunity ? JSON.stringify(opportunity) : ""].join("\n").slice(0, 100_000) }
function stableError(reason: unknown) {
  const code = reason instanceof Error ? reason.message.split(":")[0] : ""
  return ["gemini_not_configured", "gemini_timeout", "gemini_rate_limited", "gemini_provider_unavailable", "gemini_authentication_failed", "gemini_model_unavailable", "gemini_schema_rejected", "gemini_invalid_structured_output", "gemini_invalid_draft_schema", "draft_length_out_of_bounds", "draft_missing_evidence", "draft_claim_missing_evidence", "draft_contains_unsupported_tokens"].includes(code) ? code : "document_drafting_failed"
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) })
  if (request.method !== "POST") return json(request, { error: "method_not_allowed" }, 405)
  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return json(request, { error: "authentication_required" }, 401)
  const supabaseUrl = Deno.env.get("SUPABASE_URL"), anonKey = Deno.env.get("SUPABASE_ANON_KEY"), serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json(request, { error: "service_configuration_unavailable" }, 503)
  const auth = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } })
  const { data: userData } = await auth.auth.getUser(authorization.slice("Bearer ".length))
  if (!userData.user) return json(request, { error: "authentication_required" }, 401)
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: role } = await admin.from("profiles").select("role").eq("id", userData.user.id).single()
  if (role?.role !== "artist") return json(request, { error: "artist_account_required" }, 403)
  let body: JsonObject
  try { const parsed = await request.json(); if (!object(parsed)) return json(request, { error: "invalid_json" }, 400); body = parsed } catch { return json(request, { error: "invalid_json" }, 400) }

  const apiKey = cleanText(Deno.env.get("GEMINI_API_KEY"), 4_000), model = safeModel(Deno.env.get("GEMINI_DRAFT_MODEL"), DEFAULT_DRAFT_MODEL), action = cleanText(body.action, 80)
  if (action === "capabilities") return json(request, { configured: Boolean(apiKey), provider: GEMINI_PROVIDER, model, promptVersion: DRAFT_PROMPT_VERSION, artistConfirmationRequired: true, confirmedFactsOnly: true, approvedEvidenceOnly: true, unsupportedClaimValidation: true, supportedKinds: Object.keys(DRAFT_KINDS) })
  if (action !== "generate_draft") return json(request, { error: "unsupported_action" }, 400)
  if (!apiKey) return json(request, { error: "gemini_not_configured" }, 503)
  const kind = cleanText(body.kind, 80) as DraftKind, configuration = DRAFT_KINDS[kind]
  if (!configuration) return json(request, { error: "invalid_draft_kind" }, 400)

  const [{ data: records, error: recordError }, { data: correlations, error: correlationError }] = await Promise.all([
    admin.from("artist_passport_records").select("id,record_type,section,display_value,source_id,source_page,evidence_excerpt,provenance_status,confirmed_at").eq("artist_user_id", userData.user.id).eq("status", "active").eq("is_sensitive", false).not("confirmed_at", "is", null).order("confirmed_at", { ascending: false }).limit(160),
    admin.from("artist_document_correlations").select("id,title,artist_edited_text,summary,related_passport_field,supporting_evidence").eq("artist_user_id", userData.user.id).eq("status", "confirmed_useful_language").limit(50),
  ])
  if (recordError) return json(request, { error: "confirmed_records_unavailable" }, 500)
  if (correlationError) return json(request, { error: "approved_correlations_unavailable" }, 500)
  if (!records?.length) return json(request, { error: "confirmed_facts_required" }, 422)

  const sourceIds = Array.from(new Set(records.map((record) => record.source_id).filter(Boolean)))
  const { data: sourceRows } = sourceIds.length ? await admin.from("artist_import_sources").select("id,label,original_filename").eq("artist_user_id", userData.user.id).in("id", sourceIds) : { data: [] }
  const sourceMap = new Map((sourceRows ?? []).map((source) => [source.id, source.original_filename || source.label || "Private artist source"]))
  const evidence = records.map((record) => ({ ref: `record_${record.id}`, record_type: record.record_type, section: record.section, value: cleanText(record.display_value, 3_000), source_ref: record.source_id ? `source_${record.source_id}` : null, source_label: record.source_id ? sourceMap.get(record.source_id) || "Private artist source" : "Artist-confirmed Passport record", source_page: record.source_page, evidence_excerpt: cleanText(record.evidence_excerpt, 1_200), provenance_status: record.provenance_status }))
  const approvedCorrelations = (correlations ?? []).map((item) => ({ ref: `correlation_${item.id}`, title: cleanText(item.title, 300), language: cleanText(item.artist_edited_text || item.summary, 2_000), related_field: cleanText(item.related_passport_field, 200) }))
  const evidenceRefs = new Set(evidence.map((item) => item.ref)), correlationRefs = new Set(approvedCorrelations.map((item) => item.ref))

  let opportunityContext: JsonObject | null = null
  const opportunityId = cleanText(body.opportunity_id, 100)
  if (opportunityId && ["application_introduction", "application_answer", "project_description"].includes(kind)) {
    const { data: opportunity } = await admin.from("opportunities").select("id,title,provider_name,summary,description,disciplines,eligible_applicant_types,eligible_countries,eligible_regions,career_stages,required_materials,locations,deadline_at,submission_method,submission_instructions,canonical_url,application_url").eq("id", opportunityId).maybeSingle()
    if (opportunity) opportunityContext = { id: opportunity.id, title: cleanText(opportunity.title, 300), provider: cleanText(opportunity.provider_name, 300), summary: cleanText(opportunity.summary, 4_000), description: cleanText(opportunity.description, 8_000), disciplines: opportunity.disciplines, eligible_applicant_types: opportunity.eligible_applicant_types, eligible_countries: opportunity.eligible_countries, eligible_regions: opportunity.eligible_regions, career_stages: opportunity.career_stages, required_materials: opportunity.required_materials, locations: opportunity.locations, deadline: opportunity.deadline_at, submission_method: opportunity.submission_method, submission_instructions: cleanText(opportunity.submission_instructions, 4_000), source_url: opportunity.canonical_url, application_url: opportunity.application_url }
  }
  const maximumWords = Number(body.maximum_words), maxWords = Number.isInteger(maximumWords) && maximumWords >= configuration.minWords && maximumWords <= 1_000 ? maximumWords : configuration.maxWords
  const corpus = evidenceCorpus(evidence, approvedCorrelations, opportunityContext)

  try {
    const provider = await runGeminiStructured<JsonObject>({ apiKey, model, systemInstruction: systemInstruction(), prompt: `Prepare two private KLEIO draft options.\n\nREQUESTED KIND: ${kind}\nVOICE: ${configuration.voice}\nWORD RANGE: ${configuration.minWords}-${maxWords}\n\nARTIST-APPROVED FACTUAL RECORDS:\n${JSON.stringify(evidence)}\n\nARTIST-APPROVED LANGUAGE CORRELATIONS (language guidance only, never facts):\n${JSON.stringify(approvedCorrelations)}\n\nAPPROVED OPPORTUNITY CONTEXT (only when present):\n${JSON.stringify(opportunityContext)}\n\nRequirements:\n- Every factual statement must cite supplied record refs.\n- Correlations may influence phrasing only and must use correlation refs.\n- Never use rejected, deferred, sensitive, unresolved, or unapproved information.\n- Name missing information rather than inventing it.\n- Preserve artist voice and avoid generic grant or curatorial filler.\n- Do not overstate fit or copy opportunity language excessively.`, responseSchema: draftSchema(), timeoutMs: 72_000, maxOutputTokens: 12_000 })
    const output = validateDraftOutput(provider.output, { evidenceRefs, correlationRefs, evidenceCorpus: corpus, minWords: configuration.minWords, maxWords })
    const now = new Date().toISOString()
    const { data: draft, error: insertError } = await admin.from("artist_ai_drafts").insert({ artist_user_id: userData.user.id, draft_type: configuration.draftType, status: "generated", provider: GEMINI_PROVIDER, model: provider.model, prompt_version: DRAFT_PROMPT_VERSION, evidence, request_context: { requested_kind: kind, voice: configuration.voice, minimum_words: configuration.minWords, maximum_words: maxWords, opportunity_id: opportunityContext?.id ?? null, opportunity_context_used: Boolean(opportunityContext), source_ids: sourceIds, evidence_record_ids: records.map((record) => record.id), correlation_ids: (correlations ?? []).map((item) => item.id), generated_at: now }, generated_output: output, artist_edited_text: "", artist_review: { artist_confirmation_required: true, private_until_approved: true, confirmed_facts_only: true, provider: GEMINI_PROVIDER }, approved_at: null, provider_request_id: provider.requestId, usage: provider.usage, last_error_code: "" }).select("*").single()
    if (insertError || !draft) return json(request, { error: "draft_record_failed" }, 500)
    await admin.from("artist_ai_usage_events").insert({ artist_user_id: userData.user.id, action: "generate_draft", provider: GEMINI_PROVIDER, model: provider.model, status: "succeeded", input_units: provider.usage.input_tokens, output_units: provider.usage.output_tokens, total_units: provider.usage.total_tokens, latency_ms: provider.latencyMs, provider_request_id: provider.requestId, error_code: "", metadata: { draft_type: configuration.draftType, requested_kind: kind, evidence_count: evidence.length, correlation_count: approvedCorrelations.length, opportunity_context_used: Boolean(opportunityContext) } })
    return json(request, { draft, options: output, label: "Prepared by KLEIO with Gemini from artist-approved records. Review and edit before saving or submitting.", confirmedFactsOnly: true, artistConfirmationRequired: true })
  } catch (reason) {
    const code = stableError(reason)
    await admin.from("artist_ai_usage_events").insert({ artist_user_id: userData.user.id, action: "generate_draft", provider: GEMINI_PROVIDER, model, status: "failed", input_units: 0, output_units: 0, total_units: 0, latency_ms: null, provider_request_id: "", error_code: code, metadata: { requested_kind: kind, evidence_count: evidence.length, opportunity_context_used: Boolean(opportunityContext) } })
    return json(request, { error: code === "draft_contains_unsupported_tokens" ? "unsupported_claim_detected" : code, message: code === "draft_contains_unsupported_tokens" ? "KLEIO rejected this draft because it introduced unsupported factual information." : "Gemini could not prepare this evidence-grounded draft." }, code === "gemini_rate_limited" ? 429 : code === "gemini_not_configured" || code === "gemini_provider_unavailable" ? 503 : 422)
  }
})
