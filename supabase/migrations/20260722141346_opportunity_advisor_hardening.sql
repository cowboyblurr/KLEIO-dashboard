begin;

create policy kleio_admins_deny_direct_read
on public.kleio_admins for select
to authenticated
using (false);

revoke execute on function public.record_opportunity_event(text,uuid,text,jsonb) from anon;
grant execute on function public.record_opportunity_event(text,uuid,text,jsonb) to authenticated;

create index if not exists artist_opportunity_evaluations_opportunity_idx on public.artist_opportunity_evaluations(opportunity_id);
create index if not exists artist_opportunity_tracking_opportunity_idx on public.artist_opportunity_tracking(opportunity_id);
create index if not exists institution_opportunity_submissions_institution_idx on public.institution_opportunity_submissions(institution_id);
create index if not exists institution_opportunity_submissions_reviewer_idx on public.institution_opportunity_submissions(reviewer_user_id) where reviewer_user_id is not null;
create index if not exists institution_opportunity_submissions_published_idx on public.institution_opportunity_submissions(published_opportunity_id) where published_opportunity_id is not null;
create index if not exists opportunities_duplicate_of_idx on public.opportunities(duplicate_of) where duplicate_of is not null;
create index if not exists opportunity_conversation_reads_user_idx on public.opportunity_conversation_reads(user_id);
create index if not exists opportunity_events_artist_idx on public.opportunity_events(artist_user_id, created_at desc) where artist_user_id is not null;
create index if not exists opportunity_sync_errors_source_idx on public.opportunity_sync_errors(source_id, created_at desc) where source_id is not null;

drop policy if exists opportunity_sources_public_read on public.opportunity_sources;
drop policy if exists opportunity_sources_admin_manage on public.opportunity_sources;
create policy opportunity_sources_read on public.opportunity_sources
for select to anon, authenticated using (active or public.is_kleio_admin());
create policy opportunity_sources_admin_insert on public.opportunity_sources
for insert to authenticated with check (public.is_kleio_admin());
create policy opportunity_sources_admin_update on public.opportunity_sources
for update to authenticated using (public.is_kleio_admin()) with check (public.is_kleio_admin());
create policy opportunity_sources_admin_delete on public.opportunity_sources
for delete to authenticated using (public.is_kleio_admin());

drop policy if exists opportunities_public_read on public.opportunities;
drop policy if exists opportunities_admin_manage on public.opportunities;
create policy opportunities_read on public.opportunities
for select to anon, authenticated
using (
  public.is_kleio_admin()
  or (
    status in ('open','forecasted','upcoming')
    and (deadline_at is null or deadline_at >= now())
    and duplicate_of is null
    and exists (
      select 1 from public.opportunity_sources source_row
      where source_row.id = opportunities.source_id and source_row.active
    )
  )
);
create policy opportunities_admin_insert on public.opportunities
for insert to authenticated with check (public.is_kleio_admin());
create policy opportunities_admin_update on public.opportunities
for update to authenticated using (public.is_kleio_admin()) with check (public.is_kleio_admin());
create policy opportunities_admin_delete on public.opportunities
for delete to authenticated using (public.is_kleio_admin());

drop policy if exists opportunity_rules_public_read on public.opportunity_eligibility_rules;
drop policy if exists opportunity_rules_admin_manage on public.opportunity_eligibility_rules;
create policy opportunity_rules_read on public.opportunity_eligibility_rules
for select to anon, authenticated
using (
  public.is_kleio_admin()
  or (
    verification_status in ('confirmed','ambiguous')
    and exists (
      select 1 from public.opportunities opportunity_row
      where opportunity_row.id = opportunity_eligibility_rules.opportunity_id
        and opportunity_row.status in ('open','forecasted','upcoming')
        and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
    )
  )
);
create policy opportunity_rules_admin_insert on public.opportunity_eligibility_rules
for insert to authenticated with check (public.is_kleio_admin());
create policy opportunity_rules_admin_update on public.opportunity_eligibility_rules
for update to authenticated using (public.is_kleio_admin()) with check (public.is_kleio_admin());
create policy opportunity_rules_admin_delete on public.opportunity_eligibility_rules
for delete to authenticated using (public.is_kleio_admin());

drop policy if exists opportunity_requirements_public_read on public.opportunity_requirements;
drop policy if exists opportunity_requirements_admin_manage on public.opportunity_requirements;
create policy opportunity_requirements_read on public.opportunity_requirements
for select to anon, authenticated
using (
  public.is_kleio_admin()
  or (
    verification_status in ('confirmed','ambiguous')
    and exists (
      select 1 from public.opportunities opportunity_row
      where opportunity_row.id = opportunity_requirements.opportunity_id
        and opportunity_row.status in ('open','forecasted','upcoming')
        and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
    )
  )
);
create policy opportunity_requirements_admin_insert on public.opportunity_requirements
for insert to authenticated with check (public.is_kleio_admin());
create policy opportunity_requirements_admin_update on public.opportunity_requirements
for update to authenticated using (public.is_kleio_admin()) with check (public.is_kleio_admin());
create policy opportunity_requirements_admin_delete on public.opportunity_requirements
for delete to authenticated using (public.is_kleio_admin());

drop policy if exists opportunity_submissions_insert_own_institution on public.institution_opportunity_submissions;
drop policy if exists opportunity_submissions_read_own_or_admin on public.institution_opportunity_submissions;
drop policy if exists opportunity_submissions_update_own_draft on public.institution_opportunity_submissions;
drop policy if exists opportunity_submissions_admin_manage on public.institution_opportunity_submissions;
create policy opportunity_submissions_read on public.institution_opportunity_submissions
for select to authenticated
using (submitter_user_id = (select auth.uid()) or public.is_kleio_admin());
create policy opportunity_submissions_insert on public.institution_opportunity_submissions
for insert to authenticated
with check (
  public.is_kleio_admin()
  or (
    submitter_user_id = (select auth.uid())
    and public.owns_institution(institution_id)
    and exists (
      select 1 from public.profiles profile_row
      where profile_row.id = (select auth.uid())
        and profile_row.role = 'institution'::public.kleio_role
    )
  )
);
create policy opportunity_submissions_update on public.institution_opportunity_submissions
for update to authenticated
using (
  public.is_kleio_admin()
  or (
    submitter_user_id = (select auth.uid())
    and moderation_status in ('draft','submitted','changes_requested')
    and public.owns_institution(institution_id)
  )
)
with check (
  public.is_kleio_admin()
  or (
    submitter_user_id = (select auth.uid())
    and moderation_status in ('draft','submitted','changes_requested')
    and public.owns_institution(institution_id)
  )
);
create policy opportunity_submissions_admin_delete on public.institution_opportunity_submissions
for delete to authenticated using (public.is_kleio_admin());

commit;
