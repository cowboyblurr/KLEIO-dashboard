-- KLEIO Universal Media Import System
-- Extends the existing owner-scoped artist_import_sources record into a reusable
-- private media library and adds explicit destination usage associations.

alter table public.artist_import_sources
  drop constraint if exists artist_import_sources_source_type_check,
  drop constraint if exists artist_import_sources_image_mime_check,
  drop constraint if exists artist_import_sources_media_kind_check,
  drop constraint if exists artist_import_sources_library_status_check;

alter table public.artist_import_sources
  add column if not exists media_kind text not null default 'document',
  add column if not exists library_status text not null default 'available',
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists duration_seconds numeric,
  add column if not exists parent_source_id uuid references public.artist_import_sources(id) on delete set null,
  add column if not exists deleted_at timestamptz;

update public.artist_import_sources
set media_kind = case
  when mime_type like 'image/%' then 'image'
  when mime_type like 'video/%' then 'video'
  when mime_type like 'audio/%' then 'audio'
  else 'document'
end
where media_kind = 'document';

alter table public.artist_import_sources
  add constraint artist_import_sources_source_type_check
    check (source_type in (
      'pdf','pasted_text','website','voice_transcript',
      'device_image','google_drive_image',
      'device_document','google_drive_document',
      'existing_kleio_media'
    )),
  add constraint artist_import_sources_image_mime_check
    check (
      source_type not in ('device_image','google_drive_image')
      or mime_type in ('image/jpeg','image/png','image/webp')
    ),
  add constraint artist_import_sources_media_kind_check
    check (media_kind in ('image','document','video','audio')),
  add constraint artist_import_sources_library_status_check
    check (library_status in ('draft','available','attached','archived')),
  add constraint artist_import_sources_dimensions_check
    check ((width is null or width > 0) and (height is null or height > 0)),
  add constraint artist_import_sources_duration_check
    check (duration_seconds is null or duration_seconds >= 0);

create table if not exists public.artist_media_usages (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null references public.artist_import_sources(id) on delete cascade,
  usage_context text not null,
  destination_id text not null default '',
  usage_role text not null default 'primary',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artist_media_usages_context_check check (usage_context in (
    'artist_onboarding','creative_passport','portfolio','profile_image','profile_cover',
    'application_material','application_portfolio_selection','opportunity_requirement',
    'existing_media_library'
  )),
  constraint artist_media_usages_role_check check (usage_role in (
    'primary','detail','cover','profile','cv','supporting_document','application_attachment','selected_work'
  )),
  constraint artist_media_usages_owner_source_unique unique (artist_user_id, source_id, usage_context, destination_id, usage_role)
);

alter table public.artist_media_usages enable row level security;

create policy "artist_media_usages_manage_own"
on public.artist_media_usages
for all
to authenticated
using (
  artist_user_id = (select auth.uid())
  and exists (
    select 1
    from public.artist_import_sources source_row
    where source_row.id = source_id
      and source_row.artist_user_id = (select auth.uid())
  )
)
with check (
  artist_user_id = (select auth.uid())
  and exists (
    select 1
    from public.artist_import_sources source_row
    where source_row.id = source_id
      and source_row.artist_user_id = (select auth.uid())
  )
);

create index if not exists artist_media_usages_owner_context_idx
  on public.artist_media_usages (artist_user_id, usage_context, updated_at desc);

create index if not exists artist_media_usages_source_idx
  on public.artist_media_usages (source_id);

create index if not exists artist_import_sources_library_idx
  on public.artist_import_sources (artist_user_id, library_status, media_kind, created_at desc)
  where deleted_at is null and storage_path <> '';

create index if not exists artist_import_sources_parent_source_idx
  on public.artist_import_sources (parent_source_id)
  where parent_source_id is not null;

comment on table public.artist_media_usages is
  'Owner-scoped associations showing where a private media source is intentionally used. Selecting or uploading a source does not create a usage until the artist confirms the destination action.';
comment on column public.artist_import_sources.library_status is
  'Private media-library lifecycle. This does not imply public visibility or artist approval for a destination.';
comment on column public.artist_import_sources.parent_source_id is
  'Optional relationship for derivatives such as cropped previews while preserving the original source.';
