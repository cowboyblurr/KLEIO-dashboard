import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.110.5"

type Json = Record<string, unknown>
type Counts = { fetched: number; created: number; updated: number; skipped: number; errors: number }

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const SEARCH_URL = "https://api.grants.gov/v1/api/search2"
const DETAIL_URL = "https://api.grants.gov/v1/api/fetchOpportunity"

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  })
}

function object(value: unknown): Json {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Json : {}
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : ""
}

function date(value: unknown): string | null {
  const raw = text(value)
  if (!raw) return null
  const parsed = Date.parse(raw)
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null
}

function numberValue(value: unknown): number | null {
  const raw = text(value).replace(/[^0-9.-]/g, "")
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function cleanHtml(value: unknown): string {
  return text(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function applicantKey(description: string) {
  const value = description.toLowerCase()
  if (value.includes("individual")) return "individual_artist"
  if (value.includes("nonprofit") || value.includes("non-profit")) return "nonprofit"
  if (value.includes("higher education") || value.includes("university") || value.includes("college")) return "educational_institution"
  if (value.includes("tribal")) return "tribal_organization"
  if (value.includes("small business") || value.includes("business")) return "business"
  if (value.includes("government") || value.includes("state") || value.includes("county") || value.includes("city") || value.includes("township")) return "government"
  if (value.includes("school district")) return "independent_school_districts"
  return value.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "other"
}

function descriptionList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((entry) => {
    const row = object(entry)
    return text(row.description) || text(row.name) || text(row.label)
  }).filter(Boolean))]
}

async function fetchJson(url: string, init: RequestInit): Promise<Json> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)
  try {
    const result = await fetch(url, { ...init, signal: controller.signal })
    const body = await result.text()
    if (!result.ok) throw new Error(`${result.status} ${result.statusText}: ${body.slice(0, 300)}`)
    return object(JSON.parse(body))
  } finally {
    clearTimeout(timer)
  }
}

