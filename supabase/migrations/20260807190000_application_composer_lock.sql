begin;

alter table public.application_packages
  add column if not exists package_version integer not null default 0,
  add column if not exists preflight_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists last_autosaved_at timestamptz;

alter table public.application_packages
  drop constraint if exists application_packages_package_version_check;
alter table public.application_packages
  add constraint application_packages_package_version_check
  check (package_version >= 0);

create table if not exists public.application_submission_versions (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.application_packages(id) on delete cascade,
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete restrict,
  application_id uuid references public.applications(id) on delete set null,
  version_number integer not null,
  submission_method text not null,
  destination text not null default '',
  snapshot jsonb not null,
  preflight_snapshot jsonb not null default '{}'::jsonb,
  data_scope text not null default 'real',
  finalized_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint application_submission_versions_version_check check (version_number > 0),
  constraint application_submission_versions_method_check check (submission_method in ('native_kleio', 'email', 'external_portal', 'download_package', 'unknown')),
  constraint application_submission_versions_data_scope_check check (data_scope in ('real', 'guided_demo', 'synthetic_test')),
  constraint application_submission_versions_snapshot_check check (jsonb_typeof(snapshot) = 'object'),
  unique (package_id, version_number)
);

create index if not exists application_submission_versions_artist_idx
  on public.application_submission_versions (artist_user_id, finalized_at desc);
create index if not exists application_submission_versions_opportunity_idx
  on public.application_submission_versions (opportunity_id, finalized_at desc);

create table if not exists public.application_timeline_events (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.application_packages(id) on delete cascade,
  submission_version_id uuid references public.application_submission_versions(id) on delete set null,
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  evidence_level text not null default 'self_reported',
  actor_kind text not null default 'artist',
  summary text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  idempotency_key text,
  created_at timestamptz not null default now(),
  constraint application_timeline_events_type_check check (event_type in (
    'application_created',
    'requirements_analyzed',
    'draft_generated',
    'artist_editing',
    'application_ready',
    'application_finalized',
    'package_downloaded',
    'email_client_opened',
    'artist_marked_sent',
    'kleio_receipt_confirmed',
    'application_page_accessed',
    'portfolio_material_viewed',
    'document_downloaded',
    'institution_contacted_artist',
    'artist_replied',
    'follow_up_sent',
    'shortlisted',
    'interview_requested',
    'declined',
    'accepted',
    'withdrawn'
  )),
  constraint application_timeline_events_evidence_check check (evidence_level in ('self_reported', 'system_observed', 'recipient_confirmed', 'provider_confirmed')),
  constraint application_timeline_events_actor_check check (actor_kind in ('artist', 'recipient', 'provider', 'system')),
  constraint application_timeline_events_metadata_check check (jsonb_typeof(metadata) = 'object')
);

create unique index if not exists application_timeline_events_idempotency_idx
  on public.application_timeline_events(idempotency_key)
  where idempotency_key is not null;
create index if not exists application_timeline_events_package_idx
  on public.application_timeline_events(package_id, created_at desc);
create index if not exists application_timeline_events_artist_idx
  on public.application_timeline_events(artist_user_id, created_at desc);

alter table public.application_submission_versions enable row level security;
alter table public.application_timeline_events enable row level security;

drop policy if exists "Artists read own immutable submission versions" on public.application_submission_versions;
create policy "Artists read own immutable submission versions"
on public.application_submission_versions
for select
to authenticated
using ((select auth.uid()) = artist_user_id);

drop policy if exists "Artists create own immutable submission versions" on public.application_submission_versions;
create policy "Artists create own immutable submission versions"
on public.application_submission_versions
for insert
to authenticated
with check (
  (select auth.uid()) = artist_user_id
  and exists (
    select 1 from public.application_packages package_row
    where package_row.id = application_submission_versions.package_id
      and package_row.artist_user_id = (select auth.uid())
  )
);

