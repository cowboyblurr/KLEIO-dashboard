begin;

alter table public.opportunity_requirements
  add column if not exists category text not null default 'supporting_document',
  add column if not exists description text not null default '',
  add column if not exists source_location text not null default '',
  add column if not exists passport_field text not null default '',
  add column if not exists input_type text not null default 'document',
  add column if not exists minimum_word_count integer,
  add column if not exists maximum_word_count integer,
  add column if not exists minimum_item_count integer,
  add column if not exists maximum_item_count integer,
  add column if not exists accepted_file_types text[] not null default '{}',
  add column if not exists maximum_file_size_bytes bigint,
  add column if not exists maximum_total_size_bytes bigint,
  add column if not exists filename_pattern text not null default '',
  add column if not exists requires_artist_confirmation boolean not null default false,
  add column if not exists legal_declaration boolean not null default false,
  add column if not exists payment_required boolean not null default false,
  add column if not exists human_verification_required boolean not null default false,
  add column if not exists confidence_score numeric(4,3),
  add column if not exists constraints jsonb not null default '{}'::jsonb;

alter table public.opportunity_requirements
  drop constraint if exists opportunity_requirements_confidence_score_check;
alter table public.opportunity_requirements
  add constraint opportunity_requirements_confidence_score_check
  check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1));

alter table public.opportunities
  add column if not exists submission_method text not null default 'unknown',
  add column if not exists submission_email text not null default '',
  add column if not exists submission_instructions text not null default '';

alter table public.opportunities
  drop constraint if exists opportunities_submission_method_check;
alter table public.opportunities
  add constraint opportunities_submission_method_check
  check (submission_method in ('native_kleio', 'email', 'external_portal', 'download_package', 'unknown'));

update public.opportunities
set submission_method = case
  when application_mode = 'internal' then 'native_kleio'
  when application_url <> '' then 'external_portal'
  when canonical_url <> '' then 'download_package'
  else 'unknown'
end
where submission_method = 'unknown';

alter table public.applications
  add column if not exists submission_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists approval_confirmations jsonb not null default '{}'::jsonb,
  add column if not exists artist_approved_at timestamptz,
  add column if not exists submission_method text not null default 'native_kleio';

create table if not exists public.application_packages (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  submission_method text not null default 'unknown',
  state text not null default 'draft',
  readiness jsonb not null default '{}'::jsonb,
  requirement_snapshot jsonb not null default '[]'::jsonb,
  passport_snapshot jsonb not null default '{}'::jsonb,
  portfolio_snapshot jsonb not null default '[]'::jsonb,
  written_content jsonb not null default '{}'::jsonb,
  email_preview jsonb not null default '{}'::jsonb,
  external_destination text not null default '',
  approval_confirmations jsonb not null default '{}'::jsonb,
  artist_approved_at timestamptz,
  submitted_at timestamptz,
  provider_confirmation text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (artist_user_id, opportunity_id),
  constraint application_packages_submission_method_check check (submission_method in ('native_kleio', 'email', 'external_portal', 'download_package', 'unknown')),
  constraint application_packages_state_check check (state in ('draft', 'missing_information', 'artist_review_required', 'ready_for_submission', 'email_preview_ready', 'external_submission_required', 'submitted', 'confirmed', 'artist_reported_submitted', 'failed', 'withdrawn', 'deadline_passed'))
);

create table if not exists public.application_package_items (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.application_packages(id) on delete cascade,
  requirement_id uuid references public.opportunity_requirements(id) on delete set null,
  item_type text not null,
  label text not null,
  status text not null default 'missing',
  source_kind text not null default 'creative_passport',
  source_reference text not null default '',
  content_text text not null default '',
  content_data jsonb not null default '{}'::jsonb,
  artist_approved boolean not null default false,
  ai_assisted boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint application_package_items_status_check check (status in ('complete', 'needs_review', 'missing', 'limit_error', 'unverified', 'optional', 'blocked'))
);

