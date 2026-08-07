import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")

function requireText(content, pattern, message) {
  if (!pattern.test(content)) throw new Error(message)
}

function forbidText(content, pattern, message) {
  if (pattern.test(content)) throw new Error(message)
}

const page = read("app/artist-dashboard/applications/prepare/page.tsx")
const composer = read("components/kleio/application-composer-workspace.tsx")
const timeline = read("components/kleio/application-timeline-panel.tsx")
const composerLib = read("lib/kleio-application-composer.ts")
const answerClient = read("lib/kleio-application-answer-assist.ts")
const answerFunction = read("supabase/functions/generate-application-answer/index.ts")
const migration = read("supabase/migrations/20260807190000_application_composer_lock.sql")

requireText(page, /ApplicationComposerWorkspace/, "The artist application route must mount the locked Application Composer.")
requireText(page, /ApplicationRequirementMedia/, "The composer route must preserve exact requirement document handling.")
requireText(page, /ApplicationRecipientLoopPanel/, "The composer route must preserve the secure recipient review path.")
requireText(page, /ApplicationTimelinePanel/, "The composer route must mount the unified application timeline.")

requireText(composer, /What KLEIO already knows/, "The composer must make Creative Passport reuse visible before new work.")
requireText(composer, /Application questions/, "The composer must expose source-structured application questions.")
requireText(composer, /Prepare draft/, "The composer must offer artist-controlled drafting rather than silently generating copy.")
requireText(composer, /Why this draft\?/, "AI source/relevance explanation must be available on demand.")
requireText(composer, /Preflight/, "The composer must provide an explicit preflight stage.")
requireText(composer, /Exactly what will leave KLEIO/, "The artist must review the exact outbound package before delivery.")
requireText(composer, /Finalize & preserve version/, "The composer must expose immutable version finalization.")
requireText(composer, /I sent this application/, "External submissions must support truthful artist-reported confirmation.")
requireText(composer, /does not claim “Institution received your application.”/, "The composer must distinguish artist-reported send from institution receipt.")
requireText(composer, /Open email client/, "Email fallback must remain usable without claiming a connected provider send.")
requireText(composer, /application dossier/, "The finalized application must have a portable professional dossier output.")

requireText(composerLib, /buildApplicationPreflight/, "Preflight logic must be centralized and testable.")
requireText(composerLib, /maximum_word_count/, "Preflight must validate source word limits.")
requireText(composerLib, /minimum_item_count/, "Preflight must validate portfolio counts.")
requireText(composerLib, /finalize_my_application_submission_version/, "Finalization must go through the immutable version RPC.")
requireText(composerLib, /system_observed/, "Timeline aggregation must preserve evidence levels.")

requireText(answerClient, /generate-application-answer/, "The client must use the exact-question drafting function.")
requireText(answerFunction, /ARTIST-CONFIRMED EVIDENCE/, "Application drafting must ground copy in artist-confirmed evidence.")
requireText(answerFunction, /Answer the exact question, not the artist biography in general/, "Drafting must answer the opportunity question rather than recycle the artist bio.")
requireText(answerFunction, /Do not infer motivation or future intent/, "Drafting must not manufacture artist intent.")
requireText(answerFunction, /Do not create accomplishments, dates, budgets, collaborators, project promises, or outcomes/, "Drafting must explicitly prohibit unsupported application facts.")
requireText(answerFunction, /confirmed_at/, "Drafting must use confirmed Passport records.")
forbidText(answerFunction, /\.eq\("status",\s*"proposed"\)/, "Unapproved proposed Passport claims must not be treated as application evidence.")

requireText(migration, /create table if not exists public\.application_submission_versions/, "Immutable submission versions must have a durable table.")
requireText(migration, /prevent_application_submission_version_mutation/, "Submission versions must reject update/delete mutation.")
requireText(migration, /Future Creative Passport edits never rewrite historical submission contents/, "The migration must document snapshot immutability semantics.")
requireText(migration, /create table if not exists public\.application_timeline_events/, "Application history must have a durable evidence-labelled timeline.")
requireText(migration, /evidence_level/, "Timeline events must persist evidence level.")
requireText(migration, /preflight_blockers_remaining/, "Server finalization must reject applications with blocking preflight issues.")

requireText(timeline, /Evidence labels show what KLEIO actually knows/, "The artist timeline must explain its truth model.")
requireText(timeline, /does not prove the application was read in full|Neither event is represented as proof/, "Recipient activity must not be presented as surveillance certainty.")

console.log("KLEIO application composer audit passed: Creative Passport reuse, exact-question drafting, artist control, preflight validation, immutable versions, truthful external submission evidence, portable dossier output, recipient review continuity, and unified application history are structurally present.")