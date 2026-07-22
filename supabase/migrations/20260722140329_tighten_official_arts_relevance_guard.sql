begin;

create or replace function public.enforce_official_opportunity_trust()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  source_slug text;
  relevance_text text;
begin
  select source_row.slug into source_slug
  from public.opportunity_sources source_row
  where source_row.id = new.source_id;

  if source_slug = 'grants-gov' then
    relevance_text := lower(concat_ws(' ', new.title, new.provider_name, new.summary, new.description));
    if relevance_text !~ '(\marts?\M|\martists?\M|\mcultur(e|al)?\M|\mcreative\M|\mheritage\M|\mmuseums?\M|\mfilms?\M|\mmedia\M|\maudiovisual\M|\mdesign\M|\marchitect(ure|ural)?\M|\mmusic\M|\mdance\M|\mtheat(re|er)\M|\mphotograph(y|ic)?\M|\mexhibitions?\M|\mcrafts?\M)'
    then
      new.status := 'archived';
      new.verification_status := 'needs_review';
    end if;
  end if;
  return new;
end;
$$;

update public.opportunities opportunity_row
set title = opportunity_row.title
from public.opportunity_sources source_row
where source_row.id = opportunity_row.source_id
  and source_row.slug = 'grants-gov';

commit;
