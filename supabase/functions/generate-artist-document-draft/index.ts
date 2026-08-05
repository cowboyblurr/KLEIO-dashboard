import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.110.5"

const PROMPT_VERSION = "document_passport_drafting_v1"
const PROVIDER_TIMEOUT_MS = 55_000
const ALLOWED_ORIGINS = [
  /^https:\/\/([a-z0-9-]+\.)?kleioarthouse\.com$/i,
  /^https:\/\/cowboyblurr\.github\.io$/i,
  /^http:\/\/localhost(?::\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/i,
]
const DRAFT_KINDS = {
  short_bio: { draftType: "short_bio", minWords: 50, maxWords: 75, voice: "professional third person biography" },
  standard_bio: { draftType: "professional_bio", minWords: 120, maxWords: 160, voice: "professional third person biography" },
  extended_bio: { draftType: "professional_bio", minWords: 220, maxWords: 300, voice: "extended professional third person biography" },
  practice_description: { draftType: "practice_description", minWords: 90, maxWords: 160, voice: "concise practice description focused on confirmed media, methods and questions" },
  first_person_practice: { draftType: "practice_description", minWords: 90, maxWords: 160, voice: "first person practice introduction" },
} as const

type JsonObject = Record<string, unknown>
type DraftKind = keyof typeof DRAFT_KINDS
type ProviderResult = {
  output: JsonObject
  provider: string
  model: string
  requestId: string
  usage: Record<string, unknown>
  latencyMs: number
}
type ProviderRequest = { developer: string; userText: string; schema: JsonObject; maxTokens: number }
type Provider = {
  name: string
  primaryModel: string
  fallbackModel: string
  isConfigured(): boolean
  run(input: ProviderRequest): Promise<ProviderResult>
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

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function cleanText(value: unknown, max = 10_000) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
    : ""
}

function parseJson(value: string) {
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")
  const parsed = JSON.parse(cleaned)
  if (!isObject(parsed)) throw new Error("invalid_provider_output")
  return parsed
}

function safeModel(value: string, fallback: string) {
  return /^@cf\/[A-Za-z0-9._/-]+$/.test(value) ? value : fallback
}

function cloudflareText(payload: JsonObject) {
  const result = isObject(payload.result) ? payload.result : {}
  if (typeof result.response === "string") return result.response
  const choice = (Array.isArray(result.choices) ? result.choices : []).find(isObject)
  const message = choice && isObject(choice.message) ? choice.message : {}
  if (typeof message.content === "string") return message.content
  if (Array.isArray(message.content)) {
    for (const item of message.content) if (isObject(item) && typeof item.text === "string") return item.text
  }
  return ""
}

function createCloudflareProvider(): Provider {
  const accountId = cleanText(Deno.env.get("CLOUDFLARE_ACCOUNT_ID"), 100)
  const token = cleanText(Deno.env.get("CLOUDFLARE_AI_TOKEN"), 2_000)
  const primaryModel = safeModel(Deno.env.get("KLEIO_DRAFT_MODEL") || "@cf/google/gemma-4-26b-a4b-it", "@cf/google/gemma-4-26b-a4b-it")
  const fallbackModel = safeModel(Deno.env.get("KLEIO_FALLBACK_MODEL") || "@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/meta/llama-4-scout-17b-16e-instruct")

  async function runModel(model: string, input: ProviderRequest) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)
    const started = Date.now()
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${model}`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: input.developer },
            { role: "user", content: input.userText },
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name: "kleio_document_passport_draft", strict: true, schema: input.schema },
          },
          max_tokens: input.maxTokens,
          temperature: 0.45,
          store: false,
        }),
      })
      const payload = await response.json().catch(() => ({})) as JsonObject
      if (!response.ok || payload.success === false) throw new Error(response.status === 429 ? "provider_rate_limited" : "provider_request_failed")
      const text = cloudflareText(payload)
      if (!text) throw new Error("provider_returned_no_output")
      const result = isObject(payload.result) ? payload.result : {}
      return {
        output: parseJson(text),
        provider: "cloudflare",
        model,
        requestId: response.headers.get("cf-ray") || cleanText(result.request_id, 200),
        usage: isObject(result.usage) ? result.usage : {},
        latencyMs: Date.now() - started,
      }
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") throw new Error("provider_timeout")
      throw reason
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    name: "cloudflare",
    primaryModel,
    fallbackModel,
    isConfigured: () => Boolean(accountId && token),
    async run(input) {
      try {
        return await runModel(primaryModel, input)
      } catch (reason) {
        if (!fallbackModel || fallbackModel === primaryModel || (reason instanceof Error && reason.message === "provider_rate_limited")) throw reason
        return runModel(fallbackModel, input)
      }
    },
  }
}

function schema() {
  const option = {
    type: "object",
    additionalProperties: false,
    required: ["label", "text", "evidence_refs", "correlation_refs", "word_count"],
    properties: {
      label: { type: "string" },
      text: { type: "string" },
      evidence_refs: { type: "array", items: { type: "string" } },
      correlation_refs: { type: "array", items: { type: "string" } },
      word_count: { type: "integer" },
    },
  }
  return {
    type: "object",
    additionalProperties: false,
    required: ["options", "missing_context", "safety_notes"],
    properties: {
      options: { type: "array", minItems: 2, maxItems: 2, items: option },
      missing_context: { type: "array", items: { type: "string" } },
      safety_notes: { type: "array", items: { type: "string" } },
    },
  }
}

function wordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0
}

function validateOutput(
  output: JsonObject,
  evidenceRefs: Set<string>,
  correlationRefs: Set<string>,
  minWords: number,
  maxWords: number,
) {
  const options = Array.isArray(output.options) ? output.options.filter(isObject) : []
  if (options.length !== 2) throw new Error("invalid_provider_output")
  const normalized = options.map((option, index) => {
    const text = cleanText(option.text, 12_000)
    const count = wordCount(text)
    if (!text || count < Math.max(20, minWords - 15) || count > maxWords + 20) throw new Error("draft_length_out_of_bounds")
    const refs = (Array.isArray(option.evidence_refs) ? option.evidence_refs : []).map((value) => cleanText(value, 100)).filter((value) => evidenceRefs.has(value))
    if (!refs.length) throw new Error("draft_missing_evidence")
    const correlations = (Array.isArray(option.correlation_refs) ? option.correlation_refs : []).map((value) => cleanText(value, 100)).filter((value) => correlationRefs.has(value))
    return {
      label: cleanText(option.label, 120) || (index === 0 ? "Clear and professional" : "More expressive"),
      text,
      evidence_refs: refs,
      correlation_refs: correlations,
      word_count: count,
    }
  })
  return {
    options: normalized,
    missing_context: (Array.isArray(output.missing_context) ? output.missing_context : []).map((value) => cleanText(value, 500)).filter(Boolean).slice(0, 12),
    safety_notes: (Array.isArray(output.safety_notes) ? output.safety_notes : []).map((value) => cleanText(value, 500)).filter(Boolean).slice(0, 12),
  }
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
    if (!isObject(parsed)) return json(request, { error: "invalid_json" }, 400)
    body = parsed
  } catch {
    return json(request, { error: "invalid_json" }, 400)
  }

  const action = cleanText(body.action, 80)
  const provider = createCloudflareProvider()
  if (action === "capabilities") {
    return json(request, {
      configured: provider.isConfigured(),
      provider: provider.name,
      primaryModel: provider.primaryModel,
      fallbackModel: provider.fallbackModel,
      promptVersion: PROMPT_VERSION,
      artistConfirmationRequired: true,
      confirmedFactsOnly: true,
    })
  }
  if (action !== "generate_draft") return json(request, { error: "unsupported_action" }, 400)
  if (!provider.isConfigured()) return json(request, { error: "document_drafting_not_configured" }, 503)

  const kind = cleanText(body.kind, 80) as DraftKind
  const configuration = DRAFT_KINDS[kind]
  if (!configuration) return json(request, { error: "invalid_draft_kind" }, 400)

  const { data: records, error: recordError } = await admin
    .from("artist_passport_records")
    .select("id,record_type,section,display_value,source_id,source_page,evidence_excerpt,provenance_status,confirmed_at")
    .eq("artist_user_id", userData.user.id)
    .eq("status", "active")
    .eq("is_sensitive", false)
    .not("confirmed_at", "is", null)
    .order("confirmed_at", { ascending: false })
    .limit(120)
  if (recordError) return json(request, { error: "confirmed_records_unavailable" }, 500)
  if (!records?.length) return json(request, { error: "confirmed_facts_required" }, 422)

  const { data: correlations, error: correlationError } = await admin
    .from("artist_document_correlations")
    .select("id,title,artist_edited_text,summary,related_passport_field,supporting_evidence")
    .eq("artist_user_id", userData.user.id)
    .eq("status", "confirmed_useful_language")
    .limit(40)
  if (correlationError) return json(request, { error: "approved_correlations_unavailable" }, 500)

  const evidence = records.map((record) => ({
    ref: `record_${record.id}`,
    record_type: record.record_type,
    section: record.section,
    value: cleanText(record.display_value, 3_000),
    source_ref: record.source_id ? `source_${record.source_id}` : null,
    source_page: record.source_page,
    evidence_excerpt: cleanText(record.evidence_excerpt, 1_000),
    provenance_status: record.provenance_status,
  }))
  const approvedCorrelations = (correlations ?? []).map((item) => ({
    ref: `correlation_${item.id}`,
    title: cleanText(item.title, 300),
    language: cleanText(item.artist_edited_text || item.summary, 2_000),
    related_field: cleanText(item.related_passport_field, 200),
  }))
  const evidenceRefs = new Set(evidence.map((item) => item.ref))
  const correlationRefs = new Set(approvedCorrelations.map((item) => item.ref))

  const developer = `You are KLEIO Assist, an evidence-grounded writing partner for artists. Draft only from confirmed private Creative Passport records supplied below. Approved correlations may shape language, but they are not verified facts and must never create new claims. Never invent exhibitions, awards, grants, education, residencies, publications, locations, representation, collaborators, dates, identities, intent, prestige, recognition, innovation or importance. Do not say internationally recognized, acclaimed, groundbreaking, leading or critically celebrated unless a confirmed record literally supports the phrase. A biography should focus on professional identity and history. A practice description should focus on confirmed work, media, methods and questions. Produce two meaningfully different options. Every option must cite at least one supplied record ref. Use only supplied refs. Return structured JSON only.`

  let result: ProviderResult | undefined
  try {
    result = await provider.run({
      developer,
      userText: `DRAFT KIND: ${kind}
VOICE: ${configuration.voice}
TARGET LENGTH: ${configuration.minWords}-${configuration.maxWords} words
LABEL: Prepared by KLEIO Assist for review

CONFIRMED PRIVATE PASSPORT RECORDS:
${JSON.stringify(evidence)}

ARTIST-CONFIRMED USEFUL CORRELATION LANGUAGE (not facts):
${JSON.stringify(approvedCorrelations)}

Write two options. Do not combine biography and artist statement. Do not include unsupported claims.`,
      schema: schema(),
      maxTokens: Math.min(4_000, configuration.maxWords * 9 + 900),
    })
    const output = validateOutput(result.output, evidenceRefs, correlationRefs, configuration.minWords, configuration.maxWords)
    const { data: draft, error: insertError } = await admin.from("artist_ai_drafts").insert({
      artist_user_id: userData.user.id,
      draft_type: configuration.draftType,
      status: "generated",
      provider: result.provider,
      model: result.model,
      prompt_version: PROMPT_VERSION,
      evidence,
      request_context: {
        source: "document_intelligence",
        requested_kind: kind,
        minimum_words: configuration.minWords,
        maximum_words: configuration.maxWords,
        confirmed_record_count: evidence.length,
        approved_correlation_count: approvedCorrelations.length,
      },
      generated_output: output,
      provider_request_id: result.requestId,
      usage: result.usage,
    }).select("*").single()
    if (insertError) throw insertError

    await admin.from("artist_ai_usage_events").insert({
      artist_user_id: userData.user.id,
      action: "generate_draft",
      status: "succeeded",
      provider: result.provider,
      model: result.model,
      provider_request_id: result.requestId,
      input_units: Number(result.usage.input_tokens || 0),
      output_units: Number(result.usage.output_tokens || 0),
      total_units: Number(result.usage.total_tokens || 0),
      latency_ms: result.latencyMs,
      error_code: "",
      metadata: { source: "document_intelligence", draft_kind: kind, confirmed_record_count: evidence.length },
    })

    return json(request, {
      draft,
      options: output,
      label: "Prepared by KLEIO Assist for review",
      confirmedFactsOnly: true,
      artistConfirmationRequired: true,
    })
  } catch (reason) {
    await admin.from("artist_ai_usage_events").insert({
      artist_user_id: userData.user.id,
      action: "generate_draft",
      status: "failed",
      provider: result?.provider || provider.name,
      model: result?.model || provider.primaryModel,
      provider_request_id: result?.requestId || "",
      input_units: 0,
      output_units: 0,
      total_units: 0,
      latency_ms: result?.latencyMs || null,
      error_code: reason instanceof Error ? reason.message.slice(0, 120) : "document_draft_failed",
      metadata: { source: "document_intelligence", draft_kind: kind },
    })
    return json(request, { error: "document_draft_failed" }, 502)
  }
})
