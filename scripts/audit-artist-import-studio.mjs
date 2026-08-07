import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8")
const failures = []
const requireText = (file, text, message) => { if (!read(file).includes(text)) failures.push(`${message} (${file})`) }
const forbidText = (file, text, message) => { if (read(file).includes(text)) failures.push(`${message} (${file})`) }

const page = "components/kleio/artist-import-studio-page.tsx"
const hub = "components/kleio/import-source-hub.tsx"
const library = "components/kleio/artist-media-library.tsx"
const passportPanel = "components/kleio/creative-passport-media-panel.tsx"
const intelligenceSheet = "components/kleio/media-intelligence-sheet.tsx"
const intelligenceClient = "lib/kleio-media-intelligence.ts"
const deviceUpload = "lib/kleio-device-media-upload.ts"
const uploadService = "lib/kleio-upload-to-passport.ts"
const availability = "lib/kleio-import-source-availability.ts"
const extractor = "supabase/functions/extract-artist-materials/index.ts"
const mediaAnalyzer = "supabase/functions/analyze-artist-media/index.ts"
const draftFunction = "supabase/functions/generate-artist-document-draft/index.ts"
const interactionsShim = "supabase/functions/_shared/gemini-interactions-fetch-shim.ts"
const extractionEntrypoint = "supabase/functions/extract-artist-materials/interactions-entrypoint.ts"

requireText(page, "<ImportSourceHub />", "artist import page must retain a concise explanation of working private sources")
requireText(page, 'context="existing_media_library"', "artist import page must use the shared generic media picker")
requireText(page, 'href="/artist-dashboard/media/"', "artist import page must route organization and analysis to Media Library")
requireText(page, 'href="/artist-dashboard/passport/"', "artist import page must route contextual intelligence to Creative Passport")
forbidText(page, "ArtistDocumentIntelligence", "artist import page must not force artists into a separate PDF-first analysis screen")
forbidText(page, "DocumentDraftStudio", "artist import page must not stack an unrelated drafting workspace under upload")
forbidText(page, "beta", "artist import page must not expose internal release-stage language")

requireText(hub, "device_document", "source hub must verify direct document availability")
requireText(hub, "device_image", "source hub must verify direct image availability")
requireText(hub, "device_video", "source hub must verify direct video availability")
requireText(hub, "device_audio", "source hub must verify direct audio availability")
requireText(hub, "existing_kleio_media", "source hub must verify reusable private-library availability")
for (const roadmapCopy of ["Deferred", "deferred", "Beta", "beta", "Google Drive", "Instagram", "Pinterest", "Website Import"]) forbidText(hub, roadmapCopy, "source hub must not expose internal roadmap or connector language")

requireText(library, "<MediaIntelligenceSheet", "Media Library must open analysis in place")
requireText(library, "canAnalyzeMediaItem", "Media Library must show analysis only for supported sources")
requireText(library, "Analysis ready", "Media Library must make completed intelligence visible at a glance")
requireText(passportPanel, "<MediaIntelligenceSheet", "Creative Passport must open the same private media analysis in place")
requireText(passportPanel, "loadMediaIntelligenceStatuses", "Creative Passport must surface existing analysis rather than forcing re-analysis")
requireText(passportPanel, 'context="creative_passport"', "Creative Passport must support direct reusable media selection")
requireText(intelligenceSheet, "Observation", "analysis UI must explain that observation and interpretation are distinct")
requireText(intelligenceSheet, "not verification", "AI confidence must not be presented as verification")
requireText(intelligenceSheet, "does not rewrite your Passport", "analysis must remain artist-controlled")
requireText(intelligenceSheet, "Passport language", "analysis must keep useful Passport suggestions in the same visual flow")

requireText(intelligenceClient, "requestMediaExtraction", "PDFs must retain structured document intelligence")
requireText(intelligenceClient, 'functions.invoke("analyze-artist-media"', "image/video/audio intelligence must use the protected media analyzer")
requireText(intelligenceClient, "loadMediaIntelligence", "analysis must persist on the reusable private source")
requireText(deviceUpload, 'storageBucket = isPdf ? "artist-documents" : "artist-assets"', "generic PDF upload must preserve the document-safe storage path")
requireText(deviceUpload, 'source_type: isPdf ? "pdf"', "generic PDF upload must remain compatible with the structured PDF analyzer")
requireText(uploadService, "extract-artist-materials", "shared PDF extraction must invoke the protected analyzer")

requireText(availability, "device_document: true", "direct documents must be enabled")
requireText(availability, "device_image: true", "direct images must be enabled")
requireText(availability, "device_video: true", "direct video must be enabled")
requireText(availability, "device_audio: true", "direct audio must be enabled")
requireText(availability, "pdf: true", "structured PDF analysis must stay enabled")
requireText(availability, "existing_kleio_media: true", "existing private sources must remain reusable")
requireText(availability, "google_drive_document: false", "unreleased Drive imports must stay disabled internally")
requireText(availability, "instagram_image: false", "unreleased Instagram import must stay disabled internally")
requireText(availability, "website: false", "unreleased Website Import must stay disabled internally")

requireText(mediaAnalyzer, "artist_confirmation_required", "media analyzer must preserve artist control")
requireText(mediaAnalyzer, "Do not identify people", "media analyzer must not attempt person identification")
requireText(mediaAnalyzer, "factual_observations", "media analyzer must separate supportable observations")
requireText(mediaAnalyzer, "interpretive_observations", "media analyzer must separate interpretive readings")
requireText(mediaAnalyzer, "private_analysis", "media analysis must be stored as private intelligence")
requireText(extractor, "gemini_native_pdf_v2", "PDF extractor must retain native-PDF Gemini analysis")
requireText(extractor, "artist_confirmation_required", "PDF proposals must remain artist-controlled")
requireText(extractor, "provider_unavailable", "PDF extractor must preserve honest provider failure states")
requireText(draftFunction, "confirmed_facts_required", "document drafting must still require confirmed evidence")
requireText(draftFunction, "unsupported_claim_detected", "document drafting must still reject unsupported claims")

requireText(interactionsShim, "v1beta/interactions", "PDF runtime adapter must use Gemini Interactions")
requireText(interactionsShim, "store: false", "Gemini Interactions must remain stateless")
requireText(extractionEntrypoint, "installGeminiInteractionsFetchShim", "PDF extraction must install the proven transport adapter")

for (const file of [page, hub, library, passportPanel, intelligenceSheet, intelligenceClient, deviceUpload, uploadService, availability, extractor, mediaAnalyzer, draftFunction, interactionsShim, extractionEntrypoint]) {
  forbidText(file, "AIzaSy", "Google API keys must not be committed")
  forbidText(file, "GOCSPX-", "Google client secrets must not be committed")
}

if (failures.length) {
  console.error("Artist media intelligence audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("Artist media intelligence audit passed: upload is media-first, analysis opens in Media Library and Creative Passport, PDF intelligence remains compatible, future connectors stay internal, artist approval is preserved, and secret hygiene is clean.")
