# KLEIO Artist Discovery, Outreach, Media, and Access Audit

Date: July 23, 2026

## Scope reviewed

- Institution Artist Discovery and Applicant Records routes.
- Artist discovery consent and approved profile publication.
- Creative Passport, artist profile presentation, and selected portfolio works.
- Institution opportunity image and application-cover media.
- Institution-to-artist discovery invitations and opportunity conversations.
- Artist replies, invitation decisions, mute, archive, and report controls.
- Supabase authentication identity, protected roles, institution memberships, Row Level Security, storage policies, database functions, triggers, grants, and notifications.
- GitHub static export, route verification, navigation audit, user-facing copy audit, and demo/live separation.

## Product boundaries implemented

### Artist Discovery

`/artists/` is the authenticated institution discovery destination. Connected mode reads only `artist_discovery_profiles` records with `visibility = 'institutions'`. It does not fall back to synthetic artists.

The discovery projection contains only artist-approved presentation information:

- Professional name.
- General location.
- Biography, statement, and practice description.
- Disciplines, mediums, languages, themes, career stage, and availability.
- Profile photo.
- Featured work reference.
- Up to eight artist-selected portfolio works.
- Artist-approved website and Instagram links.

The projection intentionally excludes:

- Private email.
- Authentication metadata and account credentials.
- CV files and private documents.
- Tax, identity, legal, and residency documents.
- Draft applications and application-specific answers.
- References.
- Institution notes and reviewer scores.
- Unrelated application history.
- Portfolio works the artist did not select for discovery.

Discovery defaults to `private`. Existing and new artists are not automatically discoverable.

### Applicant Records

`/artists/applicants/` remains institution-specific and is derived from applications connected to calls owned by the authenticated institution. It preserves submitted profile snapshots and does not depend on current discovery visibility.

An artist who disables discovery remains in the legitimate application record of institutions to which they submitted.

### Opportunity media

The existing opportunity image remains separate from the new submission/application cover.

Both accept JPG, PNG, or WebP files up to the configured 10 MB bucket limit. Institution media paths are generated from the authenticated uploader ID, call ID, media purpose, and a random UUID. Arbitrary SVG and executable uploads are not accepted by the client or bucket MIME allowlist.

The submission cover requires alt text when attached and supports independent focal-point positioning. It is shown as presentation context and does not change requirements, eligibility, readiness, or submission state.

## Discovery data model and RLS

`artist_discovery_profiles` is a dedicated controlled publication table rather than a permissive view of `artist_profiles`.

A database trigger:

- Derives the artist from `auth.uid()`.
- Rejects publication on behalf of another artist.
- Copies approved presentation fields from the authoritative owned Creative Passport.
- Verifies every selected portfolio work belongs to the artist.
- Rebuilds the selected-work projection from owned portfolio records.
- Limits selected discovery works to eight.
- Manages discovery activation timestamps.

RLS permits:

- The artist to select and manage only their own publication.
- An active authenticated institution account to select only opted-in institution-visible publications.
- No anonymous access.

Authorization helpers used by policies are located in the non-exposed `messaging_private` schema. Public compatibility helpers are not executable by `anon` or `authenticated` roles.

## Artist media access

The previous authenticated storage policy allowed overly broad access to profile image paths referenced by artist profiles. It was replaced.

Private `artist-assets` objects are now readable only when one of these relationships is true:

1. The object belongs to the authenticated artist.
2. The object is a portfolio work selected in an application the institution may manage.
3. The object is an approved profile or selected-work image inside an opted-in discovery publication and the reader is an active authenticated institution account.

CVs and unrelated artist files remain outside the discovery rule.

## Institution media ownership

Opportunity-media storage writes require:

- An authenticated institution account.
- An institution owner or an active authorized membership role.
- A first path segment equal to the current authenticated user ID.
- A safe generated path.
- An allowed image MIME type and bucket size limit.

The open-call media trigger additionally verifies that the uploader is authorized for the institution attached to the call. One institution cannot attach another institution member's path or change media for an unrelated institution.

The `opportunity-images` bucket is intentionally public for published opportunity and application presentation. Public listing does not grant upload, update, delete, or database attachment rights.

## Listing-based outreach rules

An institution may initiate discovery outreach only when all of these are true:

- The caller is authenticated.
- The caller is the institution owner or has an active authorized management role.
- The selected opportunity is a native KLEIO internal listing.
- The source is the active KLEIO institution source.
- The call is published and open.
- The opening date has arrived.
- The deadline has not passed.
- The opportunity belongs to the caller's institution.
- The artist is opted into institution discovery.
- The artist permits active-listing invitations.

