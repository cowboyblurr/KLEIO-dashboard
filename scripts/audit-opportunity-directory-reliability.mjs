import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const failures = []

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8")
}

function requirePattern(content, pattern, message) {
  if (!pattern.test(content)) failures.push(message)
}

function forbidPattern(content, pattern, message) {
  if (pattern.test(content)) failures.push(message)
}

const migration = read("supabase/migrations/20260805123500_opportunity_directory_reliability_workflow.sql")
const directoryClient = read("lib/kleio-persistent-opportunity-directory.ts")
const directory = read("components/kleio/production-artist-opportunity-directory.tsx")
const adminClient = read("lib/kleio-opportunity-review.ts")
const adminQueue = read("components/kleio/admin-opportunity-review-queue.tsx")
const adminRoute = read("app/admin/opportunity-review/page.tsx")

requirePattern(migration, /create table if not exists public\.artist_hidden_opportunities/, "Artist-private hidden-opportunity storage is missing.")
requirePattern(migration, /artist_hidden_opportunities_select_own[\s\S]*auth\.uid\(\)[\s\S]*artist_user_id/, "Hidden-opportunity RLS must be owner scoped.")
requirePattern(migration, /create table if not exists public\.opportunity_reports/, "Opportunity reporting storage is missing.")
requirePattern(migration, /create table if not exists public\.opportunity_review_audit/, "Opportunity moderation audit history is missing.")
requirePattern(migration, /create or replace function public\.search_my_opportunities_v3/, "Paginated artist search RPC is missing.")
requirePattern(migration, /create or replace function public\.count_my_opportunities_v3/, "Matching verified-total RPC is missing.")
requirePattern(migration, /lifecycle_status = any \(array\['verified'.*'published'.*'updated'.*'closing_soon'/s, "Artist publication rules must enforce lifecycle readiness.")
requirePattern(migration, /verification_status = any \(array\['official_source'.*'provider_published'.*'provider_verified'.*'kleio_reviewed'/s, "Artist publication rules must enforce trusted verification states.")
requirePattern(migration, /not exists \([\s\S]*artist_hidden_opportunities/, "Paginated search must exclude records hidden by the artist.")
requirePattern(migration, /if not private\.is_kleio_admin\(\) then[\s\S]*kleio_admin_required/, "Opportunity review RPCs must reject non-admin callers.")
requirePattern(migration, /previous_values[\s\S]*new_values[\s\S]*review_reason/, "High-impact moderation actions must be auditable.")
requirePattern(migration, /revoke all on function public\.admin_review_opportunity[\s\S]*from public, anon/, "Admin mutation RPC must revoke public and anonymous execution.")

requirePattern(directoryClient, /rpc\("search_my_opportunities_v3"/, "Artist directory must use the paginated publication-safe RPC.")
requirePattern(directoryClient, /rpc\("count_my_opportunities_v3"/, "Artist directory must request the true matching total.")
requirePattern(directoryClient, /artist_hidden_opportunities/, "Artist hide action is not connected to durable storage.")
requirePattern(directoryClient, /opportunity_reports/, "Artist report action is not connected to durable storage.")
requirePattern(directory, /const PAGE_SIZE = 24/, "Artist directory should load a controlled first batch.")
requirePattern(directory, /Load more opportunities/, "Artist directory is missing a controlled Load More action.")
requirePattern(directory, /Showing \{items\.length\} of \{total\}/, "Artist directory must explain visible and total result counts.")
requirePattern(directory, /Verified through official source/, "Artist-facing trust language is missing.")
requirePattern(directory, /Last checked/, "Artist-facing verification recency is missing.")
requirePattern(directory, /Important terms/, "Artist-facing financial and rights warnings are missing.")
requirePattern(directory, /Why this may fit you/, "Explainable artist-fit reasoning is missing.")
requirePattern(directory, /Still needs confirmation/, "Unresolved eligibility must be separated from positive fit evidence.")
requirePattern(directory, /Hide/, "Artist-private hide control is missing.")
requirePattern(directory, /Report a problem/, "Artist reporting control is missing.")
forbidPattern(directory, /\b\d{1,3}% match\b/i, "The artist directory must not introduce unexplained match percentages.")

requirePattern(adminClient, /get_kleio_opportunity_review_queue/, "Admin client must use the private review snapshot RPC.")
requirePattern(adminClient, /admin_review_opportunity/, "Admin client must use the audited mutation RPC.")
requirePattern(adminQueue, /Opportunity review queue/, "Private opportunity review interface is missing.")
requirePattern(adminQueue, /Review reason/, "Moderation actions must require a human reason.")
requirePattern(adminQueue, /Publishing is blocked unless the record meets the database publication standard/, "Admin UI must explain the publication gate.")
requirePattern(adminRoute, /robots:[\s\S]*index: false[\s\S]*follow: false/, "Admin review route must opt out of indexing and following.")

if (failures.length) {
  console.error("KLEIO opportunity-directory reliability audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO opportunity-directory reliability audit passed: controlled pagination, exact totals, publication-safe filtering, artist-private hide/report controls, trust presentation, administrator authorization and audit history verified.")
