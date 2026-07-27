# KLEIO full production-readiness execution report

Date: 2026-07-27

## Executive release decision

**Ready only after the listed blockers are fixed.**

KLEIO has a real connected application, a healthy Supabase project, working role-aware signup code, private artist storage, sourced opportunities, an application-package workflow, and institution review data structures. This execution materially tightened institution permissions and native submission integrity. The controlled beta cannot be approved yet because the public custom domain still serves the legacy early-access site, production auth redirects have not been verified through real email links, leaked-password protection remains disabled, and the full browser/mobile/accessibility matrix has not been completed.

## Authoritative implementation

- Repository: `cowboyblurr/KLEIO-dashboard`
- Default branch: `main`
- Front end: Next.js static export
- Deployment checks: two configured Vercel checks
- Supabase project: `trekynurdgxgtaaqqtyq`
- Intended production domain: `https://www.kleioarthouse.com/`
- Production-domain state at verification: legacy early-access page, not the current dashboard build

## Implemented repairs

### 1. Institution administration and reviewer scope

Migration: `tighten_institution_roles_and_reviewer_scope`

Problem:

- The prior `owns_institution` helper returned true for every active institution member.
- Application and open-call policies reused that helper for management actions.
- A reviewer could therefore be treated as able to manage all calls and applications for an institution.

Repair:

- Added `can_administer_institution` for owners and active owner/admin/administrator/manager/program-director roles.
- Restricted `can_manage_application` to authorized institution administrators.
- Added `can_review_application` for assigned reviewers or administrators.
- Updated application SELECT scope so assigned reviewers can read the relevant application.
- Kept application mutation authority with administrators.
- Restricted open-call create, update, and delete policies to institution administrators.
- Restricted review insertion and editing to the assigned reviewer or an authorized administrator.
- Preserved artist access to the artist's own application.

Behavioral verification:

- Institution administrator: management and review access passed.
- Assigned reviewer: assigned application review access passed; management access denied.
- Artist: own application access passed; institution management denied.
- Unrelated institution user: target application visibility and management denied.

### 2. Institution invitation role preservation

Migration: `tighten_institution_roles_and_reviewer_scope`

Problem:

- Accepting an institution invitation previously changed the user's primary profile role to `collaborator`.
- This could cause an artist who joins a committee to lose correct artist routing or workspace identity.

Repair:

- Invitation acceptance now creates or activates institution membership without changing the user's primary KLEIO profile role.
- Invitation ownership, email equality, pending status, and expiry checks remain enforced.

### 3. Native KLEIO submission integrity

Migrations:

- `require_verified_artist_package_before_native_submission`
- `require_complete_package_item_coverage`

Problem:

- The previous submission snapshot trigger automatically populated `artist_approved_at` and forced `submission_method = native_kleio` when an application status changed to submitted.
- That behavior converted a status update into implied artist approval instead of verifying approval.

Repair:

A native submission transition now requires all of the following at the database layer:

- The authenticated caller is the artist who owns the application.
- The call is currently open.
- The opening date has arrived, when provided.
- The deadline has not passed, when provided.
- All four artist confirmations are true.
- `artist_approved_at` is already present.
- The submission method is explicitly `native_kleio`.
- A current package belongs to the same artist, opportunity, application, and internal call.
- The package state is `ready_for_submission`.
- The package is not stale.
- The package carries the same complete artist approvals.
- No package item remains missing, blocked, unverified, over a limit, or awaiting review.
- Every confirmed required opportunity material has a complete, artist-approved package item.

Only after those checks pass does KLEIO create the immutable submission snapshot.

Transactional verification:

- Closed-call submission was blocked.
- Open-call submission without artist approvals was blocked.
- A valid synthetic path with a current call, complete package, requirement coverage, and artist approvals succeeded.
- The successful test snapshot included answers, portfolio works, and package evidence.
- All synthetic test mutations were rolled back.
- The existing production call and application remained unchanged.

### 4. Removed DOM-driven authorization workaround

Commit: `8b003f05568c8e2877603bdbf2d2c73cc9c43e21`

Problem:

- The artist opportunity wrapper used a `MutationObserver` and exact button-text matching to hide `Message institution`.
- This was fragile, inaccessible, translation-sensitive, and disconnected from the actual authorization model.

Repair:

- Removed the DOM observer and text-matching manipulation.
- The rendered opportunity experience now relies on the explicit application component and its backend authorization checks rather than post-render DOM mutation.

Validation:

- Both configured Vercel checks passed for the commit.

## Verified current systems

### Authentication and onboarding code

Verified in the repository:

- Shared artist and institution signup.
- Structured primary artist discipline selection.
- Role-aware auth callback.
- Pending-onboarding recovery.
- Confirmation resend.
- Password-reset request and update routes.
- Production URL helper that refuses localhost in production.
- Account routing based on the stored profile role.

Not yet verified end-to-end against the public production domain:

- Real confirmation email click.
- Real password-reset email click.
- Confirmation on another device.
- Expired-link recovery.
- Exact Supabase Site URL and redirect allow-list settings.

### Application preparation code

Verified in the repository:

