drop policy if exists "Artists create own opportunity research sessions" on public.opportunity_research_sessions;
create policy "Artists create own opportunity research sessions"
on public.opportunity_research_sessions for insert
to authenticated
with check (
  (select auth.uid()) = artist_user_id
  and exists (
    select 1
    from public.opportunities opportunity_row
    join public.opportunity_sources source_row on source_row.id = opportunity_row.source_id
    where opportunity_row.id = opportunity_research_sessions.opportunity_id
      and opportunity_row.status in ('open','forecasted','upcoming')
      and (opportunity_row.deadline_at is null or opportunity_row.deadline_at >= now())
      and opportunity_row.duplicate_of is null
      and source_row.active
  )
);

drop policy if exists "Artists update own opportunity research sessions" on public.opportunity_research_sessions;
drop policy if exists "Artists delete own queued opportunity research sessions" on public.opportunity_research_sessions;

revoke update, delete on public.opportunity_research_sessions from authenticated;
grant select, insert on public.opportunity_research_sessions to authenticated;
