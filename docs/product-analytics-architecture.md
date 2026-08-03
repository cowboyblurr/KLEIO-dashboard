# KLEIO Product Analytics Architecture

## Purpose

KLEIO product analytics exists to answer one practical question: **what should the team repair, simplify, expand, delay, or remove so artists can reach meaningful value safely?**

It is not an advertising system, artist-scoring system, surveillance system, or replacement for direct artist research.

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

## Verified baseline: August 3, 2026

- Repository: `cowboyblurr/KLEIO-dashboard`
- Default branch at audit: `main`
- Analytics branch: `feature/kleio-product-analytics-architecture`
- Supabase project: `trekynurdgxgtaaqqtyq`
- Canonical utility retained: `lib/kleio-product-analytics.ts`
- Canonical table retained: `public.product_events`
- Existing administrator helper retained: `private.is_kleio_admin()`
- Existing activation model retained: `public.artist_activation_status`

At audit time the live table contained 171 events, 2 authenticated actors and 21 anonymous sessions. Landing and carousel activity dominated. That history is migrated as `internal_qa` and `legacy_pre_beta`; it is not treated as a real-user beta baseline.

## Architecture

```text
Browser workflow
  └─ trackKleioProductEvent()
       ├─ canonical event dictionary
       ├─ strict scalar metadata allowlist
       ├─ random browser-session UUID
       ├─ normalized first-touch acquisition category
       ├─ release channel, locale and viewport
       └─ record_product_event RPC
            ├─ event/version validation
            ├─ anonymous public-event allowlist
            ├─ server-derived actor and role
            ├─ server-derived traffic class
            ├─ rate limit and idempotency
            └─ product_events insert

Authoritative KLEIO records
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
            └─ durable product events

Private first-touch attribution
  └─ normalized category only
       ├─ no full referrer URL
       ├─ no campaign query string
       ├─ no public actor list
       └─ propagation to earlier durable milestones

Administrator dashboard
  └─ get_kleio_admin_analytics_snapshot RPC
       ├─ private.is_kleio_admin() authorization
       ├─ aggregate counts and rates
       ├─ no raw event rows or user UUIDs
       └─ privacy-safe aggregate CSV
```

No competing event table or parallel browser pipeline was introduced.

## Measurement definitions

### Acquisition

Allowed categories:

- `direct_outreach`
- `artist_referral`
- `institution_referral`
- `linkedin`
- `instagram`
- `organic_search`
- `direct`
- `opportunity_entry`
- `unknown`

The browser stores only the first normalized category. It does not persist the full referrer, `location.href`, campaign query string or free-form source value.

When the same random browser session becomes authenticated, a private first-touch attribution row is created. The first authenticated attribution is immutable. The category is propagated to prior durable milestone events that were created before signup finished, allowing aggregate reporting such as “activated artists from LinkedIn” without exposing individual artists.

### Signup and confirmation

- `signup_started`: first meaningful signup interaction
- `signup_validation_failed`: stable validation code shown
- `signup_submitted`: valid auth request begins
- `account_created`: derived from `auth.users` plus artist profile state
- `confirmation_required`: account awaits email confirmation
- `confirmation_completed`: derived from `auth.users.email_confirmed_at`

### Onboarding

The current beta uses lightweight artist foundation setup rather than a fabricated long questionnaire.

Tracked transitions:

- onboarding started
- foundation step viewed
- saved foundation step completed
- optional profile details deliberately skipped
- confirmation workflow resumed
- onboarding save failed
- onboarding completed from durable profile state

The broader event vocabulary remains available for future real onboarding steps, but KLEIO does not record nonexistent steps merely to fill a dashboard.

### First value

`first_value_reached` is derived when either condition first becomes true:

1. An approved artwork has a title, medium and private image path; or
2. A meaningful active Creative Passport record is confirmed.

Identity-only fields such as professional name, location and links do not qualify by themselves.

### Activation

The artist-beta analytics definition requires:

1. Onboarding completed
2. At least three artwork records
3. Core Creative Passport completed
4. At least one opportunity action

The calculation reuses `artist_activation_status`; it is not reconstructed from page views or button clicks. KLEIO’s operational status may remain stricter by requiring additional reusable material or presentation readiness.

### Return and retention

Return usage is derived from accepted event timestamps after activation:

- same-day return
- day-1 return
- day-7 return
- day-14 return

No artificial `returned_day_7` browser event is fired.

## Workflow audit ledger

