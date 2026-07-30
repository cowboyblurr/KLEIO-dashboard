import fs from "node:fs"
import path from "node:path"

const roots = ["app", "components"]
const files = []

function walk(directory) {
  if (!fs.existsSync(directory)) return
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(target)
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) files.push(target)
  }
}

for (const root of roots) walk(root)

const failures = []
const bannedCopy = [
  "Worldwide discovery:",
  "Translation protocol:",
  "Messaging boundary:",
  "How KLEIO works here",
  "These chips explain the natural-language search",
  "These criteria come from your wording",
  "search, readiness, visuals, and submission boundaries",
  "search, translation, readiness, and messaging",
]
const productDirectoryFiles = new Set([
  "components/kleio/production-artist-opportunity-directory.tsx",
  "components/kleio/live-global-artist-opportunities-with-images.tsx",
])

for (const file of files) {
  const source = fs.readFileSync(file, "utf8")
  const normalizedFile = file.split(path.sep).join("/")
  for (const phrase of bannedCopy) {
    if (source.includes(phrase)) failures.push(file + ": persistent walkthrough copy returned: " + phrase)
  }
  if (source.includes("<AlertCircle") && (source.includes('"Current priority"') || source.includes('"Cycle priority"'))) {
    failures.push(file + ": ordinary workflow focus is still paired with alert iconography")
  }
  if (productDirectoryFiles.has(normalizedFile) && source.includes("<ExpandableInfo")) {
    failures.push(file + ": methodology walkthrough returned to a live opportunity directory")
  }
  if (productDirectoryFiles.has(normalizedFile) && source.includes("<TrustIndicator")) {
    failures.push(file + ": persistent trust strip returned to a live opportunity directory")
  }
}

const required = fs.readFileSync("components/kleio/guidance-system.tsx", "utf8")
for (const component of ["InlineHelper", "TrustIndicator", "FocusLabel", "ExpandableInfo", "FirstUseHint"]) {
  if (!required.includes("export function " + component)) failures.push("guidance-system.tsx: missing " + component)
}

if (failures.length) {
  console.error("KLEIO guidance hierarchy audit failed:\n" + failures.map((failure) => "- " + failure).join("\n"))
  process.exit(1)
}

console.log("KLEIO guidance hierarchy audit passed across " + files.length + " source files.")
