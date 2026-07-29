-- A specific-country query may fall back only to that country or genuinely
-- worldwide eligibility. This prevents a Jamaica query from surfacing a
-- region-restricted programme that a Jamaica-based artist cannot use.

create or replace function public.search_opportunities_v2(
  search_query text default null::text,
  opportunity_types text[] default null::text[],
  source_slugs text[] default null::text[],
  applicant_types text[] default null::text[],
  eligible_country text default null::text,
  participation_formats text[] default null::text[],
  discipline_filters text[] default null::text[],
  career_stage_filters text[] default null::text[],
  deadline_from timestamp with time zone default null::timestamp with time zone,
  deadline_to timestamp with time zone default null::timestamp with time zone,
  minimum_funding numeric default null::numeric,
  funding_known_only boolean default false,
  structured_requirements_only boolean default false,
  no_fee_only boolean default false,
  external_only boolean default false,
  limit_count integer default 50,
  offset_count integer default 0
)
returns setof public.opportunities
language sql
stable
security invoker
set search_path = ''
as $function$
  with parsed as (
    select public.interpret_opportunity_search_query(search_query) as value
  ),
  context as (
    select
      coalesce(search_query, '') as raw_query,
      coalesce(value->>'normalized_query', '') as normalized_query,
      coalesce(value->>'residual_query', '') as residual_query,
      coalesce(array(select jsonb_array_elements_text(value->'canonical_disciplines')), '{}'::text[]) as query_disciplines,
      coalesce(array(select jsonb_array_elements_text(value->'opportunity_types')), '{}'::text[]) as query_types,
      coalesce(array(select jsonb_array_elements_text(value->'locations')), '{}'::text[]) as query_locations,
      coalesce(array(select jsonb_array_elements_text(value->'participation_formats')), '{}'::text[]) as query_formats,
      coalesce(array(select jsonb_array_elements_text(value->'fee_terms')), '{}'::text[]) as query_fee_terms
    from parsed
  ),
  raw_candidates as (
    select
      opportunity_row as opportunity_record,
      c.*,
      (
        select count(distinct query_discipline)
        from unnest(c.query_disciplines) query_discipline
        where exists (
          select 1 from unnest(coalesce(opportunity_row.disciplines, '{}'::text[])) d
          where public.normalize_opportunity_search_text(d) = public.normalize_opportunity_search_text(query_discipline)
        ) or exists (
          select 1
          from public.opportunity_taxonomy_mappings mapping_row
          join public.artistic_taxonomy_terms term_row on term_row.id = mapping_row.term_id
          where mapping_row.opportunity_id = opportunity_row.id
            and mapping_row.verification_status = 'confirmed'
            and term_row.category = 'discipline'
            and term_row.canonical_value = query_discipline
        )
      )::integer as discipline_match_count,
      opportunity_row.opportunity_type = any(c.query_types) as type_match,
      (
        select count(distinct query_location)
        from unnest(c.query_locations) query_location
        where exists (
          select 1
          from unnest(
            coalesce(opportunity_row.locations, '{}'::text[]) ||
            coalesce(opportunity_row.eligible_regions, '{}'::text[]) ||
            coalesce(opportunity_row.eligible_countries, '{}'::text[])
          ) location_value
          where public.normalize_opportunity_search_text(location_value) = public.normalize_opportunity_search_text(query_location)
             or public.normalize_opportunity_search_text(location_value) like '%' || public.normalize_opportunity_search_text(query_location) || '%'
             or (
               public.normalize_opportunity_search_text(query_location) = 'worldwide'
               and public.normalize_opportunity_search_text(location_value) in ('worldwide','global','international','all countries')
             )
        )
      )::integer as location_match_count,
      exists (
        select 1
        from unnest(
          coalesce(opportunity_row.eligible_countries, '{}'::text[]) ||
          coalesce(opportunity_row.eligible_regions, '{}'::text[])
        ) eligibility_value
        where public.normalize_opportunity_search_text(eligibility_value) in (
          'worldwide','global','international','all countries','all nationalities'
        )
      ) as globally_eligible,
      opportunity_row.participation_format = any(c.query_formats)
        or ('online' = any(c.query_formats) and opportunity_row.remote_allowed is true) as format_match,
      opportunity_row.application_fee = 0 and 'no_fee' = any(c.query_fee_terms) as fee_match,
      case when c.residual_query = '' then false
        else opportunity_row.search_document @@ websearch_to_tsquery('simple', c.residual_query) end as residual_fts_match,
      case when c.normalized_query = '' then false
        else opportunity_row.search_document @@ websearch_to_tsquery('simple', c.normalized_query) end as raw_fts_match,
      greatest(
        extensions.similarity(public.normalize_opportunity_search_text(opportunity_row.title), c.residual_query),
        extensions.similarity(public.normalize_opportunity_search_text(opportunity_row.provider_name), c.residual_query)
      ) as fuzzy_text_score
    from public.opportunities opportunity_row
    join public.opportunity_sources source_row on source_row.id = opportunity_row.source_id
    cross join context c
    where opportunity_row.status in ('open', 'forecasted', 'upcoming')
      and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
      and opportunity_row.duplicate_of is null
      and opportunity_row.verification_status not in ('needs_review', 'expired', 'rejected')
      and source_row.active
      and (opportunity_types is null or cardinality(opportunity_types) = 0 or opportunity_row.opportunity_type = any(opportunity_types))
      and (source_slugs is null or cardinality(source_slugs) = 0 or source_row.slug = any(source_slugs))
      and (applicant_types is null or cardinality(applicant_types) = 0 or opportunity_row.eligible_applicant_types && applicant_types)
      and (
        nullif(trim(eligible_country), '') is null
        or exists (select 1 from unnest(coalesce(opportunity_row.eligible_countries, '{}'::text[])) v where lower(trim(v)) = lower(trim(eligible_country)))
        or exists (select 1 from unnest(coalesce(opportunity_row.eligible_regions, '{}'::text[])) v where lower(trim(v)) = lower(trim(eligible_country)))
      )
      and (participation_formats is null or cardinality(participation_formats) = 0 or opportunity_row.participation_format = any(participation_formats))
      and (
        discipline_filters is null or cardinality(discipline_filters) = 0
        or exists (
          select 1 from unnest(coalesce(opportunity_row.disciplines, '{}'::text[])) discipline_value
          join unnest(discipline_filters) requested_discipline
            on public.normalize_opportunity_search_text(discipline_value) = public.normalize_opportunity_search_text(requested_discipline)
        )
      )
      and (
        career_stage_filters is null or cardinality(career_stage_filters) = 0
        or exists (
          select 1 from unnest(coalesce(opportunity_row.career_stages, '{}'::text[])) career_value
          join unnest(career_stage_filters) requested_career
            on public.normalize_opportunity_search_text(career_value) = public.normalize_opportunity_search_text(requested_career)
        )
      )
      and (deadline_from is null or opportunity_row.deadline_at >= deadline_from)
      and (deadline_to is null or opportunity_row.deadline_at <= deadline_to)
      and (minimum_funding is null or greatest(coalesce(opportunity_row.award_min, 0), coalesce(opportunity_row.award_max, 0)) >= minimum_funding)
      and (
        not funding_known_only or opportunity_row.award_min is not null or opportunity_row.award_max is not null
        or nullif(trim(opportunity_row.funding_display_text), '') is not null
      )
      and (
        not structured_requirements_only
        or exists (select 1 from public.opportunity_requirements requirement_row
          where requirement_row.opportunity_id = opportunity_row.id and requirement_row.verification_status = 'confirmed')
      )
      and (not no_fee_only or opportunity_row.application_fee = 0)
      and (not external_only or opportunity_row.application_mode = 'external')
  ),
  candidates as (
    select
      raw_candidate.*,
      discipline_match_count > 0 as discipline_match,
      location_match_count > 0 as location_match,
      cardinality(query_locations) > 0 and not ('Worldwide' = any(query_locations)) as specific_location_requested,
      (
        (cardinality(query_disciplines) = 0 or discipline_match_count = cardinality(query_disciplines))
        and (cardinality(query_types) = 0 or type_match)
        and (cardinality(query_locations) = 0 or location_match_count = cardinality(query_locations))
        and (cardinality(query_formats) = 0 or format_match)
        and (cardinality(query_fee_terms) = 0 or fee_match)
      ) as exact_structured_match
    from raw_candidates raw_candidate
  ),
  availability as (
    select coalesce(bool_or(exact_structured_match), false) as has_exact_structured_match from candidates
  ),
  ranked as (
    select candidate.*, availability.has_exact_structured_match,
      (
        case when exact_structured_match then 250 else 0 end +
        case when cardinality(query_disciplines) > 0 and discipline_match then 120 else 0 end +
        case when cardinality(query_types) > 0 and type_match then 30 else 0 end +
        case when cardinality(query_locations) > 0 and location_match then 45 else 0 end +
        case when specific_location_requested and globally_eligible then 30 else 0 end +
        case when cardinality(query_formats) > 0 and format_match then 20 else 0 end +
        case when cardinality(query_fee_terms) > 0 and fee_match then 15 else 0 end +
        case when residual_fts_match then 40 else 0 end +
        case when raw_fts_match then 25 else 0 end +
        case when fuzzy_text_score >= 0.45 then fuzzy_text_score * 20 else 0 end
      )::numeric as relevance_score
    from candidates candidate cross join availability
  )
  select (ranked.opportunity_record).*
  from ranked
  where nullif(trim(raw_query), '') is null
    or (has_exact_structured_match and exact_structured_match)
    or (
      not has_exact_structured_match
      and case
        when cardinality(query_disciplines) > 0 then
          discipline_match and (not specific_location_requested or location_match or globally_eligible)
        when cardinality(query_locations) > 0 then location_match or (specific_location_requested and globally_eligible)
        when cardinality(query_types) > 0 then type_match
        when cardinality(query_formats) > 0 then format_match
        when cardinality(query_fee_terms) > 0 then fee_match
        else residual_fts_match or raw_fts_match or fuzzy_text_score >= 0.45
      end
    )
  order by relevance_score desc,
    case when nullif(trim((ranked.opportunity_record).preview_image_path), '') is not null
      or nullif(trim((ranked.opportunity_record).preview_image_url), '') is not null then 1 else 0 end desc,
    (ranked.opportunity_record).deadline_at asc nulls last,
    (ranked.opportunity_record).title asc
  limit greatest(1, least(coalesce(limit_count, 50), 100))
  offset greatest(coalesce(offset_count, 0), 0);
$function$;
