import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8")
const failures = []
const requireText = (file, text, message) => { if (!read(file).includes(text)) failures.push(`${message} (${file})`) }
const forbidText = (file, text, message) => { if (read(file).includes(text)) failures.push(`${message} (${file})`) }

const page = "components/kleio/artist-import-studio-page.tsx"
const hub = "components/kleio/import-source-hub.tsx"
const documents = "components/kleio/artist-document-intelligence.tsx"
const drafting = "components/kleio/document-draft-studio.tsx"
const client = "lib/kleio-document-intelligence.ts"
const uploadService = "lib/kleio-upload-to-passport.ts"
const draftClient = "lib/kleio-document-drafting.ts"
const availability = "lib/kleio-import-source-availability.ts"
const extractor = "supabase/functions/extract-artist-materials/index.ts"
const draftFunction = "supabase/functions/generate-artist-document-draft/index.ts"
const interactionsShim = "supabase/functions/_shared/gemini-interactions-fetch-shim.ts"
const extractionEntrypoint = "supabase/functions/extract-artist-materials/interactions-entrypoint.ts"
const draftEntrypoint = "supabase/functions/generate-artist-document-draft/interactions-entrypoint.ts"

requireText(page, "<ImportSourceHub />", "artist import page must explain the active source")
requireText(page, "<ArtistDocumentIntelligence />", "artist import page must mount private PDF analysis")
requireText(page, "<DocumentDraftStudio />", "artist import page must mount approved-evidence drafting")
forbidText(page, "<ArtistImportStudio />", "legacy Drive studio must not compete with direct PDF analysis")

requireText(hub, "Direct PDF upload is the active import method", "direct PDF must be the active beta source")
requireText(hub, "device_document", "source hub must read the direct-document gate")
requireText(hub, "availability?.pdf", "source hub must read the PDF gate")
requireText(hub, "Deferred", "inactive connected providers must be labeled honestly")

requireText(documents, 'accept="application/pdf,.pdf"', "document workflow must accept PDF files only")
requireText(documents, "Upload and understand document", "artist must deliberately initiate Gemini analysis")
requireText(documents, "Understand this document with Gemini", "artist must be able to opt out")
requireText(documents, "What this document is", "analysis must display a synopsis")
requireText(documents, "Information KLEIO can audit", "analysis must display extractable categories")
requireText(documents, "Relevance", "analysis must display relevance")
requireText(documents, "Pages perceived", "analysis must display page coverage")
requireText(documents, "Supported updates", "analysis must display supported findings")
requireText(documents, "Needs resolution", "analysis must display conflicts and uncertainty")
requireText(documents, "Review all extracted information", "analysis must link to full evidence review")
requireText(documents, "Private preview", "artist must retain private source access")
requireText(documents, "Analyze again", "artist must be able to initiate reanalysis")
requireText(documents, "Remove analysis", "artist must be able to keep the PDF without analysis")
requireText(documents, "Delete source", "artist must retain deletion control")
requireText(documents, 'role="status"', "processing states must be announced accessibly")

requireText(client, "15 * 1024 * 1024", "client must preserve the 15 MB PDF limit")
requireText(client, "validate-artist-document", "client must retain server-side PDF validation")
requireText(client, "requestSourceExtraction", "client must use the shared extraction service")
requireText(client, "reanalyzeArtistDocument", "manual reanalysis must be an explicit client action")
requireText(client, "analysisSummary", "client must expose the canonical analysis summary")
requireText(uploadService, "extract-artist-materials", "shared extraction service must invoke the protected analyzer")

requireText(drafting, "Prepared by KLEIO with Gemini from artist-approved records", "draft UI must label its approved evidence source")
requireText(drafting, "Artist approval required", "draft UI must preserve artist approval")
requireText(draftClient, "generate-artist-document-draft", "draft client must use the protected function")

requireText(availability, "device_document: true", "direct documents must be enabled")
requireText(availability, "pdf: true", "PDF analysis must be enabled")
requireText(availability, "existing_kleio_media: true", "existing private sources must remain reusable")
requireText(availability, "google_drive_document: false", "Drive documents must remain deferred")
requireText(availability, "instagram_image: false", "Instagram must remain deferred")
requireText(availability, "website: false", "Website Import must remain deferred")

requireText(extractor, "gemini_native_pdf_v2", "extractor must record native-PDF Gemini analysis")
requireText(extractor, "provider_unavailable", "extractor must preserve an honest provider failure state")
requireText(extractor, "limited_analysis", "extractor must prevent sparse results from appearing complete")
requireText(extractor, "artist_confirmation_required", "proposals must remain artist-controlled")
requireText(extractor, "analysis_summary.relevance", "coverage must account for document relevance")
requireText(draftFunction, "confirmed_facts_required", "drafting must require confirmed evidence")
requireText(draftFunction, "unsupported_claim_detected", "drafting must reject unsupported claims")
requireText(draftFunction, "is_sensitive", "sensitive records must be excluded from general drafting")

requireText(interactionsShim, "v1beta/interactions", "runtime adapter must use Gemini Interactions")
requireText(interactionsShim, "store: false", "Gemini Interactions must remain stateless")
requireText(interactionsShim, 'type: "document"', "runtime adapter must pass original PDF bytes")
requireText(extractionEntrypoint, "installGeminiInteractionsFetchShim", "extraction must install the proven transport adapter")
requireText(draftEntrypoint, "installGeminiInteractionsFetchShim", "drafting must install the proven transport adapter")

for (const file of [page, hub, documents, drafting, client, uploadService, draftClient, availability, extractor, draftFunction, interactionsShim, extractionEntrypoint, draftEntrypoint]) {
  forbidText(file, "AIzaSy", "Google API keys must not be committed")
  forbidText(file, "GOCSPX-", "Google client secrets must not be committed")
}

if (failures.length) {
  console.error("Artist PDF workflow audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("Artist PDF workflow audit passed: direct private PDF upload, Gemini synopsis and relevance, visible evidence results, shared protected extraction, approved-evidence drafting, artist controls, and secret hygiene verified.")
