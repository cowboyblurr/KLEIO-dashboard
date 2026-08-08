-- Finalized submission versions are immutable in real workflows, but KLEIO's
-- synthetic practice/reset tooling must still be able to remove its own test
-- records after a finalized simulation. Keep the exception server-only,
-- transaction-scoped, and restricted to data_scope = synthetic_test.

create or replace function public.prevent_application_submission_version_mutation()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if tg_op = 'DELETE'
     and old.data_scope = 'synthetic_test'
     and coalesce(current_setting('kleio.synthetic_cleanup', true), '') = 'on' then
    return old;
  end if;

  raise exception 'application_submission_versions are immutable';
end;
$$;

create or replace function private.cleanup_synthetic_application_package(target_package_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'private'
as $$
declare
  package_row public.application_packages%rowtype;
  deleted_versions integer := 0;
  deleted_access integer := 0;
  deleted_deliveries integer := 0;
  deleted_packages integer := 0;
begin
  select * into package_row
  from public.application_packages
  where id = target_package_id
  for update;

  if package_row.id is null then
    return jsonb_build_object('deleted', false, 'reason', 'package_not_found');
  end if;

  if package_row.data_scope <> 'synthetic_test' then
    raise exception 'synthetic_cleanup_real_package_forbidden';
  end if;

  -- The immutable-version trigger checks this transaction-local flag. It is set
  -- only inside this server-only function and only after confirming synthetic scope.
  perform set_config('kleio.synthetic_cleanup', 'on', true);

  delete from public.application_deliveries
  where package_id = target_package_id;
  get diagnostics deleted_deliveries = row_count;

  delete from public.application_recipient_access
  where package_id = target_package_id;
  get diagnostics deleted_access = row_count;

  delete from public.application_submission_versions
  where package_id = target_package_id;
  get diagnostics deleted_versions = row_count;

  delete from public.application_packages
  where id = target_package_id
    and data_scope = 'synthetic_test';
  get diagnostics deleted_packages = row_count;

  return jsonb_build_object(
    'deleted', deleted_packages = 1,
    'package_id', target_package_id,
    'deleted_packages', deleted_packages,
    'deleted_submission_versions', deleted_versions,
    'deleted_recipient_access', deleted_access,
    'deleted_deliveries', deleted_deliveries,
    'real_data_preserved', true
  );
end;
$$;

revoke all on function private.cleanup_synthetic_application_package(uuid) from public, anon, authenticated;

create or replace function public.reset_my_kleio_practice_submission()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'private'
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_opportunity_id uuid;
  package_id uuid;
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

  for package_id in
    select package_row.id
    from public.application_packages package_row
    where package_row.artist_user_id = current_user_id
      and package_row.opportunity_id = target_opportunity_id
      and package_row.data_scope = 'synthetic_test'
  loop
    perform private.cleanup_synthetic_application_package(package_id);
    deleted_package_count := deleted_package_count + 1;
  end loop;

  return jsonb_build_object(
    'reset', true,
    'opportunity_id', target_opportunity_id,
    'deleted_packages', deleted_package_count,
    'preserved_artist_data', true,
    'finalized_synthetic_history_removed', true
  );
end;
$$;

comment on function private.cleanup_synthetic_application_package(uuid) is
  'Server-only cleanup for synthetic_test application packages. It is the sole controlled exception to immutable submission-version deletion and cannot delete real application history.';
