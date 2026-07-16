# KLEIO build audit — July 16, 2026

## Scope

This audit covers the `main` branch, GitHub Pages export configuration, Supabase authentication and persistence, institution messaging, artist and institution signup, and real-world entity autocomplete.

## Verified before this patch

- The institution messenger is connected to Supabase Auth, institution membership, persistent conversations and messages, unread state, Realtime updates, and row-level access rules.
- The public demo path remains separate and explicitly synthetic.
- Supabase contains the core production-oriented schema for profiles, artist profiles, institutions, institution members, calls, applications, reviews, and messaging.
- GitHub Pages deploys a static Next.js export from `main`.
- Search autocomplete already existed for several internal dashboard search surfaces.

## Gap found

- Artist signup ended by creating a local demo session instead of a Supabase user and artist profile.
- Institution signup ended by creating a local demo session instead of a Supabase user and institution record.
- Location fields were plain text.
- Institution lookup used a four-item static datalist rather than a real-world source.
- The deployment workflow did not explicitly inject the Supabase public project configuration or assert that both signup routes exported successfully.

## Implemented in this patch

- Added real email/password registration through Supabase Auth for artist and institution accounts.
- Added persistence into `profiles`, `artist_profiles`, and `institutions`, using existing RLS and onboarding triggers.
- Added confirmation-email recovery so onboarding completes after the user returns from email verification.
- Preserved the synthetic demo onboarding as an explicit optional walkthrough.
- Added accessible, debounced, keyboard-navigable location and institution autocomplete using Photon/OpenStreetMap data.
- Added manual-entry fallback when the external search service is unavailable.
- Added structured provider, place ID, entity type, coordinates, city, region, country, and formatted-address metadata to saved records.
- Added signup route assertions to pull-request CI and GitHub Pages deployment.
- Added a focused RLS performance hardening migration for signup-related tables plus the missing institution-member user index.

## Intentional boundaries

- The build does not claim verified institutions or real users until real accounts are created.
- The public Photon endpoint is suitable for pilot-scale typeahead usage with debounce and caching; it is not treated as a guaranteed production SLA.
- Demo records and walkthroughs remain synthetic and visibly separated from persistent account behavior.
- Institution team messaging becomes useful after owners invite or add additional authenticated institution members.

## Required verification matrix

1. Pull-request checks: TypeScript, ESLint, static build, and critical route exports.
2. Artist signup: account creation, email-confirmation path, artist profile persistence, return-session routing.
3. Institution signup: account creation, institution persistence, search-index trigger, owner messenger context.
4. Autocomplete: minimum-character threshold, debounce, mouse/keyboard selection, screen-reader roles, manual fallback.
5. Messaging: authenticated access, institution isolation, member lookup, direct conversation creation, send, unread, read receipt, and Realtime update.
6. Deployment: successful GitHub Pages build and published `main` commit.
