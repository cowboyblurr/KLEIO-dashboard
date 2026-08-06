# KLEIO Artist Experience Layout, Information Hierarchy, and Usability Audit

**Audit date:** August 6, 2026  
**Source of truth:** `cowboyblurr/KLEIO-dashboard`  
**Base reviewed:** `main` at `cac3fb5a90f79119e81a61c38d08e5a572a79b22`  
**Implementation branch:** `agent/artist-layout-hierarchy-audit`

## Executive summary

The primary issue was not inconsistent spacing. It was inconsistent priority.

Several artist surfaces gave completion guidance, methodology, notifications, import options, decorative introductions, or floating utilities the same or greater visual weight than the artist's actual work. The result was a product that could feel more demanding than helpful even when every individual module was useful.

This implementation establishes a consistent rule:

> The artist's current task leads. Supporting explanation, optional assistance, and secondary status remain available through compact, contextual, progressively disclosed surfaces.

The work removes duplicate priority systems, replaces oversized guidance with a reusable disclosure pattern, moves active records ahead of notifications, restores one primary scroll owner to application preparation, constrains floating controls, and creates utility-first live layouts for Portfolio and Media Library.

No brand redesign, speculative integrations, fake user activity, or unverified submission behavior was introduced.

## Audit method

The review followed the current live and guided-demo route composition rather than judging isolated screenshots.

For each artist-facing surface, the audit identified:

1. The artist's primary goal.
2. The content directly required to complete that goal.
3. Supporting content that should remain secondary.
4. Competing calls to action.
5. Sticky, fixed, pinned, floating, or nested-scroll behavior.
6. Mobile content order and working-width pressure visible in the component structure.
7. Semantic heading, native disclosure, focus, live-region, and DOM-order implications.
8. Shared patterns that could prevent the same hierarchy problem from returning.

A repository regression audit was added at `scripts/audit-artist-layout-hierarchy.mjs` and registered as `npm run audit:artist-layout`.

## Artist-side page inventory

| Surface | Primary artist goal | Main hierarchy finding | Implementation decision |
| --- | --- | --- | --- |
| Artist Dashboard | Understand what needs attention and continue active work | The overview already contained priority, status, and readiness information, but a second readiness widget repeated the same guidance below it | Removed the duplicate readiness layer; retained one command-center hierarchy |
| Creative Passport | Review or edit reusable artist information | The large document-assistance panel appeared before the Passport and visually competed with the working content | Replaced the hero treatment with a compact, closed-by-default optional shortcut |
| Passport biography, statement, practice, disciplines, mediums, themes, history, and documents | Edit the selected Passport category | Category editing remains the primary workspace; document analysis is now optional support rather than the page premise | Preserved the existing category workflow and completion model; reduced competing assistance above it |
| Private Profile Preview | Review the presentation institutions or recipients may see | Edit and portfolio actions appeared in the preview utility bar and again inside the profile presentation | Kept one action group and removed the duplicate set |
| Portfolio | Add, review, edit, search, and remove works | A large decorative onboarding hero repeated the page purpose and pushed artwork controls and existing work downward | Added an artwork-first live workspace with a compact Add artwork action bar, immediate draft queue, editor, and approved works grid |
| Artwork upload and editing | See the selected work and approve reusable metadata | The underlying visual-first editor was strong but sat behind excess introductory content | Preserved the visual editor, optional metadata disclosure, explicit approval, and private-media behavior; moved it closer to the page opening |
| Media Library | Find, filter, analyze, reuse, or archive private material | A large methodology hero appeared before search, filters, and assets | Added a utility-first live workspace; upload is in the page header and privacy rules are collapsed but accessible |
| Import Studio | Upload and analyze an existing PDF | Large availability and deferred-provider cards appeared before the actual upload and review workspace | Led with the active PDF task, reduced availability to compact rows, and moved deferred sources into a disclosure |
| Website, Drive, Instagram, and Pinterest import states | Understand whether a connected source is available | Disabled and deferred options consumed disproportionate space despite not being actionable | Preserved truthful deferred status but removed it from the primary hierarchy |
| Opportunities | Search and evaluate decision-relevant opportunities | The active-filter explanation became a second banner above the search experience | Replaced it with a compact count, horizontally scannable filter chips, and a small Clear action |
| Funding view | Review funding as an opportunity filter/preset | Funding remains a filtered opportunity view and should not create a redundant artist destination | Preserved the current filter architecture; no separate funding page was introduced |
| Applications | Continue drafts and understand current status | Notifications appeared before the artist's applications | Added an applications-first live workspace; notifications are a collapsed supporting section after records |
| Application preparation | Review requirements, write, select works, approve, and prepare the correct handoff | Identity, cover, media import, requirement media, test reset, recipient workflow, and nested scrollers surrounded or preceded the primary workspace | Restored one page-level scroll owner; placed the primary preparation workspace first; converted cover and media import to disclosures; made recipient workflow inline; moved test reset last |
| Requirement attachments | Associate a private source with a specific requirement | This is important but conditional; it should not displace the general preparation workspace for every artist | Kept the exact-requirement workflow after the primary preparation surface and before optional recipient tools |
| Email submission preview and external handoff | Review a truthful draft and explicitly continue outside KLEIO | Existing copy already distinguished preparation from sending, receipt, opening, or tracking | Preserved truthful submission language and explicit approval gates |
| Recipient conversation | Continue an authorized application conversation | Useful after application preparation, but not the first job on the page | Kept it after the primary preparation and material workflows |
| Messages | Reply to authorized conversations and invitations | The invitation trigger floated over the conversation workspace | Constrained the invitation control into the page flow above the inbox |
| Calendar | Understand deadlines and decision windows | Metrics, month view, and deadline list already support the same task and use one scroll surface | Reviewed; no structural change required |
| Settings | Manage profile presentation and artist-controlled discovery | Profile image followed by discovery settings is a coherent task order; no competing fixed surfaces were found | Reviewed; no structural change required |
| Empty, loading, success, and error states in changed surfaces | Understand current state and recover | Some status content previously sat among duplicate priority surfaces | Retained explicit `role="status"`, `role="alert"`, truthful empty states, and clear next actions in the focused components |

