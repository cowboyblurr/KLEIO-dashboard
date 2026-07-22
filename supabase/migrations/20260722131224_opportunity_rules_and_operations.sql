-- 002_opportunity_rules_and_operations
begin;
create table if not exists public.opportunity_eligibility_rules (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  rule_type text not null,
  operator text not null check (operator in ('equals','not_equals','in','not_in','contains','overlaps','greater_than_or_equal','less_than_or_equal','is_true','is_false')),
  value jsonb not null default 'null'::jsonb,
  requirement_level text not null default 'required' check (requirement_level in ('required','preferred','informational')),
  source_text text not null default '',
  source_url text not null default '',
  source_field text not null default '',
  extraction_method text not null default 'manual_review' check (extraction_method in ('official_api_field','provider_entered','admin_entered','ai_extracted_unreviewed','ai_extracted_reviewed','manual_review')),
  verification_status text not null default 'unreviewed' check (verification_status in ('unreviewed','confirmed','ambiguous','rejected')),
  last_verified_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists opportunity_eligibility_rules_opportunity_idx on public.opportunity_eligibility_rules(opportunity_id, sort_order);

create table if not exists public.opportunity_requirements (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  material_key text not null,
  label text not null,
  required boolean not null default true,
  source_text text not null default '',
  source_url text not null default '',
  extraction_method text not null default 'manual_review' check (extraction_method in ('official_api_field','provider_entered','admin_entered','ai_extracted_unreviewed','ai_extracted_reviewed','manual_review')),
  verification_status text not null default 'unreviewed' check (verification_status in ('unreviewed','confirmed','ambiguous','rejected')),
  last_verified_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (opportunity_id, material_key)
);
create index if not exists opportunity_requirements_opportunity_idx on public.opportunity_requirements(opportunity_id, sort_order);

create table if not exists public.opportunity_import_jobs (
  id uuid primary key default gen_random_uuid(), source_id uuid references public.opportunity_sources(id) on delete set null,
  job_type text not null default 'sync', status text not null default 'running' check (status in ('running','succeeded','partial','failed')),
  started_at timestamptz not null default now(), completed_at timestamptz,
  fetched_count integer not null default 0, created_count integer not null default 0, updated_count integer not null default 0,
  skipped_count integer not null default 0, duplicate_count integer not null default 0, error_count integer not null default 0,
  error_message text not null default '', metadata jsonb not null default '{}'
);
create index if not exists opportunity_import_jobs_started_idx on public.opportunity_import_jobs(started_at desc);

create table if not exists public.opportunity_sync_errors (
  id uuid primary key default gen_random_uuid(), job_id uuid references public.opportunity_import_jobs(id) on delete cascade,
  source_id uuid references public.opportunity_sources(id) on delete set null, external_id text not null default '', error_code text not null default '',
  error_message text not null, raw_data jsonb not null default '{}', created_at timestamptz not null default now()
);
create index if not exists opportunity_sync_errors_job_idx on public.opportunity_sync_errors(job_id, created_at);

create table if not exists public.institution_opportunity_submissions (
  id uuid primary key default gen_random_uuid(), submitter_user_id uuid not null references auth.users(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade, provider_name text not null, official_website text not null default '',
  contact_name text not null default '', contact_email text not null default '', title text not null, opportunity_type text not null default 'other',
  summary text not null default '', description text not null default '', application_url text not null, guidelines_url text not null default '', source_url text not null,
  deadline_at timestamptz, deadline_timezone text not null default '', payload jsonb not null default '{}',
  moderation_status text not null default 'submitted' check (moderation_status in ('draft','submitted','under_review','changes_requested','approved','rejected','published','expired','archived')),
  provider_verified boolean not null default false, reviewer_user_id uuid references auth.users(id) on delete set null, review_notes text not null default '',
  published_opportunity_id uuid references public.opportunities(id) on delete set null, submitted_at timestamptz not null default now(), reviewed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists institution_opportunity_submissions_submitter_idx on public.institution_opportunity_submissions(submitter_user_id, created_at desc);
create index if not exists institution_opportunity_submissions_status_idx on public.institution_opportunity_submissions(moderation_status, created_at);

alter table public.saved_opportunities add column if not exists id uuid default gen_random_uuid();
alter table public.saved_opportunities add column if not exists opportunity_id uuid references public.opportunities(id) on delete cascade;
alter table public.saved_opportunities drop constraint if exists saved_opportunities_pkey;
alter table public.saved_opportunities alter column call_id drop not null;
alter table public.saved_opportunities alter column id set not null;
alter table public.saved_opportunities add constraint saved_opportunities_pkey primary key (id);
alter table public.saved_opportunities drop constraint if exists saved_opportunities_target_check;
alter table public.saved_opportunities add constraint saved_opportunities_target_check check (num_nonnulls(call_id, opportunity_id) = 1);
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'saved_opportunities_artist_call_key' and conrelid = 'public.saved_opportunities'::regclass) then
    alter table public.saved_opportunities add constraint saved_opportunities_artist_call_key unique (artist_user_id, call_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'saved_opportunities_artist_opportunity_key' and conrelid = 'public.saved_opportunities'::regclass) then
    alter table public.saved_opportunities add constraint saved_opportunities_artist_opportunity_key unique (artist_user_id, opportunity_id);
  end if;
end;
$$;
create index if not exists saved_opportunities_opportunity_idx on public.saved_opportunities(opportunity_id) where opportunity_id is not null;

create table if not exists public.artist_opportunity_tracking (
  id uuid primary key default gen_random_uuid(), artist_user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  status text not null default 'saved' check (status in ('saved','researching','preparing','ready_to_apply','submitted','awarded','not_selected','withdrawn','expired')),
  notes text not null default '', target_date date, self_reported_submitted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (artist_user_id, opportunity_id)
);
create index if not exists artist_opportunity_tracking_user_idx on public.artist_opportunity_tracking(artist_user_id, updated_at desc);

create table if not exists public.artist_opportunity_evaluations (
  id uuid primary key default gen_random_uuid(), artist_user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  eligibility_status text not null check (eligibility_status in ('eligible','likely_eligible','eligibility_unclear','missing_information','not_eligible')),
  relevance_status text not null check (relevance_status in ('strong_relevance','moderate_relevance','limited_relevance','insufficient_information')),
  rule_results jsonb not null default '[]', readiness jsonb not null default '{}', passport_updated_at timestamptz,
  evaluated_at timestamptz not null default now(), unique (artist_user_id, opportunity_id)
);
create index if not exists artist_opportunity_evaluations_user_idx on public.artist_opportunity_evaluations(artist_user_id, evaluated_at desc);

create table if not exists public.opportunity_events (
  id bigint generated always as identity primary key, artist_user_id uuid references auth.users(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  event_name text not null check (event_name in ('search','zero_results','view','save','unsave','external_application_click','internal_application_start','provider_submission')),
  search_query text not null default '', metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create index if not exists opportunity_events_created_idx on public.opportunity_events(created_at desc);
create index if not exists opportunity_events_opportunity_idx on public.opportunity_events(opportunity_id, created_at desc);

alter table public.artist_profiles add column if not exists country_of_residence text;
alter table public.artist_profiles add column if not exists citizenships text[] not null default '{}';
alter table public.artist_profiles add column if not exists state_or_region text;
alter table public.artist_profiles add column if not exists birth_date date;
alter table public.artist_profiles add column if not exists artist_type text;
alter table public.artist_profiles add column if not exists career_stage text;
alter table public.artist_profiles add column if not exists organization_status text;
alter table public.artist_profiles add column if not exists fiscal_sponsor_status text;

update public.artist_profiles
set country_of_residence = coalesce(country_of_residence, nullif(location_data->>'country', '')),
    state_or_region = coalesce(state_or_region, nullif(location_data->>'state_or_region', ''))
where country_of_residence is null or state_or_region is null;

create or replace function public.normalize_material_key(material_label text)
returns text language sql immutable set search_path = ''
as $$
  select case
    when lower(material_label) similar to '%(bio|biography)%' then 'biography'
    when lower(material_label) similar to '%(artist statement|statement)%' then 'artist_statement'
    when lower(material_label) similar to '%(curriculum vitae|cv|résumé|resume)%' then 'cv'
    when lower(material_label) similar to '%(portfolio|work sample)%' then 'portfolio'
    when lower(material_label) similar to '%(project proposal|proposal)%' then 'project_proposal'
    when lower(material_label) similar to '%(budget)%' then 'budget'
    when lower(material_label) similar to '%(timeline|schedule)%' then 'timeline'
    when lower(material_label) similar to '%(reference|recommendation)%' then 'references'
    when lower(material_label) similar to '%(proof of residence|residency proof)%' then 'proof_of_residence'
    when lower(material_label) similar to '%(identification|passport|government id)%' then 'identification'
    else regexp_replace(lower(trim(material_label)), '[^a-z0-9]+', '_', 'g')
  end;
$$;
grant execute on function public.normalize_material_key(text) to anon, authenticated, service_role;
commit;
