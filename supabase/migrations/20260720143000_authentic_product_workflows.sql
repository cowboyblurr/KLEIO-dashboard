begin;

create table if not exists public.saved_opportunities (
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  call_id uuid not null references public.open_calls(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (artist_user_id, call_id)
);

create unique index if not exists application_answers_key_unique
  on public.application_answers (application_id, question_key);

alter table public.saved_opportunities enable row level security;
revoke all on public.saved_opportunities from anon, authenticated;
grant select, insert, delete on public.saved_opportunities to authenticated;

create policy saved_opportunities_manage_own
  on public.saved_opportunities
  for all
  to authenticated
  using (artist_user_id = (select auth.uid()))
  with check (artist_user_id = (select auth.uid()));

create table if not exists public.review_assignments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  reviewer_user_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid not null references auth.users(id) on delete restrict,
  due_at date,
  status text not null default 'assigned' check (status in ('assigned', 'in_progress', 'submitted', 'reassigned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, reviewer_user_id)
);

create index if not exists review_assignments_reviewer_idx
  on public.review_assignments (reviewer_user_id, status, due_at);

alter table public.review_assignments enable row level security;
revoke all on public.review_assignments from anon, authenticated;
grant select, insert, update, delete on public.review_assignments to authenticated;

create policy review_assignments_select_scope
  on public.review_assignments
  for select
  to authenticated
  using (
    reviewer_user_id = (select auth.uid())
    or public.can_manage_application(application_id)
  );

create policy review_assignments_institution_insert
  on public.review_assignments
  for insert
  to authenticated
  with check (
    assigned_by = (select auth.uid())
    and public.can_manage_application(application_id)
    and exists (
      select 1
      from public.applications application_row
      join public.open_calls call_row on call_row.id = application_row.call_id
      where application_row.id = review_assignments.application_id
        and (
          exists (
            select 1 from public.institutions institution_row
            where institution_row.id = call_row.institution_id
              and institution_row.owner_user_id = review_assignments.reviewer_user_id
          )
          or exists (
            select 1 from public.institution_members membership
            where membership.institution_id = call_row.institution_id
              and membership.user_id = review_assignments.reviewer_user_id
              and membership.status = 'active'
          )
        )
    )
  );

create policy review_assignments_institution_update
  on public.review_assignments
  for update
  to authenticated
  using (public.can_manage_application(application_id))
  with check (public.can_manage_application(application_id));

create policy review_assignments_institution_delete
  on public.review_assignments
  for delete
  to authenticated
  using (public.can_manage_application(application_id));

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'workflow',
  title text not null,
  body text not null default '',
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select, update, delete on public.notifications to authenticated;

create policy notifications_select_own
  on public.notifications
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy notifications_update_own
  on public.notifications
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy notifications_delete_own
  on public.notifications
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create table if not exists public.institution_invitations (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  email text not null,
  role text not null default 'reviewer' check (role in ('reviewer', 'committee_chair', 'program_manager')),
  invited_by uuid not null references auth.users(id) on delete restrict,
  invited_user_id uuid references auth.users(id) on delete set null,
  token uuid not null default gen_random_uuid() unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email = lower(btrim(email)))
);

create unique index if not exists institution_invitations_pending_unique
  on public.institution_invitations (institution_id, email)
  where status = 'pending';

alter table public.institution_invitations enable row level security;
revoke all on public.institution_invitations from anon, authenticated;
grant select, insert, update, delete on public.institution_invitations to authenticated;

create policy institution_invitations_owner_manage
  on public.institution_invitations
  for all
  to authenticated
  using (public.is_institution_owner(institution_id))
  with check (
    public.is_institution_owner(institution_id)
    and invited_by = (select auth.uid())
  );

create policy institution_invitations_recipient_select
  on public.institution_invitations
  for select
  to authenticated
  using (
    invited_user_id = (select auth.uid())
    or lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );

create or replace function public.accept_institution_invitation(invitation_token uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_email text := lower(coalesce((select auth.jwt() ->> 'email'), ''));
  invitation_row public.institution_invitations%rowtype;
begin
  if caller_id is null or caller_email = '' then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into invitation_row
  from public.institution_invitations
  where token = invitation_token
  for update;

  if invitation_row.id is null
     or invitation_row.status <> 'pending'
     or invitation_row.expires_at <= now()
     or lower(invitation_row.email) <> caller_email then
    raise exception 'Invitation is invalid, expired, or belongs to another account' using errcode = '42501';
  end if;

  insert into public.institution_members (institution_id, user_id, role, status)
  values (invitation_row.institution_id, caller_id, invitation_row.role, 'active')
  on conflict (institution_id, user_id) do update
    set role = excluded.role, status = 'active';

  update public.profiles
  set role = 'collaborator', updated_at = now()
  where id = caller_id
    and role = 'artist';

  update public.institution_invitations
  set status = 'accepted', invited_user_id = caller_id, accepted_at = now(), updated_at = now()
  where id = invitation_row.id;

  return invitation_row.institution_id;
end;
$$;

revoke all on function public.accept_institution_invitation(uuid) from public, anon;
grant execute on function public.accept_institution_invitation(uuid) to authenticated;

create or replace function public.record_application_status_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.application_status_history (
      application_id, previous_status, new_status, changed_by
    ) values (
      new.id, old.status, new.status, coalesce((select auth.uid()), new.artist_user_id)
    );

    if new.status not in ('draft', 'submitted') then
      insert into public.notifications (user_id, kind, title, body, href)
      values (
        new.artist_user_id,
        'application_status',
        'Application status updated',
        'Your application is now ' || replace(new.status::text, '_', ' ') || '.',
        '/artist-dashboard/applications/'
      );
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.record_application_status_history() from public, anon, authenticated;
drop trigger if exists applications_record_status_history on public.applications;
create trigger applications_record_status_history
after update of status on public.applications
for each row execute function public.record_application_status_history();

create or replace function public.notify_application_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, kind, title, body, href)
  values (
    new.recipient_user_id,
    'application_message',
    'New application message',
    left(new.body, 180),
    case
      when new.sender_role = 'artist' then '/messages/'
      else '/artist-dashboard/messages/'
    end
  );
  return new;
end;
$$;

revoke all on function public.notify_application_message() from public, anon, authenticated;
drop trigger if exists messages_create_notification on public.messages;
create trigger messages_create_notification
after insert on public.messages
for each row execute function public.notify_application_message();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'artist-assets',
  'artist-assets',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists artist_assets_insert_own on storage.objects;
create policy artist_assets_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'artist-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists artist_assets_select_scope on storage.objects;
create policy artist_assets_select_scope
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'artist-assets'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1
        from public.portfolio_works work_row
        join public.application_works selected_work on selected_work.portfolio_work_id = work_row.id
        where work_row.image_path = storage.objects.name
          and public.can_manage_application(selected_work.application_id)
      )
    )
  );

drop policy if exists artist_assets_update_own on storage.objects;
create policy artist_assets_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'artist-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'artist-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists artist_assets_delete_own on storage.objects;
create policy artist_assets_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'artist-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.application_answers to authenticated;
grant select, insert, update, delete on public.application_works to authenticated;
grant select, insert, update on public.applications to authenticated;
grant select on public.application_status_history to authenticated;
grant select, insert, update on public.messages to authenticated;

commit;
