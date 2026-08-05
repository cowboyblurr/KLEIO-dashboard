begin;

alter table public.application_submission_attempts
  drop constraint if exists application_submission_attempts_status_check;
alter table public.application_submission_attempts
  add constraint application_submission_attempts_status_check
  check (status in (
    'started',
    'prepared',
    'package_exported',
    'gmail_draft_created',
    'email_client_opened',
    'submitted',
    'confirmed',
    'failed',
    'artist_reported'
  ));

create or replace function public.canonical_opportunity_requirement_key(raw_key text)
returns text
language sql
immutable
parallel safe
set search_path = public
as $$
  select case lower(regexp_replace(coalesce(raw_key, ''), '[^a-z0-9]+', '_', 'g'))
    when 'curriculum_vitae' then 'cv'
    when 'curriculum_vitae_cv' then 'cv'
    when 'resume' then 'cv'
    when 'résumé' then 'cv'
    when 'artist_resume' then 'cv'
    when 'work_sample' then 'portfolio'
    when 'work_samples' then 'portfolio'
    when 'portfolio_images' then 'portfolio'
    when 'artwork_images' then 'portfolio'
    when 'artist_bio' then 'biography'
    when 'bio' then 'biography'
    when 'project_description' then 'project_proposal'
    when 'proposal' then 'project_proposal'
    else trim(both '_' from lower(regexp_replace(coalesce(raw_key, ''), '[^a-z0-9]+', '_', 'g')))
  end;
$$;

revoke all on function public.canonical_opportunity_requirement_key(text) from public;
grant execute on function public.canonical_opportunity_requirement_key(text) to authenticated;

with aliases as (
  select
    requirement.id,
    requirement.opportunity_id,
    requirement.material_key,
    requirement.source_text,
    public.canonical_opportunity_requirement_key(requirement.material_key) as canonical_key
  from public.opportunity_requirements requirement
  where public.canonical_opportunity_requirement_key(requirement.material_key) <> requirement.material_key
), merged as (
  select
    alias.opportunity_id,
    alias.canonical_key,
    string_agg(distinct alias.source_text, E'\nAdditional source wording: ' order by alias.source_text) as additional_source_text
  from aliases alias
  join public.opportunity_requirements canonical
    on canonical.opportunity_id = alias.opportunity_id
   and canonical.material_key = alias.canonical_key
  group by alias.opportunity_id, alias.canonical_key
)
update public.opportunity_requirements canonical
set source_text = concat_ws(E'\nAdditional source wording: ', nullif(canonical.source_text, ''), merged.additional_source_text),
    updated_at = now()
from merged
where canonical.opportunity_id = merged.opportunity_id
  and canonical.material_key = merged.canonical_key;

with aliases as (
  select
    requirement.id,
    requirement.opportunity_id,
    public.canonical_opportunity_requirement_key(requirement.material_key) as canonical_key
  from public.opportunity_requirements requirement
  where public.canonical_opportunity_requirement_key(requirement.material_key) <> requirement.material_key
)
delete from public.opportunity_requirements requirement
using aliases alias
where requirement.id = alias.id
  and exists (
    select 1
    from public.opportunity_requirements canonical
    where canonical.opportunity_id = alias.opportunity_id
      and canonical.material_key = alias.canonical_key
      and canonical.id <> alias.id
  );

update public.opportunity_requirements requirement
set material_key = public.canonical_opportunity_requirement_key(requirement.material_key),
    updated_at = now()
where public.canonical_opportunity_requirement_key(requirement.material_key) <> requirement.material_key;

create or replace function public.normalize_opportunity_requirement_key_trigger()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.material_key := public.canonical_opportunity_requirement_key(new.material_key);
  return new;
end;
$$;

revoke all on function public.normalize_opportunity_requirement_key_trigger() from public;
revoke all on function public.normalize_opportunity_requirement_key_trigger() from anon;
grant execute on function public.normalize_opportunity_requirement_key_trigger() to authenticated;

drop trigger if exists normalize_opportunity_requirement_key_before_write on public.opportunity_requirements;
create trigger normalize_opportunity_requirement_key_before_write
before insert or update of material_key on public.opportunity_requirements
for each row execute function public.normalize_opportunity_requirement_key_trigger();

