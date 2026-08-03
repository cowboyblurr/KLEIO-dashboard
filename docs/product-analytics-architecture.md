# KLEIO Product Analytics Architecture

## Purpose

KLEIO product analytics exists to answer a narrow question: **what should the team repair, simplify, expand, delay, or remove so artists can reach meaningful value safely?**

It is not an advertising system, artist-scoring system, surveillance system, or substitute for direct artist research.

The founding artist-beta hierarchy is:

```text
Acquisition
→ Signup
→ Confirmation
→ Onboarding
→ First value
→ Activation
→ Opportunity engagement
→ Return usage
→ Retention
```

Every event must support a product decision. Counts must appear beside percentages. Cohorts with fewer than ten relevant people are directional, not statistically reliable.

---

## Audit baseline: August 3, 2026

### Repository and infrastructure

- Repository: `cowboyblurr/KLEIO-dashboard`
- Default branch at audit: `main`
- Feature branch: `feature/kleio-product-analytics-architecture`
- Connected Supabase project: `trekynurdgxgtaaqqtyq`
- Canonical client utility retained: `lib/kleio-product-analytics.ts`
- Canonical event table retained: `public.product_events`
- Existing administrator helper retained: `private.is_kleio_admin()`
- Existing durable activation model retained: `public.artist_activation_status`

No competing analytics table or parallel browser pipeline was introduced.

### Existing event volume

At audit time the live table contained:

- 171 total events
- 141 authenticated events
- 30 anonymous events
- 2 authenticated actors
- 21 anonymous sessions
- First event: July 30, 2026
- Latest event at audit: August 3, 2026

The distribution was dominated by landing and carousel testing. This history is classified as `internal_qa` and `legacy_pre_beta` during migration. It must not be presented as a reliable real-user beta baseline.

### Existing architecture retained

Strengths retained:

- First-party Supabase event storage
- Row Level Security
- Administrator-only raw event reads
- `auth.uid()` actor defaults
- Existing event-name constraints
- Existing opportunity foreign key
- Existing `artist_activation_status` trigger model
- Existing client calls that represent meaningful transitions

Weaknesses repaired:

- Browser roles could insert directly into the table.
- Authenticated table grants included update and delete even though RLS limited those actions.
- Metadata sanitation removed known sensitive keys but was not a strict allowlist.
- Event versions, product areas, traffic classes and release channels were absent.
- Internal tests, guided demos and real users could not be separated reliably.
- First value and retention were not defined.
- Activation was not emitted as an idempotent analytics milestone.
- The browser could provide unrestricted surface and metadata values.
- There was no aggregate administrator dashboard or data-quality panel.

---

## Architecture

```text
Client workflow
  └─ trackKleioProductEvent()
       ├─ canonical dictionary lookup
       ├─ safe scalar metadata filter
       ├─ random browser-session UUID
       ├─ normalized acquisition category
       ├─ release channel and viewport
       └─ record_product_event RPC
            ├─ event/version catalog validation
            ├─ anonymous public-event allowlist
            ├─ server-derived actor and role
            ├─ server-derived traffic class
            ├─ database metadata validation
            ├─ rate limit
            ├─ deduplication
            └─ product_events insert

Authoritative product records
  ├─ auth.users
  ├─ profiles
  ├─ portfolio_works
  ├─ artist_passport_records
  ├─ artist_activation_status
  ├─ saved_opportunities
  ├─ application_packages
  └─ artist_media_usages
       └─ private trigger functions
            ├─ artist_product_milestones
            └─ idempotent durable product events

Administrator dashboard
  └─ get_kleio_admin_analytics_snapshot RPC
       ├─ private.is_kleio_admin() authorization
       ├─ aggregate counts and rates
       ├─ no raw event rows
       ├─ no user UUIDs
       ├─ no artist content
       └─ privacy-safe aggregate CSV
```

### Why the browser does not write directly

The browser may request an approved event through `record_product_event`, but it cannot choose:

- `actor_user_id`
- `actor_role`
- `product_area`
- `traffic_class`
- an arbitrary event version
- an arbitrary event name
- arbitrary nested metadata

The function derives or validates those values and records rejected attempts separately in the private schema.

Analytics failure is non-blocking. Signup, upload, saving and navigation do not depend on event ingestion succeeding.

---

## Audit ledger

