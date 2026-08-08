import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const failures = []
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")
const requirePattern = (content, pattern, message) => { if (!pattern.test(content)) failures.push(message) }
const forbidPattern = (content, pattern, message) => { if (pattern.test(content)) failures.push(message) }

const passportPage = read("app/artist-dashboard/passport/page.tsx")
const mediaPanel = read("components/kleio/creative-passport-media-panel.tsx")
const workspace = read("components/kleio/creative-passport-workspace.tsx")
const editor = read("components/kleio/live-artist-passport-editor.tsx")
const inbox = read("components/kleio/passport-updates-inbox.tsx")
const header = read("components/kleio/workspace-page-header.tsx")

requirePattern(mediaPanel, /Media Assist/, "Creative Passport must explain Media Assist in context.")
requirePattern(mediaPanel, /Add private media or files and use Media Assist/, "Media guidance must keep Media Assist inside the Passport workflow rather than sending artists elsewhere.")
requirePattern(mediaPanel, /MediaIntelligenceSheet/, "Creative Passport must open analysis in place.")
requirePattern(mediaPanel, /loadMediaIntelligenceStatuses/, "Creative Passport must reuse persisted source intelligence rather than force repeat analysis.")
requirePattern(mediaPanel, /loadPassportReviewCount/, "The compact utility row must still show relevant pending structured-review work.")
forbidPattern(mediaPanel, /Evidence-backed updates|Patterns, not pronouncements/, "The old explanatory card pair must not return to the Passport viewport.")
forbidPattern(mediaPanel, /rounded-\[24px\]|p-5 shadow-\[0_18px_52px/, "The media utility must not become an oversized hero again.")
requirePattern(passportPage, /pt-2/, "The Passport page must keep media tools close to the work surface.")

requirePattern(workspace, /h-2 flex-1 overflow-hidden rounded-full/, "Passport completion must use a compact progress bar rather than a large percentage card.")
requirePattern(workspace, /Next information to complete/, "The overview must prioritize the next useful action.")
requirePattern(workspace, /View completion rules by category/, "Completion rules must remain secondary and collapsible.")
forbidPattern(workspace, /text-5xl|xl:grid-cols-4|Continue where the work is missing/, "The previous oversized completion and stat-card layout must not return.")

requirePattern(editor, /data-passport-field/, "Structured findings must render inside the matching Passport field.")
requirePattern(editor, /confirmPassportClaim/, "Field-level approval must use the existing provenance-aware confirmation path.")
requirePattern(editor, /setPassportClaimDecision/, "Field-level rejection must remain explicit and persisted.")
requirePattern(editor, /View source/, "Each field suggestion must expose its evidence on demand.")
requirePattern(editor, /Approve replacement/, "Conflicting suggestions must identify replacement approval clearly.")
requirePattern(editor, /Manual edits save with the Passport\. Gemini suggestions save only after you approve them\./, "The approval boundary must be visible to the artist.")
requirePattern(editor, /<details>[\s\S]*Profile images and presentation/, "Optional presentation controls must remain collapsed by default.")
forbidPattern(editor, /setRecord\([^\n]*proposed_value|update\([^\n]*proposed_value/, "Model proposals must never be inserted into saved Passport state before approval.")
forbidPattern(editor, /rounded-\[24px\]|shadow-\[0_18px_48px/, "The Passport editor must not regress to oversized boxed sections.")

requirePattern(inbox, /Review information by field/, "The fallback structured review page must remain field-oriented.")
requirePattern(inbox, /Review in fields/, "The fallback review page must send artists back to the primary field workflow.")
requirePattern(inbox, /Document classification and reanalysis/, "Technical document maintenance must remain secondary and collapsible.")
forbidPattern(inbox, /lg:grid-cols-5|Passport Updates for Review|rounded-\[24px\]/, "The old dashboard-like review header and stat-card grid must not return.")

requirePattern(header, /text-xl[\s\S]*sm:text-2xl/, "Shared workspace headers must preserve compact typography.")
forbidPattern(header, /xl:text-3xl|space-y-3/, "Shared workspace headers must not reclaim unnecessary vertical space.")

const artistRoots = [path.join(root, "app", "artist-dashboard"), path.join(root, "components", "kleio")]
const oversizedSignals = []
for (const start of artistRoots) {
  const queue = [start]
  while (queue.length) {
    const current = queue.pop()
    if (!current || !fs.existsSync(current)) continue
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name)
      if (entry.isDirectory()) queue.push(target)
      else if (/\.(tsx|jsx)$/.test(entry.name)) {
        const source = fs.readFileSync(target, "utf8")
        const relative = path.relative(root, target)
        const signals = [
          ...(source.match(/rounded-\[24px\]/g) ?? []),
          ...(source.match(/text-5xl/g) ?? []),
          ...(source.match(/p-8/g) ?? []),
          ...(source.match(/min-h-\[520px\]/g) ?? []),
        ]
        if (signals.length >= 5) oversizedSignals.push({ file: relative, count: signals.length })
      }
    }
  }
}

if (oversizedSignals.length > 12) failures.push(`Artist-side relevance audit found ${oversizedSignals.length} files with five or more oversized-surface signals; review ${oversizedSignals.slice(0, 8).map((item) => item.file).join(", ")}.`)

if (failures.length) {
  console.error("KLEIO artist relevance audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`KLEIO artist relevance audit passed. In-place Media Assist, field-level structured review, compact Passport hierarchy, collapsed secondary controls, and shared workspace density are protected. ${oversizedSignals.length} high-density source files remain below the review threshold.`)
