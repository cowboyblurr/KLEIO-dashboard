begin;

alter table public.application_submission_versions
  add column if not exists source_package_version integer;

alter table public.application_submission_versions
  drop constraint if exists application_submission_versions_source_package_version_check;
alter table public.application_submission_versions
  add constraint application_submission_versions_source_package_version_check
  check (source_package_version is null or source_package_version > 0);

create index if not exists application_submission_versions_package_revision_idx
  on public.application_submission_versions (package_id, source_package_version);

create or replace function private.finalize_my_application_submission_version_impl(
  target_package_id uuid,
  supplied_preflight jsonb default '{}'::jsonb
)
returns table (
  submission_version_id uuid,
  version_number integer,
  finalized_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  package_row public.application_packages%rowtype;
  next_submission_version integer;
  created_version public.application_submission_versions%rowtype;
  item_snapshot jsonb;
  opportunity_snapshot jsonb;
begin
  select * into package_row
  from public.application_packages
  where id = target_package_id
    and artist_user_id = (select auth.uid())
  for update;

  if package_row.id is null then
    raise exception 'application_package_not_found';
  end if;

  if package_row.artist_approved_at is null then
    raise exception 'artist_approval_required';
  end if;

  if package_row.state in ('draft', 'missing_information', 'deadline_passed', 'failed', 'withdrawn') then
    raise exception 'application_package_not_finalizable';
  end if;

  if jsonb_typeof(supplied_preflight) <> 'object' then
    raise exception 'invalid_preflight_snapshot';
  end if;

  if coalesce((supplied_preflight->>'blocking_count')::integer, 0) > 0 then
    raise exception 'preflight_blockers_remaining';
  end if;

  select coalesce(jsonb_agg(to_jsonb(item_row) order by item_row.sort_order, item_row.created_at), '[]'::jsonb)
  into item_snapshot
  from public.application_package_items item_row
  where item_row.package_id = package_row.id;

  select coalesce(to_jsonb(opportunity_row), '{}'::jsonb)
  into opportunity_snapshot
  from (
    select
      opportunity.id,
      opportunity.title,
      opportunity.provider_name,
      opportunity.deadline_at,
      opportunity.deadline_timezone,
      opportunity.submission_method,
      opportunity.submission_email,
      opportunity.submission_instructions,
      opportunity.canonical_url,
      opportunity.application_url,
      opportunity.data_scope
    from public.opportunities opportunity
    where opportunity.id = package_row.opportunity_id
  ) opportunity_row;

  select coalesce(max(existing.version_number), 0) + 1
  into next_submission_version
  from public.application_submission_versions existing
  where existing.package_id = package_row.id;

  insert into public.application_submission_versions (
    package_id,
    artist_user_id,
    opportunity_id,
    application_id,
    version_number,
    source_package_version,
    submission_method,
    destination,
    snapshot,
    preflight_snapshot,
    data_scope
  ) values (
    package_row.id,
    package_row.artist_user_id,
    package_row.opportunity_id,
    package_row.application_id,
    next_submission_version,
    package_row.package_version,
    package_row.submission_method,
    package_row.external_destination,
    jsonb_build_object(
      'captured_at', now(),
      'application_reference', 'KLA-' || upper(substr(replace(package_row.id::text, '-', ''), 1, 12)),
      'package_id', package_row.id,
      'source_package_version', package_row.package_version,
      'package_state', package_row.state,
      'opportunity', opportunity_snapshot,
      'requirements', package_row.requirement_snapshot,
      'readiness', package_row.readiness,
      'passport', package_row.passport_snapshot,
      'portfolio', package_row.portfolio_snapshot,
      'written_content', package_row.written_content,
      'email_preview', package_row.email_preview,
      'destination', package_row.external_destination,
      'approval_confirmations', package_row.approval_confirmations,
      'artist_approved_at', package_row.artist_approved_at,
      'package_items', item_snapshot
    ),
    supplied_preflight,
    package_row.data_scope
  )
  returning * into created_version;

  -- Existing application_package_versions owns draft/package revision numbers.
  -- Finalization never rewrites or resets that counter; it seals the exact
  -- package revision above and stores preflight evidence separately.
  update public.application_packages
  set preflight_snapshot = supplied_preflight,
      updated_at = now()
  where id = package_row.id;

  insert into public.application_timeline_events (
    package_id,
    submission_version_id,
    artist_user_id,
    event_type,
    evidence_level,
    actor_kind,
    summary,
    metadata,
    idempotency_key
  ) values (
    package_row.id,
    created_version.id,
    package_row.artist_user_id,
    'application_finalized',
    'system_observed',
    'system',
    'Application finalized and preserved as an immutable submission version.',
    jsonb_build_object(
      'submission_version_number', next_submission_version,
      'source_package_version', package_row.package_version
    ),
    'finalized:' || created_version.id::text
  );

  return query
    select created_version.id, created_version.version_number, created_version.finalized_at;
end;
$$;

revoke all on function private.finalize_my_application_submission_version_impl(uuid, jsonb) from public;
revoke all on function private.finalize_my_application_submission_version_impl(uuid, jsonb) from anon;
grant execute on function private.finalize_my_application_submission_version_impl(uuid, jsonb) to authenticated;

comment on column public.application_submission_versions.source_package_version is
  'The existing application_packages.package_version that was sealed. Draft/package revision history remains owned by application_package_versions; this table records only artist-finalized submission seals.';

comment on table public.application_submission_versions is
  'Artist-finalized immutable submission seals linked to the exact existing application package revision. This complements, rather than replaces, application_package_versions draft history.';

commit;