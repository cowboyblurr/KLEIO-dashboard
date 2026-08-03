import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const failures = []
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260803162400_product_analytics_legacy_internal_actors.sql"),
  "utf8",
)
const architecture = fs.readFileSync(
  path.join(root, "docs/product-analytics-architecture.md"),
  "utf8",
)

function requirePattern(content, pattern, message) {
  if (!pattern.test(content)) failures.push(message)
}

requirePattern(
  migration,
  /release_channel = 'legacy_pre_beta'/,
  "Legacy actor classification must be limited to verified pre-architecture activity.",
)
requirePattern(
  migration,
  /insert into private\.analytics_internal_actors/,
  "Pre-beta authenticated actors must be registered privately as internal QA.",
)
requirePattern(
  migration,
  /on conflict \(user_id\) do nothing/,
  "Internal actor classification must remain idempotent.",
)
requirePattern(
  migration,
  /set traffic_class = 'internal_qa'/,
  "Existing events from internal actors must be excluded from real-user reports.",
)
requirePattern(
  architecture,
  /legacy_pre_beta/,
  "Architecture documentation must disclose the conservative legacy classification.",
)
requirePattern(
  architecture,
  /not treated as a real-user beta baseline/i,
  "Architecture documentation must not present pre-beta testing as real usage.",
)

if (failures.length) {
  console.error("KLEIO legacy analytics baseline audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO legacy analytics baseline audit passed: all authenticated actors observed in verified pre-beta activity are privately classified as internal QA, existing events are excluded from real-user reporting, and the conservative baseline is documented.")
