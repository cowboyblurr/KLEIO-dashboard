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

for (const text of ["What KLEIO is reviewing", "Reviewing composition, visible details", "Separating direct observation from interpretive reading"]) requireText(sheet, text, "individual analysis must explain its real review categories without a fake percentage")
requirePattern(sheet, /Reading document structure|Understanding the document and its visual structure/, "document analysis must visibly explain source-understanding work")
requirePattern(sheet, /No artificial completion percentage|instead of presenting a synthetic completion percentage/, "individual analysis must explicitly avoid fake completion percentages")

for (const text of ["Analyze selected together", "Select for group analysis", "Body-of-work intelligence", "analyzableIds.length > 1"]) requireText(library, text, "Media Library must support convenient artist-controlled batch analysis")
requireText(library, "setSelectedIds(analyzableIds.slice(0, 12))", "new multi-file uploads should be preselected for convenient group analysis")

for (const text of ["Understanding the selected work together", "Comparing recurring themes", "Dialogue between works", "What only you can confirm", "Keep as artist context"]) requireText(collectionSheet, text, "collection review must show useful progress, relationships, uncertainty, and an explicit artist confirmation gate")
requireText(collectionSheet, "Generated patterns stay suggestions", "raw AI patterns must remain suggestions until artist review")

requireText(client, 'functions.invoke("analyze-artist-media-collection"', "client must use the protected group-analysis function")
requireText(client, 'rpc("confirm_my_media_collection_insight"', "artist confirmation must use the owner-scoped promotion RPC")
requireText(client, 'rpc("dismiss_my_media_collection_insight"', "dismissal must remove previously promoted collection context through the owner-scoped RPC")

for (const text of ["artist_user_id", ".eq(\"artist_user_id\", userData.user.id)", "individual_analysis_required", "source_refs", "questions_for_artist", "body_of_work_summary"]) requireText(fn, text, "collection synthesis must remain owner-scoped, evidence-backed, and artist-question aware")
requireText(fn, "evidencePairs", "missing individual analyses must remain paired to their actual source IDs rather than query order")
requireText(fn, "const orderedEvidence = [...readyEvidence].sort", "collection cache input must be canonicalized independent of database row order")
requireText(fn, "fingerprint(JSON.stringify(orderedEvidence))", "collection cache must fingerprint the exact synthesis evidence, including current artist-authored work metadata and analysis content")
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
requireText(fn, 'existing.status !== "dismissed"', "existing review-ready or artist-confirmed collection analysis must be reused rather than regenerated")
requireText(fn, "cached: true", "cached group results must be reported explicitly")
forbidText(fn, '.storage.from(', "group synthesis must reuse existing private analyses instead of uploading raw media again")
forbidText(fn, ".download(", "group synthesis must not redownload raw private files")
forbidText(fn, "const analyzedAt = cleanText(media.analyzed_at || profile.generated_at || source.updated_at", "cache identity must not ignore artist-authored portfolio metadata changes")
requireText(fn, "Generated summaries are suggestions only", "group synthesis must preserve the artist-confirmation boundary")
requireText(fn, "Cross-work pattern categories must cite at least two distinct selected sources", "the provider prompt must state the deterministic cross-source grounding rule")

for (const text of ["const DAILY_COLLECTION_LIMIT = 20", "enforceDailyCollectionLimit", "await enforceDailyCollectionLimit(admin, userData.user.id)", "collection_ai_daily_limit_reached"]) requireText(fn, text, "new group synthesis calls must be cost-bounded before invoking the provider")
requireText(fn, '.gte("analyzed_at", start.toISOString())', "daily collection limit must count the authenticated artist's actual generated collection analyses for the UTC day")
requireText(fn, "const UUID_RE", "source identifiers must be validated before owner-scoped UUID queries")
requireText(fn, "invalid_source_id", "malformed source identifiers must fail as a truthful client error rather than a database/server failure")

for (const text of ["enable row level security", "artist_media_collection_insights_select_own", "confirm_my_media_collection_insight", "dismiss_my_media_collection_insight", "security invoker", "body_of_work_context", "provenance_status", "'confirmed'", "visibility", "'private'"]) requireText(migration, text, "collection persistence and Passport promotion must remain private, owner-scoped, and artist-confirmed")
requireText(migration, "normalized_key = 'media_collection:'", "confirmed collection context must update one canonical Passport record rather than multiplying duplicates")
requireText(migration, "status = 'removed'", "dismissing a previously confirmed collection insight must remove its promoted Passport evidence")

if (failures.length) {
  console.error("KLEIO body-of-work intelligence audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO body-of-work intelligence audit passed: visible analysis dialogue is truthful, batch comparison is artist-controlled and cost-bounded, source IDs are validated, cache identity tracks the exact synthesis evidence, cross-work patterns require multiple sources, raw media is not reuploaded, and only artist-reviewed collection notes remain reusable Passport evidence.")