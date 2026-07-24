import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8")
}

function write(relativePath, content) {
  const target = path.join(root, relativePath)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content)
}

function replaceOnce(content, search, replacement, label) {
  const index = content.indexOf(search)
  if (index < 0) throw new Error(`Could not find ${label}`)
  if (content.indexOf(search, index + search.length) >= 0) throw new Error(`Found more than one ${label}`)
  return content.slice(0, index) + replacement + content.slice(index + search.length)
}

function replaceFunction(content, functionName, replacement) {
  const start = content.indexOf(`function ${functionName}`)
  if (start < 0) throw new Error(`Could not find function ${functionName}`)
  const nextExport = content.indexOf("\nexport function", start)
  if (nextExport < 0) throw new Error(`Could not find end of function ${functionName}`)
  return content.slice(0, start) + replacement.trimEnd() + "\n" + content.slice(nextExport + 1)
}

function update(relativePath, transform) {
  const before = read(relativePath)
  const after = transform(before)
  if (after === before) throw new Error(`${relativePath} did not change`)
  write(relativePath, after)
}

update("components/kleio/artist-dashboard/artist-dashboard-overview.tsx", (source) => {
  let next = replaceOnce(
    source,
    'import { cn } from "@/lib/utils"\n',
    'import { FocusLabel } from "@/components/kleio/guidance-system"\nimport { cn } from "@/lib/utils"\n',
    "artist guidance import",
  )
  next = replaceOnce(
    next,
    `          <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] shadow-sm" style={{ color: lavenderDeep }}>\n            <AlertCircle className="size-3" />\n            {locale === "es" ? "Prioridad actual" : "Current priority"}\n          </div>`,
    `          <FocusLabel>{locale === "es" ? "Siguiente enfoque" : "Next focus"}</FocusLabel>`,
    "artist priority warning label",
  )
  next = replaceOnce(
    next,
    '               <span className="grid size-4 shrink-0 place-items-center rounded-full bg-white text-[0.5rem] font-bold" style={{ color: "#A85656" }}>!</span>',
    '               <span className="size-1.5 shrink-0 rounded-full bg-[#C6B9E6]" aria-hidden />',
    "artist incomplete-item exclamation",
  )
  next = next.replace("  AlertCircle,\n", "")
  return next
})

update("components/kleio/live-institution-overview.tsx", (source) => {
  let next = replaceOnce(
    source,
    'import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"\n',
    'import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"\nimport { FocusLabel } from "@/components/kleio/guidance-system"\n',
    "live institution guidance import",
  )
  next = replaceOnce(
    next,
    `              <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.13em] text-[#5B4B8A] shadow-sm">\n                <AlertCircle className="size-3" />\n                {locale === "es" ? "Prioridad actual" : "Current priority"}\n              </div>`,
    `              <FocusLabel>{locale === "es" ? "Siguiente enfoque" : "Next focus"}</FocusLabel>`,
    "live institution priority warning label",
  )
  return next
})

update("components/kleio/overview.tsx", (source) => {
  let next = replaceOnce(
    source,
    'import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"\n',
    'import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"\nimport { FocusLabel } from "@/components/kleio/guidance-system"\n',
    "demo institution guidance import",
  )
  next = replaceOnce(
    next,
    `          <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.13em] text-[#5B4B8A] shadow-sm">\n            <AlertCircle className="size-3" />\n            {locale === "es" ? "Prioridad del ciclo" : "Cycle priority"}\n          </div>`,
    `          <FocusLabel>{locale === "es" ? "Enfoque del ciclo" : "Cycle focus"}</FocusLabel>`,
    "demo institution priority warning label",
  )
  return next
})

