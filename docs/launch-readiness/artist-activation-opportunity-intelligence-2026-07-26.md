# KLEIO Artist Activation and Verified Opportunity Intelligence

**Implementation date:** 2026-07-26  
**Scope:** Artist activation, verified opportunity schema, eligibility-first matching, PhotoVogue reference fixture, application-preparation boundaries, persistence, security, and launch readiness.  
**Status:** Material production implementation completed; public launch readiness is **not yet confirmed**.

## Executive conclusion

KLEIO now has a substantially stronger production data foundation for artist activation and explainable opportunity analysis. The live Supabase project contains durable activation milestones, private reusable artist materials, expanded opportunity provenance and lifecycle fields, artist-controlled artwork provenance, policy-aware eligibility evaluation, and source-backed PhotoVogue reference data.

The live opportunity-directory client on this branch now uses persisted server evaluations rather than silently presenting browser-only match calculations as verified eligibility. The live artist workspace also surfaces durable activation milestones without treating account creation as activation.

KLEIO should **not** begin broad artist outreach yet. The published GitHub Pages build appears stale and demo-first, a complete first-time browser walkthrough has not been passed after deployment, and the repository navigation audit remains red. These are launch blockers, not cosmetic issues.

---

# 1. Current-state audit

## Working authentically

- Supabase authentication, profile roles, artist profiles, portfolio works, saved opportunities, applications, institutions, open calls, and review-related tables exist in production.
- Core artist and institution data is stored in Supabase rather than relying only on local storage.
- Artist profile, portfolio, saved-opportunity, application-package, and opportunity-evaluation records have row-level security.
- Storage uses private buckets for artist documents, artist assets, portfolio images, application documents, institution logos, and source documents. The opportunity-preview bucket is intentionally public.
- Opportunity records already support official URLs, source attribution, structured eligibility rules, structured requirements, translations, snapshots, and search.
- Application preparation already supports package persistence, approval confirmations, selected-work snapshots, written content, email-preview export, downloadable manifests, native KLEIO submission, submission-attempt records, and explicitly artist-reported external submission status.
- The institution path has production tables and RLS for institutions, members, open calls, applications, reviewer assignments, reviews, messages, and status history.

## Mock or demo-only behavior

- The currently published GitHub Pages build presents demo credentials and prototype language even though the current source defaults to live mode.
- Guided-demo data is synthetic by design and must remain clearly separated from live accounts.
- The repository still contains demo components and static exports used by guided-demo mode. Their presence is acceptable only when live routes do not accidentally fall into demo state.

## Broken or unverified behavior

- A brand-new email-confirmed artist account has not been tested through the full deployed browser journey after these changes.
- Cross-device persistence has not been browser-tested during this implementation.
- The public deployment has not been verified against the current branch.
- The navigation audit reports many unresolved static-export and literal-route failures.
- Direct navigation to the application-preparation URL can currently bypass the opportunity-directory eligibility gate. The preparation workspace still needs a server-side or component-level eligibility guard.
- The preparation workspace does not yet consume the new artwork-provenance compatibility RPC for the artist's exact selected works.
- PhotoVogue has verified source facts and rule provenance, but no current `opportunity_source_versions` row is linked to the evaluation yet.
- Full institution regression testing was not completed in a browser.

## Persistence risks

- Core production records are Supabase-backed.
- Local storage is still used for interface mode and locale selection; this is acceptable for preferences but must not become authoritative account data.
- The stale public deployment creates a risk that users enter demo mode or perceive live signup as a prototype even when production persistence is available.

## Security risks

- Supabase leaked-password protection is disabled.
- The security advisor reports several pre-existing authenticated `SECURITY DEFINER` RPC warnings. The two opportunity-admin RPCs reviewed here independently enforce `is_kleio_admin()`, but all flagged RPCs still require a dedicated authorization audit.
- Several pre-existing RLS policies call `auth.*` without wrapping the call in `select`, which is a performance issue at scale.
- Several tables have multiple permissive policies for the same role/action. This is primarily a performance and maintainability concern and needs consolidation after behavior is regression-tested.

## Launch blockers

1. Stale/demo-first public deployment.
2. No completed fresh-account browser activation walkthrough after deployment.
3. Red navigation audit.
4. Direct preparation-route eligibility bypass.
5. Selected-work AI-policy compatibility not yet enforced inside the preparation workspace.
6. Leaked-password protection disabled.

## Lower-priority issues

