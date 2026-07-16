# KLEIO Supabase test-run setup

This repository remains compatible with a static Next.js export. The browser uses the Supabase Auth, PostgREST, and Storage HTTP APIs directly, so no server-only route or service-role key is required.

## 1. Apply the schema

Apply `supabase/migrations/202607160001_kleio_test_run.sql` to the connected **test** Supabase project with the Supabase CLI or SQL editor.

The migration creates:

- Auth-linked profiles and role records.
- Artist profiles and portfolio works.
- Institutions and optional members.
- Open calls and custom questions.
- Applications, answers, selected works, reviews, messages, and status history.
- Row Level Security policies for artist, institution, reviewer, and public access boundaries.
- Storage buckets for portfolio images, institution logos, and private documents.

Run it in a non-production project first. If the project already contains tables with these names, reconcile the existing schema instead of blindly applying the migration.

## 2. Configure the build

Copy `.env.example` to `.env.local` for local development and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Only the public anon key belongs in the client build. Never expose the service-role key.

For GitHub Pages, add both values as GitHub Actions repository variables or secrets and expose them to the `next build` step. For Vercel, add them to the project environment variables.

## 3. Supabase Auth settings

Add the active deployment URLs to Supabase Auth redirect URLs. For the current GitHub Pages export, include the repository base path. Prepare confirmed artist and institution accounts before the live test if email confirmation remains enabled.

The app deliberately shows a confirmation state when signup succeeds without a session. It does not pretend the user is logged in before confirmation.

## 4. Controlled demo accounts

Create test accounts through Supabase Auth rather than committing passwords:

- One institution account with `role=institution` in user metadata.
- One artist account with `role=artist` in user metadata.

The migration trigger creates the matching `profiles` row. Complete onboarding in the UI to create the institution or artist profile.

## 5. Preview fallback

When Supabase variables are absent, the UI uses a clearly labeled **Local preview dataset** stored in the current browser. This fallback exists only for a controlled walkthrough and never claims that records were written to Supabase.

Use the reset function exposed by `resetPreviewData()` in `lib/kleio-live-data.ts` to restore the browser preview dataset.

## 6. Security verification

Before presenting the connected build, verify with separate artist and institution browser sessions:

1. Artist cannot read another artist's application.
2. Artist cannot read `reviews.internal_notes`.
3. Institution cannot read applications for another institution's calls.
4. Public users can read only open calls and their public questions.
5. A message can be inserted only by an authorized application participant.
6. Storage paths begin with the authenticated user ID.
7. No service-role credential appears in the browser bundle or repository.

## 7. Deployment note

GitHub Pages can support this client-side Supabase implementation. If later features require secure server-side actions, administrative account creation, webhooks, or protected service-role operations, deploy the application to Vercel and add server-only endpoints instead of placing privileged logic in the static client.
