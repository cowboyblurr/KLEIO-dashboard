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
requireText(fn, '.eq("source_fingerprint", sourceFingerprint)', "identical reviewed source sets must use a stable collection fingerprint")
requireText(fn, 'existing.status !== "dismissed"', "existing review-ready or artist-confirmed collection analysis must be reused rather than regenerated")
requireText(fn, "cached: true", "cached group results must be reported explicitly")
forbidText(fn, '.storage.from(', "group synthesis must reuse existing private analyses instead of uploading raw media again")
forbidText(fn, ".download(", "group synthesis must not redownload raw private files")
requireText(fn, "Generated summaries are suggestions only", "group synthesis must preserve the artist-confirmation boundary")

for (const text of ["enable row level security", "artist_media_collection_insights_select_own", "confirm_my_media_collection_insight", "dismiss_my_media_collection_insight", "security invoker", "body_of_work_context", "provenance_status", "'confirmed'", "visibility", "'private'"]) requireText(migration, text, "collection persistence and Passport promotion must remain private, owner-scoped, and artist-confirmed")
requireText(migration, "normalized_key = 'media_collection:'", "confirmed collection context must update one canonical Passport record rather than multiplying duplicates")
requireText(migration, "status = 'removed'", "dismissing a previously confirmed collection insight must remove its promoted Passport evidence")

if (failures.length) {
  console.error("KLEIO body-of-work intelligence audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO body-of-work intelligence audit passed: visible analysis dialogue is truthful, batch comparison is artist-controlled, repeated synthesis is cached, raw media is not reuploaded, and only artist-reviewed collection notes remain reusable Passport evidence.")
