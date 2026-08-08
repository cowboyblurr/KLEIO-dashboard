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
const composer = "components/kleio/application-composer-workspace.tsx"
const library = "components/kleio/artist-media-library.tsx"
const intelligence = "components/kleio/media-intelligence-sheet.tsx"
const intelligenceClient = "lib/kleio-media-intelligence.ts"
const sidebar = "components/kleio/artist-sidebar.tsx"
const migration = "supabase/migrations/20260801183000_universal_media_import.sql"
const availabilityMigration = "supabase/migrations/20260803133000_beta_import_source_availability.sql"
const broadMediaMigration = "supabase/migrations/20260807195500_media_upload_contract_all_supported_materials.sql"

for (const context of ["artist_onboarding", "creative_passport", "portfolio", "profile_image", "application_material", "application_portfolio_selection", "opportunity_requirement", "existing_media_library"]) requireText(architecture, `\"${context}\"`, `universal media architecture must define ${context}`)
for (const source of ["device", "google_drive", "kleio_library", "instagram"]) requireText(architecture, `type: \"${source}\"`, `internal adapter registry must retain ${source}`)
requireText(architecture, "recordMediaUsage", "selection must remain separate from destination usage")
requireText(architecture, "createPortfolioWorkFromMedia", "portfolio must reuse canonical media records")
requireText(architecture, "attachMediaToCreativePassportCv", "specialized CV attachment must continue reusing library records")
forbidText(architecture, "localStorage.setItem(\"google", "provider tokens must not be written to local storage")

