-- Normalize real-world entities and controlled KLEIO form values.
-- Applied to the connected KLEIO Supabase project on 2026-07-16.

create schema if not exists private;
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

create or replace function private.normalize_entity_name(input text)
returns text language sql immutable set search_path = ''
as $$ select lower(regexp_replace(trim(coalesce(input, '')), '[^[:alnum:]]+', '', 'g')); $$;

alter table public.artist_profiles add column if not exists location_data jsonb not null default '{}'::jsonb;
alter table public.open_calls add column if not exists location_data jsonb not null default '{}'::jsonb;
alter table public.institutions
  add column if not exists display_name text not null default '',
  add column if not exists provider text,
  add column if not exists provider_place_id text,
  add column if not exists source_mode text not null default 'manual',
  add column if not exists normalized_name text not null default '',
  add column if not exists entity_type text not null default '',
  add column if not exists location_data jsonb not null default '{}'::jsonb,
  add column if not exists provider_selected boolean not null default false,
  add column if not exists manually_entered boolean not null default true,
  add column if not exists user_adjusted boolean not null default false,
  add column if not exists possible_duplicate_ids uuid[] not null default '{}',
  add column if not exists duplicate_review_status text not null default 'none';

update public.institutions set display_name = coalesce(nullif(display_name, ''), name), normalized_name = private.normalize_entity_name(coalesce(nullif(display_name, ''), name));

alter table public.institutions drop constraint if exists institutions_source_mode_check;
alter table public.institutions add constraint institutions_source_mode_check check (source_mode in ('kleio_existing', 'external_provider', 'manual'));
alter table public.institutions drop constraint if exists institutions_duplicate_review_status_check;
alter table public.institutions add constraint institutions_duplicate_review_status_check check (duplicate_review_status in ('none', 'possible_duplicate', 'reviewed_distinct', 'merged'));
alter table public.institutions drop constraint if exists institutions_organization_type_check;
alter table public.institutions add constraint institutions_organization_type_check check (organization_type in ('museum', 'gallery', 'arts_nonprofit', 'foundation', 'residency', 'university_college', 'cultural_organization', 'government_arts_agency', 'independent_curatorial_organization', 'festival_biennial', 'artist_run_organization', 'other'));
alter table public.open_calls drop constraint if exists open_calls_opportunity_type_check;
alter table public.open_calls add constraint open_calls_opportunity_type_check check (opportunity_type in ('open_call', 'grant', 'residency', 'exhibition', 'commission', 'fellowship', 'prize_award', 'public_art', 'acquisition', 'research', 'professional_development', 'other'));
alter table public.open_calls drop constraint if exists open_calls_participation_format_check;
alter table public.open_calls add constraint open_calls_participation_format_check check (participation_format in ('in_person', 'online', 'hybrid', 'other'));
alter table public.institution_members drop constraint if exists institution_members_role_check;
alter table public.institution_members add constraint institution_members_role_check check (role in ('administrator', 'program_manager', 'reviewer', 'committee_chair', 'curator', 'final_decision_maker', 'observer', 'other'));
alter table public.institution_members drop constraint if exists institution_members_status_check;
alter table public.institution_members add constraint institution_members_status_check check (status in ('invited', 'active', 'inactive'));
alter table public.reviews drop constraint if exists reviews_recommendation_check;
alter table public.reviews add constraint reviews_recommendation_check check (recommendation in ('', 'advance', 'discuss', 'decline', 'abstain'));
alter table public.reviews drop constraint if exists reviews_review_status_check;
alter table public.reviews add constraint reviews_review_status_check check (review_status in ('not_started', 'in_progress', 'completed'));

create table if not exists public.institution_search_index (
  institution_id uuid primary key references public.institutions(id) on delete cascade,
  display_name text not null,
  normalized_name text not null,
  organization_type text not null,
  city text,
  state_or_region text,
  country text,
  country_code text,
  formatted_address text,
  provider text,
  provider_place_id text,
  entity_type text,
  duplicate_review_status text not null default 'none',
  updated_at timestamptz not null default now()
);
alter table public.institution_search_index enable row level security;
revoke all on public.institution_search_index from public;
grant select on public.institution_search_index to anon, authenticated;
drop policy if exists institution_search_index_public_read on public.institution_search_index;
create policy institution_search_index_public_read on public.institution_search_index for select to anon, authenticated using (true);