async function checksum(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

async function recordError(supabase: SupabaseClient, jobId: string, sourceId: string, externalId: string, error: unknown, raw: Json = {}) {
  await supabase.from("opportunity_sync_errors").insert({
    job_id: jobId,
    source_id: sourceId,
    external_id: externalId,
    error_code: error instanceof DOMException && error.name === "AbortError" ? "timeout" : "sync_error",
    error_message: error instanceof Error ? error.message.slice(0, 1000) : String(error).slice(0, 1000),
    raw_data: raw,
  })
}

async function syncGrantsGov(supabase: SupabaseClient) {
  const { data: source, error: sourceError } = await supabase.from("opportunity_sources")
    .select("id").eq("slug", "grants-gov").eq("active", true).single()
  if (sourceError) throw sourceError
  const sourceId = String(source.id)

  await supabase.from("opportunity_import_jobs")
    .update({ status: "failed", completed_at: new Date().toISOString(), error_message: "Stale running job automatically closed." })
    .eq("source_id", sourceId).eq("status", "running")
    .lt("started_at", new Date(Date.now() - 30 * 60 * 1000).toISOString())

  const { data: job, error: jobError } = await supabase.from("opportunity_import_jobs")
    .insert({ source_id: sourceId, job_type: "official_api_sync", status: "running", metadata: { source_slug: "grants-gov" } })
    .select("id").single()
  if (jobError) throw jobError
  const jobId = String(job.id)
  const counts: Counts = { fetched: 0, created: 0, updated: 0, skipped: 0, errors: 0 }

  try {
    const search = await fetchJson(SEARCH_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rows: 100, startRecordNum: 0, oppStatuses: "posted|forecasted", fundingCategories: "AR", eligibilities: "", agencies: "", keyword: "" }),
    })
    const hits = Array.isArray(object(search.data).oppHits) ? object(search.data).oppHits as unknown[] : []
    counts.fetched = hits.length

    for (let offset = 0; offset < hits.length; offset += 5) {
      await Promise.all(hits.slice(offset, offset + 5).map(async (rawHit) => {
        const hit = object(rawHit)
        const externalId = text(hit.id)
        try {
          if (!externalId) { counts.skipped++; return }
          const detailResponse = await fetchJson(DETAIL_URL, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ opportunityId: Number(externalId) }),
          })
          const detail = object(detailResponse.data)
          const synopsis = object(detail.synopsis)
          const forecast = object(detail.forecast)
          const body = Object.keys(synopsis).length ? synopsis : forecast
          const title = text(detail.opportunityTitle) || text(detail.title) || text(hit.title)
          if (!title) { counts.skipped++; return }

          const deadlineAt = date(hit.closeDate) || date(body.responseDate) || date(body.responseDateStr)
          if (deadlineAt && Date.parse(deadlineAt) < Date.now()) { counts.skipped++; return }
          const opensAt = date(hit.openDate) || date(body.postingDate) || date(body.postingDateStr)
          const rawStatus = `${text(hit.oppStatus)} ${text(detail.docType)}`.toLowerCase()
          const status = rawStatus.includes("forecast") ? "forecasted" : "open"
          const canonicalUrl = `https://www.grants.gov/search-results-detail/${encodeURIComponent(externalId)}`
          const applicantDescriptions = descriptionList(body.applicantTypes)
          const applicantTypes = [...new Set(applicantDescriptions.map(applicantKey))]
          const categories = descriptionList(body.fundingActivityCategories)
          const description = cleanHtml(body.synopsisDesc || body.forecastDesc || body.description)
          const awardMin = numberValue(body.awardFloor)
          const awardMax = numberValue(body.awardCeiling)
          const now = new Date().toISOString()

          const { data: existing } = await supabase.from("opportunities")
            .select("id").eq("source_id", sourceId).eq("external_id", externalId).maybeSingle()

          const record = {
            source_id: sourceId,
            external_id: externalId,
            canonical_url: canonicalUrl,
            application_url: text(body.assistURL) || text(body.applicationUrl) || canonicalUrl,
            guidelines_url: canonicalUrl,
            title,
            provider_name: text(hit.agencyName) || text(body.agencyName) || "United States federal agency",
            provider_id: text(hit.agencyCode) || text(body.agencyCode),
            opportunity_type: "grant",
            summary: description.slice(0, 600),
            description,
            disciplines: categories.length ? categories : ["Arts"],
            eligible_applicant_types: applicantTypes,
            eligible_countries: [],
            eligible_regions: [],
            citizenship_requirements: [],
            residency_requirements: [],
            career_stages: [],
            award_min: awardMin,
            award_max: awardMax,
            currency: awardMin !== null || awardMax !== null ? "USD" : null,
            application_fee: null,
            deadline_at: deadlineAt,
            deadline_timezone: "United States Eastern Time",
            opens_at: opensAt,
            recurring: false,
            remote_allowed: null,
            travel_supported: null,
            accommodation_supported: null,
            fiscal_sponsor_allowed: null,
            language_requirements: [],
            education_requirements: [],
            organization_status_requirements: [],
            previous_award_restrictions: "",
            required_materials: [],
            participation_format: "other",
            locations: ["United States"],
            application_mode: "external",
            status,
            verification_status: "official_source",
            source_published_at: opensAt,
            source_updated_at: date(body.lastUpdatedDate) || now,
            last_verified_at: now,
          }

          const { data: saved, error: saveError } = await supabase.from("opportunities")
            .upsert(record, { onConflict: "source_id,external_id" }).select("id").single()
          if (saveError) throw saveError
          const opportunityId = String(saved.id)

          await supabase.from("opportunity_source_snapshots")
            .update({ is_current: false }).eq("opportunity_id", opportunityId).eq("is_current", true)
          const rawSnapshot = { search_hit: hit, detail: detailResponse }
          const { error: snapshotError } = await supabase.from("opportunity_source_snapshots").insert({
            opportunity_id: opportunityId,
            source_id: sourceId,
            raw_data: rawSnapshot,
            checksum: await checksum(rawSnapshot),
            is_current: true,
          })
          if (snapshotError) throw snapshotError

          await supabase.from("opportunity_eligibility_rules")
            .delete().eq("opportunity_id", opportunityId).eq("extraction_method", "official_api_field")
          if (applicantTypes.length) {
            const { error: ruleError } = await supabase.from("opportunity_eligibility_rules").insert({
              opportunity_id: opportunityId,
              rule_type: "applicant_type",
              operator: "in",
              value: applicantTypes,
              requirement_level: "required",
              source_text: `Eligible applicant types: ${applicantDescriptions.join(", ")}`,
              source_url: canonicalUrl,
              source_field: "synopsis.applicantTypes",
              extraction_method: "official_api_field",
              verification_status: "confirmed",
              last_verified_at: now,
            })
            if (ruleError) throw ruleError
          }
          if (existing) counts.updated++; else counts.created++
        } catch (error) {
          counts.errors++
          await recordError(supabase, jobId, sourceId, externalId, error, hit)
        }
      }))
    }

    await supabase.from("opportunity_import_jobs").update({
      status: counts.errors ? "partial" : "succeeded",
      completed_at: new Date().toISOString(),
      fetched_count: counts.fetched,
      created_count: counts.created,
      updated_count: counts.updated,
      skipped_count: counts.skipped,
      error_count: counts.errors,
    }).eq("id", jobId)
    await supabase.from("opportunity_sources").update({ last_successful_sync: new Date().toISOString(), last_failed_sync: null }).eq("id", sourceId)
    return counts
  } catch (error) {
    counts.errors++
    const message = error instanceof Error ? error.message : String(error)
    await recordError(supabase, jobId, sourceId, "", error)
    await supabase.from("opportunity_import_jobs").update({ status: "failed", completed_at: new Date().toISOString(), error_count: counts.errors, error_message: message }).eq("id", jobId)
    await supabase.from("opportunity_sources").update({ last_failed_sync: new Date().toISOString() }).eq("id", sourceId)
    throw error
  }
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405)
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return response({ error: "Supabase function environment is incomplete." }, 500)

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: expectedToken, error: tokenError } = await supabase.rpc("get_opportunity_sync_token")
  if (tokenError || !expectedToken) return response({ error: "Sync authentication is unavailable." }, 500)
  if (request.headers.get("x-kleio-sync-token") !== expectedToken) return response({ error: "Unauthorized" }, 401)

  let source = "grants-gov"
  try { source = text(object(await request.json()).source) || source } catch { /* default source */ }
  if (source === "eu-funding-tenders") {
    return response({
      source,
      status: "blocked",
      message: "The official European Commission API terminated requests from both tested server-side transports on 2026-07-22. The source remains inactive and no EU records are simulated.",
    }, 503)
  }

  try {
    const counts = await syncGrantsGov(supabase)
    return response({ source: "grants-gov", status: counts.errors ? "partial" : "succeeded", synced_at: new Date().toISOString(), counts })
  } catch (error) {
    return response({ source: "grants-gov", status: "failed", error: error instanceof Error ? error.message : String(error) }, 502)
  }
})
