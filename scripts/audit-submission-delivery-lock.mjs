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
const recipientFunction = read("supabase/functions/recipient-application-review/index.ts")
const migration = read("supabase/migrations/20260808160000_lock_submission_delivery_to_finalized_version.sql")
const attemptBridge = read("supabase/migrations/20260808161500_sync_submission_attempts_to_delivery.sql")
const grantHardening = read("supabase/migrations/20260808162500_harden_application_delivery_grants.sql")
const createAccessBlock = recipientFunction.split('if (action === "create_access")')[1]?.split('if (action === "revoke_access")')[0] ?? ""

requirePattern(composer, /prepareTrackedEmailClientHandoff/, "The canonical Application Composer email action must use the tracked delivery helper.")
requirePattern(composer, /Open email to send/, "The manual fallback must describe the truth: KLEIO opens the email for the artist to send.")
requirePattern(composer, /secure Review Room access for this exact preserved version/, "Artist-facing tracking copy must explain immutable Review Room delivery.")
forbidPattern(composer, /const href = `mailto:/, "The Application Composer must not build an untracked raw mailto handoff directly.")

requirePattern(delivery, /createRecipientReviewAccess\(input\.packageId, input\.submissionVersionId\)/, "Email delivery must request recipient access for the exact preserved version.")
requirePattern(delivery, /active_access_exists/, "Repeated handoff attempts must surface an intentional revoke/reissue boundary.")
requirePattern(delivery, /state:\s*"handoff_prepared"/, "Preparing the browser email fallback must record only the conservative handoff-prepared state.")
requirePattern(delivery, /recipientReviewUrl/, "Email delivery must create the secure Review Room destination.")
requirePattern(delivery, /buildMailtoHref/, "The fallback must automatically place the Review Room into the email rather than asking the artist to copy a link.")
requirePattern(delivery, /record_my_application_delivery/, "Every delivery adapter must feed the canonical delivery record.")
requirePattern(recipient, /submission_version_id: submissionVersionId/, "The recipient client must pass an exact finalized version when the caller has one.")
requirePattern(recipient, /View the complete application in KLEIO/, "The recipient email handoff must route review back into KLEIO.")

requirePattern(createAccessBlock, /finalized_submission_version_required/, "Recipient access creation must fail without a preserved submission version.")
requirePattern(createAccessBlock, /active_access_exists/, "Recipient access creation must reject an already-active handoff instead of silently rotating it.")
requirePattern(createAccessBlock, /submission_version_id: finalizedVersion\.id/, "Recipient access creation must persist the exact finalized version identity.")
forbidPattern(createAccessBlock, /\.update\(\{ revoked_at:/, "Creating recipient access must never revoke a previously issued active handoff.")

requirePattern(migration, /application_recipient_access[\s\S]*submission_version_id/, "Recipient access must be linked to an immutable submission version.")
requirePattern(migration, /alter column submission_version_id set not null/, "A recipient link without an immutable version must be structurally impossible after migration.")
requirePattern(migration, /bind_recipient_access_to_finalized_submission/, "The database must enforce finalized-version binding even for older clients or alternate entry points.")
requirePattern(migration, /prevent_recipient_access_snapshot_mutation/, "The sealed recipient snapshot and version identity must be immutable after access is issued.")
requirePattern(migration, /kleio_recipient_snapshot_from_submission_version/, "Recipient Review Room data must come from the sealed version snapshot rather than mutable package state.")
requirePattern(migration, /create table if not exists public\.application_deliveries/, "Delivery must have a durable channel-agnostic source of truth.")
requirePattern(migration, /'gmail','email_client','external_portal','native_kleio','download_package'/, "Gmail and fallback channels must share one delivery model.")
requirePattern(migration, /handoff_prepared/, "The canonical model must distinguish a prepared email handoff from proof that an external email client opened.")
requirePattern(migration, /provider_accepted/, "The model must distinguish provider-confirmed acceptance from self-reported sending.")
requirePattern(migration, /artist_reported_sent/, "The model must preserve a truthful self-reported send state for non-integrated channels.")
requirePattern(migration, /receipt_confirmed/, "Recipient-confirmed receipt must be representable without pretending it is provider delivery evidence.")
requirePattern(migration, /sync_application_delivery_from_recipient_event/, "Review Room and conversation activity must advance the same canonical delivery lifecycle.")
requirePattern(migration, /recipient_access_id/, "Delivery state must remain linked to the Review Room/conversation retention loop.")
requirePattern(migration, /record_my_application_delivery/, "Artists must have a controlled RPC for updating their own canonical delivery state.")

requirePattern(attemptBridge, /sync_application_delivery_from_submission_attempt/, "Existing truthful submission-attempt events must bridge into the canonical delivery record.")
requirePattern(attemptBridge, /email_client_opened[\s\S]*handoff_prepared/, "Historical email-client-opened evidence must be conservatively normalized to handoff prepared.")
requirePattern(attemptBridge, /artist_reported[\s\S]*artist_reported_sent/, "The existing artist self-report must update canonical delivery truth.")
requirePattern(attemptBridge, /confirmed[\s\S]*provider_accepted/, "Provider-confirmed legacy evidence must retain its stronger evidence class.")
requirePattern(attemptBridge, /public\.application_deliveries/, "Legacy attempts must converge on application_deliveries rather than create a parallel model.")

requirePattern(grantHardening, /revoke all privileges on table public\.application_deliveries from anon, authenticated/, "Delivery rows must not inherit Supabase default write/TRUNCATE/trigger privileges.")
requirePattern(grantHardening, /grant select on table public\.application_deliveries to authenticated/, "Only authenticated owner-scoped reads should be granted directly on deliveries.")
requirePattern(grantHardening, /revoke all on function public\.record_my_application_delivery[\s\S]*from public, anon/, "The delivery RPC must not be callable by anonymous or PUBLIC roles.")
requirePattern(grantHardening, /grant execute on function public\.record_my_application_delivery[\s\S]*to authenticated/, "Authenticated artists need the controlled delivery RPC.")

console.log("Submission delivery lock audit passed: immutable version binding, race-safe recipient access, tracked Review Room handoff, conservative handoff evidence, least-privilege table/RPC grants, truthful manual-email fallback, recipient-driven lifecycle progression, legacy-attempt convergence, shared delivery state, and Gmail-ready provider evidence semantics are structurally present.")