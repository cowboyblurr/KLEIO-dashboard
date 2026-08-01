# KLEIO Import Studio source hub — August 1, 2026

## Scope

This focused improvement preserves the working Media Library and Import Studio implementation and closes the source-selection gaps identified in the attached KLEIO Import Studio brief.

## Implemented

- Added one visible source-selection hub with four primary choices: device, Google Drive, personal website, and Pinterest.
- Kept the existing read-only Instagram importer available as an additional connected source.
- Kept the existing device upload, Google Picker, autosave, private staging, editable artwork record, and explicit approval flows intact.
- Added an honest Pinterest configuration state rather than a simulated connection.
- Documented the required read-only Pinterest scopes (`boards:read`, `pins:read`), preview labeling, original-file replacement, disconnect, revocation, and expiration-recovery requirements.
- Added an authenticated website-import gateway that rejects Pinterest, Behance, ArtStation, and unsupported social-profile hosts before collection.
- Kept Behance and ArtStation available only as external portfolio links; their content is not crawled, copied, synchronized, embedded, or AI-analyzed.
- Preserved the inspected website collector as a separately deployed, JWT-protected core function.
- Added a focused source audit covering source visibility, Pinterest gating, restricted-host enforcement, authenticated forwarding, timeout control, pinned collector provenance, and secret scanning.

## Verified existing implementation

- Device image upload supports multiple selection, mobile-native file selection, progress messaging, validation, duplicate-aware source creation, and private storage.
- Google Drive uses Google Picker and the narrow `drive.file` scope. It remains configuration-gated by deployment environment variables.
- Import drafts autosave locally and to Supabase, preserve revisions, recover after refresh, and surface conflicts.
- Artwork records remain editable and require explicit artist approval before a portfolio record is created.
- Website collection remains bounded, robots-aware, HTTPS-only, DNS/private-network protected, size-limited, signature-validated, and artist-confirmed.
- Website artwork imports preserve source URLs and require recorded rights confirmation.

## Supabase deployment

- `analyze-artist-website-core` deployed as version 1 with JWT verification enabled.
- `analyze-artist-website` deployed as version 8 with JWT verification enabled.
- The public function is now the restricted-source gateway and forwards allowed requests to the protected collector core.
- Supabase accepted and activated both function deployments.

## Validation completed

- Local TypeScript/source sanity check passed for the new source hub, Pinterest status component, and website-import gateway.
- The focused source assertions passed locally.
- Supabase compiled and activated both Edge Functions.

## Validation not completed

The following must not be described as passed yet:

- Full repository TypeScript check
- Full repository ESLint check
- Full production Next.js build
- Authenticated browser smoke test of allowed and rejected website sources
- Google Drive real-account selection and revoked/expired-session testing
- Physical Safari, Firefox, iPhone/iOS, and Android testing
- Keyboard-only and screen-reader walkthroughs
- Refresh, offline, interrupted-upload, expired-login, and cross-device recovery testing

Vercel preview checks currently report the project build-rate limit rather than a code-level build result.

## Intentionally not represented as complete

- Pinterest OAuth is not live. KLEIO still needs an approved Pinterest app, registered redirect URI, server-side authorization-code exchange, encrypted token storage, refresh/revocation handling, and production-access verification.
- Google Drive cannot be called production-ready until the restricted client ID, API key, allowed origins, OAuth consent configuration, and real-account selection flow are verified in the deployed environment.
- This change does not add TIFF, HEIC, PDF, MP4, or MOV artwork ingestion to the image-focused importer. Those formats require separately verified processing, thumbnail, storage, and application-packaging behavior.

## Release recommendation

Keep the pull request in draft. Merge only after the full repository checks and signed-in artist walkthrough verify the source hub, device upload, Google Drive gating, restricted-source response, autosave recovery, mobile layout, keyboard focus order, and screen-reader labels. Pinterest must remain disabled until the complete official OAuth flow is implemented and approved.
