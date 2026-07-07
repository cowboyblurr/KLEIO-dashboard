# KLEIO Backend Implementation Plan

Objective: move KLEIO from a real computed demo on synthetic seed records into live infrastructure without weakening the current demo.

## Principle

The current demo can keep synthetic names and example records. The next implementation layer must make the mechanics real behind the interface:

- database-backed records
- production authentication
- role-based access
- seed migration
- source-backed opportunity ingestion
- file storage
- traceable analytics

## Phase 1 — Source adapter hardening

Status: started.

Current source adapter:

- wraps seed records with source metadata
- exposes one boundary for future database/API records
- supports source kind labels: seed, database, api, ingested, user-created, institution-created

Next actions:

1. Replace direct analytics imports from `lib/kleio-data.ts` with `getKleioRecords()` from `lib/kleio-source.ts`.
2. Keep the UI unchanged while changing the source boundary behind it.
3. Add tests or audit checks proving KPI values derive from source records.

## Phase 2 — Database persistence

Recommended database tables are documented in `docs/KLEIO_DATABASE_SCHEMA_DRAFT.md`.

Priority tables:

1. users
2. artists
3. institutions
4. institution_members
5. programs
6. opportunities
7. submissions
8. reviews
9. notes
10. messages
11. activity_log
12. files

Implementation order:

1. Create schema.
2. Import seed records.
3. Run analytics against database records.
4. Preserve current static demo route as a fallback.
5. Add controlled write actions only after role rules are defined.

## Phase 3 — Authentication

The next account system should support:

- artist account
- institution admin account
- reviewer / collaborator seat
- viewer-only seat
- internal system actor

Do not call it production authentication until it supports:

- persistent users
- session handling
- user-role lookup
- protected routes
- role-scoped data reads
- safe logout
- environment-separated keys

## Phase 4 — Role access model

Access must be explicit before real submissions are accepted.

Artist:

- owns profile and materials
- controls authorization to share with institutions
- reads own application status and messages

Institution admin:

- manages programs, reviewers, submissions, reports, messages, and decision history for their institution

Reviewer:

- sees assigned submissions only
- submits review notes and scores
- sees rubric and guidelines

Collaborator / viewer:

- sees limited shared context based on invitation permissions

## Phase 5 — Opportunity ingestion

Opportunity records must have source metadata.

Required fields:

- source_kind
- source_name
- source_url
- fetched_at
- verified_at
- title
- organizer
- type
- amount
- currency
- location
- deadline
- eligibility
- disciplines
- required_materials
- effort_level

Start with controlled admin ingestion before automated scraping. Prefer verified feeds/APIs where available.

## Phase 6 — Files and materials

Before live artist use, KLEIO needs real file storage for:

- CV
- artist statement
- portfolio PDF
- work images
- project proposals
- budgets
- references
- institution attachments

File records must include owner, uploader, file type, storage path, size, and created timestamp.

## Phase 7 — Traceable analytics

Every dashboard number should answer:

- Which records produced this number?
- Which calculation was used?
- What time range was used?
- Was this seed, imported, verified, or user-created data?

The infrastructure audit route should remain available for serious reviewers, investors, and technical advisors.
