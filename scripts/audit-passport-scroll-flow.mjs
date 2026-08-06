import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")
const workspace = read("components/kleio/creative-passport-workspace.tsx")
const adaptive = read("components/kleio/adaptive-artist-passport-experience.tsx")
const editor = read("components/kleio/live-artist-passport-editor.tsx")
const failures = []

const requirePattern = (content, pattern, message) => {
  if (!pattern.test(content)) failures.push(message)
}
const forbidPattern = (content, pattern, message) => {
  if (pattern.test(content)) failures.push(message)
}

requirePattern(
  workspace,
  /<main data-passport-scroll-owner="creative-passport" className="h-full overflow-y-auto bg-white">/,
  "Creative Passport edit mode must expose exactly one page-level vertical scroll owner.",
)
requirePattern(
  workspace,
  /data-passport-edit-header[\s\S]*position: static !important/,
  "The Passport context row must remain in normal document flow.",
)
requirePattern(
  workspace,
  /data-passport-edit-content[\s\S]*height: auto !important[\s\S]*min-height: 0 !important/,
  "The nested adaptive workspace must not create a fixed-height viewport under the context row.",
)
requirePattern(
  workspace,
  /data-passport-edit-content[\s\S]*main \{[\s\S]*height: auto !important;[\s\S]*overflow: visible !important;/,
  "Nested Passport forms must release their internal scrollbars to the page-level scroll owner.",
)
requirePattern(
  workspace,
  /<div data-passport-edit-content>[\s\S]*<AdaptiveArtistPassportExperience \/>/,
  "The complete Passport editor must live inside the shared page scroll flow.",
)
forbidPattern(
  workspace,
  /if \(mode === "edit"\)[\s\S]*?<div className="flex h-full min-h-0 flex-col bg-white">/,
  "The former fixed-height edit shell must not return.",
)
forbidPattern(
  workspace,
  /data-passport-edit-header className="shrink-0/,
  "The Passport context row must not be marked as a non-shrinking pinned region.",
)

requirePattern(adaptive, /aria-label="Creative Passport workflow"/, "The workflow control must remain discoverable.")
requirePattern(editor, /Gemini suggestions appear in the field where they belong/, "Field-level Gemini review must remain intact.")
requirePattern(editor, /Approve replacement|Approve/, "Artist approval controls must remain inside the matching field workflow.")
requirePattern(editor, /Reject/, "Artist rejection controls must remain inside the matching field workflow.")

const ownerCount = (workspace.match(/data-passport-scroll-owner="creative-passport"/g) || []).length
if (ownerCount !== 1) failures.push(`Expected exactly one Creative Passport scroll owner; found ${ownerCount}.`)

if (failures.length) {
  console.error("KLEIO Creative Passport scroll-flow audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO Creative Passport scroll-flow audit passed: one page-level scroll owner, no pinned context box, no fixed-height editor viewport, and field-level Gemini approval controls preserved.")
