import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.110.5"
import { DOMParser } from "npm:linkedom@0.18.12"

const VERSION = "website_import_intelligence_v2"
const MAX_HTML = 2 * 1024 * 1024
const MAX_XML = 512 * 1024
const MAX_PAGES = 8
const MAX_LINKS = 40
const MAX_IMAGES = 80
const MAX_PROBES = 36
const PROBE_BYTES = 96 * 1024
const TIMEOUT = 12_000
const RELEVANT = /about|bio(?:graphy)?|statement|practice|portfolio|works?|projects?|artworks?|exhibitions?|cv|resume|résumé|press|awards?|residenc|education|collections?/i
const NOISE = /logo|icon|favicon|sprite|avatar|pixel|tracking|placeholder|spinner|loader|badge|button|arrow|chevron|social|cookie|consent/i
const ALLOWED_ORIGINS = [
  /^https:\/\/([a-z0-9-]+\.)?kleioarthouse\.com$/i,
  /^https:\/\/cowboyblurr\.github\.io$/i,
  /^http:\/\/localhost(?::\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/i,
]

type Json = Record<string, unknown>
type Outcome = "review_ready" | "limited_review" | "image_only_review" | "manual_input_recommended"
type Failure = Error & { code?: string; status?: number; outcome?: "blocked" | "failed"; retryable?: boolean }
type Page = {
  url: string; title: string; description: string; headings: string[]; paragraphs: string[]
  links: Array<{ url: string; label: string }>; socialLinks: string[]; jsonLd: Json[]
  metadata: Record<string, string>; applicationData: Json[]; extractionMethods: string[]
}
type RawImage = {
  id: string; url: string; sourcePage: string; alt: string; caption: string
  width: number | null; height: number | null; score: number; proposed: Json
}

function fail(code: string, status = 422, outcome: "blocked" | "failed" = "failed", retryable = false): Failure {
  const error = new Error(code) as Failure; error.code = code; error.status = status; error.outcome = outcome; error.retryable = retryable; return error
}
function cors(request: Request) {
  const origin = request.headers.get("origin") || ""
  const allowed = ALLOWED_ORIGINS.some((pattern) => pattern.test(origin)) ? origin : "https://www.kleioarthouse.com"
  return { "Access-Control-Allow-Origin": allowed, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" }
}
function reply(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(request), "Content-Type": "application/json", "Cache-Control": "no-store" } })
}
function object(value: unknown): value is Json { return Boolean(value) && typeof value === "object" && !Array.isArray(value) }
function text(value: unknown, max = 4_000) { return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "" }
function stableId(value: string) { let hash = 2166136261; for (let i = 0; i < value.length; i += 1) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619) }; return `img_${(hash >>> 0).toString(36)}` }
function ipv4(value: string) { const p = value.split("."); if (p.length !== 4 || p.some((v) => !/^\d+$/.test(v))) return null; const n = p.map(Number); return n.some((v) => v < 0 || v > 255) ? null : n }
function private4(value: string) { const p = ipv4(value); if (!p) return false; const [a,b] = p; return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168)) || a >= 224 }
function private6(value: string) { const v = value.toLowerCase().replace(/^\[|\]$/g, ""); if (v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || /^fe[89ab]/.test(v)) return true; const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1]; return mapped ? private4(mapped) : false }
async function publicUrl(input: string, origins?: Set<string>) {
  let url: URL; try { url = new URL(input) } catch { throw fail("invalid_website_url", 400) }
  if (url.protocol !== "https:") throw fail("https_required", 400)
  if (url.username || url.password) throw fail("url_credentials_not_allowed", 400)
  url.hash = ""; const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "")
  if (origins && !origins.has(url.origin)) throw fail("cross_origin_page_not_allowed", 403, "blocked")
  if (["localhost","metadata","metadata.google.internal","host.docker.internal"].includes(host) || /\.(local|internal|home|lan)$/.test(host) || private4(host) || private6(host)) throw fail("private_network_url_blocked", 403, "blocked")
  const addresses = new Set<string>(); for (const type of ["A","AAAA"] as const) { try { for (const record of await Deno.resolveDns(url.hostname, type)) addresses.add(record) } catch { /* absent family */ } }
  if (!addresses.size) throw fail("website_dns_lookup_failed", 422, "failed", true)
  if ([...addresses].some((address) => private4(address) || private6(address))) throw fail("private_network_url_blocked", 403, "blocked")
  return url
}
async function readAll(response: Response, max: number) {
  const declared = Number(response.headers.get("content-length") || 0); if (declared > max) throw fail("source_too_large", 413)
  const buffer = new Uint8Array(await response.arrayBuffer()); if (buffer.byteLength > max) throw fail("source_too_large", 413); return buffer
}
async function readPrefix(response: Response, max: number) {
  if (!response.body) return new Uint8Array(); const reader = response.body.getReader(); const output = new Uint8Array(max); let offset = 0
  while (offset < max) { const { done, value } = await reader.read(); if (done) break; const take = Math.min(value.byteLength, max - offset); output.set(value.slice(0, take), offset); offset += take; if (take < value.byteLength || offset >= max) { await reader.cancel(); break } }
  return output.slice(0, offset)
}
async function fetchSafe(input: string, options: { origins?: Set<string>; max: number; types: string[]; prefix?: boolean; canonical?: boolean }) {
  let url = await publicUrl(input, options.origins); const allowed = new Set(options.origins || [url.origin])
  for (let redirects = 0; redirects < 4; redirects += 1) {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), TIMEOUT)
    let response: Response
    try { response = await fetch(url, { redirect: "manual", signal: controller.signal, headers: { "User-Agent": "KLEIOWebsiteImport/2.0 (+https://www.kleioarthouse.com)", Accept: options.types.join(", "), ...(options.prefix ? { Range: `bytes=0-${options.max - 1}` } : {}) } }) }
    catch (reason) { if (reason instanceof DOMException && reason.name === "AbortError") throw fail("website_request_timeout", 504, "failed", true); throw fail("website_fetch_failed", 502, "failed", true) }
    finally { clearTimeout(timer) }
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get("location"); if (!location) throw fail("redirect_without_location")
      const target = await publicUrl(new URL(location, url).href); const sameHost = target.hostname.replace(/^www\./, "") === url.hostname.replace(/^www\./, "")
      if (redirects === 0 && options.canonical && sameHost) allowed.add(target.origin)
      if (!allowed.has(target.origin)) throw fail("cross_origin_redirect_blocked", 403, "blocked")
      url = target; continue
    }
    if (!response.ok && response.status !== 206) throw fail(`source_http_${response.status}`, response.status === 401 || response.status === 403 ? 403 : 422, response.status === 401 || response.status === 403 ? "blocked" : "failed")
    const type = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase()
    if (!options.types.some((candidate) => type === candidate || (candidate.endsWith("/*") && type.startsWith(candidate.slice(0,-1))))) throw fail("unsupported_source_type", 415)
    return { url, type, allowed, bytes: options.prefix ? await readPrefix(response, options.max) : await readAll(response, options.max) }
  }
  throw fail("too_many_redirects")
}
function absolute(value: unknown, base: string) { const raw = text(value, 2_000); if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return ""; try { const url = new URL(raw, base); if (url.protocol !== "https:") return ""; url.hash = ""; return url.href } catch { return "" } }
function flatten(value: unknown, depth = 0): Json[] { if (depth > 5) return []; if (Array.isArray(value)) return value.slice(0,80).flatMap((item) => flatten(item, depth + 1)); if (!object(value)) return []; return [value, ...(Array.isArray(value["@graph"]) ? value["@graph"].flatMap((item) => flatten(item, depth + 1)) : [])] }
function jsonScripts(document: any) {
  const jsonLd: Json[] = []; const applicationData: Json[] = []
  for (const node of Array.from(document.querySelectorAll('script[type="application/ld+json"],script[type="application/json"],script#__NEXT_DATA__')) as any[]) {
    const raw = node.textContent || ""; if (!raw || raw.length > 1024 * 1024) continue
    try { const values = flatten(JSON.parse(raw)); (node.getAttribute("type") === "application/ld+json" ? jsonLd : applicationData).push(...values) } catch { /* malformed public payload */ }
  }
  return { jsonLd: jsonLd.slice(0,100), applicationData: applicationData.slice(0,120) }
}
function parse(html: string, url: string, inherited: string[] = []) {
  const document = new DOMParser().parseFromString(html, "text/html") as any; if (!document) throw fail("website_html_unreadable")
  const metadata: Record<string,string> = {}; for (const node of Array.from(document.querySelectorAll("meta[name],meta[property]")) as any[]) { const key = text(node.getAttribute("name") || node.getAttribute("property"),100).toLowerCase(); const value = text(node.getAttribute("content"),2_000); if (key && value && /description|title|image|author|profile|article|twitter|og:/.test(key)) metadata[key] = value }
  const scripts = jsonScripts(document); const title = text(metadata["og:title"] || metadata["twitter:title"] || document.querySelector("title")?.textContent,300); const description = text(metadata.description || metadata["og:description"] || metadata["twitter:description"],2_000)
  const headings = Array.from(document.querySelectorAll("h1,h2,h3")).map((node:any) => text(node.textContent,300)).filter(Boolean).slice(0,50)
  const paragraphs = Array.from(document.querySelectorAll("main p,article p,section p,p")).map((node:any) => text(node.textContent,2_500)).filter((value:string) => value.length >= 35).filter((value:string,index:number,values:string[]) => values.indexOf(value) === index).slice(0,100)
  const links: Array<{url:string;label:string}> = []; const socialLinks: string[] = []
  for (const node of Array.from(document.querySelectorAll("a[href]")) as any[]) { const target = absolute(node.getAttribute("href"),url); if (!target) continue; const label = text(node.textContent || node.getAttribute("aria-label") || node.getAttribute("title"),200); if (/instagram|linkedin|youtube|vimeo|facebook|twitter|tiktok/.test(new URL(target).hostname)) socialLinks.push(target); else links.push({url:target,label}) }
  const methods = Array.from(new Set(["public_html","metadata",...(scripts.jsonLd.length ? ["json_ld"] : []),...(scripts.applicationData.length ? ["embedded_application_data"] : []),...inherited]))
  return { document, page: { url,title,description,headings,paragraphs,links:links.slice(0,300),socialLinks:Array.from(new Set(socialLinks)).slice(0,20),jsonLd:scripts.jsonLd,metadata,applicationData:scripts.applicationData,extractionMethods:methods } satisfies Page }
}
function objectEvidence(value: unknown, pageUrl: string, depth = 0, result = { text: [] as string[], images: [] as string[] }) {
  if (depth > 5 || result.text.length > 200 || result.images.length > 120) return result
  if (Array.isArray(value)) { value.slice(0,80).forEach((item) => objectEvidence(item,pageUrl,depth + 1,result)); return result }
  if (!object(value)) return result
  for (const [key,raw] of Object.entries(value).slice(0,100)) {
    if (typeof raw === "string") { const valueText = text(raw,2_500); const url = absolute(valueText,pageUrl); if (url && /image|thumbnail|src|contenturl/i.test(key) && /\.(jpe?g|png|webp)(?:$|[?#])/i.test(url)) result.images.push(url); else if (valueText.length >= 35 && /name|description|biography|address|location|education|award|exhibition|residenc|collection|commission|material|medium|artwork|date|year|title/i.test(key)) result.text.push(valueText) }
    else objectEvidence(raw,pageUrl,depth + 1,result)
  }
  return result
}
function srcset(value: string) { const entries = value.split(",").map((item) => item.trim().split(/\s+/)).filter((item) => item[0]); entries.sort((a,b) => Number(a[1]?.replace(/[^\d.]/g,"") || 0) - Number(b[1]?.replace(/[^\d.]/g,"") || 0)); return entries.at(-1)?.[0] || "" }
function images(parsed: ReturnType<typeof parse>) {
  const output: RawImage[] = []
  const push = (raw: unknown, alt = "", caption = "", width: number | null = null, height: number | null = null, proposed: Json = {}) => {
    if (!text(raw,2_000)) return; const url = absolute(raw,parsed.page.url); if (!url || url === parsed.page.url) return
    alt = text(alt,500); caption = text(caption,1_500); let score = /portfolio|works?|projects?|artworks?|gallery/i.test(parsed.page.url) ? 4 : 0; if (alt || caption) score += 3; if ((width || 0) >= 800 || (height || 0) >= 800) score += 3; if (width && height && width < 300 && height < 300) score -= 8; if (NOISE.test(`${url} ${alt} ${caption}`)) score -= 10
    output.push({ id:stableId(`${parsed.page.url}|${url}`),url,sourcePage:parsed.page.url,alt,caption,width,height,score,proposed })
  }
  for (const node of Array.from(parsed.document.querySelectorAll("img")) as any[]) { const candidate = srcset(node.getAttribute("srcset") || node.getAttribute("data-srcset") || node.getAttribute("data-lazy-srcset") || "") || node.getAttribute("src") || node.getAttribute("data-src") || node.getAttribute("data-lazy-src") || node.getAttribute("data-original") || node.getAttribute("data-image") || node.getAttribute("data-flickity-lazyload") || ""; const figure = node.closest("figure"); push(candidate,node.getAttribute("alt") || node.getAttribute("title") || "",figure?.querySelector("figcaption")?.textContent || node.getAttribute("data-caption") || "",Number(node.getAttribute("width") || 0) || null,Number(node.getAttribute("height") || 0) || null) }
  for (const key of ["og:image","og:image:secure_url","twitter:image","twitter:image:src"]) push(parsed.page.metadata[key])
  for (const item of [...parsed.page.jsonLd,...parsed.page.applicationData]) { const found = objectEvidence(item,parsed.page.url); found.images.forEach((url) => push(url,"",text(item.description || item.caption,1_500))) }
  return output
}
function signature(bytes: Uint8Array,type: string) { if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff; if (type === "image/png") return bytes.length >= 8 && bytes.slice(0,8).every((v,i) => v === [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a][i]); if (type === "image/webp") return new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8,12)) === "WEBP"; return false }
async function probe(candidate: RawImage) { if (candidate.score < -3 || NOISE.test(`${candidate.url} ${candidate.alt} ${candidate.caption}`)) return null; try { const resource = await fetchSafe(candidate.url,{max:PROBE_BYTES,types:["image/jpeg","image/png","image/webp"],prefix:true}); return signature(resource.bytes,resource.type) ? {...candidate,url:resource.url.href,contentType:resource.type,validation:"verified_image"} : null } catch { return null } }
function xmlLocations(xml: string,base: string) { return Array.from(xml.matchAll(/<loc(?:\s[^>]*)?>([\s\S]*?)<\/loc>/gi)).map((match) => absolute(match[1].replace(/&amp;/g,"&"),base)).filter(Boolean).slice(0,MAX_LINKS) }
function robots(textValue: string) { const rules: Array<{agent:string;type:"allow"|"disallow";path:string}> = []; const sitemaps:string[] = []; let agents:string[] = []; for (const raw of textValue.split(/\r?\n/)) { const line = raw.replace(/#.*$/,"").trim(); const split = line.indexOf(":"); if (split < 0) continue; const key = line.slice(0,split).trim().toLowerCase(); const value = line.slice(split+1).trim(); if (key === "user-agent") agents = [value.toLowerCase()]; else if (key === "sitemap" && value) sitemaps.push(value); else if ((key === "allow" || key === "disallow") && agents.length) agents.forEach((agent) => rules.push({agent,type:key,path:value})) }; return {rules,sitemaps} }
function allowedByRobots(rules: ReturnType<typeof robots>["rules"],path: string) { let winner:{type:"allow"|"disallow";length:number}|null = null; for (const rule of rules.filter((item) => item.agent === "*" || item.agent === "kleiowebsiteimport")) if (rule.path && path.startsWith(rule.path) && (!winner || rule.path.length > winner.length || (rule.path.length === winner.length && rule.type === "allow"))) winner = {type:rule.type,length:rule.path.length}; return winner?.type !== "disallow" }
function pageFromStored(value: unknown): Page | null { if (!object(value)) return null; const url = text(value.url,2_000); if (!url) return null; return { url,title:text(value.title,300),description:text(value.description,2_000),headings:Array.isArray(value.headings)?value.headings.map((item)=>text(item,300)).filter(Boolean):[],paragraphs:Array.isArray(value.paragraphs)?value.paragraphs.map((item)=>text(item,2_500)).filter(Boolean):[],links:Array.isArray(value.links)?value.links.filter(object).flatMap((item)=>{const target=text(item.url,2_000);return target?[{url:target,label:text(item.label,200)}]:[]}):[],socialLinks:Array.isArray(value.socialLinks)?value.socialLinks.map((item)=>text(item,2_000)).filter(Boolean):[],jsonLd:Array.isArray(value.jsonLd)?value.jsonLd.filter(object):[],metadata:object(value.metadata)?Object.fromEntries(Object.entries(value.metadata).map(([k,v])=>[k,text(v,2_000)]).filter(([,v])=>v)): {},applicationData:Array.isArray(value.applicationData)?value.applicationData.filter(object):[],extractionMethods:Array.isArray(value.extractionMethods)?value.extractionMethods.map((item)=>text(item,100)).filter(Boolean):["legacy_static_collection"] } }
function grade(pages: Page[],validImages: number,javascriptShell: boolean) { const structuredText = pages.flatMap((page)=>[...page.jsonLd,...page.applicationData].flatMap((item)=>objectEvidence(item,page.url).text)); const sections = Array.from(new Set(pages.flatMap((page)=>[page.description,...page.headings.filter((value)=>value.length>=12),...page.paragraphs]).concat(structuredText).filter(Boolean))); const chars = sections.reduce((sum,value)=>sum+value.length,0); const paragraphs = pages.reduce((sum,page)=>sum+page.paragraphs.length,0); const strong = paragraphs >= 2 || chars >= 800 || structuredText.length >= 2; const limited = paragraphs >= 1 || chars >= 180 || structuredText.length >= 1; const limitations:string[] = []; if (javascriptShell) limitations.push("The website appears to render additional content with JavaScript. Browser rendering is not configured, so KLEIO used only public HTML and application data exposed by the page."); if (!validImages) limitations.push("No image candidate passed KLEIO’s public image and file-signature checks."); if (!limited) limitations.push("The website did not expose enough reliable biography, statement, practice, history, or artwork text for organization."); const outcome:Outcome = strong && validImages ? "review_ready" : strong || limited ? "limited_review" : validImages ? "image_only_review" : "manual_input_recommended"; return {outcome,sections:sections.length,limitations} }
async function enhance(session: Json) {
  const submitted = text(session.website_url,2_000); const canonical = text(session.canonical_url || session.website_url,2_000); const storedPages = Array.isArray(session.pages) ? session.pages.map(pageFromStored).filter((page):page is Page=>Boolean(page)) : []; const storedImages = Array.isArray(session.image_candidates) ? session.image_candidates.filter(object).map((item)=>({id:text(item.id,100)||stableId(`${text(item.sourcePage)}|${text(item.url)}`),url:text(item.url,2_000),sourcePage:text(item.sourcePage,2_000),alt:text(item.alt,500),caption:text(item.caption,1_500),width:Number(item.width)>0?Number(item.width):null,height:Number(item.height)>0?Number(item.height):null,score:Number(item.score)||0,proposed:object(item.proposed)?item.proposed:{}} satisfies RawImage)) : []
  const pages = new Map(storedPages.map((page)=>[page.url,page])); const rawImages = [...storedImages]; let discovered = pages.size; let blocked = 0; let skipped = 0; const limitations:string[] = []
  try {
    const first = await fetchSafe(canonical,{max:MAX_HTML,types:["text/html","application/xhtml+xml"],canonical:true}); const origins = first.allowed; let robot = {rules:[] as ReturnType<typeof robots>["rules"],sitemaps:[] as string[]}
    try { const robotResponse = await fetchSafe(`${first.url.origin}/robots.txt`,{origins,max:200*1024,types:["text/plain","text/*"]}); robot = robots(new TextDecoder().decode(robotResponse.bytes)) } catch { /* optional */ }
    if (!allowedByRobots(robot.rules,first.url.pathname || "/")) throw fail("website_disallows_automated_access",403,"blocked")
    const home = parse(new TextDecoder().decode(first.bytes),first.url.href); pages.set(home.page.url,home.page); rawImages.push(...images(home)); const candidates = new Map<string,{url:string;label:string;method:string}>()
    for (const link of home.page.links) if (origins.has(new URL(link.url).origin) && RELEVANT.test(`${new URL(link.url).pathname} ${link.label}`)) candidates.set(link.url,{...link,method:"same_origin_link"})
    for (const sitemap of [...robot.sitemaps,`${first.url.origin}/sitemap.xml`].slice(0,5)) { try { const response = await fetchSafe(sitemap,{origins,max:MAX_XML,types:["application/xml","text/xml","text/plain","text/*"]}); for (const url of xmlLocations(new TextDecoder().decode(response.bytes),response.url.href)) if (origins.has(new URL(url).origin) && RELEVANT.test(new URL(url).pathname)) candidates.set(url,{url,label:"sitemap",method:"sitemap"}) } catch { /* optional */ } }
    discovered = Math.max(discovered,candidates.size+1)
    for (const candidate of [...candidates.values()].slice(0,MAX_PAGES-1)) { if (pages.has(candidate.url)) continue; try { const url = await publicUrl(candidate.url,origins); if (!allowedByRobots(robot.rules,url.pathname || "/")) { blocked += 1; continue }; const response = await fetchSafe(url.href,{origins,max:MAX_HTML,types:["text/html","application/xhtml+xml"]}); const parsed = parse(new TextDecoder().decode(response.bytes),response.url.href,[candidate.method]); pages.set(parsed.page.url,parsed.page); rawImages.push(...images(parsed)) } catch (reason) { if ((reason as Failure).outcome === "blocked") blocked += 1; else skipped += 1 } }
  } catch (reason) { limitations.push((reason as Failure).outcome === "blocked" ? "Additional collection was blocked; KLEIO retained the evidence already collected by the verified scanner." : "Additional collection was unavailable; KLEIO retained the evidence already collected by the verified scanner.") }
  const dedup = new Map<string,RawImage>(); const pageUrls = new Set([...pages.keys()]); for (const candidate of rawImages) { if (!candidate.url || pageUrls.has(candidate.url) || NOISE.test(`${candidate.url} ${candidate.alt} ${candidate.caption}`)) continue; const existing = dedup.get(candidate.url); if (!existing || candidate.score > existing.score) dedup.set(candidate.url,candidate) }
  const ranked = [...dedup.values()].sort((a,b)=>b.score-a.score).slice(0,MAX_PROBES); const valid: any[] = []; for (let index=0;index<ranked.length;index+=4) { const results = await Promise.all(ranked.slice(index,index+4).map(probe)); valid.push(...results.filter(Boolean)) }
  const collected = [...pages.values()].slice(0,MAX_PAGES); const shell = collected.reduce((sum,page)=>sum+page.paragraphs.length,0)===0 && collected.some((page)=>page.applicationData.length>0 || /wix|squarespace|webflow|cargo|adobe|next/i.test(JSON.stringify(page.metadata))); const evidence = grade(collected,valid.length,shell); const methods = Array.from(new Set(collected.flatMap((page)=>page.extractionMethods)))
  return { pages:collected,image_candidates:valid.slice(0,MAX_IMAGES),status:evidence.outcome,scan_summary:{submitted_website:submitted,canonical_website:canonical,outcome:evidence.outcome,pages_discovered:Math.max(discovered,collected.length),pages_collected:collected.length,pages_skipped:Math.max(discovered-collected.length-blocked,skipped,0),pages_blocked:blocked,text_sections_found:evidence.sections,metadata_found:collected.reduce((sum,page)=>sum+Object.keys(page.metadata).length,0),structured_data_found:collected.reduce((sum,page)=>sum+page.jsonLd.length+page.applicationData.length,0),valid_images_found:valid.length,weak_candidates_rejected:Math.max(rawImages.length-valid.length,0),extraction_methods:methods,javascript_rendering:shell?"recommended_unavailable":"not_required",gemini_called:false,limitations:[...limitations,...evidence.limitations]},extractor_version:VERSION }
}
async function context(request: Request) { const authorization = request.headers.get("authorization"); if (!authorization?.startsWith("Bearer ")) throw fail("authentication_required",401); const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); if(!url||!anon||!service) throw fail("service_configuration_unavailable",503); const token=authorization.slice(7); const auth=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}}); const {data,error}=await auth.auth.getUser(token); if(error||!data.user) throw fail("authentication_required",401); const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}}); const {data:profile}=await admin.from("profiles").select("role").eq("id",data.user.id).single(); if(profile?.role!=="artist") throw fail("artist_account_required",403); return {user:data.user,admin} }
function safe(reason: unknown) { const error=reason as Failure; const code=text(error?.code||error?.message,120)||"website_scan_validation_failed"; const allowed=new Set(["authentication_required","artist_account_required","service_configuration_unavailable","website_import_session_not_found","invalid_website_url","https_required","private_network_url_blocked","website_dns_lookup_failed","website_request_timeout","website_fetch_failed","website_disallows_automated_access","unsupported_source_type","source_too_large","cross_origin_redirect_blocked","cross_origin_page_not_allowed","too_many_redirects","website_html_unreadable"]); return {code:allowed.has(code)||/^source_http_\d{3}$/.test(code)?code:"website_scan_validation_failed",status:Number(error?.status)||422,outcome:error?.outcome||"failed",retryable:error?.retryable===true} }

