import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8")
const requireText = (file, text, message) => { if (!read(file).includes(text)) throw new Error(`${message} (${file})`) }
const forbidText = (file, text, message) => { if (read(file).includes(text)) throw new Error(`${message} (${file})`) }

const page = "components/kleio/artist-import-studio-page.tsx"
const hub = "components/kleio/import-source-hub.tsx"
const documents = "components/kleio/artist-document-intelligence.tsx"
const drafting = "components/kleio/document-draft-studio.tsx"
const client = "lib/kleio-document-intelligence.ts"
const draftClient = "lib/kleio-document-drafting.ts"
const availability = "lib/kleio-import-source-availability.ts"
const extractor = "supabase/functions/extract-artist-materials/index.ts"
const draftFunction = "supabase/functions/generate-artist-document-draft/index.ts"
const interactionsShim = "supabase/functions/_shared/gemini-interactions-fetch-shim.ts"
const extractionEntrypoint = "supabase/functions/extract-artist-materials/interactions-entrypoint.ts"
const draftEntrypoint = "supabase/functions/generate-artist-document-draft/interactions-entrypoint.ts"
const instagram = "supabase/functions/instagram-import/index.ts"
const websiteGateway = "supabase/functions/analyze-artist-website/index.ts"

requireText(page, "<ImportSourceHub />", "artist import page must explain the active beta source")
requireText(page, "<ArtistDocumentIntelligence />", "artist import page must mount private PDF analysis")
requireText(page, "<DocumentDraftStudio />", "artist import page must mount approved-evidence drafting")
forbidText(page, "<ArtistImportStudio />", "legacy Google Drive studio must not compete with direct PDF analysis")
forbidText(page, "WebsiteImportAssist", "Website Import must remain deferred from the artist beta UI")
forbidText(page, "InstagramImportAssist", "Instagram Import must remain deferred from the artist beta UI")

requireText(hub, "Direct PDF upload is the active import method", "source hub must make direct PDF the active beta source")
requireText(hub, "device_document", "source hub must read the direct-document availability gate")
requireText(hub, "availability?.pdf", "source hub must read the PDF availability gate")
requireText(hub, "Google Drive", "Google Drive must remain visible only as deferred context")
requireText(hub, "Instagram", "Instagram must remain visible only as deferred context")
requireText(hub, "Website Import", "Website Import must remain visible only as deferred context")
requireText(hub, "Pinterest", "Pinterest must remain visible only as deferred context")
requireText(hub, "Deferred", "inactive connected providers must be labeled honestly")
forbidText(hub, "Connect Instagram", "Instagram must not expose an active connection control")
forbidText(hub, "Connect Pinterest", "Pinterest must not expose an active connection control")
forbidText(hub, "Google Drive is the active import source", "obsolete Drive-first beta copy must not return")

requireText(documents, 'accept="application/pdf,.pdf"', "direct document workflow must accept PDF files only")
requireText(documents, "Upload and understand document", "artist must explicitly initiate private Gemini analysis")
requireText(documents, "Understand this document with Gemini", "artist must be able to opt out and store without analysis")
requireText(documents, "analysisResult", "document UI must preserve the completed analysis result")
requireText(documents, "What this document is", "completed analysis must explain the document")
requireText(documents, "Information KLEIO can audit", "completed analysis must expose extractable information categories")
requireText(documents, "Relevance", "completed analysis must expose relevance")
requireText(documents, "Pages perceived", "completed analysis must expose page coverage")
requireText(documents, "Supported updates", "completed analysis must expose supported findings")
requireText(documents, "Needs resolution", "completed analysis must expose conflicts and uncertainty")
requireText(documents, "Review all extracted information", "completed analysis must provide the canonical review handoff")
requireText(documents, "Gemini", "document UI must disclose Gemini document understanding")
requireText(documents, 'role="status"', "document progress and completion must be announced accessibly")
requireText(documents, "Private preview", "artist must retain access to the original private PDF")
requireText(documents, "Analyze again", "artist must be able to deliberately reanalyze a source")
requireText(documents, "Remove analysis", "artist must be able to keep the PDF while removing AI analysis")
requireText(documents, "Delete source", "artist must retain source deletion control")

