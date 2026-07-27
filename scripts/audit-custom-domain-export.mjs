import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const outputDirectory = path.join(root, "out")
const indexPath = path.join(outputDirectory, "index.html")
const cnamePath = path.join(outputDirectory, "CNAME")
const expectedDomain = "www.kleioarthouse.com"

const failures = []

if (!fs.existsSync(indexPath)) failures.push("out/index.html is missing.")
if (!fs.existsSync(cnamePath)) failures.push("out/CNAME is missing.")

if (fs.existsSync(cnamePath)) {
  const cname = fs.readFileSync(cnamePath, "utf8").trim()
  if (cname !== expectedDomain) failures.push(`out/CNAME must contain ${expectedDomain}; received ${cname || "an empty value"}.`)
}

if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, "utf8")
  const assetReferences = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1])
  const nextAssets = [...new Set(assetReferences.filter((value) => value.includes("/_next/")))]
  const cssAssets = nextAssets.filter((value) => /\.(?:css)(?:\?|$)/i.test(value))
  const javascriptAssets = nextAssets.filter((value) => /\.(?:js)(?:\?|$)/i.test(value))

  if (html.includes("/KLEIO-dashboard/_next/")) {
    failures.push("The custom-domain export still contains /KLEIO-dashboard/_next/ asset paths.")
  }
  if (cssAssets.length === 0) failures.push("No Next.js stylesheet reference was found in out/index.html.")
  if (javascriptAssets.length === 0) failures.push("No Next.js JavaScript reference was found in out/index.html.")

  for (const assetReference of nextAssets) {
    let pathname
    try {
      pathname = new URL(assetReference, "https://www.kleioarthouse.com").pathname
    } catch {
      failures.push(`Invalid asset URL in out/index.html: ${assetReference}`)
      continue
    }

    if (!pathname.startsWith("/_next/")) {
      failures.push(`Custom-domain asset must resolve from /_next/: ${assetReference}`)
      continue
    }

    const localPath = path.join(outputDirectory, pathname.replace(/^\/+/, ""))
    if (!fs.existsSync(localPath)) failures.push(`Referenced asset is missing from the static export: ${pathname}`)
  }

  console.log(`Custom-domain export references ${cssAssets.length} stylesheet(s) and ${javascriptAssets.length} JavaScript file(s).`)
  for (const value of cssAssets) console.log(`CSS ${value}`)
  for (const value of javascriptAssets.slice(0, 10)) console.log(`JS ${value}`)
}

if (failures.length) {
  console.error("Custom-domain export audit failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("Custom-domain export audit passed.")
