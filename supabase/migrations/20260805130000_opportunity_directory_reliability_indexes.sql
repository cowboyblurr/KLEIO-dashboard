begin;

create index if not exists artist_hidden_opportunities_opportunity_idx
  on public.artist_hidden_opportunities (opportunity_id);

create index if not exists opportunity_reports_resolved_by_idx
  on public.opportunity_reports (resolved_by)
  where resolved_by is not null;

create index if not exists opportunity_review_audit_actor_idx
  on public.opportunity_review_audit (actor_user_id)
  where actor_user_id is not null;

commit;
