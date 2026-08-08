import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")
const failures = []
const requirePattern = (content, pattern, message) => { if (!pattern.test(content)) failures.push(message) }
const forbidPattern = (content, pattern, message) => { if (pattern.test(content)) failures.push(message) }

const helper = read("lib/kleio-google-auth.ts")
const gate = read("components/kleio/auth/google-role-bootstrap-gate.tsx")
const institution = read("components/kleio/signup/institution-signup-entry.tsx")
const artistSignup = read("lib/kleio-lightweight-artist-signup.ts")
const callbackPage = read("app/auth/callback/page.tsx")
const gmail = read("components/kleio/gmail-delivery-control.tsx")
const migration = read("supabase/migrations/20260808202000_google_oauth_role_bootstrap.sql")

requirePattern(helper, /provider:\s*"google"/, "Google identity helper must use the Google social provider.")
requirePattern(helper, /redirectTo:\s*getKleioAuthCallbackUrl\(role\)/, "Google identity must return through the role-aware KLEIO callback.")
forbidPattern(helper, /gmail\.send|gmail\.modify|gmail\.readonly|drive\.readonly|drive\.file/i, "Identity authentication must not request Gmail or Drive authorization scopes.")
requirePattern(helper, /claim_fresh_google_signup_role/, "The browser helper must resolve Google role intent through the controlled database RPC.")

requirePattern(gate, /tokenHash[\s\S]*setReady\(true\)/, "Email confirmation links must bypass the Google role bootstrap.")
requirePattern(gate, /hasGoogleIdentity\(data\.user\)/, "The role bootstrap must run only for an authenticated Google identity.")
requirePattern(callbackPage, /GoogleRoleBootstrapGate[\s\S]*AuthCallbackClient/, "The Google role gate must run before the established auth callback client.")

requirePattern(migration, /security definer/i, "Google role bootstrap must be server enforced.")
requirePattern(migration, /google_identity_exists/, "Google role bootstrap must prove a Google identity exists.")
requirePattern(migration, /onboarding_done or user_created_at < now\(\) - interval '15 minutes'/, "Established accounts must be outside the role-mutation window.")
requirePattern(migration, /current_role <> 'artist'.*desired_role <> 'institution'/s, "The only permitted bootstrap mutation must be fresh artist default to institution.")
requirePattern(migration, /artist_profiles[\s\S]*institutions/, "Role bootstrap must refuse accounts that already own artist or institution state.")
requirePattern(migration, /revoke all on function public\.claim_fresh_google_signup_role\(text\) from public, anon/, "Anonymous/PUBLIC execution must be revoked.")
requirePattern(migration, /grant execute on function public\.claim_fresh_google_signup_role\(text\) to authenticated/, "Only authenticated users may invoke the role bootstrap.")

requirePattern(institution, /Continue with Google/, "Institution signup must expose a Google identity path when configured.")
requirePattern(institution, /does not grant Gmail or Google Drive access/, "Institution signup must clearly separate identity from Google data permissions.")
requirePattern(artistSignup, /signInWithOAuth[\s\S]*provider:\s*"google"/, "Artist signup must retain its Google identity path.")
forbidPattern(artistSignup, /gmail\.send|gmail\.modify|gmail\.readonly/i, "Artist Google signup must not request Gmail permissions.")

requirePattern(gmail, /terminalSentStates[\s\S]*artist_reported_sent/, "Artist-reported sent evidence must suppress a later Gmail send in the UI.")
requirePattern(gmail, /Application progress/, "Finalized applications must expose a calm progress surface.")
requirePattern(gmail, /Review activity/, "Progress must distinguish first-party Review Room activity.")
requirePattern(gmail, /does not mean the email was read/, "Progress copy must reject false email-read claims.")
requirePattern(gmail, /conversation_started[\s\S]*Open KLEIO conversation/, "A real conversation must create a direct continuation into KLEIO messaging.")
requirePattern(gmail, /visibilitychange[\s\S]*refresh/, "Progress should refresh when the artist returns to the active tab without aggressive polling.")

if (failures.length) {
  console.error("Google auth + submission tracking foundation audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("Google auth + submission tracking foundation audit passed: identity scopes stay separate from Gmail/Drive, established roles are immutable, fresh institution OAuth bootstrap is server constrained, and artist delivery progress advances only from canonical evidence into KLEIO messaging.")
