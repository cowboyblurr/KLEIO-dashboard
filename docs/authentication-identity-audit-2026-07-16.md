# KLEIO Authentication and Identity Audit — July 16, 2026

## Scope

Audit of signup, authentication, onboarding, role routing, dashboard identity, browser persistence, Supabase ownership, Row Level Security, and synthetic-data isolation for artist and institution accounts.

## Issues found

1. The default artist dashboard loaded `DEMO_ARTIST_ID` and the fixed `amina-el-badri` profile rather than the authenticated artist.
2. The default institution dashboard calculated cards and queues from the global synthetic analytics dataset.
3. Supabase account sessions were mirrored into the same browser key used by preview sessions without clearing the connected preview dataset during account changes.
4. Authentication accepted `user_metadata.role` as a fallback when a database profile was missing.
5. Signup redirected real accounts into legacy synthetic overview routes.
6. Artist and institution sidebars displayed fixed demo people and organizations.
7. Preview reads fell back to the first synthetic artist or institution when a unique preview account had no record.
8. The institution table had a broad public-read policy exposing complete institution rows instead of only public call attribution.
9. Artist application updates were not limited to drafts.
10. Public `SECURITY DEFINER` helper functions were executable by anonymous clients.
11. Onboarding completion was not tied to successful creation of the role-specific artist or institution record.
12. Institution ownership membership was not guaranteed as part of institution creation.

## Changes made

### Application

- Supabase `profiles` rows are now required and authoritative for role, display name, email, and onboarding state.
- Real account login no longer trusts user-editable metadata as authorization fallback.
- Sign-in, signup, logout, and preview-role changes clear stale browser identity and preview workflow data.
- Artist accounts route to `/artist-dashboard/connected/`.
- Institution accounts route to `/dashboard/connected/`.
- Added connected artist and institution overview pages with neutral loading, current-account metrics, and intentional empty states.
- Replaced fixed artist and institution identities in the primary sidebars with the active session and connected institution record.
- AuthGate now enforces role boundaries and sends incomplete accounts back to the appropriate onboarding flow.
- Synthetic shortcuts remain available only when Supabase is not configured.

### Supabase

- Applied the existing base test-run schema to the live KLEIO project before this audit.
- Added onboarding triggers so an account is marked complete only after its `artist_profiles` or `institutions` record exists.
- Added automatic owner membership for institution records.
- Removed anonymous execution from authorization helper functions and removed all client execution from the auth-user trigger function.
- Restricted institution reads to authenticated owners or active members.
- Made profile role immutable through client updates.
- Restricted artist application updates to draft-origin workflows.
- Changed the institution-logo bucket from public listing to authenticated reads.
- Preserved RLS ownership checks for portfolios, calls, applications, answers, reviews, messages, status history, and storage paths.

## Validation performed

- Confirmed the Supabase project is active and the schema tables exist.
- Confirmed the project contained no pre-existing auth users or workflow records before testing.
- Queried policies and function grants after migration.
- Ran the Supabase security advisor. Anonymous `SECURITY DEFINER` warnings and the public bucket listing warning were removed. Three signed-in helper-function warnings remain because the current public-schema RLS policies call those boolean authorization helpers; moving them to a non-exposed schema is the next hardening step.
- GitHub Actions `Validate KLEIO Connected Workflow` passed on commit `05e0ad7392001e4c1a59f514d04d35c8009689d8`.
- The pull request remains open and mergeable.

## Remaining verification required before calling the audit complete

- Create Artist A, Artist B, Institution A, and Institution B through the deployed browser UI.
- Complete both onboarding flows with email confirmation behavior matching production settings.
- Verify refresh, logout, account switching, direct URL entry, and role mismatch behavior in isolated browser sessions.
- Submit an application from Artist A to Institution A and verify Artist B and Institution B cannot read it.
- Verify institution members can access only their institution and that non-members cannot guess record IDs.
- Confirm the deployed GitHub Pages environment has the Supabase URL and publishable key and exports both connected overview routes.

The code, database migrations, and static build now address the identified system-level causes. Completion still requires the four-account browser walkthrough; successful compilation alone is not treated as proof of end-to-end isolation.
