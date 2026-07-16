# KLEIO Production-Site Audit

**Date:** July 16, 2026  
**Repository:** `cowboyblurr/KLEIO-dashboard`  
**Scope:** public entry points, artist workspace, institution workspace, navigation connectivity, demo honesty, responsive behavior, accessibility, and static-export verification.

## Executive assessment

KLEIO already had a strong recent connectivity pass: canonical artist, institution, program, opportunity, and submission records were linked; core institution routes were included in Pages export checks; and demo copy was made less staged. This pass focused on remaining production-facing gaps rather than repeating that work.

The highest-impact gaps found were:

1. Institution and artist shells forced desktop minimum widths and horizontal page scrolling at mobile sizes.
2. The institution sidebar exposed controls that looked interactive but performed no action.
3. The public preview login relied on placeholders instead of labels and exposed advanced role shortcuts intended for development/demo use.
4. Public pages lacked connected privacy, preview-terms, and contact pathways.
5. Pull requests had no automated lint, type-check, and static-export gate.

## Current site map

### Production-facing public routes

| Route | Audience | Purpose | Status / action |
|---|---|---|---|
| `/` | Public | Canonical homepage and role entry point | Retained; preview access clarified and trust links added |
| `/about/` | Public | Product explanation | Retained |
| `/manifesto/` | Public | Artist-centered principles | Retained |
| `/journal/` | Public | Field notes / editorial context | Retained |
| `/privacy/` | Public | Honest explanation of current preview data behavior | Added |
| `/terms/` | Public | Plain-language evaluation-preview terms | Added |
| `/contact/` | Public | Role-based artist and institution pathways | Added without inventing a live support channel |
| `/signup/artist/` | Artists | Preview Creative Passport intake | Retained; must not be represented as production account creation |
| `/signup/institution/` | Institutions | Preview institution intake | Retained; must not be represented as production account creation |

### Controlled preview and demo routes

| Route | Audience | Purpose | Classification |
|---|---|---|---|
| `/demo/` | Prospective partners | Guided product demonstration | Demo-only |
| `/dashboard/` | Institution preview | Institution overview | Controlled preview / demo |
| `/programs/` | Institution preview | Program workspace | Controlled preview / demo |
| `/programs/new/` | Institution preview | Open-call/program setup | Controlled preview; no production backend |
| `/programs/[id]/` | Institution preview | Program detail | Synthetic entity detail |
| `/submissions/` | Institution preview | Submission review list | Controlled preview / demo |
| `/submissions/[id]/` | Institution preview | Submission detail | Synthetic entity detail |
| `/artists/` | Institution preview | Artist records | Controlled preview / demo |
| `/artists/[username]/` | Institution preview | Institution-facing artist record | Synthetic entity detail |
| `/artist/[username]/` | Public/demo | Public artist profile | Synthetic profile unless explicitly verified |
| `/institution/[username]/` | Public/demo | Institution profile | Synthetic profile unless explicitly verified |
| `/review-queue/` | Institution preview | Review assignments and readiness | Controlled preview / demo |
| `/review-room/` | Institution preview | Structured review | Controlled preview / demo |
| `/shortlist/` | Institution preview | Shortlist workflow | Controlled preview / demo |
| `/committee/` | Institution preview | Reviewer/committee coordination | Controlled preview / demo |
| `/messages/` | Institution preview | Applicant and reviewer communication | Local demo messaging only |
| `/reports/` | Institution preview | Decision/report preparation | Export remains preview-only |
| `/activity-log/` | Institution preview | Preserved activity history | Synthetic activity |
| `/templates/` | Institution preview | Reusable workflow templates | Preview-only creation state |
| `/settings/` | Institution preview | Workspace/account settings | Preview state |
| `/collaborator-dashboard/` | Reviewer preview | Scoped reviewer workspace | Controlled preview / demo |
| `/artist-dashboard/` | Artist preview | Artist overview | Controlled preview / demo |
| `/artist-dashboard/passport/` | Artist preview | Creative Passport | Controlled preview / local state |
| `/artist-dashboard/opportunities/` | Artist preview | Opportunity directory | Synthetic structured opportunities |
| `/artist-dashboard/opportunities/[id]/` | Artist preview | Opportunity detail/readiness | Synthetic entity detail |
| `/artist-dashboard/applications/` | Artist preview | Application tracking | Synthetic/local state |
| `/artist-dashboard/portfolio/` | Artist preview | Portfolio materials | Controlled preview / local state |
| `/artist-dashboard/funding/` | Artist preview | Funding overview | Synthetic opportunities |
| `/artist-dashboard/calendar/` | Artist preview | Deadlines and planning | Preview-only |
| `/artist-dashboard/messages/` | Artist preview | Artist communications | Preview-only |
| `/artist-dashboard/insights/` | Artist preview | Derived readiness analytics | Synthetic/derived preview data |
| `/artist-dashboard/settings/` | Artist preview | Artist settings | Preview state |

### Legacy, duplicate, placeholder, and internal routes

| Route | Classification | Action |
|---|---|---|
| `/landing/` | Legacy duplicate of `/` | Kept for old links; should become a redirect when deployment architecture permits |
| `/artist-dashboard/collaborators/` | Placeholder / coming soon | Kept clearly labeled; should not imply live matching |
| Advanced homepage role shortcuts | Internal/development control | Removed from the production homepage |

