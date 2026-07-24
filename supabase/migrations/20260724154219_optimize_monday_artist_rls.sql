begin;

alter policy applications_artist_select
on public.applications
using (artist_user_id = (select auth.uid()));

alter policy applications_artist_insert
on public.applications
with check (
  artist_user_id = (select auth.uid())
  and exists (
    select 1
    from public.open_calls call_row
    where call_row.id = applications.call_id
      and call_row.status = 'open'::public.open_call_status
  )
);

alter policy applications_artist_update_draft
on public.applications
using (
  artist_user_id = (select auth.uid())
  and status = 'draft'::public.application_status
)
with check (
  artist_user_id = (select auth.uid())
  and status = any (
    array[
      'draft'::public.application_status,
      'submitted'::public.application_status,
      'withdrawn'::public.application_status
    ]
  )
);

alter policy portfolio_works_manage_own
on public.portfolio_works
using (artist_user_id = (select auth.uid()))
with check (artist_user_id = (select auth.uid()));

drop policy if exists saved_opportunities_update_own
on public.saved_opportunities;

commit;
