begin;

create or replace function public.is_institution_owner(target_institution_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.institutions institution_row
    where institution_row.id = target_institution_id
      and institution_row.owner_user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_institution_owner(uuid) from public;
revoke all on function public.is_institution_owner(uuid) from anon;
grant execute on function public.is_institution_owner(uuid) to authenticated;

create or replace function public.owns_institution(target_institution_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.institutions institution_row
    where institution_row.id = target_institution_id
      and (
        institution_row.owner_user_id = (select auth.uid())
        or exists (
          select 1
          from public.institution_members membership
          where membership.institution_id = institution_row.id
            and membership.user_id = (select auth.uid())
            and membership.status = 'active'
        )
      )
  );
$$;

revoke all on function public.owns_institution(uuid) from public;
revoke all on function public.owns_institution(uuid) from anon;
grant execute on function public.owns_institution(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'artist');
  if requested_role not in ('artist', 'institution', 'collaborator') then
    requested_role := 'artist';
  end if;

  insert into public.profiles (id, role, display_name, email)
  values (
    new.id,
    requested_role::public.kleio_role,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    new.email
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

drop policy if exists institutions_update_owner on public.institutions;
create policy institutions_update_owner
  on public.institutions
  for update
  to authenticated
  using ((select auth.uid()) = owner_user_id)
  with check ((select auth.uid()) = owner_user_id);

drop policy if exists institution_members_manage_owner on public.institution_members;
create policy institution_members_manage_owner
  on public.institution_members
  for all
  to authenticated
  using (public.is_institution_owner(institution_id))
  with check (public.is_institution_owner(institution_id));

commit;
