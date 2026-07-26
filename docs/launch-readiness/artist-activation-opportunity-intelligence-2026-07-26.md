# KLEIO Artist Activation and Verified Opportunity Intelligence

**Implementation date:** July 26, 2026  
**Scope:** Artist activation, verified opportunity intelligence, eligibility-first matching, application preparation, Supabase persistence and security, PhotoVogue reference fixture, and launch readiness.  
**Status:** Material production implementation completed. Automated source verification passes. Public artist launch readiness is **not yet fully confirmed** because a fresh-account deployed-browser walkthrough remains outstanding.

## Executive conclusion

KLEIO now has a credible production foundation for the artist journey described in the implementation brief:

> Artist signs up → completes onboarding → builds a reusable Creative Passport → adds meaningful work and materials → receives explainable eligibility-first opportunity analysis → prepares an artist-controlled package → reviews and authorizes the supported next action → saves and tracks the application.

The live Supabase project now contains durable artist activation milestones, private reusable materials, expanded opportunity verification and lifecycle fields, artist-controlled artwork provenance, policy-aware opportunity evaluation, and a verified PhotoVogue reference fixture. The live client on this branch uses persisted server evaluations instead of silently treating browser-calculated similarity as verified eligibility.

Automated CI passes:

- TypeScript.
- Lint.
- Static production export.
- Critical auth and workspace exports.
- Internal navigation audit.
- User-facing copy audit.

KLEIO should still delay broad artist outreach until the current branch is deployed and one complete first-time browser journey passes against the deployed environment.

---

# 1. Current-state audit

## Working authentically

- Supabase authentication, role-based profiles, artist profiles, portfolio works, saved opportunities, application packages, institutions, open calls, submissions, reviewer assignments, reviews, messages, and status history exist in production.
- Core account, Passport, opportunity, and application records are Supabase-backed rather than authoritative local-storage state.
- Artist-private records use row-level security.
- Artist, institution, reviewer, and application access boundaries exist in the schema and policies.
- Artist and application files use private storage buckets; only the intended opportunity-preview bucket is public.
- Opportunity records support official URLs, source attribution, structured eligibility rules, structured requirements, translations, source snapshots, and search.
- Application preparation preserves selected works, written content, approval confirmations, application-package records, submission attempts, native-submission history, and externally reported status.
- Email preparation creates a reviewable file and does not silently send an email.
- External submissions remain artist-reported unless provider evidence confirms receipt.

## Demo and synthetic behavior

- Guided-demo data remains synthetic by design.
- The repository contains demo components and static demo routes. This is acceptable only while live accounts and demo state remain visibly separated.
- The currently observed public GitHub Pages build appears older and demo-first even though current source defaults to live signup. This is a deployment-state issue, not proof that the current source still defaults to prototype mode.

## Still unverified in a deployed browser

- Brand-new email-confirmed artist signup.
- Profile-image upload.
- Interrupted upload recovery.
- Logout/login persistence after the full activation journey.
- Browser restart and cross-device persistence.
- Signed-URL expiration and unauthorized-link behavior.
- Tablet/mobile visual and screen-reader walkthrough.
- Full institution regression walkthrough.

## Current launch blockers

1. Deploy the current branch or merged source and confirm that the public site no longer foregrounds shared demo credentials or prototype language.
2. Complete one fresh-account deployed-browser activation walkthrough.
3. Enforce artwork-policy compatibility against the **exact selected work IDs** inside the preparation workspace before final actions.
4. Enable leaked-password protection.
5. Complete a dedicated authorization review of all authenticated `SECURITY DEFINER` RPCs flagged by Supabase.

---

# 2. Artist activation test report

## Activation definition implemented

Account creation alone is not activation. An artist is activated only when all seven milestones are true:

1. Account exists.
2. Onboarding is complete.
3. Core Creative Passport is materially complete.
4. Professional identity presentation exists.
5. At least three portfolio works exist.
6. At least one reusable application material exists.
7. At least one intentional opportunity action exists.

The server-calculated activation record explains:

- What is complete.
- What is missing.
- Why it matters.
- The next useful action.

It is not a public ranking, streak, gamified quality score, or institutional judgment.

## Test results

