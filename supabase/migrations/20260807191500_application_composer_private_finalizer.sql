begin;

-- Keep the privileged implementation out of the exposed public API schema.
-- The implementation still performs the explicit auth.uid() package ownership
-- check before it can read or write any artist application state.
alter function public.finalize_my_application_submission_version(uuid, jsonb)
  set schema private;

alter function private.finalize_my_application_submission_version(uuid, jsonb)
  rename to finalize_my_application_submission_version_impl;

revoke all on function private.finalize_my_application_submission_version_impl(uuid, jsonb) from public;
revoke all on function private.finalize_my_application_submission_version_impl(uuid, jsonb) from anon;
grant execute on function private.finalize_my_application_submission_version_impl(uuid, jsonb) to authenticated;

-- Public client surface remains an invoker wrapper. PostgREST exposes only this
-- wrapper; the privileged implementation remains in the non-exposed schema.
create or replace function public.finalize_my_application_submission_version(
  target_package_id uuid,
  supplied_preflight jsonb default '{}'::jsonb
)
returns table (
  submission_version_id uuid,
  version_number integer,
  finalized_at timestamptz
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.finalize_my_application_submission_version_impl(
    target_package_id,
    supplied_preflight
  );
$$;

revoke all on function public.finalize_my_application_submission_version(uuid, jsonb) from public;
revoke all on function public.finalize_my_application_submission_version(uuid, jsonb) from anon;
grant execute on function public.finalize_my_application_submission_version(uuid, jsonb) to authenticated;

comment on function public.finalize_my_application_submission_version(uuid, jsonb) is
  'SECURITY INVOKER API wrapper for artist-owned application finalization. The privileged implementation is held in the private schema and enforces auth.uid() ownership before creating immutable versions or trusted timeline evidence.';

commit;