import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const failures = []

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8")
}

function requireText(relativePath, pattern, message) {
  const content = read(relativePath)
  if (!(typeof pattern === "string" ? content.includes(pattern) : pattern.test(content))) {
    failures.push(`${relativePath}: ${message}`)
  }
}

function forbidText(relativePath, pattern, message) {
  const content = read(relativePath)
  if (typeof pattern === "string" ? content.includes(pattern) : pattern.test(content)) {
    failures.push(`${relativePath}: ${message}`)
  }
}

requireText("app/signup/institution/page.tsx", "AccountRoleSignupBoundary role=\"institution\"", "institution signup must be protected by the account-role boundary")
requireText("app/signup/artist/page.tsx", "AccountRoleSignupBoundary role=\"artist\"", "artist signup must be protected by the account-role boundary")
requireText("components/kleio/signup/account-role-signup-boundary.tsx", "Owner accounts remain separate during beta", "role conflicts must be explained instead of silently redirected")
requireText("components/kleio/signup/account-role-signup-boundary.tsx", "signOutAndContinue", "role conflicts must offer a safe account-switch path")
requireText("components/kleio/auth/auth-callback-client.tsx", "account.profile.role !== expectedRole", "auth callbacks must reject a requested-role mismatch")

requireText("lib/kleio-client-session.ts", "clearKleioSensitiveBrowserState", "browser account state must have a central cleanup function")
requireText("lib/kleio-client-session.ts", "PRESERVED_LOCAL_KEYS", "logout cleanup must intentionally preserve only approved preferences")
requireText("lib/kleio-supabase.ts", "setKleioActiveUserScope(userData.user.id)", "valid sessions must establish a user-specific browser scope")
requireText("lib/kleio-supabase.ts", "finally {\n    clearKleioSensitiveBrowserState()", "logout must clear sensitive browser state even when the network signout fails")

requireText("lib/kleio-passport-drafts.ts", "kleio:artist:draft:v2:", "local Passport drafts must use the account-scoped storage version")
requireText("lib/kleio-passport-drafts.ts", "getKleioActiveUserScope", "local Passport drafts must be scoped to the active authenticated user")
requireText("lib/kleio-passport-drafts.ts", "clearLegacyUnscopedDraft", "legacy unscoped drafts must be discarded rather than restored into another account")
forbidText("lib/kleio-passport-drafts.ts", "window.localStorage.setItem(storageKey(", "draft writes must not use an unscoped key")

requireText("lib/kleio-return-intent.ts", "const MAX_INTENT_AGE_MS = 72 * 60 * 60 * 1000", "return intents must remain time-limited")
requireText("lib/kleio-return-intent.ts", "if (parsed.pathname !== \"/opportunities/\") return null", "legacy return routes must remain same-origin and allowlisted")
requireText("lib/kleio-url.ts", "KLEIO refused to create a localhost URL in production", "production auth redirects must reject localhost")

const clientDirectories = ["app", "components", "lib"]
const clientFiles = []
for (const directory of clientDirectories) {
  const queue = [path.join(root, directory)]
  while (queue.length) {
    const current = queue.pop()
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name)
      if (entry.isDirectory()) queue.push(absolute)
      else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) clientFiles.push(absolute)
    }
  }
}
for (const file of clientFiles) {
  const content = fs.readFileSync(file, "utf8")
  if (/NEXT_PUBLIC_(?:SUPABASE_)?SERVICE(?:_ROLE)?_KEY/i.test(content)) {
    failures.push(`${path.relative(root, file)}: service-role credentials must never be referenced by a public environment variable`)
  }
}

if (failures.length) {
  console.error("KLEIO auth and role-isolation audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO auth and role-isolation audit passed.")
