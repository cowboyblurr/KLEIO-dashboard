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

const availability = read("lib/kleio-import-source-availability.ts")
const mediaPicker = read("components/kleio/media-import/quick-media-import.tsx")
const liveArtist = read("lib/kleio-live-artist.ts")
const completion = read("lib/kleio-passport-completion.ts")
const documentIntelligence = read("components/kleio/artist-document-intelligence.tsx")
const importPage = read("components/kleio/artist-import-studio-page.tsx")
const migration = read("supabase/migrations/20260807173500_artist_beta_readiness_state_sync.sql")

requireText(availability, /device_image:\s*true/, "Direct device image upload must remain enabled for the founding artist beta.")
requireText(mediaPicker, /uploadMediaToLibrary/, "The private media picker must use the canonical upload service.")
requireText(mediaPicker, /Upload from device/, "The private media picker must expose an obvious device-upload action.")
requireText(mediaPicker, /accept=\{config\.allowedMimeTypes\.join\(","\)\}/, "Device upload must derive accepted types from the active media context.")
requireText(mediaPicker, /multiple=\{config\.allowMultiple\}/, "Device upload must respect the context's multi-file rule.")
requireText(mediaPicker, /trackKleioProductEvent\("upload_started"/, "Device upload must use the controlled analytics event dictionary.")
forbidText(mediaPicker, /media_upload_completed/, "Do not introduce analytics events outside the controlled event dictionary.")

requireText(liveArtist, /calculatePassportCompletion/, "Live dashboard readiness must use the canonical Passport completion calculator.")
requireText(liveArtist, /artist_import_sources/, "Live dashboard must recognize a canonical uploaded CV even before profile state catches up.")
requireText(liveArtist, /effectiveCvPath/, "Live dashboard must derive one effective CV state.")
forbidText(liveArtist, /artistRow\.profile_completion/, "Live dashboard must not trust the legacy stored profile_completion percentage.")

requireText(completion, /scoredCategories = categories\.filter\(\(item\) => item\.tier !== "optional"\)/, "Optional Passport enhancements must not block a truthful 100% readiness state.")
requireText(documentIntelligence, /accept="application\/pdf,\.pdf"/, "The CV/document workspace must remain explicitly PDF-only.")
requireText(importPage, /href="\/artist-dashboard\/"/, "Document import must provide an obvious route back to Overview.")
requireText(importPage, /href="\/artist-dashboard\/passport\/"/, "Document import must preserve an obvious route back to the Creative Passport.")

requireText(migration, /artist_beta_enabled = true[\s\S]*source_type = 'device_image'/, "Database beta gating must enable direct device images.")
requireText(migration, /sync_artist_cv_file_path_from_import_source/, "CV source state must synchronize to artist_profiles.cv_file_path.")
requireText(migration, /after insert or update of artist_selected_document_type, classification, storage_path, deleted_at/, "CV synchronization must react to upload, reclassification, replacement and deletion.")
requireText(migration, /with latest_cv as/, "Existing uploaded CVs must be backfilled into canonical profile state.")

console.log("KLEIO artist beta-readiness audit passed: direct artwork upload, truthful CV/completion state, PDF-specific document UX, and clear return navigation are protected.")
