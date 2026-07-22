begin;

alter table public.open_calls drop constraint if exists open_calls_preview_image_url_https_check;
alter table public.open_calls add constraint open_calls_preview_image_url_https_check
check (preview_image_url = '' or preview_image_url ~ '^https://');

alter table public.open_calls drop constraint if exists open_calls_preview_image_source_url_https_check;
alter table public.open_calls add constraint open_calls_preview_image_source_url_https_check
check (preview_image_source_url = '' or preview_image_source_url ~ '^https://');

alter table public.open_calls drop constraint if exists open_calls_preview_image_metadata_length_check;
alter table public.open_calls add constraint open_calls_preview_image_metadata_length_check
check (
  char_length(preview_image_alt_text) <= 500
  and char_length(preview_image_attribution) <= 500
  and char_length(preview_image_url) <= 2048
  and char_length(preview_image_source_url) <= 2048
  and preview_image_path !~ '(^|/)\.\.(/|$)'
);

alter table public.opportunities drop constraint if exists opportunities_preview_image_url_https_check;
alter table public.opportunities add constraint opportunities_preview_image_url_https_check
check (preview_image_url = '' or preview_image_url ~ '^https://');

alter table public.opportunities drop constraint if exists opportunities_preview_image_source_url_https_check;
alter table public.opportunities add constraint opportunities_preview_image_source_url_https_check
check (preview_image_source_url = '' or preview_image_source_url ~ '^https://');

alter table public.opportunities drop constraint if exists opportunities_preview_image_metadata_length_check;
alter table public.opportunities add constraint opportunities_preview_image_metadata_length_check
check (
  char_length(preview_image_alt_text) <= 500
  and char_length(preview_image_attribution) <= 500
  and char_length(preview_image_url) <= 2048
  and char_length(preview_image_source_url) <= 2048
  and preview_image_path !~ '(^|/)\.\.(/|$)'
);

commit;