| Workflow | User objective | Start | Completion | Abandonment / failure signals | Decision supported | Origin |
|---|---|---|---|---|---|---|
| Public landing | Understand KLEIO and choose a path | `landing_viewed` | `artist_signup_selected`, `creative_passport_selected`, or `explore_opportunities_selected` | Landing without a selected path | Improve positioning and primary calls to action | Client |
| Artist signup | Create an artist account | `signup_started` | `account_created` | Validation failure, submitted without account creation, confirmation not completed | Repair signup and confirmation loss | Client start + durable milestone |
| Confirmation | Enter KLEIO with a confirmed account | `confirmation_required` | `confirmation_completed` | Unconfirmed account after signup | Improve email delivery and recovery instructions | Client guidance + auth-derived milestone |
| Onboarding | Save essential artist setup | `onboarding_started` | `onboarding_completed` | Step views without completion, validation failure, save failure, save-and-exit | Simplify high-friction steps and protect progress | Client steps + durable milestone |
| Creative Passport | Confirm reusable professional records | `passport_started` | `passport_section_completed` or `passport_record_confirmed` | Section start without completion, save failure, proposal rejection | Improve modes, section design and assistive proposal quality | Client + server record |
| Media import | Add selected private files | `import_source_selected`, `import_started` | `import_completed` or `import_partially_completed` | Authorization failure, validation failure, no successful items | Improve active source reliability and recovery | Client outcome + durable artwork state |
| Artwork record | Save a meaningful artwork record | Import or portfolio preparation | `artwork_record_saved` | `artwork_record_save_failed` | Protect first value and portfolio completion | Server record |
| Portfolio inclusion | Reuse private media publicly by choice | Private media selected | `portfolio_inclusion_confirmed` | Selection without persisted usage | Improve handoff while preserving artist approval | Server association |
| Opportunity directory | Find relevant professional opportunities | `opportunity_directory_viewed` | Opportunity open, save, readiness or preparation | No-result search, views without meaningful action | Improve inventory, search, filters and relevance | Client + server save |
| Application preparation | Begin a reusable submission package | `prepare_selected` | `application_preparation_started` | Intent without package creation | Repair the deepest beta value workflow | Client intent + server record |
| Autosave and interruption | Continue without losing work | Autosave attempt or interrupted session | `autosave_succeeded`, `draft_restored`, `workflow_recovered` | Autosave failure, session expiry, recovery offered but not completed | Protect artist labor and trust | Client |
| First value | Create one meaningful saved outcome | Confirmed artist account | `first_value_reached` | Onboarding without artwork or meaningful Passport record | Measure whether KLEIO becomes useful | Derived |
| Activation | Complete the beta value loop | First value | `artist_activated` | Missing onboarding, three works, Passport section or opportunity action | Evaluate acquisition quality and product value | Derived |
| Return and retention | Continue after initial value | Activation timestamp | Same-day, day-1, day-7, day-14 return | No subsequent activity | Decide whether KLEIO supports continuing work | Derived query |

Sensitive answers, free-form search text, artwork titles and uploaded filenames are not event metadata.

---

## Measurement definitions

### Acquisition

Acquisition source is a normalized category:

- `direct_outreach`
- `artist_referral`
- `institution_referral`
- `linkedin`
- `instagram`
- `organic_search`
- `direct`
- `opportunity_entry`
- `unknown`

KLEIO does not store the full referrer URL or campaign query string in `product_events`.

### First value

`first_value_reached` is derived when either condition first becomes true:

1. An approved artwork has a title, medium and private image path; or
2. A meaningful active Passport record is confirmed.

Basic identity-only records such as professional name, location and links do not qualify by themselves.

### Artist activation

The founding beta analytics definition requires:

1. Onboarding completed
2. At least three artwork records
3. Core Creative Passport completed
4. At least one opportunity-related action

The calculation reuses `artist_activation_status` rather than reconstructing product state from clicks. KLEIO’s stricter operational activation state may continue to include additional readiness requirements such as reusable material and identity presentation.

### Return and retention

Return is derived from event timestamps after `artist_activated`:

- Same-day return
- Day-1 return
- Day-7 return
- Day-14 return

No browser event named `returned_day_7` is fired. Weekly active artists can be derived from distinct authenticated artists with accepted events during a calendar week.

### Error-free workflow rate

