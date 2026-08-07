import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")
const failures = []
const requireText = (file, text, message) => { if (!read(file).includes(text)) failures.push(`${message} (${file})`) }
const forbidText = (file, text, message) => { if (read(file).includes(text)) failures.push(`${message} (${file})`) }

const architecture = "lib/kleio-universal-media.ts"
const fileTypes = "lib/kleio-media-file-types.ts"
const deviceUpload = "lib/kleio-device-media-upload.ts"
const googleCapabilities = "lib/kleio-google-capabilities.ts"
const availability = "lib/kleio-import-source-availability.ts"
const quick = "components/kleio/media-import/quick-media-import.tsx"
const signup = "components/kleio/signup/lightweight-artist-signup.tsx"
const portfolio = "components/kleio/visual-artist-portfolio-studio.tsx"
const profile = "components/kleio/profile-media-quick-import.tsx"
const passport = "components/kleio/creative-passport-media-panel.tsx"
const application = "components/kleio/application-media-import-bar.tsx"
const library = "components/kleio/artist-media-library.tsx"
const sidebar = "components/kleio/artist-sidebar.tsx"
const migration = "supabase/migrations/20260801183000_universal_media_import.sql"
const betaMigration = "supabase/migrations/20260803133000_beta_import_source_availability.sql"
const broadMediaMigration = "supabase/migrations/20260807195500_media_upload_contract_all_supported_materials.sql"

for (const context of ["artist_onboarding", "creative_passport", "portfolio", "profile_image", "application_material", "application_portfolio_selection", "opportunity_requirement", "existing_media_library"]) {
  requireText(architecture, `\"${context}\"`, `universal media architecture must define ${context}`)
}
for (const source of ["device", "google_drive", "kleio_library", "instagram"]) {
  requireText(architecture, `type: \"${source}\"`, `future-ready adapter registry must retain ${source}`)
}
requireText(architecture, "drive.file", "deferred Drive adapter must retain the narrow file-specific scope")
requireText(architecture, "recordMediaUsage", "selection must remain separate from destination usage")
requireText(architecture, "createPortfolioWorkFromMedia", "portfolio must reuse canonical media records")
requireText(architecture, "attachMediaToCreativePassportCv", "specialized Passport CV attachment must continue reusing library records")
forbidText(architecture, "localStorage.setItem(\"google", "Drive tokens must not be written to local storage")

