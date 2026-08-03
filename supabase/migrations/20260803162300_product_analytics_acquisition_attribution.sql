create table if not exists private.artist_acquisition_attribution (
  artist_user_id uuid primary key references auth.users(id) on delete cascade,
  acquisition_source text not null check (
    acquisition_source in (
      'direct_outreach',
      'artist_referral',
      'institution_referral',
      'linkedin',
      'instagram',
      'organic_search',
      'direct',
      'opportunity_entry',
      'unknown'
    )
  ),
  anonymous_session_id uuid,
  attributed_at timestamptz not null default now()
);

revoke all on table private.artist_acquisition_attribution
from public, anon, authenticated;
grant select, insert, update, delete
on table private.artist_acquisition_attribution
to service_role;

create index if not exists artist_acquisition_source_idx
  on private.artist_acquisition_attribution(acquisition_source, attributed_at desc);

create or replace function private.apply_first_touch_product_attribution()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  first_source text;
begin
  if new.actor_user_id is null then
    return new;
  end if;

  if new.acquisition_source <> 'unknown' then
    insert into private.artist_acquisition_attribution (
      artist_user_id,
      acquisition_source,
      anonymous_session_id,
      attributed_at
    ) values (
      new.actor_user_id,
      new.acquisition_source,
      new.anonymous_session_id,
      new.occurred_at
    )
    on conflict (artist_user_id) do nothing;
  end if;

  select attribution.acquisition_source
  into first_source
  from private.artist_acquisition_attribution attribution
  where attribution.artist_user_id = new.actor_user_id;

  if first_source is null then
    return new;
  end if;

  if new.acquisition_source is distinct from first_source then
    update public.product_events current_event
    set acquisition_source = first_source
    where current_event.id = new.id;
  end if;

  update public.product_events prior_event
  set acquisition_source = first_source
  where prior_event.actor_user_id = new.actor_user_id
    and prior_event.acquisition_source = 'unknown'
    and prior_event.id <> new.id;

  return new;
end;
$$;

revoke all on function private.apply_first_touch_product_attribution()
from public, anon, authenticated;
grant execute on function private.apply_first_touch_product_attribution()
to service_role;

drop trigger if exists apply_first_touch_product_attribution
on public.product_events;
create trigger apply_first_touch_product_attribution
after insert
on public.product_events
for each row
execute function private.apply_first_touch_product_attribution();

comment on table private.artist_acquisition_attribution is
  'Private first-touch acquisition category for aggregate activation cohorts. Stores only an approved category and optional random session UUID, never a full referrer URL or campaign query string.';
comment on function private.apply_first_touch_product_attribution() is
  'Preserves the first normalized acquisition category for authenticated artists and propagates it to earlier durable milestone events that were created before browser attribution became available.';
