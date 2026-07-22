begin;

drop policy if exists opportunity_sources_read on public.opportunity_sources;
create policy opportunity_sources_anon_read on public.opportunity_sources
for select to anon using (active);
create policy opportunity_sources_authenticated_read on public.opportunity_sources
for select to authenticated using (active or public.is_kleio_admin());

drop policy if exists opportunities_read on public.opportunities;
create policy opportunities_anon_read on public.opportunities
for select to anon
using (
  status in ('open','forecasted','upcoming')
  and (deadline_at is null or deadline_at >= now())
  and duplicate_of is null
  and exists (
    select 1 from public.opportunity_sources source_row
    where source_row.id = opportunities.source_id and source_row.active
  )
);
create policy opportunities_authenticated_read on public.opportunities
for select to authenticated
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

drop policy if exists opportunity_rules_read on public.opportunity_eligibility_rules;
create policy opportunity_rules_anon_read on public.opportunity_eligibility_rules
for select to anon
using (
  verification_status in ('confirmed','ambiguous')
  and exists (
    select 1 from public.opportunities opportunity_row
    where opportunity_row.id = opportunity_eligibility_rules.opportunity_id
      and opportunity_row.status in ('open','forecasted','upcoming')
      and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
  )
);
create policy opportunity_rules_authenticated_read on public.opportunity_eligibility_rules
for select to authenticated
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

drop policy if exists opportunity_requirements_read on public.opportunity_requirements;
create policy opportunity_requirements_anon_read on public.opportunity_requirements
for select to anon
using (
  verification_status in ('confirmed','ambiguous')
  and exists (
    select 1 from public.opportunities opportunity_row
    where opportunity_row.id = opportunity_requirements.opportunity_id
      and opportunity_row.status in ('open','forecasted','upcoming')
      and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
  )
);
create policy opportunity_requirements_authenticated_read on public.opportunity_requirements
for select to authenticated
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

commit;
