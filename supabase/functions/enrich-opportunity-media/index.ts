import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.110.5"

type SourceRow = {
  id: string
  slug: string
  name: string
  base_domain: string
}

type OpportunityRow = {
  id: string
  title: string
  provider_name: string
  canonical_url: string
  preview_image_origin: string
  preview_image_url: string
}

type Candidate = {
  url: string
  alt: string
  score: number
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const SUPPORTED_SOURCES = new Set(["mexico-cultura", "ibermusicas"])
const MAX_PAGE_BYTES = 2_000_000
const GENERIC_IMAGE_PATTERN = /(logo|favicon|icon|sprite|spinner|loading|placeholder|avatar|header|footer|escudo|marca[-_ ]?gob)/i

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  })
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function safeUrl(value: string, base?: string) {
  try {
    const url = base ? new URL(value, base) : new URL(value)
    return url.protocol === "https:" ? url : null
  } catch {
    return null
  }
}

function hostMatches(hostname: string, baseDomain: string) {
  const host = hostname.toLowerCase()
  const base = baseDomain.toLowerCase().replace(/^www\./, "")
  return host === base || host === `www.${base}` || host.endsWith(`.${base}`)
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
}

function attribute(tag: string, name: string) {
  const quoted = tag.match(new RegExp(`${name}\\s*=\\s*(["'])(.*?)\\1`, "i"))
  if (quoted) return decodeHtml(quoted[2].trim())
  const bare = tag.match(new RegExp(`${name}\\s*=\\s*([^\\s>]+)`, "i"))
  return bare ? decodeHtml(bare[1].trim()) : ""
}

function titleTokens(title: string) {
  return title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 5)
    .slice(0, 12)
}

