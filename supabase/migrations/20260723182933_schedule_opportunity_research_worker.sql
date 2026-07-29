select cron.schedule(
  'kleio-opportunity-research-worker',
  '* * * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name='kleio_project_url') || '/functions/v1/process-opportunity-research',
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'x-kleio-sync-token',(select decrypted_secret from vault.decrypted_secrets where name='kleio_opportunity_sync_token')
      ),
      body := '{"trigger":"cron"}'::jsonb,
      timeout_milliseconds := 120000
    );
  $$
);