## Priority findings

### Critical usability issues corrected

1. **Application preparation had competing persistent surfaces and nested scrolling.**
   The primary workspace now leads within a single page-level scroll region. Supporting cover, upload, recipient, conversation, and reset controls follow the work instead of surrounding it.

2. **The Artist Dashboard repeated readiness and priority information.**
   The secondary readiness widget was removed. The existing overview remains the single command-center hierarchy.

### High-priority hierarchy issues corrected

1. Creative Passport document assistance dominated before Passport work.
2. Applications placed notifications before active records.
3. Portfolio placed a decorative explanation before artwork controls.
4. Media Library placed privacy and methodology before search and assets.
5. Import Studio placed source architecture and deferred options before the active PDF workflow.

### Medium-priority consistency issues corrected

1. Active opportunity filters used a full explanatory banner instead of a compact state row.
2. Private Profile Preview duplicated edit actions.
3. Messages used a floating invitation trigger.
4. Application cover art and media import were presented as persistent bars rather than contextual support.

### Lower-priority refinements retained for later visual QA

1. Confirm final spacing at compact mobile widths with real authenticated content.
2. Confirm long translated labels do not wrap awkwardly in compact action bars.
3. Review real portfolios containing unusually long titles, dense metadata, and more than 100 works.
4. Validate the application preparation order with artists completing email, external portal, and native KLEIO submissions.

## Before-and-after layout logic

### Creative Passport

**Before**

1. Profile context navigation.
2. Large document-completion hero.
3. Passport overview or category editor.

The optional import shortcut framed the page before the artist reached their saved Passport.

**After**

1. Profile context navigation.
2. Compact optional document shortcut, closed by default.
3. Passport overview or category editor.

The capability remains visible without requiring the artist to process its full explanation on every visit.

### Artist Dashboard

**Before**

1. Main priority panel.
2. Application tracker.
3. Workspace status and Passport readiness.
4. Selected works and Assist disclosure.
5. Separate readiness-next-steps widget repeating Passport progress and categories.

**After**

1. Main priority panel.
2. Application tracker.
3. Workspace status.
4. Selected works and Assist disclosure.

One hierarchy now decides what matters.

### Portfolio

**Before**

1. Page header.
2. Large decorative visual-first hero repeating the page's premise.
3. Upload/import actions.
4. Drafts, editor, and approved work.

**After**

1. Page header.
2. Compact Add artwork action bar.
3. Draft queue and visual editor when active.
4. Existing-work editor when active.
5. Searchable approved portfolio.

The page reaches artwork and action controls without requiring a second introduction.

### Media Library

**Before**

1. Page header.
2. Large private-library methodology hero.
3. Upload action and privacy explanation.
4. Search, filters, and media.

**After**

1. Page header with Upload document as the primary action.
2. Collapsed privacy-and-reuse explanation.
3. Search and filters.
4. Media grid or truthful empty state.

### Import Studio

**Before**

1. Large active-method explanation.
2. Two large availability cards.
3. Large deferred-source section with four cards.
4. Actual upload, analysis, and review tools.

**After**

1. Active task: upload a CV or artist document.
2. Compact active-method and stored-document availability rows.
3. Deferred providers in a closed disclosure.
4. Actual upload, analysis, and review tools immediately after.

### Applications

**Before**

1. Page header.
2. Loading/error state.
3. Notifications.
4. Application cards and status history.

**After**

1. Page header and Explore opportunities action.
2. Active and recent applications.
3. Status history behind record-level disclosure.
4. Notifications in a collapsed supporting section.

### Application preparation

**Before**

1. Persistent identity bar.
2. Large cover surface.
3. Persistent media-import bar.
4. Outer scroll region.
5. Practice reset.
6. Requirement attachments.
7. A second internally scrolling preparation workspace.
8. Recipient conversation.
9. Floating recipient-workflow trigger.

**After**

