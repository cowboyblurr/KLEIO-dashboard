-- 005_opportunity_rls_and_grants
begin;
alter table public.opportunity_sources enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_source_snapshots enable row level security;
alter table public.opportunity_eligibility_rules enable row level security;
alter table public.opportunity_requirements enable row level security;
alter table public.opportunity_import_jobs enable row level security;
alter table public.opportunity_sync_errors enable row level security;
alter table public.institution_opportunity_submissions enable row level security;
alter table public.artist_opportunity_tracking enable row level security;
alter table public.artist_opportunity_evaluations enable row level security;
alter table public.opportunity_events enable row level security;

create policy opportunity_sources_public_read on public.opportunity_sources
for select to anon, authenticated using (active);
create policy opportunity_sources_admin_manage on public.opportunity_sources
for all to authenticated using (public.is_kleio_admin()) with check (public.is_kleio_admin());

create policy opportunities_public_read on public.opportunities
for select to anon, authenticated
using (
  status in ('open','forecasted','upcoming')
  and (deadline_at is null or deadline_at >= now())
  and duplicate_of is null
  and exists (
    select 1 from public.opportunity_sources source_row
    where source_row.id = opportunities.source_id and source_row.active
  )
);
create policy opportunities_admin_manage on public.opportunities
for all to authenticated using (public.is_kleio_admin()) with check (public.is_kleio_admin());

create policy opportunity_rules_public_read on public.opportunity_eligibility_rules
for select to anon, authenticated
using (
  verification_status in ('confirmed','ambiguous')
  and exists (
    select 1 from public.opportunities opportunity_row
    where opportunity_row.id = opportunity_eligibility_rules.opportunity_id
      and opportunity_row.status in ('open','forecasted','upcoming')
      and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
  )
);
create policy opportunity_rules_admin_manage on public.opportunity_eligibility_rules
for all to authenticated using (public.is_kleio_admin()) with check (public.is_kleio_admin());

create policy opportunity_requirements_public_read on public.opportunity_requirements
for select to anon, authenticated
using (
  verification_status in ('confirmed','ambiguous')
  and exists (
    select 1 from public.opportunities opportunity_row
    where opportunity_row.id = opportunity_requirements.opportunity_id
      and opportunity_row.status in ('open','forecasted','upcoming')
      and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
  )
);
create policy opportunity_requirements_admin_manage on public.opportunity_requirements
for all to authenticated using (public.is_kleio_admin()) with check (public.is_kleio_admin());

create policy opportunity_snapshots_admin_read on public.opportunity_source_snapshots
for select to authenticated using (public.is_kleio_admin());
create policy opportunity_jobs_admin_read on public.opportunity_import_jobs
for select to authenticated using (public.is_kleio_admin());
create policy opportunity_errors_admin_read on public.opportunity_sync_errors
for select to authenticated using (public.is_kleio_admin());

create policy opportunity_submissions_insert_own_institution on public.institution_opportunity_submissions
for insert to authenticated
with check (
  submitter_user_id = (select auth.uid())
  and public.owns_institution(institution_id)
  and exists (
    select 1 from public.profiles profile_row
    where profile_row.id = (select auth.uid())
      and profile_row.role = 'institution'::public.kleio_role
  )
);
create policy opportunity_submissions_read_own_or_admin on public.institution_opportunity_submissions
for select to authenticated
using (submitter_user_id = (select auth.uid()) or public.is_kleio_admin());
create policy opportunity_submissions_update_own_draft on public.institution_opportunity_submissions
for update to authenticated
using (
  submitter_user_id = (select auth.uid())
  and moderation_status in ('draft','submitted','changes_requested')
  and public.owns_institution(institution_id)
)
with check (
  submitter_user_id = (select auth.uid())
  and moderation_status in ('draft','submitted','changes_requested')
  and public.owns_institution(institution_id)
);
create policy opportunity_submissions_admin_manage on public.institution_opportunity_submissions
for all to authenticated using (public.is_kleio_admin()) with check (public.is_kleio_admin());

