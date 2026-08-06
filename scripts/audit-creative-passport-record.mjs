import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const workspacePath = path.join(root, "components/kleio/creative-passport-workspace.tsx")
const source = fs.readFileSync(workspacePath, "utf8")
const failures = []

const requirePattern = (pattern, message) => {
  if (!pattern.test(source)) failures.push(message)
}
const forbidPattern = (pattern, message) => {
  if (pattern.test(source)) failures.push(message)
}

requirePattern(/type Mode = "overview" \| "edit" \| "institution"/, "Creative Passport must expose a dedicated institution preview mode.")
requirePattern(/function PassportHeader/, "Creative Passport must use a reusable compact record header.")
requirePattern(/function PassportNarrative/, "Approved biography, practice and statement must render as an assembled narrative.")
requirePattern(/Professional summary/, "The assembled Passport must expose a professional summary section.")
requirePattern(/Practice overview/, "The assembled Passport must expose a compact practice overview.")
requirePattern(/Career record/, "The assembled Passport must expose a professional career record.")
requirePattern(/Selected work/, "The assembled Passport must expose approved selected work.")
requirePattern(/Documents and readiness/, "The assembled Passport must expose document availability without raw paths.")
requirePattern(/Continue building your Passport/, "Partially completed Passports must preserve approved content and show contextual next actions.")
requirePattern(/Preview for institution/, "Artists must be able to enter institution preview deliberately.")
requirePattern(/Private preview only\. This is not public, verified or evidence-facing\./, "Institution preview must state its privacy and non-verification boundaries.")
requirePattern(/uses only the artist-approved Passport record/, "Institution preview must state that it uses approved information only.")
requirePattern(/pendingReviewCount > 0/, "Review suggestions must appear only when suggestions exist.")
requirePattern(/data-passport-scroll-owner="creative-passport"/, "The existing single-scroll edit contract must remain intact.")
requirePattern(/<AdaptiveArtistPassportExperience \/>/, "The established field-level Gemini review editor must remain integrated.")
requirePattern(/if \(!meaningful\) return <EmptyPassportPreview/, "Almost-empty Passports must show a guided visual preview rather than a blank form.")
requirePattern(/Artist Profile remains the curated public-facing presentation/, "Creative Passport and Artist Profile must remain explicitly distinct.")
forbidPattern(/aria-label="Passport summary"/, "The default Passport view must not regress into a metric summary dashboard.")
forbidPattern(/if \(!meaningful \|\| pendingReviewCount > 0\) setMode\("edit"\)/, "Empty or suggestion-bearing Passports must not be forced directly into edit mode.")
forbidPattern(/cv_file_path\}/, "Raw private CV storage paths must never be rendered.")

if (failures.length) {
  console.error("KLEIO Creative Passport record audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO Creative Passport record audit passed: approved content renders first, partial and empty states remain contextual, institution preview is bounded, the public/private distinction is explicit, and the existing single-scroll Gemini editor is preserved.")
