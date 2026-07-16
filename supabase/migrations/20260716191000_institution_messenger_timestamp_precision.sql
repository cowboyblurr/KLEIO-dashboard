create or replace function public.mark_institution_conversation_read(target_conversation_id uuid)
returns timestamptz
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  marked_at timestamptz := clock_timestamp();
begin
  if not messaging_private.can_access_conversation(target_conversation_id) then
    raise exception 'Conversation access denied' using errcode = '42501';
  end if;

  update public.institution_conversation_participants
  set last_read_at = marked_at
  where conversation_id = target_conversation_id
    and user_id = (select auth.uid());

  return marked_at;
end;
$$;

create or replace function public.send_institution_message(
  target_conversation_id uuid,
  message_body text,
  request_nonce uuid default gen_random_uuid()
)
returns table (
  id uuid,
  conversation_id uuid,
  sender_user_id uuid,
  body text,
  client_nonce uuid,
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
  inserted_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if char_length(normalized_body) < 1 or char_length(normalized_body) > 4000 then
    raise exception 'Message must contain between 1 and 4000 characters' using errcode = '22023';
  end if;
  if not messaging_private.can_access_conversation(target_conversation_id) then
    raise exception 'Conversation access denied' using errcode = '42501';
  end if;

  select existing.id into inserted_id
  from public.institution_messages existing
  where existing.sender_user_id = caller_id
    and existing.client_nonce = request_nonce;

  if inserted_id is null then
    insert into public.institution_messages (
      conversation_id,
      sender_user_id,
      body,
      client_nonce,
      created_at
    )
    values (
      target_conversation_id,
      caller_id,
      normalized_body,
      request_nonce,
      clock_timestamp()
    )
    returning institution_messages.id into inserted_id;

    update public.institution_conversations c
    set last_message_at = message_row.created_at,
        updated_at = message_row.created_at
    from public.institution_messages message_row
    where c.id = target_conversation_id
      and message_row.id = inserted_id;
  end if;

  return query
  select message_row.id,
         message_row.conversation_id,
         message_row.sender_user_id,
         message_row.body,
         message_row.client_nonce,
         message_row.created_at
  from public.institution_messages message_row
  where message_row.id = inserted_id;
end;
$$;

revoke all on function public.mark_institution_conversation_read(uuid) from public, anon;
revoke all on function public.send_institution_message(uuid, text, uuid) from public, anon;
grant execute on function public.mark_institution_conversation_read(uuid) to authenticated;
grant execute on function public.send_institution_message(uuid, text, uuid) to authenticated;
