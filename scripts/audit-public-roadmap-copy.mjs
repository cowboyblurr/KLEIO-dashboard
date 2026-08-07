import fs from "node:fs"
import path from "node:path"

const root = path.resolve("out")
if (!fs.existsSync(root)) {
  console.error("Public copy audit requires a completed static export in ./out.")
  process.exit(1)
}

const forbidden = [
  { label: "Beta", pattern: /\bbeta\b/gi },
  { label: "Deferred", pattern: /\bdeferred\b/gi },
  { label: "Deferred (Spanish)", pattern: /\bpospuest[oa]s?\b/gi },
  { label: "Google Drive roadmap copy", pattern: /google\s+drive/gi },
  { label: "Website Import roadmap copy", pattern: /website\s+import/gi },
  { label: "Website Import roadmap copy (Spanish)", pattern: /importaci[oó]n\s+web/gi },
  { label: "Pinterest roadmap copy", pattern: /\bpinterest\b/gi },
  { label: "Instagram connector roadmap copy", pattern: /(connect|import|coming\s+soon|future|later).{0,60}instagram|instagram.{0,60}(connect|import|coming\s+soon|future|later)/gi },
  { label: "Coming soon", pattern: /coming\s+soon/gi },
  { label: "Coming soon (Spanish)", pattern: /pr[oó]ximamente/gi },
  { label: "Future release", pattern: /future\s+release/gi },
  { label: "Later release", pattern: /later\s+release/gi },
]

function htmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) return htmlFiles(target)
    return entry.isFile() && entry.name.endsWith(".html") ? [target] : []
  })
}

function decodeBasicEntities(value) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
}

function visibleCopy(html) {
  const title = [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((match) => match[1]).join(" ")
  const descriptions = [...html.matchAll(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/gi)].map((match) => match[1])
  const descriptionsReversed = [...html.matchAll(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/gi)].map((match) => match[1])
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const body = (bodyMatch?.[1] ?? html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<[^>]+>/g, " ")
  return decodeBasicEntities([title, ...descriptions, ...descriptionsReversed, body].join(" ")).replace(/\s+/g, " ").trim()
}

const failures = []
for (const file of htmlFiles(root)) {
  const copy = visibleCopy(fs.readFileSync(file, "utf8"))
  for (const rule of forbidden) {
    rule.pattern.lastIndex = 0
    const match = rule.pattern.exec(copy)
    if (!match) continue
    const start = Math.max(0, match.index - 90)
    const end = Math.min(copy.length, match.index + match[0].length + 90)
    failures.push({ file: path.relative(root, file), label: rule.label, excerpt: copy.slice(start, end) })
  }
}

if (failures.length) {
  console.error("Internal roadmap/release language leaked into visible exported copy:")
  for (const failure of failures) console.error(`- ${failure.file}: ${failure.label}\n  ${failure.excerpt}`)
  process.exit(1)
}

console.log("Public copy audit passed: visible exported copy contains no internal roadmap/release language or unreleased connector promotion.")
