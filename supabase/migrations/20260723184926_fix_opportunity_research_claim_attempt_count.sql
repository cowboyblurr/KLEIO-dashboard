do $$
declare
  function_definition text;
begin
  select pg_get_functiondef('public.claim_opportunity_research_jobs(integer,integer)'::regprocedure)
    into function_definition;
  function_definition := replace(
    function_definition,
    E'update public.opportunity_research_jobs\n    set status = ''processing'',',
    E'update public.opportunity_research_jobs as research_job\n    set status = ''processing'','
  );
  function_definition := replace(
    function_definition,
    'attempt_count = attempt_count + 1',
    'attempt_count = research_job.attempt_count + 1'
  );
  function_definition := replace(
    function_definition,
    'started_at = coalesce(started_at, now())',
    'started_at = coalesce(research_job.started_at, now())'
  );
  function_definition := replace(
    function_definition,
    'returning * into job_row;',
    'returning research_job.* into job_row;'
  );
  execute function_definition;
end;
$$;

revoke all on function public.claim_opportunity_research_jobs(integer, integer) from public, anon, authenticated;
grant execute on function public.claim_opportunity_research_jobs(integer, integer) to service_role;
