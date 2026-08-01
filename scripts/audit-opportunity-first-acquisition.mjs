import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const failures = []

function read(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`)
    return ""
  }
  return fs.readFileSync(absolutePath, "utf8")
}

function requirePattern(relativePath, pattern, description) {
  const content = read(relativePath)
  if (!pattern.test(content)) failures.push(`${relativePath}: ${description}`)
}

function forbidPattern(relativePath, pattern, description) {
  const content = read(relativePath)
  if (pattern.test(content)) failures.push(`${relativePath}: ${description}`)
}

requirePattern("components/kleio/public-opportunity-carousel.tsx", /get_public_opportunity_carousel/, "carousel must use the narrow public database function")
requirePattern("components/kleio/public-opportunity-carousel.tsx", /prefers-reduced-motion/, "carousel must honor reduced motion")
requirePattern("components/kleio/public-opportunity-carousel.tsx", /onFocusCapture/, "carousel must pause on keyboard focus")
requirePattern("components/kleio/public-opportunity-carousel.tsx", /aria-roledescription="carousel"/, "carousel region must expose its role")
requirePattern("components/kleio/public-opportunity-carousel.tsx", /Previous opportunities/, "carousel must expose manual previous control")
requirePattern("components/kleio/public-opportunity-carousel.tsx", /Next opportunities/, "carousel must expose manual next control")

requirePattern("lib/kleio-return-intent.ts", /UUID_PATTERN/, "return intents must validate opportunity UUIDs")
requirePattern("lib/kleio-return-intent.ts", /MAX_INTENT_AGE_MS = 72/, "return intents must expire after 72 hours")
requirePattern("lib/kleio-return-intent.ts", /publicRoute: "\/opportunities\/"/, "return intents must use an approved same-origin route")
requirePattern("lib/kleio-return-intent.ts", /markKleioReturnIntentConsumed/, "return intents must support controlled one-time consumption")
forbidPattern("lib/kleio-return-intent.ts", /javascript:/i, "return intent implementation must not accept JavaScript URLs")

requirePattern("components/kleio/signup/lightweight-artist-signup.tsx", /Professional or display name/, "lightweight signup must request a display name")
requirePattern("components/kleio/signup/lightweight-artist-signup.tsx", /Confirm password/, "lightweight signup must confirm the password")
requirePattern("components/kleio/signup/lightweight-artist-signup.tsx", /I agree to create a KLEIO account/, "lightweight signup must collect explicit acceptance")
forbidPattern("components/kleio/signup/lightweight-artist-signup.tsx", /Primary discipline \*/, "lightweight signup must not require discipline")
forbidPattern("components/kleio/signup/lightweight-artist-signup.tsx", /Location \*/, "lightweight signup must not require location")

requirePattern("lib/kleio-passport-drafts.ts", /LOCAL_RETENTION_MS = 7/, "local drafts must expire")
requirePattern("lib/kleio-passport-drafts.ts", /draft_conflict/, "remote drafts must surface optimistic conflicts")
requirePattern("components/kleio/use-passport-draft-autosave.ts", /1100/, "Passport autosave must be debounced")
requirePattern("components/kleio/live-artist-passport-editor.tsx", /Recovery available/, "full-form Passport must expose recovery")

requirePattern("supabase/functions/extract-artist-materials/index.ts", /%PDF-/, "PDF extraction must validate the file signature")
requirePattern("supabase/functions/extract-artist-materials/index.ts", /artist_account_required/, "extraction must validate the artist role")
requirePattern("components/kleio/artist-import-review.tsx", /Approve and save/, "artists must explicitly approve proposals")
requirePattern("components/kleio/artist-import-review.tsx", /Reject/, "artists must be able to reject proposals")
requirePattern("components/kleio/artist-import-review.tsx", /Decide later/, "artists must be able to defer proposals")
requirePattern("lib/kleio-artist-import.ts", /uploadMediaToLibrary/, "PDF imports must use the canonical private media source layer")
requirePattern("lib/kleio-universal-media.ts", /BUCKET = "artist-assets"/, "canonical artist media must use owner-scoped private storage")

requirePattern("lib/kleio-product-analytics.ts", /SAFE_METADATA_KEYS/, "analytics metadata must be allowlisted")
requirePattern("supabase/migrations/20260730023306_opportunity_first_acquisition_foundations.sql", /product_events_metadata_sanitized/, "database must enforce analytics sanitization")
requirePattern("supabase/migrations/20260730023306_opportunity_first_acquisition_foundations.sql", /voice_transcript/, "database sanitization must cover voice transcripts")
requirePattern("supabase/migrations/20260730023306_opportunity_first_acquisition_foundations.sql", /portfolio_description/, "database sanitization must cover portfolio descriptions")

requirePattern("components/kleio/forms/voice-dictation-control.tsx", /device keyboard/, "voice input must provide device-dictation guidance")
requirePattern("components/kleio/forms/voice-dictation-control.tsx", /not-allowed/, "voice input must handle permission denial")
requirePattern("components/kleio/forms/voice-dictation-control.tsx", /Discard this dictation/, "voice input must support discarding a session")

requirePattern("supabase/migrations/20260730023306_opportunity_first_acquisition_foundations.sql", /artist_passport_drafts_manage_own/, "drafts must use owner-scoped RLS")
requirePattern("supabase/migrations/20260730023306_opportunity_first_acquisition_foundations.sql", /artist_import_sources_manage_own/, "import sources must use owner-scoped RLS")
requirePattern("supabase/migrations/20260730023306_opportunity_first_acquisition_foundations.sql", /artist_import_proposals_manage_own/, "import proposals must use owner-scoped RLS")
requirePattern("supabase/migrations/20260730023306_opportunity_first_acquisition_foundations.sql", /security invoker/, "public carousel function must preserve caller RLS")

requirePattern("components/kleio/public-opportunity-directory.tsx", /opportunity_restoration_completed/, "successful opportunity restoration must be measured")
requirePattern("components/kleio/public-opportunity-directory.tsx", /opportunity_restoration_failed/, "failed opportunity restoration must be measured")
requirePattern("components/kleio/progressive-opportunity-actions.tsx", /Only what this result needs/, "Passport prompts must be progressive and contextual")
requirePattern("components/kleio/progressive-opportunity-actions.tsx", /account\.profile\.role !== "artist"/, "personalized opportunity actions must validate artist role")

if (failures.length) {
  console.error("Opportunity-first acquisition audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("Opportunity-first acquisition audit passed: carousel accessibility, secure restoration, lightweight signup, progressive Passport prompts, autosave conflict handling, canonical private import approval, analytics sanitization, voice fallback, and RLS source definitions are present.")
