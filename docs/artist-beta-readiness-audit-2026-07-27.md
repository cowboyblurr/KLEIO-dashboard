# KLEIO Artist Beta Readiness Audit

**Audit date:** July 27, 2026  
**Repository:** `cowboyblurr/KLEIO-dashboard`  
**Production data project:** Supabase `trekynurdgxgtaaqqtyq`  
**Current recommendation:** **Ready only after the blockers below are fixed. Not ready to invite real artists yet.**

## Executive conclusion

KLEIO is no longer only a visual demo. The connected implementation includes live Supabase authentication, account-owned artist profiles, private file storage, portfolio records, sourced opportunity records, saved opportunities, institution-created applications, status history, and source-aware search.

The current primary Vercel build passed after the beta changes were reduced to verified, deployment-safe scope. KLEIO still does not meet the full controlled-beta acceptance criteria because the intended public domain is serving a different legacy landing page and the complete external application-package workflow is not operational end to end.

## What matters now

1. Point `kleioarthouse.com` to the correct current KLEIO deployment.
2. Run the real signup and email-confirmation journey on that production domain.
3. Finish requirement-complete application preparation, validation, export, and truthful status handling.
4. Structure requirements for every opportunity advertised as KLEIO-preparable.
5. Run browser, mobile, upload-interruption, accessibility, and two-account isolation tests before inviting artists.

---

# A. Current-state audit

## Genuinely connected and working by implementation/database inspection

- Supabase email/password authentication is used in live mode.
- Live workspace routes load the signed-in account and enforce account role.
- Artist profiles persist to `artist_profiles`.
- Portfolio records persist to `portfolio_works`.
- Saved opportunities persist to `saved_opportunities`.
- Institution-created applications persist to `applications`, with answer, work-selection, and status-history tables.
- Core artist tables have Row Level Security enabled.
- Artist storage buckets are private and use account-folder ownership policies.
- Demo and live route rendering are explicitly separated.
- Opportunity search is backed by the Postgres `search_opportunities` function.
- Expired deadlines and withheld verification states are excluded from current search.
- Opportunity source attribution, canonical links, deadlines, fees, funding, and verification fields exist in the production model.
- The current primary Vercel status for commit `6acc0756de3e5830ca31545098a35d54a06d30ce` passed.

## Behaviorally tested at the database layer

Authenticated-role RLS simulation was run for two distinct artist accounts.

For each simulated artist:

- Exactly one artist profile was visible.
- Zero other artist profiles were visible.
- Zero other artist portfolio works were visible.
- Zero other artist applications were visible.
- Zero other artist saved opportunities were visible.

This is a strong account-isolation result, but it does not replace a two-browser end-to-end test with real authenticated sessions.

## Partially implemented

- Artist signup captures the essential source record but does not yet expose the complete normalized Passport inventory.
- Primary artistic discipline now uses a structured selector; secondary disciplines and structured mediums/materials still need fuller onboarding treatment.
- The Creative Passport has structured discipline selection and persistent data, but it still relies on manual save and lacks long-form version history.
- Portfolio management supports image-based works and metadata, but not the complete audio, video, PDF, URL, collaborator, edition, installation, and accessibility model requested for beta.
- Opportunity search supports natural-language discipline intent plus type, source, format, and confirmed-no-fee controls. A dedicated persistent discipline filter is not yet active.
- Application readiness can be calculated only when requirements are structured and confirmed.
- Institution-created internal applications persist, but the editor does not yet validate every source requirement.
- Package/version/submission-attempt tables exist but have not yet been exercised by a complete production package.

## Simulated, preview-only, or not yet proven

- Guided-demo artist and institution content remains synthetic.
- Some dashboard summaries are presentation-oriented rather than validated outcome analytics.
- KLEIO Assist remains a future/limited feature and should not imply autonomous submission.
- No real institutional adoption, verified users, successful grant outcome, or external submission integration was confirmed in this audit.

## Broken or blocking

- `https://www.kleioarthouse.com/` currently serves a different legacy early-access site, not the current KLEIO dashboard product.
- Production-domain email confirmation has not been verified against the current dashboard deployment.
- A complete external opportunity cannot yet be converted into a saved, versioned, requirement-complete application package.
- The current internal application editor can move an application to submitted without validating every structured question, required file, limit, deadline, fee disclosure, and artist-approval step.
- The beta lacks a completed browser/mobile/accessibility release test matrix.

---

# B. Implemented and verified changes

## 1. Expanded artist taxonomy

**Problem:** The discipline inventory was too narrow for artist onboarding, Passport reuse, and opportunity discovery.

**Implemented:**

- Added ceramics, film, video, animation, photography, performance, sound, music, textile/fiber art, fashion, poetry, craft, community-engaged art, interdisciplinary practice, and other relevant disciplines.
- Added separate medium/material, practice-type, theme, and opportunity-type inventories.
- Added aliases such as:
  - photo → photography
  - pottery → ceramics
  - moving image → film/video
  - fiber/fibre → textile and fiber art
  - VR/AR → virtual/augmented reality