drop policy if exists "Artists read own application timeline" on public.application_timeline_events;
create policy "Artists read own application timeline"
on public.application_timeline_events
for select
to authenticated
using ((select auth.uid()) = artist_user_id);

drop policy if exists "Artists add self reported application timeline events" on public.application_timeline_events;
create policy "Artists add self reported application timeline events"
on public.application_timeline_events
for insert
to authenticated
with check (
  (select auth.uid()) = artist_user_id
  and actor_kind = 'artist'
  and evidence_level = 'self_reported'
  and exists (
    select 1 from public.application_packages package_row
    where package_row.id = application_timeline_events.package_id
      and package_row.artist_user_id = (select auth.uid())
  )
);

revoke all on public.application_submission_versions from anon;
revoke all on public.application_timeline_events from anon;
grant select, insert on public.application_submission_versions to authenticated;
grant select, insert on public.application_timeline_events to authenticated;

create or replace function public.prevent_application_submission_version_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'application_submission_versions are immutable';
end;
$$;

revoke all on function public.prevent_application_submission_version_mutation() from public;
revoke all on function public.prevent_application_submission_version_mutation() from anon;
revoke all on function public.prevent_application_submission_version_mutation() from authenticated;
grant execute on function public.prevent_application_submission_version_mutation() to postgres;

drop trigger if exists prevent_application_submission_version_update on public.application_submission_versions;
create trigger prevent_application_submission_version_update
before update or delete on public.application_submission_versions
for each row execute function public.prevent_application_submission_version_mutation();