requireText(client, "15 * 1024 * 1024", "client must preserve the 15 MB beta PDF limit")
requireText(client, "validate-artist-document", "client must retain server-side PDF safety validation")
requireText(client, "extract-artist-materials", "client must use the canonical private extraction function")
requireText(client, 'action: "capabilities"', "client must query the configured Gemini capability without exposing secrets")
requireText(client, "force_reanalysis", "manual reanalysis must be explicit")
requireText(client, "analysisSummary", "client must return the canonical visible analysis summary")

requireText(drafting, "Prepared by KLEIO with Gemini from artist-approved records", "drafting UI must label Gemini and approved evidence")
requireText(drafting, "Artist approval required", "drafting UI must preserve artist approval")
requireText(draftClient, "generate-artist-document-draft", "draft client must use the protected server function")
requireText(draftClient, 'action: "generate_draft"', "draft generation must be an explicit action")

requireText(availability, "device_document: true", "frontend availability must enable direct documents")
requireText(availability, "pdf: true", "frontend availability must enable PDF analysis")
requireText(availability, "existing_kleio_media: true", "existing private sources must remain reusable")
requireText(availability, "google_drive_image: false", "Google Drive images must remain deferred")
requireText(availability, "google_drive_document: false", "Google Drive documents must remain deferred")
requireText(availability, "device_image: false", "device image import must remain deferred")
requireText(availability, "instagram_image: false", "Instagram must remain deferred")
requireText(availability, "website: false", "Website Import must remain deferred")

requireText(extractor, "gemini_native_pdf_v2", "document extractor must record Gemini native-PDF analysis")
requireText(extractor, "provider_unavailable", "document extractor must retain an honest provider-failure state")
requireText(extractor, "limited_analysis", "document extractor must prevent sparse results from appearing complete")
requireText(extractor, "artist_confirmation_required", "document proposals must remain artist-controlled")
requireText(extractor, "analysis_summary.relevance", "document coverage must account for document relevance")
requireText(draftFunction, "confirmed_records_unavailable", "drafting must fail closed when approved evidence cannot load")
requireText(draftFunction, "confirmed_facts_required", "drafting must require confirmed evidence")
requireText(draftFunction, "unsupported_claim_detected", "drafting must reject unsupported factual additions")
requireText(draftFunction, "is_sensitive", "sensitive Passport records must be excluded from general drafting")
requireText(interactionsShim, "v1beta/interactions", "runtime adapter must use Gemini Interactions")
requireText(interactionsShim, "store: false", "Gemini Interactions must remain stateless")
requireText(interactionsShim, 'type: "document"', "runtime adapter must pass original PDF bytes as a document")
requireText(extractionEntrypoint, "installGeminiInteractionsFetchShim", "document extraction must install the proven Interactions adapter")
requireText(draftEntrypoint, "installGeminiInteractionsFetchShim", "document drafting must install the proven Interactions adapter")

requireText(instagram, "instagram_import_beta_disabled", "Instagram OAuth gateway must remain disabled during the PDF beta")
forbidText(instagram, "META_INSTAGRAM_APP_SECRET", "disabled Instagram gateway must not load provider secrets")
requireText(websiteGateway, "WEBSITE_IMPORT_BETA_ENABLED", "Website Import must require an explicit server-side feature gate")
requireText(websiteGateway, "website_import_beta_disabled", "Website Import must fail closed during the PDF beta")

for (const file of [page, hub, documents, drafting, client, draftClient, availability, extractor, draftFunction, interactionsShim, extractionEntrypoint, draftEntrypoint, instagram, websiteGateway]) {
  forbidText(file, "AIzaSy", "Google API keys must not be committed")
  forbidText(file, "GOCSPX-", "Google client secrets must not be committed")
}

console.log("Artist beta import audit passed: direct private PDF upload is active, Gemini explains the document and its relevance, analysis results and limitations are visible, drafting uses artist-approved evidence, deferred providers remain gated, and no provider secrets are exposed.")
