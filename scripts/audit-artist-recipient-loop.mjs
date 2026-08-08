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

const schema = read("supabase/migrations/20260805161000_artist_recipient_application_loop.sql")
const consistency = read("supabase/migrations/20260805163000_artist_workflow_consistency.sql")
const reset = read("supabase/migrations/20260805164500_practice_submission_reset.sql")
const hardening = read("supabase/migrations/20260805170000_recipient_security_hardening.sql")
const edge = read("supabase/functions/recipient-application-review/index.ts")
const recipientPage = read("components/kleio/recipient-application-review.tsx")
const recipientClient = read("lib/kleio-recipient-application.ts")
const artistPanel = read("components/kleio/application-recipient-loop-panel.tsx")
const artistConversation = read("components/kleio/artist-recipient-conversation.tsx")
const completion = read("lib/kleio-passport-completion.ts")
const alignment = read("lib/kleio-application-alignment.ts")
const passportWorkspace = read("components/kleio/creative-passport-workspace.tsx")
const terms = read("components/kleio/forms/artist-term-fields.tsx")

// Synthetic opportunity and data isolation.
requirePattern(schema, /KLEIO Independent Practice Submission Test/, "The synthetic practice opportunity must remain explicitly named.")
requirePattern(schema, /luminaryblur@gmail\.com/, "The internal test recipient must remain configured.")
requirePattern(schema, /data_scope in \('real', 'guided_demo', 'synthetic_test'\)/, "Data scope must separate real, demo, and synthetic records.")
requirePattern(edge, /Internal workflow test\. This is not a real grant/, "The recipient snapshot must carry a persistent synthetic notice.")
requirePattern(reset, /reset_my_kleio_practice_submission/, "A safe authenticated practice reset RPC is required.")
requirePattern(reset, /preserved_artist_data/, "The practice reset must state that artist source data is preserved.")
forbidPattern(reset, /delete from public\.artist_profiles|delete from public\.portfolio_works|delete from storage\./i, "The test reset must never delete Passport, portfolio, or storage records.")

