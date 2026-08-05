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

const availability = read("lib/kleio-import-source-availability.ts")
const client = read("lib/kleio-document-intelligence.ts")
const uploadUi = read("components/kleio/artist-document-intelligence.tsx")
const reviewUi = read("components/kleio/passport-updates-inbox.tsx")
const draftUi = read("components/kleio/document-draft-studio.tsx")
const validationFunction = read("supabase/functions/validate-artist-document/index.ts")
const draftFunction = read("supabase/functions/generate-artist-document-draft/index.ts")
const schemaMigration = read("supabase/migrations/20260805133000_document_intelligence_beta.sql")
const patternsMigration = read("supabase/migrations/20260805133200_document_intelligence_patterns.sql")
const analyticsMigration = read("supabase/migrations/20260805133500_document_intelligence_analytics.sql")
const analyticsDictionary = read("lib/kleio-product-event-dictionary.ts")
const fixtures = JSON.parse(read("tests/fixtures/document-intelligence/synthetic-artist-cases.json"))

// Shared feature gate: direct PDF active; connected sources deferred.
requirePattern(availability, /google_drive_image:\s*false/, "Google Drive images must be deferred in the shared beta gate.")
requirePattern(availability, /google_drive_document:\s*false/, "Google Drive documents must be deferred in the shared beta gate.")
requirePattern(availability, /instagram_image:\s*false/, "Instagram must be deferred in the shared beta gate.")
requirePattern(availability, /website:\s*false/, "Website Import must be deferred in the shared beta gate.")
requirePattern(availability, /device_document:\s*true/, "Direct device-document upload must be enabled in the shared beta gate.")
requirePattern(availability, /pdf:\s*true/, "PDF analysis must be enabled in the shared beta gate.")
requirePattern(availability, /existing_kleio_media:\s*true/, "Owner-scoped KLEIO document reanalysis must remain enabled.")
requirePattern(schemaMigration, /source_type in \('device_document', 'pdf', 'existing_kleio_media'\) then true/, "The database beta gate must match the interface gate.")
requirePattern(schemaMigration, /when 'google_drive_document' then 'Deferred/, "The database gate must defer Google Drive documents.")
requirePattern(schemaMigration, /when 'instagram_image' then 'Deferred/, "The database gate must defer Instagram.")

// Browser and canonical-source workflow.
requirePattern(client, /file\.type !== "application\/pdf"/, "The browser must enforce PDF MIME selection.")
requirePattern(client, /MAX_DOCUMENT_BYTES = 15 \* 1024 \* 1024/, "The browser must enforce the 15 MB limit.")
requirePattern(client, /signature !== "%PDF-"/, "The browser must validate the PDF header.")
requirePattern(client, /artist-documents/, "Direct PDF upload must use the private document bucket.")
requirePattern(client, /contentType:\s*"application\/pdf"/, "Stored direct documents must have PDF content type.")
requirePattern(client, /validate-artist-document/, "Extraction must be preceded by server-side document validation.")
requirePattern(client, /eq\("checksum", fileChecksum\)/, "Duplicate detection must use a checksum.")
requirePattern(client, /eq\("artist_user_id", account\.user\.id\)/, "Duplicate and source operations must be owner scoped.")
requirePattern(client, /createSignedUrl\(source\.storage_path, 600\)/, "Private previews must use ten-minute signed URLs.")
requirePattern(client, /applicationAttachments > 0/, "Source deletion must protect application dependencies.")
requirePattern(client, /confirmedPassportRecords > 0/, "Source deletion must protect confirmed Passport dependencies.")

// Server validation boundary.
requirePattern(validationFunction, /roleRow\?\.role !== "artist"/, "Server validation must enforce artist role.")
requirePattern(validationFunction, /eq\("artist_user_id", userData\.user\.id\)/, "Server validation must enforce source ownership.")
requirePattern(validationFunction, /MAX_FILE_BYTES = 15 \* 1024 \* 1024/, "Server validation must enforce the 15 MB limit.")
requirePattern(validationFunction, /MAX_PAGES = 100/, "Server validation must enforce the 100-page limit.")
requirePattern(validationFunction, /invalid_pdf_signature/, "Server validation must expose a stable invalid-signature state.")
requirePattern(validationFunction, /await sha256\(bytes\)/, "Server validation must calculate a SHA-256 checksum.")
requirePattern(validationFunction, /checksum_mismatch/, "Server validation must reject checksum disagreement.")
requirePattern(validationFunction, /embedded_javascript/, "Server validation must screen embedded JavaScript.")
requirePattern(validationFunction, /launch_action/, "Server validation must screen launch actions.")
requirePattern(validationFunction, /embedded_file/, "Server validation must screen embedded files.")
requirePattern(validationFunction, /textLayerStatus === "unavailable"/, "Server validation must distinguish image-only PDFs.")
requirePattern(validationFunction, /const ocrRequired =/, "Server validation must derive an OCR-required state.")
requirePattern(validationFunction, /ocr_status:\s*ocrRequired \? "not_configured" : "not_required"/, "OCR-required documents must be marked honestly when OCR is not configured.")
forbidPattern(validationFunction, /console\.(?:log|info|debug)\(/, "The server validator must not log private document data.")

// Artist-facing upload language and controls.
requirePattern(uploadUi, /Upload CV or artist document/, "The primary upload action must be document-first and concrete.")
for (const phrase of [
  "Uploading your document",
  "Checking the file on KLEIO’s server",
  "Reading the document structure",
  "Preparing updates for your review",
]) requirePattern(uploadUi, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Missing precise progress language: ${phrase}`)
requirePattern(uploadUi, /Nothing is published/, "The upload experience must say nothing publishes automatically.")
requirePattern(uploadUi, /shared with an institution/, "The upload experience must say private sources are not shared with institutions automatically.")
requirePattern(uploadUi, /added to an application automatically/, "The upload experience must say sources are not attached to applications automatically.")
requirePattern(uploadUi, /OCR is not configured/, "The upload experience must explain the OCR limitation.")
requirePattern(uploadUi, /did not invent/, "The OCR fallback must explicitly reject fabricated extraction.")
requirePattern(uploadUi, /Remove analysis/, "Artists must be able to remove analysis without deleting the source.")
requirePattern(uploadUi, /Delete source/, "Artists must be able to request source deletion.")

// Five-layer data and review model.
requirePattern(schemaMigration, /analysis_layer smallint/, "Proposals must retain an analysis layer.")
requirePattern(schemaMigration, /confidence_state text/, "Proposals must retain a meaningful confidence state.")
requirePattern(schemaMigration, /supporting_evidence jsonb/, "Proposals must retain supporting evidence.")
requirePattern(schemaMigration, /bulk_confirm_eligible boolean/, "Proposal records must declare bulk-confirm eligibility.")
requirePattern(schemaMigration, /create table if not exists public\.artist_document_correlations/, "The canonical database must store owner-scoped document correlations.")
requirePattern(schemaMigration, /inheritance_risk boolean/, "Correlation records must retain copied-language inheritance risk.")
requirePattern(schemaMigration, /artist_document_correlations_manage_own/, "Correlation RLS must be owner scoped.")
requirePattern(patternsMigration, /count\(distinct source_id\) >= 2/, "Layer 3 and Layer 4 comparison must require multiple private sources.")
requirePattern(patternsMigration, /analysis_layer,[\s\S]*3,/, "The comparison RPC must create Layer 3 correlations.")
requirePattern(patternsMigration, /'practice_pattern',[\s\S]*4,/, "The comparison RPC must create Layer 4 practice hypotheses.")
requirePattern(patternsMigration, /'conflicting_evidence',[\s\S]*5,/, "The comparison RPC must create Layer 5 conflict records.")
requirePattern(patternsMigration, /fingerprint_count = 1/, "Copied-language inheritance must be detected through evidence fingerprints.")
requirePattern(patternsMigration, /rather than independent confirmation/, "Copied wording must not be treated as independent proof.")

requirePattern(reviewUi, /Verified extracted fact/, "The review interface must label Layer 1 facts.")
requirePattern(reviewUi, /Artist-authored description/, "The review interface must label Layer 2 artist language.")
requirePattern(reviewUi, /Interpretive hypothesis/, "The review interface must label Layer 4 hypotheses.")
requirePattern(reviewUi, /Unknown, conflict, or insufficient evidence/, "The review interface must preserve Layer 5 uncertainty.")
requirePattern(reviewUi, /Review evidence and provenance/, "The review interface must expose evidence and provenance.")
requirePattern(reviewUi, /claim\.page_number/, "The review interface must expose a page reference when available.")
for (const control of ["Confirm privately", "Reject", "Review later", "Merge evidence", "Replace existing", "Keep both privately"])
  requirePattern(reviewUi, new RegExp(control), `Missing artist review control: ${control}`)
forbidPattern(reviewUi, /\b\d{1,3}%\s*(?:confidence|match)/i, "The review interface must not show uncalibrated confidence percentages.")

// Confirmed-facts-only drafting.
requirePattern(draftFunction, /confirmed private Creative Passport records/i, "Draft prompts must use confirmed private Passport records only.")
requirePattern(draftFunction, /eq\("is_sensitive", false\)/, "Drafting must exclude sensitive records.")
requirePattern(draftFunction, /not\("confirmed_at", "is", null\)/, "Drafting must exclude unconfirmed records.")
requirePattern(draftFunction, /store:\s*false/, "AI provider storage must be disabled where supported.")
requirePattern(draftFunction, /json_schema/, "Draft output must use a JSON schema.")
requirePattern(draftFunction, /strict:\s*true/, "Draft output schema must be strict.")
requirePattern(draftFunction, /Never invent exhibitions, awards, grants, education, residencies, publications, locations/, "Draft prompts must include explicit anti-hallucination rules.")
requirePattern(draftFunction, /draft_missing_evidence/, "Every generated option must retain evidence references.")
requirePattern(draftUi, /Prepared by KLEIO Assist for review/, "Drafts must be visibly labeled for artist review.")
requirePattern(draftUi, /Approve and save to Passport/, "Drafts must require explicit approval before Passport save.")
requirePattern(draftUi, />Reject</, "Drafts must be rejectable.")

// Privacy-safe analytics contract.
const documentEvents = [
  "document_upload_started", "document_upload_completed", "document_upload_failed",
  "document_analysis_started", "document_analysis_completed", "document_analysis_partial",
  "document_analysis_failed", "document_ocr_required", "document_classification_corrected",
  "passport_proposal_confirmed", "passport_proposal_edited", "passport_proposal_rejected",
  "passport_conflict_resolved", "interpretation_confirmed", "interpretation_dismissed",
  "biography_draft_requested", "biography_draft_saved",
]
for (const eventName of documentEvents) {
  requirePattern(analyticsDictionary, new RegExp(`\\b${eventName}:`), `Missing event dictionary entry: ${eventName}`)
  requirePattern(analyticsMigration, new RegExp(`'${eventName}'`), `Missing database event contract: ${eventName}`)
}
requirePattern(analyticsDictionary, /uploaded filenames, file contents, document text/, "Analytics must explicitly prohibit filenames and document text.")
requirePattern(analyticsDictionary, /artwork titles, captions, biographies, statements, CV contents/, "Analytics must explicitly prohibit artist-authored content.")
requirePattern(analyticsDictionary, /raw error messages, stack traces/, "Analytics must explicitly prohibit raw errors.")

// Synthetic dataset breadth and unsupported-claim checks.
if (!Array.isArray(fixtures.cases) || fixtures.cases.length < 13) failures.push("Synthetic evaluation dataset must contain at least 13 varied artist cases.")
for (const id of ["scanned_documents", "inconsistent_cv_versions", "bilingual_documents", "photographer_copied_bio", "sparse_documentation"])
  if (!fixtures.cases.some((item) => item.id === id)) failures.push(`Synthetic evaluation case is missing: ${id}`)
for (const item of fixtures.cases || []) {
  if (!Array.isArray(item.must_not_appear) || !item.must_not_appear.length) failures.push(`${item.id}: unsupported-claim expectations are required.`)
  if (!Array.isArray(item.expected_classifications) || !item.expected_classifications.length) failures.push(`${item.id}: expected classifications are required.`)
}
const serializedFixtures = JSON.stringify(fixtures).toLowerCase()
forbidPattern(serializedFixtures, /cowboyblur|iker ortiz|blurr net|@cowboyblur|kleioarthouse\.com/, "Synthetic fixtures must not contain project-member identity data or production-domain content.")

if (failures.length) {
  console.error("KLEIO document intelligence beta audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`KLEIO document intelligence beta audit passed: direct PDF gating, private storage, server validation, OCR honesty, five-layer review, confirmed-facts drafting, privacy-safe analytics and ${fixtures.cases.length} synthetic artist cases verified.`)
