import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.110.5"
import { DOMParser } from "npm:linkedom@0.18.12"

const EXTRACTOR_VERSION = "website_import_v1"
const MAX_HTML_BYTES = 2 * 1024 * 1024
const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const MAX_PAGES = 8
const MAX_IMAGES = 80
const MAX_SELECTED_IMAGES = 20
const FETCH_TIMEOUT_MS = 12_000
const ALLOWED_ORIGINS = [
  /^https:\/\/([a-z0-9-]+\.)?kleioarthouse\.com$/i,
  /^https:\/\/cowboyblurr\.github\.io$/i,
  /^http:\/\/localhost(?::\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/i,
]

const DISCIPLINES = [
  "painting", "drawing", "sculpture", "photography", "film", "video", "ceramics", "printmaking",
  "installation", "performance", "sound art", "textile", "fiber art", "digital media", "new media",
  "mixed media", "illustration", "design", "architecture", "writing", "curating", "dance", "theatre",
]
const MEDIUMS = [
  "oil", "acrylic", "watercolor", "watercolour", "gouache", "ink", "charcoal", "graphite", "clay",
  "porcelain", "stoneware", "wood", "metal", "bronze", "glass", "textile", "fabric", "video", "film",
  "photography", "sound", "paper", "found objects", "digital", "3d", "collage", "screenprint", "lithography",
]
const RELEVANT_PAGE_TERMS = [
  "about", "bio", "biography", "statement", "practice", "portfolio", "work", "works", "projects", "artwork",
  "exhibitions", "cv", "resume", "résumé", "press", "awards", "residencies",
]
const IMAGE_NOISE = /(?:logo|icon|favicon|sprite|avatar|pixel|tracking|placeholder|spinner|loader|badge|button|arrow|chevron|social)/i
const YEAR_PATTERN = /\b(19|20)\d{2}\b/
const DIMENSION_PATTERN = /\b(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(cm|mm|in|inch|inches|ft|feet|m)?\b/i
const MEDIUM_PATTERNS: Array<[RegExp, string]> = [
  [/\boil(?:\s+on\s+canvas)?\b/i, "Oil on canvas"],
  [/\bacrylic(?:\s+on\s+canvas)?\b/i, "Acrylic on canvas"],
  [/\bwatercolou?r\b/i, "Watercolor"],
  [/\bgouache\b/i, "Gouache"],
  [/\bceramic(?:s)?\b|\bclay\b/i, "Ceramics"],
  [/\bphotograph(?:y|ic)?\b|\bphoto\b/i, "Photography"],
  [/\bdigital\b/i, "Digital media"],
  [/\bmixed\s+media\b/i, "Mixed media"],
  [/\binstallation\b/i, "Installation"],
  [/\bsculpture\b/i, "Sculpture"],
  [/\btextile\b|\bfib(?:er|re)\b/i, "Textile"],
  [/\bdrawing\b|\bgraphite\b|\bcharcoal\b/i, "Drawing"],
  [/\bprint(?:making)?\b|\bscreenprint\b|\blithograph\b/i, "Printmaking"],
]

type JsonObject = Record<string, unknown>
type PageResult = {
  url: string
  title: string
  description: string
  headings: string[]
  paragraphs: string[]
  links: Array<{ url: string; label: string }>
  socialLinks: string[]
  jsonLd: JsonObject[]
}
type ImageCandidate = {
  id: string
  url: string
  sourcePage: string
  alt: string
  caption: string
  width: number | null
  height: number | null
  score: number
  proposed: {
    title: string
    year: string
    medium: string
    dimensions: string
    description: string
    tags: string[]
    altText: string
  }
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

function cleanText(value: unknown, max = 8_000) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
    : ""
}

function normalizedKey(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/\b(19|20)\d{2}\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim().slice(0, 240)
}

function stableId(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `img_${(hash >>> 0).toString(36)}`
}

async function sha256(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

function ipv4Parts(value: string) {
  const parts = value.split(".")
  if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part))) return null
  const numbers = parts.map(Number)
  return numbers.some((part) => part < 0 || part > 255) ? null : numbers
}

function isPrivateIpv4(value: string) {
  const parts = ipv4Parts(value)
  if (!parts) return false
  const [a, b] = parts
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) || (a === 198 && (b === 18 || b === 19)) || a >= 224
}

