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
    return /\.(?:ts|tsx|js|jsx)$/.test(entry.name) ? [path.relative(root, target)] : []
  })
}

function requirePattern(content, pattern, message) {
  if (!pattern.test(content)) failures.push(message)
}

function forbidPattern(content, pattern, message) {
  if (pattern.test(content)) failures.push(message)
}

const migration = read("supabase/migrations/20260803162200_product_analytics_admin_snapshot.sql")
const eventMigration = read("supabase/migrations/20260803162000_product_analytics_event_contract.sql")
const client = read("lib/kleio-admin-analytics.ts")
const dashboard = read("components/kleio/admin-product-analytics-dashboard.tsx")
const route = read("app/admin/analytics/page.tsx")

requirePattern(migration, /if not private\.is_kleio_admin\(\) then[\s\S]*kleio_admin_required/, "Aggregate RPC must reject non-admin callers before querying events.")
requirePattern(migration, /security definer[\s\S]*set search_path = ''/i, "Aggregate RPC must use fixed-search-path privileged execution.")
requirePattern(migration, /revoke all on function public\.get_kleio_admin_analytics_snapshot[\s\S]*from public/, "Aggregate RPC must revoke PUBLIC execution.")
requirePattern(migration, /grant execute on function public\.get_kleio_admin_analytics_snapshot[\s\S]*to authenticated/, "Only authenticated users may attempt the admin RPC.")
forbidPattern(migration, /select\s+\*\s+from\s+public\.product_events[\s\S]*return/i, "Aggregate RPC must not return raw product-event rows.")
forbidPattern(migration, /actor_user_id['\"]\s*,|anonymous_session_id['\"]\s*,|email['\"]\s*,|display_name['\"]\s*,/i, "Aggregate JSON must not expose actor or identity fields.")

requirePattern(eventMigration, /product_events_admin_read[\s\S]*private\.is_kleio_admin\(\)/, "Raw product-events RLS must remain administrator-only.")
requirePattern(eventMigration, /revoke insert, update, delete on table public\.product_events from anon, authenticated/, "Browser roles must not write raw event rows directly.")

requirePattern(client, /rpc\("get_kleio_admin_analytics_snapshot"/, "Admin client must use the aggregate RPC.")
forbidPattern(client, /from\(["']product_events["']\)/, "Admin client must never query raw event history.")
forbidPattern(client, /actor_user_id|anonymous_session_id/, "Aggregate client contract must not contain raw actor identifiers.")
requirePattern(dashboard, /loadKleioAccount\(\)/, "Admin dashboard must require a valid confirmed KLEIO account before loading.")
requirePattern(dashboard, /KLEIO administrator access is required|administrator-only database function/, "Admin dashboard must expose a clear denied state.")
forbidPattern(dashboard, /dangerouslySetInnerHTML/, "Admin dashboard must not render untrusted analytics HTML.")
requirePattern(route, /robots:[\s\S]*index: false[\s\S]*follow: false/, "Admin route must opt out of indexing and following.")

for (const file of ["app", "components", "lib"].flatMap(walk)) {
  if (file === "app/admin/analytics/page.tsx" || file.includes("admin-product-analytics")) continue
  const content = read(file)
  if (/href\s*=\s*["']\/admin\/analytics\/?["']|router\.(?:push|replace)\(\s*["']\/admin\/analytics/.test(content)) {
    failures.push(`Private analytics route is exposed through product navigation in ${file}`)
  }
}

if (failures.length) {
  console.error("KLEIO product analytics administrator audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO product analytics administrator audit passed: database authorization, aggregate-only RPC access, denied UI state, non-indexed route and no public navigation exposure verified.")
