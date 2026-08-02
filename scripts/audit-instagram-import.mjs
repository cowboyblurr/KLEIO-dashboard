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
const gateway = read("supabase/functions/instagram-import/index.ts")
const coreWrapper = read("supabase/functions/instagram-import-core/index.ts")
const client = read("lib/kleio-instagram-import.ts")
const component = read("components/kleio/instagram-import-assist.tsx")
const galleryUi = read("components/kleio/instagram-import-gallery-ui.tsx")
const insights = read("components/kleio/instagram-practice-insights.ts")
const page = read("components/kleio/artist-import-studio-page.tsx")
const completionRelay = read("public/instagram-complete.html")

for (const table of ["artist_instagram_oauth_states", "artist_instagram_connections", "artist_instagram_import_drafts", "artist_instagram_import_events"]) {
  requireText(migration, new RegExp(`create table if not exists public\\.${table}`), `Missing ${table}.`)
  requireText(migration, new RegExp(`alter table public\\.${table} enable row level security`), `RLS missing for ${table}.`)
}
requireText(migration, /revoke all on table public\.artist_instagram_connections from anon, authenticated/, "Instagram tokens must be server-only.")
requireText(migration, /instagram_image/, "Instagram media must use a distinct source type.")
requireText(migration, /private\.enforce_instagram_import_rights/, "Instagram image rights must be database-enforced.")
requireText(migration, /rights_confirmed_at/, "Instagram import must record rights confirmation.")
requireText(oauthMigration, /processing_at/, "OAuth callbacks must use an atomic processing claim.")
requireText(oauthMigration, /15 minutes/, "OAuth state lifetime must be explicit and consistent.")
requireText(oauthMigration, /claim_instagram_oauth_state/, "Database-clock OAuth state classification is missing.")
requireText(oauthMigration, /security definer/, "OAuth state claim must execute with controlled service privileges.")
requireText(oauthMigration, /grant execute on function public\.claim_instagram_oauth_state\(text\) to service_role/, "OAuth state claim must be service-role-only.")
forbidText(migration, /security definer/i, "The rights trigger must not bypass access controls.")

