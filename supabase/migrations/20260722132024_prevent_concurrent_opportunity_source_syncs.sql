create unique index if not exists opportunity_import_jobs_one_running_source
on public.opportunity_import_jobs(source_id)
where status = 'running';