update("components/kleio/live-global-artist-opportunities-with-images.tsx", (source) => {
  let next = replaceOnce(
    source,
    'import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"\n',
    'import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"\nimport { ExpandableInfo, InlineHelper, TrustIndicator } from "@/components/kleio/guidance-system"\n',
    "opportunity guidance import",
  )

  next = replaceOnce(
    next,
    '  if (loading) return <div className={`${card} flex items-center gap-2 text-sm text-muted-foreground`}><Loader2 className="size-4 animate-spin" />Searching sourced opportunity records…</div>',
    '  if (loading) return <p className="flex items-center gap-2 px-1 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Searching sourced opportunity records…</p>',
    "opportunity loading notice",
  )

  next = replaceFunction(next, "ResultSummary", `function ResultSummary({ mode, intent, count }: { mode: ResultMode; intent: OpportunitySearchIntent; count: number }) {
  if (!intent.rawQuery.trim()) return null
  if (mode === "exact") return <p aria-live="polite" className="px-1 text-sm text-emerald-700"><strong>{count} exact database match{count === 1 ? "" : "es"}.</strong> Every displayed record matches the interpreted criteria KLEIO could verify.</p>
  if (mode === "partial") return <div aria-live="polite" className="border-l-2 border-amber-200 pl-3 text-sm leading-relaxed text-amber-900"><strong>No exact verified match is currently available.</strong> Broader sourced results are labeled with the part of your request they do not match.</div>
  if (mode === "none") return <div aria-live="polite" className="border-l-2 border-[#D8D0F2] pl-3 text-sm leading-relaxed text-[#625C70]"><strong className="text-[#292631]">Your request was understood, but KLEIO found no verified matching record.</strong><p className="mt-1">No opportunity was created or inferred from your wording. Broaden one part of the search or return as verified coverage expands.</p></div>
  return null
}
`)

  const oldGuidance = `    {intent.hasStructuredIntent && <section className="rounded-xl border border-[#D8D0F2] bg-[#FDFBFF] px-4 py-3" aria-label="Interpreted search filters">\n      <div className="flex flex-wrap items-center gap-2">\n        <p className="mr-1 text-xs font-semibold uppercase tracking-wide text-[#625C70]">KLEIO understood</p>\n        {intent.chips.map((item) => <span key={item.key} className="rounded-full border border-[#D8D0F2] bg-white px-3 py-1 text-xs font-semibold text-[#5B4B8A]">{item.label}</span>)}\n      </div>\n      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">These criteria are inferred from your wording. The dropdowns above can further refine or override the interpreted type, source, format, and fee filters.</p>\n    </section>}\n\n    <div className="rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] px-4 py-3 text-xs leading-relaxed text-muted-foreground">Readiness is calculated from confirmed source requirements and actual Creative Passport materials. “Prepare application” creates a reviewable package; it does not imply that an external provider has received anything.</div>`

  const newGuidance = `    {intent.hasStructuredIntent && <section className="px-1" aria-label="Interpreted search filters">\n      <div className="flex flex-wrap items-center gap-2">\n        <p className="mr-1 text-[0.68rem] font-semibold uppercase tracking-wide text-[#625C70]">KLEIO understood</p>\n        {intent.chips.map((item) => <span key={item.key} className="rounded-full bg-[#F7F4FF] px-2.5 py-1 text-xs font-semibold text-[#5B4B8A]">{item.label}</span>)}\n      </div>\n      <InlineHelper className="mt-2">These criteria come from your wording. The controls above can refine the interpreted type, source, format, and fee.</InlineHelper>\n    </section>}\n\n    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1" aria-label="Opportunity trust indicators">\n      <TrustIndicator>Worldwide sourced search</TrustIndicator>\n      <TrustIndicator>Original source preserved</TrustIndicator>\n      <TrustIndicator>Artist review before submission</TrustIndicator>\n    </div>\n\n    <ExpandableInfo label="How KLEIO works here" summary="search, translation, readiness, and messaging" className="px-1">\n      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">\n        <section><p className="font-semibold text-[#292631]">Worldwide discovery</p><p className="mt-1">KLEIO searches sourced records across regions and languages. Eligibility is checked separately against stated rules and Creative Passport data.</p></section>\n        <section><p className="font-semibold text-[#292631]">Translation</p><p className="mt-1">Original titles, deadlines, currencies, requirements, and official sources remain authoritative. Binding language needs human review when a translation is not verified.</p></section>\n        <section><p className="font-semibold text-[#292631]">Readiness</p><p className="mt-1">Readiness uses confirmed source requirements and actual Passport materials. Preparing a package does not submit it.</p></section>\n        <section><p className="font-semibold text-[#292631]">Messaging</p><p className="mt-1">Conversations follow an invitation or submitted application. A listing alone does not open unsolicited institution messaging.</p></section>\n      </div>\n    </ExpandableInfo>`

  next = replaceOnce(next, oldGuidance, newGuidance, "opportunity guidance blocks")

  next = replaceOnce(
    next,
    '        {intent.hasStructuredIntent && intentMatch && <div className={`mb-4 rounded-xl px-3 py-2 text-xs leading-relaxed ${intentMatch.kind === "exact" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>',
    '        {intent.hasStructuredIntent && intentMatch && <div className={`mb-3 text-xs leading-relaxed ${intentMatch.kind === "exact" ? "text-emerald-700" : "border-l-2 border-amber-200 pl-3 text-amber-900"}`}>',
    "opportunity intent match notice",
  )

  return next
})