requireText(gateway, /instagram_business_basic/, "The minimum Instagram permission is missing.")
requireText(gateway, /https:\/\/api\.instagram\.com\/oauth\/access_token/, "Instagram code exchange is missing.")
requireText(gateway, /https:\/\/trekynurdgxgtaaqqtyq\.supabase\.co\/functions\/v1\/instagram-import/, "The exact production callback URI is missing.")
requireText(gateway, /https:\/\/trekynurdgxgtaaqqtyq\.supabase\.co\/functions\/v1\/instagram-import-core/, "The production gateway must proxy authenticated actions to the isolated core.")
requireText(gateway, /new FormData\(\)/, "Instagram code exchange must use form-data.")
requireText(gateway, /instagram_code_exchange_redirect_mismatch/, "OAuth exchange errors must be normalized safely.")
requireText(gateway, /admin\.rpc\("claim_instagram_oauth_state"/, "OAuth callback must atomically claim state using the database clock.")
requireText(gateway, /finishState/, "OAuth state must be deliberately finalized.")
requireText(gateway, /AES-GCM/, "Per-artist token encryption is missing.")
requireText(gateway, /redirectToCompletion/, "OAuth callback must use the minimal completion relay.")
requireText(gateway, /\/instagram-complete\.html/, "OAuth callback must target the static completion relay.")
requireText(gateway, /status:\s*303/, "OAuth completion must use a redirect response.")
for (const header of ["Location", "Cache-Control", "Referrer-Policy", "X-Content-Type-Options"]) {
  requireText(gateway, new RegExp(`['\"]?${header}['\"]?`), `OAuth redirect is missing the ${header} header.`)
}
requireText(gateway, /proxyToCore/, "Authenticated Instagram actions must be proxied through the gateway.")
requireText(gateway, /redirect:\s*["']manual["']/, "Gateway proxy redirects must remain controlled.")
forbidText(gateway, /instagram_business_manage_messages|instagram_business_manage_comments|instagram_content_publish/, "The import flow must not request messaging, comment, or publishing permissions.")
forbidText(gateway, /META_INSTAGRAM_APP_SECRET\s*=\s*["'][^"']+/, "A Meta secret appears committed.")

requireText(coreWrapper, /raw\.githubusercontent\.com\/cowboyblurr\/KLEIO-dashboard\/[a-f0-9]{40}\/supabase\/functions\/instagram-import\/index\.ts/, "The deployed Instagram core must pin an immutable reviewed source commit.")
forbidText(coreWrapper, /raw\.githubusercontent\.com\/cowboyblurr\/KLEIO-dashboard\/(main|master|fix\/|feature\/)/, "The Instagram core must not import mutable branch source.")

requireText(completionRelay, /window\.opener/, "The completion relay must locate the original Import Studio window.")
requireText(completionRelay, /dispatchEvent|postMessage/, "The completion relay must notify the original Import Studio window.")
requireText(completionRelay, /window\.close/, "The completion relay must attempt to close the authorization popup.")
requireText(completionRelay, /original KLEIO window/, "The completion relay fallback copy is missing.")
requireText(completionRelay, /https:\/\/trekynurdgxgtaaqqtyq\.supabase\.co/, "The completion relay must preserve the verified callback origin.")

requireText(client, /loadInstagramPreparedImports/, "Prepared Instagram imports must be restorable.")
requireText(client, /saveInstagramPreparedDrafts/, "Instagram edits must be saveable.")
requireText(client, /return fallback/, "Unknown internal Instagram errors must use a safe artist-facing fallback.")
requireText(component, /Connect Instagram/, "Instagram connection control is missing.")
requireText(component, /KLEIO cannot post, message, comment, or modify Instagram/, "The read-only boundary must be explained.")
requireText(component, /rightsConfirmed/, "Artist rights confirmation is missing.")
requireText(component, /Continue with .* selected work/, "The selection action must communicate progression rather than internal preparation mechanics.")
requireText(component, /Save works to KLEIO/, "The import flow must finish with one artist-facing batch save action.")
requireText(component, /Include in portfolio/, "Portfolio inclusion must be an explicit choice on the same private record.")
requireText(component, /not verified visual judgments/, "Practice insights must disclose their source and limitations.")
requireText(component, /Apply selected insights to my Creative Passport/, "Creative Passport updates must require an explicit artist choice.")
requireText(component, /saveInstagramPreparedDrafts/, "Private artwork edits must retain autosave and batch persistence.")
requireText(component, /Disconnect/, "Disconnect control is missing.")
requireText(component, /oauthStartRef/, "Duplicate Instagram connection attempts must be synchronously blocked.")
requireText(component, /instagram_oauth_consumed/, "Replayed Instagram callbacks need a clear artist-facing message.")
forbidText(component, /Approve artwork/, "Per-item approval copy must not recreate the redundant administrative workflow.")
requireText(galleryUi, /role="dialog"/, "The Instagram preview must remain an accessible dialog.")
requireText(galleryUi, /event\.key === "Escape"/, "The Instagram preview must support Escape-to-close.")
requireText(galleryUi, /focusableSelector/, "The Instagram preview must retain focus trapping.")
requireText(insights, /Instagram captions, dates, tags, and artwork details/, "Practice insights must disclose their source basis.")
requireText(insights, /Artist confirmation is required/, "Practice insights must remain artist-confirmed suggestions.")
requireText(page, /<InstagramImportAssist \/>/, "Instagram import is not exposed in the Import work page.")
forbidText(component, /Cloudflare|App Secret|access token|provider/i, "Infrastructure or credentials must not appear in artist-facing copy.")

console.log("Instagram import audit passed: official read-only login, protected gateway/core boundaries, one private source record, persistent selection, source-labeled practice suggestions, progressive artwork review, explicit portfolio inclusion, one batch save action, artist-controlled Passport updates, accessible preview, and disconnect controls.")