create or replace function public.calculate_artist_passport_completion(target_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with profile as (
    select artist.*
    from public.artist_profiles artist
    where artist.user_id = target_user_id
  ), work_stats as (
    select
      count(*) filter (where btrim(coalesce(work.title, '')) <> '')::numeric as work_count,
      count(*) filter (where btrim(coalesce(work.title, '')) <> '' and work.image_path is not null)::numeric as image_count,
      count(*) filter (
        where btrim(coalesce(work.title, '')) <> ''
          and btrim(coalesce(work.year, '')) <> ''
          and btrim(coalesce(work.medium, '')) <> ''
          and btrim(coalesce(work.dimensions, '')) <> ''
      )::numeric as metadata_count
    from public.portfolio_works work
    where work.artist_user_id = target_user_id
  ), flags as (
    select
      case when btrim(coalesce(profile.professional_name, '')) <> '' then 1.0 else 0.0 end as has_name,
      case when btrim(coalesce(profile.location, '')) <> '' or btrim(coalesce(profile.website_url, '')) <> '' or btrim(coalesce(profile.instagram_url, '')) <> '' then 1.0 else 0.0 end as has_contact,
      case when coalesce(array_length(profile.disciplines, 1), 0) > 0 then 1.0 else 0.0 end as has_discipline,
      case when btrim(coalesce(profile.bio, '')) <> '' or btrim(coalesce(profile.artist_statement, '')) <> '' then 1.0 else 0.0 end as has_narrative,
      case when profile.cv_file_path is not null or btrim(coalesce(profile.education, '')) <> '' or btrim(coalesce(profile.exhibition_history, '')) <> '' then 1.0 else 0.0 end as has_professional_history,
      case when work_stats.work_count > 0 then 1.0 else 0.0 end as has_work,
      case when work_stats.image_count > 0 then 1.0 else 0.0 end as has_image,
      case when work_stats.work_count > 0 then least(1.0, work_stats.metadata_count / work_stats.work_count) else 0.0 end as metadata_ratio,
      case when coalesce(array_length(profile.mediums, 1), 0) > 0 then 1.0 else 0.0 end as has_mediums,
      ((case when btrim(coalesce(profile.practice_description, '')) <> '' then 1.0 else 0.0 end)
        + (case when btrim(coalesce(profile.exhibition_history, '')) <> '' then 1.0 else 0.0 end)) / 2.0 as practice_context,
      ((case when btrim(coalesce(profile.website_url, '')) <> '' then 1.0 else 0.0 end)
        + (case when btrim(coalesce(profile.instagram_url, '')) <> '' then 1.0 else 0.0 end)) / 2.0 as supporting_links
    from profile
    cross join work_stats
  ), score as (
    select
      round(
        12 * ((has_name + has_contact) / 2.0)
        + 8 * has_discipline
        + 12 * has_narrative
        + 14 * has_professional_history
        + 14 * has_work
        + 14 * has_image
        + 10 * metadata_ratio
        + 6 * has_mediums
        + 5 * practice_context
        + 5 * supporting_links
      )::integer as raw_score,
      (has_name = 1 and has_contact = 1 and has_discipline = 1 and has_narrative = 1 and has_professional_history = 1 and has_work = 1 and has_image = 1) as critical_complete
    from flags
  )
  select coalesce(case when critical_complete then raw_score else least(raw_score, 99) end, 0)
  from score;
$$;

revoke all on function public.calculate_artist_passport_completion(uuid) from public;
revoke all on function public.calculate_artist_passport_completion(uuid) from anon;
grant execute on function public.calculate_artist_passport_completion(uuid) to authenticated;

create or replace function public.refresh_artist_passport_completion_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user uuid;
begin
  if tg_table_name = 'artist_profiles' then
    target_user := new.user_id;
  else
    target_user := coalesce(new.artist_user_id, old.artist_user_id);
  end if;

  if target_user is not null then
    update public.artist_profiles
    set profile_completion = public.calculate_artist_passport_completion(target_user),
        updated_at = now()
    where user_id = target_user;
  end if;

  return coalesce(new, old);
end;
$$;

revoke all on function public.refresh_artist_passport_completion_trigger() from public;
revoke all on function public.refresh_artist_passport_completion_trigger() from anon;
grant execute on function public.refresh_artist_passport_completion_trigger() to authenticated;

drop trigger if exists refresh_artist_passport_completion_after_profile_write on public.artist_profiles;
create trigger refresh_artist_passport_completion_after_profile_write
after insert or update of professional_name, location, bio, artist_statement, practice_description, website_url, instagram_url, disciplines, mediums, education, exhibition_history, awards, cv_file_path
on public.artist_profiles
for each row execute function public.refresh_artist_passport_completion_trigger();

drop trigger if exists refresh_artist_passport_completion_after_portfolio_write on public.portfolio_works;
create trigger refresh_artist_passport_completion_after_portfolio_write
after insert or update or delete on public.portfolio_works
for each row execute function public.refresh_artist_passport_completion_trigger();

update public.artist_profiles artist
set profile_completion = public.calculate_artist_passport_completion(artist.user_id),
    updated_at = now();

commit;
