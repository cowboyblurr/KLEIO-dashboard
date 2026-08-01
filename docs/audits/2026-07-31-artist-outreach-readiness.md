# KLEIO August 7 Artist Outreach Readiness Audit

**Audit date:** July 31, 2026  
**Target outreach date:** August 7, 2026  
**Scope:** Artist discovery, signup, authentication, account isolation, Creative Passport persistence, uploads, opportunities, applications, public trust, accessibility, operational recovery, and launch monitoring.  
**Repository:** `cowboyblurr/KLEIO-dashboard`  
**Audit branch:** `agent/august-7-artist-readiness-hardening`

## 1. Executive readiness verdict

# Not ready for public artist outreach

KLEIO has a materially stronger technical foundation than a visual prototype. Production authentication is active, all 76 public database tables have row-level security enabled, private artist storage uses signed URLs, and direct cross-account read/write probes against core artist records were denied.

However, the August 7 public outreach gate cannot be approved yet because several P1 requirements remain unverified or incomplete:

1. Supabase leaked-password protection is disabled.
2. Fresh signup, verification-email, password-reset, link-expiration, and reset-reuse journeys were not executed with controlled launch test accounts.
3. A full browser/device/accessibility matrix was not executed.
4. Opportunity search, save, application drafting, session interruption, and return-later persistence were not completed end to end in the deployed production interface during this audit.
5. Privacy notice, terms, data-deletion procedure, support contact, and artist-facing data-use explanation were not found as verified launch surfaces.
6. Dedicated production error alerting, uptime alerting, backup-restore testing, incident ownership, and signup-pause procedure were not verified.
7. Profile-image signature validation is fixed on the audit branch, but the branch still requires successful build, merge, production deployment, and production retest. PDF/document malware scanning and complete document-upload validation remain unverified.

No P0 vulnerability was found in the tested core artist ownership paths. That does not equal a complete penetration test of every RPC, route, browser, or upload surface.

## 2. System inventory

### Application

- Next.js 16 static-export application.
- React 19 and TypeScript 5.7.
- Deployed through Vercel.
- Production domain activity observed from `https://www.kleioarthouse.com/` in authentication logs.
- Security headers configured through `vercel.json`:
  - Content Security Policy.
  - Strict Transport Security.
  - Referrer Policy.
  - Permissions Policy.
  - `X-Content-Type-Options: nosniff`.
  - Frame denial.
  - Cross-Origin-Opener-Policy.
- Vercel Analytics is installed.
- No dedicated application-error monitoring service was verified.
- No GitHub Actions workflow was found for the latest production commit; Vercel is the active deployment gate.

### Authentication and data

- Supabase authentication and PostgreSQL.
- Email/password authentication with email confirmation support.
- Client uses a publishable key; no service-role key reference was found in public client source.
- Sessions persist and auto-refresh through Supabase.
- Unconfirmed accounts are signed out before protected account data is loaded.
- Browser account state is cleared on logout and on detected account switch.
- Current database inventory:
  - 76 public tables.
  - 149 public RLS policies.
  - 66 public functions.
  - 7 storage buckets.
- All 76 public tables have RLS enabled.

### Storage

- Artist and application buckets are private unless explicitly intended otherwise.
- Artist assets use ownership-scoped paths and signed URLs.
- Opportunity images are the only verified public image bucket.
- Size and MIME allowlists are configured at bucket level.
- SVG was removed from the institution-logo beta allowlist during this audit.
- No malware scanner or content-disarm pipeline was verified.

### Existing automated gates

The repository includes source-level launch audits for:

- Navigation.
- User-facing copy.
- Authentication redirects.
- Authentication and role isolation.
- Guidance hierarchy.
- Opportunity search.
- Opportunity-first acquisition.

This audit adds an upload-safety source gate and requires it in the Vercel build command.

These scripts are useful regression guards, but they are not substitutes for real browser E2E tests, email delivery tests, penetration testing, or assistive-technology testing.

## 3. Verified security results

### Authentication boundaries

| Control | Result | Evidence level |
|---|---|---|
| Protected artist workspace does not render for the wrong role | Verified in source | `ArtistShell` uses `AuthGate requiredRole="artist"` |
| Unconfirmed user blocked from account loading | Verified in source | Unconfirmed user is signed out before profile load |
| Logout clears KLEIO browser state even after network failure | Verified in source | Cleanup occurs in `finally` |
| Account switch clears prior account-scoped browser state | Verified in source | Active user scope comparison and cleanup |
| Service-role credential referenced by public environment variable | Not found | Repository audit checks client source |
| Fresh production signup and confirmation email | Not verified | Requires controlled inbox test |
| Password-reset delivery, expiry, and single use | Not verified | Functions exist; journey not executed |
| Compromised-password rejection | Failed configuration check | Supabase advisor reports protection disabled |

