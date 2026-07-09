# KLEIO / Kleira Pilot-Readiness Audit

Branch: `pilot-readiness-supabase-foundation`
Audit objective: move the current demo toward a late-August pilot rehearsal without redesigning the product or polishing unrelated UI.

## Pilot rehearsal target

The first real saved loop must be:

1. Institution creates one open call.
2. Artist creates or updates a Creative Passport.
3. Artist applies to that open call.
4. Application appears in the institution Review Queue.
5. Reviewer opens assigned application, scores rubric criteria, writes notes, and submits review.
6. Committee moves applicant through decision state: needs discussion, pending vote, shortlisted, accepted, or declined.
7. Report draft reflects real saved program, application, review, and activity history.

## Audit standard

Every visible page must support at least one of these outcomes:

- Artist intake
- Reviewer action
- Institution clarity
- Committee decision-making
- Report generation

Pages that do not support those outcomes should be marked as demo-supporting or deferred for pilot one.

---

## Route audit

### `/`

**Classification:** DEMO-SUPPORTING  
**Role served:** Public, artist prospect, institution prospect  
**Real job this page must help complete:** Explain Kleira clearly and route users to artist signup, institution signup, or product preview.  
**Current state:** Public landing page with correct route separation from the institution dashboard.  
**Pilot gap:** Not part of the saved workflow, but must not overclaim production auth, live integrations, or verified institutions.  
**Required pilot action:** Keep as public front door; ensure pilot/disclaimer language is honest.  
**Defer:** Any public marketplace, broad marketing expansion, or institution directory.

### `/signup/artist/`

**Classification:** PILOT-CRITICAL  
**Role served:** Artist / applicant  
**Real job this page must help complete:** Create the artist profile / Creative Passport that reduces application stress and becomes the source for applications.  
**Current state:** Multi-step onboarding with Import Assist and review-before-create behavior. Currently demo-auth based and not persisted to a database.  
**Pilot gap:** Needs to create a real authenticated user profile and a saved `artist_profiles` record.  
**Required pilot action:** Connect form fields to Supabase; save artist basics, bio, statement, mediums, themes, links, and readiness/completeness metadata.  
**Defer:** Full social profile, public discovery, complex verification, and advanced AI identity features.

### `/signup/institution/`

**Classification:** PILOT-CRITICAL  
**Role served:** Institution admin  
**Real job this page must help complete:** Create or prepare an institution workspace for one pilot institution.  
**Current state:** Demo onboarding component.  
**Pilot gap:** Needs to save `institutions` and `institution_members` records or be replaced by manual seed setup for the first controlled pilot.  
**Required pilot action:** For pilot one, allow admin to create a basic institution profile or document that the pilot institution is seeded manually.  
**Defer:** Multi-tenant self-serve onboarding, billing, advanced team permissions.

### `/artist-dashboard/`

**Classification:** PILOT-CRITICAL  
**Role served:** Artist  
**Real job this page must help complete:** Show the artist what is ready, missing, due, submitted, and reusable.  
**Current state:** Dashboard overview using demo artist data and analytics.  
**Pilot gap:** Needs to read saved artist profile, applications, and readiness state.  
**Required pilot action:** Connect dashboard summary to Supabase after passport/application persistence exists.  
**Defer:** Advanced recommendations and broad community/collaboration widgets.

### `/artist-dashboard/passport/`

**Classification:** PILOT-CRITICAL  
**Role served:** Artist  
**Real job this page must help complete:** Manage reusable artist profile, materials, sharing/privacy cues, and application readiness.  
**Current state:** Strong visual/readiness view using static demo data.  
**Pilot gap:** Needs edit/save behavior and real field persistence.  
**Required pilot action:** Add editable passport sections backed by `artist_profiles`; calculate material readiness against open-call requirements.  
**Defer:** Public artist marketplace, verified credentials, complex ownership layer.

### `/artist-dashboard/applications/`

**Classification:** PILOT-CRITICAL  
**Role served:** Artist  
**Real job this page must help complete:** Track drafts, submitted applications, missing materials, and decision status.  
**Current state:** Demo application table and next-action cards.  
**Pilot gap:** Needs to read real `applications` rows and reflect status changes from institution/reviewer actions.  
**Required pilot action:** Connect to Supabase application records after `/apply/[publicSlug]/` exists.  
**Defer:** Full calendar backend and complex opportunity tracking.

### `/artist-dashboard/opportunities/`

**Classification:** DEMO-SUPPORTING  
**Role served:** Artist  
**Real job this page must help complete:** Show artist-side value: opportunities, readiness, missing materials, and draft preparation from Creative Passport.  
**Current state:** Useful demo of artist ease and draft wizard.  
**Pilot gap:** Not required for a single institution pilot unless artist acquisition needs a softer entry point.  
**Required pilot action:** Keep as demo-supporting; do not build full backend before the direct application loop works.  
**Defer:** Live scraping, full opportunity directory backend, advanced matching, payments.

### `/dashboard/`

**Classification:** PILOT-CRITICAL  
**Role served:** Institution admin  
**Real job this page must help complete:** Show current review-cycle health: applications, incomplete materials, reviewer progress, decision-ready items, and next actions.  
**Current state:** Strong overview using synthetic analytics.  
**Pilot gap:** Needs to read from real programs, applications, reviewer assignments, reviews, and activity logs.  
**Required pilot action:** Connect metrics to Supabase after the real workflow tables are populated.  
**Defer:** Decorative charts and analytics not tied to workflow action.

### `/programs/`

**Classification:** PILOT-CRITICAL  
**Role served:** Institution admin  
**Real job this page must help complete:** View and manage open calls/program cycles.  
**Current state:** Program list and workflow map using demo records.  
**Pilot gap:** Needs to read real `programs` rows.  
**Required pilot action:** Connect list to saved programs and show public application link for open programs.  
**Defer:** Multi-program analytics beyond the pilot cycle.

### `/programs/new/`

**Classification:** PILOT-CRITICAL  
**Role served:** Institution admin  
**Real job this page must help complete:** Create and publish one real open call with required materials, application questions, rubric, dates, and reviewer coverage.  
**Current state:** Good workflow preview; publish is local UI state only.  
**Pilot gap:** Needs a real form and insert/update into `programs`.  
**Required pilot action:** Save title, description, eligibility, required materials, application questions, rubric, dates, status, and `public_slug`.  
**Defer:** Complex custom form builder, payment, branding modules, automation.

### `/submissions/`

**Classification:** PILOT-CRITICAL  
**Role served:** Institution admin  
**Real job this page must help complete:** Search and inspect submitted applications across programs.  
**Current state:** Demo table from synthetic submissions.  
**Pilot gap:** Needs real submitted applications from Supabase.  
**Required pilot action:** Read `applications` with related artist profile and program.  
**Defer:** Advanced saved views and bulk operations.

### `/artists/`

**Classification:** PILOT-CRITICAL  
**Role served:** Institution admin / reviewer  
**Real job this page must help complete:** View artist records attached to applications.  
**Current state:** Demo artist directory.  
**Pilot gap:** Needs scoped access to artist profiles that submitted to the institution's program.  
**Required pilot action:** Read artist profiles through application relationships, not as a public unrestricted directory.  
**Defer:** Open public artist discovery.

### `/review-queue/`

**Classification:** PILOT-CRITICAL  
**Role served:** Institution admin  
**Real job this page must help complete:** Receive applications, resolve missing materials, assign/review progress, and move records toward Review Room.  
**Current state:** Strong demo queue and applicant drawer; uses static analytics.  
**Pilot gap:** Needs real applications, reviewer progress, status updates, and activity logging.  
**Required pilot action:** Connect queue to `applications`, `reviewer_assignments`, and `reviews`; add actions for status movement and missing-material tracking.  
**Defer:** Fully automated messaging.

### `/collaborator-dashboard/`

**Classification:** PILOT-CRITICAL  
**Role served:** Reviewer / guest juror / collaborator  
**Real job this page must help complete:** Give a scoped reviewer seat: assigned, in review, submitted, needs discussion.  
**Current state:** Strong role-specific dashboard with demo analytics.  
**Pilot gap:** Needs real reviewer assignments and review completion state.  
**Required pilot action:** Read from `reviewer_assignments` scoped to the authenticated reviewer.  
**Defer:** Complex reviewer permissions beyond program/application scope.

### `/collaborator-dashboard/review-queue/`

**Classification:** PILOT-CRITICAL  
**Role served:** Reviewer  
**Real job this page must help complete:** Reviewer reads assigned materials, scores rubric, writes comments, saves draft, and submits review.  
**Current state:** Pilot-critical UI exists, but notes are read-only and save/submit/recommendation buttons are disabled demo actions.  
**Pilot gap:** Reviewer cannot yet complete a real review. This is a top blocker.  
**Required pilot action:** Enable rubric score inputs, editable notes, recommendation selection, save draft, submit review, and assignment status update.  
**Defer:** Advanced reviewer messaging and conflict-of-interest workflows.

### `/review-room/`

**Classification:** PILOT-CRITICAL  
**Role served:** Committee / institution admin  
**Real job this page must help complete:** Compare applicants with program context, reviewer progress, readiness, and decision movement.  
**Current state:** Strong committee narrative using demo data.  
**Pilot gap:** Needs working decision movement and persisted status changes.  
**Required pilot action:** Add actions to move applications to `needs_discussion`, `pending_vote`, `shortlisted`, `accepted`, or `declined`; write activity log entries.  
**Defer:** Advanced voting rules and multi-round committee workflows.

### `/shortlist/`

**Classification:** PILOT-CRITICAL  
**Role served:** Committee / institution admin  
**Real job this page must help complete:** View and manage shortlisted applicants.  
**Current state:** Likely demo-state based; verify during implementation.  
**Pilot gap:** Must reflect real applications with `shortlisted`, `accepted`, or `declined` statuses.  
**Required pilot action:** Connect to `applications` status and activity history.  
**Defer:** Public winner announcements and external publishing.

### `/committee/`

**Classification:** PILOT-CRITICAL  
**Role served:** Institution admin / committee manager  
**Real job this page must help complete:** Assign reviewers, see reviewer completion, manage pending votes, and coordinate committee follow-up.  
**Current state:** Strong demo page with reviewer access and invite flow.  
**Pilot gap:** Needs real institution members, reviewer assignments, and pending vote status.  
**Required pilot action:** Connect reviewer/team lists to `institution_members`, `reviewer_assignments`, and `reviews`.  
**Defer:** Full invitation email system; manual seed reviewers if needed.

### `/messages/`

**Classification:** DEMO-SUPPORTING  
**Role served:** Institution admin, reviewer, artist  
**Real job this page must help complete:** Handle missing-material requests and reviewer reminders.  
**Current state:** Demo messaging.  
**Pilot gap:** Full messaging backend is not necessary for pilot one.  
**Required pilot action:** Keep as secondary; optionally replace with logged draft actions or simple manual email copy.  
**Defer:** Full inbox, automated sends, notification system.

### `/activity-log/`

**Classification:** PILOT-CRITICAL  
**Role served:** Institution admin / committee  
**Real job this page must help complete:** Preserve institutional memory and decision history.  
**Current state:** Demo activity history.  
**Pilot gap:** Needs automatic entries from real application, review, and decision actions.  
**Required pilot action:** Write `activity_log` rows for submit application, assign reviewer, submit review, move status, generate report.  
**Defer:** Complex audit export and compliance workflows.

### `/reports/`

**Classification:** PILOT-CRITICAL  
**Role served:** Institution admin / committee  
**Real job this page must help complete:** Generate copyable report draft from program, application, review, shortlist, and activity data.  
**Current state:** Strong report narrative and simulated export.  
**Pilot gap:** Needs to use real saved data and produce a copyable report draft.  
**Required pilot action:** Read `programs`, `applications`, `reviews`, and `activity_log`; create or update `report_drafts`.  
**Defer:** PDF polish and advanced board/funder templates.

### `/templates/`

**Classification:** DEFER / HIDE FOR PILOT  
**Role served:** Institution admin  
**Real job this page must help complete:** Reuse program/application templates in future.  
**Current state:** Demo/admin support.  
**Pilot gap:** Not required for one controlled pilot.  
**Required pilot action:** Hide or leave clearly secondary.  
**Defer:** Template library, complex reuse logic.

### `/settings/`

**Classification:** DEFER / HIDE FOR PILOT  
**Role served:** Institution admin / account admin  
**Real job this page must help complete:** Manage workspace preferences later.  
**Current state:** Admin support.  
**Pilot gap:** Not required for the first real workflow unless needed for profile basics.  
**Required pilot action:** Keep minimal; do not build full settings.  
**Defer:** Billing, branding, integrations, advanced permissions.

---

## Pilot-critical fake/demo-only action inventory

Search terms to keep auditing:

- `disabled`
- `readOnly`
- `demoAction`
- `setTimeout`
- `localStorage`
- `published`
- `demo session`
- `static data`

Known high-priority findings:

1. `/collaborator-dashboard/review-queue/` has read-only notes and disabled reviewer actions. This blocks real review submission.
2. `/programs/new/` uses local `published` state. This blocks real open-call creation.
3. `/signup/artist/` routes into demo auth after a timer. This blocks real Creative Passport creation.
4. Institution dashboard and Review Queue rely on synthetic analytics. This blocks real pilot metrics.
5. Reports simulate preparation/export. This blocks real institutional memory output.
6. Demo auth/session shortcuts are useful for presentations but must not be mistaken for pilot access control.

---

## Phase 1 conclusion

The current build has the correct product shape: public landing page, artist workspace, institution workspace, reviewer seat, review room, committee, and reports.

The next work is not visual redesign. The next work is turning pilot-critical surfaces from demo state into saved workflow state.

## Phase 2 build order

1. Add Supabase client/server/proxy foundation.
2. Create starter schema with RLS enabled.
3. Connect `/programs/new/` first so one open call can be saved.
4. Connect Artist Passport so artist profile data can be saved and reused.
5. Add `/apply/[publicSlug]/` to submit real applications.
6. Connect `/review-queue/` to real applications.
7. Enable reviewer scoring/comment/submission in `/collaborator-dashboard/review-queue/`.
8. Enable Review Room status movement and activity log writes.
9. Generate copyable Reports from saved data.
