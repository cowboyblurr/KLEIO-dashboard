-- Optional Gmail beta delivery.
-- Google OAuth is limited to identity + gmail.send. Refresh tokens live in
-- Supabase Vault and are never exposed through browser-readable connection rows.

create table if not exists private.external_connection_secrets (
  connection_id uuid primary key references public.external_connections(id) on delete cascade,
  refresh_token_secret_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

revoke all on table private.external_connection_secrets from public, anon, authenticated;
grant select, insert, update, delete on table private.external_connection_secrets to service_role;

create table if not exists public.gmail_oauth_states (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  state_hash text not null unique check (state_hash ~ '^[a-f0-9]{64}$'),
  return_path text not null default '/artist-dashboard/applications/',
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists gmail_oauth_states_artist_idx
  on public.gmail_oauth_states(artist_user_id, created_at desc);
create index if not exists gmail_oauth_states_expiry_idx
  on public.gmail_oauth_states(expires_at) where used_at is null;

alter table public.gmail_oauth_states enable row level security;
revoke all privileges on table public.gmail_oauth_states from anon, authenticated;
grant select, insert, update, delete on table public.gmail_oauth_states to service_role;

-- Provider send claims protect against double-clicks, two-tab races, and blind
-- retry after an ambiguous network response.
alter table public.application_deliveries
  add column if not exists provider_send_claim_id uuid,
  add column if not exists provider_send_claimed_at timestamptz,
  add column if not exists provider_unknown_at timestamptz;

alter table public.application_deliveries
  drop constraint if exists application_deliveries_state_check;
alter table public.application_deliveries
  add constraint application_deliveries_state_check check (
    state in (
      'prepared','handoff_prepared','provider_sending','provider_unknown',
      'provider_accepted','artist_reported_sent','review_room_opened',
      'receipt_confirmed','conversation_started','failed','cancelled'
    )
  );

create or replace function public.store_gmail_connection_secret_service(
  target_artist_user_id uuid,
  target_refresh_token text,
  target_account_id text,
  target_account_email text,
  target_scopes text[]
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'private', 'vault'
as $$
declare
  connection_row public.external_connections%rowtype;
  secret_row private.external_connection_secrets%rowtype;
  secret_id uuid;
begin
  if target_artist_user_id is null or btrim(coalesce(target_refresh_token,'')) = '' then
    raise exception 'gmail_refresh_token_required';
  end if;
  if btrim(coalesce(target_account_email,'')) = '' then
    raise exception 'gmail_account_email_required';
  end if;

  select * into connection_row
  from public.external_connections
  where artist_user_id = target_artist_user_id and provider = 'gmail'
  for update;

  if connection_row.id is null then
    insert into public.external_connections (
      artist_user_id, provider, status, provider_account_id, provider_account_email,
      scopes, token_ciphertext, refresh_token_ciphertext, connected_at,
      last_error_code, last_error_message, metadata, updated_at
    ) values (
      target_artist_user_id, 'gmail', 'connected', coalesce(target_account_id,''), lower(btrim(target_account_email)),
      coalesce(target_scopes,'{}'::text[]), '', '', now(), '', '',
      jsonb_build_object('oauth_flow','gmail_send_only_v1','token_storage','supabase_vault'), now()
    ) returning * into connection_row;
  else
    update public.external_connections
    set status='connected',
        provider_account_id=coalesce(target_account_id,''),
        provider_account_email=lower(btrim(target_account_email)),
        scopes=coalesce(target_scopes,'{}'::text[]),
        token_ciphertext='',
        refresh_token_ciphertext='',
        connected_at=coalesce(connected_at,now()),
        last_error_code='',
        last_error_message='',
        metadata=jsonb_build_object('oauth_flow','gmail_send_only_v1','token_storage','supabase_vault'),
        updated_at=now()
    where id=connection_row.id
    returning * into connection_row;
  end if;

  select * into secret_row
  from private.external_connection_secrets
  where connection_id=connection_row.id
  for update;

  if secret_row.connection_id is null then
    select vault.create_secret(
      target_refresh_token,
      'kleio-gmail-refresh-' || connection_row.id::text,
      'KLEIO Gmail send-only OAuth refresh token',
      null
    ) into secret_id;

    insert into private.external_connection_secrets(connection_id,refresh_token_secret_id)
    values(connection_row.id,secret_id);
  else
    secret_id := secret_row.refresh_token_secret_id;
    perform vault.update_secret(
      secret_id,
      target_refresh_token,
      'kleio-gmail-refresh-' || connection_row.id::text,
      'KLEIO Gmail send-only OAuth refresh token',
      null
    );
    update private.external_connection_secrets set updated_at=now() where connection_id=connection_row.id;
  end if;

  return connection_row.id;
end;
$$;

create or replace function public.get_gmail_connection_secret_service(target_artist_user_id uuid)
returns table(
  connection_id uuid,
  status text,
  account_email text,
  scopes text[],
  refresh_token text
)
language sql
security definer
set search_path to 'public', 'private', 'vault'
as $$
  select connection.id,
         connection.status,
         connection.provider_account_email,
         connection.scopes,
         decrypted.decrypted_secret
  from public.external_connections connection
  join private.external_connection_secrets secret_map on secret_map.connection_id=connection.id
  join vault.decrypted_secrets decrypted on decrypted.id=secret_map.refresh_token_secret_id
  where connection.artist_user_id=target_artist_user_id
    and connection.provider='gmail'
  limit 1;
$$;

create or replace function public.disconnect_gmail_connection_service(target_artist_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'private', 'vault'
as $$
declare
  connection_id uuid;
  secret_id uuid;
begin
  select connection.id, secret_map.refresh_token_secret_id
  into connection_id, secret_id
  from public.external_connections connection
  left join private.external_connection_secrets secret_map on secret_map.connection_id=connection.id
  where connection.artist_user_id=target_artist_user_id
    and connection.provider='gmail'
  limit 1;

  if connection_id is null then
    return false;
  end if;

  delete from public.external_connections where id=connection_id;
  if secret_id is not null then
    delete from vault.secrets where id=secret_id;
  end if;
  return true;
end;
$$;

create or replace function public.claim_gmail_delivery_send_service(
  target_artist_user_id uuid,
  target_submission_version_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  version_row public.application_submission_versions%rowtype;
  delivery_row public.application_deliveries%rowtype;
  connection_row public.external_connections%rowtype;
  claim_id uuid := gen_random_uuid();
begin
  select * into version_row
  from public.application_submission_versions
  where id=target_submission_version_id
    and artist_user_id=target_artist_user_id;

  if version_row.id is null then
    raise exception 'submission_version_not_found';
  end if;
  if version_row.submission_method <> 'email' then
    raise exception 'gmail_delivery_requires_email_submission';
  end if;
  if btrim(coalesce(version_row.destination,'')) = '' then
    raise exception 'gmail_delivery_destination_missing';
  end if;

  select * into connection_row
  from public.external_connections
  where artist_user_id=target_artist_user_id
    and provider='gmail'
    and status='connected';
  if connection_row.id is null then
    raise exception 'gmail_connection_required';
  end if;

  select * into delivery_row
  from public.application_deliveries
  where submission_version_id=version_row.id and channel='gmail'
  for update;

  if delivery_row.id is not null then
    if delivery_row.state in ('provider_accepted','review_room_opened','receipt_confirmed','conversation_started') then
      return jsonb_build_object('status','already_sent','delivery_id',delivery_row.id,'provider_reference',delivery_row.provider_reference);
    end if;
    if delivery_row.state='provider_unknown' then
      return jsonb_build_object('status','provider_status_unknown','delivery_id',delivery_row.id);
    end if;
    if delivery_row.state='provider_sending'
       and delivery_row.provider_send_claimed_at > now()-interval '2 minutes' then
      return jsonb_build_object('status','send_in_progress','delivery_id',delivery_row.id);
    end if;
    if delivery_row.state='cancelled' then
      return jsonb_build_object('status','cancelled','delivery_id',delivery_row.id);
    end if;

    update public.application_deliveries
    set state='provider_sending',
        evidence_level='system_observed',
        provider='google_gmail',
        provider_send_claim_id=claim_id,
        provider_send_claimed_at=now(),
        last_error_code='',
        last_error_message='',
        updated_at=now()
    where id=delivery_row.id
    returning * into delivery_row;
  else
    insert into public.application_deliveries(
      submission_version_id,package_id,artist_user_id,opportunity_id,
      channel,destination,state,evidence_level,provider,
      provider_send_claim_id,provider_send_claimed_at
    ) values (
      version_row.id,version_row.package_id,version_row.artist_user_id,version_row.opportunity_id,
      'gmail',version_row.destination,'provider_sending','system_observed','google_gmail',
      claim_id,now()
    ) returning * into delivery_row;
  end if;

  return jsonb_build_object(
    'status','claimed',
    'delivery_id',delivery_row.id,
    'claim_id',claim_id,
    'package_id',version_row.package_id,
    'destination',version_row.destination
  );
end;
$$;

create or replace function public.attach_gmail_delivery_access_service(
  target_artist_user_id uuid,
  target_delivery_id uuid,
  target_claim_id uuid,
  target_recipient_access_id uuid
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  delivery_row public.application_deliveries%rowtype;
  access_row public.application_recipient_access%rowtype;
begin
  select * into delivery_row
  from public.application_deliveries
  where id=target_delivery_id
    and artist_user_id=target_artist_user_id
    and channel='gmail'
    and provider_send_claim_id=target_claim_id
  for update;
  if delivery_row.id is null then raise exception 'gmail_delivery_claim_not_found'; end if;

  select * into access_row
  from public.application_recipient_access
  where id=target_recipient_access_id
    and artist_user_id=target_artist_user_id;
  if access_row.id is null
     or access_row.submission_version_id <> delivery_row.submission_version_id
     or access_row.package_id <> delivery_row.package_id then
    raise exception 'gmail_delivery_access_mismatch';
  end if;

  update public.application_deliveries
  set recipient_access_id=access_row.id,updated_at=now()
  where id=delivery_row.id;
  return true;
end;
$$;

create or replace function public.mark_gmail_delivery_result_service(
  target_artist_user_id uuid,
  target_delivery_id uuid,
  target_claim_id uuid,
  target_result text,
  target_provider_reference text default '',
  target_error_code text default '',
  target_error_message text default ''
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  delivery_row public.application_deliveries%rowtype;
  result_state text;
  result_evidence text;
begin
  if target_result not in ('accepted','failed','unknown') then
    raise exception 'invalid_gmail_delivery_result';
  end if;

  select * into delivery_row
  from public.application_deliveries
  where id=target_delivery_id
    and artist_user_id=target_artist_user_id
    and channel='gmail'
    and provider_send_claim_id=target_claim_id
  for update;
  if delivery_row.id is null then raise exception 'gmail_delivery_claim_not_found'; end if;

  result_state := case target_result
    when 'accepted' then 'provider_accepted'
    when 'unknown' then 'provider_unknown'
    else 'failed' end;
  result_evidence := case target_result when 'accepted' then 'provider_confirmed' else 'system_observed' end;

  update public.application_deliveries
  set state=result_state,
      evidence_level=result_evidence,
      provider='google_gmail',
      provider_reference=case when target_provider_reference<>'' then target_provider_reference else provider_reference end,
      last_error_code=coalesce(target_error_code,''),
      last_error_message=left(coalesce(target_error_message,''),500),
      provider_accepted_at=case when target_result='accepted' then coalesce(provider_accepted_at,now()) else provider_accepted_at end,
      provider_unknown_at=case when target_result='unknown' then coalesce(provider_unknown_at,now()) else provider_unknown_at end,
      updated_at=now()
  where id=delivery_row.id
  returning * into delivery_row;

  if target_result='accepted' then
    update public.application_packages
    set state='submitted',
        submitted_at=coalesce(submitted_at,now()),
        provider_confirmation=case when target_provider_reference<>'' then target_provider_reference else provider_confirmation end,
        updated_at=now()
    where id=delivery_row.package_id and artist_user_id=target_artist_user_id;

    insert into public.application_timeline_events(
      package_id,submission_version_id,artist_user_id,event_type,evidence_level,
      actor_kind,summary,metadata,idempotency_key
    ) values (
      delivery_row.package_id,delivery_row.submission_version_id,target_artist_user_id,
      'gmail_provider_accepted','provider_confirmed','system',
      'Connected Gmail accepted the outgoing application message for sending. This is not proof the institution received or read it.',
      jsonb_build_object('delivery_id',delivery_row.id,'provider','google_gmail'),
      'gmail-provider-accepted:'||delivery_row.id::text
    ) on conflict (idempotency_key) do nothing;
  elsif target_result='unknown' then
    insert into public.application_timeline_events(
      package_id,submission_version_id,artist_user_id,event_type,evidence_level,
      actor_kind,summary,metadata,idempotency_key
    ) values (
      delivery_row.package_id,delivery_row.submission_version_id,target_artist_user_id,
      'gmail_provider_status_unknown','system_observed','system',
      'KLEIO could not confirm whether Gmail accepted this send. Check Gmail Sent before attempting another delivery path.',
      jsonb_build_object('delivery_id',delivery_row.id,'provider','google_gmail'),
      'gmail-provider-unknown:'||delivery_row.id::text
    ) on conflict (idempotency_key) do nothing;
  end if;

  return jsonb_build_object('delivery_id',delivery_row.id,'state',delivery_row.state,'evidence_level',delivery_row.evidence_level,'provider_reference',delivery_row.provider_reference);
end;
$$;

-- These helpers carry OAuth secrets or provider-send authority. They are never
-- callable from browser roles; only trusted Edge Functions using service_role may execute them.
revoke all on function public.store_gmail_connection_secret_service(uuid,text,text,text,text[]) from public,anon,authenticated;
revoke all on function public.get_gmail_connection_secret_service(uuid) from public,anon,authenticated;
revoke all on function public.disconnect_gmail_connection_service(uuid) from public,anon,authenticated;
revoke all on function public.claim_gmail_delivery_send_service(uuid,uuid) from public,anon,authenticated;
revoke all on function public.attach_gmail_delivery_access_service(uuid,uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function public.mark_gmail_delivery_result_service(uuid,uuid,uuid,text,text,text,text) from public,anon,authenticated;

grant execute on function public.store_gmail_connection_secret_service(uuid,text,text,text,text[]) to service_role;
grant execute on function public.get_gmail_connection_secret_service(uuid) to service_role;
grant execute on function public.disconnect_gmail_connection_service(uuid) to service_role;
grant execute on function public.claim_gmail_delivery_send_service(uuid,uuid) to service_role;
grant execute on function public.attach_gmail_delivery_access_service(uuid,uuid,uuid,uuid) to service_role;
grant execute on function public.mark_gmail_delivery_result_service(uuid,uuid,uuid,text,text,text,text) to service_role;

comment on table private.external_connection_secrets is
  'Server-only mapping between a KLEIO external connection and its Supabase Vault refresh-token secret. Never exposed to browser roles.';
comment on function public.claim_gmail_delivery_send_service(uuid,uuid) is
  'Service-only atomic Gmail send lease. Prevents duplicate provider sends across double-clicks/tabs and blocks blind retry after ambiguous provider status.';
