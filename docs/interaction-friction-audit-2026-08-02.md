# KLEIO Interaction Friction and Navigation Coherence Audit

Date: 2026-08-02  
Branch: `fix/instagram-oauth-state-and-callback`  
Pull request: `#86`

## Executive summary

The highest-severity verified issue was the Instagram import transition from a long gallery into private artwork review. The branch already contained a strong foundation: persistent selection controls, explicit rights confirmation, a 20-item limit, partial-failure preservation, accessible preview behavior, review-section scrolling, focus transfer, autosaved private drafts, and explicit artist approval before portfolio insertion.

This audit tightened the remaining verified gaps without changing OAuth, Supabase, database, storage, authentication, or external API contracts:

- Added three understandable gallery density modes: Large, Standard, and Compact.
- Moved the density choice to a versioned local preference key.
- Added a persistent three-stage workflow summary: Select works → Review details → Approve for portfolio.
- Added mobile safe-area protection for the sticky selection action.
- Added safe long-gallery rendering containment with `content-visibility` and an intrinsic size fallback.
- Preserved Funding as an Opportunities state rather than a primary navigation destination.

Rendered browser validation is still required before production completion can be claimed. The current environment could inspect and modify GitHub but could not clone or run the repository locally, and the Vercel status remains limited by the account build-rate restriction.

## Severity ledger

### Critical

No critical navigation or data-loss defect was verified in the inspected source after the existing Instagram repair work.

### High

#### 1. Instagram gallery continuation could become visually remote on large accounts

- Route: `/artist-dashboard/import/`
- User goal: Select Instagram works and move into private review without losing context.
- Previous experience: The branch already supplied a sticky continuation surface, but the workflow stages and final portfolio destination were distributed across page copy rather than summarized near the gallery controls.
- Risk: Artists can confuse selecting, preparing, reviewing, and approving as one action.
- Correction now: Added a visible three-stage workflow summary and retained the existing sticky rights-and-review action.
- Files: `components/kleio/artist-import-studio-with-gallery-view.tsx`, `components/kleio/instagram-import-assist.tsx`
- API/state risk: Low. Presentation-only change; existing preparation and approval functions remain untouched.

#### 2. Gallery density did not meet the requested three-mode model

- Route: `/artist-dashboard/import/`
- User goal: Scan small or large Instagram accounts efficiently.
- Previous experience: Large and Compact controls only.
- Risk: Users had no balanced default between detailed inspection and rapid scanning.
- Correction now: Added Large, Standard, and Compact modes with responsive breakpoints and a versioned browser preference.
- File: `components/kleio/artist-import-studio-with-gallery-view.tsx`
- API/state risk: Low. Stores only the density string in localStorage.

#### 3. Mobile navigation is icon-only on both workspaces

- Routes: all artist and institution workspace routes below the mobile breakpoint.
- User goal: Recognize and move between major destinations.
- Current experience: Horizontally scrolling icon-only links. Accessible names exist through `aria-label`, but visual recognition depends on icon familiarity.
- Why it creates friction: New artists and institution users may not confidently distinguish Portfolio, Media Library, Applications, Review Queue, Review Room, Committee, and Shortlist.
- Recommendation: Introduce a labeled mobile navigation pattern, such as a compact current-page selector plus a More sheet, without increasing the persistent header height excessively.
- Files likely involved: `components/kleio/artist-sidebar.tsx`, `components/kleio/sidebar.tsx`
- Risk: Medium because navigation density and active-route behavior must be retested across all viewports.
- Status: Deferred. It should be implemented as a focused navigation change rather than bundled into the protected Instagram repair.

### Medium

#### 4. Import Studio stacks several independent import methods into one long page

