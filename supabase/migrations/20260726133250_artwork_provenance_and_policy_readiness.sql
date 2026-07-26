begin;

alter table public.portfolio_works
  add column if not exists creation_ai_status text not null default 'unknown',
  add column if not exists ai_disclosure_notes text not null default '';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'portfolio_works_creation_ai_status_check'
      and conrelid = 'public.portfolio_works'::regclass
  ) then
    alter table public.portfolio_works
      add constraint portfolio_works_creation_ai_status_check
      check (creation_ai_status in (
        'artist_confirmed_non_ai','not_ai_generated','ai_assisted','ai_generated','unknown'
      ));
  end if;
end $$;

comment on column public.portfolio_works.creation_ai_status is
  'Artist-controlled work-creation provenance. Never infer this value from media or profile data.';

comment on column public.opportunities.artwork_ai_policy is
  'Policy governing submitted artwork, separate from administrative application assistance.';

comment on column public.opportunities.application_assistance_policy is
  'Policy governing administrative or generative assistance used to prepare the application.';

do $$
begin
  if to_regprocedure('public.evaluate_my_opportunity_base(uuid)') is null
     and to_regprocedure('public.evaluate_my_opportunity(uuid)') is not null then
    alter function public.evaluate_my_opportunity(uuid) rename to evaluate_my_opportunity_base;
  end if;
end $$;

create or replace function public.evaluate_my_opportunity(target_opportunity_id uuid)
returns public.artist_opportunity_evaluations
language plpgsql
security invoker
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

  base_evaluation := public.evaluate_my_opportunity_base(target_opportunity_id);

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
revoke execute on function public.evaluate_my_opportunity(uuid) from anon;
revoke execute on function public.evaluate_my_opportunity_base(uuid) from anon;
grant execute on function public.evaluate_my_opportunity_base(uuid) to authenticated;

create or replace function public.check_my_work_policy_compatibility(
  target_opportunity_id uuid,
  target_work_ids uuid[]
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  opportunity_row public.opportunities%rowtype;
  selected_count integer := 0;
  owned_count integer := 0;
  blocked_ids uuid[] := '{}';
  confirmation_ids uuid[] := '{}';
  compatible_ids uuid[] := '{}';
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if target_work_ids is null or cardinality(target_work_ids) = 0 then
    return jsonb_build_object(
      'status','missing_selection',
      'compatible',false,
      'reason','Select at least one portfolio work.'
    );
  end if;

  select * into opportunity_row
  from public.opportunities
  where id = target_opportunity_id
    and status in ('open','upcoming','forecasted')
    and verification_status not in ('unreviewed','needs_review','expired');

  if opportunity_row.id is null then
    raise exception 'Opportunity is unavailable or not verified' using errcode = '22023';
  end if;

  selected_count := cardinality(target_work_ids);

  select count(*) into owned_count
  from public.portfolio_works
  where artist_user_id = caller_id and id = any(target_work_ids);

  if owned_count <> selected_count then
    raise exception 'One or more selected works do not belong to the authenticated artist' using errcode = '42501';
  end if;

  if opportunity_row.artwork_ai_policy = 'prohibited' then
    select
      coalesce(array_agg(id) filter (where creation_ai_status in ('ai_generated','ai_assisted')), '{}'),
      coalesce(array_agg(id) filter (where creation_ai_status = 'unknown'), '{}'),
      coalesce(array_agg(id) filter (where creation_ai_status in ('artist_confirmed_non_ai','not_ai_generated')), '{}')
    into blocked_ids, confirmation_ids, compatible_ids
    from public.portfolio_works
    where artist_user_id = caller_id and id = any(target_work_ids);
  else
    select coalesce(array_agg(id), '{}') into compatible_ids
    from public.portfolio_works
    where artist_user_id = caller_id and id = any(target_work_ids);
  end if;

  return jsonb_build_object(
    'artwork_ai_policy', opportunity_row.artwork_ai_policy,
    'application_assistance_policy', opportunity_row.application_assistance_policy,
    'compatible', cardinality(blocked_ids) = 0 and cardinality(confirmation_ids) = 0,
    'status', case
      when cardinality(blocked_ids) > 0 then 'blocked'
      when cardinality(confirmation_ids) > 0 then 'artist_confirmation_required'
      else 'compatible'
    end,
    'blocked_work_ids', blocked_ids,
    'confirmation_required_work_ids', confirmation_ids,
    'compatible_work_ids', compatible_ids,
    'source_url', opportunity_row.policy_source_url
  );
end;
$$;

grant execute on function public.check_my_work_policy_compatibility(uuid, uuid[]) to authenticated;
revoke execute on function public.check_my_work_policy_compatibility(uuid, uuid[]) from anon;

update public.opportunities
set last_verified_at = now(),
    policy_last_verified_at = now(),
    funding_verified_at = now(),
    updated_at = now()
where external_id in ('photovogue-brave-new-visions-2026','photovogue-mena-panorama-2026');

update public.opportunity_eligibility_rules
set last_verified_at = now(), updated_at = now()
where opportunity_id in (
  select id from public.opportunities
  where external_id in ('photovogue-brave-new-visions-2026','photovogue-mena-panorama-2026')
);

update public.opportunity_requirements
set last_verified_at = now(), retrieved_at = coalesce(retrieved_at, now()), updated_at = now()
where opportunity_id in (
  select id from public.opportunities
  where external_id in ('photovogue-brave-new-visions-2026','photovogue-mena-panorama-2026')
);

commit;
