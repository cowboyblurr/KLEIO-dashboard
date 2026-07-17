import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const appDir = path.join(root, "app")
const outDir = path.join(root, "out")
const sourceRoots = ["app", "components", "lib"].map((entry) => path.join(root, entry))

const knownGeneratedRoutes = [
  "/artists/amina-el-badri/",
  "/artist/amina-el-badri/",
  "/institution/kleio-arthouse/",
  "/artist-dashboard/opportunities/lumen-arts-grant/",
  "/submissions/amina-el-badri/",
  "/programs/residency-2026/",
]

function walk(directory, predicate = () => true) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) return walk(target, predicate)
    return predicate(target) ? [target] : []
  })
}

function normalizeRoute(value) {
  const clean = value.split(/[?#]/)[0].replace(/\/+/g, "/")
  if (!clean || clean === "/") return "/"
  return `/${clean.replace(/^\/+|\/+$/g, "")}/`
}

function routeForPage(file) {
  const relativeDirectory = path.relative(appDir, path.dirname(file)).split(path.sep).join("/")
  if (!relativeDirectory) return "/"
  if (relativeDirectory.split("/").some((segment) => segment.startsWith("[") || segment.startsWith("("))) return null
  return normalizeRoute(relativeDirectory)
}

function outputFileForRoute(route) {
  return route === "/" ? path.join(outDir, "index.html") : path.join(outDir, route.slice(1), "index.html")
}

const failures = []
const pageFiles = walk(appDir, (file) => file.endsWith(`${path.sep}page.tsx`) || file.endsWith(`${path.sep}page.jsx`))
const staticRoutes = pageFiles.map(routeForPage).filter(Boolean)

for (const route of [...staticRoutes, ...knownGeneratedRoutes]) {
  const expected = outputFileForRoute(route)
  if (!fs.existsSync(expected)) failures.push(`Missing static export for ${route}: ${path.relative(root, expected)}`)
}

const sourceFiles = sourceRoots.flatMap((directory) => walk(directory, (file) => /\.(tsx?|jsx?)$/.test(file)))
const literalTargets = new Map()
const placeholderLinks = []
const targetPatterns = [
  /\bhref\s*=\s*["'](\/[^"'#?]*)/g,
  /\brouter\.(?:push|replace)\(\s*["'](\/[^"'#?]*)/g,
]

for (const file of sourceFiles) {
  const source = fs.readFileSync(file, "utf8")
  if (/\bhref\s*=\s*["']#["']/.test(source)) placeholderLinks.push(path.relative(root, file))
  for (const pattern of targetPatterns) {
    pattern.lastIndex = 0
    for (const match of source.matchAll(pattern)) {
      const route = normalizeRoute(match[1])
      if (!literalTargets.has(route)) literalTargets.set(route, new Set())
      literalTargets.get(route).add(path.relative(root, file))
    }
  }
}

for (const [route, files] of literalTargets) {
  if (!fs.existsSync(outputFileForRoute(route))) {
    failures.push(`Broken literal navigation target ${route} referenced by ${[...files].join(", ")}`)
  }
}

for (const file of placeholderLinks) failures.push(`Placeholder href="#" found in ${file}`)

if (failures.length) {
  console.error("KLEIO navigation audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`KLEIO navigation audit passed: ${staticRoutes.length} static app routes, ${knownGeneratedRoutes.length} generated routes, and ${literalTargets.size} literal internal targets verified.`)
