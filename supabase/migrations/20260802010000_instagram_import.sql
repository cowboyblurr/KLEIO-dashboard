create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.artist_instagram_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  return_url text not null,
  requested_scopes text[] not null default array['instagram_business_basic']::text[],
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  used_at timestamptz
);

create index if not exists artist_instagram_oauth_states_artist_created_idx
  on public.artist_instagram_oauth_states (artist_user_id, created_at desc);

create index if not exists artist_instagram_oauth_states_expiry_idx
  on public.artist_instagram_oauth_states (expires_at)
  where used_at is null;

alter table public.artist_instagram_oauth_states enable row level security;
revoke all on table public.artist_instagram_oauth_states from anon, authenticated;
grant all on table public.artist_instagram_oauth_states to service_role;

create table if not exists public.artist_instagram_connections (
  artist_user_id uuid primary key references auth.users(id) on delete cascade,
  instagram_user_id text not null,
  username text not null default '',
  account_type text not null default '',
  media_count integer,
  access_token_ciphertext text not null,
  access_token_iv text not null,
  token_expires_at timestamptz,
  granted_scopes text[] not null default array['instagram_business_basic']::text[],
  connected_at timestamptz not null default now(),
  refreshed_at timestamptz,
  last_verified_at timestamptz,
  disconnected_at timestamptz,
  last_error_category text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index if not exists artist_instagram_connections_instagram_user_idx
  on public.artist_instagram_connections (instagram_user_id)
  where disconnected_at is null;

alter table public.artist_instagram_connections enable row level security;
revoke all on table public.artist_instagram_connections from anon, authenticated;
grant all on table public.artist_instagram_connections to service_role;

create table if not exists public.artist_instagram_import_drafts (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null unique references public.artist_import_sources(id) on delete cascade,
  provider_media_id text not null,
  draft_fields jsonb not null default '{}'::jsonb,
  provider_metadata jsonb not null default '{}'::jsonb,
  reused_existing_source boolean not null default false,
  status text not null default 'review_ready'
    check (status = any (array['review_ready'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artist_instagram_import_drafts_fields_object
    check (jsonb_typeof(draft_fields) = 'object'),
  constraint artist_instagram_import_drafts_provider_metadata_object
    check (jsonb_typeof(provider_metadata) = 'object')
);

create index if not exists artist_instagram_import_drafts_artist_updated_idx
  on public.artist_instagram_import_drafts (artist_user_id, updated_at desc);

alter table public.artist_instagram_import_drafts enable row level security;

drop policy if exists artist_instagram_import_drafts_select_own on public.artist_instagram_import_drafts;
create policy artist_instagram_import_drafts_select_own
  on public.artist_instagram_import_drafts
  for select
  to authenticated
  using ((select auth.uid()) = artist_user_id);

revoke all on table public.artist_instagram_import_drafts from anon;
revoke insert, update, delete on table public.artist_instagram_import_drafts from authenticated;
grant select on table public.artist_instagram_import_drafts to authenticated;
grant all on table public.artist_instagram_import_drafts to service_role;

create table if not exists public.artist_instagram_import_events (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  instagram_user_id text,
  media_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists artist_instagram_import_events_artist_created_idx
  on public.artist_instagram_import_events (artist_user_id, created_at desc);

alter table public.artist_instagram_import_events enable row level security;

drop policy if exists artist_instagram_import_events_select_own on public.artist_instagram_import_events;
create policy artist_instagram_import_events_select_own
  on public.artist_instagram_import_events
  for select
  to authenticated
  using ((select auth.uid()) = artist_user_id);

revoke all on table public.artist_instagram_import_events from anon;
revoke insert, update, delete on table public.artist_instagram_import_events from authenticated;
grant select on table public.artist_instagram_import_events to authenticated;
grant all on table public.artist_instagram_import_events to service_role;

alter table public.artist_import_sources
  drop constraint if exists artist_import_sources_source_type_check;

alter table public.artist_import_sources
  add constraint artist_import_sources_source_type_check
  check (source_type = any (array[
    'pdf'::text,
    'pasted_text'::text,
    'website'::text,
    'voice_transcript'::text,
    'device_image'::text,
    'google_drive_image'::text,
    'instagram_image'::text,
    'device_document'::text,
    'google_drive_document'::text,
    'existing_kleio_media'::text
  ]));

alter table public.artist_import_sources
  drop constraint if exists artist_import_sources_image_mime_check;

alter table public.artist_import_sources
  add constraint artist_import_sources_image_mime_check
  check (
    source_type <> all (array['device_image'::text, 'google_drive_image'::text, 'instagram_image'::text])
    or mime_type = any (array['image/jpeg'::text, 'image/png'::text, 'image/webp'::text])
  );

create or replace function private.enforce_instagram_import_rights()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.source_type = 'instagram_image' then
    if coalesce(new.provider_file_id, '') = '' then
      raise exception 'instagram_provider_media_id_required';
    end if;
    if coalesce(new.source_metadata ->> 'rights_confirmed_at', '') = '' then
      raise exception 'instagram_import_rights_confirmation_required';
    end if;
    if coalesce(new.source_metadata ->> 'instagram_user_id', '') = '' then
      raise exception 'instagram_connection_provenance_required';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_instagram_import_rights on public.artist_import_sources;
create trigger enforce_instagram_import_rights
before insert or update of source_type, provider_file_id, source_metadata
on public.artist_import_sources
for each row
execute function private.enforce_instagram_import_rights();

revoke all on function private.enforce_instagram_import_rights() from public, anon, authenticated;
grant execute on function private.enforce_instagram_import_rights() to service_role;

comment on table public.artist_instagram_connections is
  'Server-only encrypted Instagram professional-account connections. Browser roles receive no table privileges.';
comment on table public.artist_instagram_oauth_states is
  'Short-lived, one-time OAuth states used by the Instagram Login callback.';
comment on table public.artist_instagram_import_events is
  'Owner-readable operational history for Instagram connection and import actions.';
comment on table public.artist_instagram_import_drafts is
  'Server-written, owner-readable editable review records for selected Instagram media.';
