import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"

const recipient = fs.readFileSync("components/kleio/recipient-application-review.tsx", "utf8")
const mediaAssist = fs.readFileSync("components/kleio/media-intelligence-sheet.tsx", "utf8")
const analyticsAudit = fs.readFileSync("scripts/audit-product-analytics-privacy.mjs", "utf8")
const collection = fs.readFileSync("supabase/functions/analyze-artist-media-collection/index.ts", "utf8")

function recipientFocusGuard(source) {
  return source.includes('role="dialog"') && source.includes('handleArtworkDialogKeyDown') && source.includes('closeFocusedWork') && source.includes('requestAnimationFrame')
}
function mediaFocusGuard(source) {
  return source.includes('role="dialog"') && source.includes('handleMediaAssistDialogKeyDown') && source.includes('previousFocusRef')
}
function analyticsPrivacyGuard(source) {
  return source.includes("forbiddenValuePatterns") && source.includes("metadata")
}
function multiSourceGuard(source) {
  return source.includes("MIN_COLLECTION_ITEMS = 2") && source.includes("source_refs") && source.includes("refs.length < MIN_COLLECTION_ITEMS")
}

test("recipient accessibility guard fails a known-bad focus mutation", () => {
  assert.equal(recipientFocusGuard(recipient), true)
  assert.equal(recipientFocusGuard(recipient.replaceAll("handleArtworkDialogKeyDown", "removedFocusHandler")), false)
})

test("Media Assist accessibility guard fails a known-bad focus mutation", () => {
  assert.equal(mediaFocusGuard(mediaAssist), true)
  assert.equal(mediaFocusGuard(mediaAssist.replaceAll("previousFocusRef", "removedPreviousFocus")), false)
})

test("analytics privacy guard fails when metadata scanning is deliberately removed", () => {
  assert.equal(analyticsPrivacyGuard(analyticsAudit), true)
  assert.equal(analyticsPrivacyGuard(analyticsAudit.replaceAll("forbiddenValuePatterns", "removedForbiddenPatterns")), false)
})

test("body-of-work grounding guard fails when minimum multi-source requirement is deliberately weakened", () => {
  assert.equal(multiSourceGuard(collection), true)
  assert.equal(multiSourceGuard(collection.replace("MIN_COLLECTION_ITEMS = 2", "MIN_COLLECTION_ITEMS = 1")), false)
})
