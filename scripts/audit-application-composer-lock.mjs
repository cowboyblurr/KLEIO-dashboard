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
const applicationsPage = read("app/artist-dashboard/applications/page.tsx")
const composer = read("components/kleio/application-composer-workspace.tsx")
const timeline = read("components/kleio/application-timeline-panel.tsx")
const unifiedApplications = read("components/kleio/unified-artist-applications.tsx")
const composerLib = read("lib/kleio-application-composer.ts")
const answerClient = read("lib/kleio-application-answer-assist.ts")
const answerFunction = read("supabase/functions/generate-application-answer/index.ts")
const migration = read("supabase/migrations/20260807190000_application_composer_lock.sql")
const packageRevisionLink = read("supabase/migrations/20260807192500_link_submission_seals_to_package_versions.sql")
const usageMigration = read("supabase/migrations/20260807193000_application_answer_usage_action.sql")

requireText(page, /ApplicationComposerWorkspace/, "The artist application route must mount the locked Application Composer.")
requireText(page, /ApplicationRequirementMedia/, "The composer route must preserve exact requirement document handling.")
requireText(page, /ApplicationRecipientLoopPanel/, "The composer route must preserve the secure recipient review path.")
requireText(page, /ApplicationTimelinePanel/, "The composer route must mount the unified application timeline.")

requireText(applicationsPage, /UnifiedArtistApplications/, "The Applications route must use one source-of-truth view across KLEIO-hosted and external applications.")
requireText(unifiedApplications, /External packages/, "The Applications page must surface external application packages, not only KLEIO-hosted submissions.")
requireText(unifiedApplications, /Next relevant action/, "Every external application must expose the next relevant action.")
requireText(unifiedApplications, /Update outcome/, "Submitted external applications must support lightweight artist outcome updates.")
requireText(unifiedApplications, /artist-reported unless KLEIO has separate evidence/, "Manual application outcomes must preserve their evidence truth label.")

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
requireText(composerLib, /finalize_my_application_submission_version/, "Finalization must go through the immutable submission-seal RPC.")
requireText(composerLib, /system_observed/, "Timeline aggregation must preserve evidence levels.")

requireText(answerClient, /generate-application-answer/, "The client must use the exact-question drafting function.")
requireText(answerClient, /functionErrorPayload/, "Application drafting must surface recoverable Edge Function errors instead of appearing to do nothing.")
requireText(answerClient, /Your application was not changed/, "Drafting failures must reassure the artist about application state without pretending a draft succeeded.")
requireText(answerFunction, /ARTIST EVIDENCE/, "Application drafting must ground copy in artist-controlled evidence.")
requireText(answerFunction, /artist_profiles/, "Application drafting must reuse artist-authored Creative Passport fields even when they were not created by an import workflow.")
requireText(answerFunction, /portfolio_works/, "Application drafting must be able to use artist-authored portfolio context when it materially strengthens the answer.")
requireText(answerFunction, /opportunity_eligibility_rules/, "Drafting must have access to source-confirmed opportunity eligibility context, not only a generic summary.")
requireText(answerFunction, /OPPORTUNITY CONTEXT/, "Drafting must correlate artist evidence with the actual opportunity context.")
requireText(answerFunction, /OTHER SOURCE-CONFIRMED OPPORTUNITY REQUIREMENTS \/ ELIGIBILITY CONTEXT/, "Drafting must consider the broader verified requirement set when composing an answer.")
requireText(answerFunction, /Answer the exact question first/, "Drafting must answer the opportunity question rather than recycle the artist bio.")
requireText(answerFunction, /genuine overlaps/, "Drafting must seek genuine artist-opportunity relevance instead of manufactured fit.")
requireText(answerFunction, /Avoid empty grant language/, "Drafting must explicitly resist generic grant-AI filler.")
requireText(answerFunction, /Do not infer motivation, future intent, budgets, dates, collaborators, community relationships, project promises, or outcomes/, "Drafting must not manufacture artist intent or application facts.")
requireText(answerFunction, /artist_context_required/, "Artists with insufficient context must receive a truthful next-step error rather than a silent failure.")
requireText(answerFunction, /confirmed_at/, "Imported evidence used for drafting must remain artist-confirmed.")
forbidText(answerFunction, /\.eq\("status",\s*"proposed"\)/, "Unapproved proposed Passport claims must not be treated as application evidence.")

requireText(migration, /create table if not exists public\.application_submission_versions/, "Immutable submission seals must have a durable table.")
requireText(migration, /prevent_application_submission_version_mutation/, "Submission seals must reject update/delete mutation.")
requireText(migration, /create table if not exists public\.application_timeline_events/, "Application history must have a durable evidence-labelled timeline.")
requireText(migration, /evidence_level/, "Timeline events must persist evidence level.")
requireText(migration, /preflight_blockers_remaining/, "Server finalization must reject applications with blocking preflight issues.")

requireText(packageRevisionLink, /application_package_versions owns draft\/package revision numbers/, "The finalization layer must preserve KLEIO's existing package revision architecture rather than replace it.")
requireText(packageRevisionLink, /source_package_version/, "Every finalized submission seal must link to the exact existing package revision.")
forbidText(packageRevisionLink, /set package_version\s*=/, "Submission finalization must never reset or compete with the existing package version counter.")
requireText(usageMigration, /generate_application_answer/, "Application-answer AI usage must be metered separately for pricing analysis.")

requireText(timeline, /Evidence labels show what KLEIO actually knows/, "The artist timeline must explain its truth model.")
requireText(timeline, /does not prove the application was read in full|Neither event is represented as proof/, "Recipient activity must not be presented as surveillance certainty.")

console.log("KLEIO application composer audit passed: Creative Passport reuse, opportunity-specific evidence grounding, portfolio relevance, exact-question drafting, artist control, preflight validation, immutable submission seals linked to existing package revisions, truthful external submission evidence, portable dossier output, recipient review continuity, unified application history, lightweight outcome updates, and application-answer cost metering are structurally present.")
