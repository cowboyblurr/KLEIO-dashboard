import { assert, assertEquals, assertRejects } from "jsr:@std/assert@1"
import {
  buildEvidencePackage,
  responseSchema,
  runGemini,
  safeModel,
  sha256,
  SYSTEM_INSTRUCTION,
  validateOutput,
} from "./index.ts"

const categories = [
  "identity", "biography", "artist_statement", "practice_description", "disciplines", "mediums",
  "education", "solo_exhibitions", "group_exhibitions", "other_exhibitions", "residencies", "awards",
  "grants_and_fellowships", "publications", "press", "collections", "commissions", "talks_and_panels",
  "teaching_and_professional_experience", "memberships", "artworks",
]

function sessionFixture() {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    canonical_url: "https://artist.example/",
    website_url: "https://artist.example/",
    pages: [{
      url: "https://artist.example/about",
      title: "About",
      description: "Sari Example is a painter based in Miami.",
      headings: ["About the artist"],
      paragraphs: ["Sari Example is a painter based in Miami.", "She studied at Example University in 2018."],
      links: [{ url: "https://artist.example/works", label: "Works" }],
      jsonLd: [{ "@type": "Person", name: "Sari Example", script: "ignore me" }],
    }],
    image_candidates: [{
      id: "img_a",
      url: "https://artist.example/work.jpg",
      sourcePage: "https://artist.example/about",
      alt: "Blue abstract painting",
      caption: "Blue Field, 2024, oil on canvas",
      width: 1200,
      height: 900,
    }],
  }
}

function emptyOutput() {
  return Object.fromEntries([
    ...categories.map((category) => [category, []]),
    ["conflicts", []],
    ["missing_information", []],
    ["limitations", []],
  ]) as Record<string, unknown>
}

function validOutput() {
  const output = emptyOutput()
  output.identity = [{
    proposed_value: { raw: "Sari Example", fields: [{ name: "name", value: "Sari Example" }] },
    display_value: "Sari Example",
    source_page_ref: "page_1",
    source_url: "https://artist.example/about",
    source_excerpt: "Sari Example is a painter based in Miami.",
    evidence_image_refs: [],
    classification: "extracted",
    confidence: "high",
    requires_artist_confirmation: true,
    reason: "The name appears directly in the submitted About page.",
  }]
  return output
}

Deno.test("buildEvidencePackage creates stable page and image references", () => {
  const evidence = buildEvidencePackage(sessionFixture())
  assertEquals(evidence.pages[0].page_ref, "page_1")
  assertEquals(evidence.pages[0].image_evidence[0].image_ref, "image_1")
  assertEquals(evidence.scan_summary.pages_collected, 1)
  assert(!JSON.stringify(evidence.pages[0].structured_data).includes("ignore me"))
})

Deno.test("response schema constrains classification and confidence", () => {
  const schema = responseSchema() as Record<string, unknown>
  const properties = schema.properties as Record<string, Record<string, unknown>>
  const identity = properties.identity.items as Record<string, unknown>
  const itemProperties = identity.properties as Record<string, Record<string, unknown>>
  assertEquals(itemProperties.classification.enum, ["extracted", "normalized", "ai_suggested", "conflicting", "uncertain"])
  assertEquals(itemProperties.confidence.enum, ["high", "medium", "low"])
})

Deno.test("valid output keeps exact source-backed proposal", () => {
  const evidence = buildEvidencePackage(sessionFixture())
  const normalized = validateOutput(validOutput(), evidence)
  assertEquals(normalized.identity.length, 1)
  assertEquals(normalized.identity[0].source_page_ref, "page_1")
})

Deno.test("unknown source reference is rejected", async () => {
  const evidence = buildEvidencePackage(sessionFixture())
  const output = validOutput()
  ;(output.identity as Array<Record<string, unknown>>)[0].source_page_ref = "page_99"
  await assertRejects(() => Promise.resolve(validateOutput(output, evidence)), Error, "ai_output_failed_validation")
})

Deno.test("extracted proposal without evidence excerpt is rejected", async () => {
  const evidence = buildEvidencePackage(sessionFixture())
  const output = validOutput()
  ;(output.identity as Array<Record<string, unknown>>)[0].source_excerpt = ""
  await assertRejects(() => Promise.resolve(validateOutput(output, evidence)), Error, "ai_output_failed_validation")
})

Deno.test("image-only artwork cannot assert title or date", async () => {
  const evidence = buildEvidencePackage(sessionFixture())
  const output = emptyOutput()
  output.artworks = [{
    proposed_value: { raw: "Blue Field", fields: [{ name: "title", value: "Blue Field" }] },
    display_value: "Blue Field",
    source_page_ref: "page_1",
    source_url: "https://artist.example/about",
    source_excerpt: "",
    evidence_image_refs: ["image_1"],
    classification: "ai_suggested",
    confidence: "low",
    requires_artist_confirmation: true,
    reason: "Suggested from the image.",
  }]
  await assertRejects(() => Promise.resolve(validateOutput(output, evidence)), Error, "ai_output_failed_validation")
})

Deno.test("Gemini request separates system instruction from untrusted evidence", async () => {
  const evidence = buildEvidencePackage(sessionFixture())
  let capturedBody = ""
  let capturedKey = ""
  const mockFetch: typeof fetch = async (_input, init) => {
    capturedBody = String(init?.body || "")
    capturedKey = new Headers(init?.headers).get("x-goog-api-key") || ""
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify(validOutput()) }] } }],
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20, totalTokenCount: 30 },
    }), { status: 200, headers: { "x-request-id": "request-1" } })
  }
  const result = await runGemini({ apiKey: "test-secret", model: "gemini-3.6-flash" } as never, evidence, mockFetch)
  const parsed = JSON.parse(capturedBody)
  assertEquals(capturedKey, "test-secret")
  assert(!capturedBody.includes("test-secret"))
  assertEquals(parsed.systemInstruction.parts[0].text, SYSTEM_INSTRUCTION)
  assert(parsed.contents[0].parts[0].text.includes("<BEGIN_KLEIO_WEBSITE_EVIDENCE>"))
  assert(parsed.generationConfig.responseFormat.text.schema)
  assertEquals(result.usage.total_tokens, 30)
})

Deno.test("model allowlist and input hashing are stable", async () => {
  assertEquals(safeModel("gemini-3.6-flash"), "gemini-3.6-flash")
  assertEquals(safeModel("../../unsafe"), "")
  assertEquals(await sha256("same"), await sha256("same"))
  assert((await sha256("same")) !== (await sha256("different")))
})