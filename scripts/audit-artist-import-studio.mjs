import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8")
const requireText = (file, text, message) => { if (!read(file).includes(text)) throw new Error(`${message} (${file})`) }
const forbidText = (file, text, message) => { if (read(file).includes(text)) throw new Error(`${message} (${file})`) }

const studio = "components/kleio/artist-import-studio.tsx"
const page = "components/kleio/artist-import-studio-page.tsx"
const hub = "components/kleio/import-source-hub.tsx"
const mediaLibrary = "components/kleio/artist-media-library.tsx"
const quick = "components/kleio/media-import/quick-media-import.tsx"
const availability = "lib/kleio-import-source-availability.ts"
const receipt = "lib/kleio-import-receipt.ts"
const helper = "lib/kleio-google-drive-beta-import.ts"
const migration = "supabase/migrations/20260803133000_beta_import_source_availability.sql"
const instagram = "supabase/functions/instagram-import/index.ts"
const websiteGateway = "supabase/functions/analyze-artist-website/index.ts"

requireText(studio, "<dialog", "Import Studio must use native modal dialog semantics")
requireText(studio, 'aria-labelledby="drive-import-title"', "Import Studio must expose an accessible name")
requireText(studio, "drive.file", "Drive selection must use the narrow file-specific scope")
requireText(studio, "MULTISELECT_ENABLED", "Drive Picker must support intentional multiple selection")
requireText(studio, "Confirm private import", "private Media Library confirmation must be explicit")
requireText(studio, "View Media Library", "completed import must provide a Media Library handoff")
requireText(studio, 'href="/artist-dashboard/media/"', "Media Library handoff must use the canonical route")
requireText(studio, "Import more", "completed import must allow another import without redirecting")
requireText(studio, 'role="status"', "completed import must announce success accessibly")
requireText(studio, "duplicateCount", "completed import must distinguish duplicate selections")
requireText(studio, "failedCount", "completed import must report partial failures")
requireText(studio, "saveMediaImportReceipt", "completed import must persist a receipt for direct Media Library navigation")
requireText(studio, "saveArtworkImportDraftLocally", "import progress must remain locally recoverable")
requireText(studio, "saveArtworkImportDraft", "import progress must autosave remotely")
requireText(studio, "h-dvh", "mobile Import Studio must use the full viewport")
forbidText(studio, 'type="file"', "device file inputs must not be exposed during the initial beta")
forbidText(studio, 'sourceType: "device_image"', "device upload must not be activatable through stale code")

requireText(hub, "Google Drive is the active import source", "source hub must make the active beta source unambiguous")
requireText(hub, "Instagram", "Instagram must remain visible only as future capability context")
requireText(hub, "Pinterest", "Pinterest must remain visible only as future capability context")
requireText(hub, "Coming soon", "inactive connected providers must be labeled honestly")
forbidText(hub, "Connect Instagram", "Instagram must not expose an active connection control")
forbidText(hub, "Connect Pinterest", "Pinterest must not expose an active connection control")
forbidText(hub, 'href="#website-import"', "Website Import must not compete with Google Drive in the artist beta")

requireText(page, "<ArtistImportStudio />", "Google Drive Import Studio must remain mounted")
forbidText(page, "WebsiteImportAssist", "Website Import must be feature-gated out of the artist beta UI")
forbidText(page, "InstagramImportAssist", "Instagram Import must be feature-gated out of the artist beta UI")
forbidText(page, "PinterestImportAssist", "Pinterest Import must be feature-gated out of the artist beta UI")

requireText(quick, "New beta import", "Quick Media must separate new imports from internal reuse")
requireText(quick, "Google Drive", "Quick Media must use Google Drive as its only new import source")
requireText(quick, "Reuse existing private media", "existing KLEIO media may remain reusable internally")
forbidText(quick, 'type="file"', "Quick Media must not expose device upload during the initial beta")
forbidText(quick, "Instagram Professional Account", "Quick Media must not surface Instagram as an interactive provider")

requireText(mediaLibrary, "readMediaImportReceipt", "Media Library must restore the completed import result")
requireText(mediaLibrary, "kleio:media-import-completed", "Media Library must refresh when an import completes in the same session")
requireText(mediaLibrary, "Import from Google Drive", "Media Library must direct new imports to the only active source")
forbidText(mediaLibrary, "QuickMediaImport", "Media Library must not expose direct device upload during the initial beta")

requireText(availability, "google_drive_image: true", "frontend availability must enable Google Drive images")
requireText(availability, "device_image: false", "frontend availability must disable device images")
requireText(availability, "instagram_image: false", "frontend availability must disable Instagram")
requireText(availability, "website: false", "frontend availability must disable Website Import")
requireText(receipt, "localStorage", "Media Library import receipts must survive navigation")
requireText(helper, "betaWasDuplicate", "Google Drive helper must distinguish existing files from new records")
requireText(helper, "artist_confirmed_private_library_import", "private import confirmation must be recorded without public approval")

requireText(migration, "kleio_import_source_availability", "database must retain the shared beta availability source of truth")
requireText(migration, "enforce_beta_import_source_availability", "database must block unavailable source insertion")
requireText(migration, "google_drive_image', true", "database must enable Google Drive image import")
requireText(migration, "device_image', false", "database must disable device image import")
requireText(migration, "instagram_image', false", "database must disable Instagram import")
requireText(migration, "website', false", "database must disable Website Import during the initial beta")
requireText(migration, "security invoker", "availability enforcement must not bypass RLS")
forbidText(migration, "disable row level security", "availability migration must not weaken RLS")

requireText(instagram, "instagram_import_beta_disabled", "Instagram OAuth gateway must be disabled during the initial beta")
forbidText(instagram, "META_INSTAGRAM_APP_SECRET", "disabled Instagram gateway must not load provider secrets")
requireText(websiteGateway, "WEBSITE_IMPORT_BETA_ENABLED", "Website Import must require an explicit server-side feature gate")
requireText(websiteGateway, "website_import_beta_disabled", "Website Import must fail closed during the initial beta")

for (const file of [studio, page, hub, mediaLibrary, quick, availability, receipt, helper, migration, instagram, websiteGateway]) {
  forbidText(file, "AIzaSy", "Google API keys must not be committed")
  forbidText(file, "GOCSPX-", "Google client secrets must not be committed")
}

console.log("Artist beta import audit passed: Google Drive is the only active new-import source, inactive providers are feature-gated in UI and backend, private Media Library confirmation is explicit, duplicate and partial results are truthful, completed imports persist across navigation, internal library reuse remains separate, and no provider secrets are exposed.")
