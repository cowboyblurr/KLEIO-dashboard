-- 001_opportunity_sources_and_index
begin;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

create table if not exists public.kleio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.kleio_admins enable row level security;
revoke all on public.kleio_admins from anon, authenticated;

create or replace function public.is_kleio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.kleio_admins admin_row
    where admin_row.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_kleio_admin() from public, anon;
grant execute on function public.is_kleio_admin() to authenticated, service_role;

create table if not exists public.opportunity_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  base_domain text not null default '',
  source_type text not null check (source_type in ('official_api','provider_submission','kleio_institution','admin_import','licensed_partner','manual_curation')),
  ingestion_method text not null check (ingestion_method in ('api','csv','json','manual','provider_form','internal_creation')),
  license text not null default '',
  commercial_reuse_allowed boolean,
  attribution_required boolean not null default true,
  terms_url text not null default '',
  update_frequency text not null default '',
  active boolean not null default true,
  last_successful_sync timestamptz,
  last_failed_sync timestamptz,
  terms_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.opportunity_sources (
  slug, name, base_domain, source_type, ingestion_method, license,
  commercial_reuse_allowed, attribution_required, terms_url, update_frequency,
  terms_reviewed_at
)
values
  ('grants-gov', 'Grants.gov', 'grants.gov', 'official_api', 'api', 'Official United States federal grants API; use subject to Grants.gov terms and applicable federal data policies.', null, true, 'https://www.grants.gov/api/api-guide', 'daily', now()),
  ('eu-funding-tenders', 'EU Funding & Tenders Portal', 'ec.europa.eu', 'official_api', 'api', 'Official European Commission public REST API; reuse subject to the European Commission legal notice and source terms.', null, true, 'https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/support/apis', 'daily', now()),
  ('kleio-institution', 'KLEIO institutions', '', 'kleio_institution', 'internal_creation', 'Published directly by authenticated KLEIO institutions.', true, false, '', 'immediate', now()),
  ('provider-submission', 'Provider submissions', '', 'provider_submission', 'provider_form', 'Submitted by opportunity providers and published only after KLEIO moderation.', null, true, '', 'immediate', now()),
  ('admin-import', 'KLEIO reviewed imports', '', 'admin_import', 'csv', 'Source-specific terms and attribution are required on every imported record.', null, true, '', 'manual', now())
on conflict (slug) do update set
  name = excluded.name,
  base_domain = excluded.base_domain,
  source_type = excluded.source_type,
  ingestion_method = excluded.ingestion_method,
  license = excluded.license,
  commercial_reuse_allowed = excluded.commercial_reuse_allowed,
  attribution_required = excluded.attribution_required,
  terms_url = excluded.terms_url,
  update_frequency = excluded.update_frequency,
  terms_reviewed_at = excluded.terms_reviewed_at,
  active = true,
  updated_at = now();

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.opportunity_sources(id) on delete restrict,
  external_id text not null,
  internal_call_id uuid unique references public.open_calls(id) on delete cascade,
  canonical_url text not null default '',
  application_url text not null default '',
  guidelines_url text not null default '',
  title text not null,
  provider_name text not null,
  provider_id text not null default '',
  opportunity_type text not null default 'other',
  summary text not null default '',
  description text not null default '',
  disciplines text[] not null default '{}',
  eligible_applicant_types text[] not null default '{}',
  eligible_countries text[] not null default '{}',
  eligible_regions text[] not null default '{}',
  citizenship_requirements text[] not null default '{}',
  residency_requirements text[] not null default '{}',
  career_stages text[] not null default '{}',
  age_min integer,
  age_max integer,
  award_min numeric,
  award_max numeric,
  currency text,
  application_fee numeric,
  deadline_at timestamptz,
  deadline_timezone text not null default '',
  opens_at timestamptz,
  recurring boolean not null default false,
  remote_allowed boolean,
  travel_supported boolean,
  accommodation_supported boolean,
  fiscal_sponsor_allowed boolean,
  language_requirements text[] not null default '{}',
  education_requirements text[] not null default '{}',
  organization_status_requirements text[] not null default '{}',
  previous_award_restrictions text not null default '',
  required_materials text[] not null default '{}',
  participation_format text not null default 'other',
  locations text[] not null default '{}',
  application_mode text not null default 'external' check (application_mode in ('internal','external')),
  status text not null default 'draft' check (status in ('draft','open','forecasted','upcoming','closed','expired','archived')),
  verification_status text not null default 'unreviewed' check (verification_status in ('unreviewed','official_source','provider_published','provider_verified','kleio_reviewed','source_attributed','needs_review','expired')),
  source_published_at timestamptz,
  source_updated_at timestamptz,
  last_verified_at timestamptz,
  duplicate_of uuid references public.opportunities(id) on delete set null,
  search_document tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, external_id),
  check (age_min is null or age_min >= 0),
  check (age_max is null or age_max >= 0),
  check (age_min is null or age_max is null or age_max >= age_min),
  check (award_min is null or award_min >= 0),
  check (award_max is null or award_max >= 0),
  check (award_min is null or award_max is null or award_max >= award_min),
  check (application_fee is null or application_fee >= 0)
);

create or replace function public.refresh_opportunity_search_document()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_document :=
    setweight(to_tsvector('simple', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.provider_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.summary, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.description, '')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.disciplines, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.locations, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.eligible_applicant_types, '{}'), ' ')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.eligible_countries, '{}'), ' ')), 'C');
  return new;
end;
$$;

drop trigger if exists opportunities_search_document on public.opportunities;
create trigger opportunities_search_document
before insert or update of title, provider_name, summary, description, disciplines, locations, eligible_applicant_types, eligible_countries
on public.opportunities
for each row execute function public.refresh_opportunity_search_document();

update public.opportunities set title = title where search_document is null;

create index if not exists opportunities_search_document_idx on public.opportunities using gin (search_document);
create index if not exists opportunities_title_trgm_idx on public.opportunities using gin (title extensions.gin_trgm_ops);
create index if not exists opportunities_provider_trgm_idx on public.opportunities using gin (provider_name extensions.gin_trgm_ops);
create index if not exists opportunities_status_deadline_idx on public.opportunities (status, deadline_at);
create index if not exists opportunities_type_idx on public.opportunities (opportunity_type);
create index if not exists opportunities_source_idx on public.opportunities (source_id);
create index if not exists opportunities_internal_call_idx on public.opportunities (internal_call_id) where internal_call_id is not null;

create table if not exists public.opportunity_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  source_id uuid not null references public.opportunity_sources(id) on delete cascade,
  fetched_at timestamptz not null default now(),
  raw_data jsonb not null default '{}',
  checksum text not null default '',
  is_current boolean not null default true
);

create unique index if not exists opportunity_source_snapshots_current_idx on public.opportunity_source_snapshots(opportunity_id) where is_current;
create index if not exists opportunity_source_snapshots_source_idx on public.opportunity_source_snapshots(source_id, fetched_at desc);
commit;
