import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const outputDirectory = path.join(root, "out")
const indexPath = path.join(outputDirectory, "index.html")
const configuredBasePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim()
const basePath = configuredBasePath && configuredBasePath !== "/"
  ? `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`
  : ""
const expectedAssetRoot = `${basePath}/_next/`
const failures = []

if (!fs.existsSync(indexPath)) failures.push("out/index.html is missing.")

if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, "utf8")
  const assetReferences = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1])
  const nextAssets = [...new Set(assetReferences.filter((value) => value.includes("/_next/")))]
  const cssAssets = nextAssets.filter((value) => /\.css(?:\?|$)/i.test(value))
  const javascriptAssets = nextAssets.filter((value) => /\.js(?:\?|$)/i.test(value))

  if (cssAssets.length === 0) failures.push("No Next.js stylesheet reference was found in out/index.html.")
  if (javascriptAssets.length === 0) failures.push("No Next.js JavaScript reference was found in out/index.html.")

  for (const assetReference of nextAssets) {
    let pathname
    try {
      pathname = new URL(assetReference, "https://cowboyblurr.github.io").pathname
    } catch {
      failures.push(`Invalid asset URL in out/index.html: ${assetReference}`)
      continue
    }

    if (!pathname.startsWith(expectedAssetRoot)) {
      failures.push(`Asset path must begin with ${expectedAssetRoot}: ${assetReference}`)
      continue
    }

    const exportRelativePath = pathname.slice(basePath.length).replace(/^\/+/, "")
    const localPath = path.join(outputDirectory, exportRelativePath)
    if (!fs.existsSync(localPath)) failures.push(`Referenced asset is missing from the static export: ${pathname}`)
  }

  const duplicatePrefix = `${basePath}${basePath}/_next/`
  if (basePath && html.includes(duplicatePrefix)) {
    failures.push(`The export contains a duplicated base path: ${duplicatePrefix}`)
  }

  console.log(`GitHub Pages export uses base path ${basePath || "/"}.`)
  console.log(`Found ${cssAssets.length} stylesheet(s) and ${javascriptAssets.length} JavaScript file(s).`)
  for (const value of cssAssets) console.log(`CSS ${value}`)
  for (const value of javascriptAssets.slice(0, 10)) console.log(`JS ${value}`)
}

if (failures.length) {
  console.error("GitHub Pages export audit failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("GitHub Pages export audit passed.")