**File:** `lib/kleio-artist-taxonomy.ts`  
**Verified commit:** `af1da39d3811c0d41cbe613eff41a1d5c227a42f`

## 2. Added reusable structured taxonomy controls

**Implemented:** An accessible searchable primary selector and multi-select component with keyboard navigation, removable chips, aliases, and optional custom entries.

**File:** `components/kleio/forms/artist-beta-taxonomy-fields.tsx`  
**Verified primary-build commit:** `250a03abee18d1d6424ab101cffe4332e4dd9873`

The richer component is retained for controlled future integration. It is not being overclaimed as fully deployed across every Passport and opportunity surface.

## 3. Replaced free-text primary discipline at signup

**Problem:** New artists had to type their primary discipline into an unrestricted field.

**Implemented:** The existing shared artist/institution authentication flow now uses a native structured artist-discipline selector on the artist branch. The institution branch and existing confirmation recovery remain intact.

**File:** `components/kleio/signup/live-signup.tsx`  
**Active commit:** `6acc0756de3e5830ca31545098a35d54a06d30ce`

## 4. Removed unverified beta rewrites before completion

A separate signup implementation, a large Passport rewrite, and a DOM-driven opportunity filter were removed after deployment regression testing. They are not counted as delivered functionality.

This was intentional: beta readiness requires a passing, honest implementation rather than keeping attractive but unverified code active.

## 5. Produced this repository audit

**File:** `docs/artist-beta-readiness-audit-2026-07-27.md`

---

# C. Artist field and taxonomy inventory

## Current persisted Passport fields

- Professional name.
- Location.
- Biography.
- Artist statement.
- Practice description.
- Website.
- Instagram.
- Disciplines.
- Mediums/materials.
- Languages.
- Education.
- Exhibition history.
- Awards/grants.
- CV path.
- Profile completion.
- Profile image.
- Featured portfolio work.
- Profile-image positioning.

## Additional eligibility fields present in the database

- Country of residence.
- State/region.
- Citizenship(s).
- Birth date.
- Artist type.
- Career stage.
- Organization status.
- Fiscal sponsor status.

These should be exposed progressively, only when they improve eligibility checks. Sensitive identity or residency information must remain optional and private by default.

## Structured input recommendation

| Field | Recommended interaction |
|---|---|
| Primary discipline | Required single select |
| Secondary disciplines | Searchable multi-select |
| Mediums/materials | Searchable multi-select plus Other |
| Practice types | Searchable multi-select |
| Themes | Searchable multi-select plus custom tags |
| Location | Structured location search |
| Career stage | Single select with explanation |
| Languages | Searchable multi-select |
| Education/exhibitions/awards | Repeating structured sections |
| Biography/statement | Versioned rich text with saved defaults |
| CV and documents | Validated private uploads |
| Public/private state | Explicit visibility control |

## Data-model gap

Practice types and themes are documented in code but need normalized database storage before they can power authentic matching.

---

# D. Opportunity-data audit

## Production counts at audit time

- Total opportunity records: **71**.
- Currently discoverable: **64**.
- Past-deadline records: **2**; excluded from current search.
- Withheld due to review/expired/rejected state: **6**.
- Missing deadline: **6**.
- Application fee not stated: **67**.
- Funding not stated: **2**.
- Marked duplicate: **0**.
- Missing source relationship: **0**.
- Missing canonical URL: **1 archived synthetic audit record**, not currently discoverable.

## Structured-requirement coverage

- Discoverable opportunities with structured requirements: **30**.
- Discoverable opportunities without structured requirements: **34**.
- Average structured requirements per discoverable opportunity: **2.22**.

## Discipline-search validation

The production search function returned current sourced records for:

- Ceramics: **2**.
- Film: **13**.
- Performance: **10**.
- Photography: **9**.
- Textile: **1**.

This confirms discipline-aware search data exists. It does not mean the full dedicated filter system is complete.

## Required data rules

- Null fee must display as “Not stated,” never “Free.”
- Missing deadline must remain visibly unconfirmed.
- Forecasted must remain distinct from open.
- Expired/unverifiable opportunities must not appear active.
- Precise readiness must be hidden when requirements are incomplete.
- Source snapshots must be versioned so changed requirements can invalidate stale packages.

---

# E. Submission-package audit

## Tables present

- `applications`.
- `application_answers`.
- `application_works`.
- `application_status_history`.
- `application_packages`.
- `application_package_items`.
- `application_package_versions`.
- `application_submission_attempts`.

## Production usage at audit time

- Applications: **1**.
- Application answers: **1**.
- Application works: **1**.
- Application packages: **0**.
- Package items: **0**.
- Package versions: **0**.
- Submission attempts: **0**.

## Current limitation

The current internal editor saves one proposal answer and selected works, then can update the application status. It is not yet a complete requirement-driven package builder.

## Required state model before beta

1. Requirements imported.
2. In progress.
3. Missing information.
4. Ready for artist review.
5. Artist approved.
6. Ready to export or submit.
7. Exported or official portal opened.
8. Marked submitted externally by the artist.
9. Submitted through a verified KLEIO integration.
10. Closed or expired.

“Copied,” “downloaded,” “exported,” or “portal opened” must never be represented as “submitted.”