const auditSource = `import fs from "node:fs"
import path from "node:path"

const roots = ["app", "components"]
const files = []

function walk(directory) {
  if (!fs.existsSync(directory)) return
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(target)
    else if (/\\.(tsx|ts|jsx|js)$/.test(entry.name)) files.push(target)
  }
}

for (const root of roots) walk(root)

const failures = []
const bannedCopy = ["Worldwide discovery:", "Translation protocol:", "Messaging boundary:"]

for (const file of files) {
  const source = fs.readFileSync(file, "utf8")
  for (const phrase of bannedCopy) {
    if (source.includes(phrase)) failures.push(file + ": warning-style policy block returned: " + phrase)
  }
  if (source.includes("<AlertCircle") && (source.includes('"Current priority"') || source.includes('"Cycle priority"'))) {
    failures.push(file + ": ordinary workflow focus is still paired with alert iconography")
  }
}

const required = fs.readFileSync("components/kleio/guidance-system.tsx", "utf8")
for (const component of ["InlineHelper", "TrustIndicator", "FocusLabel", "ExpandableInfo", "FirstUseHint"]) {
  if (!required.includes("export function " + component)) failures.push("guidance-system.tsx: missing " + component)
}

if (failures.length) {
  console.error("KLEIO guidance hierarchy audit failed:\\n" + failures.map((failure) => "- " + failure).join("\\n"))
  process.exit(1)
}

console.log("KLEIO guidance hierarchy audit passed across " + files.length + " source files.")
`

write("scripts/audit-guidance-hierarchy.mjs", auditSource)

const packageJson = JSON.parse(read("package.json"))
packageJson.scripts["audit:guidance"] = "node scripts/audit-guidance-hierarchy.mjs"
write("package.json", JSON.stringify(packageJson, null, 2) + "\n")

write("docs/guidance-system-2026-07-24.md", `# KLEIO contextual guidance system

Implemented July 24, 2026.

## Product rule

The task appears first. Guidance supports the task where it becomes relevant. Large bordered notices are reserved for real errors, destructive consequences, privacy consequences, submission consequences, and confirmed eligibility conflicts.

## Shared patterns

- **InlineHelper** — concise field and control guidance.
- **TrustIndicator** — low-weight source, privacy, approval, and authority signals.
- **FocusLabel** — calm workflow emphasis without alert iconography.
- **ExpandableInfo** — detailed methodology, policy, and educational content collapsed by default.
- **FirstUseHint** — dismissible first-use guidance with reduced-motion support and persistent dismissal.

## Implemented surfaces

- Opportunity discovery: removed the three warning-like worldwide, translation, and messaging cards. The search task now appears first; trust indicators and detailed policy live inside a compact disclosure.
- Natural-language search: interpreted criteria remain visible without a full bordered notice. Exact, partial, and zero-result messages now reflect their actual severity.
- Guided onboarding: synthetic-data context now appears after the first usable fields as a dismissible first-use hint.
- Artist dashboard: ordinary workflow priority is now framed as the next focus; missing Passport items use neutral markers rather than exclamation symbols.
- Institution dashboards: cycle priorities are framed as focus, while true errors and actual follow-up counts retain stronger treatment.

## Motion and accessibility

- Expandable details use a short fade and upward transition.
- Dismissible first-use guidance uses a 200 ms fade/collapse.
- Motion is disabled when the user requests reduced motion.
- Ordinary guidance does not use alert semantics.
- Error treatment and role=alert remain reserved for actual failures.

## Enforcement

Run \`pnpm audit:guidance\`. The audit prevents the removed policy-card copy and alert-framed workflow-priority pattern from returning.
`)

fs.rmSync(path.join(root, ".github/workflows/apply-guidance-redesign.yml"), { force: true })
fs.rmSync(path.join(root, "scripts/apply-guidance-redesign.mjs"), { force: true })

console.log("Applied KLEIO guidance hierarchy redesign.")
