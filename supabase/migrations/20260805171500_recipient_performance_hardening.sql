begin;

create index if not exists application_extended_profile_requests_recipient_idx
  on public.application_extended_profile_requests(recipient_identity_id)
  where recipient_identity_id is not null;
create index if not exists application_extended_profile_requests_artist_idx
  on public.application_extended_profile_requests(artist_user_id, created_at desc);
create index if not exists application_extended_profile_requests_package_idx
  on public.application_extended_profile_requests(package_id, created_at desc);
create index if not exists application_recipient_conversations_identity_idx
  on public.application_recipient_conversations(recipient_identity_id);
create index if not exists application_recipient_identities_auth_idx
  on public.application_recipient_identities(auth_user_id)
  where auth_user_id is not null;
create index if not exists application_recipient_identities_package_idx
  on public.application_recipient_identities(package_id);
create index if not exists application_recipient_message_drafts_package_idx
  on public.application_recipient_message_drafts(package_id, created_at desc);
create index if not exists application_recipient_messages_sender_identity_idx
  on public.application_recipient_messages(sender_recipient_identity_id)
  where sender_recipient_identity_id is not null;
create index if not exists application_recipient_messages_sender_user_idx
  on public.application_recipient_messages(sender_user_id)
  where sender_user_id is not null;

-- Consolidate read policies so each table evaluates one SELECT policy for authenticated users.
drop policy if exists "Artists read recipient identities for own packages" on public.application_recipient_identities;
drop policy if exists "Recipients read own verified identity" on public.application_recipient_identities;
create policy "Application recipient identities readable by participants"
on public.application_recipient_identities
for select
to authenticated
using (
  auth_user_id = (select auth.uid())
  or exists (
    select 1
    from public.application_packages package_row
    where package_row.id = application_recipient_identities.package_id
      and package_row.artist_user_id = (select auth.uid())
  )
);

drop policy if exists "Artists read own recipient conversations" on public.application_recipient_conversations;
drop policy if exists "Recipients read own application conversations" on public.application_recipient_conversations;
create policy "Application conversations readable by participants"
on public.application_recipient_conversations
for select
to authenticated
using (
  artist_user_id = (select auth.uid())
  or exists (
    select 1
    from public.application_recipient_identities identity_row
    where identity_row.id = application_recipient_conversations.recipient_identity_id
      and identity_row.auth_user_id = (select auth.uid())
      and identity_row.verified_at is not null
  )
);

drop policy if exists "Artists read own recipient messages" on public.application_recipient_messages;
drop policy if exists "Recipients read own application messages" on public.application_recipient_messages;
create policy "Application messages readable by participants"
on public.application_recipient_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.application_recipient_conversations conversation_row
    where conversation_row.id = application_recipient_messages.conversation_id
      and (
        conversation_row.artist_user_id = (select auth.uid())
        or exists (
          select 1
          from public.application_recipient_identities identity_row
          where identity_row.id = conversation_row.recipient_identity_id
            and identity_row.auth_user_id = (select auth.uid())
            and identity_row.verified_at is not null
        )
      )
  )
);

-- Split artist management from read access to avoid overlapping permissive SELECT policies.
drop policy if exists "Artists manage own extended profile requests" on public.application_extended_profile_requests;
drop policy if exists "Recipients read own extended profile requests" on public.application_extended_profile_requests;

create policy "Extended profile requests readable by participants"
on public.application_extended_profile_requests
for select
to authenticated
using (
  artist_user_id = (select auth.uid())
  or exists (
    select 1
    from public.application_recipient_identities identity_row
    where identity_row.id = application_extended_profile_requests.recipient_identity_id
      and identity_row.auth_user_id = (select auth.uid())
      and identity_row.verified_at is not null
  )
);

create policy "Artists create own extended profile requests"
on public.application_extended_profile_requests
for insert
to authenticated
with check (artist_user_id = (select auth.uid()));

create policy "Artists update own extended profile requests"
on public.application_extended_profile_requests
for update
to authenticated
using (artist_user_id = (select auth.uid()))
with check (artist_user_id = (select auth.uid()));

create policy "Artists delete own extended profile requests"
on public.application_extended_profile_requests
for delete
to authenticated
using (artist_user_id = (select auth.uid()));

commit;
