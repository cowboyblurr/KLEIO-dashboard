begin;

update public.artist_profiles
set profile_image_path = ''
where profile_image_path is null;

alter table public.artist_profiles
  alter column profile_image_path set default '',
  alter column profile_image_path set not null;

-- Keep one authenticated SELECT policy for the private artist-assets bucket.
-- Owners may read their own files. Institution users may read portfolio assets
-- selected for applications they manage and the exact profile image referenced
-- by an artist profile. No directory listing or unrelated file access is granted.
drop policy if exists "artist_profile_images_authenticated_read" on storage.objects;
drop policy if exists "artist_assets_select_scope" on storage.objects;
create policy "artist_assets_select_scope"
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
      join public.application_works selected_work
        on selected_work.portfolio_work_id = work_row.id
      where work_row.image_path = storage.objects.name
        and public.can_manage_application(selected_work.application_id)
    )
    or exists (
      select 1
      from public.artist_profiles artist_profile
      where artist_profile.profile_image_path = storage.objects.name
        and artist_profile.profile_image_path <> ''
    )
  )
);

-- Avoid overlapping authenticated SELECT policies while retaining admin writes.
drop policy if exists "opportunity_translations_admin_manage" on public.opportunity_translations;

drop policy if exists "opportunity_translations_admin_insert" on public.opportunity_translations;
create policy "opportunity_translations_admin_insert"
on public.opportunity_translations
for insert
to authenticated
with check (public.is_kleio_admin());

drop policy if exists "opportunity_translations_admin_update" on public.opportunity_translations;
create policy "opportunity_translations_admin_update"
on public.opportunity_translations
for update
to authenticated
using (public.is_kleio_admin())
with check (public.is_kleio_admin());

drop policy if exists "opportunity_translations_admin_delete" on public.opportunity_translations;
create policy "opportunity_translations_admin_delete"
on public.opportunity_translations
for delete
to authenticated
using (public.is_kleio_admin());

commit;
