create table if not exists public.artist_website_import_sessions (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  website_url text not null,
  canonical_url text not null default '',
  status text not null default 'analyzing',
  pages jsonb not null default '[]'::jsonb,
  profile_suggestions jsonb not null default '{}'::jsonb,
  image_candidates jsonb not null default '[]'::jsonb,
  imported_source_ids uuid[] not null default '{}'::uuid[],
  error_code text not null default '',
  extractor_version text not null default 'website_import_v1',
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artist_website_import_sessions_url_check check (website_url ~ '^https://'),
  constraint artist_website_import_sessions_canonical_url_check check (canonical_url = '' or canonical_url ~ '^https://'),
  constraint artist_website_import_sessions_status_check check (
    status = any (array['analyzing','review_ready','importing','completed','failed','expired'])
  ),
  constraint artist_website_import_sessions_pages_array check (jsonb_typeof(pages) = 'array'),
  constraint artist_website_import_sessions_profile_object check (jsonb_typeof(profile_suggestions) = 'object'),
  constraint artist_website_import_sessions_images_array check (jsonb_typeof(image_candidates) = 'array')
);

alter table public.artist_website_import_sessions enable row level security;

revoke all on table public.artist_website_import_sessions from anon;
revoke all on table public.artist_website_import_sessions from authenticated;
grant select, insert, update, delete on table public.artist_website_import_sessions to authenticated;

create policy "Artists can read their website import sessions"
on public.artist_website_import_sessions
for select
to authenticated
using ((select auth.uid()) = artist_user_id);

create policy "Artists can create their website import sessions"
on public.artist_website_import_sessions
for insert
to authenticated
with check ((select auth.uid()) = artist_user_id);

create policy "Artists can update their website import sessions"
on public.artist_website_import_sessions
for update
to authenticated
using ((select auth.uid()) = artist_user_id)
with check ((select auth.uid()) = artist_user_id);

create policy "Artists can delete their website import sessions"
on public.artist_website_import_sessions
for delete
to authenticated
using ((select auth.uid()) = artist_user_id);

create index if not exists artist_website_import_sessions_owner_updated_idx
  on public.artist_website_import_sessions (artist_user_id, updated_at desc);

create index if not exists artist_website_import_sessions_expiry_idx
  on public.artist_website_import_sessions (expires_at)
  where status not in ('completed', 'expired');
