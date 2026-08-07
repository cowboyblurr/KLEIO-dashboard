import { readFileSync } from "node:fs"

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
}
function requireText(content, pattern, message) {
  if (!pattern.test(content)) throw new Error(message)
}
function forbidText(content, pattern, message) {
  if (pattern.test(content)) throw new Error(message)
}

const migration = read("supabase/migrations/20260801210000_upload_to_passport_intelligence.sql")
const extractor = read("supabase/functions/extract-artist-materials/index.ts")
const intelligence = read("lib/kleio-upload-to-passport.ts")
const mediaIntelligence = read("lib/kleio-media-intelligence.ts")
const inbox = read("components/kleio/passport-updates-inbox.tsx")
const requirementSlots = read("components/kleio/application-requirement-media.tsx")
const packageBuilder = read("lib/kleio-application-preparation.ts")
const passportPanel = read("components/kleio/creative-passport-media-panel.tsx")
const mediaLibrary = read("components/kleio/artist-media-library.tsx")
const mediaSheet = read("components/kleio/media-intelligence-sheet.tsx")
const legacyImport = read("lib/kleio-artist-import.ts")

for (const table of [
  "artist_extraction_jobs",
  "artist_passport_records",
  "artist_document_versions",
  "artist_requirement_assessments",
  "application_requirement_attachments",
]) {
  requireText(migration, new RegExp(`create table if not exists public\\.${table}`), `Missing ${table} migration.`)
  requireText(migration, new RegExp(`alter table public\\.${table} enable row level security`), `RLS is not enabled for ${table}.`)
}
requireText(migration, /select auth\.uid\(\)/, "Owner-scoped RLS must use a selected auth.uid value.")
requireText(migration, /source_claim_id uuid references public\.artist_import_proposals/, "Confirmed Passport records must retain source-claim provenance.")
requireText(migration, /source_version_id uuid references public\.artist_document_versions/, "Application attachments must preserve document-version provenance.")

requireText(extractor, /authorization/i, "The extraction boundary must authenticate the artist.")
requireText(extractor, /sourceId/, "The extractor must operate on canonical source IDs.")
requireText(extractor, /artist_extraction_jobs/, "The extractor must persist idempotent extraction jobs.")
requireText(extractor, /artist_import_proposals/, "The extractor must persist reviewable claims rather than overwrite the Passport.")
requireText(extractor, /document_version/, "The extractor must preserve an explicit source document version.")
requireText(extractor, /documentVersion:\s*source\.document_version/, "The extractor cache key must include the document version.")
requireText(extractor, /input\.source\.sensitivity === "standard" \? merged : ""/, "Sensitive sources must not retain full extracted text in the generic job record.")
requireText(extractor, /artist_confirmation_required:\s*true/, "Extraction must always require artist confirmation.")
requireText(extractor, /provider_unavailable/, "Provider limitations must remain explicit rather than appearing complete.")

requireText(intelligence, /confirmPassportClaim/, "Missing artist-controlled Passport confirmation action.")
requireText(intelligence, /artist_passport_records/, "Confirmed structured Passport records are not persisted.")
requireText(intelligence, /relationship_status/, "Duplicate and conflict relationships are not represented.")
requireText(intelligence, /validateSourceAgainstRequirement/, "Missing deterministic requirement validation.")
requireText(intelligence, /attachMediaToRequirement/, "Missing exact requirement-to-source attachment behavior.")
requireText(intelligence, /visibility:\s*options\.visibility \?\? "private"/, "Confirmed Passport records must default to private.")

requireText(inbox, /Review information by field/, "The artist review inbox is missing its compact field-level review surface.")
requireText(inbox, />Evidence</, "Claims must expose their source evidence on demand.")
requireText(inbox, /visibility:\s*"private"/, "Approving a suggestion must write it to the private Passport by default.")
requireText(inbox, /Approve replacement/, "Conflict replacement must remain an artist decision.")
requireText(inbox, /Keep current/, "Duplicate resolution must let the artist keep the current record.")
requireText(inbox, /claim\.sensitivity === "standard"/, "Sensitive claims must be excluded from bulk safe-fact approval.")
requireText(inbox, /Approve safe facts/, "Only explicitly safe factual suggestions may be bulk approved.")
requireText(inbox, /Reject/, "The artist must be able to reject a suggestion without changing the Passport.")

requireText(requirementSlots, /exact requirement/i, "Requirement-specific application slots must remain explicit.")
requireText(requirementSlots, /Required files must be included before KLEIO will preserve a final submission version/i, "Required-file preflight language is missing.")
requireText(packageBuilder, /attachment_checksums/, "Application packages must preserve source checksums.")
requireText(packageBuilder, /source_version_id/, "Application package items must preserve the chosen source version.")
requireText(packageBuilder, /validation_result/, "Application package items must preserve deterministic validation results.")
requireText(packageBuilder, /included_in_package/, "Package inclusion must be explicit.")

requireText(passportPanel, /MediaIntelligenceSheet/, "Creative Passport must surface source intelligence in place.")
requireText(passportPanel, /passport\/review/, "Creative Passport must link to its review inbox.")
requireText(mediaLibrary, /MediaIntelligenceSheet/, "Media Library must surface source intelligence in place.")
requireText(mediaIntelligence, /requestMediaExtraction/, "Shared media intelligence must retain the structured PDF extraction engine.")
requireText(mediaIntelligence, /loadMediaIntelligence/, "Completed source intelligence must be reloaded from the canonical private source.")
requireText(mediaSheet, /does not rewrite your Passport without your approval/, "In-place intelligence must make artist control explicit.")
requireText(mediaSheet, /not verification/, "AI confidence must not be presented as verification.")

requireText(legacyImport, /uploadMediaToLibrary/, "The legacy PDF importer must still use the canonical private source layer.")
requireText(legacyImport, /confirmPassportClaim/, "The legacy review surface must still use structured Passport confirmation.")

for (const content of [extractor, intelligence, mediaIntelligence, inbox, requirementSlots, packageBuilder, mediaSheet]) {
  requireText(content, /(private|artist confirmation|artist_confirmed|artist_approved|approval)/i, "Artist-control language or state is missing from an Upload-to-Passport layer.")
  forbidText(content, /automatically public|silent public|public bucket/i, "Upload-to-Passport code contains unsafe public-exposure language.")
}

console.log("KLEIO Upload-to-Passport audit passed: canonical sources, persisted PDF/media intelligence, compact artist review, provenance/versioning, exact requirement attachments, package evidence, and in-place artist control verified.")