create policy opportunity_tracking_manage_own on public.artist_opportunity_tracking
for all to authenticated
using (artist_user_id = (select auth.uid()))
with check (artist_user_id = (select auth.uid()));
create policy opportunity_evaluations_manage_own on public.artist_opportunity_evaluations
for all to authenticated
using (artist_user_id = (select auth.uid()))
with check (artist_user_id = (select auth.uid()));
create policy opportunity_events_admin_read on public.opportunity_events
for select to authenticated using (public.is_kleio_admin());

revoke all on public.opportunity_sources from anon, authenticated;
revoke all on public.opportunities from anon, authenticated;
revoke all on public.opportunity_source_snapshots from anon, authenticated;
revoke all on public.opportunity_eligibility_rules from anon, authenticated;
revoke all on public.opportunity_requirements from anon, authenticated;
revoke all on public.opportunity_import_jobs from anon, authenticated;
revoke all on public.opportunity_sync_errors from anon, authenticated;
revoke all on public.institution_opportunity_submissions from anon, authenticated;
revoke all on public.artist_opportunity_tracking from anon, authenticated;
revoke all on public.artist_opportunity_evaluations from anon, authenticated;
revoke all on public.opportunity_events from anon, authenticated;

grant select on public.opportunity_sources to anon, authenticated;
grant select on public.opportunities to anon, authenticated;
grant select on public.opportunity_eligibility_rules to anon, authenticated;
grant select on public.opportunity_requirements to anon, authenticated;
grant insert, select, update on public.institution_opportunity_submissions to authenticated;
grant select, insert, update, delete on public.artist_opportunity_tracking to authenticated;
grant select, insert, update, delete on public.artist_opportunity_evaluations to authenticated;
grant select, insert, update, delete on public.saved_opportunities to authenticated;

grant select, insert, update, delete on public.opportunity_sources to service_role;
grant select, insert, update, delete on public.opportunities to service_role;
grant select, insert, update, delete on public.opportunity_source_snapshots to service_role;
grant select, insert, update, delete on public.opportunity_eligibility_rules to service_role;
grant select, insert, update, delete on public.opportunity_requirements to service_role;
grant select, insert, update, delete on public.opportunity_import_jobs to service_role;
grant select, insert, update, delete on public.opportunity_sync_errors to service_role;
grant select, insert, update, delete on public.institution_opportunity_submissions to service_role;
grant select, insert, update, delete on public.artist_opportunity_tracking to service_role;
grant select, insert, update, delete on public.artist_opportunity_evaluations to service_role;
grant select, insert, update, delete on public.opportunity_events to service_role;
grant usage, select on sequence public.opportunity_events_id_seq to service_role;

drop trigger if exists opportunity_sources_set_updated_at on public.opportunity_sources;
create trigger opportunity_sources_set_updated_at before update on public.opportunity_sources
for each row execute function public.set_updated_at();
drop trigger if exists opportunities_set_updated_at on public.opportunities;
create trigger opportunities_set_updated_at before update on public.opportunities
for each row execute function public.set_updated_at();
drop trigger if exists opportunity_rules_set_updated_at on public.opportunity_eligibility_rules;
create trigger opportunity_rules_set_updated_at before update on public.opportunity_eligibility_rules
for each row execute function public.set_updated_at();
drop trigger if exists opportunity_requirements_set_updated_at on public.opportunity_requirements;
create trigger opportunity_requirements_set_updated_at before update on public.opportunity_requirements
for each row execute function public.set_updated_at();
drop trigger if exists opportunity_submissions_set_updated_at on public.institution_opportunity_submissions;
create trigger opportunity_submissions_set_updated_at before update on public.institution_opportunity_submissions
for each row execute function public.set_updated_at();
drop trigger if exists opportunity_tracking_set_updated_at on public.artist_opportunity_tracking;
create trigger opportunity_tracking_set_updated_at before update on public.artist_opportunity_tracking
for each row execute function public.set_updated_at();
commit;
