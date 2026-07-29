create index if not exists artist_opportunity_evaluations_source_version_idx
  on public.artist_opportunity_evaluations (source_version_id)
  where source_version_id is not null;
