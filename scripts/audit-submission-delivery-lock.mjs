import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")

function requirePattern(content, pattern, message) {
  if (!pattern.test(content)) throw new Error(message)
}

function forbidPattern(content, pattern, message) {
  if (pattern.test(content)) throw new Error(message)
}

const composer = read("components/kleio/application-composer-workspace.tsx")
const delivery = read("lib/kleio-application-delivery.ts")
const recipient = read("lib/kleio-recipient-application.ts")
const migration = read("supabase/migrations/20260808160000_lock_submission_delivery_to_finalized_version.sql")

requirePattern(composer, /prepareTrackedEmailClientHandoff/, "The canonical Application Composer email action must use the tracked delivery helper.")
requirePattern(composer, /Open email to send/, "The manual fallback must describe the truth: KLEIO opens the email for the artist to send.")
requirePattern(composer, /secure Review Room access for this exact preserved version/, "Artist-facing tracking copy must explain immutable Review Room delivery.")
forbidPattern(composer, /const href = `mailto:/, "The Application Composer must not build an untracked raw mailto handoff directly.")

requirePattern(delivery, /createRecipientReviewAccess/, "Email delivery must create recipient access through the existing hardened recipient boundary.")
requirePattern(delivery, /recipientReviewUrl/, "Email delivery must create the secure Review Room destination.")
requirePattern(delivery, /buildMailtoHref/, "The fallback must automatically place the Review Room into the email rather than asking the artist to copy a link.")
requirePattern(delivery, /record_my_application_delivery/, "Every delivery adapter must feed the canonical delivery record.")
requirePattern(recipient, /View the complete application in KLEIO/, "The recipient email handoff must route review back into KLEIO.")

requirePattern(migration, /application_recipient_access[\s\S]*submission_version_id/, "Recipient access must be linked to an immutable submission version.")
requirePattern(migration, /alter column submission_version_id set not null/, "A recipient link without an immutable version must be structurally impossible after migration.")
requirePattern(migration, /bind_recipient_access_to_finalized_submission/, "The database must enforce finalized-version binding even for older clients or alternate entry points.")
requirePattern(migration, /kleio_recipient_snapshot_from_submission_version/, "Recipient Review Room data must come from the sealed version snapshot rather than mutable package state.")
requirePattern(migration, /create table if not exists public\.application_deliveries/, "Delivery must have a durable channel-agnostic source of truth.")
requirePattern(migration, /'gmail','email_client','external_portal','native_kleio','download_package'/, "Gmail and fallback channels must share one delivery model.")
requirePattern(migration, /provider_accepted/, "The model must distinguish provider-confirmed acceptance from self-reported sending.")
requirePattern(migration, /artist_reported_sent/, "The model must preserve a truthful self-reported send state for non-integrated channels.")
requirePattern(migration, /recipient_access_id/, "Delivery state must remain linked to the Review Room/conversation retention loop.")
requirePattern(migration, /record_my_application_delivery/, "Artists must have a controlled RPC for updating their own canonical delivery state.")

console.log("Submission delivery lock audit passed: immutable version binding, tracked Review Room handoff, truthful manual-email fallback, shared delivery state, and Gmail-ready provider evidence semantics are structurally present.")