for (const expected of ["KLEIO_IMAGE_MIME_TYPES", "KLEIO_VIDEO_MIME_TYPES", "KLEIO_AUDIO_MIME_TYPES", "KLEIO_DOCUMENT_MIME_TYPES", "fileSignatureMatchesKnownMime"]) {
  requireText(fileTypes, expected, `shared upload contract must retain ${expected}`)
}
for (const signature of ["video/mp4", "audio/mpeg", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", "image/jpeg"]) {
  requireText(fileTypes, signature, `shared upload contract must recognize ${signature}`)
}
requireText(deviceUpload, "uploadDeviceMediaToLibrary", "direct device upload must use the private canonical media uploader")
requireText(deviceUpload, "artist_import_sources", "direct device upload must persist into the canonical private source model")
requireText(deviceUpload, "artist-assets", "direct device upload must stay in the private artist-assets bucket")
requireText(deviceUpload, "checksum", "direct device upload must retain duplicate detection")

requireText(googleCapabilities, "NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "Google authentication must remain explicitly gated")
requireText(googleCapabilities, "NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID", "future Drive availability must require OAuth configuration")
requireText(googleCapabilities, "NEXT_PUBLIC_GOOGLE_PICKER_API_KEY", "future Drive availability must require a restricted Picker key")
forbidText(googleCapabilities, "GOCSPX-", "Google client secrets must never enter client capability code")

for (const source of ["device_image", "device_document", "device_video", "device_audio"]) {
  requireText(availability, `${source}: true`, `${source} must be enabled for the current artist beta`)
}
requireText(availability, "pdf: true", "PDF analysis must remain available as a separate analysis path")
requireText(availability, "existing_kleio_media: true", "existing private KLEIO media must remain reusable")
for (const source of ["google_drive_image", "google_drive_document", "google_drive_video", "google_drive_audio", "instagram_image", "website"]) {
  requireText(availability, `${source}: false`, `${source} must remain deferred until its connected-provider flow is validated`)
}

requireText(quick, "Upload from device", "Quick Media must expose direct device upload")
requireText(quick, "uploadDeviceMediaToLibrary", "Quick Media must use the canonical direct-upload service")
requireText(quick, "KLEIO_GENERAL_UPLOAD_MIME_TYPES", "generic Quick Media contexts must accept supported media and documents")
requireText(quick, "KLEIO_ARTWORK_MEDIA_MIME_TYPES", "artwork Quick Media contexts must accept image, video, and audio")
requireText(quick, "loadBetaImportAvailability", "Quick Media must use shared runtime availability")
requireText(quick, 'source: "kleio_library"', "Quick Media confirmation must continue reusing canonical library records after device upload")
requireText(quick, "h-dvh", "Quick Media must use the full viewport on mobile")
requireText(quick, 'type="file"', "Quick Media must expose the controlled shared file input")
forbidText(quick, "Choose from Google Drive", "Quick Media must not expose deferred Drive importing")

requireText(signup, "isGoogleAuthenticationConfigured", "artist signup must gate Google authentication")
requireText(signup, "Create with email", "email signup must remain available")
requireText(portfolio, "Choose the work first. Add details second.", "portfolio creation must remain media-first")
requireText(portfolio, "image, video, or audio", "portfolio must explicitly support the artist media types it renders")
requireText(portfolio, "New work queue", "portfolio must show selected media before metadata entry")
requireText(portfolio, "Add story, series, and accessibility details", "secondary portfolio fields must remain progressive")
forbidText(portfolio, 'type=\"file\"', "portfolio must not bypass the shared media architecture")
requireText(profile, 'context=\"profile_image\"', "profile imagery must stay on its specialized shared image picker")
requireText(passport, "Add material", "Creative Passport must expose media-neutral material entry")
requireText(passport, "When you analyze a PDF", "Creative Passport must distinguish PDF analysis from generic upload")
requireText(application, 'context=\"application_material\"', "application preparation must expose requirement-aware media selection")
requireText(library, 'title="Media Library"', "artists must retain a private reusable media surface")
requireText(library, "Upload media", "Media Library must expose generic media upload rather than PDF-only upload")
requireText(library, '"video"', "Media Library must retain video browsing")
requireText(library, '"audio"', "Media Library must retain audio browsing")
requireText(library, 'href="/artist-dashboard/import/"', "guided PDF analysis must remain reachable from the Media Library")
requireText(sidebar, 'href: \"/artist-dashboard/media/\"', "the private media library must remain reachable")

requireText(migration, "artist_media_usages", "database must record explicit destination usages")
requireText(migration, "enable row level security", "media usage associations must enforce RLS")
requireText(migration, "artist_media_usages_manage_own", "media usage associations must be owner scoped")
requireText(migration, "existing_kleio_media", "source constraints must support existing KLEIO media reuse")
requireText(betaMigration, "enforce_beta_import_source_availability", "beta source availability must remain database enforced")
requireText(betaMigration, "security invoker", "beta enforcement must not bypass RLS")
requireText(broadMediaMigration, "device_video", "broad media migration must persist video source support")
requireText(broadMediaMigration, "device_audio", "broad media migration must persist audio source support")
requireText(broadMediaMigration, "52428800", "private upload storage must retain the 50 MB file ceiling")
forbidText(migration, "disable row level security", "universal media migration must not weaken RLS")
forbidText(betaMigration, "disable row level security", "beta availability migration must not weaken RLS")
forbidText(broadMediaMigration, "disable row level security", "broad media migration must not weaken RLS")

for (const file of [architecture, fileTypes, deviceUpload, googleCapabilities, availability, quick, signup, portfolio, profile, passport, application, library, sidebar, migration, betaMigration, broadMediaMigration]) {
  forbidText(file, "AIzaSy", "Google API keys must not be committed")
  forbidText(file, "GOCSPX-", "Google client secrets must not be committed")
}

if (failures.length) {
  console.error("Universal Media Import audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("Universal Media Import audit passed: direct private image/document/video/audio upload is active, PDF analysis remains a separate capability, existing KLEIO media stays reusable, connected providers remain deferred, destination usage remains explicit, and owner-scoped RLS and secret hygiene are intact.")
