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
const analyticsMigration = read("supabase/migrations/20260805133500_document_intelligence_analytics.sql")
const analyticsDictionary = read("lib/kleio-product-event-dictionary.ts")
const fixtures = JSON.parse(read("tests/fixtures/document-intelligence/synthetic-artist-cases.json"))

requirePattern(availability, /google_drive_image:\s*false[\s\S]*google_drive_document:\s*false/, "Google Drive must be deferred in the shared default beta gate.")
requirePattern(availability, /device_document:\s*true[\s\S]*pdf:\s*true/, "Direct device-document and PDF paths must be enabled in the shared default beta gate.")
requirePattern(schemaMigration, /source_type in \('device_document', 'pdf', 'existing_kleio_media'\) then true/, "Database feature gating must enable direct PDF and owner-scoped KLEIO reanalysis.")
requirePattern(schemaMigration, /when 'google_drive_document' then 'Deferred[\s\S]*when 'instagram_image' then 'Deferred/, "Database feature gating must defer Drive and Instagram.")

requirePattern(client, /validateArtistPdf[\s\S]*%PDF-/, "The browser must validate the PDF signature before upload.")
requirePattern(client, /artist-documents[\s\S]*contentType:\s*"application\/pdf"/, "Direct documents must use the private PDF-only bucket.")
requirePattern(client, /validate-artist-document/, "Extraction must be preceded by server-side PDF validation.")
requirePattern(client, /checksum[\s\S]*maybeSingle/, "Duplicate detection must use an owner-scoped checksum.")
requirePattern(client, /createSignedUrl\(source\.storage_path, 600\)/, "Private previews must use short-lived signed URLs.")
requirePattern(client, /applicationAttachments > 0[\s\S]*confirmedPassportRecords > 0/, "Source deletion must protect application and confirmed-Passport dependencies.")

