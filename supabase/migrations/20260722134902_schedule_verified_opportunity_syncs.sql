begin;

-- The official EU Funding & Tenders source is registered but not public while
-- the upstream API terminates requests from both tested server-side transports.
update public.opportunity_sources
set active = false,
    updated_at = now()
where slug = 'eu-funding-tenders';

create or replace function public.expire_stale_opportunities()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  update public.opportunities
  set status = 'expired',
      verification_status = 'expired',
      updated_at = now()
  where status in ('open','forecasted','upcoming')
    and deadline_at is not null
    and deadline_at < now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.expire_stale_opportunities() from public, anon, authenticated;
grant execute on function public.expire_stale_opportunities() to service_role;

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname = 'kleio-grants-gov-daily';
  if existing_job is not null then perform cron.unschedule(existing_job); end if;

  select jobid into existing_job from cron.job where jobname = 'kleio-opportunity-expiry-daily';
  if existing_job is not null then perform cron.unschedule(existing_job); end if;

  perform cron.schedule(
    'kleio-grants-gov-daily',
    '17 5 * * *',
    $cron$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'kleio_project_url') || '/functions/v1/sync-opportunities',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-kleio-sync-token', (select decrypted_secret from vault.decrypted_secrets where name = 'kleio_opportunity_sync_token')
        ),
        body := '{"source":"grants-gov"}'::jsonb,
        timeout_milliseconds := 120000
      );
    $cron$
  );

  perform cron.schedule(
    'kleio-opportunity-expiry-daily',
    '42 5 * * *',
    'select public.expire_stale_opportunities();'
  );
end;
$$;

commit;
