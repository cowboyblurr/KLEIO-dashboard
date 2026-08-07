import test from "node:test"
import assert from "node:assert/strict"
import {
  evaluatePassportCoverage,
  mergeRepairIntoSynthesis,
  stableSynthesisFingerprint,
} from "../supabase/functions/_shared/passport-synthesis-qa.mjs"

const factualEvidence = [
  { target_field: "mediums", claim_type: "medium", tags: ["photography", "film", "video"] },
  { target_field: "disciplines", claim_type: "discipline", tags: ["photography", "moving_image"] },
]

test("explicit medium and discipline evidence cannot silently become empty Passport fields", () => {
  const result = evaluatePassportCoverage({ evidence: factualEvidence, synthesis: { mediums: [], disciplines: [] } })
  assert.deepEqual(result.retry_fields.sort(), ["disciplines", "mediums"])
  assert.equal(result.status, "REPAIR_REQUIRED")
})

test("supported medium and discipline output passes deterministic coverage QA", () => {
  const synthesis = {
    mediums: [{ value: "Photography", evidence_refs: ["ev-1"] }, { value: "Film", evidence_refs: ["ev-2"] }, { value: "Video", evidence_refs: ["ev-3"] }],
    disciplines: [{ value: "Photography", evidence_refs: ["ev-1"] }, { value: "Moving Image", evidence_refs: ["ev-2"] }],
  }
  const result = evaluatePassportCoverage({ evidence: factualEvidence, synthesis })
  assert.ok(!result.retry_fields.includes("mediums"))
  assert.ok(!result.retry_fields.includes("disciplines"))
})

test("sparse evidence produces artist-input state instead of a forced hallucinated field", () => {
  const result = evaluatePassportCoverage({ evidence: [{ target_field: "education", claim_type: "education_record" }], synthesis: {} })
  const themes = result.fields.find((item) => item.field === "themes")
  assert.equal(themes?.status, "NEEDS_ARTIST_INPUT")
  assert.ok(!result.retry_fields.includes("themes"))
})

test("targeted repair merges only supported requested fields", () => {
  const initial = { mediums: [], disciplines: [{ value: "Photography", evidence_refs: ["ev-1"] }] }
  const repaired = mergeRepairIntoSynthesis(initial, {
    repairs: [{
      field: "mediums",
      kind: "list",
      values: [{ value: "Photography", evidence_refs: ["ev-1"], classification: "EXTRACTED_FACT", confidence: 0.95 }],
    }],
  })
  assert.equal(repaired.mediums[0].value, "Photography")
  assert.equal(repaired.disciplines[0].value, "Photography")
})

test("synthesis cache fingerprint changes with document version, pipeline version, or model", () => {
  const a = stableSynthesisFingerprint({ checksum: "abc", documentVersion: 1, synthesisVersion: "v2", model: "flash" })
  assert.equal(a, stableSynthesisFingerprint({ checksum: "abc", documentVersion: 1, synthesisVersion: "v2", model: "flash" }))
  assert.notEqual(a, stableSynthesisFingerprint({ checksum: "abc", documentVersion: 2, synthesisVersion: "v2", model: "flash" }))
  assert.notEqual(a, stableSynthesisFingerprint({ checksum: "abc", documentVersion: 1, synthesisVersion: "v3", model: "flash" }))
  assert.notEqual(a, stableSynthesisFingerprint({ checksum: "abc", documentVersion: 1, synthesisVersion: "v2", model: "pro" }))
})
