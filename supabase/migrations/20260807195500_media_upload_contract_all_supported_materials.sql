alter table public.artist_import_sources drop constraint if exists artist_import_sources_source_type_check;
alter table public.artist_import_sources add constraint artist_import_sources_source_type_check check (source_type = any (array['pdf'::text,'pasted_text'::text,'website'::text,'voice_transcript'::text,'device_image'::text,'device_document'::text,'device_video'::text,'device_audio'::text,'google_drive_image'::text,'google_drive_document'::text,'google_drive_video'::text,'google_drive_audio'::text,'instagram_image'::text,'existing_kleio_media'::text]));

alter table public.artist_import_sources drop constraint if exists artist_import_sources_byte_size_check;
alter table public.artist_import_sources add constraint artist_import_sources_byte_size_check check (byte_size is null or (byte_size >= 0 and byte_size <= 52428800));

alter table public.artist_import_sources drop constraint if exists artist_import_sources_image_mime_check;
alter table public.artist_import_sources add constraint artist_import_sources_image_mime_check check (source_type <> all (array['device_image'::text,'google_drive_image'::text,'instagram_image'::text]) or mime_type = any (array['image/jpeg'::text,'image/png'::text,'image/webp'::text,'image/gif'::text,'image/heic'::text,'image/heif'::text]));

insert into public.kleio_import_source_availability (source_type, artist_beta_enabled, artist_label, availability_note)
values
  ('device_video', true, 'Device upload', 'Active beta path for artist-controlled video upload to the private KLEIO Media Library.'),
  ('device_audio', true, 'Device upload', 'Active beta path for artist-controlled audio upload to the private KLEIO Media Library.'),
  ('google_drive_video', false, 'Google Drive', 'Deferred until the connected-provider flow is validated.'),
  ('google_drive_audio', false, 'Google Drive', 'Deferred until the connected-provider flow is validated.')
on conflict (source_type) do update set artist_beta_enabled=excluded.artist_beta_enabled, artist_label=excluded.artist_label, availability_note=excluded.availability_note, updated_at=now();

update public.kleio_import_source_availability set artist_label='Device upload', availability_note='Active beta path for artist-controlled supporting-document upload to the private KLEIO Media Library.', updated_at=now() where source_type='device_document';
update public.kleio_import_source_availability set artist_label='Device upload', availability_note='Active beta path for artist-controlled image upload to the private KLEIO Media Library.', updated_at=now() where source_type='device_image';
update public.kleio_import_source_availability set artist_label='PDF analysis', availability_note='Active optional path for private PDF document analysis; PDF is not the only upload format.', updated_at=now() where source_type='pdf';

update storage.buckets set file_size_limit=52428800, allowed_mime_types=array[
'image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif',
'video/mp4','video/quicktime','video/webm','video/x-ms-wmv','video/x-ms-asf','application/vnd.ms-asf',
'audio/mpeg','audio/mp3','audio/mp4','audio/wav','audio/x-wav','audio/ogg',
'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
'text/csv','application/csv','text/plain','application/rtf','text/rtf','application/zip','application/x-zip-compressed','application/x-subrip','text/vtt']::text[] where id='artist-assets';
