import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const failures = []
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")
const requirePattern = (content, pattern, message) => { if (!pattern.test(content)) failures.push(message) }
const forbidPattern = (content, pattern, message) => { if (pattern.test(content)) failures.push(message) }

const documentUi = read("components/kleio/artist-document-intelligence.tsx")
const passportWorkspace = read("components/kleio/creative-passport-workspace.tsx")
const adaptivePassport = read("components/kleio/adaptive-artist-passport-experience.tsx")
const institutionPassport = read("components/kleio/artist-passport-view.tsx")
const editorialProfile = read("components/kleio/profile/editorial-artist-profile.tsx")
const discovery = read("components/kleio/live-artist-discovery.tsx")
const guide = read("components/kleio/kleio-demo-guide.tsx")
const globalCss = read("app/globals.css")

requirePattern(documentUi, /Collapse results[\s\S]*Expand results/, "Document analysis must be collapsible from its own header.")
requirePattern(documentUi, /Clear analysis[\s\S]*original PDF stays private/, "Artists must be able to clear analysis without deleting the PDF.")
requirePattern(documentUi, /Delete PDF[\s\S]*permanently removes the private PDF/, "Artists must have an obvious confirmed PDF deletion path.")
requirePattern(documentUi, /role="alertdialog"/, "Destructive document actions require an accessible inline confirmation.")

requirePattern(passportWorkspace, /Editing your reusable artist record/, "The Creative Passport edit header must remain compact.")
requirePattern(passportWorkspace, /Why it matters[\s\S]*Overview/, "Creative Passport context and return actions must fit in the compact edit bar.")
forbidPattern(passportWorkspace, /Creative Passport · Edit mode[\s\S]*Edit reusable source information/, "The previous oversized pinned Creative Passport header must not return.")

requirePattern(adaptivePassport, /workflowOpen/, "The Creative Passport workflow chooser must be collapsible.")
requirePattern(adaptivePassport, /Workflow[\s\S]*Change/, "The collapsed workflow bar must identify the active workflow and expose a change control.")
requirePattern(adaptivePassport, /workflowOpen &&/, "Large workflow mode cards must render only on demand.")

for (const [name, content] of [
  ["institution artist Passport", institutionPassport],
  ["editorial artist profile", editorialProfile],
  ["institution discovery profile", discovery],
]) {
  requirePattern(content, /kleio-context-panel/, `${name} must use the non-blocking context panel policy.`)
  forbidPattern(content, /lg:sticky/, `${name} must not pin a page-local panel on ordinary laptop widths.`)
}

requirePattern(globalCss, /\.kleio-context-panel[\s\S]*position: static/, "Context panels must be static by default.")
requirePattern(globalCss, /min-width: 1536px[\s\S]*min-height: 850px[\s\S]*position: sticky/, "Context panels may become sticky only on large, tall displays.")
requirePattern(globalCss, /body:has\(\[role="dialog"\]\[aria-modal="true"\]\)[\s\S]*kleio-demo-guide-anchor[\s\S]*display: none/, "Passive guidance must hide while a modal decision is open.")
forbidPattern(globalCss, /body:has\(\.kleio-demo-guide-panel\)[\s\S]*padding-right/, "KLEIO Assist must never reserve a large strip of application width.")

requirePattern(guide, /ATTENTION_ROUTE_PREFIXES/, "Form-heavy routes must be recognized by the passive-guide minimization policy.")
requirePattern(guide, /routeNeedsUnobstructedFocus/, "The guide must protect focused form routes.")
requirePattern(guide, /if \(!state\.activeScenarioId\) minimizeGuide\(\)/, "Passive guidance must minimize without interrupting an active walkthrough.")
requirePattern(guide, /w-\[min\(100vw-1\.5rem,21rem\)\]/, "The open guide must retain the reduced width.")
requirePattern(guide, /max-h-\[min\(72dvh,38rem\)\]/, "The guide must not occupy the full viewport height.")

const extensions = new Set([".tsx", ".ts", ".jsx", ".js", ".css"])
const roots = ["app", "components"]
let filesScanned = 0
let stickyLines = 0
let fixedLines = 0
let nestedScrollLines = 0
for (const rootName of roots) {
  const queue = [path.join(root, rootName)]
  while (queue.length) {
    const current = queue.pop()
    if (!current || !fs.existsSync(current)) continue
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name)
      if (entry.isDirectory()) queue.push(target)
      else if (extensions.has(path.extname(entry.name))) {
        filesScanned += 1
        const content = fs.readFileSync(target, "utf8")
        stickyLines += content.split("\n").filter((line) => /\bsticky\b|position\s*:\s*sticky/.test(line)).length
        fixedLines += content.split("\n").filter((line) => /\bfixed\b|position\s*:\s*fixed/.test(line)).length
        nestedScrollLines += content.split("\n").filter((line) => /overflow-(?:y-)?auto|overflow-scroll/.test(line)).length
      }
    }
  }
}

if (filesScanned < 250) failures.push(`Expected to audit the full interface surface; only ${filesScanned} files were scanned.`)

if (failures.length) {
  console.error("KLEIO visual convenience audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`KLEIO visual convenience audit passed: ${filesScanned} interface files scanned; ${stickyLines} sticky lines, ${fixedLines} fixed lines, and ${nestedScrollLines} nested-scroll lines inventoried. Document controls are reversible, Creative Passport chrome is compact, passive guidance is non-blocking, and page-local context panels remain static on ordinary laptop screens.`)