A workflow is error-free when it has a `workflow_id` and no blocking event such as:

- `user_visible_error`
- `upload_failed`
- `import_failed`
- `autosave_failed`
- `passport_save_failed`
- `onboarding_save_failed`

Workflows without an identifier are excluded rather than assumed successful.

---

## Event contract

Canonical definitions live in:

- `lib/kleio-product-event-dictionary.ts`
- `private.product_event_definitions`

Every event definition includes:

- Event name
- Version
- Product area
- Definition
- Trigger
- Expected metadata
- Prohibited metadata
- Owner
- Metric supported
- Product decision supported
- Client, server or derived origin
- Deduplication behavior

Event names use lowercase `snake_case`.

An event’s meaning must not change silently. Increment `event_version` and document the change when semantics change materially.

### Required dimensions

The event table supports:

- `event_version`
- `surface`
- `product_area`
- `release_channel`
- `traffic_class`
- `actor_role`
- `workflow_id`
- `opportunity_id`
- `app_version`
- `locale`
- `viewport`
- `acquisition_source`
- `occurred_at`
- `deduplication_key`
- sanitized `metadata`

### Traffic classes

- `real_user`
- `internal_qa`
- `guided_demo`
- `synthetic_preview`
- `automated_test`

Rules:

- Users listed in the private `analytics_internal_actors` table are `internal_qa`.
- Guided-demo routes and release channel are `guided_demo`.
- Synthetic preview mode is `synthetic_preview`.
- The public client cannot request `automated_test`.
- All historical pre-architecture events are backfilled as `internal_qa` and `legacy_pre_beta` because the observed dataset was dominated by known development activity and could not be reliably reclassified as real-user behavior.

Internal account identifiers remain in the private schema and never ship in frontend code.

---

## Metadata allowlist

Permitted metadata is a flat object of strings, numbers, booleans or null. Strings are normalized and length-limited. The complete allowlist is enforced in both TypeScript and Postgres.

Examples:

- `source`
- `status`
- `reason`
- `step`
- `mode`
- `viewport`
- `count`
- `result_count`
- `failed_count`
- `duplicate_count`
- `filter_count`
- `edited`
- `reduced_motion`
- `section`
- `error_code`
- `provider`
- `completion_state`
- `retryable`

The metadata JSON representation is limited to 2 KB.

### Prohibited analytics content

Never record:

- Artist names
- Email addresses
- Phone numbers
- Physical addresses
- Artwork titles
- Artwork captions
- Artist statements
- Biographies
- CV contents
- Application answers
- Grant proposals
- Uploaded filenames
- File contents
- Website page text
- Social captions
- Private URLs
- Signed storage URLs
- Authentication or OAuth tokens
- Raw API responses
- Raw provider errors
- Full error messages
- Stack traces
- Free-form search queries
- Document contents
- Sensitive identity or residency information

### Error-code dictionary

Use stable codes such as:

- `signup_required_field_missing`
- `signup_password_rejected`
- `confirmation_pending`
- `login_credentials_rejected`
- `session_expired`
- `onboarding_validation_failed`
- `onboarding_save_failed`
- `upload_file_too_large`
- `upload_type_unsupported`
- `upload_network_interrupted`
- `import_authorization_expired`
- `import_partial_failure`
- `import_no_items_saved`
- `autosave_failed`
- `passport_save_failed`
- `opportunity_load_failed`
- `workflow_state_conflict`

Raw technical details belong in protected operational logs, not `product_events`.

---

## Supabase security

### Table access

`public.product_events` remains RLS-enabled.

- Anonymous and authenticated direct inserts are revoked.
- Browser update and delete grants are revoked.
- Authenticated raw reads are allowed only through the existing `product_events_admin_read` RLS policy.
- Artists and institutions cannot read the table.
- Service-role credentials never enter client code.

### Controlled ingestion

`record_product_event`:

- Uses a fixed empty `search_path`
- Derives actor from `auth.uid()`
- Validates event and version against a private catalog
- Limits anonymous users to approved public events
- Requires an actor or random session ID
- Derives role and traffic class
- Rejects nested or excessive metadata
- Limits timestamp age
- Rate limits by user or session
- Ignores idempotent duplicates
- Returns a simple accepted/rejection result

### Aggregate reporting

`get_kleio_admin_analytics_snapshot`:

- Requires `private.is_kleio_admin()`
- Revokes PUBLIC execution
- Returns aggregate JSON only
- Does not return event rows, user UUIDs or private content
- Supports date range, traffic class, acquisition source and viewport filters
- Limits the maximum date range to 366 days

### Durable state

`artist_product_milestones` is RLS-enabled.

- Artists may read their own milestone timestamps.
- Administrators may read through the existing admin helper.
- Browser roles cannot write milestones.
- Trigger functions have a fixed `search_path` and no public execution grant.

---

## Administrator dashboard

Route:

```text
/admin/analytics/
```

The route is not linked in public product navigation and opts out of indexing. Loading a confirmed KLEIO account is necessary, but database RPC authorization is the source of truth.

Sections:

1. Overview
2. Signup-to-activation funnel
3. Onboarding friction
4. Import and artwork handoff
5. Creative Passport usage
6. Opportunity engagement
7. Reliability and recovery
8. Activated-artist cohorts
9. Data quality

Accessibility requirements implemented:

- Semantic headings
- Semantic tables and captions
- Visible text for every visual indicator
- Keyboard-operable filters and export
- Focus-visible states
- Responsive overflow for tables
- Loading, denied, empty and error states
- Counts shown beside rates
- No motion-dependent meaning

The CSV export contains the aggregate snapshot only.

---

## Dashboard metrics

### Overview

- Visitors
- Signup starts
- Confirmed accounts
- Onboarding completions
- First-value artists
- Activated artists
- Import success rate
- Opportunity-engaged artists
- Error-free workflow rate

### Funnel

```text
Landing viewed
→ Artist signup selected
→ Signup started
→ Account created
→ Confirmation completed
→ Onboarding completed
→ First value reached
→ Artist activated
```

The report shows counts, step conversion, drop-off and median time.

Anonymous acquisition events can be associated with an authenticated actor only when the same random browser-session UUID continues through signup. KLEIO does not fingerprint users across browsers or devices.

### Onboarding friction

- Views
- Completions
- Skips
- Validation failures
- Save failures
- Save-and-exit
- Resumptions
- Viewport

### Import performance

- Source
- Starts
- Complete outcomes
- Partial outcomes
- Failures
- Completion rate
- Median workflow completion time
- Artwork records saved
- Portfolio inclusions
- Viewport

Inactive providers should show zero—not placeholder activity.

### Reliability

- Stable error code
- Product event
- Step
- Source
- Viewport
- Recovery offered
- Recovery completed
- Session recovered
- Draft restored

### Data quality

- Event counts by traffic class
- Rejected events
- Duplicate milestone attempts
- Unknown acquisition events
- Missing versions
- Last successful ingestion
- Last rejection

---

## Product decision thresholds

### Immediate repair

Escalate when:

- Import success falls below 95%
- Account confirmation repeatedly fails
- Saved work is lost
- A blocking error affects more than 20% of relevant users
- Mobile completion is materially worse than desktop
- Session expiry interrupts active work
- One onboarding step causes severe abandonment
- Cross-account or privacy isolation fails

### Investigation

Research when:

- More than 30% abandon one step
- A feature is opened but rarely completed
- Artists repeatedly return to correct the same area
- One import source completes substantially less often
- Opportunity views are high but saves are low
- Artists reach first value but do not activate
- Activated artists do not return

### Sample warnings

Display warnings when:

- Fewer than 10 relevant people are represented
- Internal QA exceeds real-user activity
- Acquisition classification is incomplete
- Definitions recently changed
- Instrumentation rollout creates missing stages

---

## Validation

### Static audits

- `pnpm audit:product-analytics`
- `pnpm audit:analytics-privacy`
- `pnpm audit:analytics-coverage`
- `pnpm audit:analytics-admin`

They verify:

- All literal event calls are declared
- Event names use `snake_case`
- Direct browser event inserts are absent
- Sensitive metadata is not allowlisted
- Nested metadata is rejected
- Critical workflow events exist
- Milestones are durable and idempotent
- Demo traffic is distinguishable
- Admin reporting uses aggregate RPCs
- Admin route is not publicly linked
- Service-role secrets are absent
- Session replay and advertising analytics packages are absent

### Database verification

Before release, verify:

- Anonymous public events can be accepted
- Anonymous protected events are rejected
- Actor identity always comes from `auth.uid()`
- Invalid event names and versions are rejected
- Nested or oversized metadata is rejected
- Artists and institutions cannot read raw events
- Non-admin users cannot call aggregate RPCs
- Admin users can call aggregate RPCs
- Milestones remain idempotent under repeated refresh
- Historical internal events remain excluded from `real_user`
- Cross-account reads are denied
- Grants match RLS intent

### Workflow verification

Use synthetic or controlled accounts for:

- Signup and confirmation
- Onboarding completion and resume
- Google Drive import completion, partial completion and failure
- Artwork first value
- Passport first value
- Opportunity save and readiness
- Application preparation
- Session expiry and recovery
- Guided demo traffic classification

Do not claim physical device, browser or assistive-technology testing unless it was performed.

---

## Data governance

Before adding an event:

1. State the product question.
2. Define the decision the data supports.
3. Check whether an existing event answers it.
4. Add a new event only when necessary.
5. Define the safe metadata.
6. Complete privacy review.
7. Add or update audits.
8. Version and document the event.
9. Validate in controlled testing.
10. Monitor ingestion quality after release.

Do not add events for hover, scroll, field focus or decorative animation unless a documented research question requires them.

---

## Release process

1. Create a focused analytics branch.
2. Add additive migrations.
3. Update the dictionary and utility.
4. Add meaningful instrumentation.
5. Run analytics audits.
6. Run inherited auth, navigation and copy audits.
7. Run TypeScript, ESLint and production build.
8. Validate migrations transactionally.
9. Apply migrations in order.
10. Verify grants, RLS, constraints, RPC authorization and idempotency.
11. Review Supabase security and performance advisors.
12. Perform controlled artist, failure and demo journeys.
13. Merge only after checks pass.
14. Monitor data quality, not only event volume.

### Migration order

1. `20260803162000_product_analytics_event_contract.sql`
2. `20260803162100_product_analytics_milestones.sql`
3. `20260803162200_product_analytics_admin_snapshot.sql`

---

## Rollback

A safe rollback should preserve existing event history.

1. Disable the admin route or remove its navigation-free static page.
2. Revoke `record_product_event` execution from browser roles.
3. Revoke the aggregate RPC.
4. Drop new milestone and durable-event triggers.
5. Keep `product_events` columns and existing rows unless a reviewed data-retention decision requires removal.
6. Restore the previous client utility only if the direct-insert grants and privacy implications are explicitly accepted.
7. Do not delete `artist_product_milestones` until its timestamps are exported or confirmed unnecessary.
8. Re-run RLS and grants verification.

The preferred incident response is to stop ingestion by revoking RPC execution, not to delete artist or analytics history impulsively.

---

## Known limitations

- The pre-architecture event history cannot be reliably separated into real users and internal tests; it is classified as internal QA.
- Anonymous-to-authenticated attribution works only within the same retained random browser session.
- KLEIO does not fingerprint users across devices or browsers.
- Existing artists who completed onboarding before this migration may use `profiles.updated_at` as the best available backfill timestamp.
- First-value rules identify meaningful saved state but do not judge artistic quality.
- Early percentages are directional until real-user cohorts grow.
- Institution analytics is taxonomy-ready but not expanded in this artist-focused branch.
- Operational logs remain separate from product analytics.
- Physical mobile, browser and screen-reader verification remains manual unless explicitly completed and documented.

---

## Future institution analytics

Future institution events should extend the same architecture for:

- Institution onboarding
- Open-call creation and publishing
- Reviewer assignment
- Review completion
- Committee progress
- Shortlist decisions
- Report generation
- Submission-volume reliability

Do not infer institution success from artist-side activity. Define institution first value and activation separately before instrumenting them.

---

## Future experiment framework

Before experiments:

- Establish stable real-user traffic classification
- Confirm milestone completeness
- Define a primary metric and guardrail metric
- Version changed event meanings
- Avoid manipulative engagement goals
- Prevent experiments from changing artist privacy or access without review

KLEIO should optimize successful professional workflows, not time spent or compulsive usage.

---

## Artist-facing privacy summary

The public explanation lives at:

```text
/privacy/product-analytics/
```

It states that KLEIO collects limited first-party usage information to improve essential workflows, does not use artwork or professional materials as analytics content, does not sell behavioral data, and does not use advertising pixels, session replay, heatmaps or keystroke recording in the founding beta.