function isPrivateIpv6(value: string) {
  const normalized = value.toLowerCase().replace(/^\[|\]$/g, "")
  if (normalized === "::" || normalized === "::1") return true
  if (normalized.startsWith("fc") || normalized.startsWith("fd") || /^fe[89ab]/.test(normalized)) return true
  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1]
  return mapped ? isPrivateIpv4(mapped) : false
}

function blockedHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "")
  if (["localhost", "metadata.google.internal", "metadata", "host.docker.internal"].includes(normalized)) return true
  if (/\.(?:localhost|local|internal|home|lan)$/.test(normalized)) return true
  return isPrivateIpv4(normalized) || isPrivateIpv6(normalized)
}

async function validatePublicUrl(input: string, allowedOrigins?: Set<string>) {
  let url: URL
  try { url = new URL(input) } catch { throw new Error("invalid_website_url") }
  if (url.protocol !== "https:") throw new Error("https_required")
  if (url.username || url.password) throw new Error("url_credentials_not_allowed")
  if (url.href.length > 2_000) throw new Error("url_too_long")
  url.hash = ""
  if (allowedOrigins && !allowedOrigins.has(url.origin)) throw new Error("cross_origin_page_not_allowed")
  if (blockedHostname(url.hostname)) throw new Error("private_network_url_blocked")

  const addresses = new Set<string>()
  for (const type of ["A", "AAAA"] as const) {
    try {
      const records = await Deno.resolveDns(url.hostname, type)
      for (const record of records) addresses.add(record)
    } catch {
      // A domain may expose only one address family.
    }
  }
  if (!addresses.size) throw new Error("website_dns_lookup_failed")
  for (const address of addresses) if (isPrivateIpv4(address) || isPrivateIpv6(address)) throw new Error("private_network_url_blocked")
  return url
}

async function readLimited(response: Response, maxBytes: number) {
  const declared = Number(response.headers.get("content-length") ?? 0)
  if (declared > maxBytes) throw new Error("source_too_large")
  if (!response.body) return new Uint8Array()
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new Error("source_too_large")
    }
    chunks.push(value)
  }
  const output = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.byteLength }
  return output
}

async function fetchPublicResource(input: string, options: {
  maxBytes: number
  acceptedTypes: string[]
  allowedOrigins?: Set<string>
  allowFirstCanonicalRedirect?: boolean
}) {
  let url = await validatePublicUrl(input, options.allowedOrigins)
  const permitted = new Set(options.allowedOrigins ?? [url.origin])
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    let response: Response
    try {
      response = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "KLEIOWebsiteImport/1.0 (+https://www.kleioarthouse.com)",
          "Accept": options.acceptedTypes.join(", "),
        },
      })
    } finally {
      clearTimeout(timer)
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location")
      if (!location) throw new Error("redirect_without_location")
      const target = await validatePublicUrl(new URL(location, url).href)
      const sameBaseHost = target.hostname.replace(/^www\./, "") === url.hostname.replace(/^www\./, "")
      if (attempt === 0 && options.allowFirstCanonicalRedirect && sameBaseHost) permitted.add(target.origin)
      if (!permitted.has(target.origin)) throw new Error("cross_origin_redirect_blocked")
      url = target
      continue
    }
    if (!response.ok) throw new Error(`source_http_${response.status}`)
    const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase()
    const accepted = options.acceptedTypes.some((type) => contentType === type || (type.endsWith("/*") && contentType.startsWith(type.slice(0, -1))))
    if (!accepted) throw new Error("unsupported_source_type")
    return { url, contentType, bytes: await readLimited(response, options.maxBytes), permitted }
  }
  throw new Error("too_many_redirects")
}

function parseRobots(text: string) {
  const rules: Array<{ agent: string; type: "allow" | "disallow"; path: string }> = []
  let agents: string[] = []
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim()
    if (!line) continue
    const split = line.indexOf(":")
    if (split < 0) continue
    const key = line.slice(0, split).trim().toLowerCase()
    const value = line.slice(split + 1).trim()
    if (key === "user-agent") agents = [value.toLowerCase()]
    else if ((key === "allow" || key === "disallow") && agents.length) {
      for (const agent of agents) rules.push({ agent, type: key, path: value })
    }
  }
  return rules
}

