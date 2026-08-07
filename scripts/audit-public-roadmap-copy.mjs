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
  { label: "Instagram connector roadmap copy", pattern: /(connect|import|coming\s+soon|future|later)[^<>]{0,60}instagram|instagram[^<>]{0,60}(connect|import|coming\s+soon|future|later)/gi },
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

const failures = []
for (const file of htmlFiles(root)) {
  const html = fs.readFileSync(file, "utf8")
  for (const rule of forbidden) {
    rule.pattern.lastIndex = 0
    const match = rule.pattern.exec(html)
    if (!match) continue
    const start = Math.max(0, match.index - 90)
    const end = Math.min(html.length, match.index + match[0].length + 90)
    failures.push({
      file: path.relative(root, file),
      label: rule.label,
      excerpt: html.slice(start, end).replace(/\s+/g, " "),
    })
  }
}

if (failures.length) {
  console.error("Internal roadmap/release language leaked into exported user-facing HTML:")
  for (const failure of failures) console.error(`- ${failure.file}: ${failure.label}\n  ${failure.excerpt}`)
  process.exit(1)
}

console.log("Public copy audit passed: no internal roadmap/release language is present in exported HTML.")