1. Compact identity context.
2. One page-level scroll region.
3. Primary preparation workspace: source, readiness, requirements, written materials, works, preview, approval, and submission action.
4. Exact requirement attachments.
5. Optional media import disclosure.
6. Optional cover context disclosure.
7. Recipient conversation.
8. Inline recipient-workflow action.
9. Practice reset last.

### Messages

**Before**

The invitation trigger floated above the inbox at the bottom-right of the viewport.

**After**

The invitation trigger is part of the Messages page flow and remains available without covering conversation content.

## Shared layout policy introduced

### Supporting information

Use `SupportingTaskDisclosure` when information is:

- useful but not required for every visit;
- explanatory rather than directly editable;
- an optional import, methodology, privacy, or contextual action;
- likely to consume significant vertical space when expanded.

The pattern uses native `<details>` and `<summary>`, visible keyboard focus, a compact summary row, and DOM order that matches visual order.

### Persistent controls

A control may remain persistent only when it is essential throughout the active task and does not materially reduce working space.

For the changed artist surfaces:

- document guidance is not sticky;
- application cover and media import are not persistent banners;
- recipient workflow is inline;
- Messages invitations are inline;
- opportunity filter state remains persistent only as a compact row because it directly affects every visible result.

### Mobile behavior

Changed surfaces use mobile-first stacking and avoid desktop-only sidebars for optional guidance. Secondary explanations are closed by default, controls wrap, filter chips become horizontally scannable at larger breakpoints, and fixed bottom-right controls no longer cover content.

### Accessibility behavior

The implementation preserves or adds:

- native disclosure semantics;
- visible focus states;
- one page-level heading through `WorkspacePageHeader` or the primary imported workspace;
- status and alert roles;
- semantic labels for search/filter groups;
- DOM order matching visual priority;
- explicit button types;
- no reliance on color alone for application status or requirement state.

## Files changed

### Shared pattern and regression protection

- `components/kleio/supporting-task-disclosure.tsx`
- `scripts/audit-artist-layout-hierarchy.mjs`
- `package.json`

### Creative Passport and Dashboard

- `components/kleio/creative-passport-media-panel.tsx`
- `components/kleio/artist-dashboard-view.tsx`

### Applications and preparation

- `components/kleio/focused-artist-applications.tsx`
- `app/artist-dashboard/applications/page.tsx`
- `app/artist-dashboard/applications/prepare/page.tsx`
- `components/kleio/application-submission-cover.tsx`
- `components/kleio/application-media-import-bar.tsx`

### Portfolio and Media Library

- `components/kleio/focused-visual-artist-portfolio-studio.tsx`
- `app/artist-dashboard/portfolio/page.tsx`
- `components/kleio/focused-artist-media-library.tsx`
- `app/artist-dashboard/media/page.tsx`

### Import, Opportunities, Profile, and Messages

- `components/kleio/import-source-hub.tsx`
- `components/kleio/opportunity-filter-visibility-guard.tsx`
- `components/kleio/live-artist-profile-preview.tsx`
- `app/artist-dashboard/messages/page.tsx`

## Regression coverage

`npm run audit:artist-layout` fails when any of the following regressions return:

- a decorative Creative Passport document hero;
- duplicate Dashboard readiness systems;
- notification-first Applications ordering;
- the legacy Portfolio hero on the live route;
- a methodology-first Media Library;
- deferred import providers ahead of the active workflow;
- nested application-preparation scrolling;
- floating recipient or invitation controls on their routes;
- persistent application media-import banners;
- duplicate profile actions;
- a large explanatory active-filter banner.

## Scope boundaries and remaining risks

### Intentionally preserved

- The current Creative Passport completion calculation and tier model were not replaced because they already distinguish minimum use, opportunity readiness, and enrichment rather than treating every optional field as mandatory.
- The production opportunity-card implementation was not broadly rewritten because a separate active opportunity-directory reliability branch exists. This branch changes only the filter-status hierarchy to avoid colliding with that work.
- Calendar and Settings were reviewed but not changed because their current order already follows a coherent primary task and contains no competing floating guidance.
- Existing truthful language around external email clients, artist-reported submission, source verification, and recipient events was preserved.

### Requires real browser and user validation

The source-level implementation and regression audit cannot replace authenticated visual and interaction testing. Before merging to production, validate:

1. Creative Passport overview and every category editor with sparse and complete records.
2. Portfolio with zero works, one draft, many drafts, long metadata, and large libraries.
3. Media Library with images, PDFs, duplicates, OCR-required PDFs, and failed extraction.
4. Applications with no records, many records, long institution names, and unread notifications.
5. Application preparation for native KLEIO, email, external portal, and unknown submission methods.
6. Messages with no invitations, several invitations, long notes, reporting, and the open modal.
7. Compact mobile, standard phone, large phone, tablet portrait, tablet landscape, desktop, and wide desktop.
8. Keyboard-only traversal, screen-reader landmarks, text scaling, reduced motion, focus restoration, refresh, expired sessions, and interrupted uploads.

## Recommended next action

Merge only after the branch passes repository checks and a focused authenticated visual QA confirms that the new hierarchy remains correct with real artist-owned data. The highest-value review sequence is Creative Passport, Portfolio, Applications, application preparation, then mobile Messages.
