import { readFileSync } from "node:fs"

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
}

function requireText(content, pattern, message) {
  if (!pattern.test(content)) throw new Error(message)
}

const migration = read("supabase/migrations/20260801210000_upload_to_passport_intelligence.sql")
const extractor = read("supabase/functions/extract-artist-materials/index.ts")
const intelligence = read("lib/kleio-upload-to-passport.ts")
const inbox = read("components/kleio/passport-updates-inbox.tsx")
const requirementSlots = read("components/kleio/application-requirement-media.tsx")
const packageBuilder = read("lib/kleio-application-preparation.ts")
const passportPanel = read("components/kleio/creative-passport-media-panel.tsx")
const mediaLibrary = read("components/kleio/artist-media-library.tsx")
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
requireText(migration, /source_version_id uuid references public\.artist_document_versions/, "Application attachments must preserve document versions.")

requireText(extractor, /verify_jwt|authorization/i, "The extraction boundary must authenticate the artist.")
requireText(extractor, /sourceId/, "The extractor must operate on canonical source IDs.")
requireText(extractor, /artist_extraction_jobs/, "The extractor must persist idempotent extraction jobs.")
requireText(extractor, /artist_import_proposals/, "The extractor must persist reviewable claims rather than overwrite the Passport.")
requireText(extractor, /artist_document_versions/, "The extractor must preserve explicit document versions.")
requireText(extractor, /sensitivity === "standard" \? mergedText : ""/, "Sensitive sources must not retain full extracted text in the generic job record.")
requireText(extractor, /ocr_required/, "Image-only PDF handling must report the OCR limitation honestly.")
requireText(extractor, /artist_confirmation_required: true/, "Extraction must always require artist confirmation.")

requireText(intelligence, /confirmPassportClaim/, "Missing artist-controlled Passport confirmation action.")
requireText(intelligence, /artist_passport_records/, "Confirmed structured Passport records are not persisted.")
requireText(intelligence, /relationship_status/, "Duplicate and conflict relationships are not represented.")
requireText(intelligence, /validateSourceAgainstRequirement/, "Missing deterministic requirement validation.")
requireText(intelligence, /attachMediaToRequirement/, "Missing exact requirement-to-source attachment behavior.")
requireText(intelligence, /visibility: options\.visibility \?\? "private"/, "Confirmed Passport records must default to private.")

requireText(inbox, /Passport Updates for Review/, "The artist review inbox is missing.")
requireText(inbox, /View source evidence/, "Claims must expose their source evidence.")
requireText(inbox, /Confirm privately/, "The artist must explicitly confirm extracted information.")
requireText(inbox, /Replace existing/, "Conflict resolution must remain an artist decision.")
requireText(inbox, /Keep existing/, "Duplicate resolution must preserve existing records when the artist chooses.")
requireText(inbox, /Restricted source/, "Sensitive records need a non-color restricted-state label.")

requireText(requirementSlots, /Attach the right source to the right requirement/, "Requirement-specific application slots are missing.")
requireText(requirementSlots, /validate and include|Validate and include/i, "Requirement confirmation language is missing.")
requireText(requirementSlots, /external portal remains the final authority/i, "External opportunity limitations must remain explicit.")
requireText(packageBuilder, /attachment_checksums/, "Application packages must preserve source checksums.")
requireText(packageBuilder, /source_version_id/, "Application package items must preserve the chosen source version.")
requireText(packageBuilder, /validation_result/, "Application package items must preserve deterministic validation results.")
requireText(packageBuilder, /included_in_package/, "Package inclusion must be explicit.")

requireText(passportPanel, /requestMediaExtraction\(item, "artist_cv"\)/, "CV selection must start Passport extraction.")
requireText(passportPanel, /passport\/review/, "The Creative Passport must link to its review inbox.")
requireText(mediaLibrary, /requestMediaExtraction/, "Media Library documents must support analysis.")
requireText(legacyImport, /uploadMediaToLibrary/, "The legacy PDF importer must use the canonical private source layer.")
requireText(legacyImport, /confirmPassportClaim/, "The legacy review surface must use structured Passport confirmation.")

for (const content of [extractor, intelligence, inbox, requirementSlots, packageBuilder]) {
  requireText(content, /(private|artist confirmation|artist_confirmed|artist_approved)/i, "Artist-control language or state is missing from an Upload-to-Passport layer.")
  if (/automatically public|silent public|public bucket/i.test(content)) throw new Error("Upload-to-Passport code contains unsafe public-exposure language.")
}

console.log("KLEIO Upload-to-Passport audit passed: canonical sources, extraction jobs, structured claims, artist review, Passport provenance, document versions, exact requirement attachments, and package evidence verified.")
