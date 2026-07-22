-- 007_artist_institution_opportunity_messaging
begin;
create table if not exists public.opportunity_conversations (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (opportunity_id, artist_user_id)
);
create index if not exists opportunity_conversations_institution_idx on public.opportunity_conversations(institution_id, last_message_at desc nulls last);
create index if not exists opportunity_conversations_artist_idx on public.opportunity_conversations(artist_user_id, last_message_at desc nulls last);

create table if not exists public.opportunity_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.opportunity_conversations(id) on delete cascade,
  sender_user_id uuid not null references public.profiles(id) on delete cascade,
  sender_role text not null check (sender_role in ('artist','institution')),
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  client_nonce uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  unique (sender_user_id, client_nonce)
);
create index if not exists opportunity_messages_conversation_idx on public.opportunity_messages(conversation_id, created_at, id);

create table if not exists public.opportunity_conversation_reads (
  conversation_id uuid not null references public.opportunity_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create schema if not exists messaging_private;
create or replace function messaging_private.can_access_opportunity_conversation(target_conversation_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.opportunity_conversations conversation_row
    where conversation_row.id = target_conversation_id
      and (
        conversation_row.artist_user_id = (select auth.uid())
        or public.owns_institution(conversation_row.institution_id)
      )
  );
$$;
revoke all on function messaging_private.can_access_opportunity_conversation(uuid) from public, anon;
grant execute on function messaging_private.can_access_opportunity_conversation(uuid) to authenticated, service_role;

create or replace function public.get_or_create_opportunity_conversation(target_opportunity_id uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  target_institution_id uuid;
  resolved_conversation_id uuid;
begin
  if caller_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if not exists (
    select 1 from public.profiles profile_row
    where profile_row.id = caller_id
      and profile_row.role = 'artist'::public.kleio_role
      and profile_row.onboarding_completed
  ) then
    raise exception 'Only an onboarded artist can start an opportunity inquiry' using errcode = '42501';
  end if;

  select call_row.institution_id into target_institution_id
  from public.opportunities opportunity_row
  join public.open_calls call_row on call_row.id = opportunity_row.internal_call_id
  join public.opportunity_sources source_row on source_row.id = opportunity_row.source_id
  where opportunity_row.id = target_opportunity_id
    and opportunity_row.application_mode = 'internal'
    and opportunity_row.status in ('open','upcoming')
    and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
    and source_row.slug = 'kleio-institution'
    and source_row.active
    and call_row.status = 'open'::public.open_call_status;

  if target_institution_id is null then
    raise exception 'Messaging is available only for active KLEIO institution opportunities' using errcode = '22023';
  end if;

  insert into public.opportunity_conversations (opportunity_id, institution_id, artist_user_id)
  values (target_opportunity_id, target_institution_id, caller_id)
  on conflict (opportunity_id, artist_user_id) do update
    set updated_at = public.opportunity_conversations.updated_at
  returning id into resolved_conversation_id;

  insert into public.opportunity_conversation_reads (conversation_id, user_id, last_read_at)
  values (resolved_conversation_id, caller_id, now())
  on conflict (conversation_id, user_id) do nothing;

  return resolved_conversation_id;
end;
$$;
revoke all on function public.get_or_create_opportunity_conversation(uuid) from public, anon;
grant execute on function public.get_or_create_opportunity_conversation(uuid) to authenticated;

create or replace function public.send_opportunity_message(
  target_conversation_id uuid,
  message_body text,
  request_nonce uuid default gen_random_uuid()
)
returns table (
  id uuid, conversation_id uuid, sender_user_id uuid, sender_role text,
  body text, client_nonce uuid, created_at timestamptz
)
language plpgsql security definer set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  normalized_body text := btrim(coalesce(message_body, ''));
  conversation_row public.opportunity_conversations%rowtype;
  resolved_sender_role text;
  inserted_id uuid;
  opportunity_title text;
  institution_owner_id uuid;
begin
  if caller_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if char_length(normalized_body) < 1 or char_length(normalized_body) > 4000 then
    raise exception 'Message must contain between 1 and 4000 characters' using errcode = '22023';
  end if;

  select * into conversation_row
  from public.opportunity_conversations conversation_lookup
  where conversation_lookup.id = target_conversation_id;

  if conversation_row.id is null or not messaging_private.can_access_opportunity_conversation(target_conversation_id) then
    raise exception 'Conversation access denied' using errcode = '42501';
  end if;

  if conversation_row.artist_user_id = caller_id then
    resolved_sender_role := 'artist';
  elsif public.owns_institution(conversation_row.institution_id) then
    resolved_sender_role := 'institution';
  else
    raise exception 'Conversation access denied' using errcode = '42501';
  end if;

  select existing.id into inserted_id
  from public.opportunity_messages existing
  where existing.sender_user_id = caller_id and existing.client_nonce = request_nonce;

  if inserted_id is null then
    insert into public.opportunity_messages (conversation_id, sender_user_id, sender_role, body, client_nonce, created_at)
    values (target_conversation_id, caller_id, resolved_sender_role, normalized_body, request_nonce, clock_timestamp())
    returning opportunity_messages.id into inserted_id;

    update public.opportunity_conversations conversation_update
    set last_message_at = message_row.created_at, updated_at = message_row.created_at
    from public.opportunity_messages message_row
    where conversation_update.id = target_conversation_id and message_row.id = inserted_id;

    insert into public.opportunity_conversation_reads (conversation_id, user_id, last_read_at)
    select target_conversation_id, caller_id, message_row.created_at
    from public.opportunity_messages message_row
    where message_row.id = inserted_id
    on conflict on constraint opportunity_conversation_reads_pkey do update
      set last_read_at = excluded.last_read_at;

    select opportunity_row.title, institution_row.owner_user_id
    into opportunity_title, institution_owner_id
    from public.opportunity_conversations conversation_lookup
    join public.opportunities opportunity_row on opportunity_row.id = conversation_lookup.opportunity_id
    join public.institutions institution_row on institution_row.id = conversation_lookup.institution_id
    where conversation_lookup.id = target_conversation_id;

    if resolved_sender_role = 'artist' then
      insert into public.notifications (user_id, kind, title, body, href)
      values (institution_owner_id, 'opportunity_message', 'New artist inquiry', opportunity_title || ': ' || left(normalized_body, 150), '/messages/');
    else
      insert into public.notifications (user_id, kind, title, body, href)
      values (conversation_row.artist_user_id, 'opportunity_message', 'New institution reply', opportunity_title || ': ' || left(normalized_body, 150), '/artist-dashboard/messages/');
    end if;
  end if;

  return query
  select message_row.id, message_row.conversation_id, message_row.sender_user_id,
         message_row.sender_role, message_row.body, message_row.client_nonce, message_row.created_at
  from public.opportunity_messages message_row
  where message_row.id = inserted_id;
end;
$$;
revoke all on function public.send_opportunity_message(uuid,text,uuid) from public, anon;
grant execute on function public.send_opportunity_message(uuid,text,uuid) to authenticated;

create or replace function public.mark_opportunity_conversation_read(target_conversation_id uuid)
returns timestamptz language plpgsql security definer set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  read_time timestamptz := clock_timestamp();
begin
  if caller_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if not messaging_private.can_access_opportunity_conversation(target_conversation_id) then
    raise exception 'Conversation access denied' using errcode = '42501';
  end if;
  insert into public.opportunity_conversation_reads (conversation_id, user_id, last_read_at)
  values (target_conversation_id, caller_id, read_time)
  on conflict (conversation_id, user_id) do update set last_read_at = excluded.last_read_at;
  return read_time;
end;
$$;
revoke all on function public.mark_opportunity_conversation_read(uuid) from public, anon;
grant execute on function public.mark_opportunity_conversation_read(uuid) to authenticated;

create or replace function public.list_my_opportunity_conversations()
returns table (
  conversation_id uuid, opportunity_id uuid, opportunity_title text,
  institution_id uuid, institution_name text, artist_user_id uuid,
  artist_name text, last_message_body text, last_message_sender_role text,
  last_message_at timestamptz, unread_count bigint
)
language sql stable security definer set search_path = ''
as $$
  select conversation_row.id, opportunity_row.id, opportunity_row.title,
    institution_row.id, coalesce(nullif(institution_row.display_name, ''), institution_row.name),
    conversation_row.artist_user_id,
    coalesce(nullif(artist_profile.professional_name, ''), artist_account.display_name, 'Artist'),
    latest_message.body, latest_message.sender_role, latest_message.created_at,
    (
      select count(*) from public.opportunity_messages unread_message
      where unread_message.conversation_id = conversation_row.id
        and unread_message.sender_user_id <> (select auth.uid())
        and unread_message.created_at > coalesce(read_state.last_read_at, '-infinity'::timestamptz)
    )
  from public.opportunity_conversations conversation_row
  join public.opportunities opportunity_row on opportunity_row.id = conversation_row.opportunity_id
  join public.institutions institution_row on institution_row.id = conversation_row.institution_id
  left join public.artist_profiles artist_profile on artist_profile.user_id = conversation_row.artist_user_id
  left join public.profiles artist_account on artist_account.id = conversation_row.artist_user_id
  left join public.opportunity_conversation_reads read_state
    on read_state.conversation_id = conversation_row.id and read_state.user_id = (select auth.uid())
  left join lateral (
    select message_row.body, message_row.sender_role, message_row.created_at
    from public.opportunity_messages message_row
    where message_row.conversation_id = conversation_row.id
    order by message_row.created_at desc, message_row.id desc limit 1
  ) latest_message on true
  where conversation_row.artist_user_id = (select auth.uid())
     or public.owns_institution(conversation_row.institution_id)
  order by coalesce(conversation_row.last_message_at, conversation_row.created_at) desc;
$$;
revoke all on function public.list_my_opportunity_conversations() from public, anon;
grant execute on function public.list_my_opportunity_conversations() to authenticated;

alter table public.opportunity_conversations enable row level security;
alter table public.opportunity_messages enable row level security;
alter table public.opportunity_conversation_reads enable row level security;
create policy opportunity_conversations_participant_read on public.opportunity_conversations
for select to authenticated using (messaging_private.can_access_opportunity_conversation(id));
create policy opportunity_messages_participant_read on public.opportunity_messages
for select to authenticated using (messaging_private.can_access_opportunity_conversation(conversation_id));
create policy opportunity_reads_manage_own on public.opportunity_conversation_reads
for all to authenticated
using (user_id = (select auth.uid()) and messaging_private.can_access_opportunity_conversation(conversation_id))
with check (user_id = (select auth.uid()) and messaging_private.can_access_opportunity_conversation(conversation_id));

revoke all on public.opportunity_conversations from anon, authenticated;
revoke all on public.opportunity_messages from anon, authenticated;
revoke all on public.opportunity_conversation_reads from anon, authenticated;
grant select on public.opportunity_conversations to authenticated;
grant select on public.opportunity_messages to authenticated;
grant select, insert, update on public.opportunity_conversation_reads to authenticated;
grant select, insert, update, delete on public.opportunity_conversations to service_role;
grant select, insert, update, delete on public.opportunity_messages to service_role;
grant select, insert, update, delete on public.opportunity_conversation_reads to service_role;

drop trigger if exists opportunity_conversations_set_updated_at on public.opportunity_conversations;
create trigger opportunity_conversations_set_updated_at before update on public.opportunity_conversations
for each row execute function public.set_updated_at();
commit;
