import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import ts from "typescript"

const root = process.cwd()

function loadTypeScriptModule(relativePath) {
  const filename = path.join(root, relativePath)
  const source = fs.readFileSync(filename, "utf8")
  const transpiled = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      strict: true,
    },
  }).outputText
  const commonJsModule = { exports: {} }
  const execute = new Function("exports", "module", "require", "__filename", "__dirname", transpiled)
  execute(commonJsModule.exports, commonJsModule, () => { throw new Error(`Unexpected runtime import while testing ${relativePath}`) }, filename, path.dirname(filename))
  return commonJsModule.exports
}

const { calculatePassportCompletion } = loadTypeScriptModule("lib/kleio-passport-completion.ts")
const { buildApplicationAlignmentDraft } = loadTypeScriptModule("lib/kleio-application-alignment.ts")

const completeProfile = {
  professional_name: "Synthetic Artist",
  location: "Miami, Florida",
  bio: "A synthetic biography used only for testing.",
  artist_statement: "My practice studies memory, archives, and inherited histories through material transformation.",
  practice_description: "I work with family records and altered photographs.",
  website_url: "https://example.test/artist",
  instagram_url: "https://example.test/social",
  disciplines: ["photography"],
  mediums: ["analog photography"],
  education: "Synthetic art education record.",
  exhibition_history: "Synthetic exhibition history.",
  awards: "",
  cv_file_path: "synthetic-user/cv/cv.pdf",
}

const completeWork = {
  id: "synthetic-work-1",
  artist_user_id: "synthetic-user",
  title: "Inherited Light",
  year: "2026",
  medium: "Analog photography and archival paper",
  dimensions: "24 × 30 in",
  description: "The work uses family archives to examine memory and inherited histories.",
  series: "Synthetic Test Series",
  tags: ["memory", "archives"],
  image_path: "synthetic-user/portfolio/work.jpg",
  image_url: null,
  sort_order: 0,
  created_at: "2026-08-05T00:00:00.000Z",
  updated_at: "2026-08-05T00:00:00.000Z",
}

test("Passport completion never reaches 100 when a critical category is missing", () => {
  const result = calculatePassportCompletion({ ...completeProfile, cv_file_path: null, education: "", exhibition_history: "" }, [completeWork])
  assert.equal(result.criticalComplete, false)
  assert.ok(result.percentage < 100)
  assert.ok(result.criticalMissing.some((category) => category.key === "cv"))
})

test("Removing the only usable artwork image lowers completion immediately", () => {
  const complete = calculatePassportCompletion(completeProfile, [completeWork])
  const withoutImage = calculatePassportCompletion(completeProfile, [{ ...completeWork, image_path: null }])
  assert.equal(complete.percentage, 100)
  assert.ok(withoutImage.percentage < complete.percentage)
  assert.ok(withoutImage.criticalMissing.some((category) => category.key === "artwork_images"))
})

test("Passport and opportunity readiness remain conceptually separate", () => {
  const result = calculatePassportCompletion(completeProfile, [completeWork])
  assert.equal("readiness" in result, false)
  assert.equal(result.criticalComplete, true)
  assert.equal(result.percentage, 100)
})

test("Alignment drafting uses supported opportunity and artist evidence", () => {
  const opportunity = {
    id: "synthetic-opportunity",
    title: "New Forms of Memory",
    summary: "A program about archives and inherited histories.",
    description: "Selected artists should connect memory, archives, and material transformation to their practice.",
    required_materials: ["Artist statement", "Three selected artworks"],
    requirements: [],
  }
  const draft = buildApplicationAlignmentDraft(opportunity, completeProfile, [completeWork])
  assert.match(draft.introduction, /New Forms of Memory/)
  assert.match(draft.introduction, /memory and archives/)
  assert.ok(draft.evidence.some((entry) => entry.supported))
  assert.ok(draft.evidence.every((entry) => !entry.supported || entry.artistEvidence.length > 0))
})

test("Alignment drafting refuses to invent a thematic connection", () => {
  const opportunity = {
    id: "synthetic-unrelated-opportunity",
    title: "Marine Engineering Research",
    summary: "A technical program about propulsion efficiency.",
    description: "Applicants must demonstrate marine engineering and turbine-design evidence.",
    required_materials: ["Engineering certification"],
    requirements: [],
  }
  const draft = buildApplicationAlignmentDraft(opportunity, completeProfile, [completeWork])
  assert.equal(draft.introduction, "")
  assert.ok(draft.missingContext.some((message) => /could not find a defensible thematic connection/i.test(message)))
})
