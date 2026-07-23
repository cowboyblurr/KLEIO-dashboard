begin;

create table if not exists public.artist_opportunity_conversation_controls (
  conversation_id uuid primary key references public.opportunity_conversations(id) on delete cascade,
  artist_user_id uuid not null references public.profiles(id) on delete cascade,
  muted_at timestamptz,
  archived_at timestamptz,
  reported_at timestamptz,
  report_reason text not null default '',
  updated_at timestamptz not null default now(),
  constraint artist_opportunity_report_reason_length check (char_length(report_reason) <= 1000)
);

alter table public.artist_opportunity_conversation_controls enable row level security;
grant select on public.artist_opportunity_conversation_controls to authenticated;
revoke insert, update, delete on public.artist_opportunity_conversation_controls from authenticated, anon;

drop policy if exists artist_conversation_controls_owner_read on public.artist_opportunity_conversation_controls;
create policy artist_conversation_controls_owner_read
on public.artist_opportunity_conversation_controls
for select to authenticated
using (artist_user_id = (select auth.uid()));

create or replace function public.set_artist_opportunity_conversation_control(
  target_conversation_id uuid,
  target_action text,
  target_report_reason text default ''
)
returns table(muted_at timestamptz, archived_at timestamptz, reported_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  conversation_artist_id uuid;
  normalized_reason text := btrim(coalesce(target_report_reason, ''));
begin
  select conversation_row.artist_user_id
  into conversation_artist_id
  from public.opportunity_conversations conversation_row
  where conversation_row.id = target_conversation_id;

  if caller_id is null or conversation_artist_id is null or conversation_artist_id <> caller_id then
    raise exception 'Conversation control access denied' using errcode = '42501';
  end if;
  if target_action not in ('mute','unmute','archive','unarchive','report') then
    raise exception 'Unsupported conversation control' using errcode = '22023';
  end if;
  if target_action = 'report' and (char_length(normalized_reason) < 10 or char_length(normalized_reason) > 1000) then
    raise exception 'Report details must contain between 10 and 1000 characters' using errcode = '22023';
  end if;

  insert into public.artist_opportunity_conversation_controls(
    conversation_id, artist_user_id, muted_at, archived_at, reported_at, report_reason, updated_at
  ) values (
    target_conversation_id,
    caller_id,
    case when target_action = 'mute' then now() else null end,
    case when target_action = 'archive' then now() else null end,
    case when target_action = 'report' then now() else null end,
    case when target_action = 'report' then normalized_reason else '' end,
    now()
  )
  on conflict (conversation_id) do update set
    muted_at = case
      when target_action = 'mute' then now()
      when target_action = 'unmute' then null
      else public.artist_opportunity_conversation_controls.muted_at
    end,
    archived_at = case
      when target_action = 'archive' then now()
      when target_action = 'unarchive' then null
      else public.artist_opportunity_conversation_controls.archived_at
    end,
    reported_at = case
      when target_action = 'report' then now()
      else public.artist_opportunity_conversation_controls.reported_at
    end,
    report_reason = case
      when target_action = 'report' then normalized_reason
      else public.artist_opportunity_conversation_controls.report_reason
    end,
    updated_at = now()
  where public.artist_opportunity_conversation_controls.artist_user_id = caller_id;

  return query
  select controls.muted_at, controls.archived_at, controls.reported_at
  from public.artist_opportunity_conversation_controls controls
  where controls.conversation_id = target_conversation_id
    and controls.artist_user_id = caller_id;
end;
$$;

revoke all on function public.set_artist_opportunity_conversation_control(uuid,text,text) from public, anon;
grant execute on function public.set_artist_opportunity_conversation_control(uuid,text,text) to authenticated, service_role;

create or replace function public.list_my_artist_opportunity_invitations()
returns table(
  invitation_id uuid,
  conversation_id uuid,
  opportunity_id uuid,
  opportunity_title text,
  opportunity_type text,
  institution_id uuid,
  institution_name text,
  deadline_at timestamptz,
  invitation_status text,
  invitation_note text,
  sent_at timestamptz,
  viewed_at timestamptz,
  responded_at timestamptz,
  expires_at timestamptz,
  muted_at timestamptz,
  archived_at timestamptz,
  reported_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    invitation.id,
    invitation.conversation_id,
    invitation.opportunity_id,
    opportunity.title,
    opportunity.opportunity_type,
    invitation.institution_id,
    coalesce(nullif(institution.display_name, ''), institution.name),
    opportunity.deadline_at,
    case
      when invitation.status in ('sent','viewed','interested')
        and invitation.expires_at is not null
        and invitation.expires_at < now()
      then 'expired'
      else invitation.status
    end,
    invitation.invitation_note,
    invitation.sent_at,
    invitation.viewed_at,
    invitation.responded_at,
    invitation.expires_at,
    controls.muted_at,
    controls.archived_at,
    controls.reported_at
  from public.artist_opportunity_invitations invitation
  join public.opportunities opportunity on opportunity.id = invitation.opportunity_id
  join public.institutions institution on institution.id = invitation.institution_id
  left join public.artist_opportunity_conversation_controls controls
    on controls.conversation_id = invitation.conversation_id
   and controls.artist_user_id = invitation.artist_user_id
  where invitation.artist_user_id = (select auth.uid())
  order by invitation.sent_at desc;
$$;

revoke all on function public.list_my_artist_opportunity_invitations() from public, anon;
grant execute on function public.list_my_artist_opportunity_invitations() to authenticated, service_role;

create or replace function public.invite_artist_to_opportunity(
  target_artist_user_id uuid,
  target_opportunity_id uuid,
  message_body text,
  request_nonce uuid default gen_random_uuid()
)
returns table(invitation_id uuid, conversation_id uuid, invitation_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  normalized_body text := btrim(coalesce(message_body, ''));
  target_institution_id uuid;
  target_deadline timestamptz;
  resolved_conversation_id uuid;
  resolved_invitation_id uuid;
  existing_invitation public.artist_opportunity_invitations%rowtype;
  opportunity_title text;
  institution_name text;
begin
  if caller_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if char_length(normalized_body) < 10 or char_length(normalized_body) > 4000 then
    raise exception 'Invitation message must contain between 10 and 4000 characters' using errcode = '22023';
  end if;

  select opportunity_row.provider_name, opportunity_row.title, call_row.institution_id,
         coalesce(opportunity_row.deadline_at, call_row.deadline_at::timestamptz)
  into institution_name, opportunity_title, target_institution_id, target_deadline
  from public.opportunities opportunity_row
  join public.open_calls call_row on call_row.id = opportunity_row.internal_call_id
  join public.opportunity_sources source_row on source_row.id = opportunity_row.source_id
  where opportunity_row.id = target_opportunity_id
    and opportunity_row.application_mode = 'internal'
    and opportunity_row.status = 'open'
    and source_row.slug = 'kleio-institution'
    and source_row.active
    and call_row.status = 'open'::public.open_call_status
    and call_row.published_at is not null
    and (call_row.opens_at is null or call_row.opens_at <= current_date)
    and (call_row.deadline_at is null or call_row.deadline_at >= current_date);

  if target_institution_id is null then
    raise exception 'Only an active published KLEIO listing can be used for artist outreach' using errcode = '22023';
  end if;
  if not public.can_contact_artists_for_institution(target_institution_id) then
    raise exception 'Your institution role cannot initiate artist outreach' using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.artist_discovery_profiles discovery
    where discovery.artist_user_id = target_artist_user_id
      and discovery.visibility = 'institutions'
      and discovery.contact_mode = 'opportunity_invites'
  ) then
    raise exception 'This artist is not available for institution opportunity invitations' using errcode = '42501';
  end if;

  select * into existing_invitation
  from public.artist_opportunity_invitations invitation
  where invitation.institution_id = target_institution_id
    and invitation.opportunity_id = target_opportunity_id
    and invitation.artist_user_id = target_artist_user_id;

  if existing_invitation.id is not null then
    if existing_invitation.status in ('sent','viewed','interested')
      and (existing_invitation.expires_at is null or existing_invitation.expires_at >= now()) then
      return query select existing_invitation.id, existing_invitation.conversation_id, existing_invitation.status;
      return;
    end if;
    raise exception 'This listing already has a completed, declined, withdrawn, applied, or expired invitation for the artist' using errcode = '23505';
  end if;

  if (
    select count(*)
    from public.artist_opportunity_invitations invitation
    where invitation.institution_id = target_institution_id
      and invitation.sent_at >= now() - interval '24 hours'
      and invitation.status not in ('draft','withdrawn')
  ) >= 25 then
    raise exception 'Daily institution outreach limit reached' using errcode = '54000';
  end if;

  insert into public.opportunity_conversations(opportunity_id, institution_id, artist_user_id, origin)
  values(target_opportunity_id, target_institution_id, target_artist_user_id, 'discovery_invitation')
  on conflict (opportunity_id, artist_user_id) do update
    set origin = case
      when public.opportunity_conversations.origin = 'artist_application' then 'artist_application'
      else 'discovery_invitation'
    end,
    updated_at = now()
  returning id into resolved_conversation_id;

  insert into public.artist_opportunity_invitations(
    institution_id, opportunity_id, artist_user_id, conversation_id, initiated_by,
    status, invitation_note, sent_at, expires_at, updated_at
  ) values (
    target_institution_id, target_opportunity_id, target_artist_user_id,
    resolved_conversation_id, caller_id, 'sent', normalized_body, now(), target_deadline, now()
  )
  returning id into resolved_invitation_id;

  insert into public.opportunity_messages(
    conversation_id, sender_user_id, sender_role, body, client_nonce, created_at
  ) values (
    resolved_conversation_id, caller_id, 'institution', normalized_body, request_nonce, clock_timestamp()
  )
  on conflict (sender_user_id, client_nonce) do nothing;

  update public.opportunity_conversations
  set last_message_at = clock_timestamp(), updated_at = clock_timestamp()
  where id = resolved_conversation_id;

  insert into public.notifications(user_id, kind, title, body, href)
  values(
    target_artist_user_id,
    'artist_opportunity_invitation',
    'Institution opportunity invitation',
    institution_name || ' invited you to review ' || opportunity_title || '.',
    '/artist-dashboard/messages/'
  );

  return query select resolved_invitation_id, resolved_conversation_id, 'sent'::text;
end;
$$;

revoke all on function public.invite_artist_to_opportunity(uuid,uuid,text,uuid) from public, anon;
grant execute on function public.invite_artist_to_opportunity(uuid,uuid,text,uuid) to authenticated, service_role;

commit;
