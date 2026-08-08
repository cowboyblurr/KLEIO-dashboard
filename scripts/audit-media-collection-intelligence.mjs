import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const failures = []
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")
const requireText = (file, text, message) => { if (!read(file).includes(text)) failures.push(`${file}: ${message}`) }
const requirePattern = (file, pattern, message) => { if (!pattern.test(read(file))) failures.push(`${file}: ${message}`) }
const forbidText = (file, text, message) => { if (read(file).includes(text)) failures.push(`${file}: ${message}`) }

const sheet = "components/kleio/media-intelligence-sheet.tsx"
const collectionSheet = "components/kleio/media-collection-intelligence-sheet.tsx"
const library = "components/kleio/artist-media-library.tsx"
const client = "lib/kleio-media-collection-intelligence.ts"
const fn = "supabase/functions/analyze-artist-media-collection/index.ts"
const migration = "supabase/migrations/20260807224500_artist_media_collection_intelligence.sql"
const claimMigration = "supabase/migrations/20260807234200_artist_media_collection_analysis_claim.sql"

for (const text of ["Media Assist is preparing", "Noting visible details, composition", "Keeping visible details separate from optional interpretation"]) requireText(sheet, text, "single-source Media Assist must explain its real source-preparation categories without presenting a creative score")
requirePattern(sheet, /Reading the document and its visual structure/, "document Media Assist must visibly explain source-reading work")
requirePattern(sheet, /No creative score is created/, "single-source Media Assist must explicitly reject creative scoring while organizing source-grounded suggestions")

for (const text of ["Run Media Assist", "Select for Media Assist", "Saved Media Assist notes", "analyzableIds.length > 1"]) requireText(library, text, "Media Library must support convenient artist-controlled Media Assist selection and comparison")
requireText(library, "setSelectedIds(analyzableIds.slice(0, 12))", "new multi-file uploads should be preselected for convenient Media Assist comparison")
requirePattern(library, /selectedItems\.length === 1[\s\S]*setSelectedItem\(selectedItems\[0\]\)/, "one selected source must open single-source Media Assist instead of requiring a comparison")

for (const text of ["Preparing the selected work together", "Comparing recurring terms and themes", "Possible dialogue between works", "What only you can confirm", "Keep as artist context"]) requireText(collectionSheet, text, "Media Assist comparison must show useful preparation, relationships, uncertainty, and an explicit artist confirmation gate")
requireText(collectionSheet, "Everything above is optional", "generated comparison suggestions must remain optional until artist review")
requireText(collectionSheet, "does not rank the work or decide what the work means", "Media Assist comparison must explicitly reject creative judgment")

requireText(client, 'functions.invoke("analyze-artist-media-collection"', "client must use the protected group-processing function")
requireText(client, 'rpc("confirm_my_media_collection_insight"', "artist confirmation must use the owner-scoped promotion RPC")
requireText(client, 'rpc("dismiss_my_media_collection_insight"', "dismissal must remove previously promoted collection context through the owner-scoped RPC")

