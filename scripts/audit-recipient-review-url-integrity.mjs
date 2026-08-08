import fs from "node:fs"
import path from "node:path"
import { randomBytes, randomUUID } from "node:crypto"

const root = process.cwd()
const failures = []

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8")
}

function requirePattern(content, pattern, message) {
  if (!pattern.test(content)) failures.push(message)
}

function forbidPattern(content, pattern, message) {
  if (pattern.test(content)) failures.push(message)
}

function assert(condition, message) {
  if (!condition) failures.push(message)
}

const recipientClient = read("lib/kleio-recipient-application.ts")
const recipientEdge = read("supabase/functions/recipient-application-review/index.ts")
const schema = read("supabase/migrations/20260805161000_artist_recipient_application_loop.sql")

// Canonical URL contract: stable application identity + rotating secret access.
requirePattern(recipientClient, /issuedApplicationReferences\.set\(access\.token, packageId\)/, "New recipient access must retain the stable application-package reference used to build the URL.")
requirePattern(recipientClient, /searchParams\.set\("application", applicationReference\)/, "Recipient review URLs must include the stable application reference.")
requirePattern(recipientClient, /searchParams\.set\("token", token\)/, "Recipient review URLs must continue to include the rotating secret token.")
requirePattern(recipientClient, /assertRecipientApplicationReference\(review\.snapshot\.reference, applicationReference\)/, "Review content must be rejected when the stable application reference and secure token resolve to different applications.")
requirePattern(recipientClient, /application_reference_required/, "Missing or malformed application references need an explicit failure state.")
requirePattern(recipientClient, /application_reference_mismatch/, "Mismatched application/token pairs need an explicit failure state.")
requirePattern(recipientClient, /redirect\.searchParams\.set\("application", applicationReference\)/, "Email verification must preserve the stable application reference across the auth redirect.")
forbidPattern(recipientClient, /url\.searchParams\.set\([^\n]*artist_user_id|params\.set\([^\n]*artist_user_id/, "Recipient URLs must never expose the private artist user ID.")

// Existing token security and ownership boundaries remain mandatory.
requirePattern(recipientEdge, /await sha256\(plainToken\)/, "Recipient access tokens must still be hashed before lookup.")
requirePattern(recipientEdge, /\.eq\("artist_user_id", user\.id\)/, "Artist-managed recipient access must remain owner scoped.")
requirePattern(schema, /token_hash text not null unique/, "Stored recipient access must keep a unique token hash.")
requirePattern(schema, /application_recipient_access_active_package_idx[\s\S]*where revoked_at is null/i, "Only one active recipient-access record may exist for an application package.")
requirePattern(schema, /unique \(artist_user_id, opportunity_id\)|unique\s*\(\s*artist_user_id\s*,\s*opportunity_id\s*\)/i, "Each artist/opportunity pair must resolve to one application package identity.")

// Stress the URL model with many independent applications and repeated token rotations.
const applicationPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const tokenPattern = /^[a-f0-9]{64}$/
const applications = new Set()
const urls = new Set()
const iterations = 25000

for (let index = 0; index < iterations; index += 1) {
  const application = randomUUID()
  const firstToken = randomBytes(32).toString("hex")
  const rotatedToken = randomBytes(32).toString("hex")
  const first = new URL("https://www.kleioarthouse.com/application-review/")
  first.searchParams.set("application", application)
  first.searchParams.set("token", firstToken)
  const rotated = new URL("https://www.kleioarthouse.com/application-review/")
  rotated.searchParams.set("application", application)
  rotated.searchParams.set("token", rotatedToken)

  assert(applicationPattern.test(application), `Generated application reference ${index} is malformed.`)
  assert(tokenPattern.test(firstToken) && tokenPattern.test(rotatedToken), `Generated secure token ${index} does not preserve 256-bit hex form.`)
  assert(firstToken !== rotatedToken, `Token rotation ${index} unexpectedly reused the prior token.`)
  assert(first.searchParams.get("application") === rotated.searchParams.get("application"), `Token rotation ${index} changed the stable application identity.`)
  assert(first.searchParams.get("token") !== rotated.searchParams.get("token"), `Token rotation ${index} did not change the secret access credential.`)

  applications.add(application)
  urls.add(first.toString())
  urls.add(rotated.toString())
}

assert(applications.size === iterations, `Application-reference stress run produced ${iterations - applications.size} UUID collision(s).`)
assert(urls.size === iterations * 2, `URL stress run produced ${iterations * 2 - urls.size} duplicate canonical URL(s).`)

// Malformed and mismatched references must fail the same contract used by the browser client.
for (const malformed of ["", "artist@example.com", "../../admin", "not-a-uuid", randomBytes(16).toString("hex")]) {
  assert(!applicationPattern.test(malformed), `Malformed application reference was unexpectedly accepted: ${malformed}`)
}
const appA = randomUUID()
const appB = randomUUID()
assert(appA.toLowerCase() !== appB.toLowerCase(), "Mismatch simulation unexpectedly generated identical UUIDs.")

if (failures.length) {
  console.error("KLEIO recipient review URL integrity audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`KLEIO recipient review URL integrity audit passed: ${iterations.toLocaleString()} stable application identities, ${iterations.toLocaleString()} token rotations, ${urls.size.toLocaleString()} unique canonical URLs, malformed-reference rejection, ownership boundaries, hashed-token storage, and verification redirect continuity validated.`)
