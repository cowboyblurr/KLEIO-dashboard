begin;

-- Direct artist-controlled image uploads are active product paths for profile
-- photos and portfolio media. The prior document-beta gate rejected their
-- database records after storage upload, which caused the client to clean the
-- uploaded object back up.
update public.kleio_import_source_availability
set artist_beta_enabled = true,
    availability_note = 'Active artist-controlled image upload path for profile photos and portfolio media.',
    updated_at = now()
where source_type = 'device_image';

-- An untouched proposal has no artist edit. Store that state as NULL so the
-- confirmation flow can fall back to the extracted proposed value.
alter table public.artist_import_proposals
  alter column artist_edited_value drop not null,
  alter column artist_edited_value drop default;

update public.artist_import_proposals
set artist_edited_value = null
where artist_edited_value = '';

commit;
