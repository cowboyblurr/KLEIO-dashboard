import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const failures = []

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8")
}

function requireText(relativePath, pattern, message) {
  const content = read(relativePath)
  if (!(typeof pattern === "string" ? content.includes(pattern) : pattern.test(content))) {
    failures.push(`${relativePath}: ${message}`)
  }
}

function forbidText(relativePath, pattern, message) {
  const content = read(relativePath)
  if (typeof pattern === "string" ? content.includes(pattern) : pattern.test(content)) {
    failures.push(`${relativePath}: ${message}`)
  }
}

requireText("lib/kleio-file-validation.ts", "0xff, 0xd8, 0xff", "JPEG validation must check the file signature")
requireText("lib/kleio-file-validation.ts", "0x89, 0x50, 0x4e, 0x47", "PNG validation must check the file signature")
requireText("lib/kleio-file-validation.ts", "0x52, 0x49, 0x46, 0x46", "WebP validation must check the RIFF signature")
requireText("lib/kleio-file-validation.ts", "0x25, 0x50, 0x44, 0x46, 0x2d", "PDF validation must check the PDF signature")
requireText("lib/kleio-file-validation.ts", "file.size === 0", "empty files must be rejected")

requireText("lib/kleio-profile-presentation.ts", "validateRasterImageFile", "authenticated profile uploads must use signature validation")
requireText("lib/kleio-pending-profile-image.ts", "validateRasterImageFile", "pre-confirmation profile uploads must use signature validation")

const migration = "supabase/migrations/20260731131500_artist_beta_least_privilege_and_upload_hardening.sql"
requireText(migration, "revoke all privileges on table %I.%I from anon", "anonymous table privileges must be reset to an allowlist")
requireText(migration, "revoke truncate, references, trigger", "authenticated clients must not retain schema-management-adjacent table privileges")
requireText(migration, "revoke all on function public.save_my_artist_draft", "draft RPC execution must be authenticated-only")
forbidText(migration, "image/svg+xml", "active SVG uploads must remain disabled for the initial beta")

if (failures.length) {
  console.error("KLEIO file upload safety audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO file upload safety audit passed.")
