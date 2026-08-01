# Artist Import Studio — beta configuration and verification

## Implemented behavior

- Email/password artist authentication remains available.
- Google account authentication is added through Supabase Auth.
- Google login does **not** request Google Drive access.
- Drive access is requested only inside Import Studio with `https://www.googleapis.com/auth/drive.file`.
- The Drive token remains in browser memory for the active import session and is not persisted in KLEIO.
- Artists can select JPEG, PNG, and WebP images from Drive or upload them from a device.
- Selected images are copied into the existing private, owner-scoped `artist-assets` bucket.
- Filename, pixel dimensions, embedded JPEG XMP metadata, orientation, and a basic sampled palette are read when available.
- All prepared artwork fields stay editable and retain source/provenance labels.
- No portfolio record is created until the artist selects **Approve and add to Creative Passport**.
- Import progress autosaves locally and to the existing owner-scoped `artist_passport_drafts` table.

## Supabase configuration

In Supabase Authentication → Providers → Google:

1. Enable Google.
2. Add the Google OAuth client ID and client secret.
3. Add the Supabase callback URL shown by the provider configuration to the Google OAuth client.
4. Confirm local, preview, and production KLEIO URLs are in the Supabase redirect allow list.

Do not add Drive scopes to the Supabase provider configuration.

## Google Cloud configuration

1. Configure the OAuth consent screen and approved domains.
2. Create a Web application OAuth client for Google Identity Services.
3. Add KLEIO local, preview, and production origins to **Authorized JavaScript origins**.
4. Enable **Google Picker API** and **Google Drive API**.
5. Create a browser-restricted API key for Google Picker.
6. Restrict the key to KLEIO origins and Google Picker API.
7. Set:

```text
NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID=<web OAuth client ID>
NEXT_PUBLIC_GOOGLE_PICKER_API_KEY=<browser-restricted Picker API key>
NEXT_PUBLIC_GOOGLE_CLOUD_APP_ID=<numeric Google Cloud project/app ID, optional>
```

Never add a Google client secret to a `NEXT_PUBLIC_` variable.

## Database migration

Apply `supabase/migrations/20260801160000_artist_import_studio.sql`. It extends existing owner-scoped tables and does not disable or replace current row-level security policies.

## Manual verification

### Authentication

- Create and confirm an artist account through email.
- Create or open an artist account through Google.
- Confirm both new-account paths open `/artist-dashboard/import/` without overriding a preserved opportunity return intent.
- Confirm Google login does not display a Drive permission request.
- Confirm the existing role boundary prevents an institution account from entering an artist workspace.

### Drive and device import

- Test selecting one file, multiple files, cancelling, denying permission, revoking, and reconnecting.
- Confirm only selected Drive files appear in KLEIO.
- Confirm access tokens never appear in console or analytics.
- Test JPEG, PNG, WebP, descriptive filenames, camera filenames, embedded JPEG metadata, missing metadata, duplicates, corrupt files, and files above 20 MB.
- Confirm generic filenames do not become verified artwork titles.
- Confirm unknown year, dimensions, medium, and meaning remain blank rather than invented.

### Approval and recovery

- Refresh while editing and resume the import.
- Test offline local save and reconnection.
- Confirm stale revision conflicts do not overwrite newer progress.
- Repeat approval and confirm one import source creates at most one portfolio record.
- Confirm closing the dialog does not approve or publish anything.
- Confirm removing an unfinished record deletes its private source and file.

### Accessibility and devices

- Complete the flow with keyboard only.
- Check dialog focus, Escape, focus restoration, visible focus, labels, live save status, and error announcements.
- Test 200% zoom, reduced motion, iPhone Safari, Android Chrome, desktop Safari, Firefox, and Chrome.
- Confirm mobile uses the full viewport and controls remain reachable above the virtual keyboard.

## Honest beta limitations

- Semantic computer-vision descriptions are not enabled. Image assistance is deterministic: embedded metadata, filename interpretation, dimensions/orientation, and sampled palette guidance. This avoids presenting unverified interpretation as fact.
- Drive access is session-scoped. Artists reconnect for a later Drive import; persistent refresh-token storage is intentionally deferred pending a dedicated encrypted-token and revocation review.
- Physical Safari, Firefox, iOS, Android, screen-reader, and interrupted OAuth tests require configured credentials and real devices. Source checks and TypeScript validation cannot substitute for them.