function robotsAllows(rules: ReturnType<typeof parseRobots>, path: string) {
  const matching = rules.filter((rule) => rule.agent === "kleiowebsiteimport" || rule.agent === "*")
  let winner: { type: "allow" | "disallow"; length: number } | null = null
  for (const rule of matching) {
    if (!rule.path || !path.startsWith(rule.path)) continue
    if (!winner || rule.path.length > winner.length || (rule.path.length === winner.length && rule.type === "allow")) {
      winner = { type: rule.type, length: rule.path.length }
    }
  }
  return winner?.type !== "disallow"
}

async function loadRobots(origin: string, allowedOrigins: Set<string>) {
  try {
    const result = await fetchPublicResource(`${origin}/robots.txt`, {
      maxBytes: 200 * 1024,
      acceptedTypes: ["text/plain", "text/*"],
      allowedOrigins,
    })
    return parseRobots(new TextDecoder().decode(result.bytes))
  } catch {
    return []
  }
}

function absoluteUrl(value: string, base: string) {
  try {
    const url = new URL(value, base)
    if (url.protocol !== "https:") return ""
    url.hash = ""
    return url.href
  } catch {
    return ""
  }
}

function flattenJsonLd(value: unknown): JsonObject[] {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd)
  if (!isObject(value)) return []
  const graph = Array.isArray(value["@graph"]) ? value["@graph"].flatMap(flattenJsonLd) : []
  return [value, ...graph]
}

function parseJsonLd(document: any) {
  const output: JsonObject[] = []
  for (const node of Array.from(document.querySelectorAll('script[type="application/ld+json"]')) as any[]) {
    try { output.push(...flattenJsonLd(JSON.parse(node.textContent ?? ""))) } catch { /* ignore malformed JSON-LD */ }
  }
  return output.slice(0, 100)
}

function parsePage(html: string, pageUrl: string) {
  const document = new DOMParser().parseFromString(html, "text/html") as any
  if (!document) throw new Error("website_html_unreadable")
  const meta = (selector: string) => cleanText(document.querySelector(selector)?.getAttribute("content"), 2_000)
  const title = cleanText(meta('meta[property="og:title"]') || document.querySelector("title")?.textContent, 300)
  const description = cleanText(meta('meta[name="description"]') || meta('meta[property="og:description"]'), 2_000)
  const headings = Array.from(document.querySelectorAll("h1,h2,h3")).map((node: any) => cleanText(node.textContent, 300)).filter(Boolean).slice(0, 40)
  const paragraphs = Array.from(document.querySelectorAll("main p,article p,section p,p"))
    .map((node: any) => cleanText(node.textContent, 2_500))
    .filter((value: string) => value.length >= 35)
    .filter((value: string, index: number, values: string[]) => values.indexOf(value) === index)
    .slice(0, 80)
  const links: Array<{ url: string; label: string }> = []
  const socialLinks: string[] = []
  for (const anchor of Array.from(document.querySelectorAll("a[href]")) as any[]) {
    const url = absoluteUrl(anchor.getAttribute("href") ?? "", pageUrl)
    if (!url) continue
    const label = cleanText(anchor.textContent || anchor.getAttribute("aria-label") || anchor.getAttribute("title"), 200)
    const host = new URL(url).hostname.toLowerCase()
    if (/instagram\.com$|linkedin\.com$|youtube\.com$|vimeo\.com$|facebook\.com$|x\.com$|twitter\.com$|tiktok\.com$/.test(host)) socialLinks.push(url)
    else links.push({ url, label })
  }
  return {
    document,
    page: {
      url: pageUrl,
      title,
      description,
      headings,
      paragraphs,
      links: links.slice(0, 250),
      socialLinks: Array.from(new Set(socialLinks)).slice(0, 20),
      jsonLd: parseJsonLd(document),
    } satisfies PageResult,
  }
}

function pageScore(link: { url: string; label: string }) {
  const candidate = `${new URL(link.url).pathname} ${link.label}`.toLowerCase()
  let score = 0
  for (const term of RELEVANT_PAGE_TERMS) if (candidate.includes(term)) score += term === "work" || term === "works" ? 2 : 4
  if (/privacy|terms|shop|cart|checkout|login|sign-in|calendar/.test(candidate)) score -= 8
  return score
}

