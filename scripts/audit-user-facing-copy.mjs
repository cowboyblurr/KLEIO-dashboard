import { readFile, readdir, stat } from "node:fs/promises"
import path from "node:path"

const repositoryRoot = process.cwd()
const scanRoots = [
  "app/artist-dashboard",
  "app/activity-log",
  "app/artists",
  "app/committee",
  "app/dashboard",
  "app/messages",
  "app/opportunities",
  "app/programs",
  "app/reports",
  "app/review-queue",
  "app/review-room",
  "app/settings",
  "app/shortlist",
  "app/submissions",
  "app/templates",
  "components/kleio",
  "lib/kleio-i18n.ts",
  "lib/kleio-spanish-overrides.ts",
]

const internalProductPhrases = [
  "product wedge",
  "core pilot",
  "not part of the core pilot",
  "stays secondary for now",
  "should first prove",
  "without becoming a distraction",
  "once kleio has enough",
  "later build pass",
  "static foundation controls",
  "foundation preview",
  "foundation workflow",
  "common.foundationworkflow",
  "current live schema",
  "dedicated live event model",
  "live persistence workflow",
  "not active in this connected",
  "may eventually help",
]

const supportedExtensions = new Set([".ts", ".tsx", ".js", ".jsx"])

async function collectFiles(target) {
  const absolute = path.join(repositoryRoot, target)
  const details = await stat(absolute).catch(() => null)
  if (!details) return []
  if (details.isFile()) return supportedExtensions.has(path.extname(absolute)) ? [absolute] : []

  const entries = await readdir(absolute, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => collectFiles(path.join(target, entry.name))))
  return nested.flat()
}

function isAllowedDictionaryDefinition(relativeFile, phrase, line) {
  return relativeFile === "lib/kleio-i18n.ts"
    && phrase === "foundation workflow"
    && line.includes('"common.foundationWorkflow"')
}

const files = (await Promise.all(scanRoots.map(collectFiles))).flat()
const findings = []

for (const file of files) {
  const source = await readFile(file, "utf8")
  const lines = source.split(/\r?\n/)
  const relativeFile = path.relative(repositoryRoot, file)

  for (const phrase of internalProductPhrases) {
    const normalizedPhrase = phrase.toLowerCase()
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(normalizedPhrase) && !isAllowedDictionaryDefinition(relativeFile, phrase, line)) {
        findings.push({
          file: relativeFile,
          line: index + 1,
          phrase,
          source: line.trim(),
        })
      }
    })
  }
}

if (findings.length) {
  console.error("User-facing copy audit found internal product-strategy language:\n")
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} — “${finding.phrase}”`)
    console.error(`  ${finding.source}`)
  }
  process.exit(1)
}

console.log(`User-facing copy audit passed across ${files.length} artist and institution UI source files.`)
