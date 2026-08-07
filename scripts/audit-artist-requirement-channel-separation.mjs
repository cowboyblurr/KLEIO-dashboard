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
requirePattern(requirementMedia, /\["document", "documents", "file", "upload", "mixed", "url_or_document"\]\.includes\(requirement\.input_type\)/, "Explicit document/file input types must qualify a requirement for the upload surface.")
requirePattern(requirementMedia, /requirement\.category === "supporting_document"/, "True supporting-document requirements must retain a safe file fallback.")
forbidPattern(requirementMedia, /\["supporting_document",\s*"biography",\s*"project_proposal",\s*"budget",\s*"portfolio"\]/, "Biography, proposal, budget, and portfolio categories must not create upload tasks merely from their category names.")
requirePattern(requirementMedia, /Written responses stay in the composer and portfolio works stay in the visual selector/, "The artist-facing copy must explain channel separation.")

requirePattern(composer, /"project_proposal"/, "Project proposal must remain recognized as a written-answer type.")
requirePattern(composer, /"budget"/, "Budget must remain recognized as a written-answer type when the source presents it as written input.")
requirePattern(composer, /\["portfolio", "work_samples", "artwork_images", "images", "image_list"\]/, "Portfolio/work-sample requirements must remain handled by the visual work selector.")

if (failures.length) {
  console.error("KLEIO requirement-channel separation audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO requirement-channel separation passed: explicit file requirements use the upload surface, written questions stay in the composer, portfolio stays in the visual selector, and category names alone cannot create duplicate artist tasks.")
