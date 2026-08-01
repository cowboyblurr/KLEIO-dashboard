-- Artist Import Studio: artwork provenance, explicit approval, and provider traceability.
-- This extends existing owner-scoped import and portfolio tables without weakening RLS.

alter table public.artist_import_sources
  drop constraint if exists artist_import_sources_source_type_check,
  drop constraint if exists artist_import_sources_extraction_status_check,
  drop constraint if exists artist_import_sources_byte_size_check,
  drop constraint if exists artist_import_sources_image_mime_check;

alter table public.artist_import_sources
  add constraint artist_import_sources_source_type_check
    check (source_type in ('pdf','pasted_text','website','voice_transcript','device_image','google_drive_image')),
  add constraint artist_import_sources_extraction_status_check
    check (extraction_status in ('pending','processing','completed','partial','source_unavailable','failed','review_ready','approved')),
  add constraint artist_import_sources_byte_size_check
    check (byte_size is null or (byte_size >= 0 and byte_size <= 20971520)),
  add constraint artist_import_sources_image_mime_check
    check (
      source_type not in ('device_image','google_drive_image')
      or mime_type in ('image/jpeg','image/png','image/webp')
    );

alter table public.artist_import_sources
  add column if not exists provider_file_id text,
  add column if not exists original_filename text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb;

alter table public.artist_import_sources
  drop constraint if exists artist_import_sources_source_metadata_object;
alter table public.artist_import_sources
  add constraint artist_import_sources_source_metadata_object
  check (jsonb_typeof(source_metadata) = 'object');

alter table public.portfolio_works
  add column if not exists import_source_id uuid references public.artist_import_sources(id) on delete set null,
  add column if not exists accessibility_alt_text text not null default '',
  add column if not exists field_provenance jsonb not null default '{}'::jsonb,
  add column if not exists approval_status text not null default 'approved';

alter table public.portfolio_works
  drop constraint if exists portfolio_works_field_provenance_object;
alter table public.portfolio_works
  add constraint portfolio_works_field_provenance_object
  check (jsonb_typeof(field_provenance) = 'object');

alter table public.portfolio_works
  drop constraint if exists portfolio_works_approval_status_check;
alter table public.portfolio_works
  add constraint portfolio_works_approval_status_check
  check (approval_status = 'approved');

create unique index if not exists portfolio_works_import_source_unique
  on public.portfolio_works (import_source_id)
  where import_source_id is not null;

comment on column public.artist_import_sources.provider_file_id is
  'Provider-specific file identifier retained only for traceability and duplicate prevention; never exposed as artist-facing content.';
comment on column public.artist_import_sources.original_filename is
  'Original source filename. A filename is evidence for a suggestion, not a verified artwork title.';
comment on column public.artist_import_sources.source_metadata is
  'Sanitized technical and embedded metadata read from the artist-selected file. Missing metadata remains missing.';
comment on column public.portfolio_works.import_source_id is
  'Artist-approved source record that produced this portfolio work. One source can become at most one approved portfolio record.';
comment on column public.portfolio_works.accessibility_alt_text is
  'Artist-reviewed accessibility description for the artwork image.';
comment on column public.portfolio_works.field_provenance is
  'Per-field extracted, suggested, edited, and confirmed provenance shown during artist review.';
comment on column public.portfolio_works.approval_status is
  'Only explicitly artist-approved import records are written to portfolio_works.';
