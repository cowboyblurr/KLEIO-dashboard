begin;

-- Finalization writes an immutable snapshot plus one system-observed timeline event.
-- The function performs an explicit auth.uid() ownership check before any write,
-- then runs with the table privileges required to write trusted evidence that an
-- authenticated client must not be able to spoof directly.
alter function public.finalize_my_application_submission_version(uuid, jsonb)
  security definer;

revoke all on function public.finalize_my_application_submission_version(uuid, jsonb) from public;
revoke all on function public.finalize_my_application_submission_version(uuid, jsonb) from anon;
grant execute on function public.finalize_my_application_submission_version(uuid, jsonb) to authenticated;

-- Immutable versions are created only through the finalization RPC. Artists can
-- read their own historical versions but cannot insert an arbitrary "finalized"
-- snapshot directly through the Data API.
drop policy if exists "Artists create own immutable submission versions"
  on public.application_submission_versions;
revoke insert on public.application_submission_versions from authenticated;

comment on function public.finalize_my_application_submission_version(uuid, jsonb) is
  'Artist-owned finalization boundary. Explicitly verifies auth.uid() owns the package, rejects unresolved preflight blockers, creates the immutable application version, and records a trusted system-observed finalization event. Direct client inserts into immutable versions are revoked.';

commit;