import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const failures = []

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8")
}

function walk(directory) {
  const absolute = path.join(root, directory)
  if (!fs.existsSync(absolute)) return []
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(absolute, entry.name)
    if (entry.isDirectory()) return walk(path.relative(root, target))
    return /\.(?:ts|tsx|js|jsx|mjs|sql|json|md)$/.test(entry.name) ? [path.relative(root, target)] : []
  })
}

function requireMatch(content, pattern, message) {
  if (!pattern.test(content)) failures.push(message)
}

function forbidMatch(content, pattern, message) {
  if (pattern.test(content)) failures.push(message)
}

const dictionaryPath = "lib/kleio-product-event-dictionary.ts"
const utilityPath = "lib/kleio-product-analytics.ts"
const eventMigrationPath = "supabase/migrations/20260803162000_product_analytics_event_contract.sql"
const milestoneMigrationPath = "supabase/migrations/20260803162100_product_analytics_milestones.sql"
const snapshotMigrationPath = "supabase/migrations/20260803162200_product_analytics_admin_snapshot.sql"
const adminClientPath = "components/kleio/admin-product-analytics-dashboard.tsx"
const adminRoutePath = "app/admin/analytics/page.tsx"

for (const file of [dictionaryPath, utilityPath, eventMigrationPath, milestoneMigrationPath, snapshotMigrationPath, adminClientPath, adminRoutePath]) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing required analytics file: ${file}`)
}

if (!failures.length) {
  const dictionary = read(dictionaryPath)
  const utility = read(utilityPath)
  const eventMigration = read(eventMigrationPath)
  const milestoneMigration = read(milestoneMigrationPath)
  const snapshotMigration = read(snapshotMigrationPath)
  const adminClient = read(adminClientPath)
  const adminRoute = read(adminRoutePath)

  const declaredEvents = new Set(
    [...dictionary.matchAll(/^\s{2}([a-z][a-z0-9_]+): define\(/gm)].map((match) => match[1]),
  )
  if (declaredEvents.size < 70) failures.push(`Canonical event dictionary is unexpectedly small: ${declaredEvents.size} events.`)
  for (const eventName of declaredEvents) {
    if (!/^[a-z][a-z0-9_]+$/.test(eventName)) failures.push(`Event does not use lowercase snake_case: ${eventName}`)
  }

  const sourceFiles = ["app", "components", "lib"].flatMap(walk)
  const calls = []
  for (const file of sourceFiles) {
    if (file === dictionaryPath) continue
    const content = read(file)
    for (const match of content.matchAll(/trackKleioProductEvent\(\s*["']([^"']+)["']/g)) {
      calls.push({ file, eventName: match[1] })
    }
  }
  for (const call of calls) {
    if (!declaredEvents.has(call.eventName)) failures.push(`Undeclared product event ${call.eventName} in ${call.file}`)
  }

  requireMatch(utility, /rpc\("record_product_event"/, "Analytics utility must use the controlled record_product_event RPC.")
  forbidMatch(utility, /from\(["']product_events["']\)\.insert/, "Analytics utility must not insert directly into product_events.")
  requireMatch(utility, /anonymousSessionId/, "Analytics utility must retain a random anonymous session identifier.")
  requireMatch(utility, /releaseChannel/, "Analytics utility must classify guided-demo and synthetic-preview traffic.")
  requireMatch(utility, /acquisitionSource/, "Analytics utility must normalize acquisition sources.")
  requireMatch(utility, /FORBIDDEN_METADATA_KEYS/, "Analytics utility must reject sensitive metadata key names.")

  for (const column of [
    "event_version", "product_area", "release_channel", "traffic_class", "workflow_id",
    "app_version", "locale", "viewport", "acquisition_source", "occurred_at", "deduplication_key",
  ]) requireMatch(eventMigration, new RegExp(`add column if not exists ${column}\\b`), `Missing additive product_events column: ${column}`)

  requireMatch(eventMigration, /revoke insert, update, delete on table public\.product_events from anon, authenticated/, "Direct browser writes to product_events must be revoked.")
  requireMatch(eventMigration, /security definer[\s\S]*record_product_event|record_product_event[\s\S]*security definer/i, "Controlled ingestion must use a narrowly scoped privileged function.")
  requireMatch(eventMigration, /set search_path = ''/, "Privileged analytics functions must fix search_path.")
  requireMatch(eventMigration, /analytics_rate_limited/, "Controlled ingestion must be rate limited.")
  requireMatch(eventMigration, /anonymous_event_not_allowed/, "Anonymous event ingestion must enforce the public allowlist.")
  requireMatch(eventMigration, /private\.analytics_internal_actors/, "Internal QA classification must remain private.")

  requireMatch(milestoneMigration, /artist_product_milestones/, "Durable milestone table is missing.")
  requireMatch(milestoneMigration, /first_value_reached/, "First value must be emitted from durable state.")
  requireMatch(milestoneMigration, /artist_activated/, "Activation must be emitted from durable state.")
  requireMatch(milestoneMigration, /auth\.users/, "Account confirmation must be derived from authentication state.")
  requireMatch(milestoneMigration, /artist_activation_status/, "Analytics activation must reuse KLEIO's authoritative activation state.")
  requireMatch(milestoneMigration, /on conflict do nothing/, "Durable events must be idempotent.")

  requireMatch(snapshotMigration, /private\.is_kleio_admin\(\)/, "Aggregate analytics RPC must enforce administrator authorization.")
  requireMatch(snapshotMigration, /revoke all on function public\.get_kleio_admin_analytics_snapshot/, "Aggregate analytics RPC must revoke default execution.")
  requireMatch(snapshotMigration, /sample_warnings/, "Aggregate analytics must include sample-size warnings.")
  requireMatch(snapshotMigration, /requested_traffic_class/, "Aggregate analytics must filter traffic classes.")
  requireMatch(snapshotMigration, /day_7_returned/, "Aggregate analytics must derive seven-day retention.")

  requireMatch(adminClient, /get_kleio_admin_analytics_snapshot/, "Admin dashboard must load aggregate analytics through the authorized RPC.")
  forbidMatch(adminClient, /from\(["']product_events["']\)/, "Admin dashboard must not download raw product events.")
  requireMatch(adminClient, /<table/, "Admin dashboard must provide semantic tabular alternatives.")
  requireMatch(adminClient, /Export aggregate CSV/, "Admin dashboard must export aggregate data only.")
  requireMatch(adminRoute, /robots:[\s\S]*index: false/, "Private admin analytics route must opt out of indexing.")

  const clientCode = sourceFiles.map((file) => `${file}\n${read(file)}`).join("\n")
  forbidMatch(clientCode, /SUPABASE_SERVICE_ROLE_KEY|service_role\s*[:=]/i, "Service-role credentials or identifiers must not appear in client source.")
  forbidMatch(clientCode, /from\(["']product_events["']\)\.insert/, "No client source may insert directly into product_events.")

  const packageJson = JSON.parse(read("package.json"))
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
  for (const forbidden of ["@segment/analytics-next", "posthog-js", "@fullstory/browser", "hotjar", "rrweb", "react-ga4", "@amplitude/analytics-browser"]) {
    if (dependencies[forbidden]) failures.push(`Forbidden behavioral analytics dependency introduced: ${forbidden}`)
  }
}

if (failures.length) {
  console.error("KLEIO product analytics architecture audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO product analytics architecture audit passed: canonical taxonomy, controlled RPC ingestion, durable milestones, traffic separation, aggregate-only administrator reporting and prohibited-package boundaries verified.")
