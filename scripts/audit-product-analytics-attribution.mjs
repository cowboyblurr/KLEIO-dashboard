import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const failures = []
const utility = fs.readFileSync(path.join(root, "lib/kleio-product-analytics.ts"), "utf8")
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260803162300_product_analytics_acquisition_attribution.sql"), "utf8")
const snapshot = fs.readFileSync(path.join(root, "supabase/migrations/20260803162200_product_analytics_admin_snapshot.sql"), "utf8")

function requirePattern(content, pattern, message) {
  if (!pattern.test(content)) failures.push(message)
}

function forbidPattern(content, pattern, message) {
  if (pattern.test(content)) failures.push(message)
}

requirePattern(utility, /ACQUISITION_KEY/, "Client must persist one normalized first-touch category through signup.")
requirePattern(utility, /ACQUISITION_SOURCES/, "Client acquisition values must use a controlled category set.")
requirePattern(utility, /window\.localStorage\.setItem\(ACQUISITION_KEY, detected\)/, "Client must retain first touch without storing the full referrer.")
forbidPattern(utility, /localStorage\.setItem\([^)]*(?:document\.referrer|location\.href|location\.search)/, "Client must never persist a raw referrer or campaign URL.")

requirePattern(migration, /private\.artist_acquisition_attribution/, "Private artist acquisition attribution table is missing.")
requirePattern(migration, /on conflict \(artist_user_id\) do nothing/, "First-touch attribution must be immutable after the first authenticated source.")
requirePattern(migration, /after insert[\s\S]*on public\.product_events/, "Attribution must apply after controlled event ingestion.")
requirePattern(migration, /prior_event\.acquisition_source = 'unknown'/, "Attribution must propagate only to previously unknown durable events.")
requirePattern(migration, /security definer[\s\S]*set search_path = ''/i, "Attribution trigger must use a fixed-search-path privileged boundary.")
requirePattern(migration, /revoke all on table private\.artist_acquisition_attribution[\s\S]*from public, anon, authenticated/, "Private attribution rows must not be browser-readable.")
forbidPattern(migration, /referrer|utm_|campaign|url|query_string|email|display_name/i, "Attribution storage must contain only an approved category and random session UUID.")

requirePattern(snapshot, /requested_acquisition_source/, "Administrator aggregates must support acquisition-source filtering.")
requirePattern(snapshot, /artist_activated/, "Acquisition filtering must apply to activation reporting.")

if (failures.length) {
  console.error("KLEIO product analytics attribution audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO product analytics attribution audit passed: normalized first touch persists through signup, private attribution is immutable, durable milestones receive only an approved category, and no raw referrer or campaign URL is stored.")
