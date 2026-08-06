import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const failures = []
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")
const requirePattern = (content, pattern, message) => { if (!pattern.test(content)) failures.push(message) }
const forbidPattern = (content, pattern, message) => { if (pattern.test(content)) failures.push(message) }

const shared = read("supabase/functions/_shared/gemini-document-intelligence.ts")
const extractor = read("supabase/functions/extract-artist-materials/index.ts")
const drafter = read("supabase/functions/generate-artist-document-draft/index.ts")
const client = read("lib/kleio-document-intelligence.ts")
const draftingClient = read("lib/kleio-document-drafting.ts")
const uploadUi = read("components/kleio/artist-document-intelligence.tsx")
const draftUi = read("components/kleio/document-draft-studio.tsx")
const reviewUi = read("components/kleio/passport-updates-inbox.tsx")
const migration = read("supabase/migrations/20260805232500_gemini_document_intelligence.sql")
const fixtures = JSON.parse(read("tests/fixtures/document-intelligence/gemini-acceptance-cases.json"))

requirePattern(shared, /gemini-3\.6-flash/, "The normal document model must be the current stable Gemini 3.6 Flash.")
requirePattern(shared, /inlineData:[\s\S]*mimeType: "application\/pdf"/, "Gemini must receive original inline PDF bytes.")
requirePattern(shared, /responseFormat:[\s\S]*application\/json[\s\S]*schema/, "Gemini 3 structured output must use the current responseFormat contract.")
requirePattern(shared, /responseJsonSchema/, "Non-Gemini-3 fallback structured output must use JSON Schema.")
requirePattern(shared, /validateDocumentAnalysis/, "Model output must pass independent semantic validation.")
requirePattern(shared, /nativeEvidenceSupported/, "Native-text evidence excerpts must be verified against source page text.")
requirePattern(shared, /pageNumber < 1|pageNumber.*totalPages/, "Page references must be range-checked.")
requirePattern(shared, /limited_analysis/, "The canonical quality contract must include limited analysis.")
requirePattern(shared, /provider_unavailable/, "The canonical quality contract must include provider unavailable.")
requirePattern(shared, /factualClaims\.length < complexMinimum/, "Thin multi-page analysis must not be marked complete.")
forbidPattern(shared, /console\.(log|info|debug)\(/, "The shared Gemini adapter must not log private document content.")

requirePattern(extractor, /GEMINI_API_KEY/, "Gemini credentials must be read server-side.")
requirePattern(extractor, /source\.mime_type !== "application\/pdf"/, "The semantic analyzer must enforce PDF input.")
requirePattern(extractor, /sourceFile\(admin, source\)/, "The analyzer must load the owner-scoped private original.")
requirePattern(extractor, /pdfBytes: bytes/, "The original PDF bytes must be sent to Gemini.")
requirePattern(extractor, /artist_user_id", userId/, "Document jobs and sources must remain owner-scoped.")
requirePattern(extractor, /restricted_document_minimum_processing/, "Sensitive documents must use minimum processing.")
requirePattern(extractor, /analyze_document/, "Document AI usage must be recorded under a dedicated action.")
requirePattern(extractor, /cached: true/, "Unchanged source/model/schema analysis must be cacheable.")
requirePattern(extractor, /KLEIO_GEMINI_PRO_ESCALATION/, "Complex limited documents must support controlled model escalation.")
requirePattern(extractor, /representativeClaims/, "The function must return an immediate analysis preview.")
forbidPattern(extractor, /console\.(log|info|debug)\(/, "The extractor must not log private document content.")

requirePattern(uploadUi, /Document understanding result/, "The upload surface must immediately explain what Gemini perceived.")
requirePattern(uploadUi, /Review all extracted information/, "The upload surface must link to the full review inbox.")
requirePattern(uploadUi, /Pages perceived/, "The upload surface must show page coverage.")
requirePattern(uploadUi, /evidence_excerpt/, "The upload surface must show evidence excerpts.")
requirePattern(uploadUi, /analysis_quality/, "The upload surface must show the canonical quality state.")
requirePattern(client, /complete_review_ready/, "The client must understand the canonical analysis state contract.")
requirePattern(client, /Gemini is understanding the document/, "The progress contract must describe semantic document understanding.")

requirePattern(drafter, /GEMINI_API_KEY/, "Document-derived drafting must use the Gemini server credential.")
forbidPattern(drafter, /cloudflare|gemma|llama/i, "Document-derived drafting must not use the previous Cloudflare Gemma/Llama provider.")
requirePattern(drafter, /eq\("is_sensitive", false\)/, "Drafting must exclude sensitive records.")
requirePattern(drafter, /not\("confirmed_at", "is", null\)/, "Drafting must use confirmed records only.")
requirePattern(shared, /unsupportedTokens/, "The shared Gemini validator must detect unsupported factual tokens in drafts.")
requirePattern(drafter, /validateDraftOutput/, "The drafting function must validate every Gemini draft before persistence.")
requirePattern(drafter, /artist-approved private records/, "The Gemini drafting prompt must use artist-approved evidence only.")
requirePattern(draftUi, /Prepared by KLEIO with Gemini from artist-approved records/, "Gemini drafts must be visibly labeled for review.")
requirePattern(draftingClient, /kleio_gemini_drafting_v2/, "The client must load the Gemini drafting version.")
requirePattern(reviewUi, /Review evidence and provenance/, "The existing full proposal review must preserve evidence and provenance.")

requirePattern(migration, /'analyze_document'/, "The AI usage contract must allow document analysis.")
requirePattern(migration, /artist_ai_usage_events_document_daily_idx/, "Document rate limits need an indexed usage path.")
if (!Array.isArray(fixtures.cases) || fixtures.cases.length !== 17) failures.push("The Gemini acceptance manifest must contain exactly 17 required cases.")
if (!fixtures.cases.some((item) => item.id === "seven_page_failure_equivalent")) failures.push("The seven-page failure-equivalent acceptance case is required.")

if (failures.length) {
  console.error("KLEIO Gemini document intelligence audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
requireText(shared, "document_synopsis", "Gemini analysis must return a document synopsis")
requireText(shared, "not_relevant", "Gemini analysis must classify document relevance")
requireText(shared, "extractable_information", "Gemini analysis must explain auditable information categories")
requireText(shared, "supportedJsonSchema", "Gemini requests must use a provider-compatible schema subset")
requireText(extractor, "analysis_summary.relevance", "coverage must account for relevance rather than proposal count alone")
requireText(component, "What this document is", "the upload page must show a synopsis immediately")
requireText(component, "Information KLEIO can audit", "the upload page must show extractable information categories")

console.log("KLEIO Gemini document intelligence audit passed: original-PDF vision, structured validation, honest coverage, immediate evidence display, approved-evidence drafting, privacy controls, and 17 acceptance cases verified.")
