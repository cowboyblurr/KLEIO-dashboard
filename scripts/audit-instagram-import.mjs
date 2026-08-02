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
const edge = read("supabase/functions/instagram-import/index.ts")
const client = read("lib/kleio-instagram-import.ts")
const component = read("components/kleio/instagram-import-assist.tsx")
const page = read("components/kleio/artist-import-studio-page.tsx")

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

requireText(edge, /instagram_business_basic/, "The minimum Instagram permission is missing.")
requireText(edge, /https:\/\/www\.instagram\.com\/oauth\/authorize/, "Instagram authorization endpoint is missing.")
requireText(edge, /https:\/\/api\.instagram\.com\/oauth\/access_token/, "Instagram code exchange is missing.")
requireText(edge, /https:\/\/trekynurdgxgtaaqqtyq\.supabase\.co\/functions\/v1\/instagram-import/, "The exact production Instagram callback URI must be fixed in source.")
requireText(edge, /ig_exchange_token/, "Long-lived token exchange is missing.")
requireText(edge, /ig_refresh_token/, "Long-lived token refresh is missing.")
requireText(edge, /AES-GCM/, "Per-artist token encryption is missing.")
requireText(edge, /state_hash/, "OAuth state hashing is missing.")
requireText(edge, /htmlResponse/, "OAuth callback must return explicit HTML response headers.")
requireText(edge, /new FormData\(\)/, "Instagram code exchange must use form-data.")
requireText(edge, /instagram_code_exchange_redirect_mismatch/, "OAuth exchange errors must be normalized safely.")
requireText(edge, /admin\.rpc\("claim_instagram_oauth_state"/, "OAuth callback must atomically claim state using the database clock.")
requireText(edge, /oauthFailureRetryable/, "OAuth state retry semantics must distinguish transient failures.")
requireText(edge, /finishOAuthState/, "OAuth state must be consumed only after deliberate completion.")
requireText(edge, /requireArtist\(req\)/, "Browser actions must validate the KLEIO artist session.")
requireText(edge, /request_origin_not_allowed/, "Browser actions must enforce allowed origins.")
requireText(edge, /isTrustedMediaHost/, "Instagram media downloads must be host-restricted.")
requireText(edge, /signatureMatches/, "Downloaded images must be signature-validated.")
requireText(edge, /artist_instagram_import_drafts/, "Resumable Instagram drafts are missing.")
requireText(edge, /action === "save_drafts"/, "Instagram edits must autosave through a server action.")
requireText(edge, /action === "disconnect"/, "Artists must be able to disconnect Instagram.")
forbidText(edge, /instagram_business_manage_messages|instagram_business_manage_comments|instagram_content_publish/, "The import flow must not request messaging, comment, or publishing permissions.")
forbidText(edge, /META_INSTAGRAM_APP_SECRET\s*=\s*["'][^"']+/, "A Meta secret appears committed.")
forbidText(edge, /raw\.githubusercontent\.com|queryBuilderPrototype|\.catch\(\(\) => undefined\)/, "Production Instagram source must not depend on remote imports or runtime query-builder shims.")

requireText(client, /loadInstagramPreparedImports/, "Prepared Instagram imports must be restorable.")
requireText(client, /saveInstagramPreparedDrafts/, "Instagram edits must be saveable.")
requireText(component, /Connect Instagram/, "Instagram connection control is missing.")
requireText(component, /KLEIO cannot post, message, or comment/, "The read-only boundary must be explained.")
requireText(component, /rightsConfirmed/, "Artist rights confirmation is missing.")
requireText(component, /Edits autosave privately/, "Autosave must be explained.")
requireText(component, /Approve artwork/, "Explicit artist approval is missing.")
requireText(component, /Disconnect/, "Disconnect control is missing.")
requireText(component, /oauthStartRef/, "Duplicate Instagram connection attempts must be synchronously blocked.")
requireText(component, /instagram_oauth_consumed/, "Replayed Instagram callbacks need a clear artist-facing message.")
requireText(client, /return fallback/, "Unknown internal Instagram errors must use a safe artist-facing fallback.")
requireText(page, /<InstagramImportAssist \/>/, "Instagram import is not exposed in the Import work page.")
forbidText(component, /Cloudflare|App Secret|access token|provider/i, "Infrastructure or credentials must not appear in artist-facing copy.")

console.log("Instagram import audit passed: official read-only login, minimum permission, database-clock one-time OAuth state, explicit HTML callback, encrypted server-only tokens, refresh handling, trusted-host media copying, signature checks, database-enforced rights, resumable private drafts, autosave, explicit approval, and disconnect controls.")