- Unused-index notices are expected on a low-traffic project and should not trigger premature index deletion.
- RLS initialization-plan optimization can follow correctness and launch-blocker work.
- Full source-version population can follow the verified fixture and evaluator integration, but should be completed before claiming immutable source-version traceability.

---

# 2. Artist activation test report

| Step | Result | Notes |
|---|---|---|
| Public site opens | Blocked for launch | Current published build appears stale and demo-first. |
| Create Artist Account route exists | Passed in source | Current source renders live signup by default unless demo/preview mode is explicitly selected. |
| Signup/auth persistence | Partially verified | Production auth and profile rows exist; no new email-confirmed browser account was created during this implementation. |
| Onboarding persistence | Verified at database level | `profiles.onboarding_completed` participates in activation. Browser walkthrough still required. |
| Profile image | Existing production path | Artist profile contains private storage path fields. New upload was not browser-tested. |
| Core Creative Passport | Passed at database level | Activation requires professional identity, location, bio, statement, and practice fields. |
| Three portfolio works | Passed transaction test | Two temporary works were inserted for an existing one-work artist; activation immediately turned true, then the transaction was rolled back. |
| Reusable material | Implemented | New private `artist_materials` table plus existing CV path support. |
| Opportunity directory | Existing and enhanced | Server-persisted evaluations replace unexplained browser-only eligibility in the live directory on this branch. |
| Hard eligibility | Passed | Mandatory failures override creative fit. |
| Missing data | Passed | Produces `missing_information` or `eligibility_unclear`, not false eligibility. |
| Save opportunity | Existing production path | Saved record participates in activation. |
| Prepare package | Existing, partially guarded | Directory gate added; direct preparation URL still requires an internal guard. |
| Review generated/selected content | Existing | Four explicit approval confirmations required before submission actions. |
| Native submission | Existing | Preserves application, package, approvals, and submission-attempt history. |
| External portal/email/download | Existing | Email draft is downloaded without sending; external submission remains artist-reported unless provider-confirmed. |
| Logout/login persistence | Database foundation passed | Browser logout/login walkthrough still required. |

### Activation definition implemented

An artist is activated only when all of the following are true:

1. Account exists.
2. Onboarding is complete.
3. Core Creative Passport is materially complete.
4. Professional identity presentation exists.
5. At least three portfolio works exist.
6. At least one reusable application material exists.
7. At least one intentional opportunity action exists.

The status is calculated server-side and exposed as an explanatory record. It is not a ranking, streak, or institutional quality score.

---

# 3. Opportunity schema

## Newly added verification and lifecycle fields

| Field | Purpose |
|---|---|
| `discovered_at` | Records when KLEIO first discovered the opportunity. |
| `verification_confidence` | Normalized 0–1 confidence in the verified record. |
| `verified_by` | Identifies the reviewer or process. |
| `verification_method` | Explains how the record was verified. |
| `reverify_at` | Schedules the next source check. |
| `lifecycle_status` | Tracks discovered, parsing, verification, published, closing, closed, archived, unavailable, or expired-verification state. |
| `deadline_kind` | Fixed, rolling, recurring, or not stated. |
| `expected_decision_at` | Optional expected decision timing. |
| `program_start_at` / `program_end_at` | Program dates separate from application timing. |
| `contact_email` | Support/contact address, distinct from an official email-submission destination. |
| `artwork_ai_policy` | Policy governing submitted artwork. |
| `application_assistance_policy` | Policy governing administrative or generative application assistance. |
| `policy_source_url` | Official policy provenance. |
| `policy_last_verified_at` | Policy verification timestamp. |

The schema retains the existing official URL, application URL, source, snapshots, eligibility rules, requirements, timing, geographic fields, funding, fees, translation fields, and source-language records.

## Private reusable materials

`artist_materials` supports CVs, biographies, statements, proposals, budgets, timelines, references, letters, identity/tax records, video, audio, supporting documents, reusable answers, project descriptions, and other private materials. Each record has artist ownership, visibility, version, active state, metadata, and timestamps.

Public profile data, private Passport material, application-only material, internal drafts, and legal/identity records remain distinguishable through table boundaries and visibility metadata.

---

# 4. PhotoVogue 2026 reference fixture

## Verified fixture

| Field | Value |
|---|---|
| Opportunity | PhotoVogue 2026 Global Open Call — Brave New Visions |
| Eligibility scope | Worldwide |
| Minimum age | 18 |
| Accepted media | Photography, video, multimedia |
| Maximum images | 15 |
| Optional trailer/video | Up to 60 seconds |
| Application fee | 0 |
| Deadline | 2026-09-11 21:59 UTC, stored with source timezone CEST |
| Grant information | USD 12,000 total: 6,000 / 4,000 / 2,000 |
| Submission path | Official external Picter portal |
| Artwork AI policy | Prohibited |
| Application assistance policy | Not stated by the source |
| Verification confidence | 1.0 |
| Re-verification | Scheduled before the deadline |

