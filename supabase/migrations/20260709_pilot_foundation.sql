-- KLEIO / Kleira pilot foundation schema
-- Scope: smallest backend spine for one controlled pilot workflow.
-- This is not the final production schema.

create extension if not exists "pgcrypto";

create type public.kleira_user_role as enum (
  'artist',
  'institution_admin',
  'reviewer',
  'committee'
);

create type public.program_status as enum (
  'draft',
  'open',
  'closed',
  'in_review',
  'final_selection',
  'complete'
);

create type public.application_status as enum (
  'draft',
  'submitted',
  'incomplete',
  'pending_info',
  'in_review',
  'needs_discussion',
  'pending_vote',
  'shortlisted',
  'accepted',
  'declined',
  'withdrawn'
);

create type public.review_status as enum (
  'assigned',
  'in_review',
  'draft_saved',
  'submitted',
  'needs_discussion'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.kleira_user_role not null,
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  location text,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.institution_members (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.kleira_user_role not null,
  created_at timestamptz not null default now(),
  unique (institution_id, user_id)
);

create table public.artist_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null,
  location text,
  discipline text,
  website text,
  instagram text,
  short_bio text,
  artist_statement text,
  cv_url text,
  portfolio_url text,
  mediums text[] default '{}',
  themes text[] default '{}',
  tags text[] default '{}',
  passport_completeness int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  title text not null,
  description text,
  eligibility text,
  status public.program_status not null default 'draft',
  deadline timestamptz,
  review_start timestamptz,
  decision_date timestamptz,
  required_materials text[] default '{}',
  application_questions jsonb not null default '[]'::jsonb,
  rubric jsonb not null default '[]'::jsonb,
  public_slug text unique,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  artist_profile_id uuid not null references public.artist_profiles(id) on delete cascade,
  status public.application_status not null default 'draft',
  project_title text,
  answers jsonb not null default '{}'::jsonb,
  materials jsonb not null default '{}'::jsonb,
  missing_materials text[] default '{}',
  readiness_score int not null default 0,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, artist_profile_id)
);

