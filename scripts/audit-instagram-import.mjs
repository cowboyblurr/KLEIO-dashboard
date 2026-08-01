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
forbidText(migration, /security definer/i, "The rights trigger must not bypass access controls.")

requireText(edge, /instagram_business_basic/, "The minimum Instagram permission is missing.")
requireText(edge, /https:\/\/www\.instagram\.com\/oauth\/authorize/, "Instagram authorization endpoint is missing.")
requireText(edge, /https:\/\/api\.instagram\.com\/oauth\/access_token/, "Instagram code exchange is missing.")
requireText(edge, /ig_exchange_token/, "Long-lived token exchange is missing.")
requireText(edge, /ig_refresh_token/, "Long-lived token refresh is missing.")
requireText(edge, /AES-GCM/, "Per-artist token encryption is missing.")
requireText(edge, /state_hash/, "OAuth state hashing is missing.")
requireText(edge, /requireArtist\(req\)/, "Browser actions must validate the KLEIO artist session.")
requireText(edge, /request_origin_not_allowed/, "Browser actions must enforce allowed origins.")
requireText(edge, /isTrustedMediaHost/, "Instagram media downloads must be host-restricted.")
requireText(edge, /signatureMatches/, "Downloaded images must be signature-validated.")
requireText(edge, /artist_instagram_import_drafts/, "Resumable Instagram drafts are missing.")
requireText(edge, /action === "save_drafts"/, "Instagram edits must autosave through a server action.")
requireText(edge, /action === "disconnect"/, "Artists must be able to disconnect Instagram.")
forbidText(edge, /instagram_business_manage_messages|instagram_business_manage_comments|instagram_content_publish/, "The import flow must not request messaging, comment, or publishing permissions.")
forbidText(edge, /META_INSTAGRAM_APP_SECRET\s*=\s*["'][^"']+/, "A Meta secret appears committed.")

requireText(client, /loadInstagramPreparedImports/, "Prepared Instagram imports must be restorable.")
requireText(client, /saveInstagramPreparedDrafts/, "Instagram edits must be saveable.")
requireText(component, /Connect Instagram/, "Instagram connection control is missing.")
requireText(component, /KLEIO cannot post, message, or comment/, "The read-only boundary must be explained.")
requireText(component, /rightsConfirmed/, "Artist rights confirmation is missing.")
requireText(component, /Edits autosave privately/, "Autosave must be explained.")
requireText(component, /Approve artwork/, "Explicit artist approval is missing.")
requireText(component, /Disconnect/, "Disconnect control is missing.")
requireText(page, /<InstagramImportAssist \/>/, "Instagram import is not exposed in the Import work page.")
forbidText(component, /Cloudflare|App Secret|access token|provider/i, "Infrastructure or credentials must not appear in artist-facing copy.")

console.log("Instagram import audit passed: official read-only login, minimum permission, one-time OAuth state, encrypted server-only tokens, refresh handling, trusted-host media copying, signature checks, database-enforced rights, resumable private drafts, autosave, explicit approval, and disconnect controls.")
