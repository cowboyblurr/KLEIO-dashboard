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
const documentMigration = read("supabase/migrations/20260805133000_document_intelligence_beta.sql")
const availability = read("lib/kleio-import-source-availability.ts")
const gateway = read("supabase/functions/instagram-import/index.ts")
const core = read("supabase/functions/instagram-import-core/index.ts")
const futureCore = read("supabase/functions/instagram-import-core/future-core.ts")
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

for (const [surface, content] of [["gateway", gateway], ["core", core]]) {
  requireText(content, /instagram_import_beta_disabled/, `The public Instagram ${surface} must fail closed while connected-provider import is deferred.`)
  requireText(content, /status: "coming_soon"/, `The disabled Instagram ${surface} must identify the capability as unavailable for the active beta.`)
  requireText(content, /status: 403/, `The disabled Instagram ${surface} must not return a false successful OAuth response.`)
  requireText(content, /GET, POST, OPTIONS/, `The disabled Instagram ${surface} must block callback and action methods consistently.`)
  forbidText(content, /META_INSTAGRAM_APP_ID|META_INSTAGRAM_APP_SECRET|TOKEN_ENCRYPTION/, `The disabled Instagram ${surface} must not load provider credentials.`)
  forbidText(content, /api\.instagram\.com|graph\.instagram\.com/, `The disabled Instagram ${surface} must not contact Instagram.`)
  forbidText(content, /redirectToCompletion|claim_instagram_oauth_state|proxyToCore|raw\.githubusercontent\.com/, `The disabled Instagram ${surface} must not initiate, complete, or load OAuth code.`)
}

requireText(futureCore, /raw\.githubusercontent\.com\/cowboyblurr\/KLEIO-dashboard\/[a-f0-9]{40}\//, "The reviewed future Instagram core must pin immutable source.")
forbidText(futureCore, /raw\.githubusercontent\.com\/cowboyblurr\/KLEIO-dashboard\/(main|master|fix\/|feature\/)/, "The future Instagram core must not import mutable branch source.")
requireText(betaMigration, /'instagram_image', false/, "The retained baseline migration must reject new Instagram source records.")
requireText(betaMigration, /enforce_beta_import_source_availability/, "Inactive Instagram records must be blocked below the UI, gateway, and core.")
requireText(documentMigration, /when 'instagram_image' then 'Deferred/, "The retained beta migration must keep Instagram deferred.")
requireText(availability, /instagram_image:\s*false/, "The shared frontend availability gate must disable Instagram.")
requireText(availability, /device_image:\s*true/, "Direct image upload must remain available while Instagram is deferred.")
requireText(availability, /device_video:\s*true/, "Direct video upload must remain available while Instagram is deferred.")
requireText(availability, /device_audio:\s*true/, "Direct audio upload must remain available while Instagram is deferred.")

requireText(hub, /Instagram/, "The Import Studio may communicate Instagram as a future capability.")
requireText(hub, /Deferred connected sources/, "Connected sources must be grouped as deferred rather than competing with direct private upload.")
requireText(hub, /<strong[^>]*>Instagram<\/strong>[\s\S]*\{copy\.deferred\}/, "Instagram must be visibly labeled Deferred.")
requireText(hub, /Upload media or supporting files/, "The active beta path must be framed as broad private media/material upload, not PDF-only upload.")
forbidText(hub, /Connect Instagram|Authorize Instagram|Continue with Instagram/, "Deferred Instagram content must not be interactive.")
forbidText(page, /InstagramImportAssist/, "Instagram import must not be mounted while the connected provider is deferred.")

requireText(client, /loadInstagramPreparedImports/, "Future client architecture must remain isolated for later review.")
requireText(component, /KLEIO cannot post, message, comment, or modify Instagram/, "Future UI must retain the read-only boundary if re-enabled.")
requireText(galleryUi, /role="dialog"/, "Future Instagram preview must retain accessible dialog semantics.")
requireText(insights, /Artist confirmation is required/, "Future practice insights must remain artist-confirmed suggestions.")
requireText(completionRelay, /window\.opener/, "The reviewed completion relay may remain available but must be unreachable while both gateway and core are disabled.")

for (const content of [gateway, core, futureCore, client, component, galleryUi, insights, page, hub]) {
  forbidText(content, /META_INSTAGRAM_APP_SECRET\s*=\s*["'][^"']+|GOCSPX-|AIzaSy/, "A provider secret appears committed.")
}

console.log("Instagram import audit passed: direct private media upload remains active while Instagram OAuth/import stays deferred and non-interactive; gateway/core fail closed, database and shared availability gates block Instagram, and the reviewed future implementation remains isolated for deliberate re-enable.")