create or replace function public.finalize_my_application_submission_version(
  target_package_id uuid,
  supplied_preflight jsonb default '{}'::jsonb
)
returns table (
  submission_version_id uuid,
  version_number integer,
  finalized_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  package_row public.application_packages%rowtype;
  next_version integer;
  created_version public.application_submission_versions%rowtype;
  item_snapshot jsonb;
  opportunity_snapshot jsonb;
begin
  select * into package_row
  from public.application_packages
  where id = target_package_id
    and artist_user_id = (select auth.uid())
  for update;

  if package_row.id is null then
    raise exception 'application_package_not_found';
  end if;

  if package_row.artist_approved_at is null then
    raise exception 'artist_approval_required';
  end if;

  if package_row.state in ('draft', 'missing_information', 'deadline_passed', 'failed', 'withdrawn') then
    raise exception 'application_package_not_finalizable';
  end if;

  if jsonb_typeof(supplied_preflight) <> 'object' then
    raise exception 'invalid_preflight_snapshot';
  end if;

  if coalesce((supplied_preflight->>'blocking_count')::integer, 0) > 0 then
    raise exception 'preflight_blockers_remaining';
  end if;

  select coalesce(jsonb_agg(to_jsonb(item_row) order by item_row.sort_order, item_row.created_at), '[]'::jsonb)
  into item_snapshot
  from public.application_package_items item_row
  where item_row.package_id = package_row.id;

  select coalesce(to_jsonb(opportunity_row), '{}'::jsonb)
  into opportunity_snapshot
  from (
    select
      opportunity.id,
      opportunity.title,
      opportunity.provider_name,
      opportunity.deadline_at,
      opportunity.deadline_timezone,
      opportunity.submission_method,
      opportunity.submission_email,
      opportunity.submission_instructions,
      opportunity.canonical_url,
      opportunity.application_url,
      opportunity.data_scope
    from public.opportunities opportunity
    where opportunity.id = package_row.opportunity_id
  ) opportunity_row;

  select coalesce(max(existing.version_number), 0) + 1
  into next_version
  from public.application_submission_versions existing
  where existing.package_id = package_row.id;

  insert into public.application_submission_versions (
    package_id,
    artist_user_id,
    opportunity_id,
    application_id,
    version_number,
    submission_method,
    destination,
    snapshot,
    preflight_snapshot,
    data_scope
  ) values (
    package_row.id,
    package_row.artist_user_id,
    package_row.opportunity_id,
    package_row.application_id,
    next_version,
    package_row.submission_method,
    package_row.external_destination,
    jsonb_build_object(
      'captured_at', now(),
      'application_reference', 'KLA-' || upper(substr(replace(package_row.id::text, '-', ''), 1, 12)),
      'package_id', package_row.id,
      'package_state', package_row.state,
      'opportunity', opportunity_snapshot,
      'requirements', package_row.requirement_snapshot,
      'readiness', package_row.readiness,
      'passport', package_row.passport_snapshot,
      'portfolio', package_row.portfolio_snapshot,
      'written_content', package_row.written_content,
      'email_preview', package_row.email_preview,
      'destination', package_row.external_destination,
      'approval_confirmations', package_row.approval_confirmations,
      'artist_approved_at', package_row.artist_approved_at,
      'package_items', item_snapshot
    ),
    supplied_preflight,
    package_row.data_scope
  )
  returning * into created_version;

  update public.application_packages
  set package_version = next_version,
      preflight_snapshot = supplied_preflight,
      updated_at = now()
  where id = package_row.id;

  insert into public.application_timeline_events (
    package_id,
    submission_version_id,
    artist_user_id,
    event_type,
    evidence_level,
    actor_kind,
    summary,
    metadata,
    idempotency_key
  ) values (
    package_row.id,
    created_version.id,
    package_row.artist_user_id,
    'application_finalized',
    'system_observed',
    'system',
    'Application finalized and preserved as an immutable submission version.',
    jsonb_build_object('version_number', next_version),
    'finalized:' || created_version.id::text
  );

  return query select created_version.id, created_version.version_number, created_version.finalized_at;
end;
$$;

revoke all on function public.finalize_my_application_submission_version(uuid, jsonb) from public;
revoke all on function public.finalize_my_application_submission_version(uuid, jsonb) from anon;
grant execute on function public.finalize_my_application_submission_version(uuid, jsonb) to authenticated;

create or replace function public.record_my_application_timeline_event(
  target_package_id uuid,
  target_submission_version_id uuid,
  target_event_type text,
  target_summary text default '',
  target_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  target_artist uuid;
  created_id uuid;
begin
  select package_row.artist_user_id into target_artist
  from public.application_packages package_row
  where package_row.id = target_package_id
    and package_row.artist_user_id = (select auth.uid());

  if target_artist is null then
    raise exception 'application_package_not_found';
  end if;

  if target_submission_version_id is not null and not exists (
    select 1 from public.application_submission_versions version_row
    where version_row.id = target_submission_version_id
      and version_row.package_id = target_package_id
      and version_row.artist_user_id = (select auth.uid())
  ) then
    raise exception 'submission_version_not_found';
  end if;

  insert into public.application_timeline_events (
    package_id,
    submission_version_id,
    artist_user_id,
    event_type,
    evidence_level,
    actor_kind,
    summary,
    metadata
  ) values (
    target_package_id,
    target_submission_version_id,
    target_artist,
    target_event_type,
    'self_reported',
    'artist',
    left(coalesce(target_summary, ''), 1000),
    coalesce(target_metadata, '{}'::jsonb)
  ) returning id into created_id;

  return created_id;
end;
$$;

revoke all on function public.record_my_application_timeline_event(uuid, uuid, text, text, jsonb) from public;
revoke all on function public.record_my_application_timeline_event(uuid, uuid, text, text, jsonb) from anon;
grant execute on function public.record_my_application_timeline_event(uuid, uuid, text, text, jsonb) to authenticated;

comment on table public.application_submission_versions is
  'Immutable artist-approved application versions. Future Creative Passport edits never rewrite historical submission contents.';
comment on table public.application_timeline_events is
  'Evidence-labelled artist application history. Direct artist writes are self-reported; system or provider evidence must be written through trusted server paths.';

commit;