create table if not exists private.product_event_definitions (
  event_name text primary key,
  event_version smallint not null default 1 check (event_version > 0),
  product_area text not null,
  public_allowed boolean not null default false,
  durable_milestone boolean not null default false,
  updated_at timestamptz not null default now()
);

revoke all on table private.product_event_definitions from public, anon, authenticated;
grant select, insert, update, delete on table private.product_event_definitions to service_role;

insert into private.product_event_definitions (event_name, event_version, product_area, public_allowed, durable_milestone)
values
  ('landing_viewed',1,'acquisition',true,false),
  ('artist_signup_selected',1,'acquisition',true,false),
  ('creative_passport_selected',1,'acquisition',true,false),
  ('explore_opportunities_selected',1,'acquisition',true,false),
  ('public_directory_viewed',1,'acquisition',true,false),
  ('opportunity_opened',1,'opportunities',true,false),
  ('signup_started',1,'authentication',true,false),
  ('signup_validation_failed',1,'authentication',true,false),
  ('signup_submitted',1,'authentication',true,false),
  ('account_created',1,'authentication',false,true),
  ('confirmation_required',1,'authentication',true,false),
  ('confirmation_completed',1,'authentication',false,true),
  ('login_completed',1,'authentication',false,false),
  ('login_failed',1,'authentication',true,false),
  ('session_expired',1,'reliability',false,false),
  ('session_recovered',1,'reliability',false,false),
  ('onboarding_started',1,'onboarding',false,false),
  ('onboarding_step_viewed',1,'onboarding',false,false),
  ('onboarding_step_completed',1,'onboarding',false,false),
  ('onboarding_step_skipped',1,'onboarding',false,false),
  ('onboarding_validation_failed',1,'onboarding',false,false),
  ('onboarding_save_failed',1,'onboarding',false,false),
  ('onboarding_saved_and_exited',1,'onboarding',false,false),
  ('onboarding_resumed',1,'onboarding',false,false),
  ('onboarding_completed',1,'onboarding',false,true),
  ('passport_started',1,'creative_passport',false,false),
  ('passport_mode_selected',1,'creative_passport',false,false),
  ('passport_section_started',1,'creative_passport',false,false),
  ('passport_section_completed',1,'creative_passport',false,false),
  ('passport_save_failed',1,'creative_passport',false,false),
  ('proposal_review_opened',1,'creative_passport',false,false),
  ('proposal_approved',1,'creative_passport',false,false),
  ('proposal_rejected',1,'creative_passport',false,false),
  ('passport_record_confirmed',1,'creative_passport',false,false),
  ('import_source_selected',1,'media_library',false,false),
  ('upload_started',1,'media_library',false,false),
  ('upload_succeeded',1,'media_library',false,false),
  ('upload_failed',1,'media_library',false,false),
  ('import_started',1,'media_library',false,false),
  ('import_completed',1,'media_library',false,false),
  ('import_partially_completed',1,'media_library',false,false),
  ('import_failed',1,'media_library',false,false),
  ('artwork_record_saved',1,'media_library',false,false),
  ('artwork_record_save_failed',1,'media_library',false,false),
  ('portfolio_inclusion_confirmed',1,'media_library',false,false),
  ('draft_restored',1,'reliability',false,false),
  ('autosave_succeeded',1,'reliability',false,false),
  ('autosave_failed',1,'reliability',false,false),
  ('opportunity_directory_viewed',1,'opportunities',false,false),
  ('search_performed',1,'opportunities',false,false),
  ('filter_applied',1,'opportunities',false,false),
  ('search_no_results',1,'opportunities',false,false),
  ('official_source_opened',1,'opportunities',true,false),
  ('opportunity_saved',1,'opportunities',false,false),
  ('opportunity_unsaved',1,'opportunities',false,false),
  ('readiness_viewed',1,'opportunities',false,false),
  ('prepare_selected',1,'applications',false,false),
  ('application_preparation_started',1,'applications',false,false),
  ('user_visible_error',1,'reliability',false,false),
  ('workflow_recovery_offered',1,'reliability',false,false),
  ('workflow_recovered',1,'reliability',false,false),
  ('support_selected',1,'reliability',false,false),
  ('feedback_started',1,'reliability',false,false),
  ('feedback_submitted',1,'reliability',false,false),
  ('first_value_reached',1,'creative_passport',false,true),
  ('artist_activated',1,'creative_passport',false,true),
  ('institution_section_viewed',1,'institution',true,false),
  ('institution_signup_selected',1,'institution',true,false),
  ('carousel_viewed',1,'legacy',true,false),
  ('carousel_manual_advanced',1,'legacy',true,false),
  ('carousel_card_selected',1,'legacy',true,false),
  ('login_selected',1,'legacy',true,false),
  ('check_fit_selected',1,'legacy',true,false),
  ('save_selected',1,'legacy',false,false),
  ('signup_prompted',1,'legacy',true,false),
  ('opportunity_restoration_completed',1,'legacy',false,false),
  ('opportunity_restoration_failed',1,'legacy',false,false),
  ('guided_step_completed',1,'legacy',false,false),
  ('guided_step_skipped',1,'legacy',false,false),
  ('review_opened',1,'legacy',false,false),
  ('claim_confirmed',1,'legacy',false,false),
  ('claim_rejected',1,'legacy',false,false),
  ('claim_deferred',1,'legacy',false,false),
  ('duplicate_merged',1,'legacy',false,false),
  ('claims_bulk_confirmed',1,'legacy',false,false),
  ('voice_capability_detected',1,'legacy',false,false),
  ('voice_started',1,'legacy',false,false),
  ('voice_completed',1,'legacy',false,false),
  ('conflict_detected',1,'legacy',false,false)
