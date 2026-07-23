do $$
declare
  function_definition text;
begin
  select pg_get_functiondef('public.create_or_resume_opportunity_research(uuid,boolean)'::regprocedure)
    into function_definition;
  function_definition := replace(
    function_definition,
    E'select sent_id into queue_id\n  from pgmq.send(',
    E'queue_id := pgmq.send('
  );
  function_definition := replace(
    function_definition,
    E'\n  ) as sent_id;\n\n  update public.opportunity_research_jobs',
    E'\n  );\n\n  update public.opportunity_research_jobs'
  );
  execute function_definition;

  select pg_get_functiondef('public.fail_opportunity_research_job(uuid,bigint,text,text,boolean,integer)'::regprocedure)
    into function_definition;
  function_definition := replace(
    function_definition,
    E'select sent_id into replacement_message_id\n    from pgmq.send(',
    E'replacement_message_id := pgmq.send('
  );
  function_definition := replace(
    function_definition,
    E'\n    ) as sent_id;\n\n    update public.opportunity_research_jobs',
    E'\n    );\n\n    update public.opportunity_research_jobs'
  );
  execute function_definition;
end;
$$;

revoke all on function public.create_or_resume_opportunity_research(uuid, boolean) from public, anon;
grant execute on function public.create_or_resume_opportunity_research(uuid, boolean) to authenticated;
revoke all on function public.fail_opportunity_research_job(uuid, bigint, text, text, boolean, integer) from public, anon, authenticated;
grant execute on function public.fail_opportunity_research_job(uuid, bigint, text, text, boolean, integer) to service_role;