| Workflow | Start | Verified completion | Failure or abandonment signal | Product decision |
|---|---|---|---|---|
| Public discovery | `landing_viewed` | artist signup, Creative Passport or opportunities selected | landing without path selection | Improve positioning and calls to action |
| Artist signup | `signup_started` | `account_created` | validation or submission without account | Repair signup loss |
| Confirmation | `confirmation_required` | `confirmation_completed` | unconfirmed account | Improve email delivery and recovery |
| Lightweight onboarding | `onboarding_started` | durable `onboarding_completed` | step without save, save failure | Simplify foundation and protect progress |
| Creative Passport | `passport_started` | section or record confirmed | save failure, proposal rejection | Improve entry modes and evidence quality |
| Google Drive import | source selected / import started | complete or partial private import | authorization, validation or confirmation failure | Protect the active beta source |
| Artwork record | import or portfolio workflow | `artwork_record_saved` | save failure | Protect first value |
| Portfolio inclusion | private media selected | `portfolio_inclusion_confirmed` | no persisted association | Improve artist-controlled reuse |
| Opportunity discovery | directory viewed | open, save, readiness or preparation | no results or views without action | Improve inventory and matching |
| Application preparation | prepare selected | durable package created | intent without package | Repair deep beta value |
| Recovery | interruption or autosave attempt | draft restored or workflow recovered | recovery offered but not completed | Protect artist labor |
| Activation | first value | durable activation milestone | missing one activation condition | Evaluate product value |

Sensitive answers, uploaded filenames, artwork titles and free-form searches are never part of this ledger’s metadata.

## Event contract

Canonical definitions live in:

- `lib/kleio-product-event-dictionary.ts`
- `private.product_event_definitions`

Every definition contains:

- name and version
- product area
- definition and trigger
- expected and prohibited metadata
- owner
- supported metric
- supported product decision
- client, server or derived origin
- deduplication behavior

Names use lowercase `snake_case`. An event’s meaning must not change silently. Increment `event_version` and update documentation when semantics change materially.

### Event dimensions

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
- sanitized flat `metadata`

### Traffic classes

- `real_user`
- `internal_qa`
- `guided_demo`
- `synthetic_preview`
- `automated_test`

Rules:

- private internal accounts are classified server-side as `internal_qa`
- guided-demo routes are `guided_demo`
- preview mode is `synthetic_preview`
- public clients cannot request `automated_test`
- historical pre-architecture data is `internal_qa`

Internal account identifiers remain in the private schema and never ship in frontend code.

## Metadata and privacy

Metadata must be a flat object containing only approved strings, numbers, booleans or null. Strings are normalized and length-limited. JSON is capped at 2 KB.

Representative allowed keys:

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
- `retryable`

Never record:

- names, email addresses, phone numbers or physical addresses
- artwork titles, captions, images or uploaded filenames
- biographies, statements, CV contents or application answers
- grant proposals, documents, website text or social captions
- private or signed URLs
- auth or OAuth tokens
- raw API responses, full error messages or stack traces
- free-form search queries
- sensitive identity or residency details

Operational diagnostics belong in protected logs, not `product_events`.

The founding beta adds no session replay, heatmaps, retargeting, advertising pixels or keystroke recording. The artist-facing disclosure is at `/privacy/product-analytics/`.

## Error codes

Use stable codes such as:

- `signup_required_field_missing`
- `login_credentials_rejected`
- `confirmation_pending`
- `session_expired`
- `onboarding_save_failed`
- `upload_file_too_large`
- `upload_type_unsupported`
- `upload_network_interrupted`
- `import_authorization_expired`
- `import_partial_failure`
- `import_confirmation_failed`
- `autosave_failed`
- `passport_save_failed`
- `opportunity_readiness_failed`
- `opportunity_save_failed`

## Supabase security

### Raw events

`product_events` remains RLS-enabled.

- direct browser insert, update and delete grants are revoked
- raw reads remain behind the existing administrator RLS policy
- artists and institutions cannot read the table
- actor identity always comes from `auth.uid()`
- service-role credentials never enter client code

### Controlled ingestion

`record_product_event`:

- uses a fixed empty `search_path`
- validates event and version against a private catalog
- limits anonymous callers to approved public events
- requires an actor or random session UUID
- derives role and traffic class server-side
- rejects nested, excessive or unapproved metadata
- rate limits by actor or session
- enforces timestamp bounds
- ignores idempotent duplicates
- logs safe rejection codes privately

Analytics failure never blocks signup, upload, saving or navigation.

### Durable milestones

`artist_product_milestones` is RLS-enabled. Artists may read their own milestone timestamps; administrators may read through the existing admin helper. Browser roles cannot write it.

Trigger functions derive milestones from auth, profile, portfolio, Passport, activation, opportunity and application records. They never copy private artist content into analytics.

### Aggregate reporting

`get_kleio_admin_analytics_snapshot`:

- requires `private.is_kleio_admin()`
- revokes PUBLIC execution
- returns aggregate JSON only
- supports date, traffic class, acquisition and viewport filters
- limits the date range to 366 days
- never returns raw events, user UUIDs or private content

## Administrator dashboard

Route:

```text
/admin/analytics/
```

It is not exposed in public navigation and is marked no-index/no-follow. Database authorization is the source of truth.

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

Accessibility implementation:

- semantic headings, tables, captions and row headers
- text alternatives for visual bars
- visible counts beside rates
- keyboard-operable filters and export
- focus-visible states
- responsive table overflow
- loading, denied, empty and error states
- no motion-dependent meaning

