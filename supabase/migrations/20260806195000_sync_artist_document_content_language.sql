begin;

create or replace function public.sync_artist_import_source_content_language()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  detected_language text;
begin
  detected_language := nullif(trim(coalesce(
    new.review_summary #>> '{document_assessment,languages,0}',
    ''
  )), '');

  if detected_language is not null then
    new.content_language := lower(replace(detected_language, '_', '-'));
  elsif new.content_language is null then
    new.content_language := '';
  end if;

  return new;
end;
$$;

drop trigger if exists sync_artist_import_source_content_language_trigger
  on public.artist_import_sources;

create trigger sync_artist_import_source_content_language_trigger
before insert or update of review_summary, content_language
on public.artist_import_sources
for each row
execute function public.sync_artist_import_source_content_language();

update public.artist_import_sources
set content_language = lower(replace(
  review_summary #>> '{document_assessment,languages,0}',
  '_',
  '-'
))
where coalesce(content_language, '') = ''
  and nullif(trim(coalesce(
    review_summary #>> '{document_assessment,languages,0}',
    ''
  )), '') is not null;

commit;