function bestSrcset(value: string) {
  const entries = value.split(",").map((entry) => entry.trim().split(/\s+/)).filter((entry) => entry[0])
  entries.sort((left, right) => Number(left[1]?.replace(/[^\d.]/g, "") || 0) - Number(right[1]?.replace(/[^\d.]/g, "") || 0))
  return entries.at(-1)?.[0] ?? ""
}

function titleFromContext(value: string) {
  return cleanText(value, 240)
    .replace(YEAR_PATTERN, "")
    .replace(DIMENSION_PATTERN, "")
    .replace(/\b(oil|acrylic|watercolou?r|gouache|ceramics?|clay|photograph(?:y)?|photo|digital|mixed media|installation|sculpture|textile|drawing|graphite|charcoal|printmaking)\b/gi, "")
    .replace(/^[\s,.;:_-]+|[\s,.;:_-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function proposedImageFields(context: string, url: string) {
  const filename = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "").replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ")
  const combined = cleanText(`${context} ${filename}`, 1_000)
  const dimensions = combined.match(DIMENSION_PATTERN)
  return {
    title: titleFromContext(context) || titleFromContext(filename),
    year: combined.match(YEAR_PATTERN)?.[0] ?? "",
    medium: MEDIUM_PATTERNS.find(([pattern]) => pattern.test(combined))?.[1] ?? "",
    dimensions: dimensions ? `${dimensions[1]} × ${dimensions[2]}${dimensions[3] ? ` ${dimensions[3]}` : ""}` : "",
  }
}

function extractImages(parsed: ReturnType<typeof parsePage>) {
  const output: ImageCandidate[] = []
  const push = (rawUrl: string, alt = "", caption = "", width: number | null = null, height: number | null = null) => {
    const url = absoluteUrl(rawUrl, parsed.page.url)
    if (!url) return
    alt = cleanText(alt, 500)
    caption = cleanText(caption, 1_500)
    const context = caption || alt
    const fields = proposedImageFields(context, url)
    let score = /portfolio|works?|projects?|artworks?|gallery/.test(parsed.page.url.toLowerCase()) ? 4 : 0
    if (alt || caption) score += 3
    if ((width ?? 0) >= 800 || (height ?? 0) >= 800) score += 3
    if (width && height && width < 300 && height < 300) score -= 6
    if (IMAGE_NOISE.test(`${url} ${alt} ${caption}`)) score -= 8
    output.push({
      id: stableId(`${parsed.page.url}|${url}`),
      url,
      sourcePage: parsed.page.url,
      alt,
      caption,
      width,
      height,
      score,
      proposed: {
        ...fields,
        description: caption,
        tags: [],
        altText: alt || (fields.title ? `Artwork image for ${fields.title}. Add meaningful visual details before publishing.` : "Artwork image. Add meaningful visual details before publishing."),
      },
    })
  }

  for (const image of Array.from(parsed.document.querySelectorAll("img")) as any[]) {
    const srcset = image.getAttribute("srcset") || image.getAttribute("data-srcset") || ""
    const src = bestSrcset(srcset) || image.getAttribute("src") || image.getAttribute("data-src") || image.getAttribute("data-lazy-src") || ""
    const figure = image.closest("figure")
    push(
      src,
      image.getAttribute("alt") || image.getAttribute("title") || "",
      figure?.querySelector("figcaption")?.textContent || image.getAttribute("data-caption") || "",
      Number(image.getAttribute("width") || 0) || null,
      Number(image.getAttribute("height") || 0) || null,
    )
  }
  for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    for (const node of Array.from(parsed.document.querySelectorAll(selector)) as any[]) push(node.getAttribute("content") || "")
  }
  for (const item of parsed.page.jsonLd) {
    const image = item.image
    const values = typeof image === "string" ? [image] : Array.isArray(image) ? image : isObject(image) ? [image.url, image.contentUrl] : []
    for (const value of values) if (typeof value === "string") push(value, "", cleanText(item.caption || item.description, 1_500))
  }
  return output
}

function findTerms(text: string, terms: string[]) {
  const lower = text.toLowerCase()
  return terms.filter((term) => new RegExp(`(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i").test(lower))
}

function jsonLdTypes(item: JsonObject) {
  const value = item["@type"]
  return Array.isArray(value) ? value.map(String) : [String(value ?? "")]
}

function addressValue(value: unknown) {
  if (typeof value === "string") return cleanText(value, 300)
  if (!isObject(value)) return ""
  return cleanText([value.addressLocality, value.addressRegion, value.addressCountry].filter(Boolean).join(", "), 300)
}

function field(value: string | string[], status: "extracted" | "suggested" | "missing", source: string, sourceUrl: string, confidence: string) {
  return { value, status, source, sourceUrl, confidence }
}

function profileSuggestions(pages: PageResult[], canonicalUrl: string) {
  const allJsonLd = pages.flatMap((page) => page.jsonLd)
  const person = allJsonLd.find((item) => jsonLdTypes(item).some((type) => /person|artist/i.test(type)))
  const home = pages[0]
  const ranked = (terms: string[]) => [...pages].sort((left, right) => {
    const score = (page: PageResult) => terms.reduce((sum, term) => sum + (`${page.url} ${page.title} ${page.headings.join(" ")}`.toLowerCase().includes(term) ? 1 : 0), 0)
    return score(right) - score(left)
  })[0]
  const about = ranked(["about", "bio", "biography"])
  const statement = ranked(["statement", "practice"])
  const allText = pages.map((page) => [page.title, page.description, ...page.headings, ...page.paragraphs].join("\n")).join("\n").slice(0, 120_000)
  const name = cleanText(person?.name || person?.alternateName || home?.title.split(/[|—–-]/)[0], 200)
  const location = addressValue(person?.address)
  const jsonDescription = cleanText(person?.description, 5_000)
  const aboutText = cleanText(about?.paragraphs.slice(0, 3).join("\n\n"), 5_000)
  const statementText = cleanText(statement?.paragraphs.slice(0, 5).join("\n\n"), 8_000)
  const practiceText = cleanText(home?.description || about?.description || about?.paragraphs[0], 3_000)
  const socialLinks = Array.from(new Set(pages.flatMap((page) => page.socialLinks)))
  return {
    professional_name: name ? field(name, person?.name ? "extracted" : "suggested", person?.name ? "Found in structured website data" : "Suggested from the website title", home?.url ?? canonicalUrl, person?.name ? "strong_source_match" : "possible_suggestion") : field("", "missing", "Artist name was not found", "", "needs_artist_confirmation"),
    location: location ? field(location, "extracted", "Found in structured website data", home?.url ?? canonicalUrl, "strong_source_match") : field("", "missing", "Location was not found", "", "needs_artist_confirmation"),
    bio: (jsonDescription || aboutText) ? field(jsonDescription || aboutText, jsonDescription ? "extracted" : "suggested", jsonDescription ? "Found in structured website data" : "Prepared from the About or Biography page", about?.url ?? canonicalUrl, jsonDescription ? "strong_source_match" : "possible_suggestion") : field("", "missing", "Biography was not found", "", "needs_artist_confirmation"),
    artist_statement: statementText ? field(statementText, "suggested", "Prepared from the page most likely to contain an artist statement", statement?.url ?? canonicalUrl, "possible_suggestion") : field("", "missing", "Artist statement was not found", "", "needs_artist_confirmation"),
    practice_description: practiceText ? field(practiceText, "suggested", "Prepared from the website description or About page", home?.url ?? canonicalUrl, "possible_suggestion") : field("", "missing", "Practice description was not found", "", "needs_artist_confirmation"),
    website_url: field(canonicalUrl, "extracted", "Submitted website", canonicalUrl, "strong_source_match"),
    disciplines: findTerms(allText, DISCIPLINES).length ? field(findTerms(allText, DISCIPLINES), "suggested", "Matched against discipline terms found on the website", canonicalUrl, "needs_artist_confirmation") : field([], "missing", "Disciplines were not found", "", "needs_artist_confirmation"),
    mediums: findTerms(allText, MEDIUMS).length ? field(findTerms(allText, MEDIUMS), "suggested", "Matched against medium terms found on the website", canonicalUrl, "needs_artist_confirmation") : field([], "missing", "Mediums were not found", "", "needs_artist_confirmation"),
    social_links: socialLinks,
  }
}

async function analyzeWebsite(inputUrl: string) {
  const submitted = await validatePublicUrl(inputUrl)
  const first = await fetchPublicResource(submitted.href, {
    maxBytes: MAX_HTML_BYTES,
    acceptedTypes: ["text/html", "application/xhtml+xml"],
    allowFirstCanonicalRedirect: true,
  })
  const allowedOrigins = first.permitted
  const robots = await loadRobots(first.url.origin, allowedOrigins)
  if (!robotsAllows(robots, first.url.pathname || "/")) throw new Error("website_disallows_automated_access")
  const parsedHome = parsePage(new TextDecoder().decode(first.bytes), first.url.href)
  const parsedPages = [parsedHome]
  const links = parsedHome.page.links
    .filter((link) => allowedOrigins.has(new URL(link.url).origin))
    .filter((link, index, values) => values.findIndex((entry) => entry.url === link.url) === index)
    .map((link) => ({ ...link, score: pageScore(link) }))
    .filter((link) => link.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_PAGES - 1)

  for (const link of links) {
    try {
      const url = await validatePublicUrl(link.url, allowedOrigins)
      if (!robotsAllows(robots, url.pathname || "/")) continue
      const result = await fetchPublicResource(url.href, {
        maxBytes: MAX_HTML_BYTES,
        acceptedTypes: ["text/html", "application/xhtml+xml"],
        allowedOrigins,
      })
      parsedPages.push(parsePage(new TextDecoder().decode(result.bytes), result.url.href))
    } catch {
      // A secondary page can fail without blocking the homepage analysis.
    }
  }

  const byUrl = new Map<string, ImageCandidate>()
  for (const parsed of parsedPages) {
    for (const candidate of extractImages(parsed)) {
      const existing = byUrl.get(candidate.url)
      if (!existing || candidate.score > existing.score) byUrl.set(candidate.url, candidate)
    }
  }
  const imageCandidates = Array.from(byUrl.values()).filter((candidate) => candidate.score > -4).sort((a, b) => b.score - a.score).slice(0, MAX_IMAGES)
  const pages = parsedPages.map((parsed) => parsed.page)
  return {
    canonicalUrl: first.url.href,
    pages,
    profileSuggestions: profileSuggestions(pages, first.url.href),
    imageCandidates,
  }
}

function safeFilename(url: string, contentType: string) {
  const extension = contentType === "image/png" ? ".png" : contentType === "image/webp" ? ".webp" : ".jpg"
  const base = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "artwork").replace(/\.[^.]+$/, "")
  const cleaned = base.normalize("NFKD").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 90) || "artwork"
  return `${cleaned}${extension}`
}

function imageSignatureMatches(bytes: Uint8Array, contentType: string) {
  if (contentType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (contentType === "image/png") return bytes.slice(0, 8).every((value, index) => value === [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a][index])
  if (contentType === "image/webp") return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
  return false
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

  const token = authorization.slice("Bearer ".length)
  const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } })
  const { data: userData, error: userError } = await authClient.auth.getUser(token)
  if (userError || !userData.user) return json(request, { error: "authentication_required" }, 401)
  const user = userData.user
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: roleRow } = await admin.from("profiles").select("role").eq("id", user.id).single()
  if (roleRow?.role !== "artist") return json(request, { error: "artist_account_required" }, 403)

  let body: JsonObject
  try { body = await request.json() } catch { return json(request, { error: "invalid_json" }, 400) }
  const action = cleanText(body.action, 40) || "analyze"

  try {
    if (action === "analyze") {
      if (body.ownershipConfirmed !== true) return json(request, { error: "website_permission_confirmation_required" }, 400)
      const websiteUrl = cleanText(body.websiteUrl, 2_000)
      const analysis = await analyzeWebsite(websiteUrl)
      const { data: session, error } = await admin.from("artist_website_import_sessions").insert({
        artist_user_id: user.id,
        website_url: websiteUrl,
        canonical_url: analysis.canonicalUrl,
        status: "review_ready",
        pages: analysis.pages,
        profile_suggestions: analysis.profileSuggestions,
        image_candidates: analysis.imageCandidates,
        extractor_version: EXTRACTOR_VERSION,
        updated_at: new Date().toISOString(),
      }).select("*").single()
      if (error) throw error
      return json(request, { session })
    }

    if (action === "import_images") {
      const sessionId = cleanText(body.sessionId, 80)
      const candidateIds = Array.isArray(body.candidateIds) ? Array.from(new Set(body.candidateIds.map((value) => cleanText(value, 80)).filter(Boolean))).slice(0, MAX_SELECTED_IMAGES) : []
      if (!sessionId || !candidateIds.length) return json(request, { error: "selected_images_required" }, 400)
      const { data: session, error: sessionError } = await admin.from("artist_website_import_sessions").select("*").eq("id", sessionId).eq("artist_user_id", user.id).single()
      if (sessionError || !session) return json(request, { error: "website_import_session_not_found" }, 404)
      const candidates = Array.isArray(session.image_candidates) ? session.image_candidates.filter(isObject) : []
      const selected = candidates.filter((candidate) => candidateIds.includes(cleanText(candidate.id, 80)))
      const sourceIds: string[] = []
      const failures: Array<{ id: string; error: string }> = []
      await admin.from("artist_website_import_sessions").update({ status: "importing", updated_at: new Date().toISOString() }).eq("id", sessionId)

      for (const candidate of selected) {
        const candidateId = cleanText(candidate.id, 80)
        try {
          const imageUrl = cleanText(candidate.url, 2_000)
          const resource = await fetchPublicResource(imageUrl, {
            maxBytes: MAX_IMAGE_BYTES,
            acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
          })
          if (!imageSignatureMatches(resource.bytes, resource.contentType)) throw new Error("image_signature_mismatch")
          const checksum = await sha256(resource.bytes)
          const { data: existing, error: existingError } = await admin.from("artist_import_sources").select("id").eq("artist_user_id", user.id).eq("checksum", checksum).maybeSingle()
          if (existingError) throw existingError
          if (existing?.id) { sourceIds.push(String(existing.id)); continue }
          const filename = safeFilename(resource.url.href, resource.contentType)
          const storagePath = `${user.id}/media/website/${crypto.randomUUID()}-${filename}`
          const { error: uploadError } = await admin.storage.from("artist-assets").upload(storagePath, resource.bytes, {
            contentType: resource.contentType,
            cacheControl: "3600",
            upsert: false,
          })
          if (uploadError) throw uploadError
          const proposed = isObject(candidate.proposed) ? candidate.proposed : {}
          const { data: source, error: sourceError } = await admin.from("artist_import_sources").insert({
            artist_user_id: user.id,
            source_type: "website",
            label: cleanText(proposed.title, 200) || filename,
            storage_path: storagePath,
            external_url: resource.url.href,
            mime_type: resource.contentType,
            byte_size: resource.bytes.byteLength,
            checksum,
            extraction_status: "review_ready",
            extraction_method: EXTRACTOR_VERSION,
            extracted_at: new Date().toISOString(),
            original_filename: filename,
            source_metadata: {
              import_context: "artist_onboarding",
              destination_type: "creative_passport",
              website_session_id: sessionId,
              source_page: cleanText(candidate.sourcePage, 2_000),
              alt: cleanText(candidate.alt, 1_000),
              caption: cleanText(candidate.caption, 3_000),
              proposed_fields: proposed,
              artist_confirmation_required: true,
            },
            media_kind: "image",
            library_status: "available",
            classification: "artwork_image",
            classification_confidence: 0.78,
            classification_reason: "Selected by the artist from their submitted portfolio website.",
            extraction_version: EXTRACTOR_VERSION,
          }).select("id").single()
          if (sourceError) {
            await admin.storage.from("artist-assets").remove([storagePath])
            throw sourceError
          }
          sourceIds.push(String(source.id))
        } catch (reason) {
          failures.push({ id: candidateId, error: reason instanceof Error ? reason.message : "image_import_failed" })
        }
      }

      await admin.from("artist_website_import_sessions").update({
        status: sourceIds.length ? "completed" : "failed",
        imported_source_ids: sourceIds,
        error_code: failures.length ? "some_images_failed" : "",
        updated_at: new Date().toISOString(),
      }).eq("id", sessionId).eq("artist_user_id", user.id)
      return json(request, { sourceIds, failures, artist_confirmation_required: true })
    }

    return json(request, { error: "unsupported_action" }, 400)
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "website_import_failed"
    return json(request, { error: message }, 422)
  }
})