### Cross-account access simulation

Two existing completed artist accounts were used only as database identities for safe RLS simulation. No passwords, email addresses, private content, or personal identifiers were exposed in the audit report.

The caller artist attempted to access a different artist’s data.

| Target | Cross-account read | Cross-account write |
|---|---:|---:|
| Artist profile | 0 visible rows | Update affected 0 rows |
| Creative Passport drafts | 0 visible rows | Insert rejected with PostgreSQL permission error |
| Portfolio works | 0 visible rows | Not destructively tested |
| Saved opportunities | 0 visible rows | Not destructively tested |
| Applications | 0 visible rows | Not destructively tested |

**Result:** The tested core artist records correctly denied cross-account access.

**Limit:** This was a focused safe probe, not exhaustive testing of every table, RPC, storage path, reviewer workflow, or administrative function.

### Database least privilege

Production changes applied and verified during this audit:

- Anonymous table privileges were reset and reduced to an explicit allowlist.
- Anonymous users retain only:
  - Read access to active public taxonomy data.
  - Read access to public open calls and call questions under RLS.
  - Read access to the institution search index.
  - Insert-only access to privacy-minimized product events under RLS.
- Signed-in client roles no longer have `TRUNCATE`, `REFERENCES`, or `TRIGGER` table privileges in the public schema.
- Anonymous execution of `save_my_artist_draft(...)` was revoked.
- Authenticated execution remains enabled.
- Internal research queue remains RLS-denied and has no anonymous/authenticated table grant.

### Security-definer functions

The Supabase advisor reports multiple security-definer functions as review warnings. The functions sampled in this audit use explicit authentication, role, institution-membership, assignment, or ownership checks and set an empty search path.

These warnings are not automatically vulnerabilities, but every newly added security-definer function must receive an authorization review before deployment. Administrative RPCs should eventually move behind narrower API boundaries rather than remaining broadly executable by all authenticated sessions and relying only on internal checks.

## 4. Upload audit and repairs

### Verified before repair

- Profile images accepted only JPEG, PNG, and WebP by declared browser MIME type.
- Profile image size was limited to 5 MB.
- Storage path used the authenticated artist ID and a random UUID.
- Uploads used `upsert: false`.
- Private files were returned through signed URLs.
- Bucket-level size and MIME limits existed.

### Weakness found

The profile-image client trusted the browser-provided MIME type. A renamed or incorrectly declared file could reach storage validation without first confirming its byte signature in the application.

### Repair implemented on audit branch

- Added JPEG magic-byte validation.
- Added PNG signature validation.
- Added WebP RIFF/WEBP signature validation.
- Added PDF header validation helper.
- Rejected empty files.
- Rejected a file whose bytes do not match its declared MIME type.
- Applied the image validator both before temporary IndexedDB storage and immediately before authenticated upload.
- Added a Vercel-enforced upload-safety audit.
- Removed SVG from the institution-logo storage allowlist in production and migration history.

### Remaining upload risks

- Full portfolio image upload path was not located and executed end to end during this pass.
- PDF/application-document paths were not executed with valid, corrupted, oversized, empty, renamed, and interrupted files.
- A PDF header check is available but is not yet verified as integrated across every document uploader.
- Malware scanning, content disarm, and quarantine are not implemented or verified.
- EXIF metadata stripping is not verified.
- Interrupted multi-file upload recovery is not verified.

**Launch restriction:** Do not advertise document upload as production-safe until each active uploader uses content-signature validation and the complete document test matrix passes. Disable any uploader that cannot meet this requirement by August 7.

## 5. Launch blockers

