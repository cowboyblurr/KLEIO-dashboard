import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8")
const requireText = (file, text, message) => { if (!read(file).includes(text)) throw new Error(`${message} (${file})`) }
const forbidText = (file, text, message) => { if (read(file).includes(text)) throw new Error(`${message} (${file})`) }

const studio = "components/kleio/artist-import-studio.tsx"
const importLib = "lib/kleio-artwork-import.ts"
const signup = "components/kleio/signup/lightweight-artist-signup.tsx"
const signupLib = "lib/kleio-lightweight-artist-signup.ts"
const googleCapabilities = "lib/kleio-google-capabilities.ts"
const callback = "components/kleio/auth/auth-callback-client.tsx"
const sidebar = "components/kleio/artist-sidebar.tsx"
const migration = "supabase/migrations/20260801160000_artist_import_studio.sql"

requireText(signup, "Continue with Google", "artist signup must expose Google authentication when configured")
requireText(signup, "isGoogleAuthenticationConfigured", "artist signup must not enable an unconfigured Google provider")
requireText(googleCapabilities, "Drive access is requested separately", "signup must explain that Drive permission is separate")
requireText(googleCapabilities, "NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "Google authentication must use an explicit deployment capability gate")
requireText(signupLib, 'provider: "google"', "Google login must use the configured Supabase provider")
requireText(signupLib, "signInWithOAuth", "Google login must use Supabase OAuth")
requireText(signupLib, "assertKleioPasswordIsSafe", "email signup must enforce KLEIO's breached-password safeguard")
forbidText(signupLib, "drive.file", "Google authentication must not request Drive access")
requireText(callback, "ensureLightweightArtistWorkspace", "OAuth callbacks must create the artist workspace safely")
requireText(callback, '"/artist-dashboard/import/"', "new artist authentication must open the import onboarding route")
requireText(sidebar, 'href: "/artist-dashboard/import/"', "existing artists must be able to reopen Import Studio from workspace navigation")

requireText(studio, "<dialog", "Import Studio must use native modal dialog semantics")
requireText(studio, 'aria-labelledby="artwork-import-title"', "Import Studio must expose an accessible name")
requireText(studio, "drive.file", "Drive selection must use the narrow file-specific scope")
requireText(studio, "MULTISELECT_ENABLED", "Drive Picker must support intentional multiple selection")
requireText(studio, "Approve and add to Creative Passport", "artwork approval must be explicit")
requireText(studio, "saveArtworkImportDraftLocally", "import changes must be recoverable locally")
requireText(studio, "saveArtworkImportDraft", "import changes must autosave remotely")
requireText(studio, "aria-current", "the native-button artwork gallery must expose its current selection")
requireText(studio, "h-dvh", "mobile Import Studio must use the full viewport")

requireText(importLib, "extractEmbeddedMetadata", "image metadata extraction must be implemented")
requireText(importLib, "filenameSuggestions", "filename suggestions must remain deterministic and reviewable")
requireText(importLib, "inspection.palette", "image-assisted format and palette guidance must be implemented")
requireText(importLib, "Embedded keywords combined with image-format suggestions", "mixed extracted and inferred values must remain labeled as suggestions")
requireText(importLib, "field_provenance", "approved fields must retain provenance")
requireText(importLib, "import_source_id", "approved portfolio records must retain their source")
requireText(importLib, "maybeSingle", "approval must include an idempotent existing-record check")
requireText(importLib, "clearArtworkImportDraft", "artists must be able to delete import progress")

requireText(migration, "device_image", "database constraints must accept device artwork sources")
requireText(migration, "google_drive_image", "database constraints must accept Drive artwork sources")
requireText(migration, "artist_import_sources_image_mime_check", "the database must reject non-image MIME types for artwork import sources")
requireText(migration, "portfolio_works_import_source_unique", "one source must not create duplicate portfolio records")
requireText(migration, "approval_status = 'approved'", "portfolio imports must be approval-only")
forbidText(migration, "artist_import_sources_owner_provider_idx", "the beta migration must not add an unused provider lookup index")
forbidText(migration, "portfolio_works_owner_approval_idx", "the beta migration must not add an unused approval lookup index")
forbidText(migration, "disable row level security", "the import migration must not weaken RLS")

for (const file of [studio, importLib, signup, signupLib, googleCapabilities, callback, sidebar, migration]) {
  forbidText(file, "AIzaSy", "Google API keys must not be committed")
  forbidText(file, "GOCSPX-", "Google client secrets must not be committed")
}

console.log("Artist Import Studio audit passed: capability-gated Google auth, separate Drive consent, breached-password checks, owner-scoped private files, server-side artwork MIME integrity, deterministic metadata suggestions, explicit artist approval, autosave recovery, idempotent portfolio creation, workspace access, and accessibility safeguards are present.")
