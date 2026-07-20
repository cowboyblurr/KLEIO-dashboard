begin;

grant update on public.saved_opportunities to authenticated;

drop policy if exists saved_opportunities_update_own on public.saved_opportunities;
create policy saved_opportunities_update_own
  on public.saved_opportunities
  for update
  to authenticated
  using ((select auth.uid()) = artist_user_id)
  with check ((select auth.uid()) = artist_user_id);

commit;