| Journey element | Result | Evidence or limitation |
|---|---|---|
| Account/profile records | Passed at database level | Production auth and profile records exist with role separation. |
| Onboarding milestone | Passed at database level | Activation reads persisted onboarding state. |
| Core Passport milestone | Passed | Requires identity, location, biography, statement, and practice fields. |
| Identity presentation | Passed | Requires professional name or profile image. |
| Three-work milestone | Passed transaction test | Two temporary works completed an existing artist's third-work threshold; the transaction was rolled back. |
| Reusable material milestone | Implemented and passed schema/RLS checks | Supports CV, bio, statement, proposal, budget, timeline, references, media, legal records, and reusable answers. |
| Opportunity-action milestone | Passed at database level | Save, track, package preparation, or related intentional action counts. |
| Full activation calculation | Passed transaction test | Every milestone became true immediately; no fake data remained after rollback. |
| Artist-only visibility | Passed | Authenticated test artist saw one own profile, one own activation row, own works, and own materials only. |
| Deployed first-time browser journey | Still required | No new production user was created solely for this implementation. |

No synthetic production artist account was created. The activation completion test was transaction-only and rolled back.

---

# 3. Final opportunity data model

## Verification and provenance

- `external_id`
- official title and organization
- canonical official URL
- application URL
- source ID and source type
- `discovered_at`
- `last_verified_at`
- `verification_status`
- `verification_confidence`
- `verified_by`
- `verification_method`
- `reverify_at`
- source snapshots and source versions

## Lifecycle

- discovered
- parsing
- needs verification
- verified
- published
- updated
- closing soon
- closed
- archived
- source unavailable
- verification expired

## Timing

- opening date
- exact deadline instant
- deadline timezone
- fixed, rolling, recurring, or not stated
- expected decision date
- program start and end

## Eligibility

Existing structured rules can represent:

- worldwide, national, regional, local, city, and radius conditions
- country of residence
- citizenship
- age
- career stage
- applicant type
- discipline and medium
- language
- participation format
- identity or lived-experience conditions requiring voluntary confirmation
- legal, tax, membership, partnership, and other human-reviewed conditions

## Value and effort

Existing opportunity fields and structured metadata support:

- amount and currency
- stipend
- travel, housing, production, exhibition, or publication support
- application fee
- material count
- written-answer count
- preparation effort
- interview/follow-up requirements

## Application requirements

Structured requirements support biographies, statements, CVs, portfolios, image/video/audio counts, proposals, budgets, timelines, references, letters, identification, tax records, links, file types, size limits, external platforms, and verified email destinations.

## Policy separation

Two distinct fields now prevent a critical trust error:

- `artwork_ai_policy`
- `application_assistance_policy`

An opportunity may prohibit AI-generated artwork while remaining silent about administrative assistance. KLEIO no longer collapses those into one claim.

---

# 4. PhotoVogue 2026 reference fixture

## Verified record

| Field | Verified value |
|---|---|
| Opportunity | PhotoVogue 2026 Global Open Call — Brave New Visions |
| Eligibility | Worldwide |
| Minimum age | 18 |
| Accepted media | Photography, video, multimedia |
| Maximum images | 15 |
| Optional trailer | Up to 60 seconds |
| Application fee | No fee |
| Deadline | September 11, 2026 at 21:59 UTC; source timezone retained as CEST |
| Grant information | USD 12,000 total: 6,000 / 4,000 / 2,000 |
| Submission platform | Official external Picter portal |
| Artwork AI policy | Prohibited |
| Application-assistance policy | Not stated by the official source |
| Verification confidence | 1.0 |
| Recheck | Scheduled before the deadline |

## Important correction made

The public PhotoVogue contact address is now stored as a support/contact address, not as an application-submission email. The submission method is the official external Picter portal. This prevents KLEIO from preparing or claiming an invalid email submission.

## Five-profile matrix

1. **Miami photographer, age 36, 15 confirmed non-AI works:** eligible, creative fit, work samples ready.
2. **London video artist, age 17:** ineligible despite creative fit and readiness.
3. **Nairobi sculptor, age 30:** ineligible because the mandatory medium rule fails.
4. **Tokyo photographer with no age:** missing information; KLEIO does not assume eligibility.
5. **Mexico City video artist, age 28, no works:** eligible but not ready.