on conflict (event_name) do update
set event_version = excluded.event_version,
    product_area = excluded.product_area,
    public_allowed = excluded.public_allowed,
    durable_milestone = excluded.durable_milestone,
    updated_at = now();

create table if not exists private.analytics_internal_actors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  traffic_class text not null default 'internal_qa' check (traffic_class = 'internal_qa'),
  note text not null default '' check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);

revoke all on table private.analytics_internal_actors from public, anon, authenticated;
grant select, insert, update, delete on table private.analytics_internal_actors to service_role;

insert into private.analytics_internal_actors (user_id, note)
select user_id, 'KLEIO administrator account; excluded from real-user reporting by default.'
from public.kleio_admins
on conflict (user_id) do nothing;

create table if not exists private.product_event_ingestion_rejections (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  anonymous_session_id uuid,
  rejection_code text not null check (rejection_code ~ '^[a-z0-9_]{1,80}$'),
  traffic_class text not null check (traffic_class in ('real_user','internal_qa','guided_demo','synthetic_preview','automated_test')),
  surface text not null default '' check (char_length(surface) <= 80),
  created_at timestamptz not null default now()
);

revoke all on table private.product_event_ingestion_rejections from public, anon, authenticated;
grant select, insert, update, delete on table private.product_event_ingestion_rejections to service_role;
create index if not exists product_event_rejections_created_idx
  on private.product_event_ingestion_rejections(created_at desc, rejection_code);

create or replace function public.sanitize_product_event_metadata(input jsonb)
returns jsonb
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  result jsonb := '{}'::jsonb;
  entry record;
  allowed_keys constant text[] := array[
    'action','capability','completion_state','count','duplicate_count','edited','error_code',
    'failed_count','filter_count','intent_source','item_count','mode','outcome','provider',
    'reason','reduced_motion','relationship','result_count','retryable','role','section',
    'source','status','step','success_count','viewport'
  ];
