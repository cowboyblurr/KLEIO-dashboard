import assert from "node:assert/strict"
import fs from "node:fs"

const sheet = fs.readFileSync("components/kleio/media-intelligence-sheet.tsx", "utf8")

for (const label of [
  "Reviewing your saved source evidence…",
  "Mapping supported details to your Creative Passport…",
  "Drafting bio, practice, mediums and disciplines…",
  "Checking themes, visual language and application terms…",
  "Verifying every suggestion against its source…",
  "Saving editable suggestions to your private review queue…",
]) assert.ok(sheet.includes(label), `missing progress stage: ${label}`)

assert.match(sheet, /larger portfolios can take a little longer/)
assert.match(sheet, /not an exact percentage or countdown/)
assert.match(sheet, /PassportRetryProgress/)
assert.match(sheet, /repairElapsedMs/)
assert.match(sheet, /previousGeneratedAt/)
assert.match(sheet, /pipelineStatus === "READY_FOR_REVIEW"/)
assert.match(sheet, /candidate\.analyzedAt !== previousGeneratedAt/)
assert.match(sheet, /\[0, 1_500, 3_000\]/)
assert.doesNotMatch(sheet, /[0-9]{1,3}% complete|seconds remaining/i)

console.log("media-assist long-request recovery regression: PASS")
