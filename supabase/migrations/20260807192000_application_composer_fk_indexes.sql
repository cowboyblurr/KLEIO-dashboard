begin;

create index if not exists application_submission_versions_application_idx
  on public.application_submission_versions (application_id)
  where application_id is not null;

create index if not exists application_timeline_events_submission_version_idx
  on public.application_timeline_events (submission_version_id)
  where submission_version_id is not null;

commit;