## Required final validation

- All required questions answered.
- Word and character limits.
- Required file count/type/size.
- Required work-sample count.
- Captions, dates, dimensions, and credits.
- Deadline and timezone.
- Eligibility acknowledgements.
- Application fee disclosure.
- External account or portal requirements.
- Final artist review and approval.

---

# F. Test report

## Inspected

- Default repository branch and recent commits.
- Live/demo route separation.
- Artist and institution signup logic.
- Pending onboarding and email-confirmation recovery logic.
- Creative Passport load/save logic.
- Profile image and CV upload paths.
- Portfolio persistence.
- Opportunity search RPC and presentation layer.
- Saved opportunity persistence.
- Internal application editor and status logic.
- Public-table RLS policies.
- Storage buckets and storage policies.
- Opportunity quality and requirement coverage.
- Supabase security/performance advisors.
- Production-domain response.
- Vercel deployment statuses.

## Passed

- Primary Vercel build for the active code commit.
- Database/account integrity checks.
- Two simulated authenticated artist RLS-isolation checks.
- Real discipline search against sourced production records.
- Expired-opportunity exclusion in the production search function.
- Unknown fee remains null rather than being converted to free.

## Not certified yet

- Production-domain routing to the dashboard.
- Fresh artist signup on the production domain.
- Email confirmation returning to the correct hosted route.
- Password reset.
- Two real browser sessions with different users.
- Multi-tab behavior.
- Upload interruption and retry.
- Autosave/recovery after expiration.
- Complete application-package generation and export.
- Mobile journey.
- Keyboard-only journey.
- Screen-reader journey.
- Cross-browser coverage.

## Required artist-scenario matrix

| Scenario | Required beta test | Current status |
|---|---|---|
| Artist A | Photography/installation; complete Passport; international grants/exhibitions | Not run end to end |
| Artist B | Emerging ceramics; incomplete statement; no-fee residencies | Search data validated; journey not run |
| Artist C | Film/moving image; video samples; festivals/screenings | Search data validated; media journey not run |
| Artist D | Performance/sound/digital/social practice; combined disciplines | Not run end to end |
| Artist E | Minimal profile; missing CV/portfolio; honest draft limitations | Not run end to end |
| Artist F | Leave/return; edit Passport; reopen application; replace file; export | Not run end to end |
| Artist G | Mobile signup, phone upload, filtered search, short application | Not run end to end |

## Required edge cases

- Expired opportunity.
- Deadline without timezone.
- Missing official link.
- Contradictory eligibility.
- External account required.
- Paid and no-fee opportunities.
- Rolling deadline.
- Worldwide and country-restricted opportunities.
- Unknown funding.
- Ten work samples.
- Unsupported/oversized/duplicate files.
- Insufficient Passport data for drafting.
- Discipline changed after application save.
- Work deleted after being attached.
- Requirements changed after preparation.
- Submission attempted after deadline.
- Network drop during upload.
- Autosave failure.
- Session expiration while editing.

---

# G. Beta severity backlog

## Blockers

1. Route `kleioarthouse.com` to the current verified KLEIO deployment.
2. Configure and test exact Supabase Site URL and redirect allow-list entries for the production domain.
3. Run signup → confirmation → Passport → portfolio → opportunity → application with at least two fresh artists.
4. Prevent any submitted status until all actual required items and final artist approval are validated.
5. Complete or disable unsupported external package actions.
6. Structure requirements for all opportunities that advertise KLEIO preparation.
7. Enable leaked-password protection in Supabase Auth.

## Critical

1. Add persistent dedicated discipline, medium, geography, career-stage, deadline, fee, funding, and requirement filters.
2. Add package/source version comparison and stale-package warnings.
3. Complete upload validation/retry for supported media.
4. Add truthful external handoff statuses.
5. Run real-session RLS tests in two browsers.
6. Complete mobile and accessibility release testing.
7. Review callable `SECURITY DEFINER` functions individually. Current ACL inspection shows many are already trigger-only or service-role-only, and the reviewed admin import function checks KLEIO-admin status; this remains a review task, not proof of an active exploit.

## Important

- Save search/filter state.
- Normalize practice types and themes in the database.
- Add versioned biographies/statements and preferred defaults.
- Add reusable budgets, timelines, references, and portfolio sets.
- Add privacy-conscious beta feedback.
- Replace generalized completion percentages with evidence-based section status.

## Enhancement

- Additional languages beyond English and Spanish.
- Advanced series/portfolio templates.
- Optional deadline reminders.
- Beta funnel analytics dashboards.

---

# Final go/no-go recommendation

## **Ready only after listed blockers are fixed**

The strongest verified progress is the underlying account/data isolation, sourced opportunity model, live authentication foundation, expanded artist taxonomy, and structured primary-discipline signup.

The highest-risk unfinished work is not visual. It is production-domain routing, complete requirement-driven package preparation, truthful submission state, upload/recovery reliability, and real end-to-end beta testing.

The next release gate should be one clean production deployment plus a repeatable recording of two isolated artists completing the real journey without data leakage, lost work, unsupported automation, or false submission confirmation.
