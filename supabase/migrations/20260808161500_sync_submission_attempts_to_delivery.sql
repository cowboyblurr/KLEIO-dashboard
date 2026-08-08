-- Bridge the existing truthful artist submission-attempt history into the new
-- immutable-version delivery record. This lets the current `I sent this application`
-- action and the older recipient panel remain compatible while KLEIO converges on
-- application_deliveries as the channel-neutral delivery source of truth.

create or replace function private.sync_application_delivery_from_submission_attempt()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  version_row public.application_submission_versions%rowtype;
  delivery_channel text;
  delivery_state text;
  delivery_evidence text;
  active_access_id uuid;
begin
  if new.status not in ('email_client_opened', 'artist_reported', 'confirmed') then
    return new;
  end if;

  select * into version_row
  from public.application_submission_versions
  where package_id = new.package_id
    and artist_user_id = new.artist_user_id
  order by finalized_at desc, version_number desc
  limit 1;

  if version_row.id is null then
    return new;
  end if;

  delivery_channel := case
    when new.method in ('mailto', 'email') then 'email_client'
    when new.method = 'download_package' then 'download_package'
    when new.method in ('external_portal', 'unknown') then 'external_portal'
    when new.method = 'native_kleio' then 'native_kleio'
    else null
  end;

  if delivery_channel is null then
    return new;
  end if;

  delivery_state := case new.status
    when 'email_client_opened' then 'handoff_opened'
    when 'artist_reported' then 'artist_reported_sent'
    when 'confirmed' then 'provider_accepted'
    else 'prepared'
  end;

  delivery_evidence := case new.status
    when 'artist_reported' then 'self_reported'
    when 'confirmed' then 'provider_confirmed'
    else 'system_observed'
  end;

  select access.id into active_access_id
  from public.application_recipient_access access
  where access.package_id = new.package_id
    and access.artist_user_id = new.artist_user_id
    and access.submission_version_id = version_row.id
    and access.revoked_at is null
  order by access.created_at desc
  limit 1;

  insert into public.application_deliveries (
    submission_version_id, package_id, artist_user_id, opportunity_id,
    recipient_access_id, channel, destination, state, evidence_level,
    provider, provider_reference, handoff_opened_at, provider_accepted_at,
    artist_reported_sent_at, updated_at
  ) values (
    version_row.id, version_row.package_id, version_row.artist_user_id, version_row.opportunity_id,
    active_access_id, delivery_channel, coalesce(new.destination, ''), delivery_state, delivery_evidence,
    case when delivery_channel = 'email_client' then 'default_email_client' else 'external_destination' end,
    coalesce(new.provider_reference, ''),
    case when delivery_state = 'handoff_opened' then new.created_at else null end,
    case when delivery_state = 'provider_accepted' then new.created_at else null end,
    case when delivery_state = 'artist_reported_sent' then new.created_at else null end,
    now()
  )
  on conflict (submission_version_id, channel) do update set
    recipient_access_id = coalesce(public.application_deliveries.recipient_access_id, excluded.recipient_access_id),
    destination = case when excluded.destination <> '' then excluded.destination else public.application_deliveries.destination end,
    state = case
      when public.application_deliveries.state in ('review_room_opened','receipt_confirmed','conversation_started','cancelled') then public.application_deliveries.state
      else excluded.state end,
    evidence_level = case
      when public.application_deliveries.state in ('review_room_opened','receipt_confirmed','conversation_started','cancelled') then public.application_deliveries.evidence_level
      else excluded.evidence_level end,
    provider_reference = case when excluded.provider_reference <> '' then excluded.provider_reference else public.application_deliveries.provider_reference end,
    handoff_opened_at = coalesce(public.application_deliveries.handoff_opened_at, excluded.handoff_opened_at),
    provider_accepted_at = coalesce(public.application_deliveries.provider_accepted_at, excluded.provider_accepted_at),
    artist_reported_sent_at = coalesce(public.application_deliveries.artist_reported_sent_at, excluded.artist_reported_sent_at),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists sync_application_delivery_from_submission_attempt on public.application_submission_attempts;
create trigger sync_application_delivery_from_submission_attempt
after insert on public.application_submission_attempts
for each row execute function private.sync_application_delivery_from_submission_attempt();
