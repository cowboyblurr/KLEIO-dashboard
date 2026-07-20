begin;

-- The previous WITH CHECK queried profiles from the profiles policy itself,
-- causing PostgreSQL 42P17 on every authenticated profile update. Keep the
-- ownership rule non-recursive and enforce role immutability with privileges.
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke update on public.profiles from authenticated;
grant update (display_name, avatar_url, onboarding_completed, updated_at) on public.profiles to authenticated;

commit;
