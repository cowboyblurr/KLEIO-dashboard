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

create index if not exists product_events_traffic_time_idx on public.product_events(traffic_class, occurred_at desc);
create index if not exists product_events_area_name_time_idx on public.product_events(product_area, event_name, occurred_at desc);
create index if not exists product_events_actor_time_idx on public.product_events(actor_user_id, occurred_at desc) where actor_user_id is not null;
create index if not exists product_events_session_time_idx on public.product_events(anonymous_session_id, occurred_at desc) where anonymous_session_id is not null;
create index if not exists product_events_workflow_time_idx on public.product_events(workflow_id, occurred_at desc) where workflow_id is not null;
create index if not exists product_events_acquisition_time_idx on public.product_events(acquisition_source, occurred_at desc);
create unique index if not exists product_events_actor_dedup_idx on public.product_events(actor_user_id, event_name, deduplication_key) where actor_user_id is not null and deduplication_key is not null;
create unique index if not exists product_events_session_dedup_idx on public.product_events(anonymous_session_id, event_name, deduplication_key) where actor_user_id is null and anonymous_session_id is not null and deduplication_key is not null;

create or replace function private.classify_product_event_traffic(target_user_id uuid, target_surface text, target_release_channel text)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when target_user_id is not null and exists (select 1 from private.analytics_internal_actors internal_actor where internal_actor.user_id = target_user_id) then 'internal_qa'
    when target_release_channel = 'guided_demo' or target_surface like 'guided_demo%' then 'guided_demo'
    when target_release_channel = 'synthetic_preview' then 'synthetic_preview'
    else 'real_user'
  end;
$$;

revoke all on function private.classify_product_event_traffic(uuid,text,text) from public, anon, authenticated;
grant execute on function private.classify_product_event_traffic(uuid,text,text) to service_role;

create or replace function private.log_product_event_rejection(target_actor_user_id uuid, target_anonymous_session_id uuid, target_rejection_code text, target_traffic_class text, target_surface text)
returns void
language sql
volatile
security invoker
set search_path = ''
as $$
  insert into private.product_event_ingestion_rejections (actor_user_id, anonymous_session_id, rejection_code, traffic_class, surface)
  values (
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
  select * into definition from private.product_event_definitions catalog where catalog.event_name = requested_event_name;
  resolved_release := case when requested_release_channel in ('founding_artist_beta','guided_demo','synthetic_preview') then requested_release_channel else 'founding_artist_beta' end;
  resolved_traffic := private.classify_product_event_traffic(actor_id, resolved_surface, resolved_release);

  if definition.event_name is null then
    rejection := 'invalid_event_name';
  elsif requested_event_version is distinct from definition.event_version then
    rejection := 'invalid_event_version';
  elsif actor_id is null and requested_anonymous_session_id is null then
    rejection := 'missing_actor_or_session';
  elsif actor_id is null and not definition.public_allowed then
    rejection := 'anonymous_event_not_allowed';
  elsif requested_occurred_at is null or requested_occurred_at > now() + interval '1 day' or requested_occurred_at < now() - interval '30 days' then
    rejection := 'invalid_occurred_at';
  elsif not private.product_event_metadata_is_valid(coalesce(requested_metadata,'{}'::jsonb)) then
    rejection := 'invalid_metadata';
  elsif requested_deduplication_key is not null and (char_length(requested_deduplication_key) > 120 or requested_deduplication_key !~ '^[a-z0-9][a-z0-9_:-]*$') then
    rejection := 'invalid_deduplication_key';
  end if;

  if rejection is null then
    if actor_id is not null then
      select count(*) into recent_count from public.product_events event_row where event_row.actor_user_id = actor_id and event_row.created_at >= now() - interval '1 hour';
    else
      select count(*) into recent_count from public.product_events event_row where event_row.actor_user_id is null and event_row.anonymous_session_id = requested_anonymous_session_id and event_row.created_at >= now() - interval '1 hour';
    end if;
    if recent_count >= case when actor_id is null then 250 else 1000 end then rejection := 'analytics_rate_limited'; end if;
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
      select coalesce(profile.role::text,'unknown') into resolved_role from public.profiles profile where profile.id = actor_id;
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
  ) on conflict do nothing returning id into inserted_id;

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

comment on table public.product_events is
  'First-party, privacy-limited KLEIO product events. Direct browser inserts are revoked; the controlled record_product_event RPC validates taxonomy, metadata, identity, traffic class and rate limits.';
comment on function public.record_product_event(text,integer,text,text,uuid,uuid,uuid,text,text,text,text,jsonb,text,timestamptz) is
  'Controlled product-event ingestion. It never accepts arbitrary traffic class, product area, actor identity, nested metadata, raw text or private content.';
