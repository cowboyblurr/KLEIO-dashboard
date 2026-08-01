import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")
const requireText = (file, text, message) => { if (!read(file).includes(text)) throw new Error(`${message} (${file})`) }
const forbidText = (file, text, message) => { if (read(file).includes(text)) throw new Error(`${message} (${file})`) }

const architecture = "lib/kleio-universal-media.ts"
const googleCapabilities = "lib/kleio-google-capabilities.ts"
const quick = "components/kleio/media-import/quick-media-import.tsx"
const signup = "components/kleio/signup/lightweight-artist-signup.tsx"
const portfolio = "components/kleio/visual-artist-portfolio-studio.tsx"
const profile = "components/kleio/profile-media-quick-import.tsx"
const passport = "components/kleio/creative-passport-media-panel.tsx"
const application = "components/kleio/application-media-import-bar.tsx"
const library = "components/kleio/artist-media-library.tsx"
const sidebar = "components/kleio/artist-sidebar.tsx"
const migration = "supabase/migrations/20260801183000_universal_media_import.sql"

for (const context of ["artist_onboarding", "creative_passport", "portfolio", "profile_image", "application_material", "application_portfolio_selection", "opportunity_requirement", "existing_media_library"]) {
  requireText(architecture, `\"${context}\"`, `universal media architecture must define ${context}`)
}
for (const source of ["device", "google_drive", "kleio_library", "instagram"]) {
  requireText(architecture, `type: \"${source}\"`, `source adapter registry must define ${source}`)
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
requireText(googleCapabilities, "without losing any Creative Passport features", "pending Google authentication must explain the email fallback")
requireText(googleCapabilities, "Upload from this device or reuse your private KLEIO Library", "pending Drive setup must provide working alternatives")
forbidText(googleCapabilities, "GOCSPX-", "Google client secrets must never enter client capability code")

requireText(quick, "<dialog", "Quick Import must use accessible dialog semantics")
requireText(quick, "Choose from KLEIO Library", "Quick Import must support private-media reuse")
requireText(quick, "Setup pending", "unconfigured Drive must be disabled honestly rather than fail after selection")
requireText(quick, "isGoogleDriveConfigured", "Quick Import must evaluate Drive deployment capability before enabling it")
requireText(quick, "Planned after beta", "Instagram must be clearly non-functional during beta")
requireText(quick, "nothing has changed yet", "Quick Import must distinguish selection from confirmation")
requireText(quick, "h-dvh", "Quick Import must use a full viewport on mobile")
requireText(signup, "isGoogleAuthenticationConfigured", "artist signup must gate Google authentication until the provider is configured")
requireText(signup, "Google sign-in setup pending", "artist signup must show a truthful pending state")
requireText(signup, "Create with email", "email signup must remain available while Google authentication is pending")

requireText(portfolio, "Choose the work first. Add details second.", "portfolio creation must be image-first")
requireText(portfolio, "New work queue", "portfolio must show uploaded media before metadata entry")
requireText(portfolio, "Add story, series, and accessibility details", "secondary portfolio fields must be progressive")
requireText(portfolio, "See the body of work, not a database form", "portfolio presentation must remain artist-oriented")
forbidText(portfolio, 'type=\"file\"', "visual portfolio page must not return to an exposed long-form file input")

requireText(profile, 'context=\"profile_image\"', "profile media must use Quick Import")
requireText(passport, "Choose CV", "Creative Passport must expose reusable document selection")
requireText(application, 'context=\"application_material\"', "application preparation must expose requirement-aware media import")
requireText(library, "KLEIO Media Library", "artists must have a private reusable media surface")
requireText(sidebar, 'href: \"/artist-dashboard/media/\"', "the private media library must be reachable from artist navigation")

requireText(migration, "artist_media_usages", "database must record explicit destination usages")
requireText(migration, "enable row level security", "media usage associations must enforce RLS")
requireText(migration, "artist_media_usages_manage_own", "media usage associations must be owner scoped")
requireText(migration, "existing_kleio_media", "source constraints must support existing KLEIO media reuse")
forbidText(migration, "disable row level security", "universal media migration must not weaken RLS")

for (const file of [architecture, googleCapabilities, quick, signup, portfolio, profile, passport, application, library, sidebar, migration]) {
  forbidText(file, "AIzaSy", "Google API keys must not be committed")
  forbidText(file, "GOCSPX-", "Google client secrets must not be committed")
}

console.log("Universal Media Import audit passed: shared contexts and adapters, graceful Google capability gates, visual-first portfolio creation, private library reuse, separate Drive consent, explicit destination usage, profile and Passport Quick Import, application media support, and owner-scoped RLS are present.")