for (const expected of ["KLEIO_IMAGE_MIME_TYPES", "KLEIO_VIDEO_MIME_TYPES", "KLEIO_AUDIO_MIME_TYPES", "KLEIO_DOCUMENT_MIME_TYPES", "fileSignatureMatchesKnownMime"]) requireText(fileTypes, expected, `shared upload contract must retain ${expected}`)
for (const signature of ["video/mp4", "audio/mpeg", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", "image/jpeg"]) requireText(fileTypes, signature, `shared upload contract must recognize ${signature}`)
requireText(deviceUpload, "uploadDeviceMediaToLibrary", "direct device upload must use the private canonical media uploader")
requireText(deviceUpload, "artist_import_sources", "direct device upload must persist into the canonical private source model")
requireText(deviceUpload, 'storageBucket = isPdf ? "artist-documents" : "artist-assets"', "PDFs must keep document-safe storage while other media uses artist-assets")
requireText(deviceUpload, "checksum", "direct device upload must retain duplicate detection")

requireText(googleCapabilities, "NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "Google authentication must remain explicitly gated internally")
requireText(googleCapabilities, "NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID", "unreleased provider capability must still require explicit configuration")
forbidText(googleCapabilities, "GOCSPX-", "provider client secrets must never enter client capability code")

for (const source of ["device_image", "device_document", "device_video", "device_audio"]) requireText(availability, `${source}: true`, `${source} must be enabled for artists`)
requireText(availability, "pdf: true", "PDF document intelligence must remain available")
requireText(availability, "existing_kleio_media: true", "existing private KLEIO media must remain reusable")
for (const source of ["google_drive_image", "google_drive_document", "google_drive_video", "google_drive_audio", "instagram_image", "website"]) requireText(availability, `${source}: false`, `${source} must remain internally disabled until validated`)

requireText(quick, "Upload from device", "Quick Media must expose direct device upload")
requireText(quick, "uploadDeviceMediaToLibrary", "Quick Media must use the canonical direct-upload service")
requireText(quick, "KLEIO_GENERAL_UPLOAD_MIME_TYPES", "generic Quick Media contexts must accept supported media and documents")
requireText(quick, "KLEIO_ARTWORK_MEDIA_MIME_TYPES", "artwork Quick Media contexts must accept image, video, and audio")
requireText(quick, 'type="file"', "Quick Media must expose the controlled shared file input")
forbidText(quick, "Choose from Google Drive", "Quick Media must not expose unreleased provider importing")

requireText(signup, "Create with email", "email signup must remain available")
requireText(portfolio, "Choose the work first. Add details second.", "portfolio creation must remain media-first")
requireText(portfolio, "image, video, or audio", "portfolio must explicitly support the artist media types it renders")
requireText(portfolio, "New work queue", "portfolio must show selected media before metadata entry")
requireText(portfolio, '<QuickMediaImport context="portfolio"', "portfolio must use the shared device/private-library picker")
forbidText(portfolio, 'type=\"file\"', "portfolio must not bypass the shared media architecture")
forbidText(portfolio, "ArtistImportStudio", "live Portfolio must not mount the dormant connected-provider importer")
forbidText(portfolio, "Google Drive", "live Portfolio source must not expose unreleased provider copy")
requireText(profile, 'context=\"profile_image\"', "profile imagery must stay on its specialized shared image picker")

requireText(passport, 'label="Add media"', "Creative Passport must expose media-neutral material entry")
requireText(passport, "<MediaIntelligenceSheet", "Creative Passport must surface analysis in place")
requireText(passport, "loadMediaIntelligenceStatuses", "Creative Passport must reuse prior source analysis")
requireText(application, "QuickMediaImport", "application preparation must use the shared private-media picker for missing artwork")
requireText(application, 'context="application_portfolio_selection"', "application artwork quick-add must use the dedicated portfolio-selection media contract")
requireText(application, "createPortfolioWorkFromMedia", "application artwork quick-add must create a canonical Portfolio work rather than attaching a loose file")
requireText(application, "without leaving this application", "application artwork quick-add must preserve route continuity")
requireText(application, "kleio:application-portfolio-changed", "application artwork quick-add must notify the live composer after Portfolio creation")
requireText(composer, "kleio:application-portfolio-changed", "application composer must refresh new Portfolio work without a page reload")
requireText(composer, "setSelectedWorkIds", "application composer must retain explicit work selection after an in-place Portfolio refresh")
forbidText(application, 'href="/artist-dashboard/portfolio/"', "application preparation must not require a Portfolio-page detour for missing artwork")
forbidText(application, "Your application is saved while", "application preparation must not claim persistence simply because another action is opened")
forbidText(application, "ArtistImportStudio", "application preparation must not mount the dormant connected-provider importer")
forbidText(application, "Google Drive", "application artwork actions must not expose unreleased provider copy")
requireText(library, 'title="Media Library"', "artists must retain a private reusable media surface")
requireText(library, "Upload media", "Media Library must expose generic media upload")
requireText(library, '"video"', "Media Library must retain video browsing")
requireText(library, '"audio"', "Media Library must retain audio browsing")
requireText(library, "<MediaIntelligenceSheet", "Media Library must analyze supported sources in place")
forbidText(library, 'href="/artist-dashboard/import/"', "Media Library must not force a separate PDF analysis detour")
requireText(intelligence, "Analyze with KLEIO", "shared media intelligence must provide an explicit artist action")
requireText(intelligence, "not verification", "media intelligence must distinguish confidence from verification")
requireText(intelligenceClient, "requestMediaExtraction", "PDF analysis must retain the structured document engine")
requireText(intelligenceClient, 'functions.invoke("analyze-artist-media"', "image/video/audio analysis must use the protected media analyzer")
requireText(sidebar, 'href: \"/artist-dashboard/media/\"', "the private media library must remain reachable")

requireText(migration, "artist_media_usages", "database must record explicit destination usages")
requireText(migration, "enable row level security", "media usage associations must enforce RLS")
requireText(migration, "artist_media_usages_manage_own", "media usage associations must be owner scoped")
requireText(migration, "existing_kleio_media", "source constraints must support existing KLEIO media reuse")
requireText(availabilityMigration, "enforce_beta_import_source_availability", "source availability must remain database enforced")
requireText(availabilityMigration, "security invoker", "availability enforcement must not bypass RLS")
requireText(broadMediaMigration, "device_video", "broad media migration must persist video source support")
requireText(broadMediaMigration, "device_audio", "broad media migration must persist audio source support")
requireText(broadMediaMigration, "52428800", "private upload storage must retain the 50 MB file ceiling")
forbidText(migration, "disable row level security", "universal media migration must not weaken RLS")
forbidText(availabilityMigration, "disable row level security", "availability migration must not weaken RLS")
forbidText(broadMediaMigration, "disable row level security", "broad media migration must not weaken RLS")

for (const file of [architecture, fileTypes, deviceUpload, googleCapabilities, availability, quick, signup, portfolio, profile, passport, application, composer, library, intelligence, intelligenceClient, sidebar, migration, availabilityMigration, broadMediaMigration]) {
  forbidText(file, "AIzaSy", "Google API keys must not be committed")
  forbidText(file, "GOCSPX-", "Google client secrets must not be committed")
}

if (failures.length) {
  console.error("Universal Media Import audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("Universal Media Import audit passed: private image/document/video/audio upload is active, live artist surfaces stay device/private-library first, missing application artwork can become a canonical Portfolio work without a route detour, Media Library and Creative Passport share in-place intelligence, unreleased connector internals remain gated, and owner-scoped RLS and secret hygiene are intact.")