-- 004_opportunity_admin_and_sync_functions
begin;
create or replace function public.record_opportunity_event(
  target_event_name text,
  target_opportunity_id uuid default null,
  target_search_query text default '',
  target_metadata jsonb default '{}'
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare event_id bigint;
begin
  if target_event_name not in ('search','zero_results','view','save','unsave','external_application_click','internal_application_start','provider_submission') then
    raise exception 'Unsupported opportunity event';
  end if;
  insert into public.opportunity_events (artist_user_id, opportunity_id, event_name, search_query, metadata)
  values ((select auth.uid()), target_opportunity_id, target_event_name, left(coalesce(target_search_query, ''), 200), coalesce(target_metadata, '{}'))
  returning id into event_id;
  return event_id;
end;
$$;
revoke all on function public.record_opportunity_event(text,uuid,text,jsonb) from public;
grant execute on function public.record_opportunity_event(text,uuid,text,jsonb) to anon, authenticated;

create or replace function public.admin_import_opportunities(import_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_row public.opportunity_sources%rowtype;
  item jsonb;
  imported_count integer := 0;
  rejected_count integer := 0;
  errors jsonb := '[]'::jsonb;
  item_title text;
  item_provider text;
  item_source_url text;
  item_external_id text;
begin
  if not public.is_kleio_admin() then raise exception 'KLEIO administrator access is required'; end if;
  if jsonb_typeof(import_payload) <> 'array' then raise exception 'Import payload must be a JSON array'; end if;
  select * into source_row from public.opportunity_sources where slug = 'admin-import';
  for item in select value from jsonb_array_elements(import_payload) loop
    item_title := trim(coalesce(item->>'title', ''));
    item_provider := trim(coalesce(item->>'provider_name', ''));
    item_source_url := trim(coalesce(item->>'source_url', item->>'canonical_url', ''));
    item_external_id := trim(coalesce(item->>'external_id', ''));
    if item_title = '' or item_provider = '' or item_source_url = '' then
      rejected_count := rejected_count + 1;
      errors := errors || jsonb_build_array(jsonb_build_object('title', item_title, 'error', 'title, provider_name, and source_url are required'));
      continue;
    end if;
    if item_external_id = '' then item_external_id := encode(digest(lower(item_source_url || '|' || item_title), 'sha256'), 'hex'); end if;
    insert into public.opportunities (
      source_id, external_id, canonical_url, application_url, guidelines_url, title, provider_name,
      opportunity_type, summary, description, disciplines, eligible_applicant_types, eligible_countries,
      eligible_regions, career_stages, award_min, award_max, currency, application_fee, deadline_at,
      deadline_timezone, opens_at, recurring, remote_allowed, travel_supported, accommodation_supported,
      fiscal_sponsor_allowed, language_requirements, education_requirements, organization_status_requirements,
      previous_award_restrictions, required_materials, participation_format, locations, application_mode,
      status, verification_status, last_verified_at
    ) values (
      source_row.id, item_external_id, item_source_url, trim(coalesce(item->>'application_url', item_source_url)),
      trim(coalesce(item->>'guidelines_url', item_source_url)), item_title, item_provider,
      trim(coalesce(item->>'opportunity_type', 'other')), trim(coalesce(item->>'summary', '')),
      trim(coalesce(item->>'description', '')),
      coalesce(array(select jsonb_array_elements_text(coalesce(item->'disciplines', '[]'::jsonb))), '{}'),
      coalesce(array(select jsonb_array_elements_text(coalesce(item->'eligible_applicant_types', '[]'::jsonb))), '{}'),
      coalesce(array(select jsonb_array_elements_text(coalesce(item->'eligible_countries', '[]'::jsonb))), '{}'),
      coalesce(array(select jsonb_array_elements_text(coalesce(item->'eligible_regions', '[]'::jsonb))), '{}'),
      coalesce(array(select jsonb_array_elements_text(coalesce(item->'career_stages', '[]'::jsonb))), '{}'),
      nullif(item->>'award_min', '')::numeric, nullif(item->>'award_max', '')::numeric,
      nullif(upper(trim(item->>'currency')), ''), nullif(item->>'application_fee', '')::numeric,
      nullif(item->>'deadline_at', '')::timestamptz, trim(coalesce(item->>'deadline_timezone', '')),
      nullif(item->>'opens_at', '')::timestamptz, coalesce(nullif(item->>'recurring', '')::boolean, false),
      nullif(item->>'remote_allowed', '')::boolean, nullif(item->>'travel_supported', '')::boolean,
      nullif(item->>'accommodation_supported', '')::boolean, nullif(item->>'fiscal_sponsor_allowed', '')::boolean,
      coalesce(array(select jsonb_array_elements_text(coalesce(item->'language_requirements', '[]'::jsonb))), '{}'),
      coalesce(array(select jsonb_array_elements_text(coalesce(item->'education_requirements', '[]'::jsonb))), '{}'),
      coalesce(array(select jsonb_array_elements_text(coalesce(item->'organization_status_requirements', '[]'::jsonb))), '{}'),
      trim(coalesce(item->>'previous_award_restrictions', '')),
      coalesce(array(select jsonb_array_elements_text(coalesce(item->'required_materials', '[]'::jsonb))), '{}'),
      trim(coalesce(item->>'participation_format', 'other')),
      coalesce(array(select jsonb_array_elements_text(coalesce(item->'locations', '[]'::jsonb))), '{}'),
      'external', case when lower(coalesce(item->>'status', 'open')) in ('open','forecasted','upcoming') then lower(coalesce(item->>'status', 'open')) else 'draft' end,
      'source_attributed', now()
    )
    on conflict (source_id, external_id) do update set
      canonical_url = excluded.canonical_url, application_url = excluded.application_url,
      guidelines_url = excluded.guidelines_url, title = excluded.title, provider_name = excluded.provider_name,
      opportunity_type = excluded.opportunity_type, summary = excluded.summary, description = excluded.description,
      disciplines = excluded.disciplines, eligible_applicant_types = excluded.eligible_applicant_types,
      eligible_countries = excluded.eligible_countries, eligible_regions = excluded.eligible_regions,
      career_stages = excluded.career_stages, award_min = excluded.award_min, award_max = excluded.award_max,
      currency = excluded.currency, application_fee = excluded.application_fee, deadline_at = excluded.deadline_at,
      deadline_timezone = excluded.deadline_timezone, opens_at = excluded.opens_at, recurring = excluded.recurring,
      remote_allowed = excluded.remote_allowed, travel_supported = excluded.travel_supported,
      accommodation_supported = excluded.accommodation_supported, fiscal_sponsor_allowed = excluded.fiscal_sponsor_allowed,
      language_requirements = excluded.language_requirements, education_requirements = excluded.education_requirements,
      organization_status_requirements = excluded.organization_status_requirements,
      previous_award_restrictions = excluded.previous_award_restrictions, required_materials = excluded.required_materials,
      participation_format = excluded.participation_format, locations = excluded.locations, status = excluded.status,
      verification_status = excluded.verification_status, last_verified_at = excluded.last_verified_at, updated_at = now();
    imported_count := imported_count + 1;
  end loop;
  return jsonb_build_object('imported_count', imported_count, 'rejected_count', rejected_count, 'errors', errors);
end;
$$;
revoke all on function public.admin_import_opportunities(jsonb) from public, anon;
grant execute on function public.admin_import_opportunities(jsonb) to authenticated;

create or replace function public.approve_opportunity_submission(target_submission_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  submission_row public.institution_opportunity_submissions%rowtype;
  source_id_value uuid;
  opportunity_id_value uuid;
begin
  if not public.is_kleio_admin() then raise exception 'KLEIO administrator access is required'; end if;
  select * into submission_row from public.institution_opportunity_submissions where id = target_submission_id for update;
  if submission_row.id is null then raise exception 'Submission not found'; end if;
  select id into source_id_value from public.opportunity_sources where slug = 'provider-submission';
  insert into public.opportunities (
    source_id, external_id, canonical_url, application_url, guidelines_url, title, provider_name,
    opportunity_type, summary, description, disciplines, eligible_applicant_types, eligible_countries,
    eligible_regions, citizenship_requirements, residency_requirements, career_stages, age_min, age_max,
    award_min, award_max, currency, application_fee, deadline_at, deadline_timezone, opens_at, recurring,
    remote_allowed, travel_supported, accommodation_supported, fiscal_sponsor_allowed, language_requirements,
    education_requirements, organization_status_requirements, previous_award_restrictions, required_materials,
    participation_format, locations, application_mode, status, verification_status, last_verified_at
  ) values (
    source_id_value, submission_row.id::text, submission_row.source_url, submission_row.application_url,
    submission_row.guidelines_url, submission_row.title, submission_row.provider_name, submission_row.opportunity_type,
    submission_row.summary, submission_row.description,
    coalesce(array(select jsonb_array_elements_text(coalesce(submission_row.payload->'disciplines', '[]'::jsonb))), '{}'),
    coalesce(array(select jsonb_array_elements_text(coalesce(submission_row.payload->'eligible_applicant_types', '[]'::jsonb))), '{}'),
    coalesce(array(select jsonb_array_elements_text(coalesce(submission_row.payload->'eligible_countries', '[]'::jsonb))), '{}'),
    coalesce(array(select jsonb_array_elements_text(coalesce(submission_row.payload->'eligible_regions', '[]'::jsonb))), '{}'),
    coalesce(array(select jsonb_array_elements_text(coalesce(submission_row.payload->'citizenship_requirements', '[]'::jsonb))), '{}'),
    coalesce(array(select jsonb_array_elements_text(coalesce(submission_row.payload->'residency_requirements', '[]'::jsonb))), '{}'),
    coalesce(array(select jsonb_array_elements_text(coalesce(submission_row.payload->'career_stages', '[]'::jsonb))), '{}'),
    nullif(submission_row.payload->>'age_min', '')::integer, nullif(submission_row.payload->>'age_max', '')::integer,
    nullif(submission_row.payload->>'award_min', '')::numeric, nullif(submission_row.payload->>'award_max', '')::numeric,
    nullif(upper(trim(submission_row.payload->>'currency')), ''), nullif(submission_row.payload->>'application_fee', '')::numeric,
    submission_row.deadline_at, submission_row.deadline_timezone, nullif(submission_row.payload->>'opens_at', '')::timestamptz,
    coalesce(nullif(submission_row.payload->>'recurring', '')::boolean, false),
    nullif(submission_row.payload->>'remote_allowed', '')::boolean, nullif(submission_row.payload->>'travel_supported', '')::boolean,
    nullif(submission_row.payload->>'accommodation_supported', '')::boolean, nullif(submission_row.payload->>'fiscal_sponsor_allowed', '')::boolean,
    coalesce(array(select jsonb_array_elements_text(coalesce(submission_row.payload->'language_requirements', '[]'::jsonb))), '{}'),
    coalesce(array(select jsonb_array_elements_text(coalesce(submission_row.payload->'education_requirements', '[]'::jsonb))), '{}'),
    coalesce(array(select jsonb_array_elements_text(coalesce(submission_row.payload->'organization_status_requirements', '[]'::jsonb))), '{}'),
    trim(coalesce(submission_row.payload->>'previous_award_restrictions', '')),
    coalesce(array(select jsonb_array_elements_text(coalesce(submission_row.payload->'required_materials', '[]'::jsonb))), '{}'),
    trim(coalesce(submission_row.payload->>'participation_format', 'other')),
    coalesce(array(select jsonb_array_elements_text(coalesce(submission_row.payload->'locations', '[]'::jsonb))), '{}'),
    'external', 'open', case when submission_row.provider_verified then 'provider_verified' else 'kleio_reviewed' end, now()
  )
  on conflict (source_id, external_id) do update set
    canonical_url = excluded.canonical_url, application_url = excluded.application_url,
    guidelines_url = excluded.guidelines_url, title = excluded.title, provider_name = excluded.provider_name,
    opportunity_type = excluded.opportunity_type, summary = excluded.summary, description = excluded.description,
    disciplines = excluded.disciplines, eligible_applicant_types = excluded.eligible_applicant_types,
    eligible_countries = excluded.eligible_countries, eligible_regions = excluded.eligible_regions,
    citizenship_requirements = excluded.citizenship_requirements, residency_requirements = excluded.residency_requirements,
    career_stages = excluded.career_stages, age_min = excluded.age_min, age_max = excluded.age_max,
    award_min = excluded.award_min, award_max = excluded.award_max, currency = excluded.currency,
    application_fee = excluded.application_fee, deadline_at = excluded.deadline_at,
    deadline_timezone = excluded.deadline_timezone, opens_at = excluded.opens_at, recurring = excluded.recurring,
    remote_allowed = excluded.remote_allowed, travel_supported = excluded.travel_supported,
    accommodation_supported = excluded.accommodation_supported, fiscal_sponsor_allowed = excluded.fiscal_sponsor_allowed,
    language_requirements = excluded.language_requirements, education_requirements = excluded.education_requirements,
    organization_status_requirements = excluded.organization_status_requirements,
    previous_award_restrictions = excluded.previous_award_restrictions, required_materials = excluded.required_materials,
    participation_format = excluded.participation_format, locations = excluded.locations, status = excluded.status,
    verification_status = excluded.verification_status, last_verified_at = excluded.last_verified_at, updated_at = now()
  returning id into opportunity_id_value;
  update public.institution_opportunity_submissions
  set moderation_status = 'published', published_opportunity_id = opportunity_id_value,
      reviewer_user_id = (select auth.uid()), reviewed_at = now(), updated_at = now()
  where id = target_submission_id;
  return opportunity_id_value;
end;
$$;
revoke all on function public.approve_opportunity_submission(uuid) from public, anon;
grant execute on function public.approve_opportunity_submission(uuid) to authenticated;

create or replace function public.get_opportunity_sync_token()
returns text language sql stable security definer set search_path = ''
as $$ select decrypted_secret from vault.decrypted_secrets where name = 'kleio_opportunity_sync_token' limit 1; $$;
revoke all on function public.get_opportunity_sync_token() from public, anon, authenticated;
grant execute on function public.get_opportunity_sync_token() to service_role;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'kleio_opportunity_sync_token') then
    perform vault.create_secret(encode(gen_random_bytes(32), 'hex'), 'kleio_opportunity_sync_token');
  end if;
  if not exists (select 1 from vault.secrets where name = 'kleio_project_url') then
    perform vault.create_secret('https://trekynurdgxgtaaqqtyq.supabase.co', 'kleio_project_url');
  end if;
end;
$$;
commit;
