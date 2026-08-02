# KLEIO Gemini website intelligence — implementation and impact report

## Inspection baseline

- Repository: `cowboyblurr/KLEIO-dashboard`
- Base branch: `main`
- Base commit inspected: `348607971524677c8e05aa303cef148d6a740aa5`
- Working branch: `feature/gemini-website-intelligence`
- Supabase project: `trekynurdgxgtaaqqtyq`
- Live website gateway/core at inspection: `analyze-artist-website` v17 and `analyze-artist-website-core` v10
- Live KLEIO Assist at inspection: `kleio-assist` v17
- Live Instagram gateway/core at inspection: `instagram-import` v32 and `instagram-import-core` v3

The deployed function versions were newer than the version numbers stated in open PR descriptions. Deployed source and latest `main` were therefore treated as authoritative.

## Impact map

### Files changed

- `supabase/functions/organize-website-evidence/index.ts`
- `supabase/functions/organize-website-evidence/index.test.ts`
- `supabase/migrations/20260802153000_gemini_website_intelligence.sql`
- `components/kleio/website-organization-assist.tsx`
- `components/kleio/artist-import-studio-page.tsx`
- `scripts/audit-gemini-website-intelligence.mjs`
- `package.json`
- this report

### Existing functions reused

- `analyze-artist-website` remains the deterministic public gateway.
- `analyze-artist-website-core` remains the crawler/collector.
- Existing Cloudflare-backed `kleio-assist` actions remain unchanged.
- The new organizer consumes only a completed, owner-scoped website-import session.

### Existing tables reused

- `artist_website_import_sessions`
- `artist_import_sources`
- `artist_extraction_jobs`
- `artist_import_proposals`
- `artist_ai_usage_events`

### Additive database changes

`artist_extraction_jobs` gains provider/run metadata, a website-session link, stable input hash, usage metadata and latency. `artist_ai_usage_events` gains the `organize_website_evidence` action. No table, column or approved artist record is removed or renamed.

### Open PR overlap

- PR #85 overlaps `components/kleio/artist-import-studio-page.tsx` and `package.json`, and also contains website gateway/core work. Rebase and resolve by preserving PR #85's source hub while retaining `<WebsiteOrganizationAssist />` immediately after `<WebsiteImportAssist />`. Do not replace the live v17/v10 website functions with the older versions described in the PR.
- PR #86 affects the Instagram selection experience and Instagram function files. This implementation does not edit any Instagram source, permission, OAuth or function file.

### Regression risks

- Merge conflict with PR #85 in the Import Studio page and package scripts.
- Runtime dependence on the additive migration being applied before the new function is deployed.
- Gemini structured-output compatibility and configured model availability.
- Large public websites remain bounded by the deterministic collector and evidence-package limits.
- The separate review panel discovers the latest website session by owner-scoped polling; it does not alter Website Import Assist state.

### Deployment targets

- Migration `20260802153000_gemini_website_intelligence.sql`
- New JWT-protected Edge Function `organize-website-evidence`

### Functions intentionally untouched

- `analyze-artist-website`
- `analyze-artist-website-core`
- `kleio-assist`
- `extract-artist-materials`
- `instagram-import`
- `instagram-import-core`
- all authentication functions

## Architecture decision

A separate authenticated organizer function is used rather than expanding `kleio-assist`. The existing `kleio-assist` implementation owns visual-practice analysis and evidence-grounded drafting through Cloudflare. Adding a large website-classification schema, Gemini-specific request behavior, caching and proposal persistence to that function would increase regression risk to working actions. The new function reuses KLEIO's database, authentication, RLS and proposal architecture instead of creating a parallel Passport system.

Pipeline:

`deterministic scan → owner-scoped session → sanitized public evidence package → Gemini structured output → server validation → existing import proposals → artist decision`

## Security and privacy controls

- `GEMINI_API_KEY` and `GEMINI_MODEL` are read only with `Deno.env.get`.
- The key is sent only in the server-side `x-goog-api-key` header and never returned, stored or logged.
- Supabase JWT authentication and artist-role checks are enforced.
- Website sessions, jobs, proposals and usage events are scoped to the authenticated artist.
- Website content is explicitly treated as untrusted evidence, separated from the system instruction and delimited in the user payload.
- Source page refs, URLs, excerpts and image refs are validated against collected evidence before proposals are saved.
- Gemini receives only public content already stored in the website-import session. Private Media Library, Drive, application, institution and reviewer content is not loaded.
- Invalid structured output cannot be persisted as usable proposals.
- Deterministic scan data remains available when Gemini is absent, unavailable, timed out or rate-limited.

## Artist control

The review panel supports Accept, Edit, Reject, Defer and View source. Decisions update existing private proposal records only. The implementation does not automatically publish, submit, create portfolio works or overwrite approved Creative Passport data.

## Validation completed in this environment

- Inspected current repository branches, open PRs and relevant main-branch source.
- Inspected deployed Edge Function versions and deployed source provenance.
- Inspected live table definitions, constraints and RLS policies.
- Validated the migration inside a PostgreSQL transaction and rolled it back.
- TypeScript transpilation sanity checks passed for the new Edge Function, Deno test file and React components before branch publication.
- `node --check scripts/audit-gemini-website-intelligence.mjs` passed before branch publication.
- The focused audit script passed against the staged files before branch publication.

## Validation not completed

- Full repository `pnpm typecheck`, `pnpm lint` and `pnpm build` could not run because the repository could not be cloned into the execution container.
- Deno unit tests were authored but not executed because Deno is not installed in the execution container.
- No real Gemini request was made and no API key was exposed.
- The Supabase migration was not applied.
- The new Edge Function was not deployed.
- No authenticated browser, Safari, Firefox, iPhone/iOS, Android, keyboard-only, screen-reader or physical-device test was completed.
- The supplied Sari Majander websites were not run through the new organizer because deployment and authenticated test access were intentionally withheld until repository checks pass.

## Required configuration

Set private Edge Function secrets:

- `GEMINI_API_KEY`
- `GEMINI_MODEL=gemini-3.6-flash`

Optional bounded controls:

- `KLEIO_WEBSITE_AI_DAILY_LIMIT` (default 3)
- `KLEIO_WEBSITE_AI_SESSION_LIMIT` (default 2)

## Rollback

1. Do not deploy, or remove the `organize-website-evidence` function if deployed.
2. Remove `<WebsiteOrganizationAssist />` from the Import Studio page.
3. Revert the feature branch/PR.
4. The additive columns may remain harmlessly. If schema rollback is required, first confirm no website organizer jobs depend on them, then remove only the columns and indexes introduced by the migration and restore the previous `artist_ai_usage_events_action_check` constraint.
5. No deterministic website, Cloudflare AI, Drive, device or Instagram function needs rollback because none was changed.

## Current release recommendation

**Not ready.** The implementation is isolated and reviewable, but it must remain a draft until the full repository checks, migration review, Deno tests, controlled Gemini smoke test, authenticated browser flow and PR #85 conflict resolution are completed.