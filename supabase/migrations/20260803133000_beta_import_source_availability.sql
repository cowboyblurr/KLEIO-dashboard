create table if not exists public.kleio_import_source_availability (
  source_type text primary key,
  artist_beta_enabled boolean not null default false,
  artist_label text not null,
  availability_note text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.kleio_import_source_availability enable row level security;

revoke all on table public.kleio_import_source_availability from anon;
revoke all on table public.kleio_import_source_availability from authenticated;
grant select on table public.kleio_import_source_availability to authenticated;

drop policy if exists "Authenticated users can read import source availability" on public.kleio_import_source_availability;
create policy "Authenticated users can read import source availability"
on public.kleio_import_source_availability
for select
to authenticated
using (true);

insert into public.kleio_import_source_availability (source_type, artist_beta_enabled, artist_label, availability_note)
values
  ('google_drive_image', true, 'Google Drive', 'The only active artist-facing beta import source.'),
  ('google_drive_document', true, 'Google Drive', 'Permitted for future Drive document selection within the same verified picker boundary.'),
  ('existing_kleio_media', true, 'KLEIO Media Library', 'Internal reuse only; not presented as a new external import provider.'),
  ('device_image', false, 'Device upload', 'Disabled during the initial artist beta.'),
  ('device_document', false, 'Device upload', 'Disabled during the initial artist beta.'),
  ('instagram_image', false, 'Instagram', 'Coming soon; OAuth and import are disabled during the initial artist beta.'),
  ('website', false, 'Artist website', 'Collector architecture is retained but artist-facing scans are feature-gated during the initial beta.'),
  ('pdf', false, 'PDF upload', 'Direct upload is disabled during the initial artist beta.'),
  ('pasted_text', false, 'Pasted text', 'Direct import is disabled during the initial artist beta.'),
  ('voice_transcript', false, 'Voice transcript', 'Direct import is disabled during the initial artist beta.')
on conflict (source_type) do update
set artist_beta_enabled = excluded.artist_beta_enabled,
    artist_label = excluded.artist_label,
    availability_note = excluded.availability_note,
    updated_at = now();

create or replace function private.enforce_beta_import_source_availability()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  enabled boolean;
begin
  select source.artist_beta_enabled
    into enabled
  from public.kleio_import_source_availability as source
  where source.source_type = new.source_type;

  if enabled is distinct from true then
    raise exception using
      errcode = '42501',
      message = 'import_source_not_available_in_artist_beta';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_beta_import_source_availability() from public;
grant execute on function private.enforce_beta_import_source_availability() to authenticated, service_role;

drop trigger if exists enforce_beta_import_source_availability on public.artist_import_sources;
create trigger enforce_beta_import_source_availability
before insert or update of source_type
on public.artist_import_sources
for each row
execute function private.enforce_beta_import_source_availability();

comment on table public.kleio_import_source_availability is
  'Shared artist-beta availability source of truth for frontend presentation and database-level import enforcement.';
