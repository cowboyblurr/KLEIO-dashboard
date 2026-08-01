# KLEIO Guided Onboarding — Audit, Architecture, and QA Record

## Scope

This implementation applies the guided onboarding brief to KLEIO's artist and institution signup paths while preserving Supabase authentication, account-role isolation, email-confirmation recovery, and demo/live separation.

## Existing-state audit

### Existing strengths

- Artist and institution signup routes were already separate.
- Live signup already protected role routing and resumed confirmed but incomplete accounts.
- Pending onboarding data was recoverable after email confirmation.
- Artist opportunity-entry signup already had a deliberate lightweight path.
- Demo signup was isolated from production authentication and used synthetic identities.
- KLEIO already had structured discipline options and entity autocomplete.

### Problems addressed

1. **All-at-once form density.** Credentials, location, practice or organization information, and long-form content appeared on one screen.
2. **Premature content requests.** Biography, statement, public description, and mission were requested before users reached a useful workspace.
3. **Limited personalization.** Signup did not capture first objective, opportunity interests, readiness, team shape, workflow, or open-call status.
4. **Weak progress orientation.** Required and optional questions were not clearly separated.
5. **Incomplete downstream use.** Answers did not produce a visible first dashboard action.
6. **Draft risk.** Auth recovery existed, but in-progress page answers were not progressively autosaved.
7. **Password inconsistency.** The legacy full form still described an older minimum while the active KLEIO policy requires 12 characters, complexity, and breach screening.
8. **Schema-option mismatch.** The institution interface needed a grantmaking-organization option, but the production constraint did not permit that value.
9. **Analytics-contract mismatch.** Guided-onboarding events were initially absent from the typed registry and database event allowlist.

## Revised onboarding map

### Artist

1. Account: display name, email, password
2. Location: location and optional website
3. Practice: disciplines and career stage
4. Opportunities: program types and geography — optional
5. Readiness: portfolio readiness and existing materials — optional
6. First objective
7. Review and create

### Institution

1. Account: contact name, email, password
2. Organization: organization name and type
3. Location: location and optional website
4. Team: organization size and review-team size — optional
5. Workflow: current tools and challenges — optional
6. Programs: open-call status and program types — optional
7. First objective
8. Review and create

### Synthetic demo

The preview paths now use the same focused question architecture and reusable controls as live onboarding while remaining isolated from authentication and production records. Demo answers are stored only in a role-specific browser draft and are explicitly presented as synthetic.

### Acquisition exception

Artists arriving from a specific opportunity retain the lightweight account path. This protects conversion and restores the exact opportunity after email confirmation. General artist signup uses the full guided flow.

## Question-to-outcome matrix

| Role | Question | Required | Stored in | Downstream use |
|---|---|---:|---|---|
| Artist | Display name | Yes | `profiles`, `artist_profiles` | Workspace and Passport identity |
| Artist | Location | Yes | `artist_profiles.location`, `location_data` | Geographic relevance |
| Artist | Website | No | `artist_profiles.website_url` | Profile readiness |
| Artist | Disciplines | Yes | `artist_profiles.disciplines` | Passport taxonomy and matching |
| Artist | Career stage | No | `artist_profiles.career_stage` | Eligibility context |
| Artist | Opportunity types | No | `artist_profiles.onboarding_preferences` | Opportunity ordering |
| Artist | Geographic preferences | No | `artist_profiles.onboarding_preferences` | Opportunity ordering |
| Artist | Portfolio readiness | No | `artist_profiles.onboarding_preferences` | Checklist emphasis |
| Artist | Existing materials | No | `artist_profiles.onboarding_preferences` | Checklist prioritization |
| Artist | First objective | Yes | `artist_profiles.onboarding_preferences` | Dashboard recommendation |
| Institution | Contact name | Yes | `profiles`, `institutions` | Workspace owner identity |
| Institution | Organization name/type | Yes | `institutions` | Workspace identity and defaults |
| Institution | Location/website | Location only | `institutions` | Organization settings |
| Institution | Team and reviewer size | No | `institutions.onboarding_preferences` | Permission and workflow guidance |
| Institution | Current workflow/challenges | No | `institutions.onboarding_preferences` | Orientation emphasis |
| Institution | Open-call status/programs | No | `institutions.onboarding_preferences` | Setup versus exploration entry |
| Institution | First objective | Yes | `institutions.onboarding_preferences` | Dashboard recommendation |

