begin;

create or replace function public.can_manage_any_institution_media()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.institutions institution_row
    where institution_row.owner_user_id = (select auth.uid())
  ) or exists (
    select 1
    from public.institution_members membership
    where membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and lower(membership.role) in ('owner','admin','administrator','manager','program director','program_director')
  );
$$;

revoke all on function public.can_manage_any_institution_media() from public, anon;
grant execute on function public.can_manage_any_institution_media() to authenticated, service_role;

drop policy if exists opportunity_images_institution_insert on storage.objects;
create policy opportunity_images_institution_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'opportunity-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.can_manage_any_institution_media()
);

drop policy if exists opportunity_images_institution_update on storage.objects;
create policy opportunity_images_institution_update
on storage.objects
for update to authenticated
using (
  bucket_id = 'opportunity-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.can_manage_any_institution_media()
)
with check (
  bucket_id = 'opportunity-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.can_manage_any_institution_media()
);

drop policy if exists opportunity_images_institution_delete on storage.objects;
create policy opportunity_images_institution_delete
on storage.objects
for delete to authenticated
using (
  bucket_id = 'opportunity-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.can_manage_any_institution_media()
);

commit;
