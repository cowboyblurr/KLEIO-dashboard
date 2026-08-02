alter table public.artist_instagram_oauth_states
  add column if not exists processing_at timestamptz,
  add column if not exists last_failure_category text not null default '';

alter table public.artist_instagram_oauth_states
  alter column expires_at set default (now() + interval '15 minutes');

create index if not exists artist_instagram_oauth_states_processing_idx
  on public.artist_instagram_oauth_states (processing_at)
  where used_at is null;

create or replace function public.claim_instagram_oauth_state(p_state_hash text)
returns table (
  status text,
  state_id uuid,
  artist_user_id uuid,
  return_url text,
  created_at timestamptz,
  expires_at timestamptz,
  state_age_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  state_row public.artist_instagram_oauth_states%rowtype;
begin
  select *
  into state_row
  from public.artist_instagram_oauth_states
  where state_hash = p_state_hash
  for update;

  if not found then
    return query select 'not_found'::text, null::uuid, null::uuid, null::text, null::timestamptz, null::timestamptz, null::integer;
    return;
  end if;

  if state_row.used_at is not null then
    return query select 'consumed'::text, state_row.id, state_row.artist_user_id, state_row.return_url,
      state_row.created_at, state_row.expires_at,
      greatest(0, extract(epoch from (now() - state_row.created_at))::integer);
    return;
  end if;

  if state_row.expires_at <= now() then
    return query select 'expired'::text, state_row.id, state_row.artist_user_id, state_row.return_url,
      state_row.created_at, state_row.expires_at,
      greatest(0, extract(epoch from (now() - state_row.created_at))::integer);
    return;
  end if;

  if state_row.processing_at is not null and state_row.processing_at > now() - interval '2 minutes' then
    return query select 'in_progress'::text, state_row.id, state_row.artist_user_id, state_row.return_url,
      state_row.created_at, state_row.expires_at,
      greatest(0, extract(epoch from (now() - state_row.created_at))::integer);
    return;
  end if;

  update public.artist_instagram_oauth_states
  set processing_at = now(),
      last_failure_category = ''
  where id = state_row.id;

  return query select 'claimed'::text, state_row.id, state_row.artist_user_id, state_row.return_url,
    state_row.created_at, state_row.expires_at,
    greatest(0, extract(epoch from (now() - state_row.created_at))::integer);
end;
$$;

revoke all on function public.claim_instagram_oauth_state(text) from public, anon, authenticated;
grant execute on function public.claim_instagram_oauth_state(text) to service_role;

comment on column public.artist_instagram_oauth_states.processing_at is
  'Short-lived callback claim that prevents concurrent OAuth processing without consuming the state early.';
comment on column public.artist_instagram_oauth_states.last_failure_category is
  'Safe normalized callback failure category; never stores codes, tokens, complete states, or secrets.';
comment on function public.claim_instagram_oauth_state(text) is
  'Service-role-only atomic Instagram OAuth state classifier and processing claim using the database clock.';
