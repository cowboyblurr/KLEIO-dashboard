# KLEIO Seed Migration and Opportunity Ingestion Plan

KLEIO should keep demo names/data synthetic until real users exist, but the mechanics should be source-backed and traceable.

## Seed migration goal

Move current records from `lib/kleio-data.ts` into a database-ready seed format without breaking the static demo.

## Seed migration steps

1. Inventory current records
   - institution
   - programs
   - collaborators
   - artists
   - submissions
   - reviews
   - notes
   - messages
   - message threads
   - activity log
   - opportunities

2. Add source metadata to every record
   - source_kind: seed
   - source_label
   - created_at
   - updated_at
   - verified_at: null

3. Map records to database tables
   - artist profile records into `artists`
   - institution record into `institutions`
   - collaborators into `users` and `institution_members`
   - applications into `submissions`
   - reviewer assignments into `reviews`
   - messages into `messages` and `message_threads`
   - activity into `activity_log`

4. Validate relationships
   - every submission has artist_id and program_id
   - every review has submission_id and reviewer_id
   - every program has institution_id
   - every message has submission_id where relevant
   - every activity entry has an actor or system actor

5. Replace static imports gradually
   - analytics reads from source adapter first
   - UI continues working with same data shape
   - database client replaces seed source later

## Opportunity ingestion goal

The opportunity directory should eventually pull from verified source records or approved admin ingestion, not hand-written examples.

## Opportunity ingestion phases

### Phase 1 — Curated seed opportunities

Use manually reviewed seed records with source labels.

Required fields:

- title
- organizer
- source_url
- type
- deadline
- amount
- currency
- location
- eligibility
- disciplines
- required_materials
- effort_level
- fetched_at
- verified_at
- source_kind

### Phase 2 — Admin ingestion

Add internal admin workflow to create/update opportunities from verified sources.

Admin must confirm:

- source URL
- deadline
- eligibility
- award amount
- required materials
- whether opportunity is still open

### Phase 3 — Scheduled ingestion

Add scheduled jobs only after source quality rules are clear.

Each ingestion job should:

- fetch source page/feed/API
- normalize fields
- mark fetched_at
- flag uncertainty
- require review before artist-facing recommendation if fields are incomplete

### Phase 4 — Match calculation trace

Every artist opportunity score should explain:

- discipline match
- medium/material match
- location/eligibility match
- deadline urgency
- application readiness
- missing materials
- effort level

Do not show a match percentage that cannot explain itself.

## Ingestion safety rules

- Do not scrape restricted sources without permission.
- Prefer official source pages, APIs, RSS feeds, CSVs, or institution-published calls.
- Keep source URL visible internally.
- Store fetched_at and verified_at separately.
- Mark uncertain records before showing them as recommendations.
