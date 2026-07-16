begin;

create index if not exists institution_members_user_id_idx
  on public.institution_members (user_id);

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists artist_profiles_manage_own on public.artist_profiles;
create policy artist_profiles_manage_own
  on public.artist_profiles
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists institutions_insert_owner on public.institutions;
create policy institutions_insert_owner
  on public.institutions
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_user_id);

drop policy if exists institutions_delete_owner on public.institutions;
create policy institutions_delete_owner
  on public.institutions
  for delete
  to authenticated
  using ((select auth.uid()) = owner_user_id);

drop policy if exists institution_members_read_scope on public.institution_members;
create policy institution_members_read_scope
  on public.institution_members
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.owns_institution(institution_id)
  );

commit;