create table if not exists public.application_submission_attempts (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.application_packages(id) on delete cascade,
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  method text not null,
  status text not null,
  destination text not null default '',
  provider_reference text not null default '',
  error_code text not null default '',
  error_message text not null default '',
  request_snapshot jsonb not null default '{}'::jsonb,
  response_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint application_submission_attempts_status_check check (status in ('started', 'prepared', 'submitted', 'confirmed', 'failed', 'artist_reported'))
);

create index if not exists application_packages_artist_user_id_idx on public.application_packages (artist_user_id);
create index if not exists application_packages_opportunity_id_idx on public.application_packages (opportunity_id);
create index if not exists application_packages_state_idx on public.application_packages (state);
create index if not exists application_package_items_package_id_idx on public.application_package_items (package_id, sort_order);
create index if not exists application_submission_attempts_package_id_idx on public.application_submission_attempts (package_id, created_at desc);
create index if not exists application_submission_attempts_artist_user_id_idx on public.application_submission_attempts (artist_user_id);
create index if not exists opportunity_requirements_category_idx on public.opportunity_requirements (opportunity_id, category, sort_order);

alter table public.application_packages enable row level security;
alter table public.application_package_items enable row level security;
alter table public.application_submission_attempts enable row level security;

drop policy if exists "Artists manage own application packages" on public.application_packages;
create policy "Artists manage own application packages"
on public.application_packages
for all
to authenticated
using ((select auth.uid()) = artist_user_id)
with check ((select auth.uid()) = artist_user_id);

drop policy if exists "Artists manage own application package items" on public.application_package_items;
create policy "Artists manage own application package items"
on public.application_package_items
for all
to authenticated
using (
  exists (
    select 1
    from public.application_packages package_row
    where package_row.id = application_package_items.package_id
      and package_row.artist_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.application_packages package_row
    where package_row.id = application_package_items.package_id
      and package_row.artist_user_id = (select auth.uid())
  )
);

drop policy if exists "Artists read own submission attempts" on public.application_submission_attempts;
create policy "Artists read own submission attempts"
on public.application_submission_attempts
for select
to authenticated
using ((select auth.uid()) = artist_user_id);

drop policy if exists "Artists create own submission attempts" on public.application_submission_attempts;
create policy "Artists create own submission attempts"
on public.application_submission_attempts
for insert
to authenticated
with check ((select auth.uid()) = artist_user_id);

revoke all on public.application_packages from anon;
revoke all on public.application_package_items from anon;
revoke all on public.application_submission_attempts from anon;
grant select, insert, update, delete on public.application_packages to authenticated;
grant select, insert, update, delete on public.application_package_items to authenticated;
grant select, insert on public.application_submission_attempts to authenticated;

create or replace function public.capture_application_submission_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'submitted'::public.application_status
     and old.status is distinct from new.status then
    new.artist_approved_at := coalesce(new.artist_approved_at, now());
    new.submission_method := 'native_kleio';
    new.submission_snapshot := jsonb_build_object(
      'captured_at', now(),
      'application_id', new.id,
      'call_id', new.call_id,
      'artist_name', new.artist_name,
      'artist_email', new.artist_email,
      'profile', new.profile_snapshot,
      'answers', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'question_key', answer.question_key,
            'answer_text', answer.answer_text,
            'answer_data', answer.answer_data
          ) order by answer.question_key
        )
        from public.application_answers answer
        where answer.application_id = new.id
      ), '[]'::jsonb),
      'portfolio', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'portfolio_work_id', work.id,
            'title', work.title,
            'year', work.year,
            'medium', work.medium,
            'dimensions', work.dimensions,
            'description', work.description,
            'series', work.series,
            'tags', work.tags,
            'image_path', work.image_path,
            'sort_order', selected_work.sort_order
          ) order by selected_work.sort_order
        )
        from public.application_works selected_work
        join public.portfolio_works work on work.id = selected_work.portfolio_work_id
        where selected_work.application_id = new.id
      ), '[]'::jsonb),
      'approval_confirmations', new.approval_confirmations
    );
  end if;
  return new;
end;
$$;

revoke all on function public.capture_application_submission_snapshot() from public;

drop trigger if exists capture_application_submission_snapshot_trigger on public.applications;
create trigger capture_application_submission_snapshot_trigger
before update of status on public.applications
for each row
execute function public.capture_application_submission_snapshot();

commit;
