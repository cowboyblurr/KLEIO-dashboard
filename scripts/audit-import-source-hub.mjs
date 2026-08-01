import { readFileSync } from "node:fs"

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const requireText = (content, pattern, message) => { if (!pattern.test(content)) throw new Error(message) }
const forbidText = (content, pattern, message) => { if (pattern.test(content)) throw new Error(message) }

const page = read("components/kleio/artist-import-studio-page.tsx")
const hub = read("components/kleio/import-source-hub.tsx")
const pinterest = read("components/kleio/pinterest-import-assist.tsx")
const gateway = read("supabase/functions/analyze-artist-website-gateway/index.ts")
const core = read("supabase/functions/analyze-artist-website-core/index.ts")

requireText(page, /<ImportSourceHub \/>/, "The artist import route must begin with one source-selection hub.")
requireText(page, /id="device-drive-import"/, "Device and Drive import must have a stable destination.")
requireText(page, /id="website-import"/, "Website import must have a stable destination.")
requireText(page, /<PinterestImportAssist \/>/, "Pinterest setup status must be visible inside the Import Studio route.")
requireText(page, /id="instagram-import"/, "The existing Instagram importer must remain available as an additional source.")

for (const label of ["Upload from device", "Choose from Google Drive", "Import from website", "Connect Pinterest"]) {
  requireText(hub, new RegExp(label), `Missing primary import source: ${label}`)
}
requireText(hub, /NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID/, "Drive readiness must reflect actual deployment configuration.")
requireText(hub, /App approval required/, "Pinterest must not appear production-ready before app approval.")
requireText(hub, /Behance and ArtStation remain external portfolio links only/, "Restricted portfolio platforms must be described honestly.")

requireText(pinterest, /data-integration-status="configuration-required"/, "Pinterest must expose a non-production status.")
requireText(pinterest, /boards:read/, "Pinterest planning must request the minimum board read scope.")
requireText(pinterest, /pins:read/, "Pinterest planning must request the minimum Pin read scope.")
requireText(pinterest, /disabled aria-disabled="true"/, "Pinterest connection must remain disabled until production access exists.")
requireText(pinterest, /No scraping or password collection/, "Pinterest must explicitly reject scraping and password collection.")
forbidText(pinterest, /api\.pinterest\.com|www\.pinterest\.com\/oauth|client_secret|access_token|refresh_token/, "The Pinterest status surface must not contain a fake client-side OAuth implementation.")

for (const host of ["behance.net", "artstation.com", "pinterest.com"]) {
  requireText(gateway, new RegExp(host.replace(".", "\\.")), `The gateway must reject ${host}.`)
}
requireText(gateway, /UNSUPPORTED_IMPORT_HOSTS/, "The gateway must maintain a restricted-source host list.")
requireText(gateway, /unsupportedImportHostname/, "The gateway must validate submitted hosts before collection.")
requireText(gateway, /unsupported_import_source/, "The gateway must return a stable restricted-source code.")
requireText(gateway, /Authorization/, "The gateway must forward the authenticated artist token to the collector.")
requireText(gateway, /AbortSignal\.timeout/, "The gateway must bound upstream execution time.")
requireText(core, /348607971524677c8e05aa303cef148d6a740aa5/, "The collector core must be pinned to the inspected implementation commit.")

for (const content of [hub, pinterest, gateway, core]) {
  forbidText(content, /GOCSPX-|pina_[A-Za-z0-9_-]+|pinr_[A-Za-z0-9_-]+|client_secret\s*[:=]\s*["'][^"']+/, "A provider secret or token appears to be committed.")
}

console.log("Import source hub audit passed: four primary source choices, honest Drive readiness, Pinterest production gating, preserved Instagram access, and authenticated gateway restrictions for Behance, ArtStation, Pinterest, and unsupported social sources are present.")
