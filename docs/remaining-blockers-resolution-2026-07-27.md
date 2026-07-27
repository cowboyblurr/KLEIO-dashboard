# KLEIO remaining-blockers resolution

Date: 2026-07-27

## Release decision

**The connected KLEIO application and database are technically ready for a controlled beta on GitHub Pages after the two account-level production settings below are confirmed.**

The code, GitHub Pages workflow, static export, database permissions, opportunity filters, application submission gate, and live reviewer workflow pass automated and behavioral verification. The remaining actions cannot be changed through the connected tools because they belong to GoDaddy DNS and hosted Supabase Auth dashboard settings.

## Production architecture

- Repository: `cowboyblurr/KLEIO-dashboard`
- Branch: `main`
- Hosting: GitHub Pages
- Project URL: `https://cowboyblurr.github.io/KLEIO-dashboard/`
- Supabase project: `trekynurdgxgtaaqqtyq`
- Intended custom domain: `https://www.kleioarthouse.com/`
- Production build: Next.js static export under `/KLEIO-dashboard`

Vercel is not part of the KLEIO release path.

## Resolved blockers

### GitHub Pages deployment

Resolved:

- Restored GitHub Pages as the production deployment target.
- Corrected the production base path to `/KLEIO-dashboard`.
- Corrected the production URL helper to use the GitHub Pages project URL.
- Added production auth redirect auditing.
- Added static-export route checks for artist, institution, reviewer, authentication, and recovery routes.
- Added public/demo separation checks.
- Added navigation auditing.
- Added build diagnostics that persist the production build and navigation logs.
- Added live-route verification with cache-busting deployment identifiers.
- Added a permanent Pages publishing audit.

Verified:

- Pages publishing mode is `workflow`.
- GitHub Pages production build succeeds.
- GitHub Pages deployment succeeds.
- Live-route verification succeeds.
- The production artifact rejects demo credentials and synthetic-product markers on the public homepage.

### Opportunity discovery and readiness

Resolved:

- Added database-backed persistent filters for discipline, opportunity type, source, participation format, geography, career stage, deadline window, funding, confirmed no-fee status, and structured-requirement coverage.
- Added `search_opportunities_v2` as a security-invoker authenticated search function.
- Filter values persist on the artist's device.
- Unknown fee, funding, deadline, and eligibility remain unknown.
- Readiness is not calculated when confirmed structured requirements are unavailable.
- Application preparation is not enabled for records without confirmed structured requirements.

Validated filter coverage included ceramics, film, emerging career stage, near-term deadlines, known funding, and structured requirements.

### Native application submission

Resolved:

A native KLEIO submission now fails closed unless:

- The authenticated caller owns the artist application.
- The call is open and within its submission period.
- Confirmed structured requirements exist.
- A current, non-stale package belongs to the same artist, application, opportunity, and internal call.
- Every required package item is complete and artist-approved.
- No package item is missing, blocked, unverified, over a limit, or awaiting review.
- All final artist confirmations are true.
- `artist_approved_at` already exists.
- The submission method is explicitly `native_kleio`.

Only then is the historical submission snapshot created.

### Institution and reviewer permissions

Resolved:

- Institution administrators and assigned reviewers have separate permission paths.
- Reviewers cannot manage calls or application decisions.
- Reviewers can read only assigned applications.
- Reviewers can read and edit only their own private review record.
- Institution administrators retain committee-wide review visibility.
- Unrelated institution accounts cannot read the application or reviews.
- Accepting an institution invitation no longer overwrites an artist's primary KLEIO role.

Live reviewer pages now use Supabase assignment data rather than synthetic analytics. The reviewer workspace supports submitted artist context, answers, selected works, score, recommendation, private notes, save-in-progress, and completion.

### Internal authorization helper exposure

Resolved:

The following authorization helpers were moved from the exposed `public` schema to the non-exposed `private` schema:

- `can_access_application`
- `can_administer_institution`
- `can_manage_application`
- `can_review_application`
- `is_institution_owner`
- `owns_institution`
- `is_kleio_admin`