requirePattern(validationFunction, /roleRow\?\.role !== "artist"/, "Server validation must enforce the artist role.")
requirePattern(validationFunction, /source\.artist_user_id|eq\("artist_user_id", userData\.user\.id\)/, "Server validation must enforce source ownership.")
requirePattern(validationFunction, /MAX_FILE_BYTES = 15 \* 1024 \* 1024/, "Server validation must enforce the 15 MB limit.")
requirePattern(validationFunction, /MAX_PAGES = 100/, "Server validation must enforce the 100-page limit.")
requirePattern(validationFunction, /invalid_pdf_signature[\s\S]*sha256[\s\S]*checksum_mismatch/, "Server validation must verify signature and checksum.")
requirePattern(validationFunction, /embedded_javascript[\s\S]*launch_action[\s\S]*embedded_file/, "Server validation must screen PDF active-content risk.")
requirePattern(validationFunction, /textLayerStatus[\s\S]*ocrRequired[\s\S]*not_configured/, "Image-only PDFs must be marked OCR required without fabricated extraction.")
forbidPattern(validationFunction, /console\.(?:log|info|debug)\([^\n]*(?:bytes|text|source|filename)/i, "Server validation must not log document content or source details.")

requirePattern(uploadUi, /Upload CV or artist document/, "The primary upload action must be concrete and document-first.")
for (const stage of [
  "Uploading your document",
  "Checking the file on KLEIO’s server",
  "Reading the document structure",
  "Preparing updates for your review",
]) requirePattern(uploadUi, new RegExp(stage.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Missing precise progress stage: ${stage}`)
requirePattern(uploadUi, /Nothing is published, shared with an institution, or added to an application automatically/, "Upload consent must explain private artist control.")
requirePattern(uploadUi, /OCR is not configured[\s\S]*did not invent/, "The upload UI must explain unsupported OCR honestly.")
requirePattern(uploadUi, /Remove analysis[\s\S]*Delete source/, "Artists must be able to remove analysis separately from source deletion.")

requirePattern(schemaMigration, /analysis_layer smallint[\s\S]*confidence_state[\s\S]*supporting_evidence/, "Proposals must retain analysis layer, confidence state and evidence.")
requirePattern(schemaMigration, /artist_document_correlations[\s\S]*inheritance_risk[\s\S]*supporting_source_count/, "Cross-document correlations must preserve source count and copied-language risk.")
requirePattern(schemaMigration, /refresh_my_document_correlations[\s\S]*count\(distinct source_id\) >= 2/, "Correlations must require multiple private sources.")
requirePattern(schemaMigration, /fingerprint_count = 1[\s\S]*repeated language rather than independent confirmation/, "Copied language must not be treated as independent proof.")
requirePattern(schemaMigration, /artist_document_correlations_manage_own[\s\S]*auth\.uid/, "Correlation records must be owner isolated by RLS.")

requirePattern(reviewUi, /Layer 1[\s\S]*Verified extracted fact/, "The review interface must label verified extracted facts.")
requirePattern(reviewUi, /Layer 2[\s\S]*Artist-authored description/, "The review interface must distinguish artist-authored description.")
requirePattern(reviewUi, /Interpretive hypothesis/, "The review interface must label interpretive hypotheses.")
requirePattern(reviewUi, /Unknown, conflict, or insufficient evidence/, "The review interface must preserve uncertainty.")
requirePattern(reviewUi, /Review evidence and provenance[\s\S]*Page/, "The review interface must expose evidence and page provenance.")
requirePattern(reviewUi, /Confirm privately[\s\S]*Reject[\s\S]*Review later/, "Artists must be able to confirm, reject and defer.")
requirePattern(reviewUi, /Merge evidence[\s\S]*Replace existing[\s\S]*Keep both privately/, "Duplicate and conflict controls must include merge, replace and keep-both decisions.")
forbidPattern(reviewUi, /\b\d{1,3}%\s*(?:confidence|match)/i, "The review interface must not present uncalibrated confidence percentages.")

requirePattern(draftFunction, /confirmed private Creative Passport records/i, "Draft prompts must use confirmed private Passport records only.")
requirePattern(draftFunction, /eq\("is_sensitive", false\)[\s\S]*not\("confirmed_at", "is", null\)/, "Drafting must exclude sensitive and unconfirmed records.")
requirePattern(draftFunction, /store:\s*false/, "The configured AI request must disable provider storage where supported.")
requirePattern(draftFunction, /response_format[\s\S]*json_schema[\s\S]*strict:\s*true/, "Draft output must use a strict JSON schema.")
requirePattern(draftFunction, /Never invent exhibitions, awards, grants, education, residencies, publications, locations/, "Draft prompts must include explicit anti-hallucination rules.")
requirePattern(draftFunction, /draft_missing_evidence/, "Every draft option must retain evidence references.")
requirePattern(draftUi, /Prepared by KLEIO Assist for review/, "Drafts must be visibly labeled for artist review.")
requirePattern(draftUi, /Approve and save to Passport[\s\S]*Reject/, "Drafts must remain editable, approvable and rejectable.")

for (const eventName of [
  "document_upload_started",
  "document_upload_completed",
  "document_upload_failed",
  "document_analysis_started",
  "document_analysis_completed",
  "document_analysis_partial",
  "document_analysis_failed",
  "document_ocr_required",
  "document_classification_corrected",
  "passport_proposal_confirmed",
  "passport_proposal_edited",
  "passport_proposal_rejected",
  "passport_conflict_resolved",
  "interpretation_confirmed",
  "interpretation_dismissed",
  "biography_draft_requested",
  "biography_draft_saved",
]) {
  requirePattern(analyticsDictionary, new RegExp(`\\b${eventName}:`), `Missing product event definition: ${eventName}`)
  requirePattern(analyticsMigration, new RegExp(`'${eventName}'`), `Missing database analytics event: ${eventName}`)
}
forbidPattern(`${analyticsDictionary}\n${analyticsMigration}`, /filename|evidence_excerpt|artist_name|document_text|biography_text/i, "Analytics contracts must not permit filenames, excerpts, artist names or document text.")

if (!Array.isArray(fixtures.cases) || fixtures.cases.length < 13) failures.push("Synthetic evaluation dataset must contain at least 13 varied artist cases.")
const requiredCases = ["scanned_documents", "inconsistent_cv_versions", "bilingual_documents", "photographer_copied_bio", "sparse_documentation"]
for (const id of requiredCases) if (!fixtures.cases.some((item) => item.id === id)) failures.push(`Synthetic evaluation case is missing: ${id}`)
for (const item of fixtures.cases || []) {
  if (!Array.isArray(item.must_not_appear) || !item.must_not_appear.length) failures.push(`${item.id}: unsupported-claim expectations are required.`)
  if (!Array.isArray(item.expected_classifications) || !item.expected_classifications.length) failures.push(`${item.id}: expected classifications are required.`)
}
const serializedFixtures = JSON.stringify(fixtures).toLowerCase()
forbidPattern(serializedFixtures, /cowboyblur|iker ortiz|kevin|real artist|instagram\.com|gmail\.com/, "Synthetic evaluation fixtures must not contain project-member or real-artist identity data.")

if (failures.length) {
  console.error("KLEIO document intelligence beta audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`KLEIO document intelligence beta audit passed: direct PDF gating, private storage, server validation, OCR honesty, five-layer review, confirmed-facts drafting, privacy-safe analytics and ${fixtures.cases.length} synthetic artist cases verified.`)
