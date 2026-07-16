-- Final focused RLS and function-grant hardening applied to the KLEIO test project.

alter function public.set_updated_at() set search_path = public;
alter function public.owns_institution(uuid) set search_path = public;
alter function public.can_manage_application(uuid) set search_path = public;
alter function public.can_access_application(uuid) set search_path = public;
alter function public.handle_new_user() set search_path = public;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.owns_institution(uuid) from public, anon;
revoke execute on function public.can_manage_application(uuid) from public, anon;
revoke execute on function public.can_access_application(uuid) from public, anon;
grant execute on function public.owns_institution(uuid) to authenticated;
grant execute on function public.can_manage_application(uuid) to authenticated;
grant execute on function public.can_access_application(uuid) to authenticated;

drop policy if exists institutions_public_read on public.institutions;
drop policy if exists institutions_member_read on public.institutions;
create policy institutions_member_read on public.institutions
for select to authenticated
using (public.owns_institution(id));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = (select p.role from public.profiles p where p.id = auth.uid())
);

drop policy if exists applications_artist_update_draft on public.applications;
create policy applications_artist_update_draft on public.applications
for update to authenticated
using (artist_user_id = auth.uid() and status = 'draft')
with check (
  artist_user_id = auth.uid()
  and status in ('draft', 'submitted', 'withdrawn')
);

update storage.buckets
set public = false
where id = 'institution-logos';

drop policy if exists institution_logos_public_read on storage.objects;
drop policy if exists institution_logos_authenticated_read on storage.objects;
create policy institution_logos_authenticated_read on storage.objects
for select to authenticated
using (bucket_id = 'institution-logos');
