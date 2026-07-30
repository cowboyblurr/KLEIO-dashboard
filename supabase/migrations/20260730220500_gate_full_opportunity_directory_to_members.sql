-- Preserve a deliberately limited public preview while requiring membership
-- for full opportunity search and detail-table access.

-- The public carousel returns a constrained projection and caps results at 12.
-- Run it with owner privileges so anon no longer needs direct table SELECT access.
alter function public.get_public_opportunity_carousel(integer) security definer;
revoke all on function public.get_public_opportunity_carousel(integer) from public;
revoke all on function public.get_public_opportunity_carousel(integer) from anon;
revoke all on function public.get_public_opportunity_carousel(integer) from authenticated;
grant execute on function public.get_public_opportunity_carousel(integer) to anon, authenticated, service_role;

-- Full search RPCs are member-only. Keep authenticated access for existing
-- signed-in clients and service-role access for trusted server processes.
revoke all on function public.search_opportunities(
  text, text[], text[], text[], text, text[], boolean, boolean, integer, integer
) from public;
revoke execute on function public.search_opportunities(
  text, text[], text[], text[], text, text[], boolean, boolean, integer, integer
) from anon;
grant execute on function public.search_opportunities(
  text, text[], text[], text[], text, text[], boolean, boolean, integer, integer
) to authenticated, service_role;

revoke all on function public.search_opportunities_v2(
  text, text[], text[], text[], text, text[], text[], text[], timestamptz, timestamptz,
  numeric, boolean, boolean, boolean, boolean, integer, integer
) from public;
revoke execute on function public.search_opportunities_v2(
  text, text[], text[], text[], text, text[], text[], text[], timestamptz, timestamptz,
  numeric, boolean, boolean, boolean, boolean, integer, integer
) from anon;
grant execute on function public.search_opportunities_v2(
  text, text[], text[], text[], text, text[], text[], text[], timestamptz, timestamptz,
  numeric, boolean, boolean, boolean, boolean, integer, integer
) to authenticated, service_role;

-- Remove signed-out direct access to the records used by the member directory.
drop policy if exists opportunities_anon_read on public.opportunities;
drop policy if exists opportunity_sources_anon_read on public.opportunity_sources;
drop policy if exists opportunity_rules_anon_read on public.opportunity_eligibility_rules;
drop policy if exists opportunity_requirements_anon_read on public.opportunity_requirements;
drop policy if exists opportunity_translations_anon_read on public.opportunity_translations;

revoke all privileges on table public.opportunities from anon;
revoke all privileges on table public.opportunity_sources from anon;
revoke all privileges on table public.opportunity_eligibility_rules from anon;
revoke all privileges on table public.opportunity_requirements from anon;
revoke all privileges on table public.opportunity_translations from anon;
