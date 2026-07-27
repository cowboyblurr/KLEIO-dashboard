# KLEIO Artist Beta Readiness Audit

**Audit date:** July 27, 2026  
**Scope:** Real artist signup, Creative Passport, portfolio, sourced opportunities, application preparation, Supabase security/persistence, and deployment state.  
**Decision:** **Ready only after the listed blockers are fixed and the complete journey is retested on the production domain.**

## Executive conclusion

KLEIO has moved beyond a purely visual prototype. The repository contains live Supabase authentication, user-owned artist profiles, private storage, saved opportunities, real opportunity records, internal applications, status history, and source-aware opportunity search.

It is not yet safe to open as a controlled artist beta.

The most important reasons are:

1. The intended production domain is not serving the current KLEIO dashboard build.
2. The newest deployment is not verified; one Vercel status failed and another was pending at the time of this audit.
3. External opportunity preparation is not yet a complete saved application-package workflow.
4. Only 30 of 64 currently discoverable opportunities have structured requirements; 34 cannot support trustworthy requirement-by-requirement readiness.
5. The current internal application editor supports one proposal answer and selected works, not full requirement validation.
6. Supabase security advisors flag callable `SECURITY DEFINER` functions that require function-by-function review, and leaked-password protection is disabled.
7. A true two-account browser test, email-confirmation test, upload interruption test, mobile test, and screen-reader test still need to pass on the deployed build.

## A. Current-state audit

### What genuinely works in the implementation

- Supabase email/password authentication is connected in live mode.
- Live routes read the signed-in user's account and role.
- Artist profile records, portfolio records, saved opportunities, and applications are scoped by user ownership.
- Core artist tables have Row Level Security enabled.
- Private artist storage uses user-ID folder ownership policies.
- Signup already supports a pending profile photo that uploads only after authentication.
- The Creative Passport persists to `artist_profiles`.
- Portfolio image records persist to `portfolio_works` and private storage.
- The sourced opportunity directory excludes expired deadlines and withheld verification states.
- Opportunity search is backed by Postgres search, not a static front-end list.
- Saving an opportunity persists to `saved_opportunities`.
- Internal KLEIO open calls can create a draft application, save an answer and selected works, and record a submitted state.
- Opportunity eligibility and material readiness code separates eligibility, relevance, and readiness concepts.
- Demo and live rendering paths are explicitly separated in the route components reviewed.

### Partially implemented

- Artist onboarding captures useful foundational data but does not yet cover the complete normalized Passport inventory.
- Profile completion is calculated, but the current percentage remains a simplified completeness metric rather than an opportunity-specific readiness score.
- Portfolio management supports images and metadata, but not the complete video, audio, PDF, link, collaborator, edition, installation, and accessibility model required by the beta brief.
- Opportunity filters work for type, source, format, no-fee status, natural-language intent, and the newly added discipline selector. The full filter matrix is not yet exposed.
- Opportunity readiness works only when requirements have been structured and confirmed.
- Internal submission is real for institution-created KLEIO calls, but its editor is too limited for a general beta.
- Application package, package item, package version, and submission-attempt tables exist but currently have no production records.

### Simulated or preview-only

- Demo artist content remains available in preview/demo mode.
- Some polished dashboard analytics are derived presentation data rather than validated financial or outcome data.
- KLEIO Assist is labeled as coming soon and should remain subtle until its drafting provenance and approval workflow are fully implemented.

### Broken or blocking

- The intended public domain does not currently serve the latest dashboard product.
- The latest deployment has not achieved a clean verified build state.
- A complete external opportunity package cannot yet be created, versioned, validated, exported, and resumed end to end.
- The current internal application editor can label an application submitted without checking the complete source requirement set.
- No production application package has yet exercised package items, versions, or submission-attempt history.

### Missing for beta acceptance

- Production-domain email confirmation test.
- Password reset test.
- Two isolated artist accounts tested in one browser/device.
- Resume after session expiration and interrupted upload.
- Complete mobile application journey.
- Screen-reader and keyboard pass for the entire artist journey.
- Version history for long-form Passport materials.
- Saved searches and persistent filter state.
- Complete external package export and truthful handoff records.
- Source-change detection that warns an artist when requirements change after preparation starts.
- Privacy-conscious beta feedback UI.

## B. Implemented changes

### 1. Expanded normalized artist taxonomy

**Problem:** Artist terminology was too limited for beta onboarding and opportunity filtering.  
**Solution:** Expanded the canonical discipline inventory and added distinct medium/material, practice-type, theme, and opportunity-type inventories. Added aliases such as photo/photography, pottery/ceramics, moving image/film/video, and fiber/textile.  
**File:** `lib/kleio-artist-taxonomy.ts`  
**Commit:** `af1da39d3811c0d41cbe613eff41a1d5c227a42f`

### 2. Added reusable structured taxonomy controls

**Problem:** Artist fields needed searchable, keyboard-accessible controls instead of unrestricted typing.  
**Solution:** Added an accessible primary selector and searchable multi-select with aliases, keyboard navigation, removable chips, and optional custom entries.  
**File:** `components/kleio/forms/artist-beta-taxonomy-fields.tsx`  
**Commit:** `250a03abee18d1d6424ab101cffe4332e4dd9873`

### 3. Rebuilt the live artist signup form

**Problem:** The previous artist signup relied on a free-text primary discipline and comma-separated mediums.  
**Solution:** Added required primary discipline, secondary disciplines, structured mediums/materials, confirmation recovery, privacy language, and preserved real Supabase signup/onboarding behavior.  
**Files:**
- `components/kleio/signup/live-artist-signup.tsx`
- `app/signup/artist/page.tsx`

**Commits:**
- `58f03e02f7301cfd837378141fafa3af5de957ed`
- `4b9464fffe6f8947bf0c64ce65871203e22648d7`

### 4. Added an autosaved beta Creative Passport

**Problem:** The live Passport required manual saving and did not clearly communicate privacy, actual readiness, or unsaved state.  
**Solution:** Added debounced account-backed autosave, manual save, structured disciplines and mediums, clearer sections, character counters, explicit privacy language, profile-photo persistence, CV validation, and a checklist based on actual saved materials.  
**Files:**
- `components/kleio/live-artist-passport-beta.tsx`
- `app/artist-dashboard/passport/page.tsx`

**Commits:**
- `537fb058849910b76a13f8c52d9bbb5978a6946e`
- `f27153b06e05a26d549748d57ecde196bf0f236b`

### 5. Added a functional discipline opportunity filter

**Problem:** The directory did not expose a direct discipline selector even though search data supported disciplines.  
**Solution:** Added a discipline filter that writes the selected canonical discipline into the existing sourced search workflow. It does not merely hide cards locally.  
**File:** `components/kleio/authorized-artist-opportunity-directory.tsx`  
**Commit:** `ce540f6b4d49092e64e0fab60d1d606fd8a0cd3f`

**Database validation:**
- Ceramics: 2 current sourced matches.
- Film: 13 current sourced matches.
- Performance: 10 current sourced matches.
- Photography: 9 current sourced matches.
- Textile: 1 current sourced match.

## C. Artist field and taxonomy inventory

### Implemented core profile fields

- Professional name.
- Location.
- Website.
- Instagram.
- Disciplines.
- Mediums/materials.
- Languages.
- Short biography.
- Artist statement.
- Practice description.
- Education.
- Exhibition history.
- Awards/grants.
- CV file.
- Profile image.
- Featured portfolio work.

### Present in the database but not yet fully exposed in the Passport editor

- Country of residence.
- Citizenship(s).
- State/region.
- Birth date.
- Artist type.
- Career stage.
- Organization status.
- Fiscal sponsor status.

These fields should be added progressively and only when needed for eligibility. Sensitive information must be optional, private by default, and accompanied by a clear explanation of why it is requested.

### Taxonomy structure now documented in code

- Artistic disciplines.
- Mediums and materials.
- Practice types.
- Themes and subjects.
- Opportunity types.
- Aliases and canonical values.

### Remaining data-model work

The database needs normalized storage for practice types and themes before those categories can reliably power matching. Do not store them only as decorative front-end chips.

## D. Opportunity-data audit

### Production counts at audit time

- Total records: 71.
- Currently discoverable: 64.
- Past-deadline records: 2; excluded from current search.
- Withheld due to review/expired/rejected status: 6.
- Missing deadline: 6.
- Application fee not stated: 67.
- Funding not stated: 2.
- Marked duplicate: 0.
- Missing source relationship: 0.
- Missing canonical URL: 1 archived synthetic audit record; not currently discoverable.

### Requirement coverage

- Discoverable opportunities with structured requirements: 30.
- Discoverable opportunities without structured requirements: 34.
- Average structured requirements per discoverable opportunity: 2.22.

### Interpretation

The catalog is large enough for search testing, but only the 30 records with structured requirements can support a credible requirement checklist. The remaining 34 may be browsed with source disclosure but must not display a precise readiness percentage.

### Required cleanup rules

- Unknown fee remains unknown; never display as free.
- Missing deadlines require visible confirmation language.
- Forecasted opportunities must remain distinct from open opportunities.
- Opportunity changes must create a new source snapshot and invalidate stale readiness where relevant.
- Requirement extraction must be completed before an opportunity can support package preparation.

## E. Submission-package audit

### What currently exists

- `applications`.
- `application_answers`.
- `application_works`.
- `application_status_history`.
- `application_packages`.
- `application_package_items`.
- `application_package_versions`.
- `application_submission_attempts`.
- Requirement-readiness logic mapped to Passport fields and work counts.

### Production usage at audit time

- Applications: 1.
- Application answers: 1.
- Application works: 1.
- Application packages: 0.
- Package items: 0.
- Package versions: 0.
- Submission attempts: 0.

### Critical gap

The current internal application component saves one `project_proposal` answer and selected works, then changes status to submitted. It does not yet validate all structured questions, required files, word limits, character limits, work-sample counts, deadline, fee disclosure, external requirements, or final artist approval.

### Required package state machine before beta

1. Requirements imported.
2. In progress.
3. Missing information.
4. Ready for artist review.
5. Artist approved.
6. Ready to export or submit.
7. Exported or official portal opened.
8. Marked submitted externally by artist.
9. Submitted through verified KLEIO integration.
10. Closed or expired.

Exported, copied, or portal-opened must never be treated as submitted.

## F. Test report

### Inspected

- Repository default branch and recent commits.
- Artist signup route and live onboarding functions.
- Email-confirmation recovery logic.
- Auth gate and live/demo route separation.
- Creative Passport load/save behavior.
- Profile image and private asset handling.
- Portfolio load/create/update/delete behavior.
- Opportunity search RPC and directory presentation.
- Saved opportunity persistence.
- Internal application draft and submission behavior.
- Core RLS policies.
- Storage buckets and storage policies.
- Opportunity catalog quality and requirement coverage.
- Supabase security and performance advisors.
- Production-domain response.
- Deployment commit statuses.

### Passed by implementation and database inspection

- Every auth user currently has a matching profile.
- No profile exists without an auth user.
- No artist profile has a mismatched role.
- No orphan portfolio work or application was found.
- Core artist tables have RLS enabled.
- Artist storage buckets are private and user-folder scoped.
- Search returns real discipline-specific records.
- Expired opportunities are excluded by the production search function.
- Unknown fee data is stored as null rather than automatically presented as free.

### Not yet certified

- Clean production build for the newest commits.
- Production-domain routing to the dashboard.
- New-account email confirmation on the production domain.
- Password reset.
- Two-account browser isolation.
- Upload retry and interrupted-network recovery.
- Autosave recovery after session expiration.
- Full package preparation and export.
- Mobile journey.
- Screen-reader journey.
- Cross-browser coverage.

## G. Severity backlog

### Blockers

1. Deploy the current dashboard to the intended production domain and verify all routes.
2. Resolve the failed deployment and obtain a clean build status.
3. Run signup → email confirmation → Passport → portfolio → opportunity → application tests with at least two fresh artist accounts.
4. Prevent internal submission until all actual required items are validated.
5. Finish the saved external application-package workflow or explicitly remove/disable unsupported preparation actions.
6. Review callable `SECURITY DEFINER` functions and restrict any function that should not be directly executable by authenticated users.
7. Enable leaked-password protection.

### Critical

1. Structure requirements for every beta-visible opportunity that advertises application preparation.
2. Add source-version comparison and stale-package warnings.
3. Complete upload validation and recovery for all supported media.
4. Add truthful external statuses: package ready, exported, official portal opened, artist marked submitted.
5. Add application-level final review and artist approval.
6. Test RLS with two authenticated users, not only policy inspection.
7. Add mobile and keyboard testing to release checks.

### Important

- Persist saved searches and filter state.
- Add career-stage and geography filters from normalized Passport fields.
- Add practice-type and theme storage.
- Add long-form material versions and preferred defaults.
- Add privacy-conscious beta feedback.
- Replace generalized completion percentages with section-level evidence.

### Enhancement

- Additional languages beyond English and Spanish.
- Advanced portfolio sets and series templates.
- Reusable budget and timeline templates.
- Optional reminders and beta analytics dashboards.

## Final go/no-go recommendation

**Ready only after listed blockers are fixed.**

KLEIO now has credible foundations and several artist-facing beta improvements have been implemented. The product should not yet invite real artists broadly because the live deployment is not verified and the complete application-package workflow has not passed end-to-end acceptance testing.

The next release gate is not another visual redesign. It is one clean deployed build plus a recorded, repeatable test of two isolated artists completing the full real journey without data leakage, false submission language, lost work, or manual intervention from the KLEIO team.
