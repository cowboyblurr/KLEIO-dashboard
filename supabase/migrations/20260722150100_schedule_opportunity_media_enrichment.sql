do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'kleio-opportunity-media-weekly';

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'kleio-opportunity-media-weekly',
    '12 7 * * 0',
    $cron$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'kleio_project_url') || '/functions/v1/enrich-opportunity-media',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-kleio-sync-token', (select decrypted_secret from vault.decrypted_secrets where name = 'kleio_opportunity_sync_token')
        ),
        body := '{"source_slugs":["mexico-cultura","ibermusicas"]}'::jsonb,
        timeout_milliseconds := 120000
      );
    $cron$
  );
end;
$$;
