begin;

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
  elsif tg_op = 'DELETE' then
    target_user := old.artist_user_id;
  else
    target_user := new.artist_user_id;
  end if;

  if target_user is not null then
    update public.artist_profiles
    set profile_completion = public.calculate_artist_passport_completion(target_user),
        updated_at = now()
    where user_id = target_user;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.refresh_artist_passport_completion_trigger() from public;
revoke all on function public.refresh_artist_passport_completion_trigger() from anon;
grant execute on function public.refresh_artist_passport_completion_trigger() to authenticated;

create or replace function public.reset_my_kleio_practice_submission()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_opportunity_id uuid;
  deleted_package_count integer := 0;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  select opportunity.id
  into target_opportunity_id
  from public.opportunities opportunity
  join public.opportunity_sources source on source.id = opportunity.source_id
  where source.slug = 'kleio-internal-practice-test'
    and opportunity.external_id = 'kleio-practice-submission-test-v1'
    and opportunity.data_scope = 'synthetic_test'
  limit 1;

  if target_opportunity_id is null then
    return jsonb_build_object(
      'reset', false,
      'reason', 'practice_opportunity_unavailable',
      'deleted_packages', 0
    );
  end if;

  delete from public.application_packages package_row
  where package_row.artist_user_id = current_user_id
    and package_row.opportunity_id = target_opportunity_id
    and package_row.data_scope = 'synthetic_test';
  get diagnostics deleted_package_count = row_count;

  return jsonb_build_object(
    'reset', true,
    'opportunity_id', target_opportunity_id,
    'deleted_packages', deleted_package_count,
    'preserved_artist_data', true
  );
end;
$$;

revoke all on function public.reset_my_kleio_practice_submission() from public;
revoke all on function public.reset_my_kleio_practice_submission() from anon;
grant execute on function public.reset_my_kleio_practice_submission() to authenticated;

comment on function public.reset_my_kleio_practice_submission() is
'Authenticated test-only reset for the clearly labeled KLEIO synthetic practice opportunity. Deletes the current artist application package and cascade-owned recipient test records while preserving Passport, portfolio, media, and unrelated applications.';

commit;
