import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const failures = []

function walk(directory) {
  const absolute = path.join(root, directory)
  if (!fs.existsSync(absolute)) return []
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(absolute, entry.name)
    if (entry.isDirectory()) return walk(path.relative(root, target))
    return /\.(?:ts|tsx|js|jsx)$/.test(entry.name) ? [path.relative(root, target)] : []
  })
}

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8")
}

function addCoverage(eventName, file) {
  if (!clientCalls.has(eventName)) clientCalls.set(eventName, [])
  clientCalls.get(eventName).push(file)
}

const clientFiles = ["app", "components", "lib"].flatMap(walk)
  .filter((file) => file !== "lib/kleio-product-event-dictionary.ts")
const clientCalls = new Map()
for (const file of clientFiles) {
  const content = read(file)
  for (const match of content.matchAll(/trackKleioProductEvent\(\s*["']([^"']+)["']/g)) {
    addCoverage(match[1], file)
  }
}

const utility = read("lib/kleio-product-analytics.ts")
for (const bridgedEvent of [
  "passport_started",
  "passport_section_completed",
  "proposal_review_opened",
  "search_no_results",
]) {
  if (utility.includes(`eventName: \"${bridgedEvent}\"`)) addCoverage(bridgedEvent, "lib/kleio-product-analytics.ts (canonical bridge)")
}

const importStudio = read("components/kleio/artist-import-studio.tsx")
if (importStudio.includes('"import_partially_completed"')) addCoverage("import_partially_completed", "components/kleio/artist-import-studio.tsx")

console.log("Current product-event coverage:")
for (const [eventName, files] of [...clientCalls.entries()].sort(([left], [right]) => left.localeCompare(right))) {
  console.log(`- ${eventName}: ${[...new Set(files)].join(", ")}`)
}

const requiredClientEvents = {
  acquisition: [
    "landing_viewed",
    "artist_signup_selected",
    "creative_passport_selected",
    "explore_opportunities_selected",
    "public_directory_viewed",
    "opportunity_opened",
  ],
  signup: [
    "signup_started",
    "signup_validation_failed",
    "signup_submitted",
    "confirmation_required",
    "login_completed",
    "login_failed",
  ],
  onboarding: [
    "onboarding_started",
    "onboarding_step_viewed",
    "onboarding_step_completed",
    "onboarding_step_skipped",
    "onboarding_save_failed",
    "onboarding_resumed",
  ],
  creative_passport: [
    "passport_started",
    "passport_mode_selected",
    "passport_section_completed",
    "passport_save_failed",
    "proposal_review_opened",
    "proposal_approved",
    "proposal_rejected",
  ],
  media_import: [
    "import_source_selected",
    "import_started",
    "import_completed",
    "import_partially_completed",
    "import_failed",
    "draft_restored",
    "autosave_succeeded",
    "autosave_failed",
  ],
  opportunities: [
    "opportunity_directory_viewed",
    "search_performed",
    "filter_applied",
    "search_no_results",
    "official_source_opened",
    "readiness_viewed",
    "prepare_selected",
  ],
  reliability: [
    "user_visible_error",
    "workflow_recovery_offered",
    "workflow_recovered",
  ],
}

for (const [workflow, events] of Object.entries(requiredClientEvents)) {
  for (const eventName of events) {
    if (!clientCalls.has(eventName)) failures.push(`Missing ${workflow} client instrumentation: ${eventName}`)
  }
}

const dictionary = read("lib/kleio-product-event-dictionary.ts")
if (!dictionary.includes("onboarding_validation_failed: define(")) failures.push("The future onboarding validation event must remain defined even though the lightweight beta currently has no separate onboarding validation screen.")

const milestoneMigration = read("supabase/migrations/20260803162100_product_analytics_milestones.sql")
for (const eventName of [
  "account_created",
  "confirmation_completed",
  "onboarding_completed",
  "first_value_reached",
  "artist_activated",
  "artwork_record_saved",
  "passport_record_confirmed",
  "opportunity_saved",
  "opportunity_unsaved",
  "application_preparation_started",
  "portfolio_inclusion_confirmed",
]) {
  if (!milestoneMigration.includes(`'${eventName}'`)) failures.push(`Missing server-authoritative event: ${eventName}`)
}

for (const eventName of ["import_source_selected", "import_started", "import_completed", "import_partially_completed", "import_failed"]) {
  if (!importStudio.includes(`\"${eventName}\"`)) failures.push(`Google Drive Import Studio is missing ${eventName}`)
}
if (!/workflowId/.test(importStudio)) failures.push("Google Drive Import Studio must attach one workflow ID across start and outcome events.")
if (!/failed_count/.test(importStudio) || !/duplicate_count/.test(importStudio)) failures.push("Import outcomes must include aggregate failed and duplicate counts.")

if (failures.length) {
  console.error("\nKLEIO product analytics event coverage audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`KLEIO product analytics coverage audit passed: ${clientCalls.size} client and bridged events plus durable account, first-value, activation, artwork, Passport, opportunity and application milestones verified.`)