All five produced the expected layered outcome.

---

# 5. Eligibility-first matching architecture

## Layer 1 — hard eligibility

The persisted evaluator checks mandatory rules before creative relevance.

Directly evaluated rules include:

- deadline expiration
- age
- country/residence/location
- citizenship
- discipline/medium
- career stage
- applicant type
- language
- participation format

Outcomes:

- `eligible`
- `not_eligible`
- `missing_information`
- `eligibility_unclear`

A failed hard rule always overrides semantic or creative similarity.

Identity, lived experience, safety, membership, partnership, and other sensitive/special conditions are never inferred. They remain unknown until explicitly and voluntarily confirmed or reviewed by a human.

## Layer 2 — creative fit

Creative fit uses explicit overlap between artist disciplines/mediums and the opportunity's verified accepted disciplines. It does not estimate artistic quality or likelihood of winning.

## Layer 3 — readiness

Readiness maps verified requirements to:

- Creative Passport fields
- portfolio works
- private reusable materials
- artist confirmations
- required human verification
- file counts, file types, and size limits

## Layer 4 — effort

Effort is low, moderate, or significant based on missing verified requirements and deadline timing. The reason is displayed.

## Layer 5 — strategic value

Where supportable, KLEIO explains funding, career relevance, and whether preparing a missing reusable asset may benefit future applications. The evaluation explicitly stores no winning probability.

## Why-you-match presentation

The live opportunity directory now displays persisted evidence for:

- eligibility status
- exact rule reasons
- source wording and source links
- creative-fit terms
- ready and missing materials
- artist/human confirmations
- preparation effort
- deadline status and official timezone
- verification status and confidence
- last-verified and recheck dates
- artwork/application-assistance policy distinction

The preparation button is unavailable until the server confirms hard eligibility.

---

# 6. Application-preparation architecture

## Existing controlled flow

1. Load the official opportunity and prior package record.
2. Map source requirements to Passport content and selected works.
3. Show complete, missing, and review-required items.
4. Let the artist edit application-specific written material.
5. Let the artist select exact portfolio works.
6. Require explicit confirmations for destination, materials, accuracy, and submission approval.
7. Save the package, selected works, written content, approvals, and submission attempt.
8. Offer only supported next actions:
   - native KLEIO submission for internal calls
   - reviewable email draft
   - official external portal handoff
   - downloadable manifest
9. Preserve submitted snapshots and status history.
10. Keep external status artist-reported unless independently confirmed.

## Boundaries verified

- Email drafts are downloaded for review; no email is silently sent.
- Native submission requires all approvals and a ready state.
- Exported manifests state that they are preparation records, not submission evidence.
- External submission records explicitly state when receipt is not independently verified.
- Generated or prepared content remains editable and artist-approved.

## Route-level guard implemented

The preparation route now independently calls the persisted evaluator. Direct URL navigation is blocked when:

- hard eligibility fails
- the official deadline is expired
- eligibility is unknown or missing information
- required artwork-provenance confirmation is absent
- the evaluator is unavailable

This removes dependence on the artist arriving through the directory button.

## Remaining final-action limitation

The new policy-compatibility RPC validates artist ownership and can check exact work IDs, but the existing preparation workspace does not yet invoke it every time selected works change. Before broad launch, final actions should require compatibility for the exact selected set, not merely the existence of at least one compatible work in the artist's portfolio.

---

# 7. Security audit

## Authentication

Production auth and role assignment exist. The complete deployed browser test for signup, verification, reset, session expiration, and redirect behavior remains outstanding.

Supabase leaked-password protection is currently disabled and should be enabled before broader outreach.

## Row-level security

Verified with an authenticated artist context:

- only the artist's own private profile was visible
- only the artist's own activation row was visible
- only the artist's own portfolio works were visible
- only the artist's own reusable materials were visible
- only the artist's own opportunity evaluations were visible

`artist_materials` uses own-only management. `artist_activation_status` is server-computed and read-only to the artist.

## Evaluator isolation

The internal base evaluator was moved into the private schema and direct client execution was revoked. Clients call only the policy-aware public evaluator.

## Storage