| Issue | Severity | Affected system | Artist/security impact | Root cause | Current status | Required action | Proposed owner |
|---|---|---|---|---|---|---|---|
| Leaked-password protection disabled | P1 | Supabase Auth | Known compromised passwords may be accepted | Auth setting not enabled | Open | Enable in Supabase Auth and retest signup/reset | Kevin |
| Fresh auth lifecycle not executed | P1 | Signup, email verification, reset | Artists may be unable to activate or recover accounts | No controlled end-to-end launch test completed | Open | Test new signup, resend, expiry, reset, old-password rejection, logout | Kevin |
| Privacy/terms/data-use surfaces not verified | P1 | Public site and signup | Artists cannot give informed consent or understand data handling | No verified live policy routes/consent links found | Open | Prepare counsel-reviewed notices and link them before account creation | Kevin + legal reviewer |
| Account deletion/data request not verified | P1 | Settings/support | Artists may be unable to exercise deletion/correction requests | No verified self-service or documented manual process | Open | Add verified support path and deletion runbook; test deletion cascade | Kevin |
| Production browser E2E not completed | P1 | Entire artist journey | Broken UI, session, browser, or mobile behavior may remain | No browser automation/device lab in this audit environment | Open | Run controlled Chrome, Safari, Firefox, Edge, iOS, Android journeys | Kevin/tester |
| Opportunity/save/application flow not completed end to end | P1 | Artist value proposition | Outreach could send artists into broken core functionality | Backend/source review is not a real journey test | Open | Execute Journeys C and D with production-like accounts | Kevin |
| Document-upload pipeline not fully validated | P1 | Portfolio, CV, application files | Unsafe, corrupted, or lost files could be accepted | Signature/malware/interruption coverage incomplete | Open | Integrate validator everywhere; run matrix; disable unsafe surfaces | Kevin |
| Monitoring and incident operations unverified | P1 | Production operations | Failures may go undetected during outreach | Analytics exists, alerting/recovery ownership not confirmed | Open | Configure error/uptime alerts, incident owners, signup kill switch | Kevin + Iker |
| Backup restore not tested | P1 | Database and storage | User work may not be recoverable after failure | Backup existence/restore exercise not verified | Open | Confirm backup plan and perform non-destructive restore drill | Kevin |
| Audit branch not yet deployed and retested | P1 | File validation and build gate | Code fixes are not live until merged/deployed | Branch deployment still validating | Open | Require green Vercel builds, review diff, merge, deploy, smoke test | Kevin |
| Public crawl shows obsolete positioning | P2 | Search/public trust | Artists may see conflicting KLEIO descriptions | Search cache or deployment/index mismatch | Open | Verify live HTML, canonical metadata, sitemap, and request reindex | Kevin |
| Static-export routes use client-side auth wall | P2 | Protected route UX | Protected HTML shell can load before client auth resolves | `output: export` architecture | Accepted for beta with RLS | Keep private data exclusively behind RLS; consider server auth later | Kevin |
| Duplicate-account message confirms account existence | P2 | Signup | Limited account-enumeration signal | Friendly duplicate-account copy | Open | Use a neutral recovery message for public launch | Kevin |
| RLS policy performance warnings | P2 | Database performance | Queries may degrade as artist count grows | Repeated `auth.uid()` evaluation and multiple permissive policies | Open | Optimize after launch blockers; load-test high-volume paths | Kevin |
| Accessibility not tested with assistive technology | P2/P1 | Signup and workspace | Keyboard or screen-reader users may be blocked | Source review only | Open | Complete WCAG 2.2 AA manual matrix before broad outreach | Tester |

## 6. Artist journey results

| Journey | Status | Notes |
|---|---|---|
| Homepage discovery | Partially verified | Current repository copy is clear and avoids claiming automatic submission; live visual crawl mismatch must be resolved |
| Artist signup form | Partially verified | Required fields, email input, 8-character minimum, confirmation state, resend action, and bilingual errors exist in source |
| Email verification | Not verified | Requires live inbox and link-expiry/reuse tests |
| Login/logout | Partially verified | Successful production auth events exist; logout/state clearing verified in source; browser back-cache test not run |
| Password reset | Not verified | Implementation exists; complete recovery journey not run |
| Creative Passport persistence | Partially verified | Account-scoped draft RPC and optimistic revision control verified; browser return-later journey not run |
| Profile-image upload | Conditionally verified | Existing signed private upload observed; byte-signature repair pending branch deploy |
| Portfolio/document upload | Not verified | Full matrix incomplete |
| Opportunity search/filter | Not verified end to end | Data model and source audits exist; production browser journey not run |
| Saved opportunities | RLS verified; UX not verified | Ownership isolation passed; persistence UI journey not run |
| Application preparation | Not verified end to end | Database model exists; draft mapping, interruption, review, and status journey not run |
| Application submission integrity | Partially verified | Public copy states nothing is submitted automatically; no third-party submission completion was claimed |
| Return after logout/device change | Not verified | Browser/device test required |
| Mobile experience | Not verified | Responsive source patterns exist; device journey not executed |
| Accessibility | Partially verified in source | Labels, focus styles, live regions, reduced-motion handling found; screen-reader/keyboard journey not executed |

