begin;

-- Opportunity verification, policy, and lifecycle fields
alter table public.opportunities
  add column if not exists discovered_at timestamptz,
  add column if not exists verification_confidence numeric,
  add column if not exists verified_by text not null default '',
  add column if not exists verification_method text not null default '',
  add column if not exists reverify_at timestamptz,
  add column if not exists lifecycle_status text not null default 'discovered',
  add column if not exists deadline_kind text not null default 'fixed',
  add column if not exists expected_decision_at timestamptz,
  add column if not exists program_start_at timestamptz,
  add column if not exists program_end_at timestamptz,
  add column if not exists contact_email text not null default '',
  add column if not exists artwork_ai_policy text not null default 'not_stated',
  add column if not exists application_assistance_policy text not null default 'not_stated',
  add column if not exists policy_source_url text not null default '',
  add column if not exists policy_last_verified_at timestamptz;

update public.opportunities
set discovered_at = coalesce(discovered_at, created_at),
    reverify_at = coalesce(
      reverify_at,
      case
        when last_verified_at is not null and deadline_at is not null
          then least(last_verified_at + interval '30 days', deadline_at - interval '7 days')
        when last_verified_at is not null then last_verified_at + interval '30 days'
        else created_at + interval '14 days'
      end
    ),
    lifecycle_status = case
      when status = 'archived' then 'archived'
      when status in ('closed', 'expired') then 'closed'
      when verification_status = 'needs_review' then 'needs_verification'
      when status in ('open', 'upcoming', 'forecasted') then 'published'
      else 'discovered'
    end
