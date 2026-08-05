import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"

const cases = JSON.parse(fs.readFileSync(new URL("./fixtures/document-intelligence/gemini-acceptance-cases.json", import.meta.url), "utf8")).cases

function assess({ classification, totalPages, pagesAnalyzed, unreadablePages = [], claims, sections, providerAvailable = true, textQuality = "native_text" }) {
  if (!providerAvailable) return "provider_unavailable"
  if (["needs_artist_classification", "unknown_document"].includes(classification)) return "classification_required"
  const factual = claims.filter((claim) => ["factual", "artist_authored"].includes(claim.layer))
  const claimTypes = new Set(factual.map((claim) => claim.type)).size
  const pageCoverage = pagesAnalyzed.length / Math.max(1, totalPages)
  const unreadableRatio = unreadablePages.length / Math.max(1, totalPages)
  const minimum = classification === "artist_cv" ? 4 : 2
  if (unreadableRatio > 0.25 || (["scanned", "mixed"].includes(textQuality) && factual.length < 2)) return "visual_reading_limited"
  if ((totalPages >= 3 && factual.length < minimum) || pageCoverage < 0.6 || claimTypes < 2) return "limited_analysis"
  if (pageCoverage >= 0.95 && unreadableRatio === 0 && factual.length >= (classification === "artist_cv" ? 10 : 5) && sections.length >= (classification === "artist_cv" ? 4 : 2)) return "complete_review_ready"
  return "substantial_review_ready"
}

test("acceptance manifest covers the required 17 document conditions", () => {
  assert.equal(cases.length, 17)
  for (const item of cases) {
    assert.ok(item.id)
    assert.ok(item.document_type)
    assert.ok(item.expected_quality.length)
    assert.ok(item.must_not_invent.length)
  }
})

test("seven-page CV with one generic claim is limited, never ready", () => {
  const quality = assess({
    classification: "artist_cv",
    totalPages: 7,
    pagesAnalyzed: [1,2,3,4,5,6,7],
    claims: [{ type: "mediums", layer: "factual" }],
    sections: [],
  })
  assert.equal(quality, "limited_analysis")
})

test("broad page-supported CV can be complete", () => {
  const claims = Array.from({ length: 12 }, (_, index) => ({ type: ["education", "exhibition", "award", "residency", "publication"][index % 5], layer: "factual" }))
  assert.equal(assess({ classification: "artist_cv", totalPages: 5, pagesAnalyzed: [1,2,3,4,5], claims, sections: ["education","exhibitions","awards","publications"] }), "complete_review_ready")
})

test("scanned document with thin visual evidence is visibly limited", () => {
  assert.equal(assess({ classification: "artist_cv", totalPages: 4, pagesAnalyzed: [1,2], unreadablePages: [3,4], claims: [{ type: "education", layer: "factual" }], sections: ["education"], textQuality: "scanned" }), "visual_reading_limited")
})

test("provider failure never becomes successful analysis", () => {
  assert.equal(assess({ classification: "artist_cv", totalPages: 4, pagesAnalyzed: [], claims: [], sections: [], providerAvailable: false }), "provider_unavailable")
})
