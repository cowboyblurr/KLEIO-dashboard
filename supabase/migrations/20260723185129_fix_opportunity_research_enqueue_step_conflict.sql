do $$
declare
  function_definition text;
begin
  select pg_get_functiondef('public.create_or_resume_opportunity_research(uuid,boolean)'::regprocedure)
    into function_definition;
  function_definition := replace(
    function_definition,
    'on conflict (session_id, step_key) do nothing',
    'on conflict on constraint opportunity_research_steps_session_id_step_key_key do nothing'
  );
  execute function_definition;
end;
$$;

revoke all on function public.create_or_resume_opportunity_research(uuid, boolean) from public, anon;
grant execute on function public.create_or_resume_opportunity_research(uuid, boolean) to authenticated;
