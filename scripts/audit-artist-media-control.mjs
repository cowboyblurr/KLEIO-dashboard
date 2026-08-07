import fs from "node:fs"

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8") }
function requirePattern(text, pattern, message) { if (!pattern.test(text)) throw new Error(message) }
function forbidPattern(text, pattern, message) { if (pattern.test(text)) throw new Error(message) }

const library = read("components/kleio/artist-media-library.tsx")
const passport = read("components/kleio/creative-passport-media-panel.tsx")
const menu = read("components/kleio/media-management-menu.tsx")
const controls = read("lib/kleio-media-control.ts")
const intelligence = read("lib/kleio-media-intelligence.ts")
const sheet = read("components/kleio/media-intelligence-sheet.tsx")
const uploader = read("components/kleio/media-import/quick-media-import.tsx")
const lease = read("supabase/migrations/20260807213500_artist_media_analysis_claim.sql")

requirePattern(library, /MediaManagementMenu/, "Media Library must use the shared media-management menu.")
requirePattern(library, /Try analysis again/, "Failed analysis must remain distinct from upload failure.")
requirePattern(passport, /MediaManagementMenu/, "Creative Passport must expose shared media controls in place.")
requirePattern(passport, /currentContext="creative_passport"/, "Creative Passport must detach context without deleting the canonical source.")
requirePattern(passport, /recordMediaUsage/, "Creative Passport additions must create an explicit reusable-media association.")

requirePattern(menu, /MoreHorizontal/, "Media cards must use a compact contextual menu rather than a cluttered toolbar.")
requirePattern(menu, /Remove from this section/, "The shared menu must distinguish detach from delete.")
requirePattern(menu, /Delete from KLEIO/, "The shared menu must expose explicit permanent deletion language.")
requirePattern(menu, /Eliminar de KLEIO/, "Changed destructive media controls must include Spanish copy.")
requirePattern(menu, /role="menu"/, "Contextual media actions must expose accessible menu semantics.")
requirePattern(menu, /role="dialog"/, "Permanent deletion must require an accessible confirmation dialog.")

requirePattern(controls, /application_requirement_attachments/, "Deletion safety must trace exact application requirement attachments.")
requirePattern(controls, /application_submission_versions/, "Deletion safety must trace immutable finalized submission snapshots.")
requirePattern(controls, /snapshotContainsMedia/, "Finalized submission media references must be detected before deletion.")
requirePattern(controls, /blockingReferences\.length \|\| assessment\.finalizedReferences\.length/, "Finalized or non-detachable references must block destructive deletion.")
requirePattern(controls, /artist_user_id.*account\.user\.id/s, "Media mutation must remain owner-scoped.")
requirePattern(controls, /storage\.from\(bucket\)\.remove/, "Permanent deletion must remove the private storage object.")
requirePattern(controls, /const restore = async/, "Safe deletion must retain an explicit recovery path.")
requirePattern(controls, /artist_requirement_assessments/, "Removing a draft requirement attachment must restore its missing-material state.")
requirePattern(controls, /createSignedUrl/, "Preview/Open must work for private documents as well as visual previews.")

requirePattern(intelligence, /"failed"/, "Media intelligence status must distinguish failed analysis.")
requirePattern(intelligence, /claim_my_media_analysis/, "Analysis must claim an owner-scoped job before invoking AI.")
requirePattern(intelligence, /finally[\s\S]*releaseMediaAnalysis/, "Analysis leases must be released after success or failure.")
requirePattern(sheet, /Re-analyze|Rebuild source \+ Passport/, "Completed analysis must expose explicit re-analysis.")
requirePattern(sheet, /previous successful (?:analysis|source intelligence) is still available below/i, "Failed re-analysis must leave the previous successful result visible.")
requirePattern(sheet, /review aid, not verification|reviewable suggestion, not verification/i, "AI output must be framed as review assistance rather than verification.")

requirePattern(lease, /for update/, "Concurrent analysis claims must use a database row lock.")
requirePattern(lease, /artist_user_id = \(select auth\.uid\(\)\)/, "Analysis claims must verify source ownership.")
requirePattern(lease, /interval '4 minutes'/, "Stale analysis claims must be recoverable.")

requirePattern(uploader, /failedUploads/, "Failed uploads must persist as recoverable UI state.")
requirePattern(uploader, />Retry</, "Failed uploads must expose Retry without a page reload.")
requirePattern(uploader, />Remove</, "Failed uploads must expose Remove without a page reload.")
requirePattern(uploader, /Uploading \$\{index \+ 1\} of \$\{files\.length\}/, "Active uploads must show clear per-file progress.")
requirePattern(uploader, /if \(uploading\) event\.preventDefault\(\)/, "A non-abortable upload must not be dismissible as though it were cancelled.")
forbidPattern(uploader, /Cancel upload/i, "Do not expose a fake Cancel upload action while the storage request is not truly abortable.")

console.log("Artist media-control audit passed: shared compact actions, detach/delete separation, requirement and finalized-submission safeguards, recoverable storage deletion, safe re-analysis, duplicate-job prevention, recoverable upload failures, private preview, and EN/ES destructive-action copy are structurally present.")