create table public.reviewer_assignments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  status public.review_status not null default 'assigned',
  due_at timestamptz,
  created_at timestamptz not null default now(),
  unique (application_id, reviewer_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.reviewer_assignments(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  rubric_scores jsonb not null default '{}'::jsonb,
  score numeric,
  recommendation text,
  note text,
  status public.review_status not null default 'draft_saved',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  target text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.assist_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  application_id uuid references public.applications(id) on delete cascade,
  job_type text not null,
  status text not null default 'draft',
  input_summary text,
  output jsonb not null default '{}'::jsonb,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.report_drafts (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  created_by uuid references public.profiles(id),
  title text not null,
  body jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.institutions enable row level security;
alter table public.institution_members enable row level security;
alter table public.artist_profiles enable row level security;
alter table public.programs enable row level security;
alter table public.applications enable row level security;
alter table public.reviewer_assignments enable row level security;
alter table public.reviews enable row level security;
alter table public.activity_log enable row level security;
alter table public.assist_jobs enable row level security;
alter table public.report_drafts enable row level security;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "Artists can manage own artist profile"
on public.artist_profiles
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Institution members can read memberships"
on public.institution_members
for select
to authenticated
using (user_id = auth.uid());

create policy "Institution members can read their institutions"
on public.institutions
for select
to authenticated
using (
  exists (
    select 1
    from public.institution_members im
    where im.institution_id = institutions.id
      and im.user_id = auth.uid()
  )
);

create policy "Institution admins can manage their institutions"
on public.institutions
for all
to authenticated
using (
  exists (
    select 1
    from public.institution_members im
    where im.institution_id = institutions.id
      and im.user_id = auth.uid()
      and im.role in ('institution_admin', 'committee')
  )
)
with check (
  created_by = auth.uid()
  or exists (
    select 1
    from public.institution_members im
    where im.institution_id = institutions.id
      and im.user_id = auth.uid()
      and im.role in ('institution_admin', 'committee')
  )
);

create policy "Institution members can read programs"
on public.programs
for select
to authenticated
using (
  status = 'open'
  or exists (
    select 1
    from public.institution_members im
    where im.institution_id = programs.institution_id
      and im.user_id = auth.uid()
  )
);

create policy "Institution admins can manage programs"
on public.programs
for all
to authenticated
using (
  exists (
    select 1
    from public.institution_members im
    where im.institution_id = programs.institution_id
      and im.user_id = auth.uid()
      and im.role in ('institution_admin', 'committee')
  )
)
with check (
  exists (
    select 1
    from public.institution_members im
    where im.institution_id = programs.institution_id
      and im.user_id = auth.uid()
      and im.role in ('institution_admin', 'committee')
  )
);

create policy "Artists can manage own applications"
on public.applications
for all
to authenticated
using (
  exists (
    select 1
    from public.artist_profiles ap
    where ap.id = applications.artist_profile_id
      and ap.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.artist_profiles ap
    where ap.id = applications.artist_profile_id
      and ap.user_id = auth.uid()
  )
);

create policy "Institution members can read their applications"
on public.applications
for select
to authenticated
using (
  exists (
    select 1
    from public.programs p
    join public.institution_members im on im.institution_id = p.institution_id
    where p.id = applications.program_id
      and im.user_id = auth.uid()
  )
);

create policy "Reviewers can read assigned applications"
on public.applications
for select
to authenticated
using (
  exists (
    select 1
    from public.reviewer_assignments ra
    where ra.application_id = applications.id
      and ra.reviewer_id = auth.uid()
  )
);

create policy "Institution admins can manage reviewer assignments"
on public.reviewer_assignments
for all
to authenticated
using (
  exists (
    select 1
    from public.programs p
    join public.institution_members im on im.institution_id = p.institution_id
    where p.id = reviewer_assignments.program_id
      and im.user_id = auth.uid()
      and im.role in ('institution_admin', 'committee')
  )
)
with check (
  exists (
    select 1
    from public.programs p
    join public.institution_members im on im.institution_id = p.institution_id
    where p.id = reviewer_assignments.program_id
      and im.user_id = auth.uid()
      and im.role in ('institution_admin', 'committee')
  )
);

create policy "Reviewers can read own assignments"
on public.reviewer_assignments
for select
to authenticated
using (reviewer_id = auth.uid());

create policy "Reviewers can manage own reviews"
on public.reviews
for all
to authenticated
using (reviewer_id = auth.uid())
with check (reviewer_id = auth.uid());

create policy "Institution members can read reviews"
on public.reviews
for select
to authenticated
using (
  exists (
    select 1
    from public.applications a
    join public.programs p on p.id = a.program_id
    join public.institution_members im on im.institution_id = p.institution_id
    where a.id = reviews.application_id
      and im.user_id = auth.uid()
  )
);

create policy "Institution members can read activity log"
on public.activity_log
for select
to authenticated
using (
  exists (
    select 1
    from public.institution_members im
    where im.institution_id = activity_log.institution_id
      and im.user_id = auth.uid()
  )
);

create policy "Institution members can insert activity log"
on public.activity_log
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and exists (
    select 1
    from public.institution_members im
    where im.institution_id = activity_log.institution_id
      and im.user_id = auth.uid()
  )
);

create policy "Users can manage own assist jobs"
on public.assist_jobs
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Institution members can read report drafts"
on public.report_drafts
for select
to authenticated
using (
  exists (
    select 1
    from public.programs p
    join public.institution_members im on im.institution_id = p.institution_id
    where p.id = report_drafts.program_id
      and im.user_id = auth.uid()
  )
);

create policy "Institution admins can manage report drafts"
on public.report_drafts
for all
to authenticated
using (
  exists (
    select 1
    from public.programs p
    join public.institution_members im on im.institution_id = p.institution_id
    where p.id = report_drafts.program_id
      and im.user_id = auth.uid()
      and im.role in ('institution_admin', 'committee')
  )
)
with check (
  exists (
    select 1
    from public.programs p
    join public.institution_members im on im.institution_id = p.institution_id
    where p.id = report_drafts.program_id
      and im.user_id = auth.uid()
      and im.role in ('institution_admin', 'committee')
  )
);
