import fs from "node:fs"
import path from "node:path"

const failures = []
const root = process.cwd()

function collect(dir) {
  const full = path.join(root, dir)
  if (!fs.existsSync(full)) return []
  const results = []
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const relative = path.join(dir, entry.name)
    if (entry.isDirectory()) results.push(...collect(relative))
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) results.push(relative)
  }
  return results
}

const artistUiFiles = [...collect("components/kleio"), ...collect("app/artist-dashboard")]
for (const file of artistUiFiles) {
  const content = fs.readFileSync(path.join(root, file), "utf8")
  if (/KLEIO\s+Vision|Kleio\s+Vision|Run\s+KLEIO\s+Vision|Run\s+Kleio\s+Vision/i.test(content)) {
    failures.push(`${file}: legacy KLEIO Vision language remains on an artist-facing surface`)
  }
}

const mediaSurfaceFiles = [
  "components/kleio/artist-media-library.tsx",
  "components/kleio/media-intelligence-sheet.tsx",
  "components/kleio/media-collection-intelligence-sheet.tsx",
]

for (const file of mediaSurfaceFiles) {
  const content = fs.readFileSync(path.join(root, file), "utf8")
  for (const banned of [
    /Media intelligence/i,
    /Body-of-work intelligence/i,
    /review confidence/i,
    /Overall review confidence/i,
    /AI synthesis/i,
  ]) {
    if (banned.test(content)) failures.push(`${file}: banned artist-facing AI/intelligence framing matched ${banned}`)
  }
  if (!/Media Assist/.test(content)) failures.push(`${file}: Media Assist is not visibly named`)
}

const library = fs.readFileSync(path.join(root, "components/kleio/artist-media-library.tsx"), "utf8")
if (!/selectedItems\.length === 1[\s\S]*setSelectedItem\(selectedItems\[0\]\)/.test(library)) {
  failures.push("artist-media-library.tsx: selecting one source must open single-source Media Assist instead of leaving the primary action disabled")
}
if (!/disabled=\{!selectedItems\.length\}[\s\S]*runSelectedMediaAssist/.test(library)) {
  failures.push("artist-media-library.tsx: Run Media Assist must enable as soon as one supported source is selected")
}
if (/disabled=\{selectedItems\.length < 2\}/.test(library)) {
  failures.push("artist-media-library.tsx: the old two-source minimum must not disable Media Assist for a single selected source")
}

if (failures.length) {
  console.error("KLEIO Media Assist language audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO Media Assist language audit passed: artist media surfaces use Media Assist, legacy Vision language is absent, creative-facing confidence/AI-intelligence framing is not exposed, and one selected source can immediately run Media Assist.")
