begin;

alter table public.artist_profiles
  add column if not exists profile_image_path text,
  add column if not exists profile_image_position_x smallint not null default 50,
  add column if not exists profile_image_position_y smallint not null default 50;

alter table public.artist_profiles
  drop constraint if exists artist_profiles_profile_image_position_x_check,
  drop constraint if exists artist_profiles_profile_image_position_y_check;

alter table public.artist_profiles
  add constraint artist_profiles_profile_image_position_x_check check (profile_image_position_x between 0 and 100),
  add constraint artist_profiles_profile_image_position_y_check check (profile_image_position_y between 0 and 100);

alter table public.opportunities
  add column if not exists source_language text not null default 'en';

alter table public.opportunities
  drop constraint if exists opportunities_source_language_check;

alter table public.opportunities
  add constraint opportunities_source_language_check check (source_language ~ '^[a-z]{2,3}(-[A-Z]{2})?$');

update public.opportunities
set source_language = 'es'
where external_id = any(array[
  'spain-icaa-screenwriting-2026',
  'ibermusicas-2026-arts-council-england',
  'mexico-carlos-fuentes-2026',
  'mexico-fonart-gran-premio-2026',
  'mexico-fonart-grandes-maestros-2026',
  'spain-icaa-feature-production-905549',
  'mexico-fonart-nacimientos-2026',
  'ibermusicas-2026-especializacion',
  'ibermusicas-2026-proyectos-virtuales',
  'ibermusicas-2026-repertorio',
  'ibermusicas-2026-mid-atlantic-arts',
  'ibermusicas-2026-emilia-romagna',
  'ibermusicas-2026-canciones',
  'ibermusicas-2026-circulacion',
  'ibermusicas-2026-sinfonica',
  'ibermusicas-2026-canciones-infancias',
  'ibermusicas-2026-programacion',
  'ibermusicas-2026-artistas-residencias',
  'ibermusicas-2026-instituciones-residencias',
  'spain-icaa-film-festivals-2026'
]);

create table if not exists public.opportunity_translations (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  locale text not null,
  source_language text not null,
  title text not null default '',
  summary text not null default '',
  description text not null default '',
  required_materials text[] not null default '{}',
  requirement_translations jsonb not null default '{}'::jsonb,
  source_content_hash text not null,
  translation_method text not null default 'human_reviewed_seed',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (opportunity_id, locale),
  constraint opportunity_translations_locale_check check (locale in ('en', 'es')),
  constraint opportunity_translations_language_check check (source_language ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  constraint opportunity_translations_method_check check (translation_method in ('human_reviewed_seed', 'human_reviewed', 'machine_review_required'))
);

create index if not exists opportunity_translations_opportunity_locale_idx
  on public.opportunity_translations (opportunity_id, locale);

alter table public.opportunity_translations enable row level security;

drop policy if exists "opportunity_translations_anon_read" on public.opportunity_translations;
create policy "opportunity_translations_anon_read"
on public.opportunity_translations
for select
to anon
using (
  exists (
    select 1 from public.opportunities opportunity_row
    where opportunity_row.id = opportunity_translations.opportunity_id
      and opportunity_row.status in ('open', 'forecasted', 'upcoming')
      and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
      and opportunity_row.duplicate_of is null
  )
);

drop policy if exists "opportunity_translations_authenticated_read" on public.opportunity_translations;
create policy "opportunity_translations_authenticated_read"
on public.opportunity_translations
for select
to authenticated
using (
  public.is_kleio_admin()
  or exists (
    select 1 from public.opportunities opportunity_row
    where opportunity_row.id = opportunity_translations.opportunity_id
      and opportunity_row.status in ('open', 'forecasted', 'upcoming')
      and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
      and opportunity_row.duplicate_of is null
  )
);

grant select on public.opportunity_translations to anon, authenticated;
grant insert, update, delete on public.opportunity_translations to authenticated;

-- The private artist-assets bucket remains private. Owners may delete their own files.
drop policy if exists "artist_assets_delete_own" on storage.objects;
create policy "artist_assets_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'artist-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

commit;
