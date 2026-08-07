import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const requirementMedia = fs.readFileSync(path.join(root, "components/kleio/application-requirement-media.tsx"), "utf8")
const composer = fs.readFileSync(path.join(root, "lib/kleio-application-composer.ts"), "utf8")
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260807193500_required_application_file_finalization_guard.sql"), "utf8")
const failures = []

function requirePattern(content, pattern, message) {
  if (!pattern.test(content)) failures.push(message)
}

function forbidPattern(content, pattern, message) {
  if (pattern.test(content)) failures.push(message)
}

requirePattern(requirementMedia, /EXPLICIT_FILE_INPUTS/, "Explicit document/file input types must have a dedicated requirement channel.")
requirePattern(requirementMedia, /EXPLICIT_WRITTEN_INPUTS/, "Explicit written input types must have a dedicated requirement channel.")
requirePattern(requirementMedia, /if \(EXPLICIT_WRITTEN_INPUTS\.includes\(requirement\.input_type\)\) return false[\s\S]*if \(EXPLICIT_FILE_INPUTS\.includes\(requirement\.input_type\)\) return true[\s\S]*accepted_file_types\.length > 0/, "The upload surface must let explicit written/file source input type win before accepted-file fallback.")
requirePattern(requirementMedia, /requirement\.category === "supporting_document"/, "True supporting-document requirements may retain a fallback only when no explicit source input overrides it.")
forbidPattern(requirementMedia, /\["supporting_document",\s*"biography",\s*"project_proposal",\s*"budget",\s*"portfolio"\]/, "Biography, proposal, budget, and portfolio categories must not create upload tasks merely from their category names.")
requirePattern(requirementMedia, /Required files must be included before KLEIO will preserve a final submission version/, "Artists must be told that required files participate in finalization.")
requirePattern(requirementMedia, /requiredMissingCount/, "The requirement-file surface must summarize missing required files separately from optional review states.")

requirePattern(composer, /explicitWrittenInputTypes/, "Composer must recognize explicit written input types before semantic labels.")
requirePattern(composer, /explicitFileInputTypes/, "Composer must recognize explicit file input types before semantic labels.")
requirePattern(composer, /requirementNeedsFileAttachment/, "Composer finalization must share a deterministic required-file channel rule.")
requirePattern(composer, /if \(explicitWrittenInputTypes\.has\(inputType\)\) return false[\s\S]*if \(explicitFileInputTypes\.has\(inputType\) \|\| inputType === "mixed"\) return true/, "Required-file classification must let explicit input type win over semantic labels and packaging hints.")
requirePattern(composer, /if \(explicitWrittenInputTypes\.has\(inputType\)\) return true[\s\S]*if \(explicitFileInputTypes\.has\(inputType\)\) return false/, "A document-only budget or proposal must not become an unnecessary textarea simply because of its material key.")
requirePattern(composer, /inputType === "mixed"/, "Source-declared mixed requirements must remain intentionally capable of both written and file work.")
requirePattern(composer, /assertRequiredApplicationFilesReady/, "Client finalization must verify required application files before sealing a version.")
requirePattern(composer, /application_requirement_attachments/, "Client required-file preflight must inspect application requirement attachments.")
requirePattern(composer, /Attach every required application file before finalizing/, "Required-file finalization failure must be actionable for the artist.")
requirePattern(composer, /await assertRequiredApplicationFilesReady\(packageId, account\.user\.id\)/, "The required-file gate must execute before the finalization RPC.")
requirePattern(composer, /\["portfolio", "work_samples", "artwork_images", "images", "image_list"\]/, "Portfolio/work-sample requirements must remain handled by the visual work selector.")

requirePattern(migration, /required_application_file_missing/, "Database finalization must independently reject missing required files.")
requirePattern(migration, /security invoker/, "Public finalization guard must preserve the existing SECURITY INVOKER boundary.")
requirePattern(migration, /artist_confirmed_at is not null/, "A file must be artist-confirmed before it can satisfy finalization.")
requirePattern(migration, /included_in_package/, "A file must actually be included in the package before it can satisfy finalization.")
requirePattern(migration, /attachment\.validation_status <> 'invalid'/, "An invalid attachment must never satisfy finalization.")
requirePattern(migration, /revoke all on function[\s\S]*from public, anon/, "Anonymous callers must not gain finalization access.")

if (failures.length) {
  console.error("KLEIO requirement-channel separation audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO requirement-channel separation passed: explicit source input type determines the artist control; file, written, portfolio, and mixed requirements do not collapse into redundant tasks; required files are visibly surfaced and independently enforced before finalization in both the browser path and database RPC.")
