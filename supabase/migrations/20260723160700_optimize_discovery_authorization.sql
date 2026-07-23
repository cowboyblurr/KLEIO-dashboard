begin;

grant usage on schema messaging_private to authenticated, service_role;

create or replace function messaging_private.is_active_institution_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles profile_row
    where profile_row.id = (select auth.uid())
      and profile_row.role = 'institution'::public.kleio_role
      and profile_row.onboarding_completed
      and (
        exists (
          select 1 from public.institutions institution_row
          where institution_row.owner_user_id = (select auth.uid())
        )
        or exists (
          select 1 from public.institution_members membership
          where membership.user_id = (select auth.uid())
            and membership.status = 'active'
        )
      )
  );
$$;

create or replace function messaging_private.can_contact_artists_for_institution(target_institution_id uuid)
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
            and lower(membership.role) in ('owner','admin','administrator','manager','program director','program_director')
        )
      )
  );
$$;

create or replace function messaging_private.can_manage_any_institution_media()
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

revoke all on function messaging_private.is_active_institution_user() from public, anon;
revoke all on function messaging_private.can_contact_artists_for_institution(uuid) from public, anon;
revoke all on function messaging_private.can_manage_any_institution_media() from public, anon;
grant execute on function messaging_private.is_active_institution_user() to authenticated, service_role;
grant execute on function messaging_private.can_contact_artists_for_institution(uuid) to authenticated, service_role;
grant execute on function messaging_private.can_manage_any_institution_media() to authenticated, service_role;

-- Keep compatibility helpers internal to trusted functions, not callable over the public API.
revoke execute on function public.is_active_institution_user() from authenticated;
revoke execute on function public.can_contact_artists_for_institution(uuid) from authenticated;
revoke execute on function public.can_manage_any_institution_media() from authenticated;

-- Combine permissive SELECT policies while preserving artist-owned writes.
drop policy if exists artist_discovery_owner_manage on public.artist_discovery_profiles;
drop policy if exists artist_discovery_institution_read on public.artist_discovery_profiles;

create policy artist_discovery_select_scope
on public.artist_discovery_profiles
for select to authenticated
using (
  artist_user_id = (select auth.uid())
  or (
    visibility = 'institutions'
    and messaging_private.is_active_institution_user()
  )
);

create policy artist_discovery_owner_insert
on public.artist_discovery_profiles
for insert to authenticated
with check (artist_user_id = (select auth.uid()));

create policy artist_discovery_owner_update
on public.artist_discovery_profiles
for update to authenticated
using (artist_user_id = (select auth.uid()))
with check (artist_user_id = (select auth.uid()));

create policy artist_discovery_owner_delete
on public.artist_discovery_profiles
for delete to authenticated
using (artist_user_id = (select auth.uid()));

drop policy if exists artist_invitation_artist_read on public.artist_opportunity_invitations;
drop policy if exists artist_invitation_institution_read on public.artist_opportunity_invitations;
create policy artist_invitation_read_scope
on public.artist_opportunity_invitations
for select to authenticated
using (
  artist_user_id = (select auth.uid())
  or messaging_private.can_contact_artists_for_institution(institution_id)
);

-- Discovery media is readable only through an owned account, submitted application,
-- or the approved discovery projection for an active institution account.
drop policy if exists artist_assets_select_scope on storage.objects;
create policy artist_assets_select_scope
on storage.objects
for select to authenticated
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
    or (
      messaging_private.is_active_institution_user()
      and exists (
        select 1
        from public.artist_discovery_profiles discovery
        where discovery.visibility = 'institutions'
          and (
            discovery.profile_image_path = storage.objects.name
            or exists (
              select 1
              from jsonb_array_elements(discovery.selected_works) selected_work
              where selected_work->>'image_path' = storage.objects.name
            )
            or exists (
              select 1
              from public.portfolio_works featured
              where featured.id = discovery.featured_work_id
                and featured.artist_user_id = discovery.artist_user_id
                and featured.image_path = storage.objects.name
            )
          )
      )
    )
  )
);

drop policy if exists opportunity_images_institution_insert on storage.objects;
create policy opportunity_images_institution_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'opportunity-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and messaging_private.can_manage_any_institution_media()
);

drop policy if exists opportunity_images_institution_update on storage.objects;
create policy opportunity_images_institution_update
on storage.objects
for update to authenticated
using (
  bucket_id = 'opportunity-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and messaging_private.can_manage_any_institution_media()
)
with check (
  bucket_id = 'opportunity-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and messaging_private.can_manage_any_institution_media()
);

drop policy if exists opportunity_images_institution_delete on storage.objects;
create policy opportunity_images_institution_delete
on storage.objects
for delete to authenticated
using (
  bucket_id = 'opportunity-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and messaging_private.can_manage_any_institution_media()
);

create or replace function public.enforce_open_call_preview_image_ownership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  media_path text;
  uploader_user_id uuid;
  caller_id uuid := (select auth.uid());
  media_changed boolean;
begin
  media_changed := case
    when tg_op = 'INSERT' then
      nullif(new.preview_image_path, '') is not null
      or nullif(new.submission_cover_path, '') is not null
      or nullif(new.preview_image_url, '') is not null
    else
      new.preview_image_path is distinct from old.preview_image_path
      or new.submission_cover_path is distinct from old.submission_cover_path
      or new.preview_image_url is distinct from old.preview_image_url
  end;

  if caller_id is not null
    and media_changed
    and not messaging_private.can_contact_artists_for_institution(new.institution_id) then
    raise exception 'Your institution role cannot manage opportunity media' using errcode = '42501';
  end if;

  foreach media_path in array array[new.preview_image_path, new.submission_cover_path]
  loop
    if nullif(media_path, '') is not null then
      begin
        uploader_user_id := split_part(media_path, '/', 1)::uuid;
      exception when others then
        raise exception 'Opportunity media path is invalid' using errcode = '22023';
      end;
      if caller_id is not null and uploader_user_id <> caller_id then
        raise exception 'Opportunity media must be uploaded by the current institution member' using errcode = '42501';
      end if;
      if caller_id is not null
        and not messaging_private.can_contact_artists_for_institution(new.institution_id) then
        raise exception 'Opportunity media must belong to an authorized institution member' using errcode = '42501';
      end if;
    end if;
  end loop;

  if nullif(new.preview_image_path, '') is not null then
    new.preview_image_origin := 'institution_upload';
    if new.preview_image_rights_status = 'not_supplied' then
      new.preview_image_rights_status := 'provider_owned';
    end if;
  elsif nullif(new.preview_image_url, '') is null then
    new.preview_image_origin := 'kleio_fallback';
    new.preview_image_rights_status := 'not_supplied';
  end if;

  if nullif(new.submission_cover_path, '') is not null
    and nullif(new.submission_cover_alt_text, '') is null then
    raise exception 'Submission cover alt text is required' using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_open_call_preview_image_ownership() from public, anon, authenticated;

create index if not exists artist_conversation_controls_artist_idx
on public.artist_opportunity_conversation_controls(artist_user_id, updated_at desc);
create index if not exists artist_invitations_conversation_idx
on public.artist_opportunity_invitations(conversation_id);
create index if not exists artist_invitations_initiated_by_idx
on public.artist_opportunity_invitations(initiated_by);
create index if not exists artist_invitations_opportunity_idx
on public.artist_opportunity_invitations(opportunity_id);

commit;