function candidateScore(candidate: Candidate, title: string, isMetadata: boolean) {
  const haystack = `${candidate.url} ${candidate.alt}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  let score = isMetadata ? 30 : 5
  for (const token of titleTokens(title)) if (haystack.includes(token)) score += 4
  if (/convocatoria|premio|ayuda|residencia|grant|award|festival|2026/i.test(haystack)) score += 8
  if (GENERIC_IMAGE_PATTERN.test(haystack)) score -= 100
  return score
}

function pageIsGeneric(url: URL) {
  const path = url.pathname.replace(/\/+$/, "/").toLowerCase()
  return path === "/" || path === "/index.php/convocatorias/" || path === "/convocatorias/"
}

function extractCandidates(html: string, pageUrl: URL, title: string) {
  const candidates: Candidate[] = []
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? []
  for (const tag of metaTags) {
    const key = (attribute(tag, "property") || attribute(tag, "name")).toLowerCase()
    if (!["og:image", "og:image:url", "twitter:image", "twitter:image:src"].includes(key)) continue
    const raw = attribute(tag, "content")
    const resolved = safeUrl(raw, pageUrl.toString())
    if (!resolved) continue
    const candidate = { url: resolved.toString(), alt: "", score: 0 }
    candidate.score = candidateScore(candidate, title, true)
    candidates.push(candidate)
  }

  const imageTags = html.match(/<img\b[^>]*>/gi) ?? []
  for (const tag of imageTags) {
    const raw = attribute(tag, "data-src") || attribute(tag, "data-lazy-src") || attribute(tag, "src")
    const resolved = safeUrl(raw, pageUrl.toString())
    if (!resolved) continue
    const alt = attribute(tag, "alt")
    const width = Number(attribute(tag, "width")) || 0
    const height = Number(attribute(tag, "height")) || 0
    const candidate = { url: resolved.toString(), alt, score: 0 }
    candidate.score = candidateScore(candidate, title, false)
    if (width >= 500 || height >= 300) candidate.score += 6
    candidates.push(candidate)
  }

  return [...new Map(candidates.map((candidate) => [candidate.url, candidate])).values()]
    .sort((left, right) => right.score - left.score)
}

async function fetchHtml(url: URL) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25_000)
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "KLEIO Opportunity Media Indexer/1.0" },
    })
    const contentType = response.headers.get("content-type") ?? ""
    if (!response.ok || !contentType.toLowerCase().includes("text/html")) return ""
    const contentLength = Number(response.headers.get("content-length")) || 0
    if (contentLength > MAX_PAGE_BYTES) return ""
    const html = await response.text()
    return html.length <= MAX_PAGE_BYTES ? html : ""
  } finally {
    clearTimeout(timer)
  }
}

async function validImage(candidate: URL, baseDomain: string) {
  if (!hostMatches(candidate.hostname, baseDomain)) return false
  if (GENERIC_IMAGE_PATTERN.test(candidate.pathname)) return false
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  try {
    const response = await fetch(candidate, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        range: "bytes=0-1023",
        "user-agent": "KLEIO Opportunity Media Indexer/1.0",
      },
    })
    const type = (response.headers.get("content-type") ?? "").toLowerCase()
    await response.body?.cancel().catch(() => undefined)
    return response.ok && ["image/jpeg", "image/png", "image/webp"].some((allowed) => type.startsWith(allowed))
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

async function enrichSource(supabase: SupabaseClient, source: SourceRow) {
  const { data, error } = await supabase.from("opportunities")
    .select("id,title,provider_name,canonical_url,preview_image_origin,preview_image_url")
    .eq("source_id", source.id)
    .in("status", ["open", "forecasted", "upcoming"])
    .or(`deadline_at.is.null,deadline_at.gte.${new Date().toISOString()}`)
  if (error) throw error

  let checked = 0
  let enriched = 0
  let skipped = 0
  const failures: Array<{ id: string; reason: string }> = []

  for (const opportunity of (data ?? []) as OpportunityRow[]) {
    checked += 1
    if (!["kleio_fallback", "official_source"].includes(opportunity.preview_image_origin)) {
      skipped += 1
      continue
    }

    const pageUrl = safeUrl(opportunity.canonical_url)
    if (!pageUrl || !hostMatches(pageUrl.hostname, source.base_domain) || pageIsGeneric(pageUrl)) {
      skipped += 1
      continue
    }

    try {
      const html = await fetchHtml(pageUrl)
      if (!html) {
        skipped += 1
        continue
      }
      const candidates = extractCandidates(html, pageUrl, opportunity.title)
      let selected: Candidate | null = null
      for (const candidate of candidates) {
        if (candidate.score < 10) continue
        const imageUrl = safeUrl(candidate.url)
        if (imageUrl && await validImage(imageUrl, source.base_domain)) {
          selected = candidate
          break
        }
      }

      if (!selected) {
        skipped += 1
        continue
      }

      const { error: updateError } = await supabase.from("opportunities").update({
        preview_image_url: selected.url,
        preview_image_source_url: pageUrl.toString(),
        preview_image_alt_text: selected.alt || `Official image for ${opportunity.title}`,
        preview_image_attribution: `${opportunity.provider_name} · official listing`,
        preview_image_rights_status: "official_publication",
        preview_image_origin: "official_source",
        updated_at: new Date().toISOString(),
      }).eq("id", opportunity.id)
      if (updateError) throw updateError
      enriched += 1
    } catch (error) {
      failures.push({ id: opportunity.id, reason: error instanceof Error ? error.message : String(error) })
    }
  }

  return { source: source.slug, checked, enriched, skipped, failures }
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405)
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Supabase function environment is incomplete" }, 500)

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: expectedToken, error: tokenError } = await supabase.rpc("get_opportunity_sync_token")
  if (tokenError || !expectedToken) return json({ error: "Media enrichment authentication is unavailable" }, 500)
  if (request.headers.get("x-kleio-sync-token") !== expectedToken) return json({ error: "Unauthorized" }, 401)

  let requestedSources: string[] = []
  try {
    const body = await request.json()
    requestedSources = Array.isArray(body?.source_slugs) ? body.source_slugs.map(text).filter(Boolean) : []
  } catch {
    requestedSources = []
  }

  const allowed = requestedSources.length
    ? requestedSources.filter((slug) => SUPPORTED_SOURCES.has(slug))
    : [...SUPPORTED_SOURCES]

  const { data: sources, error: sourcesError } = await supabase.from("opportunity_sources")
    .select("id,slug,name,base_domain")
    .eq("active", true)
    .in("slug", allowed)
  if (sourcesError) return json({ error: sourcesError.message }, 500)

  const results = []
  for (const source of (sources ?? []) as SourceRow[]) results.push(await enrichSource(supabase, source))
  return json({ status: "completed", checked_at: new Date().toISOString(), results })
})
