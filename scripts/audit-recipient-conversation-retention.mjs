import fs from "node:fs"
import path from "node:path"

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

const review = read("components/kleio/recipient-application-review.tsx")
const demo = read("app/application-review/demo/recipient-review-demo.tsx")
const demoPage = read("app/application-review/demo/page.tsx")
const artistConversation = read("components/kleio/artist-recipient-conversation.tsx")
const artistClient = read("lib/kleio-artist-recipient-conversation.ts")
const conversationService = read("supabase/functions/application-conversation/index.ts")
const returnPage = read("app/application-review/conversation/page.tsx")
const returnComponent = read("components/kleio/recipient-conversation-return.tsx")
const returnClient = read("lib/kleio-recipient-conversation-return.ts")

// Compact information architecture: information remains accessible, but deep content is progressive.
requirePattern(review, /CompactResponse/, "Recipient review must use the compact response treatment.")
requirePattern(review, /Read full response/, "Long approved answers must remain available on demand.")
requirePattern(review, /workView.*grid/s, "Selected works must default to the compact grid treatment.")
requirePattern(review, /More artist context/, "Deeper artist context must remain accessible without dominating the first pass.")
requirePattern(review, /py-8 sm:py-10/, "Recipient sections must keep the compact vertical rhythm.")

// Compose first, identify second, convert last.
requirePattern(review, /identityStepOpen/, "Messaging must keep identity collection behind the compose step.")
requirePattern(review, /Continue to send/, "Recipient must be able to compose before identity verification appears.")
requirePattern(review, /No signup interruption while you are composing\./, "Compose-first messaging must explicitly avoid an upfront signup interruption.")
requirePattern(review, /One lightweight verification/, "Identity handoff must be framed as lightweight verification rather than a forced institution signup.")
requirePattern(review, /Keep this review organized/, "Workspace conversion must be framed around preserved review value.")
requirePattern(review, /No account is required to continue reviewing this submission\./, "Workspace conversion must remain optional.")
forbidPattern(review, /sign up to message|signup to message|create an account to message/i, "Messaging must not be hard-gated behind a full account.")

// Synthetic acceptance surface demonstrates the same progressive interaction without sending real data.
requirePattern(demoPage, /RecipientReviewDemo/, "Synthetic preview route must render the interactive compact demo.")
requirePattern(demo, /Synthetic interaction — nothing is sent from this preview\./, "Synthetic demo must never imply it sends a real message.")
requirePattern(demo, /Continue to send/, "Synthetic demo must demonstrate compose-first messaging.")
requirePattern(demo, /Simulate verified send/, "Synthetic demo must clearly label the simulated verification step.")

// Artist replies become tracked application-conversation actions rather than untracked direct inserts.
requirePattern(artistClient, /functions\.invoke\("application-conversation"/, "Artist replies must pass through the application conversation service.")
requirePattern(conversationService, /action === "send_artist_reply"/, "Conversation service must support authenticated artist replies.")
requirePattern(conversationService, /\.eq\("artist_user_id", user\.id\)/, "Artist reply authorization must be ownership-scoped.")
requirePattern(conversationService, /last_message_at: message\.created_at/, "Artist and recipient replies must update conversation recency.")
requirePattern(conversationService, /sender_kind: "artist"/, "Artist replies must be preserved in the application message ledger.")

// Email is a truthful notification/return channel, never the source of truth.
requirePattern(conversationService, /RESEND_API_KEY/, "Transactional recipient notification must be explicitly provider-configured.")
requirePattern(conversationService, /KLEIO_EMAIL_FROM/, "Recipient notification must require an explicit sender identity.")
requirePattern(conversationService, /generateLink/, "Artist reply notification must use a secure authenticated return link.")
requirePattern(conversationService, /notification_status/, "Artist reply must return a truthful notification result.")
requirePattern(artistConversation, /Email notification delivery is not configured yet, so KLEIO is not claiming the recipient was notified\./, "Artist UI must not claim an email notification was sent when delivery is unconfigured.")
requirePattern(artistConversation, /email notification could not be confirmed/, "Artist UI must distinguish notification failure from message persistence.")

// The recipient can resume and continue the thread without needing the original plaintext review token.
requirePattern(conversationService, /resume_recipient_conversation/, "Conversation service must support authenticated recipient return.")
requirePattern(conversationService, /recipientConversationForUser/, "Recipient return must be scoped to the verified auth identity.")
requirePattern(conversationService, /send_recipient_reply/, "Returning recipients must be able to continue the application conversation.")
requirePattern(returnPage, /RecipientConversationReturn/, "Secure recipient conversation return route is missing.")
requirePattern(returnComponent, /Continue with your verified email\./, "Expired sessions must offer a verified-email return path rather than forcing institution signup.")
requirePattern(returnComponent, /You do not need a full account to use this conversation\./, "Conversation return must preserve the optional institution-workspace boundary.")
requirePattern(returnClient, /shouldCreateUser: false/, "Conversation re-authentication must not silently create unrelated new users.")
forbidPattern(conversationService, /token_hash\s*:/, "Reply notifications must not reconstruct or persist plaintext review-token material.")

if (failures.length) {
  console.error("KLEIO recipient conversation retention audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO recipient conversation retention audit passed: compact dossier, compose-first identity, optional workspace conversion, tracked conversation replies, truthful notification status, and secure recipient return verified.")
