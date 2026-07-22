-- 003_internal_opportunity_sync_and_search
begin;
create or replace function public.sync_open_call_to_opportunity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_source_id uuid;
  target_opportunity_id uuid;
  material text;
begin
  select id into target_source_id from public.opportunity_sources where slug = 'kleio-institution';
  insert into public.opportunities (
    source_id, external_id, internal_call_id, title, provider_name,
    opportunity_type, summary, description, disciplines,
    eligible_applicant_types, required_materials, participation_format,
    locations, application_mode, status, verification_status,
    opens_at, deadline_at, source_published_at, source_updated_at,
    last_verified_at
  ) values (
    target_source_id, new.id::text, new.id, new.title, new.institution_name,
    coalesce(nullif(lower(new.opportunity_type), ''), 'open_call'), new.summary, new.description,
    '{}', '{}', new.required_materials, coalesce(nullif(new.participation_format, ''), 'other'),
    case when nullif(new.location, '') is null then '{}'::text[] else array[new.location] end,
    'internal', case when new.status = 'open'::public.open_call_status then 'open' else 'archived' end,
    'provider_published', new.opens_at::timestamptz, new.deadline_at::timestamptz,
    new.published_at, new.updated_at, coalesce(new.published_at, new.updated_at)
  )
  on conflict (source_id, external_id) do update set
    internal_call_id = excluded.internal_call_id, title = excluded.title, provider_name = excluded.provider_name,
    opportunity_type = excluded.opportunity_type, summary = excluded.summary, description = excluded.description,
    required_materials = excluded.required_materials, participation_format = excluded.participation_format,
    locations = excluded.locations, application_mode = excluded.application_mode, status = excluded.status,
    verification_status = excluded.verification_status, opens_at = excluded.opens_at, deadline_at = excluded.deadline_at,
    source_published_at = excluded.source_published_at, source_updated_at = excluded.source_updated_at,
    last_verified_at = excluded.last_verified_at, updated_at = now()
  returning id into target_opportunity_id;

  delete from public.opportunity_requirements where opportunity_id = target_opportunity_id and extraction_method = 'provider_entered';
  foreach material in array coalesce(new.required_materials, '{}') loop
    insert into public.opportunity_requirements (
      opportunity_id, material_key, label, required, source_text,
      extraction_method, verification_status, last_verified_at
    ) values (
      target_opportunity_id, public.normalize_material_key(material), material, true, material,
      'provider_entered', 'confirmed', coalesce(new.published_at, new.updated_at)
    )
    on conflict (opportunity_id, material_key) do update set
      label = excluded.label, source_text = excluded.source_text,
      verification_status = excluded.verification_status, updated_at = now();
  end loop;
  return new;
end;
$$;
revoke all on function public.sync_open_call_to_opportunity() from public, anon, authenticated;

drop trigger if exists open_calls_sync_opportunity on public.open_calls;
create trigger open_calls_sync_opportunity
after insert or update of title, opportunity_type, summary, description, location, participation_format, opens_at, deadline_at, eligibility, required_materials, status, published_at, institution_name, updated_at
on public.open_calls for each row execute function public.sync_open_call_to_opportunity();

insert into public.opportunities (
  source_id, external_id, internal_call_id, title, provider_name, opportunity_type, summary, description,
  required_materials, participation_format, locations, application_mode, status, verification_status,
  opens_at, deadline_at, source_published_at, source_updated_at, last_verified_at
)
select source_row.id, call_row.id::text, call_row.id, call_row.title, call_row.institution_name,
  coalesce(nullif(lower(call_row.opportunity_type), ''), 'open_call'), call_row.summary, call_row.description,
  call_row.required_materials, coalesce(nullif(call_row.participation_format, ''), 'other'),
  case when nullif(call_row.location, '') is null then '{}'::text[] else array[call_row.location] end,
  'internal', case when call_row.status = 'open'::public.open_call_status then 'open' else 'archived' end,
  'provider_published', call_row.opens_at::timestamptz, call_row.deadline_at::timestamptz,
  call_row.published_at, call_row.updated_at, coalesce(call_row.published_at, call_row.updated_at)
from public.open_calls call_row
cross join public.opportunity_sources source_row
where source_row.slug = 'kleio-institution'
on conflict (source_id, external_id) do update set
  internal_call_id = excluded.internal_call_id, title = excluded.title, provider_name = excluded.provider_name,
  opportunity_type = excluded.opportunity_type, summary = excluded.summary, description = excluded.description,
  required_materials = excluded.required_materials, participation_format = excluded.participation_format,
  locations = excluded.locations, application_mode = excluded.application_mode, status = excluded.status,
  verification_status = excluded.verification_status, opens_at = excluded.opens_at, deadline_at = excluded.deadline_at,
  source_published_at = excluded.source_published_at, source_updated_at = excluded.source_updated_at,
  last_verified_at = excluded.last_verified_at, updated_at = now();

insert into public.opportunity_requirements (
  opportunity_id, material_key, label, required, source_text, extraction_method, verification_status, last_verified_at
)
select opportunity_row.id, public.normalize_material_key(material), material, true, material,
  'provider_entered', 'confirmed', opportunity_row.last_verified_at
from public.opportunities opportunity_row
cross join lateral unnest(opportunity_row.required_materials) material
where opportunity_row.internal_call_id is not null
on conflict (opportunity_id, material_key) do update set
  label = excluded.label, source_text = excluded.source_text,
  verification_status = excluded.verification_status, updated_at = now();

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
language sql stable security invoker set search_path = ''
as $$
  select opportunity_row.*
  from public.opportunities opportunity_row
  join public.opportunity_sources source_row on source_row.id = opportunity_row.source_id
  where opportunity_row.status in ('open','forecasted','upcoming')
    and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
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
      or cardinality(opportunity_row.eligible_countries) = 0
      or lower(trim(eligible_country)) = any(select lower(country_value) from unnest(opportunity_row.eligible_countries) country_value)
    )
    and (participation_formats is null or cardinality(participation_formats) = 0 or opportunity_row.participation_format = any(participation_formats))
    and (not no_fee_only or coalesce(opportunity_row.application_fee, 0) = 0)
    and (not external_only or opportunity_row.application_mode = 'external')
  order by
    case when nullif(trim(search_query), '') is null then 0 else ts_rank(opportunity_row.search_document, websearch_to_tsquery('simple', trim(search_query))) end desc,
    opportunity_row.deadline_at asc nulls last,
    opportunity_row.title asc
  limit greatest(1, least(coalesce(limit_count, 50), 100))
  offset greatest(coalesce(offset_count, 0), 0);
$$;
grant execute on function public.search_opportunities(text,text[],text[],text[],text,text[],boolean,boolean,integer,integer) to anon, authenticated;
commit;