## Important correction

The public PhotoVogue contact address is stored as `contact_email`, not as an email-submission destination. `submission_email` is blank and `submission_method` is `external_portal`. This prevents KLEIO from implying that an application can be submitted to a support address.

## Fixture tests

1. **Miami photographer, age 36, 15 confirmed non-AI works:** eligible, creative fit, ready work samples.
2. **London video artist, age 17:** ineligible despite creative fit and complete work samples.
3. **Nairobi sculptor, age 30:** ineligible because a mandatory medium requirement fails.
4. **Tokyo photographer with no age:** eligibility is missing information, not assumed.
5. **Mexico City video artist, age 28, no works:** eligible but not ready.

All five returned the expected layered outcome.

---

# 5. Matching architecture

## Layer 1 — hard eligibility

The evaluator checks verified mandatory rules before relevance. Supported direct checks include deadline, age, residence/location, citizenship, discipline/medium, career stage, applicant type, language, and participation format.

A failed hard rule produces `not_eligible`. Missing required artist information produces `missing_information`. No structured verified rule produces `eligibility_unclear`.

Identity, lived-experience, safety, partnership, membership, and other special requirements are never inferred. They remain unknown until explicitly and voluntarily confirmed by the artist or reviewed by a human.

## Layer 2 — creative fit

Creative fit uses explicit overlap between artist disciplines/mediums and accepted opportunity disciplines. It does not estimate artistic quality or probability of winning.

## Layer 3 — readiness

Verified requirements map to actual Passport fields, portfolio works, and private reusable materials. Readiness identifies ready, missing, artist-confirmation, human-verification, file-type, file-count, and size-related states.

## Layer 4 — effort

Preparation effort is low, moderate, or significant based on missing verified requirements and time until the official deadline.

## Layer 5 — strategic value

The evaluation may explain funding, career relevance, geographic relevance, and whether creating a missing reusable asset may help future applications. It explicitly stores no probability of winning.

## Why-you-match explanation

Each persisted evaluation includes:

- exact rule results;
- source text and source URL;
- eligibility status;
- creative-fit terms;
- readiness items;
- effort explanation;
- official deadline timezone;
- source verification status and confidence;
- last verification and recheck date;
- artwork/application-assistance policy distinction.

---

# 6. Application-preparation architecture

## Existing controlled flow

1. Load official opportunity record and package history.
2. Map source requirements to Passport content and selected works.
3. Show missing, complete, and human-review requirements.
4. Let the artist edit application-specific written material.
5. Let the artist select exact portfolio works.
6. Require four explicit confirmations: destination, materials, accuracy, and submission approval.
7. Save versioned package records and submission attempts.
8. Offer only the supported next action:
   - native KLEIO submission for internal calls;
   - reviewable `.eml` draft for verified email routes;
   - external portal handoff;
   - downloadable JSON manifest.
9. Preserve submitted snapshots and status history.
10. Mark external submissions as artist-reported unless independently confirmed.

## Boundaries preserved

- No email is silently sent.
- Downloaded email drafts state that files are not embedded and that the draft was prepared for review.
- Native KLEIO submission requires all confirmations and a ready state.
- Exported manifests are preparation records, not proof of submission.
- External submissions are not represented as provider-confirmed without evidence.

## Remaining boundary work

- Add a server evaluation guard inside the preparation route itself.
- Invoke `check_my_work_policy_compatibility` for the exact selected work IDs before enabling external handoff, email draft creation, download marked as final, or native submission.
- Disable the external-destination link until final review is complete; changing its visual style is not enough.
- Populate and preserve current source-version IDs for every publishable reference opportunity.

---

# 7. Security audit

## Authentication

- Signup, login, logout, email verification, password reset, session persistence, and role assignment are represented in the source and production schema.
- Full fresh-account browser verification remains required.
- Leaked-password protection is disabled and should be enabled before broader outreach.

## Row-level security

Verified with an authenticated artist session:

- one artist profile visible;
- one activation row visible;
- only that artist's portfolio works visible;
- only that artist's private materials visible;
- artist opportunity evaluations scoped to the authenticated artist.

`artist_materials` uses own-only `ALL` policy. `artist_activation_status` is server-computed and read-only for the artist. The internal base evaluator is in the private schema and not directly executable by authenticated or anonymous clients.

