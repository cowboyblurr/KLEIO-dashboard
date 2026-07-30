-- Keep the public landing-page preview visually complete by selecting only
-- current, verified opportunities with approved official-source imagery.
-- The full member directory remains unaffected.

create or replace function public.get_public_opportunity_carousel(limit_count integer default 8)
returns table(
  id uuid,
  title text,
  provider_name text,
  opportunity_type text,
  summary text,
  deadline_at timestamptz,
  participation_format text,
  locations text[],
  remote_allowed boolean,
  award_min numeric,
  award_max numeric,
  currency text,
  funding_display_text text,
  application_fee numeric,
  application_fee_currency text,
  disciplines text[],
  verification_status text,
  last_verified_at timestamptz,
  created_at timestamptz,
  preview_image_url text,
  preview_image_path text,
  preview_image_alt_text text,
  source_name text
)
language sql
stable
security definer
set search_path = ''
as $function$
  with eligible as (
    select
      opportunity_row.*,
      source_row.name as source_name,
      row_number() over (
        partition by opportunity_row.opportunity_type
        order by
          coalesce(opportunity_row.last_verified_at, opportunity_row.updated_at, opportunity_row.created_at) desc,
          opportunity_row.deadline_at asc nulls last,
          opportunity_row.id
      ) as type_rank
    from public.opportunities opportunity_row
    join public.opportunity_sources source_row
      on source_row.id = opportunity_row.source_id
     and source_row.active
    where opportunity_row.status in ('open','upcoming','forecasted')
      and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
      and opportunity_row.duplicate_of is null
      and opportunity_row.verification_status in ('official_source','provider_verified','kleio_reviewed','source_attributed')
      and opportunity_row.lifecycle_status in ('published','updated','closing_soon','verified')
      and nullif(btrim(opportunity_row.title), '') is not null
      and nullif(btrim(opportunity_row.provider_name), '') is not null
      and (
        nullif(btrim(opportunity_row.canonical_url), '') is not null
        or nullif(btrim(opportunity_row.guidelines_url), '') is not null
      )
      and nullif(btrim(opportunity_row.preview_image_url), '') is not null
      and opportunity_row.preview_image_rights_status = 'official_publication'
      and opportunity_row.preview_image_origin = 'official_source'
  ),
  diversified as (
    select *
    from eligible
    where type_rank <= 2
    order by
      coalesce(last_verified_at, updated_at, created_at) desc,
      deadline_at asc nulls last,
      id
  )
  select
    diversified.id,
    diversified.title,
    diversified.provider_name,
    diversified.opportunity_type,
    diversified.summary,
    diversified.deadline_at,
    diversified.participation_format,
    diversified.locations,
    diversified.remote_allowed,
    diversified.award_min,
    diversified.award_max,
    diversified.currency,
    diversified.funding_display_text,
    diversified.application_fee,
    diversified.application_fee_currency,
    diversified.disciplines,
    diversified.verification_status,
    diversified.last_verified_at,
    diversified.created_at,
    diversified.preview_image_url,
    diversified.preview_image_path,
    diversified.preview_image_alt_text,
    diversified.source_name
  from diversified
  limit greatest(1, least(coalesce(limit_count, 8), 12));
$function$;

revoke all on function public.get_public_opportunity_carousel(integer) from public;
revoke all on function public.get_public_opportunity_carousel(integer) from anon;
revoke all on function public.get_public_opportunity_carousel(integer) from authenticated;
grant execute on function public.get_public_opportunity_carousel(integer) to anon, authenticated, service_role;
