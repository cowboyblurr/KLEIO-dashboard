-- Prevent PostgreSQL from repeatedly inlining query interpretation and candidate
-- calculations across ranking and fallback branches. Production profiling reduced
-- the pottery query from ~2.17 seconds to ~52 milliseconds.

do $$
declare
  definition text;
  target regprocedure := 'public.search_opportunities_v2(text,text[],text[],text[],text,text[],text[],text[],timestamptz,timestamptz,numeric,boolean,boolean,boolean,boolean,integer,integer)'::regprocedure;
begin
  select pg_get_functiondef(target) into definition;

  definition := replace(definition, E'with parsed as (', E'with parsed as materialized (');
  definition := replace(definition, E'  context as (', E'  context as materialized (');
  definition := replace(definition, E'  raw_candidates as (', E'  raw_candidates as materialized (');
  definition := replace(definition, E'  candidates as (', E'  candidates as materialized (');
  definition := replace(definition, E'  availability as (', E'  availability as materialized (');

  execute definition;
end;
$$;