## Storage

- Private buckets and owner-folder policies exist for artist and application assets.
- Public access is limited to the intended opportunity-preview bucket.
- Signed-URL expiration, interrupted uploads, malware handling, orphan cleanup, and cross-device file replacement still require an explicit browser/storage test suite.

## Admin functions

The opportunity import and approval RPCs independently verify KLEIO administrator status. Anonymous/public execution was revoked. A broader review of all security-definer RPCs remains open.

## Unresolved risks

1. Leaked-password protection disabled.
2. Pre-existing security-definer advisor warnings.
3. No full unauthorized signed-link browser test.
4. Direct application-preparation route guard absent.
5. Selected-work policy compatibility not enforced at the final action boundary.

---

# 8. Implementation summary

| File or subsystem | Change | Reason | Result | Remaining limitation |
|---|---|---|---|---|
| Supabase `opportunities` | Added provenance, lifecycle, recheck, and AI-policy fields | Make verification durable and explainable | Publishable records can show source confidence and policy boundaries | Existing records still need field backfill and re-verification |
| Supabase `artist_materials` | Added private reusable materials with RLS | Make Passport reuse authentic | Materials persist and remain artist-controlled | UI for every material type is not complete |
| Supabase `artist_activation_status` | Added calculated milestones and triggers | Stop treating signup as activation | Activation updates automatically | Browser event analytics still needed |
| Supabase evaluations | Added layered JSON evidence and batch RPC | Replace cosmetic percentages | Server-persisted eligibility-first analysis | Source versions missing for some records |
| Portfolio works | Added artist-controlled AI provenance | Enforce opportunity artwork policies without inference | PhotoVogue can require confirmation | Existing works default to unknown and need artist review |
| PhotoVogue fixture | Corrected submission route and policy fields | Prevent false email submission and AI-policy ambiguity | Complete reference fixture | Live Picter form fields must still be checked at handoff |
| Live opportunity directory | Replaced browser-only eligibility with persisted RPC output | Make matching trustworthy | Preparation button requires verified eligibility | Direct URL bypass remains |
| Live artist dashboard | Added activation status card | Explain useful completion without manipulation | Artists see what is complete, missing, and why | Must be browser-tested after deployment |
| GitHub migrations | Mirrored production migrations | Keep source control aligned with production | Database is no longer ahead of the branch | PR must pass CI and be merged |

---

# 9. Testing report

## Passed

- Migration application.
- RLS enabled on new tables.
- Authenticated own-data visibility.
- Activation-trigger recalculation.
- Rollback-only full activation test.
- PhotoVogue hard eligibility.
- Hard ineligibility overriding creative fit.
- Missing data returning unknown/missing information.
- Expired-deadline hard-failure logic.
- Readiness updating from stored material/works.
- AI-art policy separated from application-assistance policy.
- Work-policy ownership validation.
- Five-profile PhotoVogue fixture matrix.
- Batch evaluation RPC.
- Source-version foreign-key index.
- Pull-request typecheck, lint, static build, route-export checks, and user-copy audit after fixing the Supabase PromiseLike issue are expected to rerun; final status must be read from CI.

## Failed or blocked

- First CI attempt: typecheck/build failed because the Supabase query builder returns a `PromiseLike` without `.finally`. Fixed in the subsequent commit.
- Repository navigation audit: remains red with numerous baseline static-export/literal-route failures.
- Fresh email-confirmed artist browser journey: not run.
- Logout/login and cross-device browser persistence: not run.
- Mobile/tablet accessibility walkthrough: not run.
- Full institution regression browser walkthrough: not run.
- Direct preparation URL guard: not implemented.
- Selected-work policy enforcement inside preparation: not implemented.

## No synthetic production users

The five-profile matrix was evaluated as a temporary SQL fixture. The activation completion test was executed in a transaction and rolled back. No fake artist account or permanent fake portfolio record was added to production.

---

# 10. Prioritized next actions

1. **Merge only after CI and route integrity are resolved, then deploy the current live build.** Remove the public mismatch that foregrounds demo credentials and prototype language.
2. **Run one complete fresh-account browser activation test on the deployed build.** Include email confirmation, profile image, three works, one private material, eligible and ineligible opportunities, package preparation, logout/login, mobile width, and cross-account denial tests.
3. **Close the final authorization boundary.** Add the server eligibility guard inside the preparation route, enforce selected-work AI-policy compatibility at every final action, and enable leaked-password protection.

Do not begin broad artist outreach until these three actions pass.
