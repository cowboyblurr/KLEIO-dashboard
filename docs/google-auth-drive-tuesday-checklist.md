# KLEIO Google Authentication and Drive Activation

**Scheduled activation:** Tuesday, August 4, 2026

Google account authentication and Google Drive access are separate permissions and must be configured and tested separately.

Until activation, KLEIO keeps email signup, device upload, and private KLEIO Library reuse available. Google controls are capability-gated so artists are not sent into an unconfigured flow.

## A. Supabase Google authentication

### Google Cloud

- [ ] Use or create the KLEIO-owned Google Cloud project.
- [ ] Configure the OAuth consent screen with the KLEIO product name and support contact.
- [ ] Add KLEIO's verified production domains.
- [ ] Create a Web application OAuth client for KLEIO authentication.
- [ ] Add the Supabase Google callback URL shown in the connected Supabase project's Google provider settings.
- [ ] Add production and approved local origins only.
- [ ] Record the OAuth client ID and client secret in the approved secure credential store.

### Supabase

- [ ] Open Authentication → Providers → Google.
- [ ] Enable the Google provider.
- [ ] Enter the Google OAuth client ID and secret.
- [ ] Confirm Site URL points to the production KLEIO domain.
- [ ] Add the exact production, GitHub Pages preview if intentionally supported, and local development redirect URLs.
- [ ] Do not add wildcard redirect domains broader than required.

### Deployment

- [ ] Set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` only after the provider and redirect URLs are complete.
- [ ] Redeploy the production frontend.
- [ ] Confirm the disabled setup state changes to **Continue with Google**.

### Authentication tests

- [ ] New artist account through Google.
- [ ] Existing artist account through Google.
- [ ] OAuth cancellation returns safely to signup.
- [ ] Wrong or removed callback URL produces a controlled message.
- [ ] Artist role and workspace are created correctly.
- [ ] Existing opportunity return intent is restored.
- [ ] Refresh after callback does not create duplicate profile or workspace records.
- [ ] Expired session returns to authentication without exposing private data.
- [ ] Institution and artist roles remain isolated.
- [ ] Google authentication does not grant Google Drive permission.

## B. Google Drive Picker

### Google Cloud APIs

- [ ] Enable Google Picker API.
- [ ] Enable Google Drive API.
- [ ] Reuse the KLEIO-owned Cloud project where practical.
- [ ] Create or confirm a browser API key restricted to the required APIs.
- [ ] Restrict the browser key to exact KLEIO production and approved local origins.
- [ ] Create or confirm the Drive OAuth client used by Google Identity Services.
- [ ] Configure the consent screen and authorized origins.
- [ ] Keep the requested scope limited to `https://www.googleapis.com/auth/drive.file`.

### Deployment variables

- [ ] `NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID`
- [ ] `NEXT_PUBLIC_GOOGLE_PICKER_API_KEY`
- [ ] `NEXT_PUBLIC_GOOGLE_CLOUD_APP_ID` when required by the Picker configuration
- [ ] Redeploy after variables are set.
- [ ] Confirm the Drive source changes from **Setup pending** to an active source.

### Drive tests

- [ ] Open Drive from Quick Import while signed in with email rather than Google.
- [ ] Confirm Drive permission is requested only after selecting the Drive source.
- [ ] Select an accepted image.
- [ ] Select an accepted PDF.
- [ ] Reject a file with an unsupported MIME type.
- [ ] Reject an oversized file.
- [ ] Cancel Picker without changing the destination.
- [ ] Confirm only selected files are copied to private KLEIO storage.
- [ ] Confirm copied files receive owner-scoped source records and checksums.
- [ ] Confirm duplicate files reuse the canonical private source.
- [ ] Confirm the access token is not written to local storage, analytics, logs, or the database.
- [ ] Confirm token revocation runs after selection and cancellation paths.
- [ ] Test interrupted OAuth, blocked popups, offline mode, and expired sessions.
- [ ] Confirm Drive access can be revoked without affecting the KLEIO account.

## C. Final release verification

- [ ] TypeScript
- [ ] ESLint
- [ ] Production static build
- [ ] Auth and role-isolation audit
- [ ] Universal Media Import audit
- [ ] Upload-to-Passport audit
- [ ] Chrome desktop authenticated flow
- [ ] Safari desktop authenticated flow
- [ ] Firefox desktop authenticated flow
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] Keyboard-only signup and Picker entry
- [ ] VoiceOver or NVDA status and error announcements
- [ ] 200% zoom
- [ ] Reduced motion
- [ ] Mobile keyboard and safe-area behavior

## Activation rule

Do not enable `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` or expose an active Drive card merely because credentials exist. Activate each capability only after its complete redirect, permission, cancellation, and privacy tests pass.

## Merge rule

PR #77 may remain draft while Google configuration and physical testing are incomplete. Mark it ready only when:

1. Authentication and Drive tests above pass.
2. No secrets are committed or exposed in client code.
3. The complete repository verification suite is green.
4. Remaining physical-device gaps are either completed or documented as an explicit limited-beta condition.
