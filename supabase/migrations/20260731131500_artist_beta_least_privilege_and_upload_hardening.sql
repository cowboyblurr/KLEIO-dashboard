-- August 7 artist beta hardening: least privilege and active-content rejection.

-- Anonymous visitors only need the explicitly public read surfaces and the
-- privacy-minimized product-event insert path. RLS continues to constrain the
-- rows available through each retained grant.
do $$
declare
  table_row record;
begin
  for table_row in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format(
      'revoke all privileges on table %I.%I from anon',
      table_row.schemaname,
      table_row.tablename
    );
  end loop;
end
$$;

grant select on table
  public.artistic_taxonomy_aliases,
  public.artistic_taxonomy_terms,
  public.call_questions,
  public.institution_search_index,
  public.open_calls,
  public.opportunity_search_stop_terms,
  public.opportunity_taxonomy_mappings
  to anon;

grant insert on table public.product_events to anon;

-- Data API clients never need schema-management-adjacent table privileges.
do $$
declare
  table_row record;
begin
  for table_row in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format(
      'revoke truncate, references, trigger on table %I.%I from authenticated',
      table_row.schemaname,
      table_row.tablename
    );
  end loop;
end
$$;

-- Draft persistence is authenticated-only even though the function also
-- rejects calls without auth.uid().
revoke all on function public.save_my_artist_draft(
  text,
  text,
  uuid,
  jsonb,
  bigint,
  timestamptz
) from public, anon;

grant execute on function public.save_my_artist_draft(
  text,
  text,
  uuid,
  jsonb,
  bigint,
  timestamptz
) to authenticated, service_role;

-- Reject SVG active content during the initial beta. Raster formats remain
-- supported, and no existing SVG objects are present in this bucket.
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp'
]::text[]
where id = 'institution-logos';