where discovered_at is null
   or reverify_at is null
   or lifecycle_status = 'discovered';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'opportunities_verification_confidence_check'
      and conrelid = 'public.opportunities'::regclass
  ) then
    alter table public.opportunities
      add constraint opportunities_verification_confidence_check
      check (verification_confidence is null or (verification_confidence >= 0 and verification_confidence <= 1));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'opportunities_lifecycle_status_check'
      and conrelid = 'public.opportunities'::regclass
  ) then
    alter table public.opportunities
      add constraint opportunities_lifecycle_status_check
      check (lifecycle_status in (
        'discovered','parsing','needs_verification','verified','published','updated',
        'closing_soon','closed','archived','source_unavailable','verification_expired'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'opportunities_deadline_kind_check'
      and conrelid = 'public.opportunities'::regclass
  ) then
    alter table public.opportunities
      add constraint opportunities_deadline_kind_check
      check (deadline_kind in ('fixed','rolling','recurring','not_stated'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'opportunities_artwork_ai_policy_check'
      and conrelid = 'public.opportunities'::regclass
  ) then
    alter table public.opportunities
      add constraint opportunities_artwork_ai_policy_check
      check (artwork_ai_policy in ('allowed','prohibited','restricted','disclosure_required','unclear','not_stated'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'opportunities_application_assistance_policy_check'
      and conrelid = 'public.opportunities'::regclass
  ) then
    alter table public.opportunities
      add constraint opportunities_application_assistance_policy_check
      check (application_assistance_policy in ('allowed','prohibited','restricted','disclosure_required','unclear','not_stated'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'opportunities_policy_source_url_https_check'
      and conrelid = 'public.opportunities'::regclass
  ) then
    alter table public.opportunities
      add constraint opportunities_policy_source_url_https_check
      check (policy_source_url = '' or policy_source_url ~ '^https://');
  end if;
end $$;

create index if not exists opportunities_reverify_at_idx
  on public.opportunities (reverify_at)
  where lifecycle_status in ('published','updated','closing_soon','verified');

create index if not exists opportunities_policy_idx
  on public.opportunities (artwork_ai_policy, application_assistance_policy);

-- Private reusable Creative Passport materials
create table if not exists public.artist_materials (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  material_type text not null,
  title text not null default '',
  body_text text not null default '',
  file_path text not null default '',
  external_url text not null default '',
  visibility text not null default 'private',
  version_number integer not null default 1,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artist_materials_type_check check (material_type in (
    'cv','biography','artist_statement','proposal','budget','timeline','reference',
    'letter','identification','tax_record','video','audio','supporting_document',
    'reusable_answer','project_description','other'
  )),
  constraint artist_materials_visibility_check check (visibility in ('private','application_only','public')),
  constraint artist_materials_version_check check (version_number > 0),
  constraint artist_materials_external_url_https_check check (external_url = '' or external_url ~ '^https://'),
  constraint artist_materials_content_check check (
    length(trim(body_text)) > 0 or length(trim(file_path)) > 0 or length(trim(external_url)) > 0
  )
);

create index if not exists artist_materials_owner_type_idx
  on public.artist_materials (artist_user_id, material_type, is_active);

alter table public.artist_materials enable row level security;

drop policy if exists artist_materials_manage_own on public.artist_materials;
create policy artist_materials_manage_own
  on public.artist_materials
  for all
  to authenticated
  using ((select auth.uid()) = artist_user_id)
  with check ((select auth.uid()) = artist_user_id);

grant select, insert, update, delete on public.artist_materials to authenticated;
revoke all on public.artist_materials from anon;

drop trigger if exists artist_materials_set_updated_at on public.artist_materials;
create trigger artist_materials_set_updated_at
before update on public.artist_materials
for each row execute function public.set_updated_at();

-- Durable artist activation milestones
create table if not exists public.artist_activation_status (
  artist_user_id uuid primary key references auth.users(id) on delete cascade,
  account_created boolean not null default false,
  onboarding_completed boolean not null default false,
  core_passport_completed boolean not null default false,
  identity_presentation_completed boolean not null default false,
  three_works_added boolean not null default false,
  reusable_material_added boolean not null default false,
  opportunity_action_completed boolean not null default false,
  activated boolean not null default false,
  completion_details jsonb not null default '{}'::jsonb,
  activated_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.artist_activation_status enable row level security;

drop policy if exists artist_activation_status_read_own on public.artist_activation_status;
create policy artist_activation_status_read_own
  on public.artist_activation_status
  for select
  to authenticated
  using ((select auth.uid()) = artist_user_id);

grant select on public.artist_activation_status to authenticated;
revoke insert, update, delete on public.artist_activation_status from authenticated, anon;

create or replace function private.refresh_artist_activation_state(target_artist_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_row public.profiles%rowtype;
  artist_row public.artist_profiles%rowtype;
  work_count integer := 0;
  material_count integer := 0;
  opportunity_action_count integer := 0;
  has_account boolean := false;
  has_onboarding boolean := false;
  has_core_passport boolean := false;
  has_identity boolean := false;
  has_three_works boolean := false;
  has_material boolean := false;
  has_opportunity_action boolean := false;
  is_activated boolean := false;
  detail jsonb;
begin
  if target_artist_user_id is null then
    return;
  end if;

  select * into profile_row from public.profiles where id = target_artist_user_id;
  select * into artist_row from public.artist_profiles where user_id = target_artist_user_id;

  if profile_row.id is null and artist_row.user_id is null then
    delete from public.artist_activation_status where artist_user_id = target_artist_user_id;
    return;
  end if;

  select count(*) into work_count
  from public.portfolio_works
  where artist_user_id = target_artist_user_id;

  select count(*) into material_count
  from public.artist_materials
  where artist_user_id = target_artist_user_id
    and is_active
    and (
      length(trim(body_text)) > 0
      or length(trim(file_path)) > 0
      or length(trim(external_url)) > 0
    );

  select
    (select count(*) from public.saved_opportunities where artist_user_id = target_artist_user_id)
    + (select count(*) from public.artist_opportunity_tracking where artist_user_id = target_artist_user_id)
    + (select count(*) from public.application_packages where artist_user_id = target_artist_user_id)
  into opportunity_action_count;

  has_account := profile_row.id is not null;
  has_onboarding := coalesce(profile_row.onboarding_completed, false);
  has_core_passport := artist_row.user_id is not null
    and length(trim(artist_row.professional_name)) > 0
    and (length(trim(artist_row.location)) > 0 or artist_row.country_of_residence is not null)
    and length(trim(artist_row.bio)) > 0
    and length(trim(artist_row.artist_statement)) > 0
    and (cardinality(artist_row.disciplines) > 0 or cardinality(artist_row.mediums) > 0);
  has_identity := artist_row.user_id is not null
    and (
      length(trim(artist_row.profile_image_path)) > 0
      or length(trim(artist_row.professional_name)) > 0
    );
  has_three_works := work_count >= 3;
  has_material := material_count > 0 or coalesce(artist_row.cv_file_path, '') <> '';
  has_opportunity_action := opportunity_action_count > 0;
  is_activated := has_account and has_onboarding and has_core_passport and has_identity
    and has_three_works and has_material and has_opportunity_action;

  detail := jsonb_build_object(
    'work_count', work_count,
    'reusable_material_count', material_count,
    'opportunity_action_count', opportunity_action_count,
    'next_missing', jsonb_strip_nulls(jsonb_build_object(
      'onboarding', case when not has_onboarding then 'Complete onboarding so KLEIO can use your account context.' end,
      'creative_passport', case when not has_core_passport then 'Complete your professional name, location, biography, statement, and practice fields.' end,
      'identity_presentation', case when not has_identity then 'Add a professional name or profile image.' end,
      'portfolio', case when not has_three_works then format('Add %s more portfolio work(s).', greatest(3 - work_count, 0)) end,
      'reusable_material', case when not has_material then 'Add a CV or another reusable application material.' end,
      'opportunity_action', case when not has_opportunity_action then 'Save, prepare, track, or intentionally dismiss an eligible opportunity.' end
    ))
  );

  insert into public.artist_activation_status (
    artist_user_id, account_created, onboarding_completed, core_passport_completed,
    identity_presentation_completed, three_works_added, reusable_material_added,
    opportunity_action_completed, activated, completion_details, activated_at, updated_at
  ) values (
    target_artist_user_id, has_account, has_onboarding, has_core_passport,
    has_identity, has_three_works, has_material, has_opportunity_action,
    is_activated, detail, case when is_activated then now() else null end, now()
  )
  on conflict (artist_user_id) do update
  set account_created = excluded.account_created,
      onboarding_completed = excluded.onboarding_completed,
      core_passport_completed = excluded.core_passport_completed,
      identity_presentation_completed = excluded.identity_presentation_completed,
      three_works_added = excluded.three_works_added,
      reusable_material_added = excluded.reusable_material_added,
      opportunity_action_completed = excluded.opportunity_action_completed,
      activated = excluded.activated,
      completion_details = excluded.completion_details,
      activated_at = case
        when excluded.activated and public.artist_activation_status.activated_at is null then now()
        when not excluded.activated then null
        else public.artist_activation_status.activated_at
      end,
      updated_at = now();
end;
$$;

revoke all on function private.refresh_artist_activation_state(uuid) from public, anon, authenticated;
grant execute on function private.refresh_artist_activation_state(uuid) to service_role;

create or replace function private.refresh_artist_activation_from_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
begin
  if tg_table_name = 'profiles' then
    target_user_id := case when tg_op = 'DELETE' then old.id else new.id end;
  elsif tg_table_name = 'artist_profiles' then
    target_user_id := case when tg_op = 'DELETE' then old.user_id else new.user_id end;
  else
    target_user_id := case when tg_op = 'DELETE' then old.artist_user_id else new.artist_user_id end;
  end if;

  perform private.refresh_artist_activation_state(target_user_id);
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.refresh_artist_activation_from_row() from public, anon, authenticated;

do $$
declare
  target_table text;
  trigger_name text;
begin
  foreach target_table in array array[
    'profiles','artist_profiles','portfolio_works','artist_materials',
    'saved_opportunities','artist_opportunity_tracking','application_packages'
  ] loop
    trigger_name := 'refresh_artist_activation_' || target_table;
    execute format('drop trigger if exists %I on public.%I', trigger_name, target_table);
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function private.refresh_artist_activation_from_row()',
      trigger_name, target_table
    );
  end loop;
end $$;

select private.refresh_artist_activation_state(user_id)
from public.artist_profiles;

-- Explainable eligibility-first matching model
alter table public.artist_opportunity_evaluations
  add column if not exists creative_fit jsonb not null default '{}'::jsonb,
  add column if not exists effort jsonb not null default '{}'::jsonb,
  add column if not exists strategic_value jsonb not null default '{}'::jsonb,
  add column if not exists explanation jsonb not null default '{}'::jsonb,
  add column if not exists deadline_status text not null default 'unknown',
  add column if not exists source_version_id uuid references public.opportunity_source_versions(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'artist_opportunity_evaluations_deadline_status_check'
      and conrelid = 'public.artist_opportunity_evaluations'::regclass
  ) then
    alter table public.artist_opportunity_evaluations
      add constraint artist_opportunity_evaluations_deadline_status_check
      check (deadline_status in ('open','closing_soon','expired','rolling','unknown'));
  end if;
end $$;

create index if not exists artist_opportunity_evaluations_status_idx
  on public.artist_opportunity_evaluations (artist_user_id, eligibility_status, evaluated_at desc);

drop trigger if exists artist_opportunity_evaluations_set_updated_at on public.artist_opportunity_evaluations;
create trigger artist_opportunity_evaluations_set_updated_at
before update on public.artist_opportunity_evaluations
for each row execute function public.set_updated_at();

create or replace function public.evaluate_my_opportunity(target_opportunity_id uuid)
returns public.artist_opportunity_evaluations
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  artist_row public.artist_profiles%rowtype;
  opportunity_row public.opportunities%rowtype;
  rule_row public.opportunity_eligibility_rules%rowtype;
  requirement_row public.opportunity_requirements%rowtype;
  evaluation_row public.artist_opportunity_evaluations%rowtype;
  rule_values text[];
  rule_result text;
  failed_rules integer := 0;
  unknown_rules integer := 0;
  total_required_rules integer := 0;
  matched_creative_terms text[] := '{}';
  creative_match_count integer := 0;
  readiness_items jsonb := '[]'::jsonb;
  rule_results jsonb := '[]'::jsonb;
  ready_count integer := 0;
  missing_required_count integer := 0;
  portfolio_count integer := 0;
  requirement_ready boolean;
  days_remaining integer;
  computed_eligibility text;
  computed_relevance text;
  computed_deadline_status text;
  effort_level text;
  current_source_version_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into artist_row
  from public.artist_profiles
  where user_id = caller_id;

  if artist_row.user_id is null then
    raise exception 'An artist Creative Passport is required' using errcode = '42501';
  end if;

  select * into opportunity_row
  from public.opportunities
  where id = target_opportunity_id
    and status in ('open','upcoming','forecasted')
    and verification_status not in ('unreviewed','needs_review','expired');

  if opportunity_row.id is null then
    raise exception 'Opportunity is unavailable or not verified' using errcode = '22023';
  end if;

  select count(*) into portfolio_count
  from public.portfolio_works
  where artist_user_id = caller_id;

  if opportunity_row.deadline_at is null then
    computed_deadline_status := case when opportunity_row.deadline_kind = 'rolling' then 'rolling' else 'unknown' end;
    days_remaining := null;
  else
    days_remaining := floor(extract(epoch from (opportunity_row.deadline_at - now())) / 86400)::integer;
    computed_deadline_status := case
      when opportunity_row.deadline_at <= now() then 'expired'
      when opportunity_row.deadline_at <= now() + interval '7 days' then 'closing_soon'
      else 'open'
    end;
  end if;

  if computed_deadline_status = 'expired' then
    failed_rules := failed_rules + 1;
    rule_results := rule_results || jsonb_build_array(jsonb_build_object(
      'rule_type','deadline','status','failed','reason','The official deadline has passed.',
      'source_url',opportunity_row.canonical_url
    ));
  end if;

  for rule_row in
    select * from public.opportunity_eligibility_rules
    where opportunity_id = target_opportunity_id
      and requirement_level = 'required'
    order by sort_order, created_at
  loop
    total_required_rules := total_required_rules + 1;
    rule_values := case
      when jsonb_typeof(rule_row.value) = 'array'
        then array(select jsonb_array_elements_text(rule_row.value))
      else array[trim(both '"' from rule_row.value::text)]
    end;
    rule_result := 'unknown';

    if rule_row.rule_type = 'age' then
      if artist_row.birth_date is null then
        rule_result := 'unknown';
      elsif rule_row.operator = 'greater_than_or_equal'
        and extract(year from age(coalesce(opportunity_row.deadline_at, now()), artist_row.birth_date))::integer >= rule_values[1]::integer then
        rule_result := 'passed';
      elsif rule_row.operator = 'less_than_or_equal'
        and extract(year from age(coalesce(opportunity_row.deadline_at, now()), artist_row.birth_date))::integer <= rule_values[1]::integer then
        rule_result := 'passed';
      else
        rule_result := 'failed';
      end if;

    elsif rule_row.rule_type in ('country_of_residence','current_location','project_location') then
      if coalesce(artist_row.country_of_residence, '') = '' and coalesce(artist_row.state_or_region, '') = '' and coalesce(artist_row.location, '') = '' then
        rule_result := 'unknown';
      elsif rule_row.operator in ('equals','in','overlaps') and exists (
        select 1 from unnest(rule_values) expected
        where lower(expected) in (
          lower(coalesce(artist_row.country_of_residence,'')),
          lower(coalesce(artist_row.state_or_region,'')),
          lower(coalesce(artist_row.location,''))
        )
      ) then
        rule_result := 'passed';
      elsif rule_row.operator in ('not_equals','not_in') and not exists (
        select 1 from unnest(rule_values) expected
        where lower(expected) in (
          lower(coalesce(artist_row.country_of_residence,'')),
          lower(coalesce(artist_row.state_or_region,'')),
          lower(coalesce(artist_row.location,''))
        )
      ) then
        rule_result := 'passed';
      else
        rule_result := 'failed';
      end if;

    elsif rule_row.rule_type in ('citizenship','citizenship_restriction') then
      if cardinality(artist_row.citizenships) = 0 then
        rule_result := 'unknown';
      elsif rule_row.operator in ('equals','in','overlaps') and exists (
        select 1 from unnest(artist_row.citizenships) actual
        join unnest(rule_values) expected on lower(actual) = lower(expected)
      ) then
        rule_result := 'passed';
      elsif rule_row.operator in ('not_equals','not_in') and not exists (
        select 1 from unnest(artist_row.citizenships) actual
        join unnest(rule_values) expected on lower(actual) = lower(expected)
      ) then
        rule_result := 'passed';
      else
        rule_result := 'failed';
      end if;

    elsif rule_row.rule_type = 'discipline' then
      if cardinality(artist_row.disciplines) = 0 and cardinality(artist_row.mediums) = 0 then
        rule_result := 'unknown';
      elsif exists (
        select 1 from unnest(artist_row.disciplines || artist_row.mediums) actual
        join unnest(rule_values) expected on lower(actual) = lower(expected)
      ) then
        rule_result := 'passed';
      else
        rule_result := 'failed';
      end if;

    elsif rule_row.rule_type = 'career_stage' then
      if coalesce(artist_row.career_stage,'') = '' then
        rule_result := 'unknown';
      elsif exists (select 1 from unnest(rule_values) expected where lower(expected) = lower(artist_row.career_stage)) then
        rule_result := 'passed';
      else
        rule_result := 'failed';
      end if;

    elsif rule_row.rule_type = 'applicant_type' then
      if coalesce(artist_row.artist_type,'') = '' and coalesce(artist_row.organization_status,'') = '' then
        rule_result := 'unknown';
      elsif exists (
        select 1 from unnest(rule_values) expected
        where lower(expected) in (lower(coalesce(artist_row.artist_type,'')), lower(coalesce(artist_row.organization_status,'')))
      ) then
        rule_result := 'passed';
      else
        rule_result := 'failed';
      end if;

    elsif rule_row.rule_type = 'language' then
      if cardinality(artist_row.languages) = 0 then
        rule_result := 'unknown';
      elsif exists (
        select 1 from unnest(artist_row.languages) actual
        join unnest(rule_values) expected on lower(actual) = lower(expected)
      ) then
        rule_result := 'passed';
      else
        rule_result := 'failed';
      end if;

    elsif rule_row.rule_type = 'participation_format' and rule_row.operator = 'is_true' then
      rule_result := case when opportunity_row.remote_allowed is true then 'passed' else 'unknown' end;

    else
      rule_result := 'unknown';
    end if;

    if rule_result = 'failed' then failed_rules := failed_rules + 1; end if;
    if rule_result = 'unknown' then unknown_rules := unknown_rules + 1; end if;

    rule_results := rule_results || jsonb_build_array(jsonb_build_object(
      'rule_id', rule_row.id,
      'rule_type', rule_row.rule_type,
      'operator', rule_row.operator,
      'status', rule_result,
      'source_text', rule_row.source_text,
      'source_url', rule_row.source_url,
      'verification_status', rule_row.verification_status
    ));
  end loop;

  computed_eligibility := case
    when failed_rules > 0 then 'not_eligible'
    when total_required_rules = 0 then 'eligibility_unclear'
    when unknown_rules > 0 then 'missing_information'
    else 'eligible'
  end;

  select coalesce(array_agg(distinct actual), '{}') into matched_creative_terms
  from unnest(artist_row.disciplines || artist_row.mediums) actual
  join unnest(opportunity_row.disciplines) expected on lower(actual) = lower(expected);

  creative_match_count := cardinality(matched_creative_terms);
  computed_relevance := case
    when cardinality(artist_row.disciplines) = 0 and cardinality(artist_row.mediums) = 0 then 'insufficient_information'
    when creative_match_count >= 2 then 'strong_relevance'
    when creative_match_count = 1 then 'moderate_relevance'
    else 'limited_relevance'
  end;

  for requirement_row in
    select * from public.opportunity_requirements
    where opportunity_id = target_opportunity_id
      and verification_status <> 'rejected'
    order by sort_order, created_at
  loop
    requirement_ready := false;

    if requirement_row.material_key in ('work_samples','portfolio','images') then
      requirement_ready := portfolio_count >= coalesce(requirement_row.minimum_item_count, 1);
    elsif requirement_row.material_key in ('bio','biography') then
      requirement_ready := length(trim(artist_row.bio)) > 0
        or exists (select 1 from public.artist_materials where artist_user_id = caller_id and material_type = 'biography' and is_active);
    elsif requirement_row.material_key in ('artist_statement','statement') then
      requirement_ready := length(trim(artist_row.artist_statement)) > 0
        or exists (select 1 from public.artist_materials where artist_user_id = caller_id and material_type = 'artist_statement' and is_active);
    elsif requirement_row.material_key = 'cv' then
      requirement_ready := coalesce(artist_row.cv_file_path,'') <> ''
        or exists (select 1 from public.artist_materials where artist_user_id = caller_id and material_type = 'cv' and is_active);
    elsif requirement_row.material_key in ('proposal','budget','timeline','reference','references','letter','video','audio','supporting_document','project_description') then
      requirement_ready := exists (
        select 1 from public.artist_materials
        where artist_user_id = caller_id
          and is_active
          and material_type = case
            when requirement_row.material_key = 'references' then 'reference'
            else requirement_row.material_key
          end
      );
    elsif requirement_row.requires_artist_confirmation or requirement_row.human_verification_required then
      requirement_ready := false;
    else
      requirement_ready := exists (
        select 1 from public.artist_materials
        where artist_user_id = caller_id
          and is_active
          and (material_type = requirement_row.material_key or metadata ->> 'material_key' = requirement_row.material_key)
      );
    end if;

    if requirement_ready then
      ready_count := ready_count + 1;
    elsif requirement_row.required then
      missing_required_count := missing_required_count + 1;
    end if;

    readiness_items := readiness_items || jsonb_build_array(jsonb_build_object(
      'requirement_id', requirement_row.id,
      'material_key', requirement_row.material_key,
      'label', requirement_row.label,
      'required', requirement_row.required,
      'status', case
        when requirement_ready then 'ready'
        when requirement_row.requires_artist_confirmation then 'artist_confirmation_required'
        when requirement_row.human_verification_required then 'human_verification_required'
        else 'missing'
      end,
      'source_url', requirement_row.source_url,
      'accepted_file_types', requirement_row.accepted_file_types,
      'maximum_item_count', requirement_row.maximum_item_count,
      'maximum_file_size_bytes', requirement_row.maximum_file_size_bytes
    ));
  end loop;

  effort_level := case
    when missing_required_count >= 3 then 'significant'
    when missing_required_count >= 1 then 'moderate'
    else 'low'
  end;

  select id into current_source_version_id
  from public.opportunity_source_versions
  where opportunity_id = target_opportunity_id and is_current
  order by fetched_at desc
  limit 1;

  insert into public.artist_opportunity_evaluations (
    artist_user_id, opportunity_id, eligibility_status, relevance_status,
    rule_results, readiness, creative_fit, effort, strategic_value,
    explanation, deadline_status, source_version_id, passport_updated_at,
    evaluated_at, updated_at
  ) values (
    caller_id,
    target_opportunity_id,
    computed_eligibility,
    computed_relevance,
    rule_results,
    jsonb_build_object(
      'ready_count', ready_count,
      'missing_required_count', missing_required_count,
      'portfolio_work_count', portfolio_count,
      'items', readiness_items
    ),
    jsonb_build_object(
      'status', computed_relevance,
      'matched_terms', matched_creative_terms,
      'explanation', case
        when computed_relevance = 'insufficient_information' then 'Add disciplines or mediums to assess creative fit.'
        when creative_match_count > 0 then 'The opportunity explicitly accepts one or more media listed in the Creative Passport.'
        else 'No explicit discipline overlap was found; this does not estimate artistic quality.'
      end
    ),
    jsonb_build_object(
      'level', effort_level,
      'missing_required_count', missing_required_count,
      'days_remaining', days_remaining,
      'explanation', case
        when effort_level = 'low' then 'Core verified requirements appear available; final portal review is still required.'
        when effort_level = 'moderate' then 'One or more required items need preparation or confirmation.'
        else 'Several required items need preparation or human confirmation.'
      end
    ),
    jsonb_build_object(
      'funding_display', opportunity_row.funding_display_text,
      'career_relevance', computed_relevance,
      'reusable_asset_value', case when missing_required_count > 0 then 'Preparing missing reusable materials may support future applications.' else 'Existing reusable materials cover the verified requirements.' end,
      'winning_probability', null
    ),
    jsonb_build_object(
      'eligibility', jsonb_build_object(
        'status', computed_eligibility,
        'failed_rule_count', failed_rules,
        'unknown_rule_count', unknown_rules,
        'reasons', rule_results
      ),
      'creative_fit', jsonb_build_object('status', computed_relevance, 'matched_terms', matched_creative_terms),
      'readiness', jsonb_build_object('ready_count', ready_count, 'missing_required_count', missing_required_count),
      'deadline', jsonb_build_object('status', computed_deadline_status, 'official_timezone', opportunity_row.deadline_timezone, 'days_remaining', days_remaining),
      'source', jsonb_build_object(
        'official_url', opportunity_row.canonical_url,
        'last_verified_at', opportunity_row.last_verified_at,
        'verification_status', opportunity_row.verification_status,
        'verification_confidence', opportunity_row.verification_confidence,
        'reverify_at', opportunity_row.reverify_at
      )
    ),
    computed_deadline_status,
    current_source_version_id,
    artist_row.updated_at,
    now(),
    now()
  )
  on conflict (artist_user_id, opportunity_id) do update
  set eligibility_status = excluded.eligibility_status,
      relevance_status = excluded.relevance_status,
      rule_results = excluded.rule_results,
      readiness = excluded.readiness,
      creative_fit = excluded.creative_fit,
      effort = excluded.effort,
      strategic_value = excluded.strategic_value,
      explanation = excluded.explanation,
      deadline_status = excluded.deadline_status,
      source_version_id = excluded.source_version_id,
      passport_updated_at = excluded.passport_updated_at,
      evaluated_at = excluded.evaluated_at,
      updated_at = now()
  returning * into evaluation_row;

  return evaluation_row;
end;
$$;

grant execute on function public.evaluate_my_opportunity(uuid) to authenticated;
revoke execute on function public.evaluate_my_opportunity(uuid) from anon;

-- PhotoVogue reference fixture corrections
update public.opportunities
set contact_email = case
      when contact_email = '' then submission_email
      else contact_email
    end,
    submission_email = '',
    submission_method = 'external_portal',
    artwork_ai_policy = 'prohibited',
    application_assistance_policy = 'not_stated',
    policy_source_url = guidelines_url,
    policy_last_verified_at = coalesce(last_verified_at, now()),
    verification_confidence = 1,
    verified_by = 'KLEIO manual official-source review',
    verification_method = 'official publication plus official Picter terms',
    reverify_at = least(deadline_at - interval '14 days', now() + interval '21 days'),
    lifecycle_status = 'published',
    deadline_kind = 'fixed',
    updated_at = now()
where external_id in ('photovogue-brave-new-visions-2026','photovogue-mena-panorama-2026');

insert into public.opportunity_requirements (
  opportunity_id, material_key, label, required, source_text, source_url,
  extraction_method, verification_status, sort_order, last_verified_at,
  category, description, source_location, passport_field, input_type,
  requires_artist_confirmation, human_verification_required, confidence_score,
  constraints, source_title, retrieved_at, confidence_status, confidence_reason,
  normalized_interpretation
)
select
  opportunity.id,
  'external_form_details',
  'Official Picter form details',
  true,
  'Complete the project and contributor details displayed by the official Picter application form.',
  opportunity.guidelines_url,
  'manual_review',
  'confirmed',
  40,
  coalesce(opportunity.last_verified_at, now()),
  'application_form',
  'The public call confirms an external Picter application. KLEIO must verify the live form fields during handoff rather than invent undisclosed questions.',
  'official Picter application form',
  '',
  'external_form',
  true,
  true,
  1,
  jsonb_build_object('submission_path','external_portal','requires_live_form_review',true),
  opportunity.title,
  now(),
  'verified',
  'The official submission platform is confirmed; individual live form fields must be reviewed at handoff.',
  'Review and complete all live Picter form fields before artist-authorized submission.'
from public.opportunities opportunity
where opportunity.external_id in ('photovogue-brave-new-visions-2026','photovogue-mena-panorama-2026')
  and not exists (
    select 1 from public.opportunity_requirements existing
    where existing.opportunity_id = opportunity.id
      and existing.material_key = 'external_form_details'
  );

revoke execute on function public.admin_import_opportunities(jsonb) from public, anon;
revoke execute on function public.approve_opportunity_submission(uuid) from public, anon;

commit;
