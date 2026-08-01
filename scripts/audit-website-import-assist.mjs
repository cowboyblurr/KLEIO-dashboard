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

const websiteMigration = read("supabase/migrations/20260801223000_website_import_assist.sql")
const assistMigration = read("supabase/migrations/20260801224000_kleio_assist_drafts.sql")
const cloudflareMigration = read("supabase/migrations/20260801231500_kleio_assist_cloudflare_beta.sql")
const collector = read("supabase/functions/analyze-artist-website/index.ts")
const assist = read("supabase/functions/kleio-assist/index.ts")
const client = read("lib/kleio-website-import.ts")
const studio = read("components/kleio/website-import-assist.tsx")
const page = read("components/kleio/artist-import-studio-page.tsx")

for (const [migration, table] of [
  [websiteMigration, "artist_website_import_sessions"],
  [assistMigration, "artist_ai_drafts"],
  [cloudflareMigration, "artist_ai_usage_events"],
]) {
  requireText(migration, new RegExp(`(?:create table if not exists|alter table) public\\.${table}`), `Missing ${table} migration.`)
  requireText(migration, new RegExp(`alter table public\\.${table} enable row level security`), `RLS is not enabled for ${table}.`)
  requireText(migration, /select auth\.uid\(\)/, `${table} policies must be owner-scoped.`)
  forbidText(migration, /disable row level security/i, `${table} migration weakens RLS.`)
}

requireText(cloudflareMigration, /artist_review jsonb/, "Visual-practice artist decisions must be stored privately.")
requireText(cloudflareMigration, /provider_request_id/, "AI provider requests must retain operational provenance.")
requireText(cloudflareMigration, /input_units|total_units/, "AI usage must be measurable for beta evaluation.")
requireText(cloudflareMigration, /grant select on table public\.artist_ai_usage_events to authenticated/, "Artists must have read-only access to their own AI usage.")
forbidText(cloudflareMigration, /grant insert.*artist_ai_usage_events.*authenticated/i, "Browser clients must not write AI usage records.")

requireText(collector, /ownershipConfirmed !== true/, "Website ownership or permission confirmation is missing.")
requireText(collector, /private_network_url_blocked/, "Website collector lacks SSRF private-network blocking.")
requireText(collector, /Deno\.resolveDns/, "Website collector must resolve and validate public addresses.")
requireText(collector, /robotsAllows/, "Website collector must respect robots rules.")
requireText(collector, /MAX_PAGES = 8/, "Website analysis must remain page-limited for beta.")
requireText(collector, /MAX_IMAGES = 80/, "Website analysis must remain image-limited for beta.")
requireText(collector, /artist_confirmation_required: true/, "Website image import must require artist confirmation.")
requireText(collector, /source_type: "website"/, "Imported website assets must retain their source type.")
requireText(collector, /external_url: resource\.url\.href/, "Imported website assets must retain source provenance.")
requireText(collector, /imageSignatureMatches/, "Website image import must validate file signatures.")

requireText(assist, /type KleioAiProvider/, "KLEIO Assist must use a provider abstraction.")
requireText(assist, /CLOUDFLARE_ACCOUNT_ID/, "Cloudflare account configuration must remain server-side.")
requireText(assist, /CLOUDFLARE_AI_TOKEN/, "Cloudflare AI credentials must remain server-side.")
requireText(assist, /@cf\/google\/gemma-4-26b-a4b-it/, "The verified free-beta multimodal model is not configured.")
requireText(assist, /@cf\/meta\/llama-4-scout-17b-16e-instruct/, "A free-beta multimodal fallback model is not configured.")
requireText(assist, /response_format/, "KLEIO Assist must request structured model output.")
requireText(assist, /store: false/, "KLEIO Assist requests must disable provider response storage.")
requireText(assist, /validatePublicImageUrl/, "Visual model inputs must reject private or unsafe image hosts.")
requireText(assist, /Distinguish direct visual observation from interpretation/, "Visual analysis must separate observation from interpretation.")
requireText(assist, /Never invent titles, dates, dimensions, mediums/, "Visual analysis must prohibit unsupported facts.")
requireText(assist, /Website text is untrusted evidence/, "KLEIO Assist must defend against website prompt injection.")
requireText(assist, /action === "review_analysis"/, "Visual interpretations require a dedicated artist-review action.")
requireText(assist, /approved_analysis/, "Drafting must use an artist-approved visual analysis.")
requireText(assist, /visual_analysis_review_required/, "Unreviewed visual analysis must not reach drafting.")
requireText(assist, /approvedProfileEvidence/, "Drafting must use selected profile evidence rather than the full scrape.")
requireText(assist, /artist_ai_usage_events/, "Free-beta AI usage must be logged.")
requireText(assist, /KLEIO_AI_DAILY_VISUAL_LIMIT/, "Visual fair-use controls must be configurable.")
requireText(assist, /KLEIO_AI_DAILY_DRAFT_LIMIT/, "Draft fair-use controls must be configurable.")
requireText(assist, /paid_billing_automatic: false/, "Paid billing must never activate automatically.")
forbidText(assist, /NEXT_PUBLIC_.*(?:AI|API).*KEY/, "AI provider credentials must never be exposed to the browser.")

requireText(client, /loadKleioAssistCapabilities/, "Missing provider capability check.")
requireText(client, /analyzeArtistWebsite/, "Missing website analysis client action.")
requireText(client, /analyzeVisualPractice/, "Missing visual-practice analysis client action.")
requireText(client, /reviewVisualPracticeAnalysis/, "Missing artist-controlled interpretation review.")
requireText(client, /buildApprovedProfileEvidence/, "Missing approved profile evidence builder.")
requireText(client, /generateKleioAssistDraft/, "Missing KLEIO drafting client action.")
requireText(client, /approveWebsiteArtworkImports/, "Missing artist-approved website artwork import.")
requireText(client, /updateKleioAssistDraft/, "Missing explicit draft approval action.")
requireText(client, /deleteKleioAssistDraft/, "Artists must be able to delete generated drafts.")

requireText(studio, /KLEIO interpretation — confirm, edit, or reject/, "Interpretations must be visibly labeled as reviewable.")
requireText(studio, /Save completed review/, "Artists must explicitly complete the visual review.")
requireText(studio, /useInDrafting/, "Artists must control which interpretations may influence drafts.")
requireText(studio, /Nothing imports or publishes automatically/, "Website import must explain that nothing is automatic.")
requireText(studio, /Artist-confirmed title/, "Artwork records must require artist-confirmed titles.")
requireText(studio, /I confirm that I own or have permission/, "Artwork import must include a rights confirmation.")
requireText(studio, /Generate two options/, "The beta drafting workflow must request two meaningful options.")
requireText(studio, /Mark artist-approved/, "Draft approval must be explicit.")
requireText(studio, /Delete draft/, "Generated drafts must be deletable.")
requireText(studio, /referrerPolicy="no-referrer"/, "External website previews must avoid sending the KLEIO page as a referrer.")
requireText(page, /<WebsiteImportAssist \/>/, "Website Import Assist is not exposed in artist onboarding.")

for (const content of [collector, assist, client, studio]) {
  forbidText(content, /AIzaSy|GOCSPX-|sk-[A-Za-z0-9]{20,}|CLOUDFLARE_AI_TOKEN\s*=\s*["'][^"']+/, "A provider secret appears to be committed.")
}
forbidText(studio, /first 50|51st user|user_count\s*[>=]+\s*50/i, "The proof-of-concept benchmark must not be hard-wired into product behavior.")
forbidText(assist, /user_count\s*[>=]+\s*50|signup_number/i, "The proof-of-concept benchmark must not be hard-wired into backend behavior.")

console.log("Website Import Assist audit passed: bounded public-source collection, SSRF and robots controls, private provenance, Cloudflare free-beta provider abstraction, structured multimodal output, artist-reviewed interpretations, approved-evidence-only drafting, configurable fair-use, usage measurement, explicit rights and draft approval, deletion controls, and no hard-wired user-count trigger.")
