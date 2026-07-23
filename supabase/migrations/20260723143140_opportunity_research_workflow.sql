create table if not exists public.opportunity_research_sessions (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','running','succeeded','partial','failed','cancelled')),
  current_stage text not null default 'queued',
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  source_count integer not null default 0 check (source_count >= 0),
  verified_requirement_count integer not null default 0 check (verified_requirement_count >= 0),
  unresolved_count integer not null default 0 check (unresolved_count >= 0),
  error_message text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.opportunity_research_steps (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.opportunity_research_sessions(id) on delete cascade,
  step_key text not null,
  label text not null,
  status text not null default 'queued' check (status in ('queued','running','completed','skipped','blocked','failed')),
  user_message text not null default '',
  sort_order integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, step_key)
);

create table if not exists public.opportunity_research_sources (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.opportunity_research_sessions(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  url text not null,
  title text not null default '',
  source_role text not null default 'supporting' check (source_role in ('application_portal','official_listing','guidelines','faq','organization','verified_profile','directory','supporting')),
  authority_status text not null default 'other' check (authority_status in ('official','organization','verified_profile','trusted_directory','other')),
  access_status text not null default 'pending' check (access_status in ('pending','fetched','blocked','unavailable','unsupported','error')),
  content_type text not null default '',
  http_status integer,
  source_date timestamptz,
  checked_at timestamptz not null default now(),
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (session_id, url)
);

create table if not exists public.opportunity_research_findings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.opportunity_research_sessions(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  finding_type text not null check (finding_type in ('requirement','eligibility','deadline','fee','submission_method','contact','unresolved')),
  normalized_key text not null default '',
  label text not null,
  original_text text not null default '',
  normalized_value jsonb not null default '{}'::jsonb,
  confidence_status text not null default 'unresolved' check (confidence_status in ('verified','corroborated','likely','unresolved','outdated')),
  confidence_score numeric check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1)),
  source_url text not null default '',
  source_title text not null default '',
  official_source boolean not null default false,
  accepted boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.opportunity_requirements add column if not exists source_title text not null default '';
alter table public.opportunity_requirements add column if not exists source_date timestamptz;
alter table public.opportunity_requirements add column if not exists retrieved_at timestamptz;
alter table public.opportunity_requirements add column if not exists confidence_status text not null default 'unresolved';
alter table public.opportunity_requirements add column if not exists confidence_reason text not null default '';
alter table public.opportunity_requirements add column if not exists normalized_interpretation text not null default '';
alter table public.opportunity_requirements add column if not exists research_session_id uuid;

alter table public.opportunity_requirements drop constraint if exists opportunity_requirements_confidence_status_check;
alter table public.opportunity_requirements add constraint opportunity_requirements_confidence_status_check
  check (confidence_status in ('verified','corroborated','likely','unresolved','outdated'));

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'opportunity_requirements_research_session_id_fkey'
  ) then
    alter table public.opportunity_requirements
      add constraint opportunity_requirements_research_session_id_fkey
      foreign key (research_session_id) references public.opportunity_research_sessions(id) on delete set null;
  end if;
end $$;

update public.opportunity_requirements
set confidence_status = case
  when verification_status = 'confirmed' then 'verified'
  when verification_status = 'ambiguous' then 'likely'
  else 'unresolved'
end,
retrieved_at = coalesce(retrieved_at, last_verified_at, created_at)
where confidence_status = 'unresolved' or retrieved_at is null;

create index if not exists opportunity_research_sessions_artist_created_idx
  on public.opportunity_research_sessions (artist_user_id, created_at desc);
create index if not exists opportunity_research_sessions_opportunity_created_idx
  on public.opportunity_research_sessions (opportunity_id, created_at desc);
create index if not exists opportunity_research_steps_session_sort_idx
  on public.opportunity_research_steps (session_id, sort_order);
create index if not exists opportunity_research_sources_session_idx
  on public.opportunity_research_sources (session_id, checked_at desc);
create index if not exists opportunity_research_findings_session_idx
  on public.opportunity_research_findings (session_id, created_at);
create index if not exists opportunity_research_findings_opportunity_idx
  on public.opportunity_research_findings (opportunity_id, finding_type);
create index if not exists opportunity_requirements_research_session_idx
  on public.opportunity_requirements (research_session_id) where research_session_id is not null;

alter table public.opportunity_research_sessions enable row level security;
alter table public.opportunity_research_steps enable row level security;
alter table public.opportunity_research_sources enable row level security;
alter table public.opportunity_research_findings enable row level security;

drop policy if exists "Artists read own opportunity research sessions" on public.opportunity_research_sessions;
create policy "Artists read own opportunity research sessions"
on public.opportunity_research_sessions for select
to authenticated
using ((select auth.uid()) = artist_user_id);

drop policy if exists "Artists create own opportunity research sessions" on public.opportunity_research_sessions;
create policy "Artists create own opportunity research sessions"
on public.opportunity_research_sessions for insert
to authenticated
with check ((select auth.uid()) = artist_user_id);

drop policy if exists "Artists update own opportunity research sessions" on public.opportunity_research_sessions;
create policy "Artists update own opportunity research sessions"
on public.opportunity_research_sessions for update
to authenticated
using ((select auth.uid()) = artist_user_id)
with check ((select auth.uid()) = artist_user_id);

drop policy if exists "Artists delete own queued opportunity research sessions" on public.opportunity_research_sessions;
create policy "Artists delete own queued opportunity research sessions"
on public.opportunity_research_sessions for delete
to authenticated
using ((select auth.uid()) = artist_user_id and status in ('queued','failed','cancelled'));

drop policy if exists "Artists read own opportunity research steps" on public.opportunity_research_steps;
create policy "Artists read own opportunity research steps"
on public.opportunity_research_steps for select
to authenticated
using (exists (
  select 1 from public.opportunity_research_sessions session_row
  where session_row.id = opportunity_research_steps.session_id
    and session_row.artist_user_id = (select auth.uid())
));

drop policy if exists "Artists read own opportunity research sources" on public.opportunity_research_sources;
create policy "Artists read own opportunity research sources"
on public.opportunity_research_sources for select
to authenticated
using (exists (
  select 1 from public.opportunity_research_sessions session_row
  where session_row.id = opportunity_research_sources.session_id
    and session_row.artist_user_id = (select auth.uid())
));

drop policy if exists "Artists read own opportunity research findings" on public.opportunity_research_findings;
create policy "Artists read own opportunity research findings"
on public.opportunity_research_findings for select
to authenticated
using (exists (
  select 1 from public.opportunity_research_sessions session_row
  where session_row.id = opportunity_research_findings.session_id
    and session_row.artist_user_id = (select auth.uid())
));

drop trigger if exists set_opportunity_research_sessions_updated_at on public.opportunity_research_sessions;
create trigger set_opportunity_research_sessions_updated_at
before update on public.opportunity_research_sessions
for each row execute function public.set_updated_at();

drop trigger if exists set_opportunity_research_steps_updated_at on public.opportunity_research_steps;
create trigger set_opportunity_research_steps_updated_at
before update on public.opportunity_research_steps
for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.opportunity_research_sessions to authenticated;
grant select on public.opportunity_research_steps to authenticated;
grant select on public.opportunity_research_sources to authenticated;
grant select on public.opportunity_research_findings to authenticated;
