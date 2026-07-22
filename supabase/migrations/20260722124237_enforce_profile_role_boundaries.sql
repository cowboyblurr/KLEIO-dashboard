-- Enforce artist and institution record ownership by both authenticated user ID
-- and the immutable account role stored in public.profiles.

drop policy if exists artist_profiles_manage_own on public.artist_profiles;

create policy artist_profiles_manage_own
on public.artist_profiles
for all
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles profile_row
    where profile_row.id = (select auth.uid())
      and profile_row.role = 'artist'::public.kleio_role
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles profile_row
    where profile_row.id = (select auth.uid())
      and profile_row.role = 'artist'::public.kleio_role
  )
);

drop policy if exists institutions_insert_owner on public.institutions;
drop policy if exists institutions_update_owner on public.institutions;
drop policy if exists institutions_delete_owner on public.institutions;

create policy institutions_insert_owner
on public.institutions
for insert
to authenticated
with check (
  (select auth.uid()) = owner_user_id
  and exists (
    select 1
    from public.profiles profile_row
    where profile_row.id = (select auth.uid())
      and profile_row.role = 'institution'::public.kleio_role
  )
);

create policy institutions_update_owner
on public.institutions
for update
to authenticated
using (
  (select auth.uid()) = owner_user_id
  and exists (
    select 1
    from public.profiles profile_row
    where profile_row.id = (select auth.uid())
      and profile_row.role = 'institution'::public.kleio_role
  )
)
with check (
  (select auth.uid()) = owner_user_id
  and exists (
    select 1
    from public.profiles profile_row
    where profile_row.id = (select auth.uid())
      and profile_row.role = 'institution'::public.kleio_role
  )
);

create policy institutions_delete_owner
on public.institutions
for delete
to authenticated
using (
  (select auth.uid()) = owner_user_id
  and exists (
    select 1
    from public.profiles profile_row
    where profile_row.id = (select auth.uid())
      and profile_row.role = 'institution'::public.kleio_role
  )
);
