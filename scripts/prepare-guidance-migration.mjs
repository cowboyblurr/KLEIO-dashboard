import fs from "node:fs"

const migrationPath = "scripts/apply-guidance-redesign.mjs"
let source = fs.readFileSync(migrationPath, "utf8")

const brittleBlock = `  next = replaceOnce(
    next,
    '               <span className="grid size-4 shrink-0 place-items-center rounded-full bg-white text-[0.5rem] font-bold" style={{ color: "#A85656" }}>!</span>',
    '               <span className="size-1.5 shrink-0 rounded-full bg-[#C6B9E6]" aria-hidden />',
    "artist incomplete-item exclamation",
  )`

const resilientBlock = `  const incompleteMarker = /<span className="grid size-4 shrink-0 place-items-center rounded-full bg-white text-\\[0\\.5rem\\] font-bold" style=\\{\\{ color: "#A85656" \\}\\}>!<\\/span>/
  if (!incompleteMarker.test(next)) throw new Error("Could not find artist incomplete-item exclamation")
  next = next.replace(incompleteMarker, '<span className="size-1.5 shrink-0 rounded-full bg-[#C6B9E6]" aria-hidden />')`

if (!source.includes(brittleBlock)) {
  throw new Error("Could not locate the brittle incomplete-item migration block")
}

source = source.replace(brittleBlock, resilientBlock)
source = source.replace(
  'fs.rmSync(path.join(root, "scripts/apply-guidance-redesign.mjs"), { force: true })',
  'fs.rmSync(path.join(root, "guidance-migration-error.log"), { force: true })\nfs.rmSync(path.join(root, "scripts/apply-guidance-redesign.mjs"), { force: true })',
)

fs.writeFileSync(migrationPath, source)
console.log("Prepared resilient guidance migration.")
