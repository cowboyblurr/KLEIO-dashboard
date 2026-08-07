begin;

-- Default table privileges in this project can grant more than the composer
-- needs. Keep immutable versions read-only to clients; trusted writes happen
-- inside the explicit finalization boundary.
revoke all on public.application_submission_versions from anon;
revoke all on public.application_submission_versions from authenticated;
grant select on public.application_submission_versions to authenticated;

-- Artists may read their application history and add only self-reported events.
-- RLS further restricts INSERT to owned packages, actor_kind=artist, and
-- evidence_level=self_reported. Trusted system/provider events use server paths.
revoke all on public.application_timeline_events from anon;
revoke all on public.application_timeline_events from authenticated;
grant select, insert on public.application_timeline_events to authenticated;

commit;