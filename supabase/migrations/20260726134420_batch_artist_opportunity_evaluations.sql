begin;

create or replace function public.evaluate_my_opportunities(target_opportunity_ids uuid[])
returns setof public.artist_opportunity_evaluations
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_id uuid;
  bounded_ids uuid[];
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  bounded_ids := array(
    select distinct value
    from unnest(coalesce(target_opportunity_ids, '{}'::uuid[])) value
    limit 50
  );

  foreach target_id in array bounded_ids loop
    return next public.evaluate_my_opportunity(target_id);
  end loop;

  return;
end;
$$;

grant execute on function public.evaluate_my_opportunities(uuid[]) to authenticated;
revoke execute on function public.evaluate_my_opportunities(uuid[]) from public, anon;

comment on function public.evaluate_my_opportunities(uuid[]) is
  'Evaluates up to 50 visible verified opportunities for the authenticated artist using the policy-aware eligibility-first evaluator.';

commit;