create index if not exists institution_search_name_trgm_idx on public.institution_search_index using gin (normalized_name extensions.gin_trgm_ops);
create index if not exists institution_search_country_idx on public.institution_search_index(country_code, organization_type);
create index if not exists artist_profiles_location_country_idx on public.artist_profiles ((location_data ->> 'country_code'));
create index if not exists institutions_location_country_idx on public.institutions ((location_data ->> 'country_code'));
create index if not exists open_calls_location_country_idx on public.open_calls ((location_data ->> 'country_code'));

create or replace function private.prepare_institution_entity()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare candidates uuid[];
begin
  new.display_name := coalesce(nullif(trim(new.display_name), ''), trim(new.name));
  new.name := new.display_name;
  new.normalized_name := private.normalize_entity_name(new.display_name);
  new.provider_selected := new.source_mode = 'external_provider';
  new.manually_entered := new.source_mode = 'manual';
  select coalesce(array_agg(i.institution_id order by extensions.similarity(i.normalized_name, new.normalized_name) desc), '{}'::uuid[])
    into candidates
    from public.institution_search_index i
   where i.institution_id <> new.id
     and new.normalized_name <> ''
     and (i.normalized_name = new.normalized_name or extensions.similarity(i.normalized_name, new.normalized_name) >= 0.72 or (new.provider_place_id is not null and i.provider_place_id = new.provider_place_id))
     and (coalesce(new.location_data ->> 'country_code', '') = '' or coalesce(i.country_code, '') = '' or upper(i.country_code) = upper(new.location_data ->> 'country_code'));
  new.possible_duplicate_ids := candidates;
  if cardinality(candidates) > 0 and new.duplicate_review_status in ('none', 'possible_duplicate') then new.duplicate_review_status := 'possible_duplicate';
  elsif cardinality(candidates) = 0 and new.duplicate_review_status = 'possible_duplicate' then new.duplicate_review_status := 'none'; end if;
  return new;
end; $$;

create or replace function private.sync_institution_search_index()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then delete from public.institution_search_index where institution_id = old.id; return old; end if;
  insert into public.institution_search_index (institution_id, display_name, normalized_name, organization_type, city, state_or_region, country, country_code, formatted_address, provider, provider_place_id, entity_type, duplicate_review_status, updated_at)
  values (new.id, coalesce(nullif(new.display_name, ''), new.name), new.normalized_name, new.organization_type, nullif(new.location_data ->> 'city', ''), nullif(new.location_data ->> 'state_or_region', ''), nullif(new.location_data ->> 'country', ''), nullif(upper(new.location_data ->> 'country_code'), ''), nullif(new.location_data ->> 'formatted_address', ''), new.provider, new.provider_place_id, new.entity_type, new.duplicate_review_status, now())
  on conflict (institution_id) do update set display_name = excluded.display_name, normalized_name = excluded.normalized_name, organization_type = excluded.organization_type, city = excluded.city, state_or_region = excluded.state_or_region, country = excluded.country, country_code = excluded.country_code, formatted_address = excluded.formatted_address, provider = excluded.provider, provider_place_id = excluded.provider_place_id, entity_type = excluded.entity_type, duplicate_review_status = excluded.duplicate_review_status, updated_at = now();
  return new;
end; $$;

revoke all on function private.normalize_entity_name(text) from public, anon, authenticated;
revoke all on function private.prepare_institution_entity() from public, anon, authenticated;
revoke all on function private.sync_institution_search_index() from public, anon, authenticated;

drop trigger if exists institutions_prepare_entity on public.institutions;
create trigger institutions_prepare_entity before insert or update of name, display_name, provider, provider_place_id, source_mode, location_data on public.institutions for each row execute function private.prepare_institution_entity();
drop trigger if exists institutions_sync_search_index on public.institutions;
create trigger institutions_sync_search_index after insert or update of name, display_name, normalized_name, organization_type, location_data, provider, provider_place_id, entity_type, duplicate_review_status or delete on public.institutions for each row execute function private.sync_institution_search_index();
