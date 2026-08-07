import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const sourceRoots = ["app", "components"]
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"])
const findings = []

function walk(directory) {
  if (!fs.existsSync(directory)) return []
  const output = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) output.push(...walk(absolute))
    else if (extensions.has(path.extname(entry.name))) output.push(absolute)
  }
  return output
}

function relative(file) {
  return path.relative(root, file).replaceAll(path.sep, "/")
}

function add(file, message, excerpt = "") {
  findings.push({ file: relative(file), message, excerpt: excerpt.replace(/\s+/g, " ").trim().slice(0, 180) })
}

const explicitPdfAnalyzerFiles = new Set([
  "components/kleio/artist-document-intelligence.tsx",
  "components/kleio/artist-document-intelligence-spanish.tsx",
])

const specializedImageFiles = [
  /profile/i,
  /avatar/i,
  /cover/i,
  /logo/i,
  /brand/i,
]

const genericPdfCopy = [
  /\bUpload PDF(?: document)?\b/gi,
  /\bUpload CV(?: as PDF)?\b/gi,
  /\bCV as PDF\b/gi,
  /\bdirect PDF upload\b/gi,
  /\bPDF-only\b/gi,
  /\bonly (?:accepts?|supports?) PDF\b/gi,
  /\bPDF upload\b/gi,
]

for (const file of sourceRoots.flatMap((directory) => walk(path.join(root, directory)))) {
  const rel = relative(file)
  const content = fs.readFileSync(file, "utf8")

  if (!explicitPdfAnalyzerFiles.has(rel)) {
    for (const pattern of genericPdfCopy) {
      for (const match of content.matchAll(pattern)) add(file, "Generic upload copy implies PDF/CV is the only upload path.", match[0])
    }
  }

  const inputTags = content.match(/<input[\s\S]*?>/gi) ?? []
  for (const tag of inputTags) {
    if (!/\btype\s*=\s*["']file["']/i.test(tag)) continue
    const acceptMatch = tag.match(/\baccept\s*=\s*["']([^"']+)["']/i)
    if (!acceptMatch) continue
    const values = acceptMatch[1].split(",").map((value) => value.trim().toLowerCase()).filter(Boolean)
    const onlyPdf = values.length > 0 && values.every((value) => value === "application/pdf" || value === ".pdf")
    const onlyImages = values.length > 0 && values.every((value) => value.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"].includes(value))
    if (onlyPdf && !explicitPdfAnalyzerFiles.has(rel)) add(file, "Generic file input is restricted to PDF instead of the shared media/material picker.", tag)
    if (onlyImages && !specializedImageFiles.some((pattern) => pattern.test(rel)) && !rel.includes("instagram")) add(file, "Non-specialized upload surface is image-only instead of supporting artwork media formats.", tag)
  }
}

const architecturePath = path.join(root, "lib/kleio-universal-media.ts")
if (fs.existsSync(architecturePath)) {
  const architecture = fs.readFileSync(architecturePath, "utf8")
  for (const expected of ["device_image", "device_document", "device_video", "device_audio"]) {
    if (!architecture.includes(expected)) add(architecturePath, `Shared upload contract must recognize ${expected}.`)
  }
  for (const mime of ["video/mp4", "video/quicktime", "audio/mpeg", "audio/wav", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]) {
    if (!architecture.includes(mime)) add(architecturePath, `Shared upload validation must recognize ${mime}.`)
  }
}

const availabilityPath = path.join(root, "lib/kleio-import-source-availability.ts")
if (fs.existsSync(availabilityPath)) {
  const availability = fs.readFileSync(availabilityPath, "utf8")
  for (const expected of ["device_image", "device_document", "device_video", "device_audio"]) {
    if (!availability.includes(`${expected}: true`)) add(availabilityPath, `Direct ${expected.replace("device_", "")} upload must be enabled in the artist beta.`)
  }
}

const mediaLibraryPath = path.join(root, "components/kleio/artist-media-library.tsx")
if (fs.existsSync(mediaLibraryPath)) {
  const mediaLibrary = fs.readFileSync(mediaLibraryPath, "utf8")
  if (!mediaLibrary.includes('"video"')) add(mediaLibraryPath, "Media Library must expose a video filter/state.")
  if (!mediaLibrary.includes('"audio"')) add(mediaLibraryPath, "Media Library must expose an audio filter/state.")
  if (/Upload PDF(?: document)?/i.test(mediaLibrary)) add(mediaLibraryPath, "Media Library CTA must say media/material, not PDF document.")
}

const portfolioPath = path.join(root, "components/kleio/visual-artist-portfolio-studio.tsx")
if (fs.existsSync(portfolioPath)) {
  const portfolio = fs.readFileSync(portfolioPath, "utf8")
  if (/Upload several images/i.test(portfolio)) add(portfolioPath, "Portfolio upload guidance must include video/audio artwork, not only images.")
  if (/Review one image at a time/i.test(portfolio)) add(portfolioPath, "Portfolio review guidance must refer to works/media, not only images.")
}

if (findings.length) {
  console.error(`Upload surface consistency audit found ${findings.length} issue${findings.length === 1 ? "" : "s"}:\n`)
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.message}${finding.excerpt ? `\n  ↳ ${finding.excerpt}` : ""}`)
  }
  process.exit(1)
}

console.log("Upload surface consistency audit passed: generic KLEIO upload surfaces use media/material language, specialized controls remain context-specific, and the shared contract supports image, document, video, and audio uploads.")
