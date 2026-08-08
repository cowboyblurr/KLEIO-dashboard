import fs from "node:fs"

function read(path) { return fs.readFileSync(path, "utf8") }
function write(path, value) { fs.writeFileSync(path, value) }
function replaceOnce(source, before, after, label) {
  if (!source.includes(before)) throw new Error(`Missing patch anchor: ${label}`)
  return source.replace(before, after)
}

const sheetPath = "components/kleio/media-intelligence-sheet.tsx"
let sheet = read(sheetPath)

sheet = replaceOnce(
  sheet,
  "\nfunction Preview({ item }: { item: ArtistMediaLibraryItem }) {",
  `\nconst PASSPORT_RETRY_STAGES = [\n  \"Reviewing your saved source evidence…\",\n  \"Mapping supported details to your Creative Passport…\",\n  \"Drafting bio, practice, mediums and disciplines…\",\n  \"Checking themes, visual language and application terms…\",\n  \"Verifying every suggestion against its source…\",\n  \"Saving editable suggestions to your private review queue…\",\n] as const\n\nfunction Preview({ item }: { item: ArtistMediaLibraryItem }) {`,
  "passport retry stage labels",
)

sheet = replaceOnce(
  sheet,
  "\nexport function MediaIntelligenceSheet({ item, open, onClose, onAnalyzed }: Props) {",
  `\nfunction PassportRetryProgress({ stage, elapsedMs }: { stage: number; elapsedMs: number }) {\n  const slow = elapsedMs >= 45_000\n  return <div className=\"mt-3 rounded-xl border border-[#E6D9AE] bg-white/75 p-3\" aria-live=\"polite\">\n    <div className=\"flex items-center justify-between gap-3\"><p className=\"text-xs font-semibold text-amber-950\">Preparing your Passport suggestions</p><span className=\"text-[0.65rem] text-amber-900/65\">You can close this panel safely</span></div>\n    <div className=\"mt-3 flex gap-1\" aria-hidden=\"true\">{PASSPORT_RETRY_STAGES.map((_, index) => <span key={index} className={\`h-1.5 flex-1 rounded-full transition-colors \${index < stage ? \"bg-[#8B79B4]\" : index === stage ? \"animate-pulse bg-[#B4A2DA]\" : \"bg-[#E9E3F2]\"}\`} />)}</div>\n    <div className=\"mt-3 space-y-1.5\">{PASSPORT_RETRY_STAGES.map((label, index) => <div key={label} className={\`flex items-start gap-2 text-xs leading-5 \${index === stage ? \"font-semibold text-[#4F407B]\" : index < stage ? \"text-[#746E80]\" : \"text-[#A39CAB]\"}\`}>{index < stage ? <Check className=\"mt-0.5 size-3.5 shrink-0\" /> : index === stage ? <Loader2 className=\"mt-0.5 size-3.5 shrink-0 animate-spin\" /> : <span className=\"mt-0.5 size-3.5 shrink-0\" />}{label}</div>)}</div>\n    <p className=\"mt-3 text-[0.68rem] leading-5 text-[#746E80]\">{slow ? \"Still working — larger portfolios can take a little longer while KLEIO verifies the suggestions against the source.\" : \"KLEIO is working through the saved evidence and checking each editable suggestion before it reaches your review queue.\"}</p>\n    <p className=\"mt-1 text-[0.62rem] leading-4 text-[#9A93A4]\">This is a workflow activity indicator, not an exact percentage or countdown.</p>\n  </div>\n}\n\nexport function MediaIntelligenceSheet({ item, open, onClose, onAnalyzed }: Props) {`,
  "passport retry progress component",
)

sheet = replaceOnce(
  sheet,
  "  const [analysisStage, setAnalysisStage] = useState(0)\n  const [error, setError] = useState(\"\")",
  "  const [analysisStage, setAnalysisStage] = useState(0)\n  const [repairStage, setRepairStage] = useState(0)\n  const [repairElapsedMs, setRepairElapsedMs] = useState(0)\n  const [error, setError] = useState(\"\")",
  "passport retry progress state",
)

sheet = replaceOnce(
  sheet,
  "  }, [analyzing, item])\n\n  if (!open || !item) return null",
  `  }, [analyzing, item])\n\n  useEffect(() => {\n    if (!repairing) return\n    const startedAt = Date.now()\n    const thresholds = [0, 8_000, 20_000, 35_000, 52_000, 70_000]\n    setRepairStage(0); setRepairElapsedMs(0)\n    const timer = window.setInterval(() => {\n      const elapsed = Date.now() - startedAt\n      setRepairElapsedMs(elapsed)\n      let next = 0\n      for (let index = 1; index < thresholds.length; index += 1) if (elapsed >= thresholds[index]) next = index\n      setRepairStage(next)\n    }, 1000)\n    return () => window.clearInterval(timer)\n  }, [repairing])\n\n  if (!open || !item) return null`,
  "passport retry progress timer",
)

sheet = replaceOnce(
  sheet,
  "    setRepairing(true); setError(\"\")",
  "    setRepairing(true); setRepairStage(0); setRepairElapsedMs(0); setError(\"\")",
  "passport retry progress reset",
)

