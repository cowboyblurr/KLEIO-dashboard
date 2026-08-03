import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const failures = []
const sourceRoots = ["app", "components", "lib"]

function walk(directory) {
  const absolute = path.join(root, directory)
  if (!fs.existsSync(absolute)) return []
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(absolute, entry.name)
    if (entry.isDirectory()) return walk(path.relative(root, target))
    return /\.(?:ts|tsx|js|jsx)$/.test(entry.name) ? [path.relative(root, target)] : []
  })
}

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8")
}

function requireText(content, text, message) {
  if (!content.includes(text)) failures.push(message)
}

function forbid(content, pattern, message) {
  if (pattern.test(content)) failures.push(message)
}

const utility = read("lib/kleio-product-analytics.ts")
const eventMigration = read("supabase/migrations/20260803162000_product_analytics_event_contract.sql")
const adminDashboard = read("components/kleio/admin-product-analytics-dashboard.tsx")
const privacyPage = read("app/privacy/product-analytics/page.tsx")

for (const key of [
  "source", "status", "reason", "step", "mode", "viewport", "count", "result_count",
  "filter_count", "edited", "reduced_motion", "section", "error_code", "provider",
]) {
  requireText(utility, `\"${key}\"`, `Client metadata allowlist is missing ${key}.`)
  requireText(eventMigration, `'${key}'`, `Database metadata allowlist is missing ${key}.`)
}

for (const sensitive of [
  "filename", "file_name", "artist_statement", "biography", "email", "phone", "address",
  "caption", "private_url", "signed_url", "token", "stack_trace", "search_query", "transcript",
]) {
  forbid(
    utility.match(/const SAFE_METADATA_KEYS = new Set\(\[([\s\S]*?)\]\)/)?.[1] || "",
    new RegExp(`['\"]${sensitive}['\"]`, "i"),
    `Sensitive key appears in client metadata allowlist: ${sensitive}`,
  )
  forbid(
    eventMigration.match(/allowed_keys constant text\[\] := array\[([\s\S]*?)\];/)?.[1] || "",
    new RegExp(`'${sensitive}'`, "i"),
    `Sensitive key appears in database metadata allowlist: ${sensitive}`,
  )
}

requireText(utility, "FORBIDDEN_METADATA_KEYS", "Client must reject sensitive metadata key patterns.")
requireText(utility, "value.slice", "Client strings must be length-limited.")
requireText(eventMigration, "jsonb_typeof(entry.value) in ('string','number','boolean','null')", "Database must reject nested analytics metadata.")
requireText(eventMigration, "octet_length(result::text) > 2048", "Database must cap analytics metadata size.")
requireText(eventMigration, "input = public.sanitize_product_event_metadata(input)", "Database constraints must reject unsanitized metadata.")

const sourceFiles = sourceRoots.flatMap(walk)
const sensitiveKeyPattern = /\b(?:artist_name|display_name|email|phone|address|artwork_title|title|caption|bio|biography|artist_statement|cv|filename|file_name|file_contents|private_url|signed_url|token|oauth_token|raw_response|error_message|stack|query|search_query|document|transcript)\s*:/i
for (const file of sourceFiles) {
  const content = read(file)
  let cursor = 0
  while (true) {
    const index = content.indexOf("trackKleioProductEvent", cursor)
    if (index < 0) break
    const fragment = content.slice(index, index + 1600)
    if (/metadata\s*:/.test(fragment) && sensitiveKeyPattern.test(fragment)) {
      failures.push(`Potential sensitive analytics metadata near a tracking call in ${file}`)
    }
    cursor = index + 24
  }
}

forbid(adminDashboard, /\.select\([^)]*(?:actor_user_id|anonymous_session_id|display_name|artwork_title|original_filename)/i, "Admin dashboard must not query raw identity or artist-content fields.")
forbid(adminDashboard, /snapshot\.(?:actor_user_id|anonymous_session_id|display_name|artwork_title|original_filename)/i, "Admin dashboard must not render raw identity or artist-content fields.")
requireText(adminDashboard, "aggregate counts only", "Admin dashboard must state its aggregate privacy boundary.")
requireText(adminDashboard, "Raw provider errors", "Admin dashboard must explain stable error-code handling.")

for (const requiredCopy of [
  "does not sell artist behavioral data",
  "does not record as analytics content",
  "Keystrokes, session replay, heatmaps",
  "advertising pixels",
  "first-party product-usage information",
]) {
  if (!privacyPage.toLowerCase().includes(requiredCopy.toLowerCase())) {
    failures.push(`Artist-facing analytics disclosure is missing: ${requiredCopy}`)
  }
}

const executableClient = sourceFiles
  .filter((file) => !file.includes("privacy/product-analytics") && !file.includes("admin-product-analytics-dashboard"))
  .map(read)
  .join("\n")
forbid(executableClient, /(?:from\s+["'](?:hotjar|fullstory|posthog-js|rrweb)|require\(["'](?:hotjar|fullstory|posthog-js|rrweb)|fbq\s*\(|gtag\s*\(|linkedin_partner_id|connect\.facebook\.net\/en_US\/fbevents)/i, "Session replay, heatmap or advertising analytics execution code is present in KLEIO client source.")

if (failures.length) {
  console.error("KLEIO product analytics privacy audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO product analytics privacy audit passed: strict scalar metadata, sensitive-key rejection, aggregate-only administration and artist-facing no-surveillance disclosure verified.")
