export const PASSPORT_SYNTHESIS_FIELDS = [
  "bio",
  "artist_statement",
  "practice_description",
  "disciplines",
  "mediums",
  "themes",
  "visual_language",
  "application_keywords",
  "education",
  "exhibitions",
  "awards",
  "residencies",
]

const FIELD_RULES = {
  bio: ["bio", "biography", "artist_biography", "professional_name", "birth_place_and_year", "career_highlight"],
  artist_statement: ["artist_statement", "statement", "artist_authored", "practice_description", "conceptual_narrative", "theme", "conceptual"],
  practice_description: ["practice_description", "practice", "discipline", "medium", "material", "process", "artwork", "artwork_metadata", "project", "conceptual_narrative"],
  disciplines: ["discipline", "disciplines", "artform", "art_form", "practice", "artwork_metadata"],
  mediums: ["medium", "mediums", "material", "materials", "process", "technique", "format", "artwork_metadata"],
  themes: ["theme", "themes", "concept", "conceptual", "conceptual_narrative", "subject", "motif", "visual_observation", "artist_statement", "artwork_metadata"],
  visual_language: ["visual_language", "formal", "composition", "palette", "texture", "motif", "visual_observation", "artwork", "artwork_metadata"],
  application_keywords: ["keyword", "discipline", "medium", "material", "theme", "skill", "practice", "artwork", "artwork_metadata", "conceptual_narrative"],
  education: ["education", "training", "degree", "school", "university"],
  exhibitions: ["exhibition", "exhibitions", "solo_exhibitions", "group_exhibitions", "art_fair_participation", "show", "venue"],
  awards: ["award", "awards", "awards_and_honors", "grant", "fellowship", "prize"],
  residencies: ["residency", "residencies", "residency_program", "resident_artist"],
}

function normalized(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function evidenceText(item) {
  if (!item || typeof item !== "object") return ""
  const tags = Array.isArray(item.tags) ? item.tags : []
  return [
    item.target_field,
    item.claim_type,
    item.target_section,
    item.category,
    item.source_section,
    ...tags,
  ].map(normalized).filter(Boolean).join(" ")
}

function addCanonicalFieldTag(item, field) {
  if (!item || typeof item !== "object" || !Array.isArray(item.tags)) return
  if (!item.tags.includes(field)) item.tags.push(field)
}

export function evidenceSupportsField(evidence, field) {
  const rules = FIELD_RULES[field] ?? [field]
  const normalizedRules = rules.map(normalized)
  return (Array.isArray(evidence) ? evidence : []).some((item) => {
    const haystack = evidenceText(item)
    const supported = normalizedRules.some((rule) => haystack.includes(rule))
    // coverageEvidence deliberately reuses each EvidenceItem.supports_fields array as `tags`.
    // Canonicalizing the matched field here means the later bounded repair pass can select
    // the same evidence by exact Passport field without repeating semantic matching logic.
    if (supported) addCanonicalFieldTag(item, field)
    return supported
  })
}

export function synthesisFieldHasValue(synthesis, field) {
  if (!synthesis || typeof synthesis !== "object") return false
  const value = synthesis[field]
  if (Array.isArray(value)) return value.some((entry) => {
    if (typeof entry === "string") return Boolean(entry.trim())
    return Boolean(entry && typeof entry === "object" && String(entry.value ?? "").trim())
  })
  if (value && typeof value === "object") return Boolean(String(value.text ?? value.value ?? "").trim())
  return Boolean(String(value ?? "").trim())
}

export function evaluatePassportCoverage({ evidence = [], synthesis = {} } = {}) {
  const fields = PASSPORT_SYNTHESIS_FIELDS.map((field) => {
    const evidenceAvailable = evidenceSupportsField(evidence, field)
    const outputPresent = synthesisFieldHasValue(synthesis, field)
    return {
      field,
      evidence_available: evidenceAvailable,
      output_present: outputPresent,
      status: outputPresent ? "PASS" : evidenceAvailable ? "RETRY_REQUIRED" : "NEEDS_ARTIST_INPUT",
    }
  })
  const retryFields = fields.filter((item) => item.status === "RETRY_REQUIRED").map((item) => item.field)
  const draftedFields = fields.filter((item) => item.output_present).map((item) => item.field)
  const needsInputFields = fields.filter((item) => item.status === "NEEDS_ARTIST_INPUT").map((item) => item.field)
  return {
    fields,
    retry_fields: retryFields,
    drafted_fields: draftedFields,
    needs_input_fields: needsInputFields,
    status: retryFields.length ? "REPAIR_REQUIRED" : "PASS",
  }
}

export function stableSynthesisFingerprint({ checksum = "", documentVersion = 1, synthesisVersion = "", model = "" } = {}) {
  return [checksum, Number(documentVersion) || 1, synthesisVersion, model].map((value) => String(value).trim()).join(":")
}

export function mergeRepairIntoSynthesis(synthesis, repair) {
  const next = { ...(synthesis && typeof synthesis === "object" ? synthesis : {}) }
  for (const item of Array.isArray(repair?.repairs) ? repair.repairs : []) {
    if (!item || typeof item !== "object") continue
    const field = String(item.field ?? "")
    if (!PASSPORT_SYNTHESIS_FIELDS.includes(field)) continue
    if (item.kind === "draft") {
      const text = String(item.text ?? "").trim()
      const refs = Array.isArray(item.evidence_refs) ? item.evidence_refs : []
      if (text && refs.length) next[field] = { text, evidence_refs: refs, classification: item.classification || "SUPPORTED_SYNTHESIS" }
    } else if (item.kind === "list") {
      const values = Array.isArray(item.values) ? item.values.filter((entry) => entry && typeof entry === "object" && String(entry.value ?? "").trim()) : []
      if (values.length) next[field] = values
    }
  }
  return next
}