Deno.serve(async (request:Request)=>{
  if(request.method==="OPTIONS") return new Response("ok",{headers:cors(request)}); if(request.method!=="POST") return reply(request,{error:"method_not_allowed"},405)
  let body:Json; try{body=await request.json()}catch{return reply(request,{error:"invalid_json"},400)}
  try{const {user,admin}=await context(request); const action=text(body.action,40)
    if(action==="enhance_scan"){const id=text(body.sessionId,100); const {data:session,error}=await admin.from("artist_website_import_sessions").select("*").eq("id",id).eq("artist_user_id",user.id).single(); if(error||!session) throw fail("website_import_session_not_found",404); const result=await enhance(session); const {data,error:updateError}=await admin.from("artist_website_import_sessions").update({...result,updated_at:new Date().toISOString()}).eq("id",id).eq("artist_user_id",user.id).select("*").single(); if(updateError) throw updateError; return reply(request,{session:data,outcome:result.status})}
    if(action==="dismiss"){const id=text(body.sessionId,100),now=new Date().toISOString(); const {data,error}=await admin.from("artist_website_import_sessions").update({status:"dismissed",dismissed_at:now,updated_at:now}).eq("id",id).eq("artist_user_id",user.id).select("id,status,dismissed_at").single(); if(error||!data) throw fail("website_import_session_not_found",404); return reply(request,{session:data})}
    return reply(request,{error:"unsupported_action"},400)
  }catch(reason){const error=safe(reason); return reply(request,{error:error.code,outcome:error.outcome,retryable:error.retryable},error.status)}
})
