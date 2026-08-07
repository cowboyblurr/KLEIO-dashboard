begin;

create or replace function public.claim_my_media_analysis(target_source_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  source_row public.artist_import_sources%rowtype;
begin
  select * into source_row
  from public.artist_import_sources
  where id = target_source_id
    and artist_user_id = (select auth.uid())
    and deleted_at is null
  for update;

  if not found then
    return false;
  end if;

  if source_row.analysis_stage = 'analyzing'
     and source_row.updated_at > now() - interval '4 minutes' then
    return false;
  end if;

  update public.artist_import_sources
  set analysis_stage = 'analyzing',
      last_error_category = '',
      updated_at = now()
  where id = target_source_id
    and artist_user_id = (select auth.uid());

  return true;
end;
$$;

create or replace function public.release_my_media_analysis(target_source_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.artist_import_sources
  set analysis_stage = case when analysis_stage = 'analyzing' then 'review_ready' else analysis_stage end,
      updated_at = now()
  where id = target_source_id
    and artist_user_id = (select auth.uid())
    and deleted_at is null;
end;
$$;

revoke all on function public.claim_my_media_analysis(uuid) from public;
revoke all on function public.claim_my_media_analysis(uuid) from anon;
grant execute on function public.claim_my_media_analysis(uuid) to authenticated;

revoke all on function public.release_my_media_analysis(uuid) from public;
revoke all on function public.release_my_media_analysis(uuid) from anon;
grant execute on function public.release_my_media_analysis(uuid) to authenticated;

comment on function public.claim_my_media_analysis(uuid) is
  'Owner-scoped media-analysis lease. Uses a row lock to prevent duplicate concurrent analysis requests while allowing stale claims to recover after four minutes.';
comment on function public.release_my_media_analysis(uuid) is
  'Owner-scoped release for an artist media-analysis lease after success or failure.';

commit;
