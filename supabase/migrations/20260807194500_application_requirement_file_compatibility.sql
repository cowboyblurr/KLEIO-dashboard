-- Application requirement file compatibility.
--
-- KLEIO stores requirement files in the existing private artist-assets bucket and
-- artist_import_sources model. Opportunity sources in the live corpus legitimately
-- request common Office, archive, text, audio, and video formats in addition to PDF
-- and images. This migration widens only the storage/file-size contract required by
-- the application requirement picker; it does not enable new connected providers or
-- change global import-source feature flags.

alter table public.artist_import_sources
  drop constraint if exists artist_import_sources_byte_size_check;

alter table public.artist_import_sources
  add constraint artist_import_sources_byte_size_check
  check (byte_size is null or (byte_size >= 0 and byte_size <= 52428800));

update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/jpeg','image/png','image/webp',
      'video/mp4','video/quicktime','video/x-ms-wmv','video/x-ms-asf','application/vnd.ms-asf',
      'audio/mpeg','audio/mp3',
      'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/csv','application/csv','text/plain',
      'application/zip','application/x-zip-compressed','application/x-subrip','text/vtt'
    ]::text[]
where id = 'artist-assets';
