# KLEIO Opportunity Directory Reliability — August 5, 2026

## Objective

Give artists access to every publication-ready opportunity without mixing uncertain research leads into the trusted directory. The implementation follows the attached KLEIO reliability, pagination, and moderation brief.

## Verified root cause

The artist Opportunities page requested 100 rows and the production `search_opportunities_v2` RPC independently capped every request at 100. More current official-source records existed, but the interface had no pagination or true matching count.

The existing search correctly excluded `needs_review`, `expired`, and `rejected` verification states. It did not, however, require a publication-ready lifecycle state. Records could therefore have an official source while their lifecycle still said `discovered`, `needs_verification`, or `archived`.

The existing `/review-queue/` route reviews institutional submissions. It is not an opportunity-research moderation surface.

## Production database findings before implementation

Current, non-duplicate opportunities with active sources were distributed as follows:

| Verification status | Lifecycle status | Records |
| --- | --- | ---: |
| `needs_review` | `needs_verification` | 12 |
| `needs_review` | `updated` | 1 |
| `official_source` | `archived` | 3 |
| `official_source` | `closing_soon` | 17 |
| `official_source` | `discovered` | 3 |
| `official_source` | `needs_verification` | 12 |
| `official_source` | `published` | 85 |
| `official_source` | `updated` | 7 |
| `official_source` | `verified` | 1 |

Under the new publication rule, an authenticated artist test account received **110** trusted visible records. The first page returned **24**.

## Publication rule

The artist directory now requires all of the following:

- Status is `open`, `upcoming`, or `forecasted` through the existing search engine.
- Deadline is not confirmed as expired.
- Record is not a duplicate.
- Source is active.
- Lifecycle is `verified`, `published`, `updated`, or `closing_soon`.
- Verification is `official_source`, `provider_published`, `provider_verified`, or `kleio_reviewed`.
- `last_verified_at` is present.
- Provider name is present.
- A canonical URL, application URL, or submission email is present.
- The artist has not privately hidden the record.

Source provenance and publication readiness are now separate concepts. An official source alone does not make a listing artist-visible.

## Production database changes

Migration: `20260805123500_opportunity_directory_reliability_workflow.sql`

Applied and read back against Supabase project `trekynurdgxgtaaqqtyq`.

### Artist-private controls

- `artist_hidden_opportunities`
  - Owner-scoped RLS.
  - Artists can select, insert, and delete only their own hidden records.
  - Hiding does not alter the global opportunity or future programme cycles.
- `opportunity_reports`
  - Artists can submit controlled problem categories and optional notes.
  - Artists can read only their own reports.
  - Administrators can read and resolve reports.
  - Duplicate unresolved reports from the same artist, opportunity, and reason are prevented.

### Moderation and audit

- `opportunity_review_audit`
  - Stores actor, action, reason, previous values, new values, source URL, and timestamp.
- `get_kleio_opportunity_review_queue(...)`
  - Administrator-only aggregate queue.
  - Supports reports, verification, financial, rights, translation, reverification, duplicate, rejected, and all-record views.
- `admin_review_opportunity(...)`
  - Administrator-only audited actions.
  - Supports verify, publish, keep under review, reject, archive, reverify, merge duplicate, restore, and resolve reports.
  - Publication fails unless the minimum database standard is satisfied.

### Artist search and counts

- `search_my_opportunities_v3(...)`
  - Authenticated, publication-safe, artist-private pagination.
  - Reuses the existing structured and natural-language search engine.
  - Processes legacy 100-row chunks without exposing the cap to the artist.
- `count_my_opportunities_v3(...)`
  - Uses the same search and publication predicate as the result function.
  - Returns the true matching artist-visible total.

## Artist experience

The production directory branch now provides:

- 24-record initial batch.
- Controlled **Load more opportunities** action.
- `Showing X of Y verified opportunities` language.
- Stale-request protection and duplicate prevention across batches.
- Existing filters and natural-language interpretation.
- Existing Creative Passport eligibility and readiness evaluation.
- Scroll restoration within the session.
- Clear trust labels:
  - Verified through official source.
  - Provider submitted · KLEIO reviewed.
  - Hosted on KLEIO.
- Last-checked date and overdue verification warning.
- Distinct funding/support, deadline, location/format, and fee summaries.
- Explainable **Why this may fit you** evidence.
- Separate **Still needs confirmation** evidence.
- **Important terms** for known fees, incomplete financial or rights review, artist-paid travel/accommodation, insurance, fiscal sponsorship, unstated support, and overdue verification.
- Save, private Hide, Undo, and Report controls.
- Screen-reader result-count and batch-load announcements.

The interface does not introduce an unexplained numerical match percentage.

## Private Opportunity Review Queue

Route: `/admin/opportunity-review/`

The route is non-indexed and loads data only through administrator-gated database functions. It provides:

- Queue filters by review reason.
- Automated flags and unresolved artist-report counts.
- Official source, application, and guideline links.
- Controlled moderation actions.
- Required reasons for every action.
- Additional warnings for publication, rejection, archival, restoration, and duplicate merging.
- Links to the private product analytics dashboard and artist directory.

## Security verification completed

- Anonymous roles have no access to the new artist-private or moderation tables.
- Hidden opportunities are owner-scoped.
- Reports are owner-readable and owner-creatable; update authority remains administrator-only.
- Audit history is administrator-readable and written only through the guarded mutation RPC.
- Admin RPCs use a fixed empty search path and verify `private.is_kleio_admin()` before accessing moderation data.
- Public and anonymous execution was revoked from admin RPCs.
- Rollback-only artist tests confirmed:
  - First page returns 24.
  - Trusted count returns 110.
  - Hiding one record changes that artist’s count from 110 to 109.
  - An artist can create and read their own report.
  - Test writes were rolled back and left no production records.

## Important production blocker

`public.kleio_admins` currently contains no administrator row. The new route correctly denies access until an existing confirmed KLEIO user is deliberately provisioned as an administrator. No user was guessed or promoted during this work.

## Not completed or not yet proven

The following remain unverified until branch CI and rendered testing complete:

- TypeScript, ESLint, static production export, and the new static audit.
- Desktop Chrome, Safari, and Firefox walkthroughs.
- Physical iPhone Safari and Android Chrome.
- VoiceOver and NVDA.
- Complete dialog focus trapping.
- Back/forward restoration after navigating to a separate full opportunity route; the current directory uses expandable cards and session scroll restoration.
- Server-side sorting options such as recently verified, highest stated funding, and lowest preparation effort.
- Free-form field editing inside the admin queue. Administrators can make controlled publication-state decisions and follow official links, but source-backed field correction still uses the existing database/research workflow.
- A live administrator-path test, because no administrator identity is provisioned.
- Deployment verification. Database changes are live; branch UI changes are not claimed deployed.

## Rollback

The legacy `search_opportunities_v2` function was not replaced. The new artist directory calls separate v3 functions, allowing the frontend to revert without destabilizing public or legacy search consumers.

The new tables are additive. Historical opportunity records were not deleted or bulk-normalized.

## Highest-value next action

Provision one confirmed internal KLEIO account in `kleio_admins`, then run the complete administrator review journey against the draft preview before merging. This validates the moderation gate that protects artist trust.
