import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const findings = []
const sourceRoots = ["app", "components"]
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"])

function walk(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(absolute) : extensions.has(path.extname(entry.name)) ? [absolute] : []
  })
}
function rel(file) { return path.relative(root, file).replaceAll(path.sep, "/") }
function fail(file, message, excerpt = "") { findings.push({ file: rel(file), message, excerpt: excerpt.replace(/\s+/g, " ").trim().slice(0, 180) }) }

// These surfaces are deliberately PDF-specific because they perform PDF document analysis,
// not generic media upload. A profile/avatar/logo control may likewise remain image-specific.
const pdfAnalysisSurfaces = new Set([
  "components/kleio/artist-document-intelligence.tsx",
  "components/kleio/artist-document-intelligence-spanish.tsx",
  "components/kleio/document-draft-studio.tsx",
])
const specializedImagePath = /(profile|avatar|cover|logo|brand|instagram)/i

const genericPdfOnlyCopy = [
  /\bdirect PDF upload is the active import method\b/gi,
  /\bPDF only during the initial beta\b/gi,
  /\bSolo PDF durante la beta inicial\b/gi,
  /\bUpload PDF document\b/gi,
  /\bUpload CV or artist document\b/gi,
  /\bSubir CV o documento artístico\b/gi,
]

for (const file of sourceRoots.flatMap((directory) => walk(path.join(root, directory)))) {
  const relative = rel(file)
  const content = fs.readFileSync(file, "utf8")
  if (!pdfAnalysisSurfaces.has(relative)) {
    for (const pattern of genericPdfOnlyCopy) {
      for (const match of content.matchAll(pattern)) fail(file, "Generic upload copy still frames KLEIO as PDF/CV-only.", match[0])
    }
  }

  for (const tag of content.match(/<input[\s\S]*?>/gi) ?? []) {
    if (!/\btype\s*=\s*["']file["']/i.test(tag)) continue
    const accept = tag.match(/\baccept\s*=\s*["']([^"']+)["']/i)?.[1]
    if (!accept) continue
    const values = accept.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean)
    const onlyPdf = values.length > 0 && values.every((value) => ["application/pdf", ".pdf"].includes(value))
    const onlyImage = values.length > 0 && values.every((value) => value.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"].includes(value))
    if (onlyPdf && !pdfAnalysisSurfaces.has(relative) && !/live-artist-workspace\.tsx$/.test(relative)) fail(file, "Generic file input is restricted to PDF instead of using the shared media/material picker.", tag)
    if (onlyImage && !specializedImagePath.test(relative) && !/live-artist-workspace\.tsx$/.test(relative)) fail(file, "Non-specialized upload input is image-only instead of using the shared artwork/media picker.", tag)
  }
}

const typesFile = fs.readFileSync(path.join(root, "lib/kleio-media-file-types.ts"), "utf8")
for (const token of ["video/mp4", "audio/mpeg", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg"]) {
  if (!typesFile.includes(token)) fail(path.join(root, "lib/kleio-media-file-types.ts"), `Shared media contract is missing ${token}.`)
}

const availabilityFile = fs.readFileSync(path.join(root, "lib/kleio-import-source-availability.ts"), "utf8")
for (const source of ["device_image", "device_document", "device_video", "device_audio"]) {
  if (!new RegExp(`${source}:\\s*true`).test(availabilityFile)) fail(path.join(root, "lib/kleio-import-source-availability.ts"), `${source} must be enabled for direct artist upload.`)
}

const picker = fs.readFileSync(path.join(root, "components/kleio/media-import/quick-media-import.tsx"), "utf8")
for (const expected of ["KLEIO_GENERAL_UPLOAD_MIME_TYPES", "KLEIO_ARTWORK_MEDIA_MIME_TYPES", "uploadDeviceMediaToLibrary", "device_video", "device_audio"]) {
  if (!picker.includes(expected)) fail(path.join(root, "components/kleio/media-import/quick-media-import.tsx"), `Shared picker must include ${expected}.`)
}

const requirementPicker = fs.readFileSync(path.join(root, "components/kleio/application-requirement-file-picker.tsx"), "utf8")
if (!requirementPicker.includes("AudioLines") || !requirementPicker.includes("Video")) fail(path.join(root, "components/kleio/application-requirement-file-picker.tsx"), "Application requirement picker must understand audio and video material.")

const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260807195500_media_upload_contract_all_supported_materials.sql"), "utf8")
for (const expected of ["device_video", "device_audio", "52428800", "video/mp4", "audio/mpeg"]) {
  if (!migration.includes(expected)) fail(path.join(root, "supabase/migrations/20260807195500_media_upload_contract_all_supported_materials.sql"), `Backend media migration is missing ${expected}.`)
}

if (findings.length) {
  console.error(`Upload surface consistency audit found ${findings.length} issue${findings.length === 1 ? "" : "s"}:`)
  for (const finding of findings) console.error(`- ${finding.file}: ${finding.message}${finding.excerpt ? `\n  ↳ ${finding.excerpt}` : ""}`)
  process.exit(1)
}
console.log("Upload surface consistency audit passed: generic upload surfaces use media/material language; image/PDF-only controls remain only where the destination itself is specialized; direct upload supports images, documents, video, and audio.")