## Persistence and recovery

- Passwords are never written to browser draft state.
- Non-sensitive answers autosave to a versioned, role-specific local-storage draft.
- Draft state restores the last valid step after refresh or tab closure.
- Existing pending-onboarding and auth-metadata recovery remains in place for email confirmation.
- User-scoped upserts prevent duplicate artist or institution profile records.
- Demo and live state remain separate.
- Demo hydration completes before autosave begins, preventing restored answers from being overwritten by seed data.
- A localized **Save & exit** action gives users an explicit interruption-safe exit; navigation is delayed long enough for the current browser draft write to complete.

## Accessibility implementation

- Native radio and checkbox inputs remain in the accessibility tree.
- Choice cards use `fieldset` and `legend` grouping.
- Progress exposes current, minimum, maximum, and descriptive text.
- Save status uses a polite live region.
- Validation errors use `role="alert"`.
- Focus states do not depend on color alone.
- Back, skip, edit, dismiss, save-and-exit, and primary actions are keyboard operable in source.
- Skip actions appear only on steps explicitly marked optional.
- Motion respects reduced-motion preferences.
- Primary controls and choice cards use mobile-appropriate touch targets.

Source semantics are implemented, but screen-reader and physical keyboard behavior remain unverified until manual testing is completed.

## Analytics

Non-sensitive events cover step views, completion, skips, validation failures, draft-save failures, resume, confirmation, and final completion. Private answers are not sent in analytics metadata. The TypeScript event registry, safe metadata allowlist, and Supabase `product_events_event_name_check` constraint were updated and verified together.

## Database change

The migration adds non-null JSONB columns with `{}` defaults:

- `artist_profiles.onboarding_preferences`
- `institutions.onboarding_preferences`

It also:

- aligns `institutions_organization_type_check` with the implemented organization-type options by allowing `grantmaking_organization`
- extends the product-event allowlist for guided-onboarding lifecycle events

The columns and revised constraints were executed and verified against `information_schema`. Existing rows remain valid.

## QA completed

- Source audit of signup, auth recovery, password security, role isolation, navigation routes, and persistence
- Database migration execution, column verification, institution-type constraint verification, and analytics-event constraint verification
- Supabase RLS ownership-policy review for `profiles`, `artist_profiles`, and `institutions`
- Supabase security and performance advisor review; returned findings are broader pre-existing project items, not new onboarding findings
- Full-project TypeScript check passed
- Full-project ESLint check passed
- Production static export passed
- Critical authentication and workspace-export audit passed
- Internal navigation audit passed
- User-facing public-copy audit passed
- Zero-finding enforcement passed
- Independent guided-onboarding CI passed dependency installation, lint, typecheck, and production build
- Auth and role-isolation source audit passed
- Opportunity-first acquisition audit passed
- GitHub Pages publishing audit passed
- Route-target review against current artist and institution navigation
- Preservation of the opportunity-first lightweight artist path
- Guided synthetic demo parity in English and Spanish
- Primary Vercel preview reached **Ready** status

## QA still required before merge

The Browser plugin was not available in the execution environment, and the container could not resolve external hosts, so rendered Playwright evidence could not be captured from the Vercel preview. Do not mark the following complete until manually tested:

- Desktop Chrome onboarding walkthroughs for both roles
- Desktop Safari and Firefox walkthroughs
- Physical iPhone Safari and Android Chrome tests
- Tablet and small-mobile visual comparison
- Keyboard-only completion of both role paths
- VoiceOver and NVDA walkthroughs
- Refresh, tab closure, expired session, offline, multiple-tab, and email-confirmation interruption tests
- Visual inspection for clipping, browser overlays, console errors, mobile keyboard obstruction, and safe-area behavior

## Release gate

The branch is build-clean and has a ready preview, but it remains a draft. Do not merge solely because automated checks passed. Merge only after the browser, physical-device, accessibility, and interruption scenarios above have actual recorded results. Untested environments must remain labeled **not tested**.
