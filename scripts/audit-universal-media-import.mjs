import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")
const requireText = (file, text, message) => { if (!read(file).includes(text)) throw new Error(`${message} (${file})`) }
const forbidText = (file, text, message) => { if (read(file).includes(text)) throw new Error(`${message} (${file})`) }

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
requireText(architecture, "drive.file", "Drive adapter must use the narrow file-specific scope")
requireText(architecture, "fileSignatureMatches", "shared media upload must validate byte signatures")
requireText(architecture, "fileChecksum", "shared media upload must calculate a duplicate checksum")
requireText(architecture, "recordMediaUsage", "media selection must stay separate from destination usage")
requireText(architecture, "createPortfolioWorkFromMedia", "portfolio must reuse canonical media records")
requireText(architecture, "attachMediaToCreativePassportCv", "Creative Passport documents must reuse library media")
forbidText(architecture, "localStorage.setItem(\"google", "Drive tokens must not be written to local storage")

requireText(googleCapabilities, "NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "Google authentication must use an explicit deployment capability gate")
requireText(googleCapabilities, "NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID", "Drive availability must require its public OAuth client configuration")
requireText(googleCapabilities, "NEXT_PUBLIC_GOOGLE_PICKER_API_KEY", "Drive availability must require its restricted Picker key")
forbidText(googleCapabilities, "GOCSPX-", "Google client secrets must never enter client capability code")

requireText(availability, "google_drive_image: true", "artist beta availability must enable Google Drive images")
requireText(availability, "google_drive_document: true", "artist beta availability must enable Google Drive documents")
requireText(availability, "existing_kleio_media: true", "existing private KLEIO media must remain reusable internally")
requireText(availability, "device_image: false", "device image upload must be disabled during the initial beta")
requireText(availability, "instagram_image: false", "Instagram import must be disabled during the initial beta")

requireText(quick, "New beta import", "Quick Import must distinguish new import from internal reuse")
requireText(quick, "Choose from Google Drive", "Quick Import must expose Google Drive as its only new source")
requireText(quick, "Reuse existing private media", "Quick Import must preserve internal Media Library reuse")
requireText(quick, "loadBetaImportAvailability", "Quick Import must use shared runtime availability")
requireText(quick, "nothing has changed yet", "Quick Import must distinguish selection from confirmation")
requireText(quick, "h-dvh", "Quick Import must use a full viewport on mobile")
forbidText(quick, 'type="file"', "Quick Import must not expose device upload during the initial beta")
forbidText(quick, "Instagram Professional Account", "Quick Import must not expose Instagram as an interactive source")

requireText(signup, "isGoogleAuthenticationConfigured", "artist signup must gate Google authentication until the provider is configured")
requireText(signup, "Create with email", "email signup must remain available while Google authentication is pending")
requireText(portfolio, "Choose the work first. Add details second.", "portfolio creation must remain image-first")
requireText(portfolio, "New work queue", "portfolio must show selected media before metadata entry")
requireText(portfolio, "Add story, series, and accessibility details", "secondary portfolio fields must remain progressive")
forbidText(portfolio, 'type=\"file\"', "visual portfolio page must not expose a direct file input")
requireText(profile, 'context=\"profile_image\"', "profile media must use the shared private media picker")
requireText(passport, "Choose CV", "Creative Passport must expose reusable document selection")
requireText(application, 'context=\"application_material\"', "application preparation must expose requirement-aware media selection")
requireText(library, 'title="Media Library"', "artists must have a private reusable media surface")
requireText(library, 'href="/artist-dashboard/import/"', "guided importing must begin from the private Media Library surface")
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

console.log("Universal Media Import audit passed: future adapters remain isolated, Google Drive is the only active new artist-beta source, private KLEIO Library reuse remains internal, device and Instagram paths are not interactive, explicit destination usage remains separate, and owner-scoped RLS and database availability enforcement are intact.")