## 7. Fixed-items changelog

### A. Production database privilege hardening

**Problem:** Anonymous and authenticated table grants were broader than required, even where RLS denied rows.

**Change:** Reset anonymous public-table access to an explicit allowlist; removed schema-management-adjacent privileges from authenticated clients.

**Evidence:** Production grant query confirms only eight anonymous table grants remain and zero authenticated `TRUNCATE`, `REFERENCES`, or `TRIGGER` grants remain.

**Result:** Passed.

### B. Draft RPC execution boundary

**Problem:** `save_my_artist_draft(...)` was executable anonymously through inherited public function privileges, although its body rejected missing authentication.

**Change:** Revoked public/anonymous execution and granted only authenticated/service execution.

**Result:** Production verification confirms anonymous execute is false and authenticated execute is true.

### C. Active SVG upload removal

**Problem:** Institution-logo storage accepted SVG active content during beta.

**Change:** Removed `image/svg+xml` from the private bucket MIME allowlist.

**Result:** Production bucket now allows JPEG, PNG, and WebP only.

### D. Profile-image content validation

**Problem:** Client trusted declared MIME type without inspecting file bytes.

**Change:** Added signature validation before temporary storage and authenticated upload.

**Files:**

- `lib/kleio-file-validation.ts`
- `lib/kleio-pending-profile-image.ts`
- `lib/kleio-profile-presentation.ts`

**Result:** Implemented on audit branch; awaiting green deployment and production retest.

### E. Deployment regression gate

**Problem:** Upload safety was not part of the deployment command.

**Change:** Added `audit:uploads` and included it in the Vercel build command.

**Files:**

- `scripts/audit-file-upload-safety.mjs`
- `package.json`
- `vercel.json`

**Result:** Implemented on audit branch; awaiting build result.

## 8. Deferred-risk register

| Risk | User impact | Temporary mitigation | Long-term fix | Disable feature? |
|---|---|---|---|---|
| No malware scanning | Harmful or malformed documents may be stored | Strict MIME/size/signature checks; private storage | Add scanner/quarantine pipeline | Disable document upload if validation is incomplete |
| No confirmed self-service account deletion | Artist cannot immediately remove data | Manual verified support process | Build deletion workflow and retention audit | No, but support route is mandatory |
| Client-only route gate | Brief auth wall and public shell load | Keep all private queries RLS-protected | Move sensitive workspace to server-aware auth architecture | No |
| No full E2E automation | Regressions may escape source checks | Manual release checklist | Add Playwright/Cypress browser suite | Broad outreach should wait |
| No dedicated error monitor | Failures may be noticed only through support | Daily Supabase/Vercel log checks | Add error reporting and alerts | No, if manual launch watch is staffed |
| Search engine cache mismatch | Conflicting public positioning | Share canonical direct URL | Fix metadata/indexing and request re-crawl | No |
| Performance advisor warnings | Slower queries at scale | Monitor latency during controlled beta | Consolidate policies and use `(select auth.uid())` patterns | No for small controlled beta |

## 9. August 7 launch checklist

### Must be complete before outreach

- [ ] Both Vercel checks are green on the audit branch.
- [ ] Audit branch is reviewed, merged, and deployed to the production domain.
- [ ] Production smoke test confirms security headers remain present.
- [x] All public tables have RLS enabled.
- [x] Core cross-account artist reads are denied.
- [x] Cross-account draft insert and profile update are denied.
- [x] Anonymous table access is reduced to an allowlist.
- [x] Authenticated clients have no truncate/trigger/reference table privileges.
- [x] Anonymous draft RPC execution is revoked.
- [x] SVG is removed from the initial beta upload allowlist.
- [ ] Leaked-password protection is enabled.
- [ ] Fresh artist signup succeeds on desktop and mobile.
- [ ] Confirmation email arrives from the correct sender.
- [ ] Confirmation redirect returns to the correct KLEIO route.
- [ ] Confirmation link expiry and reuse behavior are tested.
- [ ] Duplicate signup behavior is neutral and safe.
- [ ] Login, logout, browser back, refresh, multi-tab, and session expiry pass.
- [ ] Password reset delivery, expiry, reuse, and old-password rejection pass.
- [ ] Creative Passport partial save and return-later persistence pass.
- [ ] Profile image valid/invalid/renamed/oversized/empty/interrupted cases pass.
- [ ] Portfolio and PDF upload matrices pass or the features are disabled.
- [ ] Opportunity search and combined filters pass.
- [ ] Saved opportunity persists after logout and return.
- [ ] Application draft maps the correct passport fields.
- [ ] Session interruption does not destroy an application draft.
- [ ] No state says “submitted” without genuine technical confirmation.
- [ ] Privacy notice and terms match actual implementation and receive qualified legal review.
- [ ] Signup links to privacy/data-use information before account creation.
- [ ] Artist support contact is visible and monitored.
- [ ] Manual or self-service account deletion process is tested.
- [ ] Error monitoring and uptime alerting are active.
- [ ] Backup policy is confirmed and restore drill completed.
- [ ] Rollback procedure is documented and exercised on a preview deployment.
- [ ] A method exists to pause new signups immediately.
- [ ] Chrome, Safari, Firefox, and Edge journeys pass.
- [ ] iPhone, Android, tablet, laptop, and large-desktop journeys pass.
- [ ] Keyboard-only signup and Creative Passport editing pass.
- [ ] Desktop and mobile screen-reader journeys pass.
- [ ] 200% zoom and reduced-motion tests pass.
- [ ] Live homepage content matches the current repository positioning.