The database maintains one canonical institution–artist–opportunity invitation and conversation. A repeated request for an active invitation returns the existing relationship without adding another opening message. Completed, declined, withdrawn, applied, or expired invitations cannot be reused to send another invitation through the same listing.

A database-enforced limit of 25 non-draft invitations per institution in 24 hours provides an initial anti-abuse boundary. Bulk outreach is not implemented.

## Artist initiation restrictions

Artists cannot create a new opportunity conversation merely because a listing exists.

`get_or_create_opportunity_conversation` now requires either:

- A valid institution-created invitation that is not expired or withdrawn, or
- A non-draft application submitted by that artist to the matching internal call.

Artists may reply only inside an authorized thread. They cannot change the attached artist, institution, opportunity, conversation origin, or participant identifiers.

## Invitation and conversation controls

Invitation states:

- Draft.
- Sent.
- Viewed.
- Interested.
- Declined.
- Expired.
- Withdrawn.
- Applied.

An invitation is not an application. Viewing, replying, or expressing interest does not create or submit an application.

Artists may:

- Express interest.
- Decline.
- Open the authorized conversation.
- Begin a separate artist-controlled application-preparation flow.
- Mute or unmute.
- Archive or restore.
- Report outreach with a bounded reason.

Conversation-control writes are available only through an RPC that derives the artist from `auth.uid()` and confirms the artist is the conversation participant.

## Notification privacy

Opportunity-message notifications no longer include private message excerpts. Notifications contain contextual listing information and a route to the authorized message center.

## Credentials and frontend exposure

- No Supabase service-role key is present in the reviewed frontend or repository search results.
- GitHub Pages contains only the Supabase publishable key and project URL required by the browser client.
- Role authority is derived from protected `profiles`, institution ownership, and active institution membership records, not URL parameters, local storage, hidden controls, or editable profile metadata.
- `AuthGate` remains the route-level institution/artist boundary, while RLS and RPC checks remain the authoritative data boundary.
- Synthetic demo records remain in guided-demo mode and are not substituted into connected discovery or applicant views.

## Database verification completed

- RLS is enabled on `artist_discovery_profiles`, `artist_opportunity_invitations`, and `artist_opportunity_conversation_controls`.
- Final discovery, invitation, control, artist-asset, and opportunity-media policies were queried after migration.
- `anon` has no execution privilege on discovery and outreach RPCs.
- Trigger-only functions are not executable by browser roles.
- Authenticated access is retained only for intentional RPC entry points that validate `auth.uid()` and protected relationships internally.
- Foreign-key indexes added for new invitation and control relationships.
- Duplicate permissive SELECT policies introduced during development were consolidated.

## Advisor results

Supabase security and performance advisors were rerun after the final migrations.

New helper-function exposure and new foreign-key/multiple-policy performance findings created during this implementation were resolved.

Remaining project-level findings are documented rather than hidden:

- Supabase leaked-password protection is disabled and should be enabled in Auth settings before broad production launch.
- Supabase flags authenticated `SECURITY DEFINER` RPCs. The new invitation, response, listing, message, and artist-control functions are intentional browser RPC entry points and validate `auth.uid()` plus ownership or participant relationships internally. Several older project RPCs remain separately flagged and should receive a dedicated least-privilege review.
- Pre-existing RLS initialization-plan and multiple-policy performance warnings remain on older application, review, membership, and message tables.
- Newly created indexes are reported as unused immediately after creation because the connected environment has not accumulated production query statistics.

References:

- Security-definer advisor: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- Password protection: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- RLS performance: https://supabase.com/docs/guides/postgres/row-level-security#call-functions-with-select

## Validation limitations

Repository checks validate TypeScript, ESLint, static export, critical routes, navigation, and user-facing copy.

A true isolated browser test with Artist A, Artist B, Institution A owner, Institution A reviewer, Institution B, and an unauthenticated session requires controlled test credentials for each role. Those credentials were not available in this execution context. This audit therefore does not claim that a complete multi-session browser walkthrough occurred.

Database structure, policies, grants, functions, triggers, storage rules, and advisor results were inspected directly. The remaining credentialed browser matrix should be completed before treating the platform as production-certified.

## Hosting

Only GitHub branches, pull requests, GitHub Actions, GitHub Pages, and the connected Supabase project were used. No Vercel deployment or tooling was used.