- Route: `/artist-dashboard/import/`
- User goal: Choose one import source and complete it.
- Current experience: Instagram, website, device, and Drive/manual import surfaces can all occupy the same vertical document.
- Why it creates friction: The user may scroll past unrelated tools, and completion controls for one method compete with the next method's introduction.
- Recommendation: Use source tabs or an accessible segmented source chooser with one active import workflow at a time. Preserve unfinished drafts when switching.
- Files likely involved: `components/kleio/artist-import-studio-page.tsx`, import-assist components.
- Risk: Medium because source components may hydrate or autosave independently.
- Status: Deferred pending rendered-state testing.

#### 5. Artist information architecture contains adjacent but distinct destinations that require stronger local descriptions

- Routes: Creative Passport, Artist Profile, Portfolio, Media Library.
- Current distinction:
  - Creative Passport: reusable application identity and materials.
  - Artist Profile: public/presentation surface.
  - Portfolio: curated artwork presentation.
  - Media Library: private source assets and records.
- Why it creates friction: The labels are valid, but users can reasonably ask where imported work first goes and which surface is public.
- Recommendation: Keep the routes, preserve deep links, and make each page heading state its privacy and purpose in one line. Use consistent destination language after import and approval.
- Status: Documented for page-level copy review; no route merge recommended.

#### 6. Institution review destinations are dense and may appear overlapping

- Routes: Submissions, Applicant Records, Review Queue, Review Room, Shortlist, Committee.
- Verified distinct goals:
  - Submissions: incoming submission set.
  - Applicant Records: artist/applicant-centric records.
  - Review Queue: assigned or pending review work.
  - Review Room: active evaluation/voting surface.
  - Shortlist: selected candidates.
  - Committee: reviewer coordination and outstanding actions.
- Recommendation: Preserve routes. Add consistent page-level goal statements and cross-links only at state transitions, not as duplicate persistent navigation.
- Status: Preserve architecture; improve contextual transitions in a later focused pass.

### Low

#### 7. Import Studio footer presents three navigation choices after a long workflow

- Route: `/artist-dashboard/import/`
- Current experience: Return to Media Library is primary; Creative Passport and Portfolio are secondary.
- Assessment: Acceptable because the buttons appear after all import surfaces, but the block should not become the only post-approval destination.
- Recommendation: Keep it as a fallback. Continue using item-level approval confirmation to state the exact destination.

## Route and navigation map

### Artist primary navigation

- `/artist-dashboard/` — Overview
- `/artist-dashboard/passport/` — Creative Passport
- `/artist-dashboard/profile/` — Artist Profile
- `/artist-dashboard/opportunities/` — Opportunities
  - `/artist-dashboard/funding/` remains represented as an Opportunities state for active-route matching, not a separate primary navigation item.
- `/artist-dashboard/applications/` — Applications
- `/artist-dashboard/portfolio/` — Portfolio
- `/artist-dashboard/media/` — Media Library
  - `/artist-dashboard/import/` is treated as a Media Library subflow.

### Artist secondary navigation

- `/artist-dashboard/collaborators/` — Artist Matches, currently marked coming soon
- `/artist-dashboard/calendar/` — Calendar
- `/artist-dashboard/messages/` — Messages
- `/artist-dashboard/settings/` — Settings

### Institution primary navigation

- `/dashboard/` — Overview
- `/programs/` — Programs / open-call management
- `/opportunities/submit/` — Submit Opportunity
- `/artists/` — Artist Discovery
- `/submissions/` — Submissions
- `/artists/applicants/` — Applicant Records
- `/review-queue/` — Review Queue
- `/review-room/` — Review Room
- `/shortlist/` — Shortlist
- `/committee/` — Committee
- `/messages/` — Messages
- `/reports/` — Reports
- `/activity-log/` — Activity Log
- `/templates/` — Templates
- `/settings/` — Settings

## Immediate Instagram findings and corrections

### Existing verified behavior retained

