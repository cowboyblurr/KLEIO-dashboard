-- Resolve message participants through a non-exposed security helper so an
-- artist does not need direct SELECT access to the private institution row in
-- order to message the institution owner.

create or replace function private.can_send_application_message(
  target_application_id uuid,
  target_sender_user_id uuid,
  target_recipient_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.applications a
    join public.open_calls c on c.id = a.call_id
    join public.institutions i on i.id = c.institution_id
    where a.id = target_application_id
      and (
        (
          target_sender_user_id = a.artist_user_id
          and target_recipient_user_id = i.owner_user_id
        )
        or
        (
          target_recipient_user_id = a.artist_user_id
          and (
            target_sender_user_id = i.owner_user_id
            or exists (
              select 1
              from public.institution_members m
              where m.institution_id = i.id
                and m.user_id = target_sender_user_id
                and m.status = 'active'
            )
          )
        )
      )
  );
$$;

revoke all on function private.can_send_application_message(uuid, uuid, uuid)
from public, anon, authenticated;

drop policy if exists messages_participant_insert on public.messages;
create policy messages_participant_insert on public.messages
for insert to authenticated
with check (
  sender_user_id = (select auth.uid())
  and private.can_send_application_message(
    application_id,
    sender_user_id,
    recipient_user_id
  )
);
