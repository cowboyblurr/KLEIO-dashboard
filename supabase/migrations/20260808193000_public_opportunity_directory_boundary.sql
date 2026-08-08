-- Public opportunity discovery must not depend on broad anonymous table reads.
-- This SECURITY DEFINER boundary returns only real, currently trusted opportunities
-- through an explicit public-safe projection. Underlying opportunity tables remain private.

create or replace function public.search_public_opportunity_directory_v1(
  search_query text default null,
  opportunity_types text[] default null,
  source_slugs text[] default null,
  applicant_types text[] default null,
  eligible_country text default null,
  participation_formats text[] default null,
  discipline_filters text[] default null,
  career_stage_filters text[] default null,
  deadline_from timestamptz default null,
  deadline_to timestamptz default null,
  minimum_funding numeric default null,
  funding_known_only boolean default false,
  structured_requirements_only boolean default false,
  no_fee_only boolean default false,
  external_only boolean default false,
  limit_count integer default 50,
  offset_count integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  opportunity_row public.opportunities%rowtype;
  selected_ids uuid[] := '{}'::uuid[];
  chunk_offset integer := 0;
  chunk_count integer;
  visible_index integer := 0;
  requested_limit integer := greatest(1, least(coalesce(limit_count, 50), 100));
  requested_offset integer := greatest(coalesce(offset_count, 0), 0);
  result jsonb;
begin
  loop
    chunk_count := 0;
    for opportunity_row in
      select *
      from public.search_opportunities_v2(
        search_query, opportunity_types, source_slugs, applicant_types,
        eligible_country, participation_formats, discipline_filters, career_stage_filters,
        deadline_from, deadline_to, minimum_funding, funding_known_only,
        structured_requirements_only, no_fee_only, external_only, 100, chunk_offset
      )
    loop
      chunk_count := chunk_count + 1;
      if opportunity_row.data_scope = 'real'
        and opportunity_row.lifecycle_status = any (array['verified'::text,'published'::text,'updated'::text,'closing_soon'::text])
        and opportunity_row.verification_status = any (array['official_source'::text,'provider_published'::text,'provider_verified'::text,'kleio_reviewed'::text])
        and opportunity_row.last_verified_at is not null
        and nullif(btrim(opportunity_row.provider_name), '') is not null
        and (
          nullif(btrim(opportunity_row.canonical_url), '') is not null
          or nullif(btrim(opportunity_row.application_url), '') is not null
          or nullif(btrim(opportunity_row.guidelines_url), '') is not null
        )
        and exists (
          select 1 from public.opportunity_sources source_row
          where source_row.id = opportunity_row.source_id and source_row.active
        )
      then
        if visible_index >= requested_offset then
          selected_ids := array_append(selected_ids, opportunity_row.id);
          exit when cardinality(selected_ids) >= requested_limit;
        end if;
        visible_index := visible_index + 1;
      end if;
    end loop;
    exit when cardinality(selected_ids) >= requested_limit;
    exit when chunk_count < 100 or chunk_offset >= 4900;
    chunk_offset := chunk_offset + 100;
  end loop;

  with selected as (
    select selected_id as id, ordinality
    from unnest(selected_ids) with ordinality as chosen(selected_id, ordinality)
  ),
  item_rows as (
    select (
      jsonb_build_object(
        'id', o.id, 'source_id', o.source_id, 'external_id', o.external_id, 'internal_call_id', null,
        'canonical_url', o.canonical_url, 'application_url', o.application_url, 'guidelines_url', o.guidelines_url,
        'title', o.title, 'provider_name', o.provider_name, 'provider_id', '', 'opportunity_type', o.opportunity_type,
        'summary', o.summary, 'description', o.description, 'disciplines', coalesce(o.disciplines, '{}'::text[]),
        'eligible_applicant_types', coalesce(o.eligible_applicant_types, '{}'::text[]),
        'eligible_countries', coalesce(o.eligible_countries, '{}'::text[]), 'eligible_regions', coalesce(o.eligible_regions, '{}'::text[]),
        'citizenship_requirements', coalesce(o.citizenship_requirements, '{}'::text[]), 'residency_requirements', coalesce(o.residency_requirements, '{}'::text[]),
        'career_stages', coalesce(o.career_stages, '{}'::text[]), 'age_min', o.age_min, 'age_max', o.age_max,
        'award_min', o.award_min, 'award_max', o.award_max, 'currency', o.currency,
        'application_fee', o.application_fee, 'application_fee_currency', o.application_fee_currency,
        'deadline_at', o.deadline_at, 'deadline_timezone', o.deadline_timezone, 'opens_at', o.opens_at,
        'recurring', o.recurring, 'remote_allowed', o.remote_allowed, 'travel_supported', o.travel_supported,
        'accommodation_supported', o.accommodation_supported, 'fiscal_sponsor_allowed', o.fiscal_sponsor_allowed,
        'language_requirements', coalesce(o.language_requirements, '{}'::text[]), 'education_requirements', coalesce(o.education_requirements, '{}'::text[]),
        'organization_status_requirements', coalesce(o.organization_status_requirements, '{}'::text[]),
        'previous_award_restrictions', o.previous_award_restrictions, 'required_materials', coalesce(o.required_materials, '{}'::text[]),
        'participation_format', o.participation_format, 'locations', coalesce(o.locations, '{}'::text[]),
        'application_mode', o.application_mode, 'status', o.status, 'verification_status', o.verification_status
      )
      ||
      jsonb_build_object(
        'source_published_at', o.source_published_at, 'source_updated_at', o.source_updated_at, 'last_verified_at', o.last_verified_at,
        'preview_image_url', o.preview_image_url, 'preview_image_path', o.preview_image_path, 'preview_image_alt_text', o.preview_image_alt_text,
        'preview_image_position_x', o.preview_image_position_x, 'preview_image_position_y', o.preview_image_position_y,
        'funding_display_text', o.funding_display_text, 'funding_amount_type', o.funding_amount_type,
        'funding_source_url', o.funding_source_url, 'funding_verified_at', o.funding_verified_at,
        'submission_method', o.submission_method, 'source_language', o.source_language, 'original_title', o.original_title,
        'accepted_application_languages', coalesce(o.accepted_application_languages, '{}'::text[]), 'eligibility_scope', o.eligibility_scope,
        'visa_supported', o.visa_supported, 'insurance_supported', o.insurance_supported, 'production_supported', o.production_supported,
        'living_stipend_text', o.living_stipend_text, 'deadline_kind', o.deadline_kind,
        'expected_decision_at', o.expected_decision_at, 'program_start_at', o.program_start_at, 'program_end_at', o.program_end_at,
        'artwork_ai_policy', o.artwork_ai_policy, 'application_assistance_policy', o.application_assistance_policy,
        'policy_source_url', o.policy_source_url, 'policy_last_verified_at', o.policy_last_verified_at, 'data_scope', 'real'
      )
    ) as value, selected.ordinality
    from selected join public.opportunities o on o.id = selected.id
    order by selected.ordinality
  ),
  source_rows as (
    select jsonb_build_object(
      'id', s.id, 'slug', s.slug, 'name', s.name, 'base_domain', s.base_domain,
      'source_type', s.source_type, 'ingestion_method', s.ingestion_method,
      'attribution_required', s.attribution_required, 'active', s.active, 'last_successful_sync', s.last_successful_sync
    ) as value
    from public.opportunity_sources s
    where s.active and s.id in (select o.source_id from public.opportunities o where o.id = any(selected_ids))
  ),
  rule_rows as (
    select jsonb_build_object(
      'id', r.id, 'opportunity_id', r.opportunity_id, 'rule_type', r.rule_type, 'operator', r.operator,
      'value', r.value, 'requirement_level', r.requirement_level, 'source_text', r.source_text,
      'source_url', r.source_url, 'source_field', r.source_field, 'verification_status', r.verification_status,
      'last_verified_at', r.last_verified_at, 'sort_order', r.sort_order
    ) as value
    from public.opportunity_eligibility_rules r
    where r.opportunity_id = any(selected_ids) and r.verification_status in ('confirmed','ambiguous')
    order by r.opportunity_id, r.sort_order
  ),
  requirement_rows as (
    select jsonb_build_object(
      'id', r.id, 'opportunity_id', r.opportunity_id, 'material_key', r.material_key, 'label', r.label,
      'required', r.required, 'source_text', r.source_text, 'source_url', r.source_url,
      'verification_status', r.verification_status, 'last_verified_at', r.last_verified_at, 'sort_order', r.sort_order,
      'category', r.category, 'description', r.description, 'source_location', r.source_location,
      'passport_field', r.passport_field, 'input_type', r.input_type, 'minimum_word_count', r.minimum_word_count,
      'maximum_word_count', r.maximum_word_count, 'minimum_item_count', r.minimum_item_count,
      'maximum_item_count', r.maximum_item_count, 'accepted_file_types', coalesce(r.accepted_file_types, '{}'::text[]),
      'maximum_file_size_bytes', r.maximum_file_size_bytes, 'maximum_total_size_bytes', r.maximum_total_size_bytes,
      'filename_pattern', r.filename_pattern, 'requires_artist_confirmation', r.requires_artist_confirmation,
      'legal_declaration', r.legal_declaration, 'payment_required', r.payment_required,
      'human_verification_required', r.human_verification_required, 'constraints', r.constraints,
      'source_title', r.source_title, 'source_date', r.source_date, 'retrieved_at', r.retrieved_at,
      'confidence_status', r.confidence_status, 'normalized_interpretation', r.normalized_interpretation
    ) as value
    from public.opportunity_requirements r
    where r.opportunity_id = any(selected_ids) and r.verification_status in ('confirmed','ambiguous')
    order by r.opportunity_id, r.sort_order
  ),
  translation_rows as (
    select jsonb_build_object(
      'id', t.id, 'opportunity_id', t.opportunity_id, 'locale', t.locale, 'source_language', t.source_language,
      'title', t.title, 'summary', t.summary, 'description', t.description,
      'required_materials', coalesce(t.required_materials, '{}'::text[]),
      'requirement_translations', coalesce(t.requirement_translations, '{}'::jsonb),
      'source_content_hash', '', 'translation_method', t.translation_method,
      'verified_at', t.verified_at, 'updated_at', t.updated_at
    ) as value
    from public.opportunity_translations t where t.opportunity_id = any(selected_ids)
  )
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(value order by ordinality) from item_rows), '[]'::jsonb),
    'sources', coalesce((select jsonb_agg(value) from source_rows), '[]'::jsonb),
    'rules', coalesce((select jsonb_agg(value) from rule_rows), '[]'::jsonb),
    'requirements', coalesce((select jsonb_agg(value) from requirement_rows), '[]'::jsonb),
    'translations', coalesce((select jsonb_agg(value) from translation_rows), '[]'::jsonb)
  ) into result;

  return coalesce(result, jsonb_build_object('items','[]'::jsonb,'sources','[]'::jsonb,'rules','[]'::jsonb,'requirements','[]'::jsonb,'translations','[]'::jsonb));
end;
$$;

revoke all on function public.search_public_opportunity_directory_v1(text,text[],text[],text[],text,text[],text[],text[],timestamptz,timestamptz,numeric,boolean,boolean,boolean,boolean,integer,integer) from public;
grant execute on function public.search_public_opportunity_directory_v1(text,text[],text[],text[],text,text[],text[],text[],timestamptz,timestamptz,numeric,boolean,boolean,boolean,boolean,integer,integer) to anon, authenticated, service_role;

comment on function public.search_public_opportunity_directory_v1(text,text[],text[],text[],text,text[],text[],text[],timestamptz,timestamptz,numeric,boolean,boolean,boolean,boolean,integer,integer) is 'Public read boundary for real, currently trusted artist opportunities. Returns an explicit safe projection without granting anon table access.';
