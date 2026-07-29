begin;

alter function public.evaluate_my_opportunity_base(uuid) set schema private;

revoke all on function private.evaluate_my_opportunity_base(uuid) from public, anon, authenticated;
revoke all on schema private from anon, authenticated;

create or replace function public.evaluate_my_opportunity(target_opportunity_id uuid)
returns public.artist_opportunity_evaluations
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  base_evaluation public.artist_opportunity_evaluations%rowtype;
  opportunity_row public.opportunities%rowtype;
  confirmed_compatible_count integer := 0;
  unknown_provenance_count integer := 0;
  prohibited_count integer := 0;
  revised_readiness jsonb;
  revised_effort jsonb;
  revised_explanation jsonb;
  revised_missing_count integer;
  policy_item jsonb;
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.artist_profiles where user_id = caller_id
  ) then
    raise exception 'An artist Creative Passport is required' using errcode = '42501';
  end if;

  base_evaluation := private.evaluate_my_opportunity_base(target_opportunity_id);

  select * into opportunity_row
  from public.opportunities
  where id = target_opportunity_id;

  if opportunity_row.artwork_ai_policy = 'prohibited' then
    select
      count(*) filter (where creation_ai_status in ('artist_confirmed_non_ai','not_ai_generated')),
      count(*) filter (where creation_ai_status = 'unknown'),
      count(*) filter (where creation_ai_status in ('ai_generated','ai_assisted'))
    into confirmed_compatible_count, unknown_provenance_count, prohibited_count
    from public.portfolio_works
    where artist_user_id = caller_id;

    policy_item := jsonb_build_object(
      'material_key', 'artwork_ai_policy',
      'label', 'Artwork creation policy',
      'required', true,
      'status', case
        when confirmed_compatible_count > 0 then 'ready'
        when unknown_provenance_count > 0 then 'artist_confirmation_required'
        else 'missing'
      end,
      'policy', opportunity_row.artwork_ai_policy,
      'confirmed_compatible_work_count', confirmed_compatible_count,
      'unknown_provenance_work_count', unknown_provenance_count,
      'prohibited_or_restricted_work_count', prohibited_count,
      'source_url', opportunity_row.policy_source_url,
      'explanation', case
        when confirmed_compatible_count > 0 then 'At least one work is explicitly marked as not AI-generated. Final selected works must still be reviewed.'
        when unknown_provenance_count > 0 then 'Confirm the creation provenance of at least one selected work before preparation can be complete.'
        else 'Add a compatible non-AI-generated work before preparing this application.'
      end
    );

    revised_missing_count := coalesce((base_evaluation.readiness ->> 'missing_required_count')::integer, 0)
      + case when confirmed_compatible_count > 0 then 0 else 1 end;

    revised_readiness := jsonb_set(
      jsonb_set(
        base_evaluation.readiness,
        '{items}',
        coalesce(base_evaluation.readiness -> 'items', '[]'::jsonb) || jsonb_build_array(policy_item),
        true
      ),
      '{missing_required_count}',
      to_jsonb(revised_missing_count),
      true
    ) || jsonb_build_object(
      'policy_compatible_work_count', confirmed_compatible_count,
      'work_provenance_confirmation_required', confirmed_compatible_count = 0 and unknown_provenance_count > 0
    );

    revised_effort := base_evaluation.effort || jsonb_build_object(
      'level', case
        when revised_missing_count >= 3 then 'significant'
        when revised_missing_count >= 1 then 'moderate'
        else 'low'
      end,
      'missing_required_count', revised_missing_count
    );

    revised_explanation := jsonb_set(
      base_evaluation.explanation,
      '{artwork_policy}',
      jsonb_build_object(
        'artwork_ai_policy', opportunity_row.artwork_ai_policy,
        'application_assistance_policy', opportunity_row.application_assistance_policy,
        'status', policy_item ->> 'status',
        'reason', policy_item ->> 'explanation',
        'source_url', opportunity_row.policy_source_url
      ),
      true
    );

    update public.artist_opportunity_evaluations
    set readiness = revised_readiness,
        effort = revised_effort,
        explanation = revised_explanation,
        updated_at = now()
    where id = base_evaluation.id
    returning * into base_evaluation;
  end if;

  return base_evaluation;
end;
$$;

grant execute on function public.evaluate_my_opportunity(uuid) to authenticated;
revoke execute on function public.evaluate_my_opportunity(uuid) from public, anon;

commit;
