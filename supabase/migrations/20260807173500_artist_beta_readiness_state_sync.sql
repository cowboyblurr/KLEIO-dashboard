-- Artist beta-readiness state repair.
-- 1) Direct device image upload is a baseline artist capability.
-- 2) An uploaded/reclassified Artist CV must update the canonical artist profile immediately.

update public.kleio_import_source_availability
set artist_beta_enabled = true
where source_type = 'device_image';

create or replace function public.sync_artist_cv_file_path_from_import_source()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  replacement_path text;
begin
  if new.deleted_at is null
    and coalesce(new.storage_path, '') <> ''
    and (
      new.artist_selected_document_type = 'artist_cv'
      or new.classification = 'artist_cv'
    )
  then
    update public.artist_profiles
    set
      cv_file_path = new.storage_path,
      updated_at = now()
    where user_id = new.artist_user_id
      and coalesce(cv_file_path, '') is distinct from new.storage_path;

    return new;
  end if;

  if tg_op = 'UPDATE'
    and (
      old.artist_selected_document_type = 'artist_cv'
      or old.classification = 'artist_cv'
    )
    and (
      new.deleted_at is not null
      or not (
        new.artist_selected_document_type = 'artist_cv'
        or new.classification = 'artist_cv'
      )
    )
  then
    select source.storage_path
    into replacement_path
    from public.artist_import_sources as source
    where source.artist_user_id = new.artist_user_id
      and source.id <> new.id
      and source.deleted_at is null
      and coalesce(source.storage_path, '') <> ''
      and (
        source.artist_selected_document_type = 'artist_cv'
        or source.classification = 'artist_cv'
      )
    order by source.updated_at desc, source.created_at desc
    limit 1;

    update public.artist_profiles
    set
      cv_file_path = coalesce(replacement_path, ''),
      updated_at = now()
    where user_id = new.artist_user_id
      and coalesce(cv_file_path, '') = coalesce(old.storage_path, '');
  end if;

  return new;
end;
$$;

drop trigger if exists sync_artist_cv_file_path_from_import_source
on public.artist_import_sources;

create trigger sync_artist_cv_file_path_from_import_source
after insert or update of artist_selected_document_type, classification, storage_path, deleted_at
on public.artist_import_sources
for each row
execute function public.sync_artist_cv_file_path_from_import_source();

-- Repair artists who already uploaded/classified a CV before this trigger existed.
with latest_cv as (
  select distinct on (artist_user_id)
    artist_user_id,
    storage_path
  from public.artist_import_sources
  where deleted_at is null
    and coalesce(storage_path, '') <> ''
    and (
      artist_selected_document_type = 'artist_cv'
      or classification = 'artist_cv'
    )
  order by artist_user_id, updated_at desc, created_at desc
)
update public.artist_profiles as profile
set
  cv_file_path = latest_cv.storage_path,
  updated_at = now()
from latest_cv
where profile.user_id = latest_cv.artist_user_id
  and coalesce(profile.cv_file_path, '') is distinct from latest_cv.storage_path;