CSV export contains aggregate data only.

## Metrics and decisions

### Overview

- visitors
- signup starts
- confirmed accounts
- onboarding completions
- first-value artists
- activated artists
- import success rate
- opportunity-engaged artists
- error-free workflow rate

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

The report includes counts, step conversion, drop-off and median time.

### Friction and reliability

- onboarding step views, completion, skips, save failures and resumptions
- import starts, complete, partial and failed outcomes
- median import workflow time
- autosave failure and restoration
- stable error codes by step, source and viewport
- recovery offered and completed

### Data quality

- event counts by traffic class
- rejected events
- duplicate attempts
- unknown acquisition categories
- missing versions
- last successful ingestion
- last rejection

## Product thresholds

### Immediate repair

Escalate when:

- import success is below 95%
- confirmation repeatedly fails
- saved work is lost
- a blocking error affects over 20% of relevant users
- mobile completion is materially worse than desktop
- session expiry interrupts active work
- one onboarding step causes severe abandonment
- privacy or cross-account isolation fails

### Investigation

Research when:

- more than 30% abandon one step
- a feature is opened but rarely completed
- artists repeatedly correct the same area
- one import source performs substantially worse
- opportunity views are high but saves are low
- artists reach first value but do not activate
- activated artists do not return

### Sample warnings

Warn when:

- fewer than 10 relevant people are represented
- internal QA exceeds real-user traffic
- acquisition classification is incomplete
- definitions recently changed
- rollout creates missing stages

## Validation

Static commands:

- `pnpm audit:product-analytics`
- `pnpm audit:analytics-privacy`
- `pnpm audit:analytics-coverage`
- `pnpm audit:analytics-admin`
- `pnpm audit:analytics-attribution`

They verify taxonomy, naming, direct-write removal, metadata privacy, critical workflow coverage, durable milestones, traffic separation, administrator authorization, no public route exposure, no service-role secrets, no surveillance packages and normalized first-touch attribution.

Database verification must confirm:

- approved anonymous events are accepted
- protected anonymous events are rejected
- invalid names, versions, metadata and timestamps are rejected
- authenticated callers cannot impersonate another actor
- artists and institutions cannot read raw events
- non-admin users cannot call aggregate RPCs
- administrators can call aggregate RPCs
- milestones and attribution remain idempotent
- demo and real-user events remain separable
- cross-account milestone reads are denied
- grants match RLS intent

Do not claim physical browser, device or assistive-technology testing unless it was actually performed.

## Migration order

1. `20260803162000_product_analytics_event_contract.sql`
2. `20260803162100_product_analytics_milestones.sql`
3. `20260803162200_product_analytics_admin_snapshot.sql`
4. `20260803162300_product_analytics_acquisition_attribution.sql`

All changes are additive except tightening browser grants on the analytics table. Existing event history is preserved.

## Event governance

Before adding an event:

1. State the product question.
2. Define the decision the data supports.
3. Check whether an existing event answers it.
4. Add a new event only when necessary.
5. Define safe metadata.
6. Complete privacy review.
7. Add or update audits.
8. Version and document the event.
9. Validate in controlled testing.
10. Monitor ingestion quality after release.

Do not add hover, scroll, field-focus or decorative-animation events without a documented research need.

## Release and rollback

### Release

1. Run analytics and inherited security audits.
2. Run TypeScript, ESLint and static export.
3. Validate migrations in order.
4. Apply migrations.
5. Verify grants, RLS, constraints and RPC authorization.
6. Verify idempotency and first-touch propagation.
7. Review Supabase security and performance advisors.
8. Run controlled artist, failure and demo journeys.
9. Merge after checks pass.
10. Monitor data quality rather than event volume.

### Rollback

1. Revoke `record_product_event` execution to stop ingestion.
2. Revoke the aggregate RPC.
3. Disable the private admin route if necessary.
4. Drop new durable-event and attribution triggers.
5. Preserve event history and milestone timestamps unless a reviewed retention decision says otherwise.
6. Re-run grants and RLS verification.

The preferred incident response is to stop ingestion—not delete artist or analytics history impulsively.

## Known limitations

- Pre-architecture history cannot be reliably separated into real users and internal tests.
- Anonymous-to-authenticated stitching works only in the same retained random browser session.
- KLEIO does not fingerprint users across browsers or devices.
- Existing onboarding completion may use `profiles.updated_at` as the best available backfill time.
- First value measures meaningful saved state, not artistic quality.
- Early percentages remain directional until cohorts grow.
- Institution analytics is taxonomy-ready but not expanded in this artist-focused branch.
- Operational logs remain separate from product analytics.
- Physical mobile, browser and screen-reader testing remains manual unless explicitly completed and documented.

## Future institution analytics

Future institution definitions should cover onboarding, open-call creation, publishing, reviewer assignment, review completion, committee progress, shortlist decisions and report generation. Institution first value and activation must be defined separately before instrumentation.

KLEIO should optimize successful professional workflows—not time spent, compulsive engagement or artist ranking.
