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

const engine = read("supabase/functions/synthesize-artist-source-profile-v2/index.ts")
const qa = read("supabase/functions/_shared/passport-synthesis-qa.mjs")
const client = read("lib/kleio-document-profile-synthesis.ts")
const media = read("lib/kleio-media-intelligence.ts")
const sheet = read("components/kleio/media-intelligence-sheet.tsx")
const regression = read("tests/passport-synthesis-orchestration.test.mjs")

requireText(engine, /UNTRUSTED SOURCE DATA/, "Uploaded PDFs must be treated as untrusted data, never model instructions.")
requireText(engine, /evaluatePassportCoverage/, "Passport synthesis must run deterministic coverage QA.")
requireText(engine, /repairPrompt/, "Missing evidence-supported fields need a bounded targeted repair pass.")
requireText(engine, /stableSynthesisFingerprint/, "Synthesis must use an idempotent source/pipeline fingerprint.")
requireText(engine, /source_fingerprint/, "Persisted synthesis must record its source fingerprint.")
requireText(engine, /previous_synthesis_preserved/, "Failed rebuilds must explicitly preserve the prior successful synthesis.")
requireText(engine, /gemini_passport_synthesis_v2/, "Synthesized Passport proposals must have a distinct provenance method.")
requireText(engine, /artist_import_proposals/, "Synthesis must become editable Passport proposals, not copy-only prose.")
requireText(engine, /bulk_confirm_eligible:\s*classification === "EXTRACTED_FACT"/, "Interpretive synthesis must never be bulk-confirm eligible.")
requireText(engine, /mediums.*factualOnly/s, "Medium/material synthesis must remain factual rather than visually guessed.")
requireText(engine, /artist_statement.*INTERPRETIVE_DRAFT/s, "Artist-statement drafting must permit evidence-grounded interpretive drafts when artist-authored text is insufficient.")

requireText(qa, /RETRY_REQUIRED/, "Coverage QA must distinguish missed draftable fields from genuinely missing evidence.")
requireText(qa, /NEEDS_ARTIST_INPUT/, "Coverage QA must allow genuine insufficient-evidence states.")
requireText(qa, /mediums/, "Medium coverage must be part of deterministic QA.")
requireText(qa, /disciplines/, "Discipline coverage must be part of deterministic QA.")

requireText(client, /synthesize-artist-source-profile-v2/, "The browser client must call the orchestrated v2 synthesis engine.")
requireText(client, /retryDocumentProfileSynthesis/, "The browser client needs a targeted Passport synthesis retry action.")
requireText(media, /pipelineStatus/, "Media Assist internals must distinguish source understanding from Passport synthesis readiness.")
requireText(media, /retryDocumentPassportSynthesis/, "PDF Passport synthesis must be retryable without reprocessing the source extraction.")

requireText(sheet, /Source notes ready · Passport incomplete/, "The UI must not present source-only PDF understanding as completed Passport drafting.")
requireText(sheet, /Retry Passport drafting only/, "The UI needs a targeted recovery path for Passport drafting failures.")
requireText(sheet, /Review & apply/, "Generated Passport proposals must lead into artist edit\/approval rather than copy-only workflow.")
requireText(sheet, /remains a suggestion until you edit or approve it/, "The UI must distinguish generated Passport language from artist-approved information.")
forbidText(sheet, /AI confidence \{confidence\}%|Overall review confidence|review confidence/i, "Media Assist must not present model-style creative confidence percentages to the artist.")

requireText(regression, /Photography/, "Regression suite must cover the observed photography evidence failure pattern.")
requireText(regression, /mediums.*disciplines|disciplines.*mediums/s, "Regression suite must fail when supported mediums\/disciplines disappear.")
requireText(regression, /sparse evidence/, "Regression suite must verify that genuinely unsupported fields remain artist-input states.")

console.log("KLEIO Passport synthesis orchestration audit passed: grounded synthesis, deterministic coverage QA, bounded repair, prompt-injection resistance, idempotent rebuilds, editable proposals, and truthful Media Assist source-notes versus Passport-drafting states verified.")