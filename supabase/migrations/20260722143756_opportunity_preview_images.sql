begin;

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'opportunity-images',
  'opportunity-images',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists opportunity_images_public_read on storage.objects;
create policy opportunity_images_public_read
on storage.objects for select
to anon, authenticated
using (bucket_id = 'opportunity-images');

drop policy if exists opportunity_images_institution_insert on storage.objects;
create policy opportunity_images_institution_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'opportunity-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.profiles profile_row
    where profile_row.id = (select auth.uid())
      and profile_row.role = 'institution'::public.kleio_role
  )
);

drop policy if exists opportunity_images_institution_update on storage.objects;
create policy opportunity_images_institution_update
on storage.objects for update
to authenticated
using (
  bucket_id = 'opportunity-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'opportunity-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists opportunity_images_institution_delete on storage.objects;
create policy opportunity_images_institution_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'opportunity-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

alter table public.open_calls
  add column if not exists preview_image_path text not null default '',
  add column if not exists preview_image_url text not null default '',
  add column if not exists preview_image_source_url text not null default '',
  add column if not exists preview_image_alt_text text not null default '',
  add column if not exists preview_image_attribution text not null default '',
  add column if not exists preview_image_rights_status text not null default 'not_supplied',
  add column if not exists preview_image_origin text not null default 'kleio_fallback';

alter table public.opportunities
  add column if not exists preview_image_path text not null default '',
  add column if not exists preview_image_url text not null default '',
  add column if not exists preview_image_source_url text not null default '',
  add column if not exists preview_image_alt_text text not null default '',
  add column if not exists preview_image_attribution text not null default '',
  add column if not exists preview_image_rights_status text not null default 'not_supplied',
  add column if not exists preview_image_origin text not null default 'kleio_fallback';

alter table public.open_calls drop constraint if exists open_calls_preview_image_rights_status_check;
alter table public.open_calls add constraint open_calls_preview_image_rights_status_check
check (preview_image_rights_status in (
  'not_supplied','provider_owned','licensed','official_publication',
  'public_domain','permission_confirmed','unknown'
));

alter table public.open_calls drop constraint if exists open_calls_preview_image_origin_check;
alter table public.open_calls add constraint open_calls_preview_image_origin_check
check (preview_image_origin in (
  'kleio_fallback','institution_upload','official_source','provider_upload','provider_logo'
));

alter table public.opportunities drop constraint if exists opportunities_preview_image_rights_status_check;
alter table public.opportunities add constraint opportunities_preview_image_rights_status_check
check (preview_image_rights_status in (
  'not_supplied','provider_owned','licensed','official_publication',
  'public_domain','permission_confirmed','unknown'
));

alter table public.opportunities drop constraint if exists opportunities_preview_image_origin_check;
alter table public.opportunities add constraint opportunities_preview_image_origin_check
check (preview_image_origin in (
  'kleio_fallback','institution_upload','official_source','provider_upload','provider_logo'
));

create or replace function public.enforce_open_call_preview_image_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if nullif(new.preview_image_path, '') is not null
     and split_part(new.preview_image_path, '/', 1) <> new.created_by::text
  then
    raise exception 'Opportunity preview image must belong to the call creator' using errcode = '42501';
  end if;

  if nullif(new.preview_image_path, '') is not null then
    new.preview_image_origin := 'institution_upload';
    if new.preview_image_rights_status = 'not_supplied' then
      new.preview_image_rights_status := 'provider_owned';
    end if;
  elsif nullif(new.preview_image_url, '') is null then
    new.preview_image_origin := 'kleio_fallback';
    new.preview_image_rights_status := 'not_supplied';
  end if;

  return new;
end;
$$;

drop trigger if exists open_calls_preview_image_ownership on public.open_calls;
create trigger open_calls_preview_image_ownership
before insert or update of preview_image_path, preview_image_url, preview_image_rights_status, preview_image_origin, created_by
on public.open_calls
for each row execute function public.enforce_open_call_preview_image_ownership();

create or replace function public.sync_open_call_preview_image()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.opportunities opportunity_row
  set
    preview_image_path = new.preview_image_path,
    preview_image_url = new.preview_image_url,
    preview_image_source_url = new.preview_image_source_url,
    preview_image_alt_text = new.preview_image_alt_text,
    preview_image_attribution = new.preview_image_attribution,
    preview_image_rights_status = new.preview_image_rights_status,
    preview_image_origin = new.preview_image_origin,
    updated_at = now()
  where opportunity_row.internal_call_id = new.id;
  return new;
end;
$$;

revoke all on function public.sync_open_call_preview_image() from public, anon, authenticated;

drop trigger if exists zz_open_calls_sync_preview_image on public.open_calls;
create trigger zz_open_calls_sync_preview_image
after insert or update of preview_image_path, preview_image_url, preview_image_source_url,
  preview_image_alt_text, preview_image_attribution, preview_image_rights_status, preview_image_origin
on public.open_calls
for each row execute function public.sync_open_call_preview_image();

create or replace function public.sync_provider_submission_preview_image()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.moderation_status = 'published' and new.published_opportunity_id is not null then
    update public.opportunities
    set
      preview_image_path = trim(coalesce(new.payload->>'preview_image_path', '')),
      preview_image_url = trim(coalesce(new.payload->>'preview_image_url', '')),
      preview_image_source_url = trim(coalesce(new.payload->>'preview_image_source_url', new.source_url, '')),
      preview_image_alt_text = trim(coalesce(new.payload->>'preview_image_alt_text', '')),
      preview_image_attribution = trim(coalesce(new.payload->>'preview_image_attribution', '')),
      preview_image_rights_status = case
        when coalesce(new.payload->>'preview_image_rights_status', '') in (
          'provider_owned','licensed','official_publication','public_domain','permission_confirmed','unknown'
        ) then new.payload->>'preview_image_rights_status'
        else 'not_supplied'
      end,
      preview_image_origin = case
        when nullif(trim(coalesce(new.payload->>'preview_image_path', '')), '') is not null then 'provider_upload'
        when nullif(trim(coalesce(new.payload->>'preview_image_url', '')), '') is not null then 'official_source'
        else 'kleio_fallback'
      end,
      updated_at = now()
    where id = new.published_opportunity_id;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_provider_submission_preview_image() from public, anon, authenticated;

drop trigger if exists zz_provider_submission_sync_preview_image on public.institution_opportunity_submissions;
create trigger zz_provider_submission_sync_preview_image
after insert or update of moderation_status, published_opportunity_id, payload
on public.institution_opportunity_submissions
for each row execute function public.sync_provider_submission_preview_image();

update public.opportunities opportunity_row
set
  preview_image_path = call_row.preview_image_path,
  preview_image_url = call_row.preview_image_url,
  preview_image_source_url = call_row.preview_image_source_url,
  preview_image_alt_text = call_row.preview_image_alt_text,
  preview_image_attribution = call_row.preview_image_attribution,
  preview_image_rights_status = call_row.preview_image_rights_status,
  preview_image_origin = call_row.preview_image_origin
from public.open_calls call_row
where opportunity_row.internal_call_id = call_row.id;

commit;