for (const text of ["artist_user_id", ".eq(\"artist_user_id\", userData.user.id)", "individual_analysis_required", "source_refs", "questions_for_artist", "body_of_work_summary"]) requireText(fn, text, "collection synthesis must remain owner-scoped, evidence-backed, and artist-question aware")
requireText(fn, "evidencePairs", "missing individual source processing must remain paired to actual source IDs rather than query order")
requireText(fn, "const orderedEvidence = [...readyEvidence].sort", "collection cache input must be canonicalized independent of database row order")
requireText(fn, "fingerprint(JSON.stringify(orderedEvidence))", "collection cache must fingerprint the exact synthesis evidence, including current artist-authored work metadata and source-processing content")
requireText(fn, "kleio_media_collection_intelligence_v2", "material cache/evidence behavior changes must carry a new prompt version")
requireText(fn, "patternArray(value: unknown, allowedRefs: Set<string>, minRefs = 1)", "pattern normalization must support deterministic minimum-source grounding")
requireText(fn, "refs.length < minRefs", "cross-work patterns with insufficient distinct source evidence must be discarded")
for (const text of [
  "patternArray(value.recurring_themes, allowedRefs, 2)",
  "patternArray(value.formal_relationships, allowedRefs, 2)",
  "patternArray(value.material_process_patterns, allowedRefs, 2)",
  "patternArray(value.work_dialogues, allowedRefs, 2)",
]) requireText(fn, text, "every cross-work pattern category must require at least two distinct selected sources")
requireText(fn, '.eq("source_fingerprint", sourceFingerprint)', "identical reviewed synthesis evidence must use a stable collection fingerprint")
requireText(fn, 'existing.status !== "dismissed"', "existing review-ready or artist-confirmed collection result must be reused rather than regenerated")
requireText(fn, "cached: true", "cached group results must be reported explicitly")
forbidText(fn, '.storage.from(', "group synthesis must reuse existing private source results instead of uploading raw media again")
forbidText(fn, ".download(", "group synthesis must not redownload raw private files")
forbidText(fn, "const analyzedAt = cleanText(media.analyzed_at || profile.generated_at || source.updated_at", "cache identity must not ignore artist-authored portfolio metadata changes")
requireText(fn, "Generated summaries are suggestions only", "group synthesis must preserve the artist-confirmation boundary")
requireText(fn, "Cross-work pattern categories must cite at least two distinct selected sources", "the provider prompt must state the deterministic cross-source grounding rule")

for (const text of ["const DAILY_COLLECTION_LIMIT = 20", "enforceDailyCollectionLimit", "await enforceDailyCollectionLimit(admin, userData.user.id)", "collection_ai_daily_limit_reached"]) requireText(fn, text, "new group synthesis calls must be cost-bounded before invoking the provider")
for (const text of ["artist_ai_usage_events", '.eq("action", "analyze_media")', '.contains("metadata", { analysis_kind: "collection" })', '.in("status", ["succeeded", "failed"])']) requireText(fn, text, "collection daily limits must be based on real provider-attempt telemetry rather than the number of retained insight rows")
for (const text of ["recordCollectionUsage", 'analysis_kind: "collection"', '"succeeded"', '"failed"', '"cached"']) requireText(fn, text, "collection synthesis must record succeeded, failed, and cached usage without storing raw artist content")
requireText(fn, "const UUID_RE", "source identifiers must be validated before owner-scoped UUID queries")
requireText(fn, "invalid_source_id", "malformed source identifiers must fail as a truthful client error rather than a database/server failure")
for (const text of ['auth.rpc("claim_my_media_collection_analysis"', "collection_analysis_in_progress", 'auth.rpc("release_my_media_collection_analysis"', "finally"]) requireText(fn, text, "group synthesis must use and always release an owner-scoped concurrency lease")

for (const text of ["enable row level security", "artist_media_collection_insights_select_own", "confirm_my_media_collection_insight", "dismiss_my_media_collection_insight", "security invoker", "body_of_work_context", "provenance_status", "'confirmed'", "visibility", "'private'"]) requireText(migration, text, "collection persistence and Passport promotion must remain private, owner-scoped, and artist-confirmed")
requireText(migration, "normalized_key = 'media_collection:'", "confirmed collection context must update one canonical Passport record rather than multiplying duplicates")
requireText(migration, "status = 'removed'", "dismissing a previously confirmed collection insight must remove its promoted Passport evidence")

for (const text of ["artist_media_collection_analysis_claims", "artist_user_id uuid primary key", "enable row level security", "claim_my_media_collection_analysis", "release_my_media_collection_analysis", "security invoker", "interval '4 minutes'", "unique_violation", "source_fingerprint = normalized_fingerprint"]) requireText(claimMigration, text, "collection processing leases must be owner-scoped, atomic, stale-recoverable, and fingerprint-safe on release")
requireText(claimMigration, "One collection analysis may run per artist at a time", "the lease should serialize group synthesis per artist to prevent cost-limit races and duplicate provider calls")

if (failures.length) {
  console.error("KLEIO Media Assist collection audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO Media Assist collection audit passed: visible source preparation is truthful and non-judgmental, single and multi-source flows are artist-controlled, provider use is cost-bounded and concurrency-guarded, source IDs are validated, cache identity tracks exact evidence, cross-work patterns require multiple sources, raw media is not reuploaded, provider attempts remain auditable, and only artist-reviewed notes can become reusable Passport evidence.")