## 10. August 7 incident-response checklist

1. Stop outreach and pause new signups for any suspected P0 or repeated P1 failure.
2. Record UTC and local time, affected route, account role, browser/device, and observed behavior.
3. Preserve logs without copying passwords, tokens, private documents, or unnecessary personal information.
4. Determine whether the issue affects confidentiality, integrity, availability, or user trust.
5. Revoke compromised sessions or credentials when relevant.
6. Disable the affected feature if a narrow shutdown is possible.
7. Roll back to the last known green deployment if the failure began after release.
8. Notify affected artists directly when there is a verified material impact; do not speculate.
9. Document the root cause, repair, retest, and prevention step before re-enabling the feature.
10. Keep one launch incident log with a named technical owner and communication owner.

### Proposed launch ownership

- **Technical and security incident owner:** Kevin.
- **Outreach/support intake owner:** Iker.
- **Final go/no-go decision:** Kevin and Iker together, using this launch gate rather than visual readiness alone.

## 11. First-week monitoring plan: August 7–14

Review at least twice daily during the first three outreach days, then daily through August 14.

### Authentication

- New signup count.
- Confirmation-email failures.
- Unconfirmed-account backlog.
- Login failure rate.
- Password-reset requests and failures.
- Rate-limit events.
- Unexpected token/session errors.

### Artist onboarding

- Signup completion rate.
- Abandonment by field or step.
- Time to complete initial profile.
- Repeated validation errors.
- Account-role conflict events.

### Creative Passport and uploads

- Draft save failures.
- Revision conflicts.
- Upload failures by MIME type and size.
- Signed URL failures.
- Orphaned storage objects.
- Delete/replace failures.
- Reports of missing or overwritten work.

### Opportunities and applications

- Search errors and empty-result anomalies.
- Broken source links.
- Expired opportunities presented as open.
- Save/unsave failures.
- Draft-application failures.
- Incorrect passport field mapping.
- Any false or ambiguous submission status.

### Reliability and security

- JavaScript exceptions.
- Failed Supabase API requests.
- Database errors and slow queries.
- Storage authorization failures.
- Repeated unauthorized-access attempts.
- Unusual anonymous product-event volume.
- Vercel deployment or routing errors.
- Support messages indicating confusion or loss of trust.

### Daily launch review

Record:

- What failed.
- Number of affected artists.
- Whether data was exposed, corrupted, or lost.
- Temporary mitigation.
- Permanent owner and deadline.
- Whether outreach should continue, narrow, or pause.

## 12. Minimum go-live standard

KLEIO may move from **not ready** to **conditionally ready for a controlled artist beta** only when:

- Every P1 blocker in this report is resolved or the affected feature is disabled.
- The audit branch is green, deployed, and retested in production.
- Fresh signup, verification, login, logout, reset, Creative Passport save, upload, opportunity save, and application-draft journeys pass.
- Privacy, support, deletion, monitoring, backup, and incident procedures are real and visible.
- Mobile, keyboard, and screen-reader users can complete the core artist journey.
- No P0 or unresolved P1 issue remains.

A controlled beta should begin with a deliberately limited cohort and active support coverage. “Full outreach” should follow only after the first cohort completes the core journey without data loss, false submission states, or unresolved security failures.