All dependent public functions were rewritten to use the private helpers. There are zero remaining public copies and zero stale public references.

Post-migration behavior tests passed:

- Artist: own application accessible; management and review authority denied.
- Institution administrator: administration, management, and committee review access allowed.
- Assigned reviewer: assigned application and own review visible; management denied; other reviewers' notes hidden.
- Unrelated institution: application and review visibility denied.

### Remaining public SECURITY DEFINER RPC warnings

The remaining Supabase advisor warnings correspond to intentionally exposed application actions such as:

- Accepting or responding to invitations.
- Listing account-scoped institution contexts.
- Creating, listing, reading, and sending authorized messages.
- Recording opportunity events.
- Starting, evaluating, or cancelling artist opportunity research.
- Admin-only opportunity import and moderation operations.

Every remaining callable function was classified. Each contains either a caller identity check using `auth.uid()` or a private authorization check. These are documented application RPCs rather than internal helper functions accidentally exposed as endpoints.

They should remain on a reviewed allow-list and be re-audited when their implementation changes.

## Verification results

Passed:

- TypeScript typecheck.
- ESLint.
- Static production build.
- GitHub Pages project-path build.
- Auth redirect audit.
- Critical route export checks.
- Public/demo separation.
- Internal navigation audit.
- User-facing copy audit.
- Artist RLS behavior.
- Institution administrator RLS behavior.
- Assigned reviewer RLS behavior.
- Reviewer private-note isolation.
- Unrelated institution isolation.
- Native submission denial tests.
- Valid native submission rollback test.
- Opportunity filter database tests.
- Institution-context and opportunity-conversation read RPC tests.

## External account-level actions

### 1. GoDaddy DNS

The GitHub Pages repository is already configured for workflow publishing and still has `www.kleioarthouse.com` registered as its custom domain. The GitHub deployments are succeeding, but the public custom domain still resolves to the previous site.

In GoDaddy DNS, set:

- `CNAME` host `www` → `cowboyblurr.github.io`

For the apex domain, use GitHub Pages A records:

- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

Remove conflicting old `www` CNAME, A, AAAA, forwarding, parking, or website-builder records. Do not place `/KLEIO-dashboard` in the DNS target.

The connected GoDaddy capability can search domains but cannot edit DNS records, so this change must be made in the GoDaddy DNS dashboard.

### 2. Supabase Auth URL configuration

Set the hosted Supabase Auth configuration to:

Site URL:

`https://cowboyblurr.github.io/KLEIO-dashboard`

Exact redirect allow-list:

- `https://cowboyblurr.github.io/KLEIO-dashboard/auth/callback/`
- `https://cowboyblurr.github.io/KLEIO-dashboard/auth/update-password/`

Then test one fresh artist confirmation email, one fresh institution confirmation email, and one password-recovery email.

The connected Supabase capability can manage database schema and functions but does not expose hosted Auth URL configuration, so this must be confirmed in the Supabase Dashboard.

### 3. Leaked-password protection

Supabase leaked-password protection remains unavailable on the current Free organization plan. It is a Pro-plan feature. This is a documented platform limitation, not an unresolved code defect.

Maintain the existing minimum password validation and treat leaked-password protection as a security upgrade item when the Supabase plan changes.

## Remaining human acceptance checks

These require real browser, inbox, assistive-technology, or device interaction and cannot be honestly marked passed through repository or SQL testing alone:

- Fresh artist email confirmation.
- Fresh institution email confirmation.
- Password reset email.
- Confirmation link opened on a second device.
- Mobile signup and application preparation.
- Safari and Firefox acceptance pass.
- Keyboard-only journey.
- Screen-reader journey.
- Network interruption during upload or save.
- Session expiration during editing.

## Final beta gate

After GoDaddy DNS and Supabase Auth URLs are confirmed, run one controlled synthetic artist account and one controlled synthetic institution account through the public GitHub Pages URL.

Do not invite a broader beta until both email-confirmation paths and password recovery pass on the deployed public domain.
