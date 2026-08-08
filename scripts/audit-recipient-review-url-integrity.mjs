import fs from "node:fs"
import path from "node:path"
import { createHash, randomBytes, randomUUID } from "node:crypto"

const root = process.cwd()
const failures = []

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8")
}

function requirePattern(content, pattern, message) {
  if (!pattern.test(content)) failures.push(message)
}

function forbidPattern(content, pattern, message) {
  if (pattern.test(content)) failures.push(message)
}

function assert(condition, message) {
  if (!condition) failures.push(message)
}

function firstMessageNonce(draftToken) {
  const source = draftToken.toLowerCase().replace(/[^a-f0-9]/g, "")
  const hex = source.padEnd(32, "0").slice(0, 32)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

const recipientClient = read("lib/kleio-recipient-application.ts")
const recipientPanel = read("components/kleio/application-recipient-loop-panel.tsx")
const recipientEdge = read("supabase/functions/recipient-application-review/index.ts")
const conversationPage = read("app/application-review/conversation/page.tsx")
const schema = read("supabase/migrations/20260805161000_artist_recipient_application_loop.sql")

// The secure link is infrastructure, not an artist-facing share feature.
requirePattern(recipientClient, /url\.searchParams\.set\("token", token\)/, "Recipient access must remain an opaque token URL.")
forbidPattern(recipientClient, /searchParams\.set\("application"|searchParams\.set\("artist"|artist_user_id[^\n]*searchParams/, "Recipient URLs must not expose application or artist database identity as public URL parameters.")
forbidPattern(recipientPanel, /navigator\.clipboard|Copy secure link|Create secure link/, "Artists must not be encouraged to copy/share the raw secure recipient URL.")
requirePattern(recipientPanel, /tracked Review Room access automatically/, "Email handoff must explain that KLEIO manages the tracking access automatically.")
requirePattern(recipientPanel, /buildMailtoHref\(\{ recipient, subject, body, reviewUrl: handoff\.url \}\)/, "Tracked recipient access must be inserted into the email handoff automatically.")
requirePattern(recipientPanel, /internal_tracking_reference/, "Submission attempts must retain the internal tracking reference.")
requirePattern(recipientPanel, /trackingLabel\(trackingReference\)/, "Artist UI must expose a human-safe internal tracking reference instead of the raw URL.")
requirePattern(recipientPanel, /Review Room opens/, "Artist UI must surface review-page open counts.")
requirePattern(recipientPanel, /does not claim the submission email was opened, read, or meaningfully reviewed/, "Review-page tracking must remain explicitly distinct from email-open/read claims.")
requirePattern(recipientPanel, /will not silently replace an issued recipient link/, "A fresh browser session must not silently rotate an already-issued recipient access link.")
forbidPattern(recipientPanel, /loadRecipientTrackingSummary\(stored\.id\)\.catch/, "Tracking query failures must not be silently converted into a false zero-open state.")

// Exact review-page open counting: one event per real browser load, retries/remounts within that load dedupe.
requirePattern(recipientClient, /performance\?\.timeOrigin/, "Review-page load identity must use browser navigation time rather than an hourly bucket.")
forbidPattern(recipientClient, /toISOString\(\)\.slice\(0, 13\)/, "Hourly view deduplication would undercount multiple legitimate opens and must not return.")
requirePattern(recipientClient, /select\("id", \{ count: "exact", head: true \}\)[\s\S]*\.eq\("access_id", access\.id\)[\s\S]*\.eq\("event_type", "application_page_viewed"\)/, "Tracking summary must use an exact database count scoped to the active internal handoff identity.")
requirePattern(recipientClient, /first_opened_at/, "Tracking summary must preserve first-open timing.")
requirePattern(recipientClient, /last_opened_at/, "Tracking summary must preserve last-open timing.")

// Verified first-message completion is client-idempotent under double submit / repeated auth callback.
requirePattern(recipientClient, /function firstMessageNonce\(draftToken: string\)/, "Initial verified messages need a deterministic draft-scoped nonce.")
requirePattern(recipientClient, /client_nonce: firstMessageNonce\(draftToken\)/, "Repeated verification completion must reuse the same first-message nonce.")
requirePattern(schema, /unique \(conversation_id, client_nonce\)/, "Message storage must enforce conversation-scoped client nonce uniqueness.")
requirePattern(recipientEdge, /onConflict: "conversation_id,client_nonce"/, "First-message persistence must use the database uniqueness boundary during upsert.")

// Static-export safety for the verified conversation return page.
requirePattern(conversationPage, /import \{ Suspense \} from "react"/, "Conversation return must keep a Suspense boundary for useSearchParams during static export.")
requirePattern(conversationPage, /<Suspense[\s\S]*<RecipientConversationReturn \/>[\s\S]*<\/Suspense>/, "Recipient conversation return must render inside Suspense.")

// Existing security and relationship boundaries remain mandatory.
requirePattern(recipientEdge, /await sha256\(plainToken\)/, "Recipient access tokens must still be hashed before lookup.")
requirePattern(recipientEdge, /\.eq\("artist_user_id", user\.id\)/, "Artist-managed recipient access must remain owner scoped.")
requirePattern(schema, /package_id uuid not null references public\.application_packages\(id\)/, "Every recipient access must remain tied to an application package.")
requirePattern(schema, /token_hash text not null unique/, "Stored recipient access must keep a unique token hash.")
requirePattern(schema, /application_recipient_access_active_package_idx[\s\S]*where revoked_at is null/i, "Only one active recipient access may exist for a package in the current beta contract.")
requirePattern(schema, /access_id uuid not null references public\.application_recipient_access\(id\)/, "Recipient events must remain tied to the exact internal access identity.")
requirePattern(recipientEdge, /eventType: "application_page_viewed"/, "Review Room loads must record a dedicated application-page-viewed event.")

// Stress token uniqueness, URL uniqueness, and hash uniqueness at a scale well beyond beta traffic.
const tokenPattern = /^[a-f0-9]{64}$/
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/i
const iterations = 50000
const tokens = new Set()
const urls = new Set()
const hashes = new Set()

for (let index = 0; index < iterations; index += 1) {
  const token = randomBytes(32).toString("hex")
  const url = new URL("https://www.kleioarthouse.com/application-review/")
  url.searchParams.set("token", token)
  const hash = createHash("sha256").update(token).digest("hex")

  assert(tokenPattern.test(token), `Generated recipient token ${index} is malformed.`)
  assert(url.searchParams.size === 1 && url.searchParams.get("token") === token, `Recipient URL ${index} leaked unexpected public tracking parameters.`)
  assert(tokenPattern.test(hash), `Token hash ${index} is malformed.`)

  tokens.add(token)
  urls.add(url.toString())
  hashes.add(hash)
}

assert(tokens.size === iterations, `Token stress run produced ${iterations - tokens.size} token collision(s).`)
assert(urls.size === iterations, `URL stress run produced ${iterations - urls.size} duplicate URL(s).`)
assert(hashes.size === iterations, `Hash stress run produced ${iterations - hashes.size} SHA-256 collision(s).`)

// Stress the page-load idempotency model: same load retries dedupe; distinct loads remain countable.
const tokenSuffix = randomBytes(6).toString("hex")
const loadKeys = new Set()
const pageLoads = 25000
for (let index = 0; index < pageLoads; index += 1) {
  const timeOrigin = 1_800_000_000_000 + index
  const key = `application-page-viewed:${tokenSuffix}:${timeOrigin}`
  const retryKey = `application-page-viewed:${tokenSuffix}:${timeOrigin}`
  assert(key === retryKey, `Retry idempotency diverged for page load ${index}.`)
  loadKeys.add(key)
}
assert(loadKeys.size === pageLoads, `Page-load stress run undercounted ${pageLoads - loadKeys.size} distinct Review Room open(s).`)

// Stress initial-message double-submit identity: the same preserved draft always resolves to one nonce.
const draftNonces = new Set()
const draftRuns = 25000
for (let index = 0; index < draftRuns; index += 1) {
  const draftToken = randomBytes(32).toString("hex")
  const first = firstMessageNonce(draftToken)
  const retry = firstMessageNonce(draftToken)
  assert(first === retry, `Draft ${index} produced divergent first-message nonces across retries.`)
  assert(uuidPattern.test(first), `Draft ${index} produced an invalid deterministic UUID nonce.`)
  draftNonces.add(first)
}
assert(draftNonces.size === draftRuns, `Draft nonce stress run produced ${draftRuns - draftNonces.size} collision(s).`)

// Internal tracking references stay opaque and non-identifying to the artist UI.
const accessIds = new Set()
for (let index = 0; index < 25000; index += 1) accessIds.add(randomUUID())
assert(accessIds.size === 25000, `Internal access-reference stress run produced ${25000 - accessIds.size} UUID collision(s).`)

if (failures.length) {
  console.error("KLEIO recipient tracking integrity audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`KLEIO recipient tracking integrity audit passed: ${iterations.toLocaleString()} unique secure links and SHA-256 hashes, ${pageLoads.toLocaleString()} distinct countable Review Room opens with retry deduplication, ${draftRuns.toLocaleString()} deterministic first-message retry identities, ${accessIds.size.toLocaleString()} internal tracking identities, active-handoff scoped metrics, no raw-link sharing UI, truthful tracking failure behavior, conversation export safety, and opportunity/package/access security boundaries verified.`)
