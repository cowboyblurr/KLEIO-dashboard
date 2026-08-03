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

const migration = read("supabase/migrations/20260802010000_instagram_import.sql")
const oauthMigration = read("supabase/migrations/20260802070000_instagram_oauth_state_lifecycle.sql")
const betaMigration = read("supabase/migrations/20260803133000_beta_import_source_availability.sql")
const gateway = read("supabase/functions/instagram-import/index.ts")
const coreWrapper = read("supabase/functions/instagram-import-core/index.ts")
const client = read("lib/kleio-instagram-import.ts")
const component = read("components/kleio/instagram-import-assist.tsx")
const galleryUi = read("components/kleio/instagram-import-gallery-ui.tsx")
const insights = read("components/kleio/instagram-practice-insights.ts")
const page = read("components/kleio/artist-import-studio-page.tsx")
const hub = read("components/kleio/import-source-hub.tsx")
const completionRelay = read("public/instagram-complete.html")

for (const table of ["artist_instagram_oauth_states", "artist_instagram_connections", "artist_instagram_import_drafts", "artist_instagram_import_events"]) {
  requireText(migration, new RegExp(`create table if not exists public\\.${table}`), `Missing retained future table ${table}.`)
  requireText(migration, new RegExp(`alter table public\\.${table} enable row level security`), `RLS missing for retained future table ${table}.`)
}
requireText(migration, /revoke all on table public\.artist_instagram_connections from anon, authenticated/, "Instagram tokens must remain server-only.")
requireText(migration, /private\.enforce_instagram_import_rights/, "Future Instagram image rights must remain database-enforced.")
requireText(migration, /rights_confirmed_at/, "Future Instagram import must still record rights confirmation.")
requireText(oauthMigration, /claim_instagram_oauth_state/, "Reviewed OAuth state lifecycle architecture must remain available for a future re-enable.")
forbidText(migration, /disable row level security/i, "The retained Instagram architecture must not weaken RLS.")

requireText(gateway, /instagram_import_beta_disabled/, "The public Instagram gateway must fail closed during the initial beta.")
requireText(gateway, /status: "coming_soon"/, "The disabled gateway must identify the capability as coming soon.")
requireText(gateway, /status: 403/, "The disabled gateway must not return a false successful OAuth response.")
requireText(gateway, /GET, POST, OPTIONS/, "The disabled gateway must block both callback and action methods consistently.")
forbidText(gateway, /META_INSTAGRAM_APP_ID|META_INSTAGRAM_APP_SECRET|TOKEN_ENCRYPTION/, "The disabled gateway must not load provider credentials.")
forbidText(gateway, /api\.instagram\.com|graph\.instagram\.com/, "The disabled gateway must not contact Instagram.")
forbidText(gateway, /redirectToCompletion|claim_instagram_oauth_state|proxyToCore/, "The disabled gateway must not initiate or complete OAuth.")

requireText(coreWrapper, /raw\.githubusercontent\.com\/cowboyblurr\/KLEIO-dashboard\/[a-f0-9]{40}\//, "The retained future core must pin immutable reviewed source.")
forbidText(coreWrapper, /raw\.githubusercontent\.com\/cowboyblurr\/KLEIO-dashboard\/(main|master|fix\/|feature\/)/, "The retained core must not import mutable branch source.")
requireText(betaMigration, /'instagram_image', false/, "Database availability must reject new Instagram source records.")
requireText(betaMigration, /enforce_beta_import_source_availability/, "Inactive Instagram records must be blocked below the UI and gateway.")

requireText(hub, /Instagram/, "The Import Studio may communicate Instagram as a future capability.")
requireText(hub, /Coming soon/, "Instagram must be labeled Coming soon.")
forbidText(hub, /Connect Instagram|Authorize Instagram|Continue with Instagram/, "Coming-soon Instagram content must not be interactive.")
forbidText(page, /InstagramImportAssist/, "Instagram import must not be mounted in the initial artist beta.")

requireText(client, /loadInstagramPreparedImports/, "Future client architecture must remain isolated for later review.")
requireText(component, /KLEIO cannot post, message, comment, or modify Instagram/, "Future UI must retain the read-only boundary if re-enabled.")
requireText(galleryUi, /role="dialog"/, "Future Instagram preview must retain accessible dialog semantics.")
requireText(insights, /Artist confirmation is required/, "Future practice insights must remain artist-confirmed suggestions.")
requireText(completionRelay, /window\.opener/, "The reviewed completion relay may remain available but must be unreachable while the gateway is disabled.")

for (const content of [gateway, coreWrapper, client, component, galleryUi, insights, page, hub]) {
  forbidText(content, /META_INSTAGRAM_APP_SECRET\s*=\s*["'][^"']+|GOCSPX-|AIzaSy/, "A provider secret appears committed.")
}

console.log("Instagram import audit passed: the initial artist beta exposes no Instagram OAuth or import action, the gateway fails closed without loading provider credentials, database insertion is disabled, the source is represented only as Coming soon, and the previously reviewed future architecture remains isolated for a deliberate re-enable.")
