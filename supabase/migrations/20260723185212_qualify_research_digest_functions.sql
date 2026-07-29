do $$
declare
  function_definition text;
begin
  select pg_get_functiondef('public.create_or_resume_opportunity_research(uuid,boolean)'::regprocedure)
    into function_definition;
  function_definition := replace(
    function_definition,
    'encode(digest(',
    'pg_catalog.encode(extensions.digest('
  );
  execute function_definition;

  select pg_get_functiondef('public.promote_candidate_requirement_to_canonical(uuid,text)'::regprocedure)
    into function_definition;
  function_definition := replace(
    function_definition,
    'encode(digest(',
    'pg_catalog.encode(extensions.digest('
  );
  execute function_definition;
end;
$$;

revoke all on function public.create_or_resume_opportunity_research(uuid, boolean) from public, anon;
grant execute on function public.create_or_resume_opportunity_research(uuid, boolean) to authenticated;
revoke all on function public.promote_candidate_requirement_to_canonical(uuid, text) from public, anon, authenticated;
grant execute on function public.promote_candidate_requirement_to_canonical(uuid, text) to service_role;
