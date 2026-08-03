create table if not exists public.artist_product_milestones (
  artist_user_id uuid primary key references auth.users(id) on delete cascade,
  account_created_at timestamptz,
  confirmation_completed_at timestamptz,
  onboarding_completed_at timestamptz,
  first_value_at timestamptz,
  first_value_source text check (first_value_source is null or first_value_source in ('artwork_record','passport_record')),
  activated_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.artist_product_milestones enable row level security;

drop policy if exists artist_product_milestones_read_own on public.artist_product_milestones;
create policy artist_product_milestones_read_own
on public.artist_product_milestones
for select
to authenticated
using ((select auth.uid()) = artist_user_id);

drop policy if exists artist_product_milestones_admin_read on public.artist_product_milestones;
create policy artist_product_milestones_admin_read
on public.artist_product_milestones
for select
to authenticated
using (private.is_kleio_admin());

revoke all on table public.artist_product_milestones from anon, authenticated;
grant select on table public.artist_product_milestones to authenticated;

create index if not exists artist_product_milestones_account_idx
  on public.artist_product_milestones(account_created_at desc)
  where account_created_at is not null;
create index if not exists artist_product_milestones_confirmation_idx
  on public.artist_product_milestones(confirmation_completed_at desc)
  where confirmation_completed_at is not null;
create index if not exists artist_product_milestones_first_value_idx
  on public.artist_product_milestones(first_value_at desc)
  where first_value_at is not null;
create index if not exists artist_product_milestones_activation_idx
  on public.artist_product_milestones(activated_at desc)
  where activated_at is not null;

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
  if target_artist_user_id is null or target_occurred_at is null then
    return;
  end if;

  target_traffic := private.classify_product_event_traffic(
    target_artist_user_id,
    'server_milestone',
    'founding_artist_beta'
  );

  insert into public.product_events (
    actor_user_id,
    anonymous_session_id,
    event_name,
    event_version,
    surface,
    product_area,
    release_channel,
    traffic_class,
    actor_role,
    metadata,
    app_version,
    locale,
    viewport,
    acquisition_source,
    occurred_at,
    deduplication_key,
    ingestion_status
  ) values (
    target_artist_user_id,
    null,
    target_event_name,
    1,
    'server_milestone',
    target_product_area,
    'founding_artist_beta',
    target_traffic,
    'artist',
    public.sanitize_product_event_metadata(target_metadata),
    'database',
    '',
    'unknown',
    'unknown',
    target_occurred_at,
    target_deduplication_key,
    'accepted'
  )
  on conflict do nothing;
end;
$$;

revoke all on function private.insert_durable_product_event(uuid,text,text,timestamptz,text,jsonb)
from public, anon, authenticated;
grant execute on function private.insert_durable_product_event(uuid,text,text,timestamptz,text,jsonb)
to service_role;

create or replace function private.refresh_artist_product_milestones(target_artist_user_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  account_at timestamptz;
  confirmation_at timestamptz;
  onboarding_at timestamptz;
  artwork_at timestamptz;
  passport_at timestamptz;
  first_at timestamptz;
  first_source text;
  activation_at timestamptz;
  activation_row public.artist_activation_status%rowtype;
begin
  if target_artist_user_id is null then
    return;
  end if;

  select
    auth_user.created_at,
    auth_user.email_confirmed_at
  into account_at, confirmation_at
  from auth.users auth_user
  where auth_user.id = target_artist_user_id;

  if account_at is null
    or not exists (
      select 1
      from public.profiles profile
      where profile.id = target_artist_user_id
        and profile.role::text = 'artist'
    )
  then
    delete from public.artist_product_milestones
    where artist_user_id = target_artist_user_id;
    return;
  end if;

  select case when profile.onboarding_completed then profile.updated_at else null end
  into onboarding_at
  from public.profiles profile
  where profile.id = target_artist_user_id;

  select min(work.created_at)
  into artwork_at
  from public.portfolio_works work
  where work.artist_user_id = target_artist_user_id
    and work.approval_status = 'approved'
    and length(trim(work.title)) > 0
    and length(trim(work.medium)) > 0
    and nullif(trim(coalesce(work.image_path,'')), '') is not null;

  select min(coalesce(record.confirmed_at, record.created_at))
  into passport_at
  from public.artist_passport_records record
  where record.artist_user_id = target_artist_user_id
    and record.status = 'active'
    and record.provenance_status = 'confirmed'
    and length(trim(record.display_value)) >= 3
    and record.record_type not in (
      'professional_name',
      'location',
      'website_url',
      'instagram_url'
    );

  if artwork_at is not null and (passport_at is null or artwork_at <= passport_at) then
    first_at := artwork_at;
    first_source := 'artwork_record';
  elsif passport_at is not null then
    first_at := passport_at;
    first_source := 'passport_record';
  end if;

  select *
  into activation_row
  from public.artist_activation_status status_row
  where status_row.artist_user_id = target_artist_user_id;

  if activation_row.artist_user_id is not null
    and activation_row.onboarding_completed
    and activation_row.three_works_added
    and activation_row.core_passport_completed
    and activation_row.opportunity_action_completed
  then
    activation_at := coalesce(
      activation_row.activated_at,
      activation_row.updated_at,
      now()
    );
  end if;

  insert into public.artist_product_milestones (
    artist_user_id,
    account_created_at,
    confirmation_completed_at,
    onboarding_completed_at,
    first_value_at,
    first_value_source,
    activated_at,
    updated_at
  ) values (
    target_artist_user_id,
    account_at,
    confirmation_at,
    onboarding_at,
    first_at,
    first_source,
    activation_at,
    now()
  )
  on conflict (artist_user_id) do update
  set account_created_at = coalesce(
        public.artist_product_milestones.account_created_at,
        excluded.account_created_at
      ),
      confirmation_completed_at = coalesce(
        public.artist_product_milestones.confirmation_completed_at,
        excluded.confirmation_completed_at
      ),
      onboarding_completed_at = coalesce(
        public.artist_product_milestones.onboarding_completed_at,
        excluded.onboarding_completed_at
      ),
      first_value_at = coalesce(
        public.artist_product_milestones.first_value_at,
        excluded.first_value_at
      ),
      first_value_source = coalesce(
        public.artist_product_milestones.first_value_source,
        excluded.first_value_source
      ),
      activated_at = coalesce(
        public.artist_product_milestones.activated_at,
        excluded.activated_at
      ),
      updated_at = now();

  perform private.insert_durable_product_event(
    target_artist_user_id,
    'account_created',
    'authentication',
    account_at,
    'account_created:v1'
  );

  if confirmation_at is not null then
    perform private.insert_durable_product_event(
      target_artist_user_id,
      'confirmation_completed',
      'authentication',
      confirmation_at,
      'confirmation_completed:v1'
    );
  end if;

  if onboarding_at is not null then
    perform private.insert_durable_product_event(
      target_artist_user_id,
      'onboarding_completed',
      'onboarding',
      onboarding_at,
      'onboarding_completed:v1'
    );
  end if;

  if first_at is not null then
    perform private.insert_durable_product_event(
      target_artist_user_id,
      'first_value_reached',
      'creative_passport',
      first_at,
      'first_value_reached:v1',
      jsonb_build_object('source', first_source)
    );
  end if;

  if activation_at is not null then
    perform private.insert_durable_product_event(
      target_artist_user_id,
      'artist_activated',
      'creative_passport',
      activation_at,
      'artist_activated:v1'
    );
  end if;
end;
$$;

revoke all on function private.refresh_artist_product_milestones(uuid)
from public, anon, authenticated;
grant execute on function private.refresh_artist_product_milestones(uuid)
to service_role;

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
    target_user_id := case
      when tg_op = 'DELETE' then old.artist_user_id
      else new.artist_user_id
    end;
  end if;

  perform private.refresh_artist_product_milestones(target_user_id);
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.refresh_artist_product_milestones_from_row()
from public, anon, authenticated;
grant execute on function private.refresh_artist_product_milestones_from_row()
to service_role;

drop trigger if exists refresh_product_milestones_from_profiles on public.profiles;
create trigger refresh_product_milestones_from_profiles
after insert or update of onboarding_completed or delete
on public.profiles
for each row
execute function private.refresh_artist_product_milestones_from_row();

drop trigger if exists refresh_product_milestones_from_portfolio on public.portfolio_works;
create trigger refresh_product_milestones_from_portfolio
after insert or update of title, medium, image_path, approval_status or delete
on public.portfolio_works
for each row
execute function private.refresh_artist_product_milestones_from_row();

drop trigger if exists refresh_product_milestones_from_passport on public.artist_passport_records;
create trigger refresh_product_milestones_from_passport
after insert or update of display_value, status, provenance_status, confirmed_at or delete
on public.artist_passport_records
for each row
execute function private.refresh_artist_product_milestones_from_row();

drop trigger if exists refresh_product_milestones_from_activation on public.artist_activation_status;
create trigger refresh_product_milestones_from_activation
after insert or update of onboarding_completed, three_works_added, core_passport_completed, opportunity_action_completed, activated_at
on public.artist_activation_status
for each row
execute function private.refresh_artist_product_milestones_from_row();

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
  target_event_name text;
  target_product_area text;
  target_deduplication_key text;
begin
  target_user_id := case
    when tg_op = 'DELETE' then old.artist_user_id
    else new.artist_user_id
  end;

  event_time := case
    when tg_op = 'DELETE' then now()
    else coalesce(new.created_at, now())
  end;

  if tg_table_name = 'portfolio_works' and tg_op <> 'DELETE' then
    if new.approval_status <> 'approved'
      or length(trim(new.title)) = 0
      or length(trim(new.medium)) = 0
    then
      return new;
    end if;
    target_event_name := 'artwork_record_saved';
    target_product_area := 'media_library';
    target_deduplication_key := 'portfolio_work:' || new.id::text;
  elsif tg_table_name = 'artist_passport_records' and tg_op <> 'DELETE' then
    if new.status <> 'active'
      or new.provenance_status <> 'confirmed'
      or length(trim(new.display_value)) < 3
    then
      return new;
    end if;
    target_event_name := 'passport_record_confirmed';
    target_product_area := 'creative_passport';
    target_deduplication_key := 'passport_record:' || new.id::text;
  elsif tg_table_name = 'saved_opportunities' then
    target_event_name := case
      when tg_op = 'DELETE' then 'opportunity_unsaved'
      else 'opportunity_saved'
    end;
    target_product_area := 'opportunities';
    target_deduplication_key := target_event_name || ':' || (
      case when tg_op = 'DELETE' then old.id else new.id end
    )::text;
  elsif tg_table_name = 'application_packages' and tg_op <> 'DELETE' then
    target_event_name := 'application_preparation_started';
    target_product_area := 'applications';
    target_deduplication_key := 'application_package:' || new.id::text;
  elsif tg_table_name = 'artist_media_usages'
    and tg_op <> 'DELETE'
    and new.usage_context = 'portfolio_work'
  then
    target_event_name := 'portfolio_inclusion_confirmed';
    target_product_area := 'media_library';
    target_deduplication_key := 'media_usage:' || new.id::text;
  else
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  perform private.insert_durable_product_event(
    target_user_id,
    target_event_name,
    target_product_area,
    event_time,
    target_deduplication_key
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.record_durable_state_event()
from public, anon, authenticated;
grant execute on function private.record_durable_state_event()
to service_role;

drop trigger if exists record_artwork_saved_event on public.portfolio_works;
create trigger record_artwork_saved_event
after insert or update of title, medium, approval_status
on public.portfolio_works
for each row
execute function private.record_durable_state_event();

drop trigger if exists record_passport_confirmed_event on public.artist_passport_records;
create trigger record_passport_confirmed_event
after insert or update of display_value, status, provenance_status, confirmed_at
on public.artist_passport_records
for each row
execute function private.record_durable_state_event();

drop trigger if exists record_opportunity_saved_event on public.saved_opportunities;
create trigger record_opportunity_saved_event
after insert or delete
on public.saved_opportunities
for each row
execute function private.record_durable_state_event();

drop trigger if exists record_application_preparation_event on public.application_packages;
create trigger record_application_preparation_event
after insert
on public.application_packages
for each row
execute function private.record_durable_state_event();

drop trigger if exists record_portfolio_inclusion_event on public.artist_media_usages;
create trigger record_portfolio_inclusion_event
after insert
on public.artist_media_usages
for each row
execute function private.record_durable_state_event();

do $$
declare
  artist_row record;
begin
  for artist_row in
    select profile.id
    from public.profiles profile
    where profile.role::text = 'artist'
  loop
    perform private.refresh_artist_product_milestones(artist_row.id);
  end loop;
end;
$$;

comment on table public.artist_product_milestones is
  'Durable artist account, confirmation, onboarding, first-value and activation timestamps derived from authoritative KLEIO records.';
comment on function private.refresh_artist_product_milestones(uuid) is
  'Idempotently derives artist milestones from auth, profile, portfolio, Passport and activation records without copying private artist content into analytics.';
