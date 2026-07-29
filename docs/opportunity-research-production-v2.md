# KLEIO opportunity research production v2

## Purpose

This release separates artist-specific public-source research from KLEIO's shared canonical opportunity requirements and moves research execution into a durable queue-backed workflow.

The system is intentionally evidence-first. It may prepare candidate requirements and compare them with the artist's Creative Passport, but it does not silently promote those findings, send an email, complete a payment, accept a declaration, or submit an external application.

## Truth table

| Capability | Status | Notes |
| --- | --- | --- |
| Canonical/session data separation | Deployed and enabled | Artist research is stored in candidate tables and cannot write directly to shared canonical requirements. |
| Durable research queue | Deployed and enabled | `pgmq` queue `opportunity_research`; artist enqueue returns immediately. |
| Retry and archive behavior | Deployed and enabled | Service-only claim, completion, retry, cancellation, and archive RPCs. |
| HTML/JSON/XML/plain-text acquisition | Deployed and enabled | Stored official URLs only in this release. |
| URL/DNS/redirect/size/robots safeguards | Deployed and enabled | Restricted or unsafe sources are recorded rather than bypassed. |
| Source checksums and versions | Deployed and enabled | ETag and Last-Modified are retained when supplied. |
| Candidate requirement extraction | Deployed and enabled | Deterministic English/Spanish vocabulary; findings remain session-scoped. |
| Creative Passport candidate comparison | Committed; pending frontend merge | Does not change the canonical package builder. |
| Private public-PDF preservation | Deployed and enabled | 10 MB limit; private bucket. |
| Page-level PDF extraction | Feature-flagged off | The first PDF.js Edge runtime build failed cold-start validation. PDFs are labeled for manual review. |
| OCR | Feature-flagged off | No approved OCR provider or tested worker is configured. |
| General public search provider | Feature-flagged off | No provider credential or commercial-use decision is configured. |
| Independent source monitoring sweep | Feature-flagged off | Source versions are compared during artist research; no recurring monitoring sweep is enabled. |
| Gmail OAuth | Feature-flagged off | Schema only; no Google project, verified consent screen, redirect URIs, encryption key, or tokens configured. |
| Gmail draft creation and sending | Feature-flagged off | No email is created or sent by this release. |
| Portal browser assistance | Feature-flagged off | Schema only; no extension or provider adapter is enabled. |
| Provider final submission | Feature-flagged off | No external provider is represented as supported. |

## Artist flow

1. The preparation route calls the authenticated `research-opportunity` Edge Function.
2. The function invokes `create_or_resume_opportunity_research` using the artist's JWT.
3. The RPC verifies artist role, feature availability, opportunity availability, rate limits, and duplicate work.
4. The RPC creates a session, persisted steps, job, audit event, and `pgmq` message.
5. The `process-opportunity-research` worker claims one message using service-only database functions.
6. The worker stores source access state and source versions.
7. Extracted requirements are written to `opportunity_candidate_requirements`, never directly to `opportunity_requirements`.
8. The artist-facing panel polls persisted state and compares candidates with the current Creative Passport.
9. Existing package and submission controls continue to use canonical requirements.

## Canonical integrity

`prevent_session_research_from_writing_canonical_requirements` rejects any canonical requirement insert or update carrying a research session or the legacy `public_source_research` extraction method.

Promotion is a separate, service-only path. A candidate must be verified or corroborated, have a fetched versioned source checksum, and have no open blocking conflict. Promotions are idempotent and include the previous value for rollback.

## Queue operations

- Queue: `opportunity_research`
- Worker schedule: once per minute
- Immediate worker nudge: enqueue function uses `EdgeRuntime.waitUntil`
- Default attempts: 3
- Claim lease: 240 seconds in the current worker
- Artist rate limit: 10 research jobs per hour
- Per-opportunity cooldown: 30 seconds
- Active-job uniqueness: one queued, processing, retrying, or cancellation-requested job per artist/opportunity

The queue schema and claim functions are inaccessible to anonymous and authenticated browser roles.

## Storage and retention

Public PDF sources are stored in the private `opportunity-source-documents` bucket only when the URL is publicly accessible and the file matches the PDF signature.

Current policy:

- Maximum object size: 10 MB
- Allowed MIME type: `application/pdf`
- Public access: disabled
- Browser role object access: revoked
- Intended retention: 30 days per document record

A future cleanup job must remove expired document records and storage objects before broad rollout.

## Feature flags

The following flags exist in `kleio_feature_flags`:

- `opportunity_research`
- `opportunity_pdf_text_extraction`
- `opportunity_ocr`
- `opportunity_search_provider`
- `opportunity_source_monitoring`
- `gmail_connection`
- `gmail_draft_creation`
- `gmail_send`
- `portal_assistance`
- `provider_final_submission`

Only `opportunity_research` is enabled in this release.

## Validation completed

- Edge worker cold-start smoke returns `idle` when the queue is empty.
- A synthetic queue job claimed, fetched two official public sources, versioned them, persisted steps, and completed in `artist_review_required`.
- Synthetic session, job, source versions, audit records, source-change records, and queue archive message were removed afterward.
- Authenticated artist enqueue was tested inside a rollback-only JWT context; it created a queue message and left zero persisted records after rollback.
- Canonical research-write guard was tested and rejected a legacy research extraction insert.
- TypeScript, lint, and static export run through GitHub Actions.
- Supabase security and performance advisors were rerun after indexing and execution-grant hardening.

## Known limitations and safe fallbacks

### PDF extraction

Limitation: page-level parsing is disabled because the first PDF.js package failed in the hosted Edge runtime.

Fallback: preserve the public PDF privately, display the source URL, and label it as unread/manual review. Do not calculate requirements from it.

### OCR

Limitation: scanned pages cannot be interpreted automatically.

Fallback: mark the document unresolved and require artist review.

### Search discovery

Limitation: the worker begins only from stored application, canonical, and guideline URLs.

Fallback: show unresolved source access and allow a later approved search provider integration.

### Gmail

Limitation: no OAuth project or token lifecycle exists.

Fallback: KLEIO may continue producing a downloadable `.eml` preview through the existing package workspace. The interface must not call it a Gmail draft or sent email.

### Portal assistance

Limitation: no browser extension or provider adapter exists.

Fallback: open the official destination and provide a downloadable package. CAPTCHA, payment, signatures, legal declarations, identity checks, and final submission remain manual.

### Signed-in browser QA

Limitation: automated implementation tools do not possess an artist's authenticated browser session.

Fallback: keep the pull request in draft until a real signed-in artist walkthrough verifies persistence, isolation, mobile behavior, and error recovery.

## Pre-merge checklist

- GitHub verification workflow passes on the final commit.
- Signed-in artist walkthrough completes on a preview deployment.
- Cross-artist and institution-role isolation are manually verified.
- A public HTML opportunity completes research in the preview UI.
- A PDF opportunity displays the manual-review limitation without claiming extraction.
- Refreshing the page preserves session progress.
- Cancel and retry behavior are verified.
- No candidate requirement appears as canonical without an administrative promotion.
- PR remains draft until these checks are recorded.