- Source requirement checklist.
- Passport and portfolio material mapping.
- Saved application packages.
- Requirement snapshots.
- Package versions in the database model.
- Artist approval confirmations.
- Native KLEIO submission path.
- External portal handoff.
- Downloadable JSON manifest.
- Reviewable `.eml` preview that is explicitly not represented as sent.
- Artist-reported external submission status that is not represented as provider-confirmed.
- Historical native submission snapshot.

Production usage remains unproven because current production counts are zero for application packages, package items, package versions, and submission attempts.

## Data integrity snapshot

- Auth users: 9
- Profiles: 9
- Artist profiles: 4
- Institutions: 3
- Open calls: 1
- Applications: 1
- Application packages: 0
- Application package items: 0
- Application package versions: 0
- Submission attempts: 0

Integrity queries returned:

- Auth users without profiles: 0
- Profiles without auth users: 0
- Artist/profile role mismatches: 0
- Orphan portfolio works: 0
- Orphan applications: 0
- Orphan application packages: 0

## Opportunity-data snapshot

- Total opportunities: 71
- Currently discoverable records under the search function's rules: 64
- Discoverable records with structured requirements: 30
- Discoverable records without structured requirements: 34
- Discoverable records missing a deadline: 5
- Discoverable records with raw application fee unstated: 60
- Discoverable records with both raw award minimum and maximum unstated: 11

The interface correctly preserves unknown fee, funding, and deadline values rather than converting them into confirmed claims. Precise readiness remains unavailable when structured requirements are absent.

## Security report

Verified:

- Core artist/application tables use Row Level Security.
- Private artist storage uses user-scoped object paths and ownership policies.
- Artist, administrator, assigned-reviewer, and unrelated-user behavior tests passed after the role-scope migration.
- Native submission now fails closed at the database layer.
- Invitation acceptance no longer overwrites the primary profile role.

Remaining security work:

- Supabase leaked-password protection is disabled and must be enabled in Auth settings.
- The Supabase advisor continues to flag authenticated-executable `SECURITY DEFINER` functions. Several are intentionally exposed application RPCs and contain caller checks, but every remaining function still needs a documented allow-list decision: intentionally exposed, moved out of the exposed schema, converted to invoker, or revoked.
- Browser-based direct-record and storage upload tests must still be run with fresh accounts.

## Test matrix

| Test | Result | Evidence / limitation |
|---|---|---|
| Repository production checks | Pass | Both configured Vercel checks passed on commit `8b003f0` |
| Auth/profile integrity | Pass | 9 auth users, 9 profiles, no orphan or mismatch results |
| Institution administrator management scope | Pass | Authenticated role simulation |
| Assigned reviewer read/review scope | Pass | Assigned application visible; management false |
| Unrelated institution isolation | Pass | Target application count zero |
| Artist own-application access | Pass | Own application visible; institution management false |
| Closed native submission | Pass | Blocked by database gate |
| Missing artist approval | Pass | Blocked by database gate |
| Valid complete native submission | Pass in rollback test | Submitted state and snapshot produced, then rolled back |
| Public custom domain | Fail | Serves legacy early-access site |
| Real email confirmation | Not run | Requires correct public routing and a fresh inbox/browser journey |
| Real password reset | Not run | Code exists; production email journey unverified |
| Fresh Artist A/B browser isolation | Not run | Database behavior verified; browser journey still required |
| Fresh Institution A/B browser isolation | Not run | Database behavior verified; browser journey still required |
| Mobile end-to-end journey | Not run | Requires browser/device testing |
| Keyboard and screen-reader journey | Not run | Requires accessibility testing |
| Cross-browser testing | Not run | Requires Chrome, Safari, Firefox, and mobile browser passes |

## Release blockers

### Blocker

1. Route `www.kleioarthouse.com` to the verified current deployment instead of the legacy early-access site.
2. Set the Supabase production Site URL and exact redirect allow-list for confirmation and recovery, then test real email links.
3. Enable leaked-password protection.
4. Run fresh browser-based artist and institution account journeys against the public domain.
5. Run mobile, keyboard, screen-reader, and cross-browser acceptance tests.

### Critical

1. Produce at least one real controlled-beta application package end to end; the production package tables currently have no usage evidence.
2. Structure requirements for the remaining 34 discoverable opportunities or prevent those records from presenting precise application readiness.
3. Complete a documented decision for every authenticated `SECURITY DEFINER` RPC.
4. Verify institution role-based navigation so reviewers do not receive administrator controls that the database will correctly reject.

### Important

1. Add dedicated persistent filters for discipline, career stage, deadline range, funding, and structured-requirement coverage without DOM-driven search manipulation.
2. Verify autosave, network interruption recovery, session expiry, file replacement, and upload retry behavior.
3. Expand dynamic application questions and limit validation beyond the current reusable written-material model where official calls require them.

### Enhancement

1. Add richer portfolio media support and accessible alternatives for reordering.
2. Add clearer multi-institution context selection for users who belong to more than one organization.
3. Add automated browser tests to the release pipeline after the public domain and auth redirects are corrected.

## Exact next action

**Route the public domain to the successful current Vercel deployment and configure the matching Supabase Site URL and exact confirmation/recovery redirects.**

That action unlocks the remaining real-user acceptance tests and is the fastest path from a technically connected build to a credible controlled beta.
