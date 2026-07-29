do $$
declare
  function_definition text;
begin
  select pg_get_functiondef('public.fail_opportunity_research_job(uuid,bigint,text,text,boolean,integer)'::regprocedure)
    into function_definition;
  function_definition := replace(
    function_definition,
    'coalesce(failure_category,'''')',
    'coalesce($3,'''')'
  );
  execute function_definition;
end;
$$;

revoke all on function public.fail_opportunity_research_job(uuid, bigint, text, text, boolean, integer) from public, anon, authenticated;
grant execute on function public.fail_opportunity_research_job(uuid, bigint, text, text, boolean, integer) to service_role;