No intentionally broken route was retained. Dynamic entity pages remain dependent on the repository's static parameter list.

## Navigation audit

### Issues discovered and resolved

- **Dead desktop collapse control:** the institution sidebar collapse button had no handler. It now collapses and expands with an accurate accessible label.
- **Dead account control:** the institution user card looked like a menu but performed no action. It now links to settings.
- **Dead institution switcher:** the institution card looked like a switcher but performed no action. It now opens the institution profile.
- **Nested active-state failure:** institution navigation required an exact pathname, so detail routes did not retain their parent active state. Nested routes now use prefix matching while dashboard remains exact.
- **Artist profile island:** the artist identity card had no route. It now opens the Creative Passport.
- **Mobile navigation failure:** both private shells forced large minimum widths. Dedicated mobile navigation is now available and the shells use flexible, internally scrollable content regions.
- **Missing trust pathways:** public footers now connect Privacy, Preview Terms, Contact, and About.
- **Misleading homepage controls:** advanced role shortcuts were removed from the ordinary homepage.
- **Form accessibility:** preview credentials now use a semantic form, associated labels, autocomplete hints, focus states, error relationships, and an assertive error announcement.
- **Keyboard bypass:** a global skip link and stable `#main-content` targets were added.

### Remaining navigation limitations

- `/landing/` renders the canonical homepage instead of issuing an HTTP redirect because the project is a static export.
- Mobile verification still requires rendered-browser testing at representative widths after the PR build succeeds.
- Some deep preview pages may contain local page-specific tables that need individual horizontal-scroll or stacked-card treatment even though the shell no longer forces desktop width.

## Changes implemented

- Added responsive institution and artist mobile navigation.
- Removed fixed desktop minimum widths from both workspace shells.
- Made institution sidebar collapse functional.
- Connected institution account and organization cards to real destinations.
- Connected the artist identity card to Creative Passport.
- Corrected nested institution active states.
- Rebuilt preview login as an accessible semantic form.
- Removed homepage developer-style role shortcuts.
- Added `/privacy/`, `/terms/`, and `/contact/`.
- Added public trust-navigation footers.
- Removed `v0.app` generator metadata from the production document metadata.
- Added a global skip-to-content link and focusable content targets.
- Expanded GitHub Pages static-export route assertions.
- Added pull-request lint, TypeScript, build, and critical-route verification.

## Remaining infrastructure-dependent work

| Requirement | Why it remains | Next implementation step |
|---|---|---|
| Production authentication | Current access is preview authentication | Select auth provider, define artist/institution/reviewer roles, and replace local preview sessions |
| Database and persistence | Current records are synthetic/local | Define production schema, migrations, tenancy, audit history, and backup policy |
| File storage | Portfolio/import flows cannot safely store real files | Add permissioned object storage, validation, virus scanning, retention, and deletion |
| Email and invitations | Preview actions do not deliver messages | Add transactional email, invitation tokens, bounce handling, and delivery logs |
| Real messaging | Current messaging remains local/demo | Add scoped threads, authorization, notifications, moderation, and retention |
| External opportunity data | Opportunity directory uses structured synthetic data | Approve sources, attribution, refresh cadence, and ingestion quality controls |
| Final legal policy | Current pages describe preview behavior, not final legal terms | Complete legal review before accepting real personal or institutional data |
| Production support | No verified support address or SLA was provided | Establish support ownership, channel, response target, and escalation process |
| Payment/billing | No production billing exists | Confirm pricing and pilot contract model before adding billing infrastructure |
| Production analytics | Existing analytics do not establish real-user traction | Define consent, events, activation metrics, retention, and institutional reporting |

## Verification checklist

| Check | Status |
|---|---|
| Major navigation configuration reviewed | Passed |
| Homepage and public entry points reviewed | Passed |
| Institution and artist shell behavior reviewed | Passed |
| Visually interactive sidebar controls reviewed | Passed for shared sidebars |
| Internal route export assertions expanded | Passed in workflow configuration; pending PR execution |
| Production/demo distinction reviewed | Passed with limitation: all private workspaces remain controlled previews |
| Desktop layout source review | Passed |
| Tablet/mobile shell source review | Passed; rendered-browser check pending |
| Keyboard navigation fundamentals | Passed with limitation: full route-by-route browser traversal pending |
| Console errors | Not available until rendered-browser execution |
| Production build | Pending GitHub Actions |
| Type-check | Pending GitHub Actions |
| Lint | Pending GitHub Actions |
| Automated route checks | Pending GitHub Actions |
| Existing approved functionality preserved | Passed by source review; final confirmation pending build |

## Final assessment

- **Production-ready now:** public positioning pages, honest preview entry language, connected public trust navigation, and static public route architecture.
- **Ready for a controlled pilot after infrastructure:** institution and artist workflows as product demonstrations and structured pilot specifications.
- **Demo-only:** authentication, records, messaging, export actions, application submission, reviewer invitations, opportunity recommendations, and analytics derived from synthetic data.
- **Highest-risk unresolved issue:** accepting real artist or institution information before authentication, authorization, storage, legal, and retention controls exist.
- **Next highest-leverage development task:** implement real authentication plus persistent artist and institution profiles behind a controlled invite-only pilot, while preserving the current demo as a clearly separate synthetic environment.
