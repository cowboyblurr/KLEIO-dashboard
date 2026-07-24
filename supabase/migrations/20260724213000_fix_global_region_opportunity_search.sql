begin;

create or replace function public.refresh_opportunity_search_document()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  new.search_document :=
    setweight(to_tsvector('simple', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.provider_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.summary, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.description, '')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.disciplines, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.locations, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.eligible_regions, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.eligible_countries, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.eligible_applicant_types, '{}'), ' ')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.citizenship_requirements, '{}'), ' ')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.residency_requirements, '{}'), ' ')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(new.language_requirements, '{}'), ' ')), 'C');
  return new;
end;
$function$;

drop trigger if exists opportunities_search_document on public.opportunities;
create trigger opportunities_search_document
before insert or update of
  title,
  provider_name,
  summary,
  description,
  disciplines,
  locations,
  eligible_applicant_types,
  eligible_countries,
  eligible_regions,
  citizenship_requirements,
  residency_requirements,
  language_requirements
on public.opportunities
for each row execute function public.refresh_opportunity_search_document();

update public.opportunities
set search_document =
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(provider_name, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(description, '')), 'C') ||
  setweight(to_tsvector('simple', array_to_string(coalesce(disciplines, '{}'), ' ')), 'B') ||
  setweight(to_tsvector('simple', array_to_string(coalesce(locations, '{}'), ' ')), 'B') ||
  setweight(to_tsvector('simple', array_to_string(coalesce(eligible_regions, '{}'), ' ')), 'B') ||
  setweight(to_tsvector('simple', array_to_string(coalesce(eligible_countries, '{}'), ' ')), 'B') ||
  setweight(to_tsvector('simple', array_to_string(coalesce(eligible_applicant_types, '{}'), ' ')), 'C') ||
  setweight(to_tsvector('simple', array_to_string(coalesce(citizenship_requirements, '{}'), ' ')), 'C') ||
  setweight(to_tsvector('simple', array_to_string(coalesce(residency_requirements, '{}'), ' ')), 'C') ||
  setweight(to_tsvector('simple', array_to_string(coalesce(language_requirements, '{}'), ' ')), 'C');

create or replace function public.search_opportunities(
  search_query text default null,
  opportunity_types text[] default null,
  source_slugs text[] default null,
  applicant_types text[] default null,
  eligible_country text default null,
  participation_formats text[] default null,
  no_fee_only boolean default false,
  external_only boolean default false,
  limit_count integer default 50,
  offset_count integer default 0
)
returns setof public.opportunities
language sql
stable
set search_path to ''
as $function$
  select opportunity_row.*
  from public.opportunities opportunity_row
  join public.opportunity_sources source_row on source_row.id = opportunity_row.source_id
  where opportunity_row.status in ('open', 'forecasted', 'upcoming')
    and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
    and opportunity_row.duplicate_of is null
    and opportunity_row.verification_status not in ('needs_review', 'expired', 'rejected')
    and source_row.active
    and (
      nullif(trim(search_query), '') is null
      or opportunity_row.search_document @@ websearch_to_tsquery('simple', trim(search_query))
      or opportunity_row.title ilike '%' || trim(search_query) || '%'
      or opportunity_row.provider_name ilike '%' || trim(search_query) || '%'
    )
    and (opportunity_types is null or cardinality(opportunity_types) = 0 or opportunity_row.opportunity_type = any(opportunity_types))
    and (source_slugs is null or cardinality(source_slugs) = 0 or source_row.slug = any(source_slugs))
    and (applicant_types is null or cardinality(applicant_types) = 0 or opportunity_row.eligible_applicant_types && applicant_types)
    and (
      nullif(trim(eligible_country), '') is null
      or lower(trim(eligible_country)) = any(
        select lower(country_value)
        from unnest(coalesce(opportunity_row.eligible_countries, '{}')) country_value
      )
      or lower(trim(eligible_country)) = any(
        select lower(region_value)
        from unnest(coalesce(opportunity_row.eligible_regions, '{}')) region_value
      )
    )
    and (participation_formats is null or cardinality(participation_formats) = 0 or opportunity_row.participation_format = any(participation_formats))
    and (not no_fee_only or opportunity_row.application_fee = 0)
    and (not external_only or opportunity_row.application_mode = 'external')
  order by
    case
      when nullif(trim(search_query), '') is null then 0
      else ts_rank(opportunity_row.search_document, websearch_to_tsquery('simple', trim(search_query)))
    end desc,
    opportunity_row.deadline_at asc nulls last,
    opportunity_row.title asc
  limit greatest(1, least(coalesce(limit_count, 50), 100))
  offset greatest(coalesce(offset_count, 0), 0);
$function$;

commit;
