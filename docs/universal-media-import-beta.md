# KLEIO Universal Media Import System — beta implementation

## Product direction

KLEIO media import is no longer treated as a signup-only task. The same private media foundation now supports onboarding, the Creative Passport, visual portfolio building, profile-image selection, application preparation, and reuse through the KLEIO Media Library.

The system follows one rule:

> Choosing or uploading media is not approval, attachment, publication, or submission. A destination changes only after an artist confirms the context-specific action.

## Implemented architecture

### Shared contexts

The media configuration layer defines:

- artist onboarding
- Creative Passport
- portfolio
- profile image
- profile cover preparation
- application material
- application portfolio selection
- opportunity requirement
- existing KLEIO media

Each context controls:

- accepted MIME types
- file-size limit
- selection count
- single or multiple selection
- available sources
- destination language
- explicit confirmation requirement
- usage role

### Source adapters

Implemented beta adapters:

- device upload
- Google Drive Picker
- private KLEIO Media Library

Prepared but intentionally unavailable:

- Instagram Professional Account

The Instagram source is presented only as planned. No Meta OAuth, media read permission, personal-account access, or working import is claimed.

### Quick Import

Quick Import is used for narrow media actions such as:

- choosing a profile image
- choosing a Creative Passport CV
- adding a requirement file to an application workspace
- selecting existing private media

It uses a compact source-and-review dialog and does not expose artwork metadata fields unless the destination requires them.

### Full artwork Import Studio

The existing artwork-specific Import Studio remains the full experience for:

- importing multiple artwork images
- deterministic filename and embedded-metadata preparation
- reviewing field provenance
- correcting artwork records
- explicit approval into the portfolio
- autosaved interruption recovery

The full Studio and Quick Import share the same private storage and canonical source records, but the full artwork editor has not been generalized into a single universal renderer for documents, video, and audio.

## Visual portfolio experience

The former live portfolio page began with a long metadata form. It is replaced by an image-first studio:

1. Choose images from device, Drive, or the KLEIO Library.
2. See every selected image immediately in a visual tray.
3. Review one work at a time at large scale.
4. Add title, year, medium, and dimensions first.
5. Expand description, series, keywords, and accessibility text only when useful.
6. Explicitly approve the work into the portfolio.
7. Browse approved works in a visual grid and open a focused editor from each work card.

Removing a portfolio record no longer automatically destroys a reusable canonical media item. The private file can remain available in the artist’s KLEIO Media Library.

## Private KLEIO Media Library

The existing owner-scoped `artist_import_sources` table is the canonical private source record. This avoids introducing a competing media-asset model.

The library provides:

- private image and document previews
- search by artwork title or filename
- image, document, approved-work, and unattached filters
- source information
- usage counts
- associated artwork information
- safe archive for unused media
- reuse without another storage copy

Legacy portfolio images without a canonical source record remain visible as existing portfolio media. They are not silently copied or rewritten.

## Destination usage records

`artist_media_usages` records an artist-confirmed association between a canonical private source and a destination.

Supported usage contexts include:

- portfolio primary image
- profile image
- Creative Passport CV
- application material
- application-selected work
- other prepared contexts

The table is owner scoped with row-level security. A usage can be created only when the source belongs to the authenticated artist.

## Google Drive model

Google account authentication and Google Drive permission remain separate.

The Drive adapter:

- requests `https://www.googleapis.com/auth/drive.file`
- opens Google Picker only after the artist chooses Drive
- filters by the current destination’s MIME types
- respects single or multiple selection limits
- copies only selected files into private KLEIO storage
- does not persist the access token
- revokes the session token after the selection flow
- preserves existing KLEIO state when authorization fails or is cancelled

Configured Google credentials are still required before authenticated end-to-end testing.

## Device validation

Shared device and Drive files are checked for:

- destination MIME allowlist
- file-size limit
- non-empty content
- JPEG, PNG, WebP, or PDF byte signature
- SHA-256 duplicate checksum
- safe private storage path

A file extension alone is not trusted.

## Creative Passport integration

The Creative Passport now exposes:

- the full artwork Import Studio
- a PDF-only Quick Import for CV selection
- reuse of an existing private KLEIO PDF

Attaching the CV updates the artist profile only after confirmation and records the media usage.

The previous text/PDF proposal-extraction mode remains available for preparing editable Passport content. It is separate from universal media selection.

## Profile integration

Profile-image selection now uses Quick Import:

- device upload
- Google Drive
- KLEIO Media Library

The current profile image remains unchanged until confirmation. Replaced canonical media is returned to an available private-library state rather than deleted automatically.

Profile cropping/positioning remains handled by the existing presentation fields. A dedicated visual crop editor was not added in this scope.

## Application integration

Application preparation now exposes contextual actions to:

- import a missing artwork through the full artwork Studio
- add a private requirement file from device, Drive, or KLEIO Library
- keep imported material associated with the application or opportunity context

Existing approved portfolio works remain the primary source for application work selection.

Current beta limitation:

- the generic requirement-file usage is recorded privately, but the current application package manifest and external-submission export do not yet embed arbitrary uploaded document files as actual transmitted attachments.
- KLEIO does not claim that an application requirement is satisfied merely because a file was added to the private workspace.
- opportunity-specific MIME, size, and count rules must be passed into Quick Import from structured requirement data before this can be treated as complete requirement-aware attachment enforcement.

## Privacy and visibility

- media is stored in the private `artist-assets` bucket
- storage paths remain owner scoped
- media-library and usage records use owner-scoped RLS
- institutions cannot browse an artist’s private media library
- institutions can read portfolio works only through existing authorized application-selection policies
- provider tokens are not written to analytics or browser storage
- selection alone never publishes or submits media

## Database changes

Migration:

`supabase/migrations/20260801183000_universal_media_import.sql`

It extends `artist_import_sources` with:

- media kind
- library status
- dimensions and duration
- derivative parent relationship
- archived/deleted timestamp

It creates:

- `artist_media_usages`
- owner-scoped RLS policy
- source, context, library, and derivative indexes

The migration was applied to the connected KLEIO Supabase project.

## Verification gates

Automated gates include:

- TypeScript
- ESLint and production build through the existing KLEIO verification workflow
- existing auth and role-isolation audits
- original Artist Import Studio audit
- universal media architecture audit
- navigation and public-copy regression audits
- Supabase security and performance advisor review

## Remaining manual testing

Still required before removing draft status:

- configured Google authentication and Picker credentials
- authenticated Drive selection and revocation
- desktop Chrome, Safari, and Firefox
- physical iPhone Safari
- physical Android Chrome
- keyboard-only Quick Import and visual portfolio creation
- VoiceOver and NVDA
- 200% zoom
- reduced motion
- mobile virtual keyboard and safe-area behavior
- offline, refresh, expired session, interrupted OAuth, and draft-conflict walkthroughs
- large private media-library performance with real artist data

## Beta verdict

**Ready with documented configuration and integration gaps.**

The shared media foundation, private library, visual portfolio, profile Quick Import, Passport CV reuse, and contextual application entry points are implemented. Google credentials and physical accessibility/device testing remain required. Instagram is not implemented. Generic application documents are private reusable media associations, not yet complete transmitted attachments.