Private buckets and owner-path policies exist for artist and application assets. Public access is limited to the intended opportunity-preview bucket. Signed-link expiry, interrupted uploads, deletion, replacement, and orphan cleanup still require browser/storage testing.

## Security-definer warnings

Supabase continues to flag authenticated `SECURITY DEFINER` RPCs. Many are intentionally user-invoked operations, but every function must independently authorize the caller and restrict row scope. The opportunity admin import and approval functions reviewed here independently enforce KLEIO-admin status. A systematic audit of the remaining flagged functions is still required.

## Performance-advisor findings

- The new source-version foreign-key index is present.
- Several older RLS policies should use `(select auth.uid())`-style initialization to avoid per-row reevaluation.
- Several tables have multiple permissive policies for the same role/action.
- Numerous indexes are reported unused, which is expected in a low-traffic project; they should not be deleted without representative production query data.

---

# 8. Implementation summary

| Subsystem | Change made | Result | Remaining limitation |
|---|---|---|---|
| Opportunity schema | Added provenance, lifecycle, recheck, and AI-policy fields | Publishable opportunities can carry verification evidence and policy boundaries | Older records need structured backfill/re-verification |
| Private Passport materials | Added `artist_materials` with versioning, visibility, and own-only RLS | Reusable application assets can persist privately | UI coverage for every material type is incomplete |
| Activation | Added server-computed milestone record and triggers | Activation reflects meaningful product use | Deployed-browser funnel analytics still needed |
| Opportunity evaluations | Added hard eligibility, fit, readiness, effort, strategic value, and explanation | Matching is persisted and explainable | Some opportunities lack a current source-version row |
| Artwork provenance | Added artist-controlled creation status and disclosure notes | AI-art restrictions can be evaluated without inference | Existing works default to unknown until artists review them |
| PhotoVogue fixture | Corrected portal handoff, support contact, policy separation, and verification | Complete reference opportunity for system tests | Live Picter form fields still require handoff-time review |
| Opportunity directory | Replaced browser-only analysis with persisted batch RPC | Eligibility cannot be overridden by a cosmetic percentage | Full deployed responsive test remains |
| Preparation route | Added independent server-evaluation gate | Direct URL bypass is closed | Exact selected-work compatibility still needs final-action enforcement |
| Artist dashboard | Added durable activation status card | Artists see what is complete, missing, and why | Deployed accessibility test remains |
| Source control | Mirrored all applied migrations and client changes | Production database and branch are aligned | PR remains draft until deployment walkthrough passes |

---

# 9. Testing report

## Passed

- All production migrations applied.
- New-table RLS enabled.
- Authenticated own-data visibility.
- Activation-trigger recalculation.
- Rollback-only full activation test.
- Hard ineligibility overriding creative fit.
- Missing information remaining unknown.
- Expired-deadline failure logic.
- Readiness mapping to works and private materials.
- Artwork policy separated from application-assistance policy.
- Work-policy ownership validation.
- Five-profile PhotoVogue matrix.
- Batch evaluation RPC.
- Source-version foreign-key index.
- Preparation route hard-eligibility guard.
- TypeScript CI.
- Lint CI.
- Static export CI.
- Critical auth/workspace export verification.
- Internal navigation audit.
- User-facing copy audit.

## Still blocked or unverified

- Fresh email-confirmed artist browser journey.
- Profile image and document upload on the deployed build.
- Logout/login, browser restart, and cross-device persistence.
- Tablet/mobile and assistive-technology walkthrough.
- Unauthorized signed-link and expiry tests.
- Full institution browser regression test.
- Exact selected-work policy check inside preparation final actions.
- Public deployment verification.

## Test-data integrity

No synthetic production users were created. The five-profile matrix was a temporary SQL fixture. The activation completion test was rolled back.

---

# 10. Prioritized next actions

1. **Merge/deploy only after reviewing the draft PR, then verify the live public entry state.** The public site must present real signup clearly and keep the guided demo separate.
2. **Run one complete fresh-account deployed-browser walkthrough.** Include email confirmation, profile image, core Passport, three works, one reusable material, eligible/ineligible matching, package preparation, logout/login, mobile width, and cross-account denial.
3. **Close the exact selected-work policy boundary and enable leaked-password protection.** Then run the focused security-definer authorization review.

Broad artist outreach should begin only after those three actions pass.
