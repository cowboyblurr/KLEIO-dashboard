-- Lock every recipient handoff to an immutable artist-finalized submission version.
-- This migration also introduces a channel-agnostic delivery record that Gmail,
-- email-client fallback, external portals, and future native KLEIO delivery can share.

alter table public.application_recipient_access
  add column if not exists submission_version_id uuid references public.application_submission_versions(id) on delete restrict;

create index if not exists application_recipient_access_submission_version_idx
  on public.application_recipient_access(submission_version_id, created_at desc);

-- Future submission versions freeze the opportunity context needed by the Review Room
-- so recipient delivery never rereads mutable opportunity copy after finalization.
create or replace function private.finalize_my_application_submission_version_impl(
  target_package_id uuid,
  supplied_preflight jsonb default '{}'::jsonb
)
returns table(submission_version_id uuid, version_number integer, finalized_at timestamptz)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  package_row public.application_packages%rowtype;
  next_submission_version integer;
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

  select * into created_version
  from public.application_submission_versions existing
  where existing.package_id = package_row.id
    and existing.source_package_version = package_row.package_version
  order by existing.finalized_at asc, existing.id asc
  limit 1;

  if created_version.id is not null then
    return query select created_version.id, created_version.version_number, created_version.finalized_at;
    return;
  end if;

  select coalesce(jsonb_agg(to_jsonb(item_row) order by item_row.sort_order, item_row.created_at), '[]'::jsonb)
    into item_snapshot
  from public.application_package_items item_row
  where item_row.package_id = package_row.id;

  select coalesce(to_jsonb(opportunity_row), '{}'::jsonb)
    into opportunity_snapshot
  from (
    select opportunity.id,
           opportunity.title,
           opportunity.provider_name,
           opportunity.summary,
           opportunity.disciplines,
           opportunity.award_min,
           opportunity.award_max,
           opportunity.currency,
           opportunity.deadline_at,
           opportunity.deadline_timezone,
           opportunity.required_materials,
           opportunity.locations,
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
    into next_submission_version
  from public.application_submission_versions existing
  where existing.package_id = package_row.id;

  insert into public.application_submission_versions (
    package_id, artist_user_id, opportunity_id, application_id, version_number,
    source_package_version, submission_method, destination, snapshot, preflight_snapshot, data_scope
  )
  values (
    package_row.id, package_row.artist_user_id, package_row.opportunity_id, package_row.application_id,
    next_submission_version, package_row.package_version, package_row.submission_method,
    package_row.external_destination,
    jsonb_build_object(
      'captured_at', now(),
      'application_reference', 'KLA-' || upper(substr(replace(package_row.id::text, '-', ''), 1, 12)),
      'package_id', package_row.id,
      'source_package_version', package_row.package_version,
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
  set preflight_snapshot = supplied_preflight,
      updated_at = now()
  where id = package_row.id;

  insert into public.application_timeline_events (
    package_id, submission_version_id, artist_user_id, event_type, evidence_level,
    actor_kind, summary, metadata, idempotency_key
  )
  values (
    package_row.id, created_version.id, package_row.artist_user_id,
    'application_finalized', 'system_observed', 'system',
    'Application finalized and preserved as an immutable submission version.',
    jsonb_build_object('submission_version_number', next_submission_version, 'source_package_version', package_row.package_version),
    'finalized:' || created_version.id::text
  );

  return query select created_version.id, created_version.version_number, created_version.finalized_at;
end;
$$;

create or replace function private.kleio_recipient_snapshot_from_submission_version(target_submission_version_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'private'
as $$
declare
  version_row public.application_submission_versions%rowtype;
  source_snapshot jsonb;
  opportunity jsonb;
  passport jsonb;
  written jsonb;
  email_preview jsonb;
  requirements jsonb;
  answers jsonb;
  responses jsonb := '[]'::jsonb;
  answer_key text;
  answer_value jsonb;
  answer_text text;
  requirement jsonb;
  requirement_label text;
  requirement_material_key text;
  requirement_category text;
begin
  select * into version_row
  from public.application_submission_versions
  where id = target_submission_version_id;

  if version_row.id is null then
    raise exception 'submission_version_not_found';
  end if;

  source_snapshot := coalesce(version_row.snapshot, '{}'::jsonb);
  opportunity := coalesce(source_snapshot->'opportunity', '{}'::jsonb);
  passport := coalesce(source_snapshot->'passport', '{}'::jsonb);
  written := coalesce(source_snapshot->'written_content', '{}'::jsonb);
  email_preview := coalesce(source_snapshot->'email_preview', '{}'::jsonb);
  requirements := coalesce(source_snapshot->'requirements', '[]'::jsonb);
  answers := coalesce(written->'application_answers', '{}'::jsonb);

  if jsonb_typeof(answers) = 'object' then
    for answer_key, answer_value in select key, value from jsonb_each(answers)
    loop
      answer_text := case
        when jsonb_typeof(answer_value) = 'string' then answer_value #>> '{}'
        when jsonb_typeof(answer_value) = 'object' then coalesce(answer_value->>'text', '')
        else ''
      end;
      answer_text := btrim(coalesce(answer_text, ''));
      if answer_text = '' then
        continue;
      end if;

      requirement := null;
      if jsonb_typeof(requirements) = 'array' then
        select candidate into requirement
        from jsonb_array_elements(requirements) candidate
        where candidate->>'id' = answer_key
        limit 1;
      end if;

      requirement_label := coalesce(nullif(requirement->>'label', ''), initcap(replace(answer_key, '_', ' ')));
      requirement_material_key := coalesce(requirement->>'material_key', answer_key);
      requirement_category := coalesce(requirement->>'category', '');
      responses := responses || jsonb_build_array(jsonb_build_object(
        'id', answer_key,
        'label', requirement_label,
        'material_key', requirement_material_key,
        'category', requirement_category,
        'answer', answer_text
      ));
    end loop;
  end if;

  if btrim(coalesce(written->>'project_proposal', '')) <> ''
     and not (answers ? 'project_proposal') then
    responses := responses || jsonb_build_array(jsonb_build_object(
      'id', 'project_proposal',
      'label', 'Project proposal',
      'material_key', 'project_proposal',
      'category', 'proposal',
      'answer', btrim(written->>'project_proposal')
    ));
  end if;

  return jsonb_build_object(
    'reference', coalesce(source_snapshot->>'application_reference', version_row.id::text),
    'submission_version_id', version_row.id,
    'submission_version_number', version_row.version_number,
    'approved_at', coalesce(source_snapshot->>'artist_approved_at', version_row.finalized_at::text),
    'finalized_at', version_row.finalized_at,
    'data_scope', version_row.data_scope,
    'synthetic_notice', case when version_row.data_scope = 'synthetic_test'
      then 'Internal workflow test. This is not a real grant, residency, exhibition, institution, or funding opportunity.'
      else '' end,
    'opportunity', jsonb_build_object(
      'id', coalesce(opportunity->>'id', version_row.opportunity_id::text),
      'title', coalesce(opportunity->>'title', 'Application'),
      'provider_name', coalesce(opportunity->>'provider_name', ''),
      'summary', coalesce(opportunity->>'summary', ''),
      'disciplines', coalesce(opportunity->'disciplines', '[]'::jsonb),
      'award_min', opportunity->'award_min',
      'award_max', opportunity->'award_max',
      'currency', coalesce(opportunity->>'currency', ''),
      'deadline_at', coalesce(opportunity->>'deadline_at', ''),
      'required_materials', coalesce(opportunity->'required_materials', '[]'::jsonb),
      'locations', coalesce(opportunity->'locations', '[]'::jsonb),
      'submission_method', coalesce(opportunity->>'submission_method', version_row.submission_method)
    ),
    'artist', jsonb_build_object(
      'professional_name', coalesce(nullif(passport->>'professional_name', ''), 'Artist'),
      'location', coalesce(passport->>'location', ''),
      'bio', coalesce(passport->>'bio', ''),
      'artist_statement', coalesce(passport->>'artist_statement', ''),
      'practice_description', coalesce(passport->>'practice_description', ''),
      'disciplines', coalesce(passport->'disciplines', '[]'::jsonb),
      'mediums', coalesce(passport->'mediums', '[]'::jsonb),
      'education', coalesce(passport->>'education', ''),
      'exhibition_history', coalesce(passport->>'exhibition_history', ''),
      'awards', coalesce(passport->>'awards', ''),
      'website_url', coalesce(passport->>'website_url', '')
    ),
    'introduction', coalesce(nullif(written->>'email_introduction', ''), email_preview->>'body', ''),
    'opportunity_response', coalesce(written->>'project_proposal', ''),
    'application_responses', responses,
    'alignment_map', coalesce(written->'alignment_map', '[]'::jsonb),
    'portfolio', coalesce(source_snapshot->'portfolio', '[]'::jsonb),
    'documents', jsonb_build_object(
      'cv_file_path', coalesce(passport->>'cv_file_path', ''),
      'attachment_labels', coalesce(email_preview->'attachments', '[]'::jsonb)
    )
  );
end;
$$;

create or replace function private.bind_recipient_access_to_finalized_submission()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'private'
as $$
declare
  version_row public.application_submission_versions%rowtype;
begin
  if new.submission_version_id is not null then
    select * into version_row
    from public.application_submission_versions
    where id = new.submission_version_id;
  else
    select * into version_row
    from public.application_submission_versions
    where package_id = new.package_id
      and artist_user_id = new.artist_user_id
    order by finalized_at desc, version_number desc
    limit 1;
  end if;

  if version_row.id is null then
    raise exception 'finalized_submission_version_required';
  end if;
  if version_row.package_id <> new.package_id or version_row.artist_user_id <> new.artist_user_id then
    raise exception 'recipient_access_submission_version_mismatch';
  end if;

  new.submission_version_id := version_row.id;
  new.approved_snapshot := private.kleio_recipient_snapshot_from_submission_version(version_row.id);
  new.data_scope := version_row.data_scope;
  return new;
end;
$$;

drop trigger if exists bind_recipient_access_to_finalized_submission on public.application_recipient_access;
create trigger bind_recipient_access_to_finalized_submission
before insert
on public.application_recipient_access
for each row execute function private.bind_recipient_access_to_finalized_submission();

create or replace function private.prevent_recipient_access_snapshot_mutation()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.package_id is distinct from old.package_id
     or new.artist_user_id is distinct from old.artist_user_id
     or new.submission_version_id is distinct from old.submission_version_id
     or new.approved_snapshot is distinct from old.approved_snapshot
     or new.data_scope is distinct from old.data_scope then
    raise exception 'recipient_access_snapshot_immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_recipient_access_snapshot_mutation on public.application_recipient_access;
create trigger prevent_recipient_access_snapshot_mutation
before update of package_id, artist_user_id, submission_version_id, approved_snapshot, data_scope
on public.application_recipient_access
for each row execute function private.prevent_recipient_access_snapshot_mutation();

-- Production had no recipient-access rows at this migration boundary, so the new
-- immutable-version association can be made mandatory immediately.
alter table public.application_recipient_access
  alter column submission_version_id set not null;

create table if not exists public.application_deliveries (
  id uuid primary key default gen_random_uuid(),
  submission_version_id uuid not null references public.application_submission_versions(id) on delete restrict,
  package_id uuid not null references public.application_packages(id) on delete cascade,
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete restrict,
  recipient_access_id uuid references public.application_recipient_access(id) on delete set null,
  channel text not null check (channel in ('gmail','email_client','external_portal','native_kleio','download_package')),
  destination text not null default '',
  state text not null default 'prepared' check (state in ('prepared','handoff_prepared','provider_accepted','artist_reported_sent','review_room_opened','receipt_confirmed','conversation_started','failed','cancelled')),
  evidence_level text not null default 'system_observed' check (evidence_level in ('self_reported','system_observed','recipient_confirmed','provider_confirmed')),
  provider text not null default '',
  provider_reference text not null default '',
  last_error_code text not null default '',
  last_error_message text not null default '',
  prepared_at timestamptz not null default now(),
  handoff_prepared_at timestamptz,
  provider_accepted_at timestamptz,
  artist_reported_sent_at timestamptz,
  review_room_opened_at timestamptz,
  receipt_confirmed_at timestamptz,
  conversation_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(submission_version_id, channel)
);

create index if not exists application_deliveries_artist_idx
  on public.application_deliveries(artist_user_id, created_at desc);
create index if not exists application_deliveries_package_idx
  on public.application_deliveries(package_id, created_at desc);
create index if not exists application_deliveries_access_idx
  on public.application_deliveries(recipient_access_id) where recipient_access_id is not null;

alter table public.application_deliveries enable row level security;

drop policy if exists "Artists can read own application deliveries" on public.application_deliveries;
create policy "Artists can read own application deliveries"
on public.application_deliveries for select
to authenticated
using (artist_user_id = (select auth.uid()));

revoke insert, update, delete on public.application_deliveries from anon, authenticated;
grant select on public.application_deliveries to authenticated;

create or replace function public.record_my_application_delivery(
  target_submission_version_id uuid,
  target_channel text,
  target_destination text default '',
  target_recipient_access_id uuid default null,
  target_state text default 'prepared',
  target_evidence_level text default 'system_observed',
  target_provider text default '',
  target_provider_reference text default '',
  target_error_code text default '',
  target_error_message text default ''
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  version_row public.application_submission_versions%rowtype;
  delivery_id uuid;
  access_row public.application_recipient_access%rowtype;
begin
  select * into version_row
  from public.application_submission_versions
  where id = target_submission_version_id
    and artist_user_id = (select auth.uid());

  if version_row.id is null then
    raise exception 'submission_version_not_found';
  end if;
  if target_channel not in ('gmail','email_client','external_portal','native_kleio','download_package') then
    raise exception 'invalid_delivery_channel';
  end if;
  if target_state not in ('prepared','handoff_prepared','provider_accepted','artist_reported_sent','review_room_opened','receipt_confirmed','conversation_started','failed','cancelled') then
    raise exception 'invalid_delivery_state';
  end if;
  if target_evidence_level not in ('self_reported','system_observed','recipient_confirmed','provider_confirmed') then
    raise exception 'invalid_delivery_evidence_level';
  end if;

  if target_recipient_access_id is not null then
    select * into access_row
    from public.application_recipient_access
    where id = target_recipient_access_id
      and artist_user_id = (select auth.uid());
    if access_row.id is null
       or access_row.package_id <> version_row.package_id
       or access_row.submission_version_id <> version_row.id then
      raise exception 'delivery_recipient_access_mismatch';
    end if;
  end if;

  insert into public.application_deliveries (
    submission_version_id, package_id, artist_user_id, opportunity_id,
    recipient_access_id, channel, destination, state, evidence_level,
    provider, provider_reference, last_error_code, last_error_message,
    handoff_prepared_at, provider_accepted_at, artist_reported_sent_at, updated_at
  ) values (
    version_row.id, version_row.package_id, version_row.artist_user_id, version_row.opportunity_id,
    target_recipient_access_id, target_channel, coalesce(target_destination,''), target_state, target_evidence_level,
    coalesce(target_provider,''), coalesce(target_provider_reference,''), coalesce(target_error_code,''), coalesce(target_error_message,''),
    case when target_state = 'handoff_prepared' then now() else null end,
    case when target_state = 'provider_accepted' then now() else null end,
    case when target_state = 'artist_reported_sent' then now() else null end,
    now()
  )
  on conflict (submission_version_id, channel) do update set
    recipient_access_id = coalesce(excluded.recipient_access_id, public.application_deliveries.recipient_access_id),
    destination = excluded.destination,
    state = excluded.state,
    evidence_level = excluded.evidence_level,
    provider = excluded.provider,
    provider_reference = excluded.provider_reference,
    last_error_code = excluded.last_error_code,
    last_error_message = excluded.last_error_message,
    handoff_prepared_at = coalesce(excluded.handoff_prepared_at, public.application_deliveries.handoff_prepared_at),
    provider_accepted_at = coalesce(excluded.provider_accepted_at, public.application_deliveries.provider_accepted_at),
    artist_reported_sent_at = coalesce(excluded.artist_reported_sent_at, public.application_deliveries.artist_reported_sent_at),
    updated_at = now()
  returning id into delivery_id;

  return delivery_id;
end;
$$;

revoke all on function public.record_my_application_delivery(uuid,text,text,uuid,text,text,text,text,text,text) from public, anon;
grant execute on function public.record_my_application_delivery(uuid,text,text,uuid,text,text,text,text,text,text) to authenticated;

-- Recipient-side events advance the same canonical delivery lifecycle used by
-- Gmail and the manual email fallback. The state only moves forward.
create or replace function private.sync_application_delivery_from_recipient_event()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  desired_state text;
  desired_rank integer;
begin
  desired_state := case new.event_type
    when 'application_page_viewed' then 'review_room_opened'
    when 'receipt_confirmed' then 'receipt_confirmed'
    when 'conversation_started' then 'conversation_started'
    else null
  end;

  if desired_state is null then
    return new;
  end if;

  desired_rank := case desired_state
    when 'review_room_opened' then 3
    when 'receipt_confirmed' then 4
    when 'conversation_started' then 5
    else 0
  end;

  update public.application_deliveries delivery
  set state = case
        when (case delivery.state
          when 'prepared' then 0
          when 'handoff_prepared' then 1
          when 'provider_accepted' then 2
          when 'artist_reported_sent' then 2
          when 'review_room_opened' then 3
          when 'receipt_confirmed' then 4
          when 'conversation_started' then 5
          when 'failed' then -1
          when 'cancelled' then 6
          else 0 end) < desired_rank
        then desired_state else delivery.state end,
      evidence_level = case
        when (case delivery.state
          when 'prepared' then 0
          when 'handoff_prepared' then 1
          when 'provider_accepted' then 2
          when 'artist_reported_sent' then 2
          when 'review_room_opened' then 3
          when 'receipt_confirmed' then 4
          when 'conversation_started' then 5
          when 'failed' then -1
          when 'cancelled' then 6
          else 0 end) < desired_rank
        then new.evidence_level else delivery.evidence_level end,
      review_room_opened_at = case when new.event_type = 'application_page_viewed' then coalesce(delivery.review_room_opened_at, new.created_at) else delivery.review_room_opened_at end,
      receipt_confirmed_at = case when new.event_type = 'receipt_confirmed' then coalesce(delivery.receipt_confirmed_at, new.created_at) else delivery.receipt_confirmed_at end,
      conversation_started_at = case when new.event_type = 'conversation_started' then coalesce(delivery.conversation_started_at, new.created_at) else delivery.conversation_started_at end,
      updated_at = now()
  where delivery.recipient_access_id = new.access_id
    and delivery.state <> 'cancelled';

  return new;
end;
$$;

drop trigger if exists sync_application_delivery_from_recipient_event on public.application_recipient_events;
create trigger sync_application_delivery_from_recipient_event
after insert on public.application_recipient_events
for each row execute function private.sync_application_delivery_from_recipient_event();

comment on table public.application_deliveries is
  'Canonical outbound delivery state for one immutable artist-finalized submission version. Gmail, manual email, portals, native KLEIO, recipient Review Room activity, and conversation progression share this evidence-labelled record.';
