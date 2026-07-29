-- Internal search diagnostics should not be exposed as a public PostgREST RPC.

create or replace function private.diagnose_opportunity_search(input_query text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not private.is_kleio_admin() then
    raise exception 'KLEIO administrator access required';
  end if;

  select jsonb_build_object(
    'interpretation', public.interpret_opportunity_search_query(input_query),
    'visible_results', coalesce((
      select jsonb_agg(jsonb_build_object(
        'external_id', r.external_id,
        'title', r.title,
        'opportunity_type', r.opportunity_type,
        'disciplines', r.disciplines,
        'status', r.status,
        'verification_status', r.verification_status
      ))
      from public.search_opportunities_v2(
        input_query, null, null, null, null, null, null, null,
        null, null, null, false, false, false, false, 100, 0
      ) r
    ), '[]'::jsonb),
    'excluded_related_records', coalesce((
      select jsonb_agg(jsonb_build_object(
        'external_id', o.external_id,
        'title', o.title,
        'status', o.status,
        'verification_status', o.verification_status,
        'exclusion_reason', case
          when o.status not in ('open','forecasted','upcoming') then 'inactive_status'
          when o.deadline_at is not null and o.deadline_at < now() then 'deadline_passed'
          when o.duplicate_of is not null then 'duplicate'
          when o.verification_status in ('needs_review','expired','rejected') then 'verification_hold'
          else 'not_ranked_as_relevant'
        end
      ))
      from public.opportunities o
      where exists (
        select 1 from unnest(coalesce(o.disciplines, '{}'::text[])) d
        where public.normalize_opportunity_search_text(d) = any(
          coalesce(array(
            select jsonb_array_elements_text(
              public.interpret_opportunity_search_query(input_query)->'canonical_disciplines'
            )
          ), '{}'::text[])
        )
      )
      and not exists (
        select 1
        from public.search_opportunities_v2(
          input_query, null, null, null, null, null, null, null,
          null, null, null, false, false, false, false, 100, 0
        ) r
        where r.id = o.id
      )
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function private.diagnose_opportunity_search(text) from public, anon, authenticated;
drop function if exists public.diagnose_opportunity_search(text);