sheet = replaceOnce(
  sheet,
  "<p className=\"mt-1\">{analysis.pipelineMessage || \"Your source notes remain saved instead of being treated as a completed Passport.\"}</p><button type=\"button\" className={`${secondary} mt-3 border-amber-300 bg-white text-amber-900`} onClick={() => void retryPassport()} disabled={repairing || analyzing}>{repairing ? <Loader2 className=\"size-3.5 animate-spin\" /> : <RefreshCcw className=\"size-3.5\" />}{repairing ? \"Retrying Passport drafting…\" : \"Retry Passport drafting only\"}</button>",
  "<p className=\"mt-1\">{analysis.pipelineMessage || \"Your source notes remain saved instead of being treated as a completed Passport.\"}</p>{repairing && <PassportRetryProgress stage={repairStage} elapsedMs={repairElapsedMs} />}<button type=\"button\" className={`${secondary} mt-3 border-amber-300 bg-white text-amber-900`} onClick={() => void retryPassport()} disabled={repairing || analyzing}>{repairing ? <Loader2 className=\"size-3.5 animate-spin\" /> : <RefreshCcw className=\"size-3.5\" />}{repairing ? \"Passport drafting in progress…\" : \"Retry Passport drafting only\"}</button>",
  "passport retry progress rendering",
)

write(sheetPath, sheet)

const mediaPath = "lib/kleio-media-intelligence.ts"
let media = read(mediaPath)
const oldRetry = `export async function retryDocumentPassportSynthesis(item: ArtistMediaLibraryItem) {\n  if (!item.sourceId || item.mimeType !== \"application/pdf\") throw new Error(\"A private PDF source is required for Passport drafting.\")\n  await consent(item.sourceId)\n  await retryDocumentProfileSynthesis(item.sourceId)\n  const refreshed = await loadMediaIntelligence(item.sourceId)\n  if (!refreshed) throw new Error(\"Media Assist could not reload the repaired Passport suggestions.\")\n  return refreshed\n}`
const newRetry = `export async function retryDocumentPassportSynthesis(item: ArtistMediaLibraryItem) {\n  if (!item.sourceId || item.mimeType !== \"application/pdf\") throw new Error(\"A private PDF source is required for Passport drafting.\")\n  await consent(item.sourceId)\n  const before = await loadMediaIntelligence(item.sourceId)\n  const previousGeneratedAt = before?.profileSynthesisReady ? before.analyzedAt : \"\"\n  try {\n    await retryDocumentProfileSynthesis(item.sourceId)\n  } catch (reason) {\n    for (const delayMs of [0, 1_500, 3_000]) {\n      if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs))\n      const recovered = await loadMediaIntelligence(item.sourceId)\n      if (recovered?.profileSynthesisReady && recovered.pipelineStatus === \"READY_FOR_REVIEW\" && recovered.analyzedAt && recovered.analyzedAt !== previousGeneratedAt) return recovered\n    }\n    throw reason\n  }\n  const refreshed = await loadMediaIntelligence(item.sourceId)\n  if (!refreshed) throw new Error(\"Media Assist could not reload the repaired Passport suggestions.\")\n  return refreshed\n}`
media = replaceOnce(media, oldRetry, newRetry, "persisted synthesis reconciliation")
write(mediaPath, media)

const testPath = "tests/media-assist-long-request-recovery.test.mjs"
write(testPath, `import assert from \"node:assert/strict\"\nimport fs from \"node:fs\"\n\nconst sheet = fs.readFileSync(\"components/kleio/media-intelligence-sheet.tsx\", \"utf8\")\nconst media = fs.readFileSync(\"lib/kleio-media-intelligence.ts\", \"utf8\")\n\nfor (const label of [\n  \"Reviewing your saved source evidence…\",\n  \"Mapping supported details to your Creative Passport…\",\n  \"Drafting bio, practice, mediums and disciplines…\",\n  \"Checking themes, visual language and application terms…\",\n  \"Verifying every suggestion against its source…\",\n  \"Saving editable suggestions to your private review queue…\",\n]) assert.match(sheet, new RegExp(label.replace(/[.*+?^${}()|[\\]\\\\]/g, \"\\\\$&\")))\n\nassert.match(sheet, /larger portfolios can take a little longer/)\nassert.match(sheet, /not an exact percentage or countdown/)\nassert.match(sheet, /PassportRetryProgress/)\nassert.match(sheet, /repairElapsedMs/)\nassert.doesNotMatch(sheet, /[0-9]{1,3}% complete|seconds remaining/i)\nassert.match(media, /previousGeneratedAt/)\nassert.match(media, /pipelineStatus === \"READY_FOR_REVIEW\"/)\nassert.match(media, /recovered\.analyzedAt !== previousGeneratedAt/)\nassert.match(media, /\[0, 1_500, 3_000\]/)\nconsole.log(\"media-assist long-request recovery regression: PASS\")\n`)

console.log("Applied Media Assist long-request progress and recovery patch")