begin
  if input is null or jsonb_typeof(input) <> 'object' then
    return '{}'::jsonb;
  end if;

  for entry in select key, value from jsonb_each(input) loop
    if entry.key = any(allowed_keys)
      and jsonb_typeof(entry.value) in ('string','number','boolean','null')
      and (jsonb_typeof(entry.value) <> 'string' or char_length(entry.value #>> '{}') <= 100)
    then
      result := result || jsonb_build_object(entry.key, entry.value);
    end if;
  end loop;

  if octet_length(result::text) > 2048 then
    return '{}'::jsonb;
  end if;
  return result;
end;
$$;

revoke all on function public.sanitize_product_event_metadata(jsonb) from public;
grant execute on function public.sanitize_product_event_metadata(jsonb) to anon, authenticated, service_role;

create or replace function private.product_event_metadata_is_valid(input jsonb)
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select input is not null
    and jsonb_typeof(input) = 'object'
    and octet_length(input::text) <= 2048
    and input = public.sanitize_product_event_metadata(input);
$$;

revoke all on function private.product_event_metadata_is_valid(jsonb) from public, anon, authenticated;
grant execute on function private.product_event_metadata_is_valid(jsonb) to service_role;

alter table public.product_events
  add column if not exists event_version smallint not null default 1,
  add column if not exists product_area text not null default 'legacy',
  add column if not exists release_channel text not null default 'founding_artist_beta',
  add column if not exists traffic_class text not null default 'real_user',
  add column if not exists actor_role text not null default 'anonymous',
  add column if not exists workflow_id uuid,
  add column if not exists app_version text not null default '',
  add column if not exists locale text not null default '',
  add column if not exists viewport text not null default 'unknown',
  add column if not exists acquisition_source text not null default 'unknown',
  add column if not exists occurred_at timestamptz not null default now(),
  add column if not exists deduplication_key text,
  add column if not exists ingestion_status text not null default 'accepted';

update public.product_events event_row
set event_version = 1,
    product_area = coalesce(definition.product_area, 'legacy'),
    release_channel = 'legacy_pre_beta',
    traffic_class = 'internal_qa',
    actor_role = case
      when event_row.actor_user_id is null then 'anonymous'
      when exists (select 1 from public.kleio_admins admin_row where admin_row.user_id = event_row.actor_user_id) then 'admin'
      else coalesce((select profile.role::text from public.profiles profile where profile.id = event_row.actor_user_id), 'unknown')
    end,
    app_version = 'legacy',
    locale = '',
    viewport = coalesce(nullif(event_row.metadata->>'viewport',''), 'unknown'),
    acquisition_source = 'unknown',
    occurred_at = event_row.created_at,
    metadata = public.sanitize_product_event_metadata(event_row.metadata),
    ingestion_status = 'accepted'
from private.product_event_definitions definition
where definition.event_name = event_row.event_name;

alter table public.product_events drop constraint if exists product_events_actor_scope;
alter table public.product_events drop constraint if exists product_events_event_name_check;
alter table public.product_events drop constraint if exists product_events_metadata_sanitized;
alter table public.product_events drop constraint if exists product_events_event_version_check;
alter table public.product_events drop constraint if exists product_events_product_area_check;
alter table public.product_events drop constraint if exists product_events_release_channel_check;
alter table public.product_events drop constraint if exists product_events_traffic_class_check;
alter table public.product_events drop constraint if exists product_events_actor_role_check;
alter table public.product_events drop constraint if exists product_events_viewport_check;
alter table public.product_events drop constraint if exists product_events_acquisition_source_check;
alter table public.product_events drop constraint if exists product_events_metadata_contract;
alter table public.product_events drop constraint if exists product_events_deduplication_key_check;
alter table public.product_events drop constraint if exists product_events_ingestion_status_check;
alter table public.product_events drop constraint if exists product_events_occurred_at_check;

alter table public.product_events
  add constraint product_events_event_name_check check (
    event_name in (
      'landing_viewed','artist_signup_selected','creative_passport_selected','explore_opportunities_selected','public_directory_viewed','opportunity_opened',
      'signup_started','signup_validation_failed','signup_submitted','account_created','confirmation_required','confirmation_completed','login_completed','login_failed','session_expired','session_recovered',
      'onboarding_started','onboarding_step_viewed','onboarding_step_completed','onboarding_step_skipped','onboarding_validation_failed','onboarding_save_failed','onboarding_saved_and_exited','onboarding_resumed','onboarding_completed',
      'passport_started','passport_mode_selected','passport_section_started','passport_section_completed','passport_save_failed','proposal_review_opened','proposal_approved','proposal_rejected','passport_record_confirmed',
      'import_source_selected','upload_started','upload_succeeded','upload_failed','import_started','import_completed','import_partially_completed','import_failed','artwork_record_saved','artwork_record_save_failed','portfolio_inclusion_confirmed','draft_restored','autosave_succeeded','autosave_failed',
      'opportunity_directory_viewed','search_performed','filter_applied','search_no_results','official_source_opened','opportunity_saved','opportunity_unsaved','readiness_viewed','prepare_selected','application_preparation_started',
      'user_visible_error','workflow_recovery_offered','workflow_recovered','support_selected','feedback_started','feedback_submitted','first_value_reached','artist_activated',
      'institution_section_viewed','institution_signup_selected','carousel_viewed','carousel_manual_advanced','carousel_card_selected','login_selected','check_fit_selected','save_selected','signup_prompted',
      'opportunity_restoration_completed','opportunity_restoration_failed','guided_step_completed','guided_step_skipped','review_opened','claim_confirmed','claim_rejected','claim_deferred','duplicate_merged','claims_bulk_confirmed','voice_capability_detected','voice_started','voice_completed','conflict_detected'
    )
  ),
  add constraint product_events_event_version_check check (event_version between 1 and 32767),
  add constraint product_events_product_area_check check (product_area in ('acquisition','authentication','onboarding','creative_passport','media_library','opportunities','applications','reliability','institution','legacy')),
  add constraint product_events_release_channel_check check (release_channel in ('legacy_pre_beta','founding_artist_beta','guided_demo','synthetic_preview','automated_test')),
  add constraint product_events_traffic_class_check check (traffic_class in ('real_user','internal_qa','guided_demo','synthetic_preview','automated_test')),
  add constraint product_events_actor_role_check check (actor_role in ('anonymous','artist','institution','collaborator','admin','unknown')),
  add constraint product_events_viewport_check check (viewport in ('mobile','tablet','desktop','unknown')),
  add constraint product_events_acquisition_source_check check (acquisition_source in ('direct_outreach','artist_referral','institution_referral','linkedin','instagram','organic_search','direct','opportunity_entry','unknown')),
  add constraint product_events_metadata_contract check (private.product_event_metadata_is_valid(metadata)),
  add constraint product_events_deduplication_key_check check (deduplication_key is null or char_length(deduplication_key) between 1 and 120),
  add constraint product_events_ingestion_status_check check (ingestion_status = 'accepted'),
  add constraint product_events_occurred_at_check check (occurred_at <= now() + interval '1 day');

revoke insert, update, delete on table public.product_events from anon, authenticated;
revoke usage, select on sequence public.product_events_id_seq from anon, authenticated;
grant select on table public.product_events to authenticated;

create index if not exists product_events_traffic_time_idx
  on public.product_events(traffic_class, occurred_at desc);
create index if not exists product_events_area_name_time_idx
  on public.product_events(product_area, event_name, occurred_at desc);
create index if not exists product_events_actor_time_idx
  on public.product_events(actor_user_id, occurred_at desc)
  where actor_user_id is not null;
create index if not exists product_events_session_time_idx
  on public.product_events(anonymous_session_id, occurred_at desc)
  where anonymous_session_id is not null;
create index if not exists product_events_workflow_time_idx
  on public.product_events(workflow_id, occurred_at desc)
  where workflow_id is not null;
create index if not exists product_events_acquisition_time_idx
  on public.product_events(acquisition_source, occurred_at desc);
create unique index if not exists product_events_actor_dedup_idx
  on public.product_events(actor_user_id, event_name, deduplication_key)
  where actor_user_id is not null and deduplication_key is not null;
create unique index if not exists product_events_session_dedup_idx
  on public.product_events(anonymous_session_id, event_name, deduplication_key)
  where actor_user_id is null and anonymous_session_id is not null and deduplication_key is not null;

create or replace function private.classify_product_event_traffic(
  target_user_id uuid,
  target_surface text,
  target_release_channel text
)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when target_user_id is not null and exists (
      select 1 from private.analytics_internal_actors internal_actor where internal_actor.user_id = target_user_id
    ) then 'internal_qa'
    when target_release_channel = 'guided_demo' or target_surface like 'guided_demo%' then 'guided_demo'
    when target_release_channel = 'synthetic_preview' then 'synthetic_preview'
    else 'real_user'
  end;
$$;

revoke all on function private.classify_product_event_traffic(uuid,text,text) from public, anon, authenticated;
grant execute on function private.classify_product_event_traffic(uuid,text,text) to service_role;

create or replace function private.log_product_event_rejection(
  target_actor_user_id uuid,
  target_anonymous_session_id uuid,
  target_rejection_code text,
  target_traffic_class text,
  target_surface text
)
returns void
language sql
volatile
security invoker
set search_path = ''
as $$
  insert into private.product_event_ingestion_rejections (
    actor_user_id, anonymous_session_id, rejection_code, traffic_class, surface
  ) values (
    target_actor_user_id,
    target_anonymous_session_id,
    left(regexp_replace(lower(coalesce(target_rejection_code,'invalid_event')), '[^a-z0-9_]+', '_', 'g'), 80),
    case when target_traffic_class in ('real_user','internal_qa','guided_demo','synthetic_preview','automated_test') then target_traffic_class else 'real_user' end,
    left(coalesce(target_surface,''),80)
  );
$$;

revoke all on function private.log_product_event_rejection(uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function private.log_product_event_rejection(uuid,uuid,text,text,text) to service_role;

create or replace function public.record_product_event(
  requested_event_name text,
  requested_event_version integer,
  requested_surface text,
  requested_release_channel text default 'founding_artist_beta',
  requested_anonymous_session_id uuid default null,
  requested_workflow_id uuid default null,
  requested_opportunity_id uuid default null,
  requested_app_version text default '',
  requested_locale text default '',
  requested_viewport text default 'unknown',
  requested_acquisition_source text default 'unknown',
  requested_metadata jsonb default '{}'::jsonb,
  requested_deduplication_key text default null,
  requested_occurred_at timestamptz default now()
)
returns table (accepted boolean, event_id bigint, rejection_code text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  definition private.product_event_definitions%rowtype;
  resolved_role text := 'anonymous';
  resolved_release text := 'founding_artist_beta';
  resolved_traffic text := 'real_user';
  resolved_surface text := left(coalesce(nullif(btrim(requested_surface),''),'unknown_surface'),80);
  resolved_viewport text := case when requested_viewport in ('mobile','tablet','desktop') then requested_viewport else 'unknown' end;
  resolved_acquisition text := case
    when requested_acquisition_source in ('direct_outreach','artist_referral','institution_referral','linkedin','instagram','organic_search','direct','opportunity_entry') then requested_acquisition_source
    else 'unknown'
  end;
  inserted_id bigint;
  recent_count integer;
  safe_metadata jsonb;
  rejection text;
begin
  select * into definition
  from private.product_event_definitions catalog
  where catalog.event_name = requested_event_name;

  resolved_release := case
    when requested_release_channel in ('founding_artist_beta','guided_demo','synthetic_preview') then requested_release_channel
    else 'founding_artist_beta'
  end;
  resolved_traffic := private.classify_product_event_traffic(actor_id, resolved_surface, resolved_release);

  if definition.event_name is null then
    rejection := 'invalid_event_name';
  elsif requested_event_version is distinct from definition.event_version then
    rejection := 'invalid_event_version';
  elsif actor_id is null and requested_anonymous_session_id is null then
    rejection := 'missing_actor_or_session';
  elsif actor_id is null and not definition.public_allowed then
    rejection := 'anonymous_event_not_allowed';
  elsif char_length(resolved_surface) > 80 then
    rejection := 'invalid_surface';
  elsif requested_occurred_at > now() + interval '1 day' or requested_occurred_at < now() - interval '30 days' then
    rejection := 'invalid_occurred_at';
  elsif not private.product_event_metadata_is_valid(coalesce(requested_metadata,'{}'::jsonb)) then
    rejection := 'invalid_metadata';
  elsif requested_deduplication_key is not null and (
    char_length(requested_deduplication_key) > 120
    or requested_deduplication_key !~ '^[a-z0-9][a-z0-9_:-]*$'
  ) then
    rejection := 'invalid_deduplication_key';
  end if;

  if rejection is null then
    if actor_id is not null then
      select count(*) into recent_count
      from public.product_events event_row
      where event_row.actor_user_id = actor_id
        and event_row.created_at >= now() - interval '1 hour';
    else
      select count(*) into recent_count
      from public.product_events event_row
      where event_row.actor_user_id is null
        and event_row.anonymous_session_id = requested_anonymous_session_id
        and event_row.created_at >= now() - interval '1 hour';
    end if;
    if recent_count >= case when actor_id is null then 250 else 1000 end then
      rejection := 'analytics_rate_limited';
    end if;
  end if;

  if rejection is not null then
    perform private.log_product_event_rejection(actor_id, requested_anonymous_session_id, rejection, resolved_traffic, resolved_surface);
    return query select false, null::bigint, rejection;
    return;
  end if;

  if actor_id is not null then
    if exists (select 1 from public.kleio_admins admin_row where admin_row.user_id = actor_id) then
      resolved_role := 'admin';
    else
      select coalesce(profile.role::text,'unknown') into resolved_role
      from public.profiles profile
      where profile.id = actor_id;
      resolved_role := coalesce(resolved_role,'unknown');
    end if;
  end if;

  safe_metadata := public.sanitize_product_event_metadata(requested_metadata);

  insert into public.product_events (
    actor_user_id, anonymous_session_id, event_name, event_version, surface, product_area,
    release_channel, traffic_class, actor_role, workflow_id, opportunity_id, metadata,
    app_version, locale, viewport, acquisition_source, occurred_at, deduplication_key, ingestion_status
  ) values (
    actor_id, requested_anonymous_session_id, definition.event_name, definition.event_version,
    resolved_surface, definition.product_area, resolved_release, resolved_traffic, resolved_role,
    requested_workflow_id, requested_opportunity_id, safe_metadata,
    left(coalesce(requested_app_version,''),80), left(coalesce(requested_locale,''),20),
    resolved_viewport, resolved_acquisition, requested_occurred_at,
    nullif(requested_deduplication_key,''), 'accepted'
  )
  on conflict do nothing
  returning id into inserted_id;

  if inserted_id is null then
    perform private.log_product_event_rejection(actor_id, requested_anonymous_session_id, 'duplicate_event_ignored', resolved_traffic, resolved_surface);
    return query select true, null::bigint, 'duplicate_event_ignored'::text;
  else
    return query select true, inserted_id, null::text;
  end if;
end;
$$;

revoke all on function public.record_product_event(text,integer,text,text,uuid,uuid,uuid,text,text,text,text,jsonb,text,timestamptz) from public;
grant execute on function public.record_product_event(text,integer,text,text,uuid,uuid,uuid,text,text,text,text,jsonb,text,timestamptz) to anon, authenticated;

create table if not exists public.artist_product_milestones (
  artist_user_id uuid primary key references auth.users(id) on delete cascade,
  account_created_at timestamptz,
  onboarding_completed_at timestamptz,
  first_value_at timestamptz,
  first_value_source text check (first_value_source is null or first_value_source in ('artwork_record','passport_record')),
  activated_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.artist_product_milestones enable row level security;
drop policy if exists artist_product_milestones_read_own on public.artist_product_milestones;
create policy artist_product_milestones_read_own
on public.artist_product_milestones for select to authenticated
using ((select auth.uid()) = artist_user_id);
drop policy if exists artist_product_milestones_admin_read on public.artist_product_milestones;
create policy artist_product_milestones_admin_read
on public.artist_product_milestones for select to authenticated
using (private.is_kleio_admin());
revoke all on table public.artist_product_milestones from anon, authenticated;
grant select on table public.artist_product_milestones to authenticated;
create index if not exists artist_product_milestones_activation_idx
  on public.artist_product_milestones(activated_at desc) where activated_at is not null;
create index if not exists artist_product_milestones_first_value_idx
  on public.artist_product_milestones(first_value_at desc) where first_value_at is not null;

create or replace function private.insert_durable_product_event(
  target_artist_user_id uuid,
  target_event_name text,
  target_product_area text,
  target_occurred_at timestamptz,
  target_deduplication_key text,
  target_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  target_traffic text;
begin
  if target_artist_user_id is null or target_occurred_at is null then return; end if;
  target_traffic := private.classify_product_event_traffic(target_artist_user_id, 'server_milestone', 'founding_artist_beta');
  insert into public.product_events (
    actor_user_id, anonymous_session_id, event_name, event_version, surface, product_area,
    release_channel, traffic_class, actor_role, metadata, app_version, locale, viewport,
    acquisition_source, occurred_at, deduplication_key, ingestion_status
  ) values (
    target_artist_user_id, null, target_event_name, 1, 'server_milestone', target_product_area,
    'founding_artist_beta', target_traffic, 'artist', public.sanitize_product_event_metadata(target_metadata),
    'database', '', 'unknown', 'unknown', target_occurred_at, target_deduplication_key, 'accepted'
  ) on conflict do nothing;
end;
$$;

revoke all on function private.insert_durable_product_event(uuid,text,text,timestamptz,text,jsonb) from public, anon, authenticated;
grant execute on function private.insert_durable_product_event(uuid,text,text,timestamptz,text,jsonb) to service_role;

create or replace function private.refresh_artist_product_milestones(target_artist_user_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  profile_created_at timestamptz;
  onboarding_at timestamptz;
  artwork_at timestamptz;
  passport_at timestamptz;
  first_at timestamptz;
  first_source text;
  activation_at timestamptz;
  activation_row public.artist_activation_status%rowtype;
begin
  if target_artist_user_id is null then return; end if;

  select profile.created_at,
         case when profile.onboarding_completed then profile.updated_at else null end
  into profile_created_at, onboarding_at
  from public.profiles profile
  where profile.id = target_artist_user_id and profile.role::text = 'artist';

  if profile_created_at is null then
    delete from public.artist_product_milestones where artist_user_id = target_artist_user_id;
    return;
  end if;

  select min(work.created_at) into artwork_at
  from public.portfolio_works work
  where work.artist_user_id = target_artist_user_id
    and work.approval_status = 'approved'
    and length(trim(work.title)) > 0
    and length(trim(work.medium)) > 0
    and nullif(trim(coalesce(work.image_path,'')), '') is not null;

  select min(coalesce(record.confirmed_at, record.created_at)) into passport_at
  from public.artist_passport_records record
  where record.artist_user_id = target_artist_user_id
    and record.status = 'active'
    and record.provenance_status = 'confirmed'
    and coalesce(record.confirmed_at, record.created_at) is not null
    and length(trim(record.display_value)) >= 3
    and record.record_type not in ('professional_name','location','website_url','instagram_url');

  if artwork_at is not null and (passport_at is null or artwork_at <= passport_at) then
    first_at := artwork_at;
    first_source := 'artwork_record';
  elsif passport_at is not null then
    first_at := passport_at;
    first_source := 'passport_record';
  end if;

  select * into activation_row
  from public.artist_activation_status status_row
  where status_row.artist_user_id = target_artist_user_id;

  if activation_row.artist_user_id is not null
    and activation_row.onboarding_completed
    and activation_row.three_works_added
    and activation_row.core_passport_completed
    and activation_row.opportunity_action_completed
  then
    activation_at := coalesce(activation_row.activated_at, activation_row.updated_at, now());
  end if;

  insert into public.artist_product_milestones (
    artist_user_id, account_created_at, onboarding_completed_at, first_value_at,
    first_value_source, activated_at, updated_at
  ) values (
    target_artist_user_id, profile_created_at, onboarding_at, first_at, first_source, activation_at, now()
  )
  on conflict (artist_user_id) do update
  set account_created_at = coalesce(public.artist_product_milestones.account_created_at, excluded.account_created_at),
      onboarding_completed_at = coalesce(public.artist_product_milestones.onboarding_completed_at, excluded.onboarding_completed_at),
      first_value_at = coalesce(public.artist_product_milestones.first_value_at, excluded.first_value_at),
      first_value_source = coalesce(public.artist_product_milestones.first_value_source, excluded.first_value_source),
      activated_at = coalesce(public.artist_product_milestones.activated_at, excluded.activated_at),
      updated_at = now();

  perform private.insert_durable_product_event(target_artist_user_id, 'account_created', 'authentication', profile_created_at, 'account_created:v1');
  if onboarding_at is not null then
    perform private.insert_durable_product_event(target_artist_user_id, 'onboarding_completed', 'onboarding', onboarding_at, 'onboarding_completed:v1');
  end if;
  if first_at is not null then
    perform private.insert_durable_product_event(target_artist_user_id, 'first_value_reached', 'creative_passport', first_at, 'first_value_reached:v1', jsonb_build_object('source',first_source));
  end if;
  if activation_at is not null then
    perform private.insert_durable_product_event(target_artist_user_id, 'artist_activated', 'creative_passport', activation_at, 'artist_activated:v1');
  end if;
end;
$$;

revoke all on function private.refresh_artist_product_milestones(uuid) from public, anon, authenticated;
grant execute on function private.refresh_artist_product_milestones(uuid) to service_role;

create or replace function private.refresh_artist_product_milestones_from_row()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
begin
  if tg_table_name = 'profiles' then
    target_user_id := case when tg_op = 'DELETE' then old.id else new.id end;
  else
    target_user_id := case when tg_op = 'DELETE' then old.artist_user_id else new.artist_user_id end;
  end if;
  perform private.refresh_artist_product_milestones(target_user_id);
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.refresh_artist_product_milestones_from_row() from public, anon, authenticated;
grant execute on function private.refresh_artist_product_milestones_from_row() to service_role;

drop trigger if exists refresh_product_milestones_from_profiles on public.profiles;
create trigger refresh_product_milestones_from_profiles
after insert or update of onboarding_completed or delete on public.profiles
for each row execute function private.refresh_artist_product_milestones_from_row();

drop trigger if exists refresh_product_milestones_from_portfolio on public.portfolio_works;
create trigger refresh_product_milestones_from_portfolio
after insert or update of title, medium, image_path, approval_status or delete on public.portfolio_works
for each row execute function private.refresh_artist_product_milestones_from_row();

drop trigger if exists refresh_product_milestones_from_passport on public.artist_passport_records;
create trigger refresh_product_milestones_from_passport
after insert or update of display_value, status, provenance_status, confirmed_at or delete on public.artist_passport_records
for each row execute function private.refresh_artist_product_milestones_from_row();

drop trigger if exists refresh_product_milestones_from_activation on public.artist_activation_status;
create trigger refresh_product_milestones_from_activation
after insert or update of onboarding_completed, three_works_added, core_passport_completed, opportunity_action_completed, activated_at on public.artist_activation_status
for each row execute function private.refresh_artist_product_milestones_from_row();

create or replace function private.record_durable_state_event()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
  event_time timestamptz;
  event_name text;
  product_area text;
  dedup_key text;
  metadata jsonb := '{}'::jsonb;
begin
  target_user_id := case when tg_op = 'DELETE' then old.artist_user_id else new.artist_user_id end;
  event_time := case when tg_op = 'DELETE' then now() else coalesce(new.created_at, now()) end;

  if tg_table_name = 'portfolio_works' and tg_op <> 'DELETE' then
    if new.approval_status <> 'approved' or length(trim(new.title)) = 0 or length(trim(new.medium)) = 0 then return new; end if;
    event_name := 'artwork_record_saved'; product_area := 'media_library'; dedup_key := 'portfolio_work:' || new.id::text;
  elsif tg_table_name = 'artist_passport_records' and tg_op <> 'DELETE' then
    if new.status <> 'active' or new.provenance_status <> 'confirmed' or length(trim(new.display_value)) < 3 then return new; end if;
    event_name := 'passport_record_confirmed'; product_area := 'creative_passport'; dedup_key := 'passport_record:' || new.id::text;
  elsif tg_table_name = 'saved_opportunities' then
    event_name := case when tg_op = 'DELETE' then 'opportunity_unsaved' else 'opportunity_saved' end;
    product_area := 'opportunities'; dedup_key := event_name || ':' || (case when tg_op = 'DELETE' then old.id else new.id end)::text;
  elsif tg_table_name = 'application_packages' and tg_op <> 'DELETE' then
    event_name := 'application_preparation_started'; product_area := 'applications'; dedup_key := 'application_package:' || new.id::text;
  elsif tg_table_name = 'artist_media_usages' and tg_op <> 'DELETE' and new.usage_context = 'portfolio_work' then
    event_name := 'portfolio_inclusion_confirmed'; product_area := 'media_library'; dedup_key := 'media_usage:' || new.id::text;
  else
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  perform private.insert_durable_product_event(target_user_id, event_name, product_area, event_time, dedup_key, metadata);
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.record_durable_state_event() from public, anon, authenticated;
grant execute on function private.record_durable_state_event() to service_role;

drop trigger if exists record_artwork_saved_event on public.portfolio_works;
create trigger record_artwork_saved_event
after insert or update of title, medium, approval_status on public.portfolio_works
for each row execute function private.record_durable_state_event();

drop trigger if exists record_passport_confirmed_event on public.artist_passport_records;
create trigger record_passport_confirmed_event
after insert or update of display_value, status, provenance_status, confirmed_at on public.artist_passport_records
for each row execute function private.record_durable_state_event();

drop trigger if exists record_opportunity_saved_event on public.saved_opportunities;
create trigger record_opportunity_saved_event
after insert or delete on public.saved_opportunities
for each row execute function private.record_durable_state_event();

drop trigger if exists record_application_preparation_event on public.application_packages;
create trigger record_application_preparation_event
after insert on public.application_packages
for each row execute function private.record_durable_state_event();

drop trigger if exists record_portfolio_inclusion_event on public.artist_media_usages;
create trigger record_portfolio_inclusion_event
after insert on public.artist_media_usages
for each row execute function private.record_durable_state_event();

do $$
declare
  artist_row record;
begin
  for artist_row in select id from public.profiles where role::text = 'artist' loop
    perform private.refresh_artist_product_milestones(artist_row.id);
  end loop;
end;
$$;

create or replace function public.get_kleio_admin_analytics_snapshot(
  range_start timestamptz default (now() - interval '30 days'),
  range_end timestamptz default now(),
  requested_traffic_class text default 'real_user',
  requested_acquisition_source text default null,
  requested_viewport text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
  relevant_people integer;
begin
  if not private.is_kleio_admin() then
    raise exception using errcode = '42501', message = 'kleio_admin_required';
  end if;
  if range_start is null or range_end is null or range_start >= range_end or range_end - range_start > interval '366 days' then
    raise exception using errcode = '22023', message = 'invalid_analytics_date_range';
  end if;
  if requested_traffic_class not in ('real_user','internal_qa','guided_demo','synthetic_preview','automated_test') then
    raise exception using errcode = '22023', message = 'invalid_analytics_traffic_class';
  end if;

  with base as (
    select event_row.*,
      coalesce('u:' || event_row.actor_user_id::text, 's:' || event_row.anonymous_session_id::text) as person_key
    from public.product_events event_row
    where event_row.occurred_at >= range_start
      and event_row.occurred_at < range_end
      and event_row.traffic_class = requested_traffic_class
      and (requested_acquisition_source is null or event_row.acquisition_source = requested_acquisition_source)
      and (requested_viewport is null or event_row.viewport = requested_viewport)
  ),
  overview as (
    select
      count(distinct person_key) filter (where event_name = 'landing_viewed') as real_visitors,
      count(distinct person_key) filter (where event_name = 'signup_started') as signup_starts,
      count(distinct actor_user_id) filter (where event_name = 'confirmation_completed') as confirmed_accounts,
      count(distinct actor_user_id) filter (where event_name = 'onboarding_completed') as onboarding_completions,
      count(distinct actor_user_id) filter (where event_name = 'first_value_reached') as first_value_artists,
      count(distinct actor_user_id) filter (where event_name = 'artist_activated') as activated_artists,
      count(*) filter (where event_name in ('import_completed','import_partially_completed')) as successful_imports,
      count(*) filter (where event_name = 'import_started') as import_starts,
      count(distinct actor_user_id) filter (where event_name in ('opportunity_saved','readiness_viewed','application_preparation_started')) as opportunity_engaged_artists,
      count(distinct workflow_id) filter (where workflow_id is not null) as workflows,
      count(distinct workflow_id) filter (where workflow_id is not null and event_name in ('user_visible_error','upload_failed','import_failed','autosave_failed','passport_save_failed','onboarding_save_failed')) as failed_workflows
    from base
  ),
  stages(ordinal, stage, event_name) as (
    values
      (1,'Landing viewed','landing_viewed'),
      (2,'Artist signup selected','artist_signup_selected'),
      (3,'Signup started','signup_started'),
      (4,'Account created','account_created'),
      (5,'Confirmation completed','confirmation_completed'),
      (6,'Onboarding completed','onboarding_completed'),
      (7,'First value reached','first_value_reached'),
      (8,'Artist activated','artist_activated')
  ),
  stage_counts as (
    select stages.ordinal, stages.stage, stages.event_name,
      count(distinct base.person_key) as people
    from stages left join base on base.event_name = stages.event_name
    group by stages.ordinal, stages.stage, stages.event_name
  ),
  stage_first as (
    select base.person_key, stages.ordinal, min(base.occurred_at) as reached_at
    from base join stages on stages.event_name = base.event_name
    group by base.person_key, stages.ordinal
  ),
  stage_medians as (
    select current_stage.ordinal,
      percentile_cont(0.5) within group (
        order by extract(epoch from (current_stage.reached_at - previous_stage.reached_at)) / 3600.0
      ) filter (where current_stage.reached_at >= previous_stage.reached_at) as median_hours
    from stage_first current_stage
    left join stage_first previous_stage
      on previous_stage.person_key = current_stage.person_key
     and previous_stage.ordinal = current_stage.ordinal - 1
    group by current_stage.ordinal
  ),
  funnel as (
    select jsonb_agg(jsonb_build_object(
      'ordinal', stage_counts.ordinal,
      'stage', stage_counts.stage,
      'event_name', stage_counts.event_name,
      'people', stage_counts.people,
      'conversion_from_previous_pct', case when lag(stage_counts.people) over (order by stage_counts.ordinal) > 0
        then round(100.0 * stage_counts.people / lag(stage_counts.people) over (order by stage_counts.ordinal),1)
        else null end,
      'dropoff_from_previous_pct', case when lag(stage_counts.people) over (order by stage_counts.ordinal) > 0
        then round(100.0 * (lag(stage_counts.people) over (order by stage_counts.ordinal) - stage_counts.people) / lag(stage_counts.people) over (order by stage_counts.ordinal),1)
        else null end,
      'median_hours_from_previous', round(stage_medians.median_hours::numeric,1)
    ) order by stage_counts.ordinal) as value
    from stage_counts left join stage_medians using (ordinal)
  ),
  friction as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'event_name', event_name,
      'error_code', coalesce(nullif(metadata->>'error_code',''), nullif(metadata->>'reason',''), 'unspecified'),
      'viewport', viewport,
      'count', event_count
    ) order by event_count desc), '[]'::jsonb) as value
    from (
      select event_name, metadata, viewport, count(*) as event_count
      from base
      where event_name in (
        'signup_validation_failed','onboarding_validation_failed','onboarding_save_failed','passport_save_failed',
        'upload_failed','import_failed','autosave_failed','session_expired','user_visible_error'
      )
      group by event_name, metadata, viewport
      order by event_count desc
      limit 20
    ) ranked
  ),
  adoption as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'event_name', event_name,
      'people', people,
      'events', events
    ) order by people desc, events desc), '[]'::jsonb) as value
    from (
      select event_name, count(distinct person_key) as people, count(*) as events
      from base
      where event_name in (
        'import_source_selected','import_completed','import_partially_completed','passport_mode_selected',
        'passport_section_completed','proposal_approved','proposal_rejected','search_performed','filter_applied',
        'opportunity_saved','readiness_viewed','application_preparation_started'
      )
      group by event_name
    ) grouped
  ),
  retention as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'activation_week', activation_week,
      'activated_artists', activated_artists,
      'day_1_returned', day_1_returned,
      'day_7_returned', day_7_returned,
      'day_14_returned', day_14_returned
    ) order by activation_week), '[]'::jsonb) as value
    from (
      select date_trunc('week', activated.occurred_at)::date as activation_week,
        count(distinct activated.actor_user_id) as activated_artists,
        count(distinct activated.actor_user_id) filter (where exists (
          select 1 from public.product_events returned
          where returned.actor_user_id = activated.actor_user_id
            and returned.traffic_class = requested_traffic_class
            and returned.occurred_at >= activated.occurred_at + interval '1 day'
            and returned.occurred_at < activated.occurred_at + interval '2 days'
        )) as day_1_returned,
        count(distinct activated.actor_user_id) filter (where exists (
          select 1 from public.product_events returned
          where returned.actor_user_id = activated.actor_user_id
            and returned.traffic_class = requested_traffic_class
            and returned.occurred_at >= activated.occurred_at + interval '7 days'
            and returned.occurred_at < activated.occurred_at + interval '8 days'
        )) as day_7_returned,
        count(distinct activated.actor_user_id) filter (where exists (
          select 1 from public.product_events returned
          where returned.actor_user_id = activated.actor_user_id
            and returned.traffic_class = requested_traffic_class
            and returned.occurred_at >= activated.occurred_at + interval '14 days'
            and returned.occurred_at < activated.occurred_at + interval '15 days'
        )) as day_14_returned
      from base activated
      where activated.event_name = 'artist_activated' and activated.actor_user_id is not null
      group by date_trunc('week', activated.occurred_at)::date
    ) cohorts
  ),
  quality as (
    select jsonb_build_object(
      'traffic_classes', (
        select coalesce(jsonb_object_agg(traffic_class, event_count), '{}'::jsonb)
        from (
          select traffic_class, count(*) as event_count
          from public.product_events
          where occurred_at >= range_start and occurred_at < range_end
          group by traffic_class
        ) traffic
      ),
      'rejected_events', (select count(*) from private.product_event_ingestion_rejections where created_at >= range_start and created_at < range_end),
      'duplicate_attempts', (select count(*) from private.product_event_ingestion_rejections where rejection_code = 'duplicate_event_ignored' and created_at >= range_start and created_at < range_end),
      'missing_event_versions', (select count(*) from public.product_events where event_version is null and occurred_at >= range_start and occurred_at < range_end),
      'last_successful_ingestion_at', (select max(created_at) from public.product_events),
      'last_rejection_at', (select max(created_at) from private.product_event_ingestion_rejections)
    ) as value
  )
  select jsonb_build_object(
    'range', jsonb_build_object('start',range_start,'end',range_end,'traffic_class',requested_traffic_class,'acquisition_source',requested_acquisition_source,'viewport',requested_viewport),
    'overview', jsonb_build_object(
      'real_visitors', overview.real_visitors,
      'signup_starts', overview.signup_starts,
      'confirmed_accounts', overview.confirmed_accounts,
      'onboarding_completions', overview.onboarding_completions,
      'first_value_artists', overview.first_value_artists,
      'activated_artists', overview.activated_artists,
      'upload_success_rate_pct', case when overview.import_starts > 0 then round(100.0 * overview.successful_imports / overview.import_starts,1) else null end,
      'opportunity_engaged_artists', overview.opportunity_engaged_artists,
      'error_free_workflow_rate_pct', case when overview.workflows > 0 then round(100.0 * (overview.workflows - overview.failed_workflows) / overview.workflows,1) else null end
    ),
    'funnel', funnel.value,
    'friction', friction.value,
    'feature_adoption', adoption.value,
    'cohorts', retention.value,
    'data_quality', quality.value,
    'sample_warnings', jsonb_build_array(
      case when (select count(distinct person_key) from base) < 10 then 'Fewer than 10 relevant people are represented; percentages are directional only.' end,
      case when coalesce((quality.value->'traffic_classes'->>'internal_qa')::integer,0) > coalesce((quality.value->'traffic_classes'->>'real_user')::integer,0) then 'Internal QA activity exceeds real-user activity in this range.' end,
      'Analytics definitions changed with the founding artist beta architecture; compare counts alongside percentages.'
    ) - 'null'::jsonb
  ) into result
  from overview, funnel, friction, adoption, retention, quality;

  return result;
end;
$$;

revoke all on function public.get_kleio_admin_analytics_snapshot(timestamptz,timestamptz,text,text,text) from public;
grant execute on function public.get_kleio_admin_analytics_snapshot(timestamptz,timestamptz,text,text,text) to authenticated;

comment on table public.product_events is
  'First-party, privacy-limited KLEIO product events. Direct browser inserts are revoked; the controlled record_product_event RPC validates taxonomy, metadata, identity, traffic class and rate limits.';
comment on table public.artist_product_milestones is
  'Durable artist account, onboarding, first-value and analytics-activation timestamps derived from authoritative product records.';
comment on function public.record_product_event(text,integer,text,text,uuid,uuid,uuid,text,text,text,text,jsonb,text,timestamptz) is
  'Controlled non-blocking product event ingestion. It never accepts arbitrary traffic class, product area, actor identity or nested metadata.';
comment on function public.get_kleio_admin_analytics_snapshot(timestamptz,timestamptz,text,text,text) is
  'Administrator-only aggregate analytics snapshot. Returns no raw artist records, user UUIDs, private content or unrestricted event history.';
