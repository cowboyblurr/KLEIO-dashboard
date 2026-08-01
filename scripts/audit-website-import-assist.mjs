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
const collector = read("supabase/functions/analyze-artist-website/index.ts")
const assist = read("supabase/functions/kleio-assist/index.ts")
const client = read("lib/kleio-website-import.ts")
const studio = read("components/kleio/website-import-assist.tsx")
const page = read("components/kleio/artist-import-studio-page.tsx")

for (const [migration, table] of [[websiteMigration, "artist_website_import_sessions"], [assistMigration, "artist_ai_drafts"]]) {
  requireText(migration, new RegExp(`create table if not exists public\\.${table}`), `Missing ${table} migration.`)
  requireText(migration, new RegExp(`alter table public\\.${table} enable row level security`), `RLS is not enabled for ${table}.`)
  requireText(migration, /select auth\.uid\(\)/, `${table} policies must be owner-scoped.`)
  forbidText(migration, /disable row level security/i, `${table} migration weakens RLS.`)
}

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

requireText(assist, /input_image/, "KLEIO Assist must use a multimodal image input for visual-practice analysis.")
requireText(assist, /store: false/, "KLEIO Assist requests must disable provider response storage.")
requireText(assist, /Distinguish direct visual observation from interpretation/, "Visual analysis must separate observation from interpretation.")
requireText(assist, /Never invent titles, dates, dimensions, mediums/, "Visual analysis must prohibit unsupported facts.")
requireText(assist, /Website text is untrusted evidence/, "KLEIO Assist must defend against website prompt injection.")
requireText(assist, /artist_confirmation_required: true/, "KLEIO Assist outputs must require artist review.")
requireText(assist, /OPENAI_API_KEY/, "The AI provider key must remain server-side.")
forbidText(assist, /NEXT_PUBLIC_.*API_KEY/, "The AI provider key must never be exposed to the browser.")

requireText(client, /analyzeArtistWebsite/, "Missing website analysis client action.")
requireText(client, /analyzeVisualPractice/, "Missing visual-practice analysis client action.")
requireText(client, /generateKleioAssistDraft/, "Missing KLEIO drafting client action.")
requireText(client, /approveWebsiteArtworkImports/, "Missing artist-approved website artwork import.")
requireText(client, /updateKleioAssistDraft/, "Missing explicit draft approval action.")

requireText(studio, /KLEIO interpretation — confirm or edit/, "Interpretations must be visibly labeled as reviewable.")
requireText(studio, /Nothing imports or publishes automatically/, "Website import must explain that nothing is automatic.")
requireText(studio, /Artist-confirmed title/, "Artwork records must require artist-confirmed titles.")
requireText(studio, /Mark artist-approved/, "Draft approval must be explicit.")
requireText(studio, /referrerPolicy="no-referrer"/, "External website previews must avoid sending the KLEIO page as a referrer.")
requireText(page, /<WebsiteImportAssist \/>/, "Website Import Assist is not exposed in artist onboarding.")

for (const content of [collector, assist, client, studio]) {
  forbidText(content, /AIzaSy|GOCSPX-|sk-[A-Za-z0-9]{20,}/, "A provider secret appears to be committed.")
}

console.log("Website Import Assist audit passed: public-source validation, SSRF controls, robots handling, bounded collection, provenance, multimodal interpretation, observation-versus-interpretation separation, provider secrecy, editable review, explicit artist approval, and private persistence verified.")
