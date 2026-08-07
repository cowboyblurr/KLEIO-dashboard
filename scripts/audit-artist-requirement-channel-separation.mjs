import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const requirementMedia = fs.readFileSync(path.join(root, "components/kleio/application-requirement-media.tsx"), "utf8")
const composer = fs.readFileSync(path.join(root, "lib/kleio-application-composer.ts"), "utf8")
const failures = []

function requirePattern(content, pattern, message) {
  if (!pattern.test(content)) failures.push(message)
}

function forbidPattern(content, pattern, message) {
  if (pattern.test(content)) failures.push(message)
}

requirePattern(requirementMedia, /accepted_file_types\.length > 0/, "Explicit accepted file types must qualify a requirement for the upload surface.")
requirePattern(requirementMedia, /EXPLICIT_FILE_INPUTS/, "Explicit document/file input types must have a dedicated requirement channel.")
requirePattern(requirementMedia, /EXPLICIT_WRITTEN_INPUTS/, "Explicit written input types must have a dedicated requirement channel.")
requirePattern(requirementMedia, /if \(EXPLICIT_FILE_INPUTS\.includes\(requirement\.input_type\)\) return true[\s\S]*if \(EXPLICIT_WRITTEN_INPUTS\.includes\(requirement\.input_type\)\) return false/, "The upload surface must respect explicit source input type before category fallback.")
requirePattern(requirementMedia, /requirement\.category === "supporting_document"/, "True supporting-document requirements may retain a fallback only when no explicit written input overrides it.")
forbidPattern(requirementMedia, /\["supporting_document",\s*"biography",\s*"project_proposal",\s*"budget",\s*"portfolio"\]/, "Biography, proposal, budget, and portfolio categories must not create upload tasks merely from their category names.")
requirePattern(requirementMedia, /Written responses stay in the composer and portfolio works stay in the visual selector/, "The artist-facing copy must explain channel separation.")

requirePattern(composer, /explicitWrittenInputTypes/, "Composer must recognize explicit written input types before semantic labels.")
requirePattern(composer, /explicitFileInputTypes/, "Composer must recognize explicit file input types before semantic labels.")
requirePattern(composer, /if \(explicitWrittenInputTypes\.has\(inputType\)\) return true[\s\S]*if \(explicitFileInputTypes\.has\(inputType\)\) return false/, "A document-only budget or proposal must not become an unnecessary textarea simply because of its material key.")
requirePattern(composer, /accepted_file_types\?\.length/, "Accepted file types must prevent a file-only requirement from being inferred as written when input type is otherwise ambiguous.")
requirePattern(composer, /inputType === "mixed"/, "Source-declared mixed requirements must remain intentionally capable of both written and file work.")
requirePattern(composer, /"project_proposal"/, "Project proposal must remain recognized as a written-answer type when the source does not specify a file-only input.")
requirePattern(composer, /"budget"/, "Budget must remain recognized as a written-answer type when the source presents it as written input.")
requirePattern(composer, /\["portfolio", "work_samples", "artwork_images", "images", "image_list"\]/, "Portfolio/work-sample requirements must remain handled by the visual work selector.")

if (failures.length) {
  console.error("KLEIO requirement-channel separation audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO requirement-channel separation passed: explicit source input type wins over semantic labels; file requirements use the upload surface, written questions stay in the composer, portfolio stays in the visual selector, and source-declared mixed/package requirements may intentionally require more than one channel without being mistaken for redundant UI.")