- Read-only Instagram connection boundary.
- 20-item selection limit.
- Sticky selection action while the gallery scrolls.
- Required rights confirmation before preparation.
- Selected failures remain selected for retry.
- Prepared records are private drafts.
- Review-section scroll and keyboard focus transfer after successful preparation.
- Accessible live announcements.
- Explicit approval before portfolio insertion.
- Existing OAuth completion relay and popup-close behavior.

### Corrections in this audit

- Three gallery densities: Large, Standard, Compact.
- Standard becomes the balanced default for browsers without a saved preference.
- Preference key: `kleio.instagram.gallery-density.v1`.
- Workflow summary: Select works → Review details → Approve for portfolio.
- Mobile sticky selection surface respects `env(safe-area-inset-bottom)`.
- Gallery cards use `content-visibility: auto` and `contain-intrinsic-size` for long-account rendering without adding a virtualization dependency.

## Files changed in this audit

- `components/kleio/artist-import-studio-with-gallery-view.tsx`
- `docs/interaction-friction-audit-2026-08-02.md`

## APIs and backend systems explicitly left unchanged

- Instagram OAuth permissions and `instagram_business_basic` scope.
- Meta application configuration.
- Supabase secrets and environment variables.
- Authentication providers.
- OAuth state lifecycle.
- `instagram-import` and `instagram-import-core` request/response contracts.
- Callback URLs and completion relay.
- Database schemas, migrations, RLS, and storage policies.
- Google authentication and Drive Picker.
- Website-analysis and opportunity-ingestion APIs.
- Portfolio approval contract.

## Validation status

### Source inspection completed

- Confirmed the rendered route uses `ArtistImportStudioWithGalleryView`.
- Confirmed the actual scrolling container is the Import Studio `<main>` with `overflow-y-auto` inside the fixed-height artist workspace shell.
- Confirmed the selection action is sticky within that scrolling flow.
- Confirmed review focus transfer, live announcements, partial-failure retention, and explicit approval in source.
- Confirmed artist and institution primary navigation definitions.
- Confirmed Funding is not restored as a separate artist primary navigation item.

### Not completed in this environment

- TypeScript, lint, production build, and repository audit scripts after the latest commit.
- Rendered desktop, tablet, and mobile interaction testing.
- Screenshot capture.
- Physical Safari, Firefox, iOS, Android, keyboard-only, and screen-reader testing.
- Fresh live Instagram authorization after the latest frontend commit.

The GitHub commit has no repository workflow run attached. Vercel currently reports one pending status and one build-rate-limit failure. Do not treat either as interaction validation.

## Remaining risks

- CSS selectors for the density layout intentionally target the existing Instagram gallery structure. A future markup refactor should move density directly into the Instagram component rather than retaining wrapper-level selectors.
- The workflow stage strip is informational; it does not yet derive a dynamic current-stage state from the Instagram component.
- Selected thumbnail previews and per-item removal inside the sticky tray remain desirable. The existing gallery checkboxes and Clear Selection action are functional, but a dedicated selected-items expansion would improve confidence for 10–20 selections.
- Mobile icon-only navigation remains the largest verified sitewide navigation-coherence risk outside the Instagram flow.

## Deferred recommendations

1. Move gallery density state into `InstagramImportAssist` when that component is next safely refactored.
2. Add an expandable selected-items preview with thumbnails and individual removal inside the sticky selection surface.
3. Convert Import Studio source methods into progressive disclosure after verifying draft-preservation behavior.
4. Replace icon-only mobile workspace navigation with a labeled compact pattern.
5. Add a reusable post-success component that always communicates: what happened, where it went, and the next action.
6. Run the full route and interaction matrix in Playwright or the Browser plugin before merging.

## Rollback instructions

To roll back only this audit's code change while preserving the existing OAuth and Instagram repair work:

```bash
git revert a03857fb85006d2eb754efa6d5c7c6cc587753a1
```

The documentation commit that adds this file should be reverted separately if required. Do not revert the full PR unless the intention is also to remove the protected Instagram callback and authorization repairs.
