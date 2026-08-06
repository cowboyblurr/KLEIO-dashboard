import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")
const failures = []
const requireText = (file, text, message) => { if (!read(file).includes(text)) failures.push(`${message} (${file})`) }
const forbidText = (file, text, message) => { if (read(file).includes(text)) failures.push(`${message} (${file})`) }

const architecture = "lib/kleio-universal-media.ts"
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

for (const context of ["artist_onboarding", "creative_passport", "portfolio", "profile_image", "application_material", "application_portfolio_selection", "opportunity_requirement", "existing_media_library"]) {
  requireText(architecture, `\"${context}\"`, `universal media architecture must define ${context}`)
}
for (const source of ["device", "google_drive", "kleio_library", "instagram"]) {
  requireText(architecture, `type: \"${source}\"`, `future-ready adapter registry must retain ${source}`)
}
requireText(architecture, "drive.file", "deferred Drive adapter must retain the narrow file-specific scope")
requireText(architecture, "fileSignatureMatches", "shared media upload must validate byte signatures")
requireText(architecture, "fileChecksum", "shared media upload must calculate duplicate checksums")
requireText(architecture, "recordMediaUsage", "selection must remain separate from destination usage")
requireText(architecture, "createPortfolioWorkFromMedia", "portfolio must reuse canonical media records")
requireText(architecture, "attachMediaToCreativePassportCv", "Passport documents must reuse library records")
forbidText(architecture, "localStorage.setItem(\"google", "Drive tokens must not be written to local storage")

requireText(googleCapabilities, "NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "Google authentication must remain explicitly gated")
requireText(googleCapabilities, "NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID", "future Drive availability must require OAuth configuration")
requireText(googleCapabilities, "NEXT_PUBLIC_GOOGLE_PICKER_API_KEY", "future Drive availability must require a restricted Picker key")
forbidText(googleCapabilities, "GOCSPX-", "Google client secrets must never enter client capability code")

requireText(availability, "device_document: true", "direct private documents must be enabled in the current beta")
requireText(availability, "pdf: true", "PDF analysis must be enabled in the current beta")
requireText(availability, "existing_kleio_media: true", "existing private KLEIO media must remain reusable")
requireText(availability, "google_drive_image: false", "Google Drive images must remain deferred")
requireText(availability, "google_drive_document: false", "Google Drive documents must remain deferred")
requireText(availability, "device_image: false", "device image import must remain deferred")
requireText(availability, "instagram_image: false", "Instagram import must remain deferred")
requireText(availability, "website: false", "Website Import must remain deferred")

requireText(quick, "Reuse existing private media", "Quick Media must remain an internal library picker")
requireText(quick, "Connected providers are deferred during the direct-document beta", "Quick Media must explain the current source boundary")
requireText(quick, "loadBetaImportAvailability", "Quick Media must use shared runtime availability")
requireText(quick, 'source: "kleio_library"', "Quick Media must confirm only existing KLEIO Library records")
requireText(quick, "h-dvh", "Quick Media must use the full viewport on mobile")
forbidText(quick, 'type="file"', "Quick Media must not expose direct device upload")
forbidText(quick, "Choose from Google Drive", "Quick Media must not expose deferred Drive importing")

requireText(signup, "isGoogleAuthenticationConfigured", "artist signup must gate Google authentication")
requireText(signup, "Create with email", "email signup must remain available")
requireText(portfolio, "Choose the work first. Add details second.", "portfolio creation must remain image-first")
requireText(portfolio, "New work queue", "portfolio must show selected media before metadata entry")
requireText(portfolio, "Add story, series, and accessibility details", "secondary portfolio fields must remain progressive")
forbidText(portfolio, 'type=\"file\"', "portfolio must not bypass the shared media architecture")
requireText(profile, 'context=\"profile_image\"', "profile media must use the shared private media picker")
requireText(passport, "Choose CV", "Creative Passport must expose reusable document selection")
requireText(application, 'context=\"application_material\"', "application preparation must expose requirement-aware media selection")
requireText(library, 'title="Media Library"', "artists must retain a private reusable media surface")
requireText(library, 'href="/artist-dashboard/import/"', "guided document importing must begin from the import workspace")
requireText(sidebar, 'href: \"/artist-dashboard/media/\"', "the private media library must remain reachable")

requireText(migration, "artist_media_usages", "database must record explicit destination usages")
requireText(migration, "enable row level security", "media usage associations must enforce RLS")
requireText(migration, "artist_media_usages_manage_own", "media usage associations must be owner scoped")
requireText(migration, "existing_kleio_media", "source constraints must support existing KLEIO media reuse")
requireText(betaMigration, "enforce_beta_import_source_availability", "beta source availability must be database enforced")
requireText(betaMigration, "security invoker", "beta enforcement must not bypass RLS")
forbidText(migration, "disable row level security", "universal media migration must not weaken RLS")
forbidText(betaMigration, "disable row level security", "beta availability migration must not weaken RLS")

for (const file of [architecture, googleCapabilities, availability, quick, signup, portfolio, profile, passport, application, library, sidebar, migration, betaMigration]) {
  forbidText(file, "AIzaSy", "Google API keys must not be committed")
  forbidText(file, "GOCSPX-", "Google client secrets must not be committed")
}

if (failures.length) {
  console.error("Universal Media Import audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("Universal Media Import audit passed: direct private PDFs are active, existing KLEIO media remains reusable, connected providers are deferred but safely preserved, explicit destination usage remains separate, and owner-scoped RLS and secret hygiene are intact.")
