begin;

create or replace function public.send_application_message(
  target_application_id uuid,
  message_body text
)
returns table (
  id uuid,
  application_id uuid,
  sender_user_id uuid,
  recipient_user_id uuid,
  sender_role text,
  body text,
  read_at timestamptz,
  created_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  normalized_body text := btrim(coalesce(message_body, ''));
  resolved_application_id uuid;
  target_artist_id uuid;
  target_status public.application_status;
  institution_owner_id uuid;
  resolved_recipient_id uuid;
  resolved_sender_role text;
  inserted_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if char_length(normalized_body) < 1 or char_length(normalized_body) > 4000 then
    raise exception 'Message must contain between 1 and 4000 characters' using errcode = '22023';
  end if;

  select application_source.id, application_source.artist_user_id, application_source.status,
         institution_row.owner_user_id
  into resolved_application_id, target_artist_id, target_status, institution_owner_id
  from public.applications application_source
  join public.open_calls call_row on call_row.id = application_source.call_id
  join public.institutions institution_row on institution_row.id = call_row.institution_id
  where application_source.id = target_application_id;

  if resolved_application_id is null or target_status = 'draft' then
    raise exception 'A submitted application is required' using errcode = '22023';
  end if;

  if target_artist_id = caller_id then
    resolved_recipient_id := institution_owner_id;
    resolved_sender_role := 'artist';
  elsif public.can_manage_application(resolved_application_id) then
    resolved_recipient_id := target_artist_id;
    resolved_sender_role := 'institution';
  else
    raise exception 'Application access denied' using errcode = '42501';
  end if;

  insert into public.messages (
    application_id, sender_user_id, recipient_user_id, sender_role, body
  ) values (
    resolved_application_id, caller_id, resolved_recipient_id, resolved_sender_role, normalized_body
  ) returning messages.id into inserted_id;

  return query
  select message_row.id, message_row.application_id, message_row.sender_user_id,
         message_row.recipient_user_id, message_row.sender_role, message_row.body,
         message_row.read_at, message_row.created_at
  from public.messages message_row
  where message_row.id = inserted_id;
end;
$$;

revoke all on function public.send_application_message(uuid, text) from public, anon;
grant execute on function public.send_application_message(uuid, text) to authenticated;

commit;
