import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")

function must(content, pattern, message) {
  if (!pattern.test(content)) throw new Error(message)
}
function never(content, pattern, message) {
  if (pattern.test(content)) throw new Error(message)
}

const migration = read("supabase/migrations/20260808170000_gmail_send_only_beta.sql")
const edge = read("supabase/functions/gmail-delivery/index.ts")
const client = read("lib/kleio-gmail-delivery.ts")
const control = read("components/kleio/gmail-delivery-control.tsx")
const composer = read("components/kleio/application-composer-workspace.tsx")
const fallback = read("lib/kleio-application-delivery.ts")

// Scope + OAuth truth boundary.
must(edge, /https:\/\/www\.googleapis\.com\/auth\/gmail\.send/, "Gmail beta must request gmail.send.")
must(edge, /REQUESTED_SCOPES = \["openid", "email", GMAIL_SEND_SCOPE\]/, "Gmail connection may request identity/email only in addition to gmail.send.")
never(edge, /gmail\.readonly|gmail\.modify|gmail\.compose|https:\/\/mail\.google\.com\//i, "Gmail beta must not request inbox read/modify/compose/full-mail scopes.")
must(edge, /access_type[\s\S]*offline/, "OAuth must request offline access for server-side sending.")
must(edge, /prompt[\s\S]*consent/, "Explicit consent must be requested so a refresh token is available for the connection.")
must(edge, /state_hash[\s\S]*sha256/, "OAuth state must be stored/compared as a hash, not plaintext.")
must(migration, /gmail_oauth_states[\s\S]*expires_at[\s\S]*used_at/, "OAuth state must expire and be one-time use.")

// Refresh-token storage and least privilege.
must(migration, /private\.external_connection_secrets/, "Refresh-token Vault references must live in a server-only mapping.")
must(migration, /vault\.create_secret|vault\.update_secret/, "Gmail refresh tokens must be written to Supabase Vault.")
must(migration, /vault\.decrypted_secrets/, "Only the service helper may decrypt the Gmail refresh token.")
must(migration, /token_ciphertext='',[\s\S]*refresh_token_ciphertext=''/, "Legacy browser-row ciphertext columns must stay unused for Gmail.")
must(migration, /revoke all on function public\.get_gmail_connection_secret_service[\s\S]*from public,anon,authenticated/, "Browser roles must never execute the secret-reading RPC.")
must(migration, /grant execute on function public\.get_gmail_connection_secret_service[\s\S]*to service_role/, "Only the service role may retrieve the Vault-backed refresh token.")
never(edge, /console\.(?:log|info|debug)\([^\n]*(?:refresh|access)[_-]?token/i, "OAuth tokens must never be logged.")

// Immutable application + Review Room handoff.
must(edge, /application_submission_versions[\s\S]*artist_user_id/, "Gmail must load an artist-owned immutable submission version.")
must(edge, /createRecipientAccessThroughBoundary[\s\S]*submissionVersionId/, "Gmail delivery must create recipient access for the exact immutable version.")
must(edge, /gmail_recipient_access_version_mismatch/, "Gmail must fail closed if Review Room access does not match the exact version.")
must(edge, /View the complete application in KLEIO|buildReviewUrl/, "Every Gmail message must route review back into KLEIO.")
must(composer, /finalizedIsCurrent[\s\S]*GmailDeliveryControl/, "Gmail controls must only appear inside the current finalized-version boundary.")

// Exact private package + provider size limit.
must(edge, /package_items/, "Gmail attachment assembly must use the immutable package-item snapshot.")
must(edge, /artist_import_sources[\s\S]*artist_user_id/, "Requirement attachment paths must be re-resolved owner-side before provider send.")
must(edge, /snapshot\.portfolio|portfolio = Array\.isArray\(snapshot\.portfolio\)/, "Selected portfolio works must be included in attachment assembly.")
must(edge, /cv_file_path/, "The preserved CV path must be considered for Gmail attachment assembly.")
must(edge, /path\.startsWith\(`\$\{userId\}\/`\)/, "Private attachments must remain owner-prefixed before download.")
must(edge, /MAX_RAW_MESSAGE_BYTES = 24 \* 1024 \* 1024/, "KLEIO must stop before provider send when encoded Gmail payload is too large.")
must(edge, /gmail_message_too_large[\s\S]*Nothing was sent/, "Oversize Gmail package must fail before send with a truthful fallback message.")

// Race/idempotency + ambiguous provider response.
must(migration, /provider_send_claim_id[\s\S]*provider_send_claimed_at/, "Gmail provider send must have an atomic lease identity.")
must(migration, /provider_sending[\s\S]*provider_unknown/, "Delivery states must distinguish in-flight and ambiguous provider status.")
must(migration, /send_in_progress/, "A second live send claim must be rejected.")
must(migration, /provider_status_unknown/, "Ambiguous provider result must block blind provider retry.")
must(edge, /gmail_provider_status_unknown[\s\S]*Check Gmail Sent/, "Ambiguous Gmail response must direct the artist to check Sent rather than retry blindly.")
must(fallback, /assertManualFallbackSafe/, "Manual fallback must check Gmail state before creating another recipient handoff.")
must(fallback, /provider_unknown[\s\S]*Check Gmail Sent/, "Manual fallback must be blocked when Gmail provider status is ambiguous.")
must(fallback, /provider_accepted[\s\S]*duplicate email handoff/, "Manual fallback must be blocked after provider-accepted Gmail delivery.")

// Provider truth + conversation lifecycle.
must(edge, /users\/me\/messages\/send/, "Gmail send must use the official messages.send endpoint.")
must(edge, /provider_reference: messageId/, "Successful Gmail handoff must persist the provider message id.")
must(migration, /gmail_provider_accepted[\s\S]*not proof the institution received or read it/i, "Provider acceptance must never be described as institution receipt/read.")
must(control, /Send-only access\. KLEIO cannot read or modify your inbox/, "Artist-facing connection copy must accurately describe the narrow scope.")
must(control, /Final delivery confirmation/, "Connected Gmail must still require an explicit final send confirmation.")
must(control, /Check Gmail Sent before doing anything else/, "Ambiguous provider state must visibly block accidental duplicate delivery.")
must(control, /Connecting Gmail is optional/, "Gmail must remain optional rather than a submission gate.")
must(client, /application_deliveries[\s\S]*channel", "gmail"/, "The client must read the canonical delivery record, not a parallel Gmail status store.")

console.log("Gmail send-only beta audit passed: narrow OAuth scope, Vault refresh-token storage, exact immutable submission/Review Room delivery, approved private attachment assembly, provider-size protection, atomic send claim, ambiguous-response duplicate protection, optional manual fallback, and truthful provider/recipient evidence semantics are structurally present.")
