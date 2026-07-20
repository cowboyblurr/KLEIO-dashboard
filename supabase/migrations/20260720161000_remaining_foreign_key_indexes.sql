create index if not exists open_calls_created_by_idx
  on public.open_calls (created_by);

create index if not exists portfolio_works_artist_user_id_idx
  on public.portfolio_works (artist_user_id);
