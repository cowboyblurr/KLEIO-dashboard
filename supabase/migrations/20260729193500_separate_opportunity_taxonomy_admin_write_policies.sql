-- Keep public/authenticated SELECT paths singular while preserving admin writes.
-- Splitting INSERT/UPDATE/DELETE avoids redundant permissive SELECT policies.

drop policy if exists artistic_taxonomy_terms_admin_write on public.artistic_taxonomy_terms;
drop policy if exists artistic_taxonomy_aliases_admin_write on public.artistic_taxonomy_aliases;
drop policy if exists opportunity_taxonomy_mappings_admin_write on public.opportunity_taxonomy_mappings;
drop policy if exists opportunity_search_stop_terms_admin_write on public.opportunity_search_stop_terms;

drop policy if exists artistic_taxonomy_terms_admin_insert on public.artistic_taxonomy_terms;
create policy artistic_taxonomy_terms_admin_insert
on public.artistic_taxonomy_terms for insert
to authenticated
with check (private.is_kleio_admin());

drop policy if exists artistic_taxonomy_terms_admin_update on public.artistic_taxonomy_terms;
create policy artistic_taxonomy_terms_admin_update
on public.artistic_taxonomy_terms for update
to authenticated
using (private.is_kleio_admin())
with check (private.is_kleio_admin());

drop policy if exists artistic_taxonomy_terms_admin_delete on public.artistic_taxonomy_terms;
create policy artistic_taxonomy_terms_admin_delete
on public.artistic_taxonomy_terms for delete
to authenticated
using (private.is_kleio_admin());

drop policy if exists artistic_taxonomy_aliases_admin_insert on public.artistic_taxonomy_aliases;
create policy artistic_taxonomy_aliases_admin_insert
on public.artistic_taxonomy_aliases for insert
to authenticated
with check (private.is_kleio_admin());

drop policy if exists artistic_taxonomy_aliases_admin_update on public.artistic_taxonomy_aliases;
create policy artistic_taxonomy_aliases_admin_update
on public.artistic_taxonomy_aliases for update
to authenticated
using (private.is_kleio_admin())
with check (private.is_kleio_admin());

drop policy if exists artistic_taxonomy_aliases_admin_delete on public.artistic_taxonomy_aliases;
create policy artistic_taxonomy_aliases_admin_delete
on public.artistic_taxonomy_aliases for delete
to authenticated
using (private.is_kleio_admin());

drop policy if exists opportunity_taxonomy_mappings_admin_insert on public.opportunity_taxonomy_mappings;
create policy opportunity_taxonomy_mappings_admin_insert
on public.opportunity_taxonomy_mappings for insert
to authenticated
with check (private.is_kleio_admin());

drop policy if exists opportunity_taxonomy_mappings_admin_update on public.opportunity_taxonomy_mappings;
create policy opportunity_taxonomy_mappings_admin_update
on public.opportunity_taxonomy_mappings for update
to authenticated
using (private.is_kleio_admin())
with check (private.is_kleio_admin());

drop policy if exists opportunity_taxonomy_mappings_admin_delete on public.opportunity_taxonomy_mappings;
create policy opportunity_taxonomy_mappings_admin_delete
on public.opportunity_taxonomy_mappings for delete
to authenticated
using (private.is_kleio_admin());

drop policy if exists opportunity_search_stop_terms_admin_insert on public.opportunity_search_stop_terms;
create policy opportunity_search_stop_terms_admin_insert
on public.opportunity_search_stop_terms for insert
to authenticated
with check (private.is_kleio_admin());

drop policy if exists opportunity_search_stop_terms_admin_update on public.opportunity_search_stop_terms;
create policy opportunity_search_stop_terms_admin_update
on public.opportunity_search_stop_terms for update
to authenticated
using (private.is_kleio_admin())
with check (private.is_kleio_admin());

drop policy if exists opportunity_search_stop_terms_admin_delete on public.opportunity_search_stop_terms;
create policy opportunity_search_stop_terms_admin_delete
on public.opportunity_search_stop_terms for delete
to authenticated
using (private.is_kleio_admin());