// Secure recipient token boundary.
requirePattern(schema, /token_hash text not null unique/, "Recipient access must store a hash rather than a plaintext token.")
requirePattern(schema, /expires_at timestamptz not null/, "Recipient access must expire.")
requirePattern(schema, /revoked_at timestamptz/, "Recipient access must be revocable.")
requirePattern(schema, /revoke all on public\.application_recipient_access from anon/, "Anonymous users must not receive direct recipient-table grants.")
requirePattern(hardening, /No direct client access to recipient drafts/, "The server-only recipient draft table must carry an explicit deny policy.")
requirePattern(hardening, /revoke execute on function public\.calculate_artist_passport_completion\(uuid\) from authenticated/, "Internal completion helpers must not be exposed as client RPCs.")
requirePattern(edge, /await sha256\(plainToken\)/, "The Edge Function must hash incoming review tokens.")
requirePattern(edge, /createSignedUrl\(normalized, expiresIn\)/, "Private recipient assets must use short-lived signed URLs.")
requirePattern(edge, /safeMetadataKeys/, "Recipient event metadata must use an allowlist.")
requirePattern(edge, /\(count \?\? 0\) >= 8/, "Guest question drafting must be rate limited.")
forbidPattern(edge, /console\.(?:log|info|debug)\(/, "The recipient function must not log private application content.")

// Approval and visibility gates.
requirePattern(edge, /artist_approval_required/, "External recipient access must require explicit artist approval.")
requirePattern(edge, /approved_snapshot/, "Recipient pages must render an artist-approved snapshot rather than live private data.")
requirePattern(recipientPage, /core application remains viewable without an account/i, "The recipient page must not force signup before showing the application.")
requirePattern(`${recipientPage}\n${artistConversation}`, /Email verification does not label you as a verified institution|Email verified—not institution verified/, "Email verification must remain distinct from institution verification.")
requirePattern(recipientPage, /The artist controls whether any additional information becomes visible/, "Extended profile access must remain artist controlled.")
requirePattern(recipientPage, /KLEIO records basic application activity/, "The recipient page must disclose activity recording.")
requirePattern(recipientPage, /do not prove that an email was read/, "The recipient page must reject false read claims.")

// Recipient review room experience and conversion restraint.
for (const label of ["Secure Submission Review", "Application overview", "Application responses", "Selected works", "Supporting materials", "Artist context", "Communication"])
  requirePattern(recipientPage, new RegExp(label, "i"), `Recipient review room is missing the required section or context: ${label}`)
requirePattern(recipientPage, /IntersectionObserver/, "Recipient review navigation must track the active section during scroll.")
requirePattern(recipientPage, /Download submission/, "The recipient hero must expose a dossier download/save action.")
requirePattern(recipientPage, /Message applicant/, "The recipient hero must expose a direct applicant communication action.")
requirePattern(recipientPage, /meaningfulInteraction/, "Institution conversion must be delayed until the reviewer has received meaningful product value.")
requirePattern(recipientPage, /No account is required to continue reviewing this submission\./, "Institution conversion must explicitly preserve guest review access.")
requirePattern(recipientPage, /Create an Institution Workspace/, "The review room must provide a clear institution-workspace continuation after value is demonstrated.")
requirePattern(recipientPage, /role="dialog"[\s\S]*aria-modal="true"/, "Artwork focus view must be exposed as an accessible modal dialog.")
requirePattern(recipientPage, /This artwork is temporarily unavailable\. The remaining submission materials are still accessible\./, "Artwork failure states must preserve access to the rest of the submission.")
forbidPattern(recipientPage, /item\.confidence/, "Internal AI confidence values must not appear in the recipient review experience.")

// Exact application content and non-invented project context.
requirePattern(edge, /approvedApplicationResponses/, "The recipient snapshot must map exact approved application answers back to their opportunity questions.")
requirePattern(edge, /requirement_snapshot/, "Exact application response labels must come from the preserved requirement snapshot.")
requirePattern(edge, /application_responses: applicationResponses/, "The artist-approved review snapshot must preserve exact application responses.")
requirePattern(recipientPage, /snapshot\?\.application_responses/, "The review room must prefer exact approved application responses over generic legacy labels.")
requirePattern(recipientPage, /Budget \/ project structure/, "Budget and timeline answers must receive a calm project-structure section when they actually exist.")
requirePattern(recipientPage, /Opportunity support/, "Opportunity funding context must be labelled as opportunity support rather than invented requested funding.")
forbidPattern(recipientPage, /Requested support/, "The review room must not fabricate an artist-requested amount from an opportunity award range.")
requirePattern(edge, /exhibition_history/, "Approved professional context should preserve exhibition history when present in the Passport snapshot.")
requirePattern(edge, /disciplines: stringList\(passport\.disciplines\)/, "Approved artist disciplines should travel with the review snapshot.")

// Question verification, recipient identity, and conversation continuity.
requirePattern(edge, /application_recipient_message_drafts/, "Guest questions must be preserved before verification.")
requirePattern(recipientClient, /emailRedirectTo: redirect\.toString\(\)/, "Magic-link verification must return to the exact review URL.")
requirePattern(recipientClient, /draftToken/, "The preserved guest draft token must survive the verification round trip.")
requirePattern(recipientClient, /display_name: identity\.displayName/, "Recipient name must be passed into the verified messaging handoff.")
requirePattern(recipientClient, /organization_name: identity\.organizationName/, "Recipient organization must be passed into the verified messaging handoff.")
requirePattern(edge, /display_name: displayName/, "Recipient display name must be preserved server-side before verification.")
requirePattern(edge, /organization_name: organizationName/, "Recipient organization must be preserved server-side before verification.")
requirePattern(edge, /preparedIdentity/, "Email verification must update the prepared identity rather than overwrite its name and organization context.")
requirePattern(edge, /verified_email_mismatch/, "Verified recipient email must match the question draft email.")
requirePattern(edge, /conversation_started/, "Verified first questions must create an application conversation event.")
requirePattern(artistConversation, /Reply sent and preserved with this application conversation/, "Artists must be able to reply inside the application-specific conversation.")

// Truthful email handoff and tracking.
requirePattern(artistPanel, /status:\s*"email_client_opened"/, "The default-client handoff must record Email client opened.")
requirePattern(artistPanel, /attachments_automatically_added:\s*false/, "The default-client handoff must explicitly state attachments were not inserted.")
requirePattern(artistPanel, /not that the email was sent, delivered, opened, or read/i, "The artist interface must distinguish email-client handoff from delivery and reading.")
requirePattern(recipientClient, /mailto:/, "The non-Gmail fallback must use a prefilled mailto action.")
requirePattern(schema, /evidence_level in \('self_reported', 'system_observed', 'recipient_confirmed', 'provider_confirmed'\)/, "Submission events must preserve evidence levels.")

// Passport completion and terminology.
for (const key of ["identity", "discipline", "narrative", "cv", "portfolio", "artwork_images", "artwork_metadata"])
  requirePattern(completion, new RegExp(`key: "${key}"`), `Passport completion category is missing: ${key}`)
requirePattern(completion, /Math\.min\(rawPercentage, 99\)/, "Passport completion must remain below 100 while critical categories are missing.")
requirePattern(consistency, /calculate_artist_passport_completion/, "The database must enforce the same weighted Passport completion direction.")
requirePattern(passportWorkspace, /completion\?\.percentage/, "The compact interface must display Passport completion independently.")
requirePattern(passportWorkspace, /Active applications/, "The compact interface must display opportunity activity independently from Passport completion.")
requirePattern(passportWorkspace, /criticalMissing[\s\S]*Next information to complete/, "The Passport overview must surface critical missing categories as the next useful actions.")
requirePattern(terms, /Creative disciplines/, "The broad creative field must be labeled Creative disciplines.")
requirePattern(terms, /Describe what you work with or how you create the work/, "Mediums, materials, and methods must explain the distinction.")
requirePattern(terms, /pointerdown/, "The discipline picker must dismiss on outside interaction.")
requirePattern(terms, /Close discipline options/, "The discipline picker must expose a visible close control.")

// Evidence-backed drafting.
requirePattern(alignment, /supported,|supported:/, "Weak thematic relationships must be represented explicitly as supported or unsupported.")
requirePattern(alignment, /could not find a defensible thematic connection/i, "Unsupported thematic alignment must ask for artist context instead of inventing.")
requirePattern(alignment, /artistEvidence/, "Every supported alignment statement must preserve artist evidence.")
requirePattern(artistPanel, /Evidence is mapped to approved Passport content/, "The artist must see how the introduction is grounded.")
requirePattern(artistPanel, /cleared the prior approval and requires a new final review/, "Changing the introduction must invalidate prior artist approval.")

if (failures.length) {
  console.error("KLEIO artist-recipient workflow audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO artist-recipient workflow audit passed: synthetic isolation, weighted completion, compact next-action hierarchy, requirement normalization, approval gates, secure guest review, exact approved application responses, editorial recipient review room, truthful project context, delayed institution conversion, truthful mailto handoff, recipient identity continuity, verified conversation, artist reply, access revocation, and safe reset boundaries verified.")
