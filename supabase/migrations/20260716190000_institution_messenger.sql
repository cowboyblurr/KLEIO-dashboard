begin;

create schema if not exists messaging_private;
revoke all on schema messaging_private from public, anon;
grant usage on schema messaging_private to authenticated;

create table if not exists public.institution_conversations (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  kind text not null default 'direct' check (kind in ('direct', 'group')),
  title text,
  direct_key text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz
);

create unique index if not exists institution_conversations_direct_unique
  on public.institution_conversations (institution_id, direct_key)
  where kind = 'direct' and direct_key is not null;
create index if not exists institution_conversations_institution_activity_idx
  on public.institution_conversations (institution_id, coalesce(last_message_at, created_at) desc);

create table if not exists public.institution_conversation_participants (
  conversation_id uuid not null references public.institution_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index if not exists institution_conversation_participants_user_idx
  on public.institution_conversation_participants (user_id, conversation_id);

create table if not exists public.institution_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.institution_conversations(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  client_nonce uuid,
  created_at timestamptz not null default now()
);
create index if not exists institution_messages_conversation_created_idx
  on public.institution_messages (conversation_id, created_at, id);
create unique index if not exists institution_messages_sender_nonce_unique
  on public.institution_messages (sender_user_id, client_nonce)
  where client_nonce is not null;

create or replace function messaging_private.is_active_institution_member(target_institution_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.institutions i
    where i.id = target_institution_id
      and (
        i.owner_user_id = (select auth.uid())
        or exists (
          select 1
          from public.institution_members m
          where m.institution_id = i.id
            and m.user_id = (select auth.uid())
            and m.status = 'active'
        )
      )
  );
$$;

create or replace function messaging_private.can_access_conversation(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.institution_conversations c
    join public.institution_conversation_participants p
      on p.conversation_id = c.id
     and p.user_id = (select auth.uid())
    where c.id = target_conversation_id
      and messaging_private.is_active_institution_member(c.institution_id)
  );
$$;

revoke all on function messaging_private.is_active_institution_member(uuid) from public, anon;
revoke all on function messaging_private.can_access_conversation(uuid) from public, anon;
grant execute on function messaging_private.is_active_institution_member(uuid) to authenticated;
grant execute on function messaging_private.can_access_conversation(uuid) to authenticated;

alter table public.institution_conversations enable row level security;
alter table public.institution_conversation_participants enable row level security;
alter table public.institution_messages enable row level security;

revoke all on public.institution_conversations from anon, authenticated;
revoke all on public.institution_conversation_participants from anon, authenticated;
revoke all on public.institution_messages from anon, authenticated;
grant select on public.institution_conversations to authenticated;
grant select on public.institution_conversation_participants to authenticated;
grant select on public.institution_messages to authenticated;

create policy institution_conversations_participant_select
  on public.institution_conversations
  for select
  to authenticated
  using (messaging_private.can_access_conversation(id));

create policy institution_conversation_participants_select
  on public.institution_conversation_participants
  for select
  to authenticated
  using (messaging_private.can_access_conversation(conversation_id));

create policy institution_messages_participant_select
  on public.institution_messages
  for select
  to authenticated
  using (messaging_private.can_access_conversation(conversation_id));

create or replace function public.get_my_institution_contexts()
returns table (
  institution_id uuid,
  institution_name text,
  member_role text,
  member_status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct on (i.id)
    i.id,
    coalesce(nullif(i.display_name, ''), i.name),
    case when i.owner_user_id = (select auth.uid()) then 'Owner' else m.role end,
    case when i.owner_user_id = (select auth.uid()) then 'active' else m.status end
  from public.institutions i
  left join public.institution_members m
    on m.institution_id = i.id
   and m.user_id = (select auth.uid())
  where i.owner_user_id = (select auth.uid())
     or (m.user_id = (select auth.uid()) and m.status = 'active')
  order by i.id, case when i.owner_user_id = (select auth.uid()) then 0 else 1 end;
$$;

create or replace function public.list_institution_messenger_members(
  target_institution_id uuid,
  search_text text default ''
)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  institution_role text,
  membership_status text,
  department text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if not messaging_private.is_active_institution_member(target_institution_id) then
    raise exception 'Institution access denied' using errcode = '42501';
  end if;

  return query
  with eligible as (
    select i.owner_user_id as eligible_user_id, 'Owner'::text as eligible_role, 'active'::text as eligible_status, 0 as priority
    from public.institutions i
    where i.id = target_institution_id
    union all
    select m.user_id, m.role, m.status, 1
    from public.institution_members m
    where m.institution_id = target_institution_id
      and m.status = 'active'
  ), deduplicated as (
    select distinct on (eligible_user_id)
      eligible_user_id, eligible_role, eligible_status
    from eligible
    order by eligible_user_id, priority
  )
  select
    p.id,
    coalesce(nullif(p.display_name, ''), split_part(coalesce(p.email, ''), '@', 1), 'Institution member'),
    p.avatar_url,
    d.eligible_role,
    d.eligible_status,
    null::text
  from deduplicated d
  join public.profiles p on p.id = d.eligible_user_id
  where p.id <> (select auth.uid())
    and (
      btrim(coalesce(search_text, '')) = ''
      or coalesce(p.display_name, '') ilike '%' || btrim(search_text) || '%'
      or coalesce(p.email, '') ilike '%' || btrim(search_text) || '%'
      or d.eligible_role ilike '%' || btrim(search_text) || '%'
    )
  order by coalesce(nullif(p.display_name, ''), p.email, p.id::text);
end;
$$;

create or replace function public.list_my_institution_conversations(target_institution_id uuid)
returns table (
  conversation_id uuid,
  institution_id uuid,
  conversation_kind text,
  conversation_title text,
  counterpart_user_id uuid,
  counterpart_name text,
  counterpart_avatar_url text,
  counterpart_role text,
  latest_message_body text,
  latest_message_sender_id uuid,
  latest_message_at timestamptz,
  unread_count integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if not messaging_private.is_active_institution_member(target_institution_id) then
    raise exception 'Institution access denied' using errcode = '42501';
  end if;

  return query
  select
    c.id,
    c.institution_id,
    c.kind,
    coalesce(nullif(c.title, ''), nullif(other_profile.display_name, ''), split_part(coalesce(other_profile.email, ''), '@', 1), 'Institution conversation'),
    other_participant.user_id,
    coalesce(nullif(other_profile.display_name, ''), split_part(coalesce(other_profile.email, ''), '@', 1), 'Institution colleague'),
    other_profile.avatar_url,
    coalesce(
      case when institution_row.owner_user_id = other_participant.user_id then 'Owner' end,
      other_membership.role,
      'Institution member'
    ),
    latest.body,
    latest.sender_user_id,
    latest.created_at,
    (
      select count(*)::integer
      from public.institution_messages unread_message
      where unread_message.conversation_id = c.id
        and unread_message.sender_user_id <> (select auth.uid())
        and unread_message.created_at > me.last_read_at
    )
  from public.institution_conversations c
  join public.institution_conversation_participants me
    on me.conversation_id = c.id
   and me.user_id = (select auth.uid())
  join public.institutions institution_row on institution_row.id = c.institution_id
  left join public.institution_conversation_participants other_participant
    on other_participant.conversation_id = c.id
   and other_participant.user_id <> (select auth.uid())
   and c.kind = 'direct'
  left join public.profiles other_profile on other_profile.id = other_participant.user_id
  left join public.institution_members other_membership
    on other_membership.institution_id = c.institution_id
   and other_membership.user_id = other_participant.user_id
   and other_membership.status = 'active'
  left join lateral (
    select message_row.body, message_row.sender_user_id, message_row.created_at
    from public.institution_messages message_row
    where message_row.conversation_id = c.id
    order by message_row.created_at desc, message_row.id desc
    limit 1
  ) latest on true
  where c.institution_id = target_institution_id
  order by coalesce(c.last_message_at, c.created_at) desc, c.id;
end;
$$;

create or replace function public.get_or_create_direct_institution_conversation(
  target_institution_id uuid,
  other_user_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  canonical_key text;
  resolved_conversation_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if other_user_id is null or other_user_id = caller_id then
    raise exception 'A direct conversation requires another institution member' using errcode = '22023';
  end if;
  if not messaging_private.is_active_institution_member(target_institution_id) then
    raise exception 'Institution access denied' using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.institutions i
    where i.id = target_institution_id
      and (
        i.owner_user_id = other_user_id
        or exists (
          select 1 from public.institution_members m
          where m.institution_id = i.id
            and m.user_id = other_user_id
            and m.status = 'active'
        )
      )
  ) then
    raise exception 'Recipient is not an active member of this institution' using errcode = '42501';
  end if;

  canonical_key := least(caller_id::text, other_user_id::text) || ':' || greatest(caller_id::text, other_user_id::text);

  insert into public.institution_conversations (institution_id, kind, direct_key, created_by)
  values (target_institution_id, 'direct', canonical_key, caller_id)
  on conflict (institution_id, direct_key)
    where kind = 'direct' and direct_key is not null
  do update set direct_key = excluded.direct_key
  returning id into resolved_conversation_id;

  insert into public.institution_conversation_participants (conversation_id, user_id)
  values
    (resolved_conversation_id, caller_id),
    (resolved_conversation_id, other_user_id)
  on conflict (conversation_id, user_id) do nothing;

  return resolved_conversation_id;
end;
$$;

create or replace function public.mark_institution_conversation_read(target_conversation_id uuid)
returns timestamptz
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  marked_at timestamptz := now();
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
    insert into public.institution_messages (conversation_id, sender_user_id, body, client_nonce)
    values (target_conversation_id, caller_id, normalized_body, request_nonce)
    returning institution_messages.id into inserted_id;

    update public.institution_conversations c
    set last_message_at = message_row.created_at,
        updated_at = message_row.created_at
    from public.institution_messages message_row
    where c.id = target_conversation_id
      and message_row.id = inserted_id;
  end if;

  return query
  select message_row.id, message_row.conversation_id, message_row.sender_user_id,
         message_row.body, message_row.client_nonce, message_row.created_at
  from public.institution_messages message_row
  where message_row.id = inserted_id;
end;
$$;

revoke all on function public.get_my_institution_contexts() from public, anon;
revoke all on function public.list_institution_messenger_members(uuid, text) from public, anon;
revoke all on function public.list_my_institution_conversations(uuid) from public, anon;
revoke all on function public.get_or_create_direct_institution_conversation(uuid, uuid) from public, anon;
revoke all on function public.mark_institution_conversation_read(uuid) from public, anon;
revoke all on function public.send_institution_message(uuid, text, uuid) from public, anon;
grant execute on function public.get_my_institution_contexts() to authenticated;
grant execute on function public.list_institution_messenger_members(uuid, text) to authenticated;
grant execute on function public.list_my_institution_conversations(uuid) to authenticated;
grant execute on function public.get_or_create_direct_institution_conversation(uuid, uuid) to authenticated;
grant execute on function public.mark_institution_conversation_read(uuid) to authenticated;
grant execute on function public.send_institution_message(uuid, text, uuid) to authenticated;

comment on table public.institution_conversations is 'Internal institution-scoped messenger conversations. Separate from application artist messaging.';
comment on table public.institution_conversation_participants is 'Authorized participants and persisted read state for internal institution conversations.';
comment on table public.institution_messages is 'Persistent internal institution messages; sender identity is assigned by send_institution_message().';

commit;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'institution_messages'
  ) then
    alter publication supabase_realtime add table public.institution_messages;
  end if;
end;
$$